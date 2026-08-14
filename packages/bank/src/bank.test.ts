import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTION_BANK } from './index.ts';

test('QUESTION_BANK has 21 behavioral, 5 technical, and 5 seniority trees', () => {
  assert.equal(QUESTION_BANK.filter((tree) => tree.category === 'behavioral').length, 21);
  assert.equal(QUESTION_BANK.filter((tree) => tree.category === 'technical').length, 5);
  assert.equal(QUESTION_BANK.filter((tree) => tree.category === 'seniority').length, 5);
});

test('every tree id is unique and every main id is `${treeId}-main`', () => {
  const treeIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const tree of QUESTION_BANK) {
    assert.equal(treeIds.has(tree.id), false, `duplicate tree id ${tree.id}`);
    treeIds.add(tree.id);
    assert.equal(tree.main.id, `${tree.id}-main`);

    for (const question of [tree.main, ...tree.followUps]) {
      assert.equal(questionIds.has(question.id), false, `duplicate question id ${question.id}`);
      questionIds.add(question.id);
      assert.ok(question.text.length > 0, `${question.id} has empty text`);
    }
  }
});

test('behavioral trees keep former question ids as tree ids (B1 fold)', () => {
  const behavioral = QUESTION_BANK.filter((tree) => tree.category === 'behavioral');
  assert.ok(behavioral.some((tree) => tree.id === 'conflict-difficult-feedback'));
  assert.equal(
    behavioral.find((tree) => tree.id === 'conflict-difficult-feedback')?.theme,
    'conflict',
  );
});
