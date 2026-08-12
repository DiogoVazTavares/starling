/**
 * Raw PCM <-> base64 for the Gemini Live pipeline (ticket 013). The Live socket speaks 16-bit
 * little-endian PCM both ways — the candidate's mic goes up as 16 kHz chunks, the interviewer's
 * native audio comes down at 24 kHz — but the byte format is identical on both legs, so these two
 * pure converters handle it. Sample rate lives with the AudioContext that produces/consumes the
 * samples, never here; that keeps this module free of the browser and unit-testable (pcm.test.ts).
 *
 * The one-shot behavioral mode ships a finished WAV over HTTP (wav.ts); this streams headerless PCM
 * over a socket, so the two audio paths deliberately share no code.
 */

// Spreading megabytes of samples into String.fromCharCode(...) blows the call stack, so both
// directions walk the bytes in bounded chunks.
const CHUNK_SIZE = 0x8000;

/** Float32 samples in [-1, 1] -> base64 of 16-bit little-endian PCM. Out-of-range samples clamp. */
export function encodePcm16Base64(samples: Float32Array): string {
  const pcm = new Uint8Array(samples.length * 2);
  const view = new DataView(pcm.buffer);
  for (let i = 0; i < samples.length; i++) {
    // Clamp before scaling: an un-clamped overshoot overflows int16 and wraps to a loud click.
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    // Asymmetric scale (32767 up, 32768 down) so both extremes land in range.
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  let binary = '';
  for (let i = 0; i < pcm.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...pcm.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

/** base64 of 16-bit little-endian PCM -> Float32 samples in [-1, 1]. Inverse of the encoder. */
export function decodePcm16Base64(base64: string): Float32Array {
  const binary = atob(base64);
  const pcm = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    pcm[i] = binary.charCodeAt(i);
  }

  const view = new DataView(pcm.buffer);
  const samples = new Float32Array(Math.floor(pcm.length / 2));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}
