/**
 * Seniority-mode server pieces (tickets 013 + 015). SCAFFOLD: the report call returns mock data
 * and the live-token endpoint is not implemented yet — both are marked below.
 */

export interface TranscriptTurn {
  speaker: 'interviewer' | 'candidate';
  text: string;
}

// Mirror of client/src/seniority/report.ts — the flat shape pinned as Gemini's response_format.
// The unions are kept in step with the client's on purpose (tickets 012/015); a stray literal must
// fail to type-check here, not just on the client. Server and client stay separate packages (same
// split as api.ts / rubric.ts), so the shape is duplicated rather than imported across the boundary.
type Tier = 'Lead Self' | 'Lead Others' | 'Lead the Business';
type TierLevel = 'absent' | 'emerging' | 'demonstrated';
type FrameFamily = 'Order-taker' | 'Bystander' | 'Small-scope' | 'Luck' | 'Too-junior' | 'False-modesty';
type AntiSignal = 'we-not-i' | 'hedging' | 'unquantified' | 'passivity' | 'frame-acceptance';

export interface SeniorityReport {
  headline: string;
  ladder: { tier: Tier; level: TierLevel; note: string; quote: string }[];
  framesFaced: { frame: FrameFamily; reframed: boolean }[];
  probeDecode: {
    measuring: string;
    whatYouDid: string;
    seniorMove: string;
    frame: FrameFamily | 'none';
  }[];
  flags: { type: AntiSignal; quote: string; note: string }[];
  overallSummary: string;
  fixIts: string[];
}

/**
 * Generate the report from the transcript.
 *
 * TODO(015): call gemini-3.6-flash via the Interactions API with `response_format` set to the flat
 * SeniorityReport schema (and NEVER response_mime_type alongside it — the 001/006 gotcha). Prompt
 * carries ticket 012's competency model. For now, return a fixed mock so the client renders.
 */
export async function generateSeniorityReport(transcript: TranscriptTurn[]): Promise<SeniorityReport> {
  void transcript; // TODO(015): the real call reads this.
  return {
    headline:
      'Strong owned evidence at Lead Self, but Lead Others only showed up second-hand and Lead the Business was absent.',
    ladder: [
      { tier: 'Lead Self', level: 'demonstrated', note: 'You owned your outcomes and standards clearly.', quote: 'I decided to cut the scope so we could ship.' },
      { tier: 'Lead Others', level: 'emerging', note: 'Team influence was claimed but stayed collective.', quote: 'We shipped the redesign together.' },
      { tier: 'Lead the Business', level: 'absent', note: 'No org-level impact surfaced — worth reaching for next time.', quote: '' },
    ],
    framesFaced: [
      { frame: 'Order-taker', reframed: true },
      { frame: 'Small-scope', reframed: false },
      { frame: 'False-modesty', reframed: false },
    ],
    probeDecode: [
      {
        measuring: 'whether you shape direction or just take orders',
        whatYouDid: 'agreed and moved on',
        seniorMove: 'surface the scope-pushback story to reframe it at the tier you actually operated',
        frame: 'Order-taker',
      },
    ],
    flags: [
      { type: 'we-not-i', quote: 'we decided to cut the feature', note: "you owned this call — 'we' hides your decision" },
    ],
    overallSummary: 'A solid screen let down by caving under two frames and never surfacing org-level impact.',
    fixIts: [
      'Go into the next screen with one story where you drove scope beyond your tickets, and lead with it.',
      'When an interviewer minimises your work, name the business outcome before agreeing.',
    ],
  };
}
