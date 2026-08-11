# Prototype (throwaway): Seniority mode — two-tab UX wireframes

Rough ASCII wireframes to react to for ticket 017. Not code, not final — a fidelity-raiser for the
grilling. Reuses the existing design language (narrow centered column, `--accent/--surface/--border/
--muted` tokens, guided-steps one-thing-at-a-time). Absorb on close; the decisions live in the
ticket answer.

Constraints it must respect:
- **013:** interviewer speaks (native audio), turns stream, both sides auto-transcribed, ~15-min cap,
  reconnection must be invisible.
- **014:** *the interview is realistic, the report is the teacher* — nothing scored, named, framed, or
  coached **during** the conversation. ~6–8 turns, warm no-verdict close.
- **015:** the report is a batch call over the transcript (a few seconds), renders headline + 3 tier
  cards + probe decode + frames scoreboard + flags + summary + fix-its.
- **016 (in flight):** session seeding — kept as a parameter below, not resolved here.

---

## Screen 0 — Two-tab shell

```
┌───────────────────────────────────────────────┐
│  Starling                                       │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Behavioral   │  │ Seniority screen  ●  │    │   ← tabs, top of shell
│  └──────────────┘  └──────────────────────┘    │
├───────────────────────────────────────────────┤
│                                                 │
│          (active mode's screen here)            │
│                                                 │
└───────────────────────────────────────────────┘
```

- Behavioral tab = today's practice screen, **unchanged**, just framed by the shell.
- Default tab on load: **Behavioral** (the proven mode) — open question.
- Switching tabs mid-interview: **warn + confirm** (a live session would be lost) — open question.

---

## Screen 1 — Session start (seeding surfaces here; 016 pending)

```
┌───────────────────────────────────────────────┐
│              Seniority screen                   │
│                                                 │
│   A ~25-min culture-fit screen with a manager   │
│   two levels up. They'll ask, listen, and       │
│   push. Afterwards you get a coaching report.    │
│                                                 │
│   [ 016 seeding controls go here, if any ]      │
│                                                 │
│              ┌───────────────────┐              │
│              │  Start interview  │              │
│              └───────────────────┘              │
│                                                 │
│   🎤 mic access needed · ~15 min · find a       │
│      quiet room                                  │
└───────────────────────────────────────────────┘
```

- The 016 block is a **slot**: nothing / an archetype picker / a difficulty toggle — whatever 016
  lands on. UX reserves the space and stays agnostic.

---

## Screen 2 — The live conversation (TWO VARIANTS to choose between)

### Variant A — Minimal, one turn at a time (matches guided-steps)

Only the current interviewer turn is on screen. Feels like a phone call — you're *in* it, not
reading a chat log. No history, no progress meter (progress meters break realism).

```
┌───────────────────────────────────────────────┐
│                              ●●●●● interviewer  │  ← speaking indicator (audio playing)
│                                                 │
│   "So walk me through a project you're proud    │
│    of — what was your part in it?"              │  ← current turn, text under the audio
│                                                 │
│   ▶ replay                                      │
│                                                 │
│   ─────────────────────────────────────────    │
│                                                 │
│              ┌───────────────────┐              │
│              │   Hold to answer  │  ⏺           │  ← your turn: record
│              └───────────────────┘              │
│                                                 │
│   (recording…  your words appear live here as   │
│    they're transcribed, then you send)          │
└───────────────────────────────────────────────┘
```

### Variant B — Chat transcript, streaming (a scrolling log)

The whole conversation accumulates as a chat, interviewer left / you right. Audio plays *and* text
streams in. You can scroll back. More reassuring, more "app", less "real interview".

```
┌───────────────────────────────────────────────┐
│  ⟳ connected                          02:14     │  ← quiet timer (or omit?)
│                                                 │
│  Interviewer                                    │
│  ┌─────────────────────────────────────┐       │
│  │ So walk me through a project you're  │ ▶     │
│  │ proud of — what was your part in it? │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│                        ┌──────────────────────┐ │
│                        │ So last quarter I led │ │  ← you (transcribed)
│                        │ the migration off…    │ │
│                        └──────────────────────┘ │
│                                                 │
│  Interviewer                                    │
│  ┌─────────────────────────────────────┐       │
│  │ Who decided that was worth a whole  │ ▶     │
│  │ quarter?                             │       │
│  └─────────────────────────────────────┘       │
│  ────────────────────────────────────────────  │
│              [ ⏺ Hold to answer ]               │
└───────────────────────────────────────────────┘
```

