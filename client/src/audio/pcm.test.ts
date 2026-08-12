import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodePcm16Base64, encodePcm16Base64 } from './pcm.ts';

/**
 * The Live pipeline's one piece of pure math (ticket 013): Float32 audio <-> 16-bit little-endian
 * PCM base64, the wire format on both legs of the socket (16 kHz up, 24 kHz down). Sample rate
 * never enters here — these are format converters, so they're testable off the browser.
 */

test('round-trips samples within 16-bit quantization error', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 0.999, -0.999, 0.123, -0.777]);
  const restored = decodePcm16Base64(encodePcm16Base64(samples));

  assert.equal(restored.length, samples.length);
  for (const [i, original] of samples.entries()) {
    // A 16-bit step is 1/32768; the asymmetric encode scale (32767 up) adds up to another step at
    // full scale, so ~2 steps is the true bound. 1/16000 covers it and still catches real drift.
    assert.ok(Math.abs(restored[i] - original) < 1 / 16000, `sample ${i} drifted too far`);
  }
});

test('clamps samples beyond [-1, 1] instead of wrapping', () => {
  // Without clamping, a sample above 1 overflows int16 and wraps to a loud negative click.
  const restored = decodePcm16Base64(encodePcm16Base64(new Float32Array([2, -2])));
  assert.ok(restored[0] > 0.99, 'positive overshoot must clamp near +1, not wrap');
  assert.ok(restored[1] < -0.99, 'negative overshoot must clamp near -1, not wrap');
});

test('encodes two bytes per sample', () => {
  // 16-bit mono: 4 samples -> 8 bytes -> ceil(8/3)*4 = 12 base64 chars (no padding gaps here).
  const base64 = encodePcm16Base64(new Float32Array([0, 0, 0, 0]));
  assert.equal(atob(base64).length, 8);
});

test('produces silence from an empty buffer without throwing', () => {
  assert.equal(encodePcm16Base64(new Float32Array(0)), '');
  assert.equal(decodePcm16Base64('').length, 0);
});
