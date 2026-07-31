# Persist attempt history across sessions

- Type: wayfinder:grilling
- Status: closed
- Assignee: claude
- Blocked by: (none)
- Parent: wayfinder/map.md

## Question

Surfaced while grilling ticket 003 (question bank): the user wants a persistent record of past
attempts — the question, the feedback received, and enough of the answer to "read back the
conversation" — that survives across sessions (not just in-memory for one browser tab), so
retries can be reviewed later. This graduates the map's "Progress tracking / history
persistence" fog item into a real ticket.

- What gets stored per attempt? (question id, timestamp, feedback JSON — and does "read the
  conversation" mean storing a transcript of the spoken answer, the raw audio, or neither
  beyond the feedback itself?)
- Storage choice: client-only (`localStorage`/IndexedDB) vs a real backend + database? The
  server today (`server/`) is a stateless Gemini proxy — this would be the project's first
  stateful requirement.
- Scope: history per question, or one global timeline across all questions/categories?
- Retention: keep forever, cap by count/age, or user-managed deletion?
- Relation to the still-unspecified "comparing attempts over time / trends" fog item — is
  that this ticket's job too, or does it stay separate and later?
- Single machine vs "wherever I open it"? The map already scopes this as a single-user
  personal tool (not multi-user) — but persistence could still mean local-only or synced.

Deliverable: the storage architecture + data model for attempt history, recorded in the
ticket answer.

## Answer

**Single machine/browser only.** No accounts, no sync, no backend involvement — `server/`
stays the stateless Gemini proxy it is today. If cross-device history is ever wanted, that's a
fresh future ticket, not an extension of this one.

**Storage mechanism: `localStorage`**, holding a single JSON-serialized array of attempt
records. At this record size (no audio, no transcript — see below) a personal practice tool is
nowhere near the ~5–10 MB quota, so `localStorage`'s synchronous, dependency-free API wins over
`IndexedDB`'s added complexity (async, versioned object stores) — that complexity only pays off
for blobs or large queryable datasets, neither of which applies.

**Data model: one flat global list, tagged by `questionId`.** Not partitioned per-question —
a flat array lets the UI filter to "this question's history" or show everything across the
bank without two separate storage shapes. Each record:

```ts
interface Attempt {
  id: string; // e.g. crypto.randomUUID()
  questionId: string;
  timestamp: string; // ISO 8601
  feedback: Feedback; // the existing Feedback shape from client/src/api.ts
}
```

**What's stored per attempt: feedback only** — `questionId`, `timestamp`, and the `Feedback`
JSON (dimensions/notes, fixIts, overallSummary, interviewReady). Explicitly **not** stored:
- A transcript of the spoken answer — none exists today (the pipeline is audio-native, per
  tickets 006/008); generating one would mean a Gemini schema/prompt change, a separate product
  decision. Flagged in the map's fog, not folded into this ticket.
- The raw audio blob — would multiply per-attempt storage size for little payoff (replay is a
  rarely-used feature for this use case) and was ruled out rather than deferred.

**Retention: keep forever, no auto-cap or expiry.** The user can manually delete one or several
entries (bulk delete), so history growth is under the user's control rather than silently
pruned — auto-capping by count/age risked deleting attempts the user still wanted to review,
which works against this ticket's whole point.

**Relation to "comparing attempts over time / trends":** stays a separate, still-unspecified
fog item. This ticket's job ends at the data model + a plain history list (view/delete); trend
or comparison views are a UI/analysis layer built on top of it, better scoped once the plain
list exists and its use is visible.
