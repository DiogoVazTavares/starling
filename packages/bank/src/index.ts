import { BEHAVIORAL_TREES } from './behavioral.ts';
import { SENIORITY_TREES } from './seniority.ts';
import { TECHNICAL_TREES } from './technical.ts';
import type { QuestionTree } from './types.ts';

export type {
  BehavioralTheme,
  InterviewCategory,
  Question,
  QuestionTree,
} from './types.ts';

/** Full question bank — behavioral + technical + seniority trees (018 / 027). */
export const QUESTION_BANK: QuestionTree[] = [
  ...BEHAVIORAL_TREES,
  ...TECHNICAL_TREES,
  ...SENIORITY_TREES,
];
