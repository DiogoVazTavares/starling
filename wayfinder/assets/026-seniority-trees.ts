/**
 * Seniority QuestionTree set for @starling/bank.
 * Authored in wayfinder ticket 026 from the five opening seeds (ticket 016 /
 * server/src/interviewer.ts SEED_BANK). Live “Open by inviting…” instructions
 * become fixed on-screen mains; follow-up pools encode 012’s failure catalogue
 * and 014’s probe patterns as pre-authored questions (not Live improvisation).
 *
 * Drop into packages/bank when wiring; do not import from the app yet.
 *
 * Types match 018-unified-question-bank-schema.md.
 */

export type InterviewCategory = 'behavioral' | 'technical' | 'seniority';

export interface Question {
  id: string;
  text: string;
  tags?: string[];
  required?: boolean;
}

export interface QuestionTree {
  id: string;
  category: InterviewCategory;
  theme?: string;
  main: Question;
  followUps: Question[];
}

/**
 * Author-time coverage (ticket 016 §4). Tags on follow-ups are soft picker hints
 * for 021 — frame/anti-signal ids stay out of user-facing question text (map Notes).
 *
 * | Tree              | Designed to provoke                          |
 * |-------------------|----------------------------------------------|
 * | proud-of          | F3 small-scope, F6 false-modesty, A2 hedging |
 * | disagreement      | F1 order-taker, F2 bystander, A1 we-not-I    |
 * | went-wrong        | A4 passivity, A1 we-not-I, A3 unquantified, F4 luck |
 * | ambiguous         | F5 too-junior, Tier-3 evidence, A4 passivity |
 * | changed-how       | F3 small-scope, F5 too-junior                |
 *
 * A5 (frame acceptance) is exercised wherever a warm-summary / “is that fair?”
 * follow-up appears — at least one per tree.
 */
