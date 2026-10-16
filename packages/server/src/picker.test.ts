import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_MAX_FOLLOW_UPS,
  applyModelChoice,
  deterministicFallback,
  resolveBeforeModel,
  type PickerCandidate,
} from './picker.ts';

const requiredA: PickerCandidate = {
  id: 'a-required',
  text: 'Required A',
  required: true,
};
const requiredB: PickerCandidate = {
  id: 'b-required',
  text: 'Required B',
  required: true,
};
const optionalC: PickerCandidate = {
  id: 'c-optional',
  text: 'Optional C',
};
const optionalD: PickerCandidate = {
  id: 'd-optional',
  text: 'Optional D',
};

test('empty candidates short-circuit to done without a model call', () => {
  assert.deepEqual(resolveBeforeModel([], 0), { next: 'done' });
});

test('depth cap with no remaining required short-circuits to done', () => {
  assert.deepEqual(
    resolveBeforeModel([optionalC, optionalD], DEFAULT_MAX_FOLLOW_UPS),
    { next: 'done' },
  );
});

test('depth cap with required left picks first required by stable id sort', () => {
  assert.deepEqual(resolveBeforeModel([requiredB, requiredA, optionalC], DEFAULT_MAX_FOLLOW_UPS), {
    next: 'a-required',
    reason: 'required-under-cap',
  });
});

test('under the depth cap, remaining candidates go to the model', () => {
  assert.equal(resolveBeforeModel([optionalC], 0), null);
  assert.equal(resolveBeforeModel([requiredA, optionalC], 1), null);
});

test('model done while required remain overrides to first required by id', () => {
  assert.deepEqual(applyModelChoice([requiredB, requiredA, optionalC], 0, 'done'), {
    next: 'a-required',
    reason: 'required-override',
  });
});

test('model next inside the candidate set is accepted', () => {
  assert.deepEqual(applyModelChoice([optionalC, optionalD], 0, 'd-optional'), {
    next: 'd-optional',
  });
});

test('invalid model next falls back to first required by id', () => {
  assert.deepEqual(applyModelChoice([optionalC, requiredB, requiredA], 0, 'not-a-candidate'), {
    next: 'a-required',
    reason: 'fallback',
  });
});

test('fallback prefers required, then optional under cap, else done', () => {
  assert.deepEqual(deterministicFallback([optionalC, requiredB], 0), {
    next: 'b-required',
    reason: 'fallback',
  });
  assert.deepEqual(deterministicFallback([optionalD, optionalC], 0), {
    next: 'c-optional',
    reason: 'fallback',
  });
  assert.deepEqual(deterministicFallback([optionalC], DEFAULT_MAX_FOLLOW_UPS), {
    next: 'done',
  });
  assert.deepEqual(deterministicFallback([], 0), { next: 'done' });
});

test('empty or missing model next uses the same fallback', () => {
  assert.deepEqual(applyModelChoice([optionalC], 0, undefined), {
    next: 'c-optional',
    reason: 'fallback',
  });
  assert.deepEqual(applyModelChoice([optionalC], 0, ''), {
    next: 'c-optional',
    reason: 'fallback',
  });
});
