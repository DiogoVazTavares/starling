import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatProgressChrome, nextPhaseAfterStop, phaseAfterEndSession } from './sessionPhases.ts';

test('Practice stance moves from recording to reviewing on stop', () => {
  assert.equal(nextPhaseAfterStop('practice'), 'reviewing');
});

test('Simulation stance moves from recording to submitting on stop', () => {
  assert.equal(nextPhaseAfterStop('simulation'), 'submitting');
});

test('formatProgressChrome uses plain category labels', () => {
  assert.equal(
    formatProgressChrome({
      treeIndex: 0,
      treeCount: 6,
      category: 'technical',
      questionIndex: 0,
    }),
    'Tree 1 of 6 · Technical · Question 1',
  );
  assert.equal(
    formatProgressChrome({
      treeIndex: 0,
      treeCount: 1,
      category: 'behavioral',
      questionIndex: 2,
    }),
    'Tree 1 of 1 · Behavioral · Question 3',
  );
  assert.equal(
    formatProgressChrome({
      treeIndex: 4,
      treeCount: 8,
      category: 'seniority',
      questionIndex: 0,
    }),
    'Tree 5 of 8 · Seniority · Question 1',
  );
});

test('End session returns to the start screen', () => {
  assert.equal(phaseAfterEndSession(), 'start');
});