export const SENIORITY_TREES_V1: QuestionTree[] = [
  {
    id: 'seniority-proud-of',
    category: 'seniority',
    theme: 'proud-of',
    main: {
      id: 'seniority-proud-of-main',
      text: 'Tell me about a piece of work you are genuinely proud of.',
    },
    followUps: [
      {
        id: 'seniority-proud-of-own-role',
        text: 'What did you personally own versus what others owned?',
        tags: ['ownership', 'we-not-i'],
        required: true,
      },
      {
        id: 'seniority-proud-of-scope',
        text: 'What was the scope of that work — mostly your own tasks, or something that affected the team or the wider business?',
        tags: ['scope', 'tier-reach', 'small-scope'],
      },
      {
        id: 'seniority-proud-of-who-decided',
        text: 'How did that work become something anyone spent time on? Who decided it was worth doing?',
        tags: ['origin', 'agency', 'tier-reach'],
      },
      {
        id: 'seniority-proud-of-false-modesty',
        text: 'Looking back, was that actually a big deal for the team — or more of a solid piece of individual work that landed quietly?',
        tags: ['false-modesty', 'frame', 'hedging'],
      },
      {
        id: 'seniority-proud-of-impact',
        text: 'What changed because of that work — for users, the team, or the business — and how would you measure it?',
        tags: ['impact', 'quantify'],
      },
      {
        id: 'seniority-proud-of-order-taker',
        text: 'Would it be fair to say you mostly executed a plan that someone else had already set?',
        tags: ['order-taker', 'frame', 'ownership'],
      },
    ],
  },

  {
    id: 'seniority-disagreement',
    category: 'seniority',
    theme: 'disagreement',
    main: {
      id: 'seniority-disagreement-main',
      text: 'Tell me about a time you disagreed with a decision that had already been made. What did you actually do about it?',
    },
    followUps: [
      {
        id: 'seniority-disagreement-your-move',
        text: 'Walk me through the moment you pushed back — what did you say, to whom, and what happened next?',
        tags: ['ownership', 'pushback', 'we-not-i'],
        required: true,
      },
      {
        id: 'seniority-disagreement-bystander',
        text: 'It sounds like the team drove that outcome and you mostly went along after voicing a concern — is that a fair summary?',
        tags: ['bystander', 'frame', 'we-not-i'],
      },
      {
        id: 'seniority-disagreement-order-taker',
        text: 'Once the decision was made above you, how much room did you really have — were you mostly expected to execute from there?',
        tags: ['order-taker', 'frame', 'agency'],
      },
      {
        id: 'seniority-disagreement-argued-against',
        text: 'Was there a version of the plan you argued against? What alternative did you put forward?',
        tags: ['pushback', 'specificity', 'tier-reach'],
      },
      {
        id: 'seniority-disagreement-owned-outcome',
        text: 'What part of the final outcome do you personally own — not the team as a whole?',
        tags: ['ownership', 'we-not-i', 'impact'],
      },
      {
        id: 'seniority-disagreement-cost',
        text: 'What did it cost you socially or politically to push back, and how did you decide it was worth it?',
        tags: ['judgment', 'tier-reach', 'specificity'],
      },
    ],
  },

  {
    id: 'seniority-went-wrong',
    category: 'seniority',
    theme: 'went-wrong',
    main: {
      id: 'seniority-went-wrong-main',
      text: "Tell me about something you owned that didn't go according to plan — what happened, what you did when it went sideways, and how it landed.",
    },
    followUps: [
      {
        id: 'seniority-went-wrong-your-agency',
        text: 'When it started going sideways, what did *you* decide to do — not the team, not your manager?',
        tags: ['agency', 'passivity', 'ownership'],
        required: true,
      },
      {
        id: 'seniority-went-wrong-luck',
        text: 'It sounds like a lot of that was bad timing or circumstance outside your control — is that how you see it?',
        tags: ['luck', 'frame', 'agency'],
      },
      {
        id: 'seniority-went-wrong-we-not-i',
        text: 'You said “we” a few times about the failure — what was yours alone to own in that story?',
        tags: ['we-not-i', 'ownership', 'blame'],
      },
      {
        id: 'seniority-went-wrong-quantify',
        text: 'How big was the impact — on users, delivery, or the business — in concrete terms?',
        tags: ['quantify', 'impact', 'unquantified'],
      },
      {
        id: 'seniority-went-wrong-recovery',
        text: 'What specifically did you change afterward so the same failure was less likely?',
        tags: ['agency', 'lead-self', 'specificity'],
      },
      {
        id: 'seniority-went-wrong-assigned',
        text: 'Were you mostly assigned into that situation, or did you choose to take it on?',
        tags: ['passivity', 'agency', 'origin'],
      },
    ],
  },

  {
    id: 'seniority-ambiguous',
    category: 'seniority',
    theme: 'ambiguous',
    main: {
      id: 'seniority-ambiguous-main',
      text: 'Tell me about a time you had to move forward when things were ambiguous — no clear direction, no obvious owner. How did you figure out what to do?',
    },
    followUps: [
      {
        id: 'seniority-ambiguous-how-you-decided',
        text: 'How did *you* decide what “good” looked like when nobody had defined it?',
        tags: ['agency', 'judgment', 'passivity'],
        required: true,
      },
      {
        id: 'seniority-ambiguous-too-junior',
        text: 'At your level, would you really have been the one making that call — or was that above your pay grade?',
        tags: ['too-junior', 'frame', 'tier-reach'],
      },
      {
        id: 'seniority-ambiguous-clarity-for-others',
        text: 'Who else was stuck without direction, and what did you do to create clarity for them?',
        tags: ['lead-others', 'clarity', 'tier-reach'],
      },
      {
        id: 'seniority-ambiguous-business-why',
        text: 'How did you connect what you chose to do with why it mattered for the business or the org?',
        tags: ['lead-business', 'tier-reach', 'impact'],
      },
      {
        id: 'seniority-ambiguous-waiting',
        text: 'Did you wait for someone to assign an owner, or did you step into that gap yourself?',
        tags: ['passivity', 'agency', 'ownership'],
      },
      {
        id: 'seniority-ambiguous-rooms',
        text: 'Which conversations or rooms did you need to be in to unblock that — and how did you get there?',
        tags: ['altitude', 'tier-reach', 'specificity'],
      },
    ],
  },

  {
    id: 'seniority-changed-how',
    category: 'seniority',
    theme: 'changed-how',
    main: {
      id: 'seniority-changed-how-main',
      text: "Tell me about a time you changed how your team or organization did something — something that didn't work that way before you got involved.",
    },
    followUps: [
      {
        id: 'seniority-changed-how-your-role',
        text: 'What specifically changed because *you* got involved — not because the team eventually evolved?',
        tags: ['ownership', 'leadership', 'we-not-i'],
        required: true,
      },
      {
        id: 'seniority-changed-how-small-scope',
        text: 'Was that mostly a contained tweak to your own workflow, or did it change how others worked too?',
        tags: ['small-scope', 'frame', 'scope'],
      },
      {
        id: 'seniority-changed-how-too-junior',
        text: 'Changing how an organization works usually needs air cover from above — how much of this was really yours to drive at your level?',
        tags: ['too-junior', 'frame', 'tier-reach'],
      },
      {
        id: 'seniority-changed-how-influence',
        text: 'Who did you need to convince, and how did you get them on board?',
        tags: ['lead-others', 'influence', 'specificity'],
      },
      {
        id: 'seniority-changed-how-resistance',
        text: 'Where did you meet resistance, and what did you do when people preferred the old way?',
        tags: ['pushback', 'lead-others', 'agency'],
      },
      {
        id: 'seniority-changed-how-lasting',
        text: 'Did the new way stick after you moved on — and how do you know?',
        tags: ['impact', 'lead-business', 'quantify'],
      },
    ],
  },
];
