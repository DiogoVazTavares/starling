import type { QuestionTree } from './types.ts';

/**
 * Behavioral trees — B1 fold from the former client/src/questions.ts bank
 * (wayfinder tickets 011 + 018): one tree per old prompt, empty follow-up pools.
 */
export const BEHAVIORAL_TREES: QuestionTree[] = [
  {
    id: 'leadership-no-authority',
    category: 'behavioral',
    theme: 'leadership',
    main: {
      id: 'leadership-no-authority-main',
      text: 'Tell me about a time you led a project or initiative without having formal authority over the people involved.',
    },
    followUps: [],
  },
  {
    id: 'leadership-convince-skeptics',
    category: 'behavioral',
    theme: 'leadership',
    main: {
      id: 'leadership-convince-skeptics-main',
      text: 'Tell me about a time you had to convince your team to adopt an approach they were skeptical of.',
    },
    followUps: [],
  },
  {
    id: 'leadership-unpopular-decision',
    category: 'behavioral',
    theme: 'leadership',
    main: {
      id: 'leadership-unpopular-decision-main',
      text: "Tell me about a time you had to make a decision that wasn't popular with your team.",
    },
    followUps: [],
  },
  {
    id: 'conflict-difficult-feedback',
    category: 'behavioral',
    theme: 'conflict',
    main: {
      id: 'conflict-difficult-feedback-main',
      text: 'Tell me about a time you had to give difficult feedback to a colleague.',
    },
    followUps: [],
  },
  {
    id: 'conflict-code-review-disagreement',
    category: 'behavioral',
    theme: 'conflict',
    main: {
      id: 'conflict-code-review-disagreement-main',
      text: 'Tell me about a time you disagreed with a code review decision and how you resolved it.',
    },
    followUps: [],
  },
  {
    id: 'conflict-stakeholder-scope',
    category: 'behavioral',
    theme: 'conflict',
    main: {
      id: 'conflict-stakeholder-scope-main',
      text: 'Tell me about a time you had a conflict with a product manager or stakeholder over scope or priorities.',
    },
    followUps: [],
  },
  {
    id: 'failure-production-incident',
    category: 'behavioral',
    theme: 'failure',
    main: {
      id: 'failure-production-incident-main',
      text: 'Tell me about a time you shipped a bug that caused a production incident.',
    },
    followUps: [],
  },
  {
    id: 'failure-missed-goals',
    category: 'behavioral',
    theme: 'failure',
    main: {
      id: 'failure-missed-goals-main',
      text: 'Tell me about a time a project you owned failed to meet its goals.',
    },
    followUps: [],
  },
  {
    id: 'failure-regretted-decision',
    category: 'behavioral',
    theme: 'failure',
    main: {
      id: 'failure-regretted-decision-main',
      text: 'Tell me about a time you made a technical decision you later regretted.',
    },
    followUps: [],
  },
  {
    id: 'teamwork-hard-problem',
    category: 'behavioral',
    theme: 'teamwork',
    main: {
      id: 'teamwork-hard-problem-main',
      text: 'Tell me about a time you worked closely with another engineer on a hard problem.',
    },
    followUps: [],
  },
  {
    id: 'teamwork-cross-team-coordination',
    category: 'behavioral',
    theme: 'teamwork',
    main: {
      id: 'teamwork-cross-team-coordination-main',
      text: 'Tell me about a time you had to coordinate across multiple teams to ship a feature.',
    },
    followUps: [],
  },
  {
    id: 'teamwork-onboarding',
    category: 'behavioral',
    theme: 'teamwork',
    main: {
      id: 'teamwork-onboarding-main',
      text: 'Tell me about a time you helped onboard a new teammate onto your codebase.',
    },
    followUps: [],
  },
  {
    id: 'ambiguity-unclear-requirements',
    category: 'behavioral',
    theme: 'ambiguity',
    main: {
      id: 'ambiguity-unclear-requirements-main',
      text: 'Tell me about a time you had to start work with unclear or incomplete requirements.',
    },
    followUps: [],
  },
  {
    id: 'ambiguity-limited-information',
    category: 'behavioral',
    theme: 'ambiguity',
    main: {
      id: 'ambiguity-limited-information-main',
      text: 'Tell me about a time you had to make a technical decision with limited information.',
    },
    followUps: [],
  },
  {
    id: 'ambiguity-scope-change',
    category: 'behavioral',
    theme: 'ambiguity',
    main: {
      id: 'ambiguity-scope-change-main',
      text: 'Tell me about a time the scope of a project changed significantly partway through.',
    },
    followUps: [],
  },
  {
    id: 'impact-improved-metric',
    category: 'behavioral',
    theme: 'impact',
    main: {
      id: 'impact-improved-metric-main',
      text: 'Tell me about a time your work directly improved a key metric, like performance, reliability, or revenue.',
    },
    followUps: [],
  },
  {
    id: 'impact-most-impactful-project',
    category: 'behavioral',
    theme: 'impact',
    main: {
      id: 'impact-most-impactful-project-main',
      text: "Tell me about the most impactful project you've shipped and why it mattered.",
    },
    followUps: [],
  },
  {
    id: 'impact-unprompted-fix',
    category: 'behavioral',
    theme: 'impact',
    main: {
      id: 'impact-unprompted-fix-main',
      text: 'Tell me about a time you identified and fixed a problem nobody had asked you to look at.',
    },
    followUps: [],
  },
  {
    id: 'prioritization-competing-deadlines',
    category: 'behavioral',
    theme: 'prioritization',
    main: {
      id: 'prioritization-competing-deadlines-main',
      text: 'Tell me about a time you had to juggle multiple competing deadlines.',
    },
    followUps: [],
  },
  {
    id: 'prioritization-cut-scope',
    category: 'behavioral',
    theme: 'prioritization',
    main: {
      id: 'prioritization-cut-scope-main',
      text: 'Tell me about a time you decided to cut scope in order to hit a deadline.',
    },
    followUps: [],
  },
  {
    id: 'prioritization-said-no',
    category: 'behavioral',
    theme: 'prioritization',
    main: {
      id: 'prioritization-said-no-main',
      text: 'Tell me about a time you had to say no to a request in order to protect your priorities.',
    },
    followUps: [],
  },
];
