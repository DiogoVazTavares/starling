/**
 * The opening-scenario seed bank, per wayfinder ticket 016. A session is seeded by exactly one
 * semantic opening prompt; persona, protocol, and tier-coverage stay constant (ticket 014). The
 * bank is organized by story-kind, each seed authored against ticket 012's failure catalogue.
 *
 * Start is a random single-button pick — no menu, no difficulty (deliberate drilling is deferred
 * to the adaptivity fog).
 *
 * TODO(016): the `opening` strings below are placeholders. Author the final wording so each seed
 * reliably provokes its intended frames + anti-signals, using the Zendesk doc as a failure-mode
 * reference (never content) and the STAR bank as an author-time reachability check only.
 */

export interface Seed {
  id: string;
  /** The kind of story the opening invites — the organizing axis of the bank. */
  storyKind: string;
  /** The single semantic opening prompt handed to the interviewer's systemInstruction. */
  opening: string;
}

export const SEED_BANK: Seed[] = [
  {
    id: 'proud-of',
    storyKind: 'a piece of work you are proud of',
    opening:
      'Ask the candidate to walk through a project they are proud of and what their part in it was.',
  },
  {
    id: 'disagreement',
    storyKind: 'a disagreement',
    opening: 'Ask about a time the candidate disagreed with a decision and what they did about it.',
  },
  {
    id: 'went-wrong',
    storyKind: 'something that went wrong',
    opening: 'Ask about something the candidate owned that did not go to plan.',
  },
  {
    id: 'ambiguous',
    storyKind: 'an ambiguous situation',
    opening:
      'Ask how the candidate moved forward on something underspecified, with no clear owner.',
  },
  {
    id: 'changed-how',
    storyKind: 'changing how something was done',
    opening: 'Ask about a time the candidate changed how their team or org did something.',
  },
];

export function pickRandomSeed(): Seed {
  return SEED_BANK[Math.floor(Math.random() * SEED_BANK.length)];
}
