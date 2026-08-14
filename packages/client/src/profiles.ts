import type { InterviewCategory, QuestionTree } from '@starling/bank';

export type ReportMode = 'endReport' | 'perAttempt';
export type TreePick = 'random' | 'userOptional';

export type ProfileSlot =
  | { type: 'count'; category: InterviewCategory; count: number }
  | { type: 'pinned'; treeIds: string[] };

export interface InterviewProfile {
  id: string;
  label: string;
  reportMode: ReportMode;
  treePick: TreePick;
  slots: ProfileSlot[];
}

export type ProfileFill = { fillable: true } | { fillable: false; reason: string };

export interface AssembleOptions {
  /** Optional tree id when `treePick` is `userOptional`. */
  treeId?: string;
  /** Injected RNG in [0, 1). Defaults to `Math.random`. */
  random?: () => number;
}

/** Four v1 presets from wayfinder ticket 019. */
export const INTERVIEW_PROFILES: InterviewProfile[] = [
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
];

const CATEGORY_LABEL: Record<InterviewCategory, string> = {
  behavioral: 'behavioral',
  technical: 'technical',
  seniority: 'seniority',
};

/** Whether the bank can fill every slot; underfilled presets stay visible but disabled. */
export function assessProfileFill(profile: InterviewProfile, bank: QuestionTree[]): ProfileFill {
  const available = countByCategory(bank);

  for (const slot of profile.slots) {
    if (slot.type === 'pinned') {
      for (const id of slot.treeIds) {
        if (!bank.some((tree) => tree.id === id)) {
          return { fillable: false, reason: `Missing pinned tree ${id}` };
        }
      }
      continue;
    }

    const have = available[slot.category] ?? 0;
    if (have < slot.count) {
      const need = slot.count - have;
      const noun = CATEGORY_LABEL[slot.category];
      return {
        fillable: false,
        reason: `Needs ${need} more ${noun} tree${need === 1 ? '' : 's'}`,
      };
    }
  }

  return { fillable: true };
}

/**
 * Build the ordered session tree list from profile slots.
 * Random picks never repeat in the session. Hard-fails if the bank cannot fill.
 */
export function assembleSessionTrees(
  profile: InterviewProfile,
  bank: QuestionTree[],
  options: AssembleOptions = {},
): QuestionTree[] {
  const fill = assessProfileFill(profile, bank);
  if (!fill.fillable) {
    throw new Error(`Profile ${profile.id} cannot fill: ${fill.reason}`);
  }

  const random = options.random ?? Math.random;
  const used = new Set<string>();
  const result: QuestionTree[] = [];

  if (profile.treePick === 'userOptional' && options.treeId) {
    const picked = bank.find((tree) => tree.id === options.treeId);
    if (!picked) {
      throw new Error(`Unknown tree id ${options.treeId}`);
    }
    return [picked];
  }

  for (const slot of profile.slots) {
    if (slot.type === 'pinned') {
      for (const id of slot.treeIds) {
        const pinned = bank.find((tree) => tree.id === id);
        if (!pinned) throw new Error(`Missing pinned tree ${id}`);
        if (used.has(pinned.id)) {
          throw new Error(`Pinned tree ${id} already used in session`);
        }
        used.add(pinned.id);
        result.push(pinned);
      }
      continue;
    }

    const pool = bank.filter((tree) => tree.category === slot.category && !used.has(tree.id));
    for (let i = 0; i < slot.count; i++) {
      if (pool.length === 0) {
        throw new Error(`Profile ${profile.id} cannot fill: empty ${slot.category} pool`);
      }
      const index = Math.floor(random() * pool.length);
      const [chosen] = pool.splice(index, 1);
      used.add(chosen.id);
      result.push(chosen);
    }
  }

  return result;
}

function countByCategory(bank: QuestionTree[]): Partial<Record<InterviewCategory, number>> {
  const counts: Partial<Record<InterviewCategory, number>> = {};
  for (const tree of bank) {
    counts[tree.category] = (counts[tree.category] ?? 0) + 1;
  }
  return counts;
}

/** Compact subtitle under each profile on the start screen. */
export function formatProfileSummary(profile: InterviewProfile): string {
  const parts: string[] = [];
  for (const slot of profile.slots) {
    if (slot.type === 'count') {
      parts.push(`${slot.count} ${CATEGORY_LABEL[slot.category]}`);
    } else {
      parts.push(`${slot.treeIds.length} pinned`);
    }
  }
  const report = profile.reportMode === 'perAttempt' ? 'feedback each attempt' : 'end report';
  return `${parts.join(' · ')} · ${report}`;
}

/** Behavioral trees offered in the optional drill picker. */
export function behavioralTreesForPicker(bank: QuestionTree[]): QuestionTree[] {
  return bank.filter((tree) => tree.category === 'behavioral');
}
