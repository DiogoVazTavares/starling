import type { Question, QuestionTree } from '@starling/bank';

/** Prior answered Question in this tree — same shape the picker wire type expects. */
export interface TreeHistoryEntry {
  questionId: string;
  questionText: string;
  coverageNote?: string;
}

/**
 * In-tree position for the current Question: which prompt is on screen,
 * what has already been answered, and the picker history for this tree.
 */
export interface TreeCursor {
  questionId: string;
  /** Progress chrome: 0 = main, then +1 for each follow-up shown. */
  questionIndex: number;
  askedIds: string[];
  history: TreeHistoryEntry[];
}

/** Start (or restart) a tree on its main Question. */
export function initialTreeCursor(tree: QuestionTree): TreeCursor {
  return {
    questionId: tree.main.id,
    questionIndex: 0,
    askedIds: [],
    history: [],
  };
}

/** Record the just-answered Question without changing the on-screen Question (tree done). */
export function recordAnswered(cursor: TreeCursor, answered: Question): TreeCursor {
  return {
    ...cursor,
    askedIds: [...cursor.askedIds, answered.id],
    history: [...cursor.history, { questionId: answered.id, questionText: answered.text }],
  };
}

/** Record the answer and move the cursor onto the next Question in the tree. */
export function advanceToQuestion(
  cursor: TreeCursor,
  answered: Question,
  next: Question,
): TreeCursor {
  const askedIds = [...cursor.askedIds, answered.id];
  return {
    questionId: next.id,
    questionIndex: askedIds.length,
    askedIds,
    history: [...cursor.history, { questionId: answered.id, questionText: answered.text }],
  };
}
