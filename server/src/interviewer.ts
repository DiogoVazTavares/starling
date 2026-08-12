/**
 * The interviewer's "brain" for the seniority mode's live conversation (tickets 013 + 014 + 016).
 *
 * This lives server-side on purpose — the persona/protocol is the mode's IP, and the same
 * prompts-stay-on-the-server split the behavioral mode uses (SYSTEM_INSTRUCTION in rubric.ts /
 * seniority-rubric.ts). The browser never sees it: it's locked into the ephemeral token's
 * `liveConnectConstraints` (index.ts), so the client connects with just a model id and callbacks.
 *
 * Ticket 014 pins the persona and the turn-by-turn protocol; ticket 016 supplies the opening-seed
 * bank. A session is seeded by exactly one opening; persona, protocol, and voice stay constant.
 */

import type { LiveConnectConfig } from '@google/genai';
import { Modality } from '@google/genai';
import { getClient } from './gemini.ts';

/**
 * The live model is a different family from the behavioral mode's `gemini-3.6-flash` batch pin —
 * native-audio Live models are a distinct, `-preview` tier (ticket 013's model discrepancy). It is
 * exact-pinned here and the SDK is exact-pinned in package.json, per ticket 009's discipline.
 *
 * ⚠️ BUILD-TIME RECHECK (ticket 013 acceptance criteria): `-preview` model ids churn. Before a
 * release, re-confirm this id against https://ai.google.dev/gemini-api/docs/models — a GA live
 * model may exist by then. Documented fallback: `gemini-2.5-flash-native-audio-preview-12-2025`.
 */
export const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL ?? 'gemini-3.1-flash-live-preview';

/**
 * A prebuilt voice matched to the persona — warm, unhurried, an engineering manager two levels up
 * (ticket 014 §1). Overridable so the voice can be tuned without a code change.
 */
export const INTERVIEWER_VOICE = process.env.GEMINI_LIVE_VOICE ?? 'Kore';

export interface Seed {
  id: string;
  /** The kind of story the opening invites — the organizing axis of the bank (ticket 016). */
  storyKind: string;
  /** The single semantic opening prompt woven into the interviewer's systemInstruction. */
  opening: string;
}

/**
 * The opening-scenario seed bank (ticket 016). Moved here from the client: it's systemInstruction
 * material, so it belongs with the persona/protocol it seeds, and keeping it server-side means the
 * browser is handed only an opaque seed id (for reconnection continuity), never the prompt text.
 *
 * Each seed's `// provokes:` comment is an author-time audit trail (ticket 012's frame/anti-signal
 * tags) — never read at runtime. Frames are still deployed adaptively on live evidence by the
 * protocol below, never fired by the seed itself.
 */
export const SEED_BANK: Seed[] = [
  {
    id: 'proud-of',
    storyKind: 'a piece of work you are proud of',
    // provokes: F3 small-scope, F6 false-modesty, A2 hedging. The widest seed — what the candidate
    // reaches for first, unprompted, locates their default tier-reach.
    opening:
      "Open by inviting the candidate to talk about a piece of work they're genuinely proud of. " +
      'Keep the invitation as open as possible — no hint of scale, team size, or timeframe — so ' +
      'whatever they reach for first is unprompted signal.',
  },
  {
    id: 'disagreement',
    storyKind: 'a disagreement',
    // provokes: F1 order-taker, F2 bystander; A1 we-not-I on who actually drove the push-back.
    opening:
      'Ask about a time the candidate disagreed with a decision that had already been made, and ' +
      'invite them to walk through what they actually did about it — not just that they disagreed.',
  },
  {
    id: 'went-wrong',
    storyKind: 'something that went wrong',
    // provokes: A4 passivity, A1 we-not-I (blame diffusion), A3 unquantified, F4 luck/circumstance.
    opening:
      "Ask about something the candidate owned that didn't go according to plan, and invite the " +
      'full arc: what happened, what they did once it started going sideways, and how it landed.',
  },
  {
    id: 'ambiguous',
    storyKind: 'an ambiguous situation, no clear direction',
    // provokes: F5 too-junior; tests unprompted Tier-3 evidence; A4 passivity.
    opening:
      'Ask about a time the candidate had to move forward on something ambiguous — no clear ' +
      'direction, no obvious owner — and invite how they figured out what to do, without hinting ' +
      'at what level of the organization was involved.',
  },
  {
    id: 'changed-how',
    storyKind: 'changing how something was done',
    // provokes: F3 small-scope, F5 too-junior — surfacing leadership evidence unprompted.
    opening:
      'Ask about a time the candidate changed how their team or organization did something — ' +
      "something that didn't work that way before they got involved — and invite the story " +
      'without hinting at scale, so any leadership evidence has to surface on its own.',
  },
];

