import { GoogleGenAI, type LiveServerMessage, type Session } from '@google/genai';
import { decodePcm16Base64, encodePcm16Base64 } from '../audio/pcm';
import { mintLiveToken } from './api';
import type { TranscriptTurn } from './report';

/**
 * The browser half of the Gemini Live pipeline (ticket 013): open the `BidiGenerateContent`
 * WebSocket with a backend-minted ephemeral token, play the interviewer's native audio, capture the
 * candidate's held-to-record answer as 16 kHz PCM, and take both sides' transcription for free. A
 * dropped connection reconnects via a session-resumption handle without the candidate noticing.
 *
 * Everything the interviewer *is* — persona, protocol, opening — lives server-side, locked into the
 * token (interviewer.ts). This class carries no prompt; it only moves audio and text over the wire.
 */

/** The Live socket's fixed sample rates: 16 kHz PCM up, 24 kHz native audio down (ticket 013). */
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
/** ScriptProcessor frame size — small enough to stream smoothly, large enough to stay cheap. */
const CAPTURE_BUFFER_SIZE = 4096;
/** How many times to silently re-open a dropped connection before surfacing an error. */
const MAX_RECONNECTS = 3;
/**
 * The function the interviewer calls to close the session on its own (ticket 014 §5.4). Must match
 * `END_INTERVIEW_TOOL` in the server's interviewer.ts — server and client are separate packages, so
 * like the report contract it's duplicated across the boundary rather than imported.
 */
const END_INTERVIEW_TOOL = 'end_interview';

export interface LiveSessionCallbacks {
  /** The interviewer's just-finished turn, as text, to pin on screen (Variant A, ticket 017). */
  onInterviewerTurn: (text: string) => void;
  /** Live mic loudness in [0, 1] for the level meter, emitted while the candidate answers. */
  onLevel: (level: number) => void;
  /** True once connected and the interviewer is engaged; false while (re)connecting. */
  onConnectedChange: (connected: boolean) => void;
  /** A held answer was cut short by a connection drop — the UI must leave its recording state. */
  onAnsweringInterrupted: () => void;
  /** The interviewer closed the interview itself; the accumulated transcript is ready for the report. */
  onEnded: (transcript: TranscriptTurn[]) => void;
  /** A fatal error the session couldn't recover from (e.g. reconnects exhausted). */
  onError: (message: string) => void;
}

export class LiveSession {
  private readonly callbacks: LiveSessionCallbacks;

  private session?: Session;
  private inputContext?: AudioContext;
  private outputContext?: AudioContext;
  private micStream?: MediaStream;
  private processor?: ScriptProcessorNode;
  private micSource?: MediaStreamAudioSourceNode;

  /** Accumulated per-turn transcription, flushed into `transcript` on each turn boundary. */
  private pendingCandidate = '';
  private pendingInterviewer = '';
  private readonly transcript: TranscriptTurn[] = [];

  /** Set true only while the candidate holds the answer button, gating what we stream up. */
  private answering = false;

  /** Playback scheduling: when the next queued interviewer chunk should start. */
  private playheadTime = 0;
  private readonly scheduledSources = new Set<AudioBufferSourceNode>();
  /** The current interviewer turn's audio, kept whole so the ▶ replay button can replay it. */
  private currentTurnChunks: Float32Array[] = [];
  private lastTurnAudio?: Float32Array;

