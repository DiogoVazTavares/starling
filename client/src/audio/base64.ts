/**
 * Chunked base64 <-> bytes. The two audio pipelines — the one-shot WAV upload (wav.ts) and the Live
 * PCM stream (pcm.ts) — differ in everything but this byte<->base64 step, so it lives here and both
 * import it. Chunked because spreading megabytes of samples into `String.fromCharCode(...)` in one
 * call blows the stack.
 */

const CHUNK_SIZE = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