**The tension:** Variant A is truer to a real screen (the mode's whole point) and matches
guided-steps; Variant B is friendlier and lets you re-read a frame you're deciding whether to push
back on — but a scrollback + timer nudges you out of the interview and toward "using an app."

### End-of-interview transition (either variant)

```
   Interviewer: "Thanks — that's everything I wanted to cover. Good talking with you."
                              │
                              ▼
   ┌───────────────────────────────────┐
   │   ◠ Writing up your report…        │   ← 015 batch call (a few seconds)
   └───────────────────────────────────┘
                              │
                              ▼
                        Screen 3
```

---

## Screen 3 — The report (renders the 015 contract)

```
┌───────────────────────────────────────────────┐
│   Your seniority screen                         │
│                                                 │
│   ▓ HEADLINE ─────────────────────────────────  │
│   Strong owned evidence at Lead Self, but Lead  │  ← 015 `headline`, prose, advisory
│   Others only showed up second-hand and Lead    │
│   the Business was absent.                      │
│                                                 │
│   ▓ WHERE YOU LANDED ─────────────────────────  │  ← 015 `ladder[]` — 3 cards
│   ┌───────────────┐┌───────────────┐┌─────────┐│
│   │ Lead Self     ││ Lead Others   ││ Lead    ││
│   │ ● demonstrated││ ◐ emerging    ││ Business││
│   │ "I decided to ││ "we shipped   ││ ○ absent││
│   │  cut scope…"  ││  the redesign"││ (no     ││
│   │ note…         ││ note…         ││  evid.) ││
│   └───────────────┘└───────────────┘└─────────┘│
│                                                 │
│   ▓ FRAMES YOU FACED ─────────  reframed 1 of 3 │  ← 015 `framesFaced[]` scoreboard
│   ✓ Order-taker      reframed                    │
│   ✗ Small-scope      accepted                    │
│   ✗ False-modesty    accepted                    │
│                                                 │
│   ▓ WHAT EACH QUESTION WAS MEASURING ─────────  │  ← 015 `probeDecode[]`
│   1 · "walk me through a project…"  [Order-taker]│
│      measuring → whether you shape or just take  │
│      what you did → agreed, moved on             │
│      senior move → surface the scope-pushback…   │
│   2 · "who decided that…"                        │
│      …                                           │
│                                                 │
│   ▓ LANGUAGE FLAGS ───────────────────────────  │  ← 015 `flags[]`, quotes
│   • we-not-I   "we decided to cut the feature"   │
│     → you owned this call; 'we' hides it         │
│   • hedging    "it was kind of a small thing"    │
│                                                 │
│   ▓ FOR YOUR NEXT SCREEN ─────────────────────  │  ← 015 summary + fixIts
│   A solid screen let down by caving twice and…   │
│   → Lead with a story where you drove scope…     │
│   → Name the business outcome before agreeing…   │
│                                                 │
│   ┌──────────────────┐  ┌────────────────────┐  │
│   │ New interview    │  │ Back to behavioral │  │
│   └──────────────────┘  └────────────────────┘  │
└───────────────────────────────────────────────┘
```

- Long, single scroll, sections in a fixed order (headline first = the gist, fix-its last = what to
  do next). Reuses `FeedbackPanel`'s card/quote visual language.
- Ordering is a decision: is "frames scoreboard" or "probe decode" the hero? (Frames = the mode's
  signature; decode = the richest artifact.)

---

## Open decisions this artifact surfaces (for the grilling)

1. **Default tab** on load — Behavioral, or Seniority?
2. **Tab-switch mid-interview** — warn/confirm, block, or silently discard?
3. **Conversation screen: Variant A (minimal) vs B (chat log)** — the crux.
4. **Live transcript of *your* answer** — show it as you speak, or stay audio-only like the
   behavioral mode?
5. **Any on-screen progress signal** (timer / turn count) — or nothing, to protect realism?
6. **Report ordering / hero** — which section leads after the headline.
7. **Report persistence** — is the report a throwaway screen, or saved (ties to the map's
   "persist & compare reports" fog)?
