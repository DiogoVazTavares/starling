/**
 * MediaRecorder's default output (WebM/Opus in Chrome) isn't a format Gemini accepts, so the
 * browser converts it: decode → resample to mono 16 kHz → 16-bit WAV → base64.
 *
 * Source of truth: wayfinder/tickets/007-audio-format-strategy.md. There are deliberately no
 * per-browser branches — `decodeAudioData` absorbs each browser's default codec.
 */

import { TARGET_SAMPLE_RATE, encodeWav16BitPcm } from './wav-encoder';

export class EmptyRecordingError extends Error {}

export async function toMono16kWavBase64(recorded: Blob): Promise<string> {
  const decoded = await decode(recorded);
  const mono16k = await resampleToMono16k(decoded);
  return toBase64(encodeWav16BitPcm(mono16k.getChannelData(0)));
}

async function decode(recorded: Blob): Promise<AudioBuffer> {
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(await recorded.arrayBuffer());
  } finally {
    void context.close();
  }
}

async function resampleToMono16k(decoded: AudioBuffer): Promise<AudioBuffer> {
  const frames = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE);
  if (frames < 1) {
    throw new EmptyRecordingError("That recording came out empty — there's nothing to send.");
  }

  // A mono destination makes the OfflineAudioContext do the channel mixdown for us.
  const offline = new OfflineAudioContext({
    numberOfChannels: 1,
    length: frames,
    sampleRate: TARGET_SAMPLE_RATE,
  });

  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();

  return offline.startRendering();
}

function toBase64(bytes: Uint8Array): string {
  // Chunked, because spreading megabytes of samples into fromCharCode blows the call stack.
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}
