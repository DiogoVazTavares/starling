import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QuestionTree } from '@starling/bank';
import {
  localDoneWhenEmpty,
  remainingFollowUpCandidates,
  resolveQuestionById,
} from './followUpPool.ts';
import {
  formatProgressChrome,
  nextPhaseAfterPick,
  nextPhaseAfterStop,
  phaseAfterEndSession,
} from './sessionPhases.ts';

const sampleTree: QuestionTree = {
  id: 'tech-sample',
  category: 'technical',
  main: { id: 'tech-sample-main', text: 'Main question' },
  followUps: [
    {
      id: 'tech-sample-probe-a',
      text: 'Probe A',
      tags: ['a'],
      required: true,
    },
    {
      id: 'tech-sample-probe-b',
      text: 'Probe B',
      tags: ['b'],
    },
  ],
};

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

test('Pick next id returns ready; done ends the tree', () => {
  assert.equal(nextPhaseAfterPick('tech-sample-probe-a'), 'ready');
  assert.equal(nextPhaseAfterPick('done'), 'treeDone');
});

test('remainingFollowUpCandidates excludes asked ids', () => {
  assert.deepEqual(
    remainingFollowUpCandidates(sampleTree, ['tech-sample-main', 'tech-sample-probe-a']).map(
      (c) => c.id,
    ),
    ['tech-sample-probe-b'],
  );
  assert.deepEqual(remainingFollowUpCandidates(sampleTree, ['tech-sample-main']), [
    {
      id: 'tech-sample-probe-a',
      text: 'Probe A',
      tags: ['a'],
      required: true,
    },
    {
      id: 'tech-sample-probe-b',
      text: 'Probe B',
      tags: ['b'],
    },
  ]);
});

test('empty remaining pool yields local done with no network need', () => {
  assert.deepEqual(localDoneWhenEmpty([]), { next: 'done' });
  assert.equal(
    localDoneWhenEmpty(remainingFollowUpCandidates(sampleTree, ['tech-sample-main'])),
    null,
  );
});

test('resolveQuestionById finds main or follow-up, else null', () => {
  assert.equal(resolveQuestionById(sampleTree, 'tech-sample-main')?.text, 'Main question');
  assert.equal(resolveQuestionById(sampleTree, 'tech-sample-probe-b')?.text, 'Probe B');
  assert.equal(resolveQuestionById(sampleTree, 'missing'), null);
});
