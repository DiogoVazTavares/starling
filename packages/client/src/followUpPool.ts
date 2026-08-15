import type { Question, QuestionTree } from '@starling/bank';

/** Remaining follow-ups the picker may choose — asked ids already excluded. */
export function remainingFollowUpCandidates(
  tree: QuestionTree,
  askedIds: readonly string[],
): Question[] {
  const asked = new Set(askedIds);
  return tree.followUps.filter((q) => !asked.has(q.id));
}

/** Behavioral drill empty pools (and exhausted pools) finish locally — no Gemini call. */
export function localDoneWhenEmpty(candidates: readonly Question[]): { next: 'done' } | null {
  return candidates.length === 0 ? { next: 'done' } : null;
}

export function resolveQuestionById(tree: QuestionTree, id: string): Question | null {
  if (tree.main.id === id) return tree.main;
  return tree.followUps.find((q) => q.id === id) ?? null;
}
