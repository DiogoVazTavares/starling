/**
 * Mono 16-bit PCM WAV encoding — hand-rolled rather than pulled from a dependency, since the
 * libraries only replace the header-writing step (wayfinder/tickets/007-audio-format-strategy.md).
 *
 * Pure by design: no Web Audio types here, so the byte layout can be checked outside a browser.
 */

/** Matches Gemini's own internal downsample resolution — richer audio is bytes it discards. */
export const TARGET_SAMPLE_RATE = 16_000;

const BYTES_PER_SAMPLE = 2;
const HEADER_BYTES = 44;

export function encodeWav16BitPcm(
  samples: Float32Array,
  sampleRate: number = TARGET_SAMPLE_RATE,
): Uint8Array {
  const dataBytes = samples.length * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, HEADER_BYTES - 8 + dataBytes, true); // size of everything after this field
  writeAscii(view, 8, 'WAVE');

  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk length
  view.setUint16(20, 1, true); // format: uncompressed PCM
  view.setUint16(22, 1, true); // channels: mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true); // byte rate
  view.setUint16(32, BYTES_PER_SAMPLE, true); // block align
  view.setUint16(34, 8 * BYTES_PER_SAMPLE, true); // bits per sample

  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = HEADER_BYTES;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    // The negative range of an int16 is one step wider than the positive one.
    view.setInt16(offset, clamped * (clamped < 0 ? 0x8000 : 0x7fff), true);
    offset += BYTES_PER_SAMPLE;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
