/**
 * The question bank, per wayfinder/tickets/003-question-bank.md — 7 categories x 3 questions,
 * hand-curated, SW-engineering flavored, not leveled by seniority.
 */

export type Category =
  | 'leadership'
  | 'conflict'
  | 'failure'
  | 'teamwork'
  | 'ambiguity'
  | 'impact'
  | 'prioritization';

export interface Question {
  id: string;
  category: Category;
  prompt: string;
}

export const QUESTION_BANK: Question[] = [
  {
    id: 'leadership-no-authority',
    category: 'leadership',
    prompt:
      'Tell me about a time you led a project or initiative without having formal authority over the people involved.',
  },
  {
    id: 'leadership-convince-skeptics',
    category: 'leadership',
    prompt:
      'Tell me about a time you had to convince your team to adopt an approach they were skeptical of.',
  },
  {
    id: 'leadership-unpopular-decision',
    category: 'leadership',
    prompt: "Tell me about a time you had to make a decision that wasn't popular with your team.",
  },
  {
    id: 'conflict-difficult-feedback',
    category: 'conflict',
    prompt: 'Tell me about a time you had to give difficult feedback to a colleague.',
  },
  {
    id: 'conflict-code-review-disagreement',
    category: 'conflict',
    prompt: 'Tell me about a time you disagreed with a code review decision and how you resolved it.',
  },
  {
    id: 'conflict-stakeholder-scope',
    category: 'conflict',
    prompt:
      'Tell me about a time you had a conflict with a product manager or stakeholder over scope or priorities.',
  },
  {
    id: 'failure-production-incident',
    category: 'failure',
    prompt: 'Tell me about a time you shipped a bug that caused a production incident.',
  },
  {
    id: 'failure-missed-goals',
    category: 'failure',
    prompt: 'Tell me about a time a project you owned failed to meet its goals.',
  },
  {
    id: 'failure-regretted-decision',
    category: 'failure',
    prompt: 'Tell me about a time you made a technical decision you later regretted.',
  },
  {
    id: 'teamwork-hard-problem',
    category: 'teamwork',
    prompt: 'Tell me about a time you worked closely with another engineer on a hard problem.',
  },
  {
    id: 'teamwork-cross-team-coordination',
    category: 'teamwork',
    prompt: 'Tell me about a time you had to coordinate across multiple teams to ship a feature.',
  },
  {
    id: 'teamwork-onboarding',
    category: 'teamwork',
    prompt: 'Tell me about a time you helped onboard a new teammate onto your codebase.',
  },
  {
    id: 'ambiguity-unclear-requirements',
    category: 'ambiguity',
    prompt: 'Tell me about a time you had to start work with unclear or incomplete requirements.',
  },
  {
    id: 'ambiguity-limited-information',
    category: 'ambiguity',
    prompt: 'Tell me about a time you had to make a technical decision with limited information.',
  },
  {
    id: 'ambiguity-scope-change',
    category: 'ambiguity',
    prompt: 'Tell me about a time the scope of a project changed significantly partway through.',
  },
  {
    id: 'impact-improved-metric',
    category: 'impact',
    prompt:
      'Tell me about a time your work directly improved a key metric, like performance, reliability, or revenue.',
  },
  {
    id: 'impact-most-impactful-project',
    category: 'impact',
    prompt: "Tell me about the most impactful project you've shipped and why it mattered.",
  },
  {
    id: 'impact-unprompted-fix',
    category: 'impact',
    prompt: 'Tell me about a time you identified and fixed a problem nobody had asked you to look at.',
  },
  {
    id: 'prioritization-competing-deadlines',
    category: 'prioritization',
    prompt: 'Tell me about a time you had to juggle multiple competing deadlines.',
  },
  {
    id: 'prioritization-cut-scope',
    category: 'prioritization',
    prompt: 'Tell me about a time you decided to cut scope in order to hit a deadline.',
  },
  {
    id: 'prioritization-said-no',
    category: 'prioritization',
    prompt: 'Tell me about a time you had to say no to a request in order to protect your priorities.',
  },
];
