# Starling

Voice-based interview practice: written questions on screen, spoken audio answers, structured coaching feedback.

## Language

**Question**:
One written prompt on screen and one spoken audio answer. The speakable unit inside a tree.
_Avoid_: Part, Prompt (for this unit), Ask, Node

**Question tree**:
One bank entry: a main `Question` plus an unordered follow-up pool of `Question`s. Pre-authored; the AI picks from the pool and does not invent questions.
_Avoid_: Question (alone for the bank entry), Scenario, Seed (for the bank entry)

**Interview category**:
Top-level bank axis for v1: `behavioral`, `technical`, or `seniority`.
_Avoid_: Mode, Tab, Theme (for this axis)

**Behavioral theme**:
Finer tag on a behavioral tree — the former seven flat categories: leadership, conflict, failure, teamwork, ambiguity, impact, prioritization.
_Avoid_: Category (for these seven)

**Follow-up pool**:
The `followUps` list on a question tree. Unordered. The batch picker selects the next `Question` by id, or ends the tree.
_Avoid_: Script, Live probes, Improvised questions

**Interview profile**:
A named preset that defines which question trees run in a session (via slots), how trees are picked, and which report shape to use. Edited in a config file in v1.
_Avoid_: Mode, Tab, Track

**Profile slot**:
One step in a profile’s tree mix: either a category count (random fill) or a pinned list of tree ids. Session order follows the slots list, contiguous.
_Avoid_: Round, Segment (for this unit)

**Report mode**:
Profile-owned report shape: `endReport` (one report after the full session) or `perAttempt` (feedback after each attempt — Behavioral drill only in v1).
_Avoid_: Feedback mode, Review mode (for this axis)

**Review stance**:
Session dial the user picks before start: **Practice** (listen and re-record before submit) or **Simulation** (submit at once). Not stored on the profile.
_Avoid_: Review mode, Drill mode (for this dial; Drill is the Behavioral drill profile name)

**Technical feedback**:
Per-question-tree coaching scores on Correctness, Completeness, and Clarity (1–5 + note each), plus fix-its and an advisory interview-ready flag. Individual questions in the tree are evidence only.
_Avoid_: Per-question technical score, Delivery (on technical), Examiner score

**End report**:
One coaching object after a full `endReport` session: a session summary plus deep dives for each interview category present. Behavioral drill does not use it.
_Avoid_: Final grade, Hire decision, Session scorecard

**Session summary**:
The top of an end report — headline, overall read, and cross-category top fix-its — produced from prior score JSON, not a second audio pass.
_Avoid_: Overall score, Session interviewReady

**Deep dive**:
The per-category section of an end report: an array of per-tree blocks for behavioral or technical, or one session-level seniority block.
_Avoid_: Category report, Sub-score (alone)
