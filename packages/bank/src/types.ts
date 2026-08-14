/** Interview category — top-level bank axis (wayfinder ticket 018). */
export type InterviewCategory = 'behavioral' | 'technical' | 'seniority';

/** Finer tag on a behavioral tree — the seven former flat categories. */
export type BehavioralTheme =
  | 'leadership'
  | 'conflict'
  | 'failure'
  | 'teamwork'
  | 'ambiguity'
  | 'impact'
  | 'prioritization';

/** One written prompt on screen and one spoken audio answer. */
export interface Question {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean;
}

/** One bank entry: main Question plus an unordered follow-up pool. */
export interface QuestionTree {
  id: string;
  category: InterviewCategory;
  theme?: BehavioralTheme | string;
  main: Question;
  followUps: Question[];
}