/** Pick a random opening seed for a fresh session (ticket 016 — no menu, no difficulty). */
export function pickSeed(): Seed {
  return SEED_BANK[Math.floor(Math.random() * SEED_BANK.length)];
}

/**
 * Resolve a seed id back to its seed. Used on reconnection: the client hands back the id it was
 * given at session start so the resumed session rebuilds the *same* systemInstruction (ticket 013's
 * invisible reconnection). Unknown ids fall back to a random seed rather than failing the mint.
 */
export function seedById(id: string | undefined): Seed {
  return SEED_BANK.find((seed) => seed.id === id) ?? pickSeed();
}

/**
 * The interviewer persona + conversation protocol (ticket 014), with the chosen opening woven in.
 * This is the Live session's `systemInstruction`, set once and held server-side for the connection
 * — no per-turn re-priming, which is what keeps the persona from drifting (ticket 013).
 */
export function buildInterviewerSystemInstruction(seed: Seed): string {
  return `You are Maya Okonjo, an engineering manager running a ~25-minute culture-fit / seniority screen with a candidate who reports roughly two levels below you. You are speaking out loud in a live voice conversation, not writing. Keep your turns short and conversational — one or two sentences, the way a real interviewer talks. Never narrate stage directions or your own reasoning; just speak as Maya.

PERSONA. Warm, curious, unhurried. The pressure you apply comes entirely from specificity and gentle disbelief — "who actually decided that?", "say more about that" — never from hostility. You are not a stress interviewer. The two failure modes to avoid are being a caricature (too hostile, piling on) and being a pushover (never probing). Warm-but-specific is the line between them.

WHAT YOU ARE LISTENING FOR (never say any of this out loud — it is your hidden read only). Three tiers of leadership scope, judged by behaviour in the story, never by title or years:
- Lead Self — owns their own outcomes and standards; reliable under pressure; drives their own growth.
- Lead Others — shapes or influences a team; mentors; pushes back on direction; drives scope beyond assigned tickets.
- Lead the Business — moves org-level outcomes; navigates ambiguity and strategy; connects work to why it matters commercially.
For each tier you privately track whether evidence is absent, merely claimed/second-hand/hypothetical (emerging), or a specific first-person owned instance with a real situation, action and outcome (demonstrated). Hold this tier-profile running, turn by turn — you aim your probes and frames by it, live.

HOW YOU PROBE.
- What the candidate reaches for first is signal — a ticket-level opening vs a team-level one locates their starting tier before you probe at all.
- Separate "Lead Self" from "Lead Others" by probing the ORIGIN of the work: "who decided this was worth a quarter?" Collective or passive phrasing cannot answer "who decided", so it forces a real subject.
- Insist on specificity, not on a frame. When an answer is thin, follow the crack toward an owned, first-person, quantified instance — e.g. "was there a version of the plan you argued against?", phrased so a "no" is honest and a "yes" is a real story.
- Once a tier reads demonstrated, pivot off it — stop mining evidence you already have and reach for the next tier up (or down), without ever naming the tier.

DIMINISHING FRAMES (your signature move). Occasionally offer the candidate a framing that quietly shrinks them below their real scope — but always as a WARM, GENEROUS SUMMARY they will want to agree with, never as an attack. Examples of the six families:
- Order-taker: "so you mostly executed what your lead decided?"
- Bystander: "the team drove that, and you were along for it?"
- Small-scope: "that was a fairly contained, low-stakes piece, right?"
- Luck: "sounds like it mostly worked out on its own — good timing?"
- Too-junior: "at your level you wouldn't have been in that room anyway, right?"
- False-modesty: a warm nudge to downplay ("I'm sure it wasn't a big deal").
Rules for frames:
- Aim a frame at a tier that read STRONG (to pressure-test whether the evidence is really owned) or at a tier that read ABSENT (a last-chance prompt to surface forgotten evidence).
- Offer any given frame at most twice, then drop it for good. A third push is the caricature failure mode.
- If the candidate fully folds — accepts the frame and offers nothing to chase — DROP it and pivot warmly to new ground. Do not hold a second door open or circle back. Their fold is never corrected in conversation.
- The register never hardens. No escalation.

ACKNOWLEDGEMENT. When the candidate lands a real reframe or surfaces owned evidence, give one short, in-character line ("that's the kind of call I was fishing for") — then move on. Never a score, never coaching, never "that's Lead Others". Scoring out loud would ruin the screen.

NEVER, in conversation: name a tier, name a frame, name an anti-signal, give a score, give feedback, or say whether they did well. The interview is realistic; the report they get afterwards is the teacher. Stay fully in character until you close.

STRUCTURE AND ENDING. Open wide, probe for specificity, hand a frame or two aimed by live evidence, insist on specificity not the frame, acknowledge a landed reframe, pivot across tiers, then close. Keep finding new ground — a different piece of work — until you have covered roughly six or more substantive turns; do not wrap up the moment the three tiers are merely touched (a candidate who folds everything would otherwise get the shortest interview and the thinnest report, which is backwards). You are on a ~15-minute clock: as you approach it, move to close naturally and in character ("we're coming up on time, so last thing…"). When you close, do it on your own initiative, warmly, with NO verdict — thank them and end. Do not wait to be dismissed.

YOUR OPENING TURN. ${seed.opening}`;
}

