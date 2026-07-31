# Decide browser-audio → Gemini-accepted format strategy

- Type: wayfinder:grilling
- Status: closed
- Assignee: Diogo Vaz
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

MediaRecorder's default output (WebM/Opus in Chrome, OGG/Opus in Firefox) is **not** on
Gemini's supported-format list (WAV, MP3, AIFF, AAC, OGG Vorbis, FLAC). Decide how the
recorded answer reaches a supported format before the Gemini call:

- **Client-side WAV encoding** — capture PCM via Web Audio API / a small lib and emit WAV.
  Lossless, no server dependency, but larger payload.
- **Server-side transcode** — accept whatever the browser sends, transcode to MP3/WAV with
  ffmpeg on the backend. Keeps the client dumb; adds a server dependency.
- **Lean on Safari's AAC** / per-browser `mimeType` selection — fragile across browsers.

Weigh payload size (20 MB inline limit) vs dependencies vs cross-browser reliability.

Surfaced by ticket 001 research; see [wayfinder/research/gemini-audio.md](../research/gemini-audio.md).

Deliverable: the chosen format strategy, recorded in the ticket answer.

## Answer

**Strategy: client-side conversion to WAV via decode-then-encode.** Do all format work in
the browser and send a Gemini-accepted WAV; the server stays a thin proxy (no ffmpeg, no
system deps). Chosen over server-side transcode (adds an ffmpeg system binary — heavier
deploy for a personal tool) and per-browser `mimeType` selection (explicitly fragile).

### Pipeline

1. **Record** with `MediaRecorder` using its browser-default codec — no `mimeType` coercion.
2. On stop, decode the recorded blob with `AudioContext.decodeAudioData()`. This transparently
   handles every browser's default container/codec (Chrome WebM/Opus, Firefox OGG/Opus,
   Safari MP4/AAC) — normalizing away the exact cross-browser codec differences that opened
   this ticket.
3. **Resample + mixdown** by rendering the decoded buffer through a **mono, 16 kHz
   `OfflineAudioContext`**.
4. **Encode** that buffer to WAV with a **hand-rolled, dependency-free encoder** (~30 lines:
   clamp Float32 PCM to 16-bit ints + prepend the 44-byte RIFF/WAVE header). No library —
   the drop-in libs (`audiobuffer-to-wav`, `wav-encoder`) only replace the header-writing
   step, not the resampling, and aren't worth a supply-chain entry for a personal slice.
5. Base64-encode and send **inline** to the existing server route → Gemini (per ticket 001).

### Format parameters

**Mono / 16 kHz / 16-bit PCM.** Matches Gemini's internal downsample resolution (richer audio
is bytes the model discards); one speaker needs no second channel; 16-bit is standard WAV depth
with no perceptible speech-quality loss. Yields ~32 KB/s → a 3-min answer ≈ **5.8 MB**,
comfortably inside the 20 MB inline limit alongside the prompt.

### Browser scope

Built **browser-agnostic by construction** — `getUserMedia` + `MediaRecorder` +
`decodeAudioData` + `OfflineAudioContext` are all current-Chrome/Firefox/Safari, and no
per-browser branches are written. For the slice: **verify on Chrome**; other browsers are
"should work, untested" (cross-browser QA is post-slice polish, not pipeline de-risking).

### Impact

- Unblocks ticket 006 (build the vertical slice) — step 2 "record in the browser" now carries
  this decode→resample→WAV encode step before the server call.
- No new fog opened; no scope change.
