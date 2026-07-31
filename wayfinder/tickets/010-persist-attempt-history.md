# Persist attempt history across sessions

- Type: wayfinder:grilling
- Status: open
- Assignee:
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