  /** Reconnection state (ticket 013 — invisible resumption). */
  private seedId?: string;
  private resumptionHandle?: string;
  private reconnects = 0;
  private reconnecting = false;
  private closed = false;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
  }

  /** Acquire the mic, mint a token, and open the Live session. Throws if either setup step fails. */
  async start(): Promise<void> {
    // Mic permission is granted here (on Start), before the socket — a denial should fail loudly,
    // not mid-interview. Mono capture keeps the mixdown out of our hands.
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    this.inputContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    this.outputContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    this.wireCapture();

    await this.connect();
  }

  /** Candidate pressed and holds "answer": mark the turn open and start streaming mic audio up. */
  beginAnswer(): void {
    if (this.answering || !this.session) return;
    // Any interviewer audio still playing should stop the moment the candidate starts talking.
    this.stopPlayback();
    this.answering = true;
    void this.inputContext?.resume();
    // Manual activity detection (VAD is disabled in the locked config): the client owns turn edges.
    this.session.sendRealtimeInput({ activityStart: {} });
  }

  /** Candidate released "answer": close the turn so the interviewer starts formulating its reply. */
  endAnswer(): void {
    if (!this.answering || !this.session) return;
    this.answering = false;
    this.callbacks.onLevel(0);
    this.session.sendRealtimeInput({ activityEnd: {} });
  }

  /** Replay the interviewer's last turn (the ▶ replay affordance, ticket 017 §3). */
  replay(): void {
    if (this.lastTurnAudio && this.outputContext) {
      this.schedule(this.lastTurnAudio);
    }
  }

  /**
   * End the interview from the candidate's side (the "end early" escape hatch, or a reset): close the
   * socket, release the mic, and hand back the full transcript for the report call (ticket 015).
   * Idempotent — safe to call more than once, or after the interviewer already closed.
   */
  end(): TranscriptTurn[] {
    this.closed = true;
    this.flushTurns();
    this.teardown();
    return this.transcript;
  }

  /** The interviewer called end_interview: finalize the transcript and notify the hook (ticket 014). */
  private endFromInterviewer(): void {
    if (this.closed) return;
    this.closed = true;
    this.flushTurns();
    // The tool call lands right after the closing line's audio, so let that audio finish before we
    // cut it and hand off — otherwise the interviewer's goodbye is chopped off mid-sentence.
    const drainMs = Math.max(
      0,
      (this.playheadTime - (this.outputContext?.currentTime ?? 0)) * 1000,
    );
    window.setTimeout(() => {
      this.teardown();
      this.callbacks.onEnded(this.transcript);
    }, drainMs);
  }

  // --- Connection ------------------------------------------------------------------------------

  private async connect(): Promise<void> {
    this.callbacks.onConnectedChange(false);
    const { token, model, seedId } = await mintLiveToken(this.seedId);
    this.seedId = seedId;

    // The browser authenticates with the ephemeral token, not the API key (which stays server-side).
    // v1alpha is the API surface the Live/ephemeral-token features live on.
    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });

    this.session = await ai.live.connect({
      model,
      // The persona/voice/transcription config is locked into the token. Session resumption is the
      // one field the client owns: enable it on every connect, and on a reconnect pass the handle so
      // the server restores the conversation exactly where it dropped (ticket 013).
      config: {
        sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {},
      },
      callbacks: {
        onopen: () => {
          this.reconnects = 0;
          this.reconnecting = false;
          this.callbacks.onConnectedChange(true);
        },
        onmessage: (message) => this.handleMessage(message),
        onerror: (event) => this.handleDrop(event.message || 'Live connection error.'),
        onclose: () => this.handleDrop('Live connection closed.'),
      },
    });

    // A Live model stays silent until it gets input, so on a *fresh* session nudge the interviewer
    // to deliver its (systemInstruction-seeded) opening turn. This text is model context only — it's
    // never transcribed, so it doesn't reach the transcript. A reconnect (handle set) already has a
    // conversation in flight and must not be nudged again.
    if (!this.resumptionHandle) {
      this.session.sendClientContent({ turns: 'Please begin the interview.', turnComplete: true });
    }
  }

  /** The socket errored or closed unexpectedly — reconnect unless a reconnect is already underway. */
  private handleDrop(reason: string): void {
    if (this.closed || this.reconnecting) return;
    this.reconnect(reason);
  }

  /**
   * Reconnect and restore the conversation from the resumption handle (ticket 013 — invisible
   * reconnection). Driven both reactively (a drop) and proactively: a `goAway` warns before the
   * server closes the socket, so we reconnect on the warning rather than waiting for the gap.
   * Gives up — surfacing an error — once the retry budget is spent or there's no handle to resume.
   */
  private reconnect(reason: string): void {
    if (this.closed || this.reconnecting) return;

    if (!this.resumptionHandle || this.reconnects >= MAX_RECONNECTS) {
      this.closed = true;
      this.teardown();
      this.callbacks.onError(`The interview connection was lost. ${reason}`);
      return;
    }

    this.reconnecting = true;
    this.reconnects += 1;
    // A held answer can't survive the reconnect, so drop it and tell the UI to leave its recording
    // state — otherwise it stays stuck on "release when done" over a dead socket.
    if (this.answering) {
      this.answering = false;
      this.callbacks.onAnsweringInterrupted();
    }
    this.callbacks.onConnectedChange(false);
    // Close the old socket now; its late onclose is ignored because `reconnecting` is set.
    this.session?.close();
    this.session = undefined;

    this.connect().catch((error: unknown) => {
      this.closed = true;
      this.teardown();
      const detail = error instanceof Error ? error.message : String(error);
      this.callbacks.onError(`Couldn't reconnect to the interview: ${detail}`);
    });
  }

  // --- Incoming messages -----------------------------------------------------------------------

  private handleMessage(message: LiveServerMessage): void {
    // Once we've closed (interviewer wrapped up, draining its goodbye), ignore trailing messages.
    if (this.closed) return;

    // A newer handle supersedes the last; keep the freshest so a reconnect resumes as late as possible.
    const handle = message.sessionResumptionUpdate?.newHandle;
    if (handle) this.resumptionHandle = handle;

    // The server warns before it drops the socket; reconnect on the warning to hide the gap.
    if (message.goAway) {
      this.reconnect('the server signalled the connection will close');
      return;
    }

    // The interviewer decided to close (ticket 014 §5.4) — end the session and hand off the report.
    if (message.toolCall?.functionCalls?.some((call) => call.name === END_INTERVIEW_TOOL)) {
      this.endFromInterviewer();
      return;
    }

    const content = message.serverContent;
    if (!content) return;

    if (content.interrupted) this.stopPlayback();

    // Both transcriptions arrive as fragments, independent of the audio; accumulate per speaker.
    const inputText = content.inputTranscription?.text;
    if (inputText) this.pendingCandidate += inputText;
    const outputText = content.outputTranscription?.text;
    if (outputText) this.pendingInterviewer += outputText;

    // Play the interviewer's native-audio parts as they stream in.
    for (const part of content.modelTurn?.parts ?? []) {
      const data = part.inlineData?.data;
      if (data) this.enqueuePlayback(data);
    }

    if (content.turnComplete) this.flushTurns();
  }

  /**
   * Close out a turn cycle. A cycle is [candidate answer?] then [interviewer reply], so flushing in
   * that order keeps the transcript chronological (the opening turn has no candidate half).
   */
  private flushTurns(): void {
    if (this.pendingCandidate.trim()) {
      this.transcript.push({ speaker: 'candidate', text: this.pendingCandidate.trim() });
      this.pendingCandidate = '';
    }
    if (this.pendingInterviewer.trim()) {
      const text = this.pendingInterviewer.trim();
      this.transcript.push({ speaker: 'interviewer', text });
      this.pendingInterviewer = '';
      this.callbacks.onInterviewerTurn(text);
    }
    // The interviewer's turn is complete, so freeze its audio for replay and start a fresh buffer.
    if (this.currentTurnChunks.length) {
      this.lastTurnAudio = concatFloat32(this.currentTurnChunks);
      this.currentTurnChunks = [];
    }
  }

  // --- Playback --------------------------------------------------------------------------------

  private enqueuePlayback(base64: string): void {
    const samples = decodePcm16Base64(base64);
    this.currentTurnChunks.push(samples);
    this.schedule(samples);
  }

  /** Schedule one PCM chunk to play immediately after whatever is already queued (gapless). */
  private schedule(samples: Float32Array): void {
    const context = this.outputContext;
    if (!context || samples.length === 0) return;

    const buffer = context.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startAt = Math.max(context.currentTime, this.playheadTime);
    source.start(startAt);
    this.playheadTime = startAt + buffer.duration;

    this.scheduledSources.add(source);
    source.onended = () => this.scheduledSources.delete(source);
  }

  /** Stop and drop everything currently queued — on barge-in (interrupt) or when a turn is cut off. */
  private stopPlayback(): void {
    for (const source of this.scheduledSources) {
      source.onended = null;
      source.stop();
    }
    this.scheduledSources.clear();
    this.playheadTime = this.outputContext?.currentTime ?? 0;
  }

  // --- Mic capture -----------------------------------------------------------------------------

  private wireCapture(): void {
    const context = this.inputContext;
    const stream = this.micStream;
    if (!context || !stream) return;

    this.micSource = context.createMediaStreamSource(stream);
    // ScriptProcessorNode is deprecated but dependency-free; an AudioWorklet needs a separate module
    // file, which isn't worth it for a single mono capture tap on a personal tool.
    this.processor = context.createScriptProcessor(CAPTURE_BUFFER_SIZE, 1, 1);
    this.processor.onaudioprocess = (event) => {
      if (!this.answering || !this.session) return;
      const frame = event.inputBuffer.getChannelData(0);
      this.callbacks.onLevel(rms(frame));
      this.session.sendRealtimeInput({
        audio: { data: encodePcm16Base64(frame), mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` },
      });
    };

    // The processor writes no output, so routing it to the destination just keeps the node running
    // (the browser only fires onaudioprocess while it's connected) — it never echoes the mic back.
    this.micSource.connect(this.processor);
    this.processor.connect(context.destination);
  }

  private teardown(): void {
    this.stopPlayback();
    this.session?.close();
    this.session = undefined;
    if (this.processor) this.processor.onaudioprocess = null;
    this.processor?.disconnect();
    this.micSource?.disconnect();
    for (const track of this.micStream?.getTracks() ?? []) track.stop();
    void this.inputContext?.close();
    void this.outputContext?.close();
  }
}

/** Root-mean-square loudness of a frame, in [0, 1] — a cheap, steady level for the meter. */
function rms(frame: Float32Array): number {
  let sum = 0;
  for (const sample of frame) sum += sample * sample;
  return Math.min(1, Math.sqrt(sum / frame.length));
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((n, chunk) => n + chunk.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
