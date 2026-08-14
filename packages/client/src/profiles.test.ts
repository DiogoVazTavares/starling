import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { InterviewCategory, QuestionTree } from '@starling/bank';
import {
  assembleSessionTrees,
  assessProfileFill,
  INTERVIEW_PROFILES,
  type InterviewProfile,
} from './profiles.ts';

function tree(id: string, category: InterviewCategory): QuestionTree {
  return {
    id,
    category,
    main: { id: `${id}-main`, text: `${id} main` },
    followUps: [],
  };
}

function bankOf(specs: Array<[string, InterviewCategory]>): QuestionTree[] {
  return specs.map(([id, category]) => tree(id, category));
}

function profileById(id: string): InterviewProfile {
  const profile = INTERVIEW_PROFILES.find((entry) => entry.id === id);
  assert.ok(profile, `missing profile ${id}`);
  return profile;
}

test('v1 presets match the 019 contract', () => {
  assert.deepEqual(
    INTERVIEW_PROFILES.map((profile) => ({
      id: profile.id,
      label: profile.label,
      reportMode: profile.reportMode,
      treePick: profile.treePick,
      slots: profile.slots,
    })),
    [
      {
        id: 'culture-fit',
        label: 'Culture-fit screen',
        reportMode: 'endReport',
        treePick: 'random',
        slots: [
          { type: 'count', category: 'seniority', count: 1 },
          { type: 'count', category: 'behavioral', count: 5 },
        ],
      },
      {
        id: 'frontend-technical',
        label: 'Frontend technical',
        reportMode: 'endReport',
        treePick: 'random',
        slots: [
          { type: 'count', category: 'seniority', count: 1 },
          { type: 'count', category: 'technical', count: 5 },
        ],
      },
      {
        id: 'behavioral-drill',
        label: 'Behavioral drill',
        reportMode: 'perAttempt',
        treePick: 'userOptional',
        slots: [{ type: 'count', category: 'behavioral', count: 1 }],
      },
      {
        id: 'full-senior-loop',
        label: 'Full senior loop',
        reportMode: 'endReport',
        treePick: 'random',
        slots: [
          { type: 'count', category: 'seniority', count: 2 },
          { type: 'count', category: 'technical', count: 3 },
          { type: 'count', category: 'behavioral', count: 3 },
        ],
      },
    ],
  );
});

test('assessProfileFill reports shortfall when the bank cannot fill a slot', () => {
  const profile = profileById('full-senior-loop');
  const bank = bankOf([
    ['s1', 'seniority'],
    ['t1', 'technical'],
    ['t2', 'technical'],
    ['t3', 'technical'],
    ['b1', 'behavioral'],
    ['b2', 'behavioral'],
    ['b3', 'behavioral'],
  ]);

  const result = assessProfileFill(profile, bank);
  assert.equal(result.fillable, false);
  assert.equal(result.reason, 'Needs 1 more seniority tree');
});

test('assessProfileFill accepts a bank that covers every slot', () => {
  const profile = profileById('behavioral-drill');
  const bank = bankOf([['b1', 'behavioral']]);
  assert.deepEqual(assessProfileFill(profile, bank), { fillable: true });
});

test('assembleSessionTrees picks random trees without session repeats, slot order contiguous', () => {
  const profile: InterviewProfile = {
    id: 'mix',
    label: 'Mix',
    reportMode: 'endReport',
    treePick: 'random',
    slots: [
      { type: 'count', category: 'seniority', count: 1 },
      { type: 'count', category: 'behavioral', count: 2 },
    ],
  };
  const bank = bankOf([
    ['s1', 'seniority'],
    ['s2', 'seniority'],
    ['b1', 'behavioral'],
    ['b2', 'behavioral'],
    ['b3', 'behavioral'],
  ]);

  // Deterministic: always take the first remaining candidate.
  const trees = assembleSessionTrees(profile, bank, { random: () => 0 });
  assert.deepEqual(
    trees.map((t) => t.id),
    ['s1', 'b1', 'b2'],
  );
});

test('assembleSessionTrees honors an optional drill tree pick', () => {
  const profile = profileById('behavioral-drill');
  const bank = bankOf([
    ['b1', 'behavioral'],
    ['b2', 'behavioral'],
  ]);

  const trees = assembleSessionTrees(profile, bank, { treeId: 'b2' });
  assert.deepEqual(
    trees.map((t) => t.id),
    ['b2'],
  );
});

test('assembleSessionTrees hard-fails when the bank cannot fill the profile', () => {
  const profile = profileById('frontend-technical');
  const bank = bankOf([['s1', 'seniority']]);
  assert.throws(() => assembleSessionTrees(profile, bank), /cannot fill/i);
});
