import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { QuestionTree } from '@starling/bank';
import { advanceToQuestion, initialTreeCursor, recordAnswered } from './treeCursor.ts';

const tree: QuestionTree = {
  id: 'tech-sample',
  category: 'technical',
  main: { id: 'tech-sample-main', text: 'Main question' },
  followUps: [
    { id: 'tech-sample-probe-a', text: 'Probe A', required: true },
    { id: 'tech-sample-probe-b', text: 'Probe B' },
  ],
};

test('initialTreeCursor starts on the main with an empty asked set', () => {
  assert.deepEqual(initialTreeCursor(tree), {
    questionId: 'tech-sample-main',
    questionIndex: 0,
    askedIds: [],
    history: [],
  });
});

test('recordAnswered appends the turn without changing the on-screen Question', () => {
  const cursor = initialTreeCursor(tree);
  assert.deepEqual(recordAnswered(cursor, tree.main), {
    questionId: 'tech-sample-main',
    questionIndex: 0,
    askedIds: ['tech-sample-main'],
    history: [{ questionId: 'tech-sample-main', questionText: 'Main question' }],
  });
});

test('advanceToQuestion records the answer and moves chrome to the next Question', () => {
  const cursor = initialTreeCursor(tree);
  const next = tree.followUps[0];
  assert.deepEqual(advanceToQuestion(cursor, tree.main, next), {
    questionId: 'tech-sample-probe-a',
    questionIndex: 1,
    askedIds: ['tech-sample-main'],
    history: [{ questionId: 'tech-sample-main', questionText: 'Main question' }],
  });
});
