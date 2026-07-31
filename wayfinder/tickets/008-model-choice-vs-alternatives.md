# Model choice: Gemini vs alternatives (Gemma, OpenAI, AWS, Azure)

- Type: wayfinder:research
- Status: closed
- Assignee: Diogo Vaz (diogo.vaz@bynd.com)
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

Is `gemini-3.6-flash` (chosen in ticket 001) actually the right model, versus other Gemini
tiers, self-hosted Gemma, or a competing provider (OpenAI, AWS Bedrock, Azure)? Also: could a
cheaper/other Gemini model or Gemma work? Complements ticket 001. (User-requested research.)

## Answer

Full findings: [wayfinder/research/model-comparison.md](../research/model-comparison.md).

- **Keep `gemini-3.6-flash`.** It's the only option that combines native audio input +
  genuine JSON-schema structured output + audio priced the same as text ($1.50/1M in), all
  behind a plain API key. Newest Flash tiers (3.5/3.6) have unified audio/text pricing; every
  older Gemini tier (2.5-flash, 2.5-flash-lite, 3.1-flash-lite) surcharges audio 2–3x, and
  `gemini-2.5-pro` costs ~7x the output for no rubric-quality benefit.
- **Fallback model:** `gemini-3.5-flash` (same audio pricing, slightly pricier output) if 3.6
  has an outage or quality regression.
- **Gemma is off the table** here: only small variants (E2B/E4B/12B) take audio, capped at
  **30-second clips**, and it's open-weights only (self-host, no hosted API) — more work for
  less capability, with no cost/privacy requirement driving it.
- **OpenAI `gpt-audio` is the closest competitor** but **cannot do audio-in + structured JSON
  in one call** (Structured Outputs "Not supported" on that model) — a direct disqualifier.
  This is the single finding that *would* flip the decision if it were reversed. Worth
  remembering if Gemini pricing/availability/policy ever changes.
- **AWS Nova 2 Sonic / Azure** don't add a better fit (streaming speech-to-speech, or
  re-hosted OpenAI behind heavier account overhead).
- **Transcribe-then-text fallback** documented (`gpt-4o-transcribe`, Deepgram Nova-3,
  AssemblyAI) if audio-native feedback quality ever disappoints — relevant to ticket 002.