/**
 * The full Live session configuration, locked into the ephemeral token so the browser inherits it
 * without ever seeing the systemInstruction (ticket 013's thin-backend / direct-connect topology).
 *
 * - AUDIO out with a persona-matched prebuilt voice (native speech, ticket 013).
 * - Input + output transcription on, so both sides come back as text per turn for free — the
 *   transcript the 015 report scores against (ticket 013).
 * - Manual activity detection (automatic VAD disabled): the candidate holds-to-answer, so the
 *   client marks turn boundaries explicitly with activityStart/activityEnd (Variant A, ticket 017).
 * - Context-window compression on, so a talkative session can push past the ~15-min audio cap.
 *
 * Session resumption is deliberately *not* locked here: the client enables it and supplies the
 * resumption handle at connect time (liveSession.ts), so a reconnect can restore state exactly
 * where it dropped without fighting a locked-in empty handle (ticket 013 — invisible reconnection).
 */
export function buildLiveConnectConfig(seed: Seed): LiveConnectConfig {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: buildInterviewerSystemInstruction(seed),
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: INTERVIEWER_VOICE } },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    realtimeInputConfig: {
      // Hold-to-answer means the client owns turn boundaries; don't let the server guess them.
      automaticActivityDetection: { disabled: true },
    },
    contextWindowCompression: { slidingWindow: {} },
  };
}

/** How long, from minting, the token can keep opening/resuming Live sessions. */
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;

export interface LiveToken {
  /** The ephemeral token the browser authenticates the Live WebSocket with. */
  token: string;
  /** The model the token is locked to — the client passes it straight back to `live.connect`. */
  model: string;
  /** The chosen seed's id, echoed so the client can request the same one on reconnection. */
  seedId: string;
  /** ISO timestamp after which the token stops opening sessions. */
  expiresAt: string;
}

/**
 * Mint a short-lived, single-use ephemeral token with the whole Live config locked in, so the
 * browser opens the Live WebSocket directly (ticket 013 — the backend stays thin, mints and is
 * done, never relays audio). Pass a `seedId` to resume the same scenario on reconnection; omit it
 * to start a fresh random session.
 *
 * The token stays usable for ~30 minutes: within that window the client reconnects via session
 * resumption without spending the single use (resuming doesn't count as a use, per the SDK), which
 * is what keeps a dropped connection invisible even though each connect needs a token.
 */
export async function mintLiveToken(seedId?: string): Promise<LiveToken> {
  const seed = seedById(seedId);
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();

  const token = await getClient().authTokens.create({
    config: {
      expireTime: expiresAt,
      // The token is reused for every resumption within its lifetime, so allow unlimited uses
      // rather than one — a mid-session reconnect must not be refused for exhausting the token.
      uses: 0,
      liveConnectConstraints: {
        model: LIVE_MODEL,
        config: buildLiveConnectConfig(seed),
      },
    },
  });

  if (!token.name) {
    throw new Error('Gemini returned an ephemeral token with no name.');
  }

  return { token: token.name, model: LIVE_MODEL, seedId: seed.id, expiresAt };
}
