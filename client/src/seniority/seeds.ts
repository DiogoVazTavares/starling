/**
 * The opening-scenario seed bank, per wayfinder ticket 016. A session is seeded by exactly one
 * semantic opening prompt; persona, protocol, and tier-coverage stay constant (ticket 014). The
 * bank is organized by story-kind, each seed authored against ticket 012's failure catalogue.
 *
 * Start is a random single-button pick — no menu, no difficulty (deliberate drilling is deferred
 * to the adaptivity fog).
 *
 * Anti-overfit constraint (016 §5): the Zendesk feedback doc and the STAR bank informed *which
 * failure classes to provoke* and *that a real story can fill each seed* — nothing from either was
 * copied into the wording below. No company, interviewer, or literal question is baked in.
 *
 * Each seed's `// provokes:` comment is an author-time audit trail only (012's frame/anti-signal
 * tags, per ticket 016 §4's coverage table) — it records why the seed earns its place in the bank.
 * Frames are still deployed adaptively by 014 on live evidence; the tag is never read at runtime
 * and never fired by the seed itself.
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
    // provokes: F3 small-scope, F6 false-modesty, A2 hedging. Deliberately the widest seed —
    // what the candidate reaches for first, unprompted, locates their default tier-reach.
    opening:
      "Open by inviting the candidate to talk about a piece of work they're genuinely proud of. " +
      'Keep the invitation as open as possible — no hint of scale, team size, or timeframe — so ' +
      'whatever they reach for first is unprompted signal.',
  },
  {
    id: 'disagreement',
    storyKind: 'a disagreement',
    // provokes: F1 order-taker, F2 bystander; A1 we-not-I on who actually drove the push-back.
    opening:
      'Ask about a time the candidate disagreed with a decision that had already been made, and ' +
      'invite them to walk through what they actually did about it — not just that they disagreed.',
  },
  {
    id: 'went-wrong',
    storyKind: 'something that went wrong',
    // provokes: A4 passivity, A1 we-not-I (blame diffusion), A3 unquantified, F4 luck/circumstance.
    opening:
      "Ask about something the candidate owned that didn't go according to plan, and invite the " +
      'full arc: what happened, what they did once it started going sideways, and how it landed.',
  },
  {
    id: 'ambiguous',
    storyKind: 'an ambiguous situation, no clear direction',
    // provokes: F5 too-junior; tests unprompted Tier-3 evidence; A4 passivity.
    opening:
      'Ask about a time the candidate had to move forward on something ambiguous — no clear ' +
      'direction, no obvious owner — and invite how they figured out what to do, without hinting ' +
      'at what level of the organization was involved.',
  },
  {
    id: 'changed-how',
    storyKind: 'changing how something was done',
    // provokes: F3 small-scope, F5 too-junior — the core Zendesk failure class: surfacing
    // leadership evidence unprompted.
    opening:
      'Ask about a time the candidate changed how their team or organization did something — ' +
      "something that didn't work that way before they got involved — and invite the story " +
      'without hinting at scale, so any leadership evidence has to surface on its own.',
  },
];

export function pickRandomSeed(): Seed {
  return SEED_BANK[Math.floor(Math.random() * SEED_BANK.length)];
}
