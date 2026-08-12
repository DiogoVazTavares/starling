/**
 * Raw PCM <-> base64 for the Gemini Live pipeline (ticket 013). The Live socket speaks 16-bit
 * little-endian PCM both ways — the candidate's mic goes up as 16 kHz chunks, the interviewer's
 * native audio comes down at 24 kHz — but the byte format is identical on both legs, so these two
 * pure converters handle it. Sample rate lives with the AudioContext that produces/consumes the
 * samples, never here; that keeps this module free of the browser and unit-testable (pcm.test.ts).
 *
 * The one-shot behavioral mode ships a finished WAV over HTTP (wav.ts); this streams headerless PCM
 * over a socket. The two pipelines share only the byte<->base64 step (base64.ts); the int16 sample
 * math below is this path's own.
 */

// Explicit .ts extension: this module is also compiled under the Node (nodenext) test project, which
// requires it. The rest of the client uses bundler-mode extensionless imports.
import { base64ToBytes, bytesToBase64 } from './base64.ts';

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
  return bytesToBase64(pcm);
}

/** base64 of 16-bit little-endian PCM -> Float32 samples in [-1, 1]. Inverse of the encoder. */
export function decodePcm16Base64(base64: string): Float32Array {
  const pcm = base64ToBytes(base64);
  const view = new DataView(pcm.buffer);
  const samples = new Float32Array(Math.floor(pcm.length / 2));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}
