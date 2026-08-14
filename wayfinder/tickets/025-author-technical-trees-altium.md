# Author technical question trees (Altium / frontend screen set)

- Type: wayfinder:task
- Status: resolved
- Assignee: Auto (agent)
- Blocked by: 018
- Parent: wayfinder/map-unified-interview.md

## Question

Author the first **technical** trees from the Renesas/Altium spoken portion (fixture:
`/Users/diogo.vaz/Documents/Entrevistas/Altium/questions-portion.srt` + question list in map
Notes). Minimum set:

1. Browser URL → enter (follow-up: broken HTML / missing closing tag)
2. REST (follow-ups: GET vs POST; password in GET query params)
3. HTTP vs HTTPS (follow-up: encryption vs obfuscation)
4. CORS (follow-up: why it exists)
5. Event loop (follow-ups: microtasks vs macrotasks as needed)

Each tree follows the bank schema from [018](018-unified-question-bank-schema.md). Follow-up pool
sized for AI picker [021](021-ai-follow-up-picker.md). Train the **class**, not the Altium script.

Deliverable: tree entries ready to drop into the bank file; not wired into the app (wiring is
implementation).

## Answer

Authored 2026-08-14. Five `QuestionTree` entries live in
[`wayfinder/assets/025-technical-trees.ts`](../assets/025-technical-trees.ts) (`TECHNICAL_TREES_V1`).
Schema matches [018](018-unified-question-bank-schema.md). Not wired into the app.

| Tree id | Theme | Main (gist) | Required follow-ups | Pool size |
|---------|-------|-------------|---------------------|-----------|
| `tech-browser-url-enter` | `browser` | URL → Enter → page on screen | missing close tag | 5 |
| `tech-rest` | `http-apis` | What REST means for client↔server | GET vs POST; password in GET query | 6 |
| `tech-http-vs-https` | `transport-security` | HTTP vs HTTPS | encryption vs encoding/obfuscation | 4 |
| `tech-cors` | `browser-security` | What CORS is + cross-origin flow | why it exists | 5 |
| `tech-event-loop` | `javascript-runtime` | Event loop + what runs next | microtasks vs macrotasks | 5 |

**Authoring rules used**

- Questions train the topic **class** (general interview wording), not a replay of the Altium
  transcript. Fixture informed weak spots: REST acronym/protocol confusion, password-in-GET,
  encryption vs obfuscation, CORS “what” without “why”, micro/macrotask mix-up.
- Ids: `tech-<topic>` trees; `${treeId}-main` / `${treeId}-<slug>` questions.
- Pools are unordered; tags hint the picker (`why`, `security`, `depth`, `correctness`, …).
  Ticket-listed probes are `required: true`. Extra optional probes give the picker room to
  dig without inventing text.
- Fills the five technical slots for the Frontend technical profile ([019](019-interview-profile-config.md)).

**Out of this ticket:** drop into `@starling/bank`, picker wiring ([021](021-ai-follow-up-picker.md)),
more technical trees beyond this screen set.
