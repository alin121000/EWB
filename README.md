# Ghana Field Notebook — EWB Israel Delegation

A lightweight, mobile-first field notebook for the Engineers Without Borders Israel delegation to Ghana. Not a CRM, not a project-management tool — a shared notebook for capturing what happens in the field, turning it into tasks and follow-ups, sending daily updates to the team in Israel, and leaving with a clear handover plan.

## Stack

- **Server**: Node.js + Express + SQLite (`better-sqlite3`), zero external services required. Photo uploads are stored on disk.
- **Client**: React + Vite, plain CSS (mobile-first, bottom nav, big touch targets), no UI framework.
- **AI**: Daily updates and the delegation executive summary are generated via the Anthropic API when `ANTHROPIC_API_KEY` is set. Without a key, the app falls back to a clean deterministic template built from the same structured data — the app is fully usable with zero configuration.
- **Offline**: the client queues writes (including photos) in `localStorage` when the network is unavailable and replays them automatically on reconnect; a sync indicator shows pending/offline state. A minimal service worker caches the app shell so the app can still open with no signal.

## Running it

### Development

```bash
cd server && npm install && npm run dev   # http://localhost:4000 (API)
cd client && npm install && npm run dev   # http://localhost:5173 (UI, proxies /api to :4000)
```

Open `http://localhost:5173` on your phone or desktop browser.

### Production (single server)

```bash
cd client && npm install && npm run build   # builds client/dist
cd ../server && npm install && npm start    # serves API + built client on :4000
```

### Environment variables (all optional)

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port (default `4000`) |
| `ANTHROPIC_API_KEY` | Enables AI-generated daily updates / executive summary. Without it, a template generator is used instead. |
| `ANTHROPIC_MODEL` | Overrides the model used for generation (default `claude-sonnet-5`) |

## Data

Everything is stored in `server/data/ewb.sqlite` (created automatically on first run) and `server/uploads/` for photos. Both are gitignored — back up that folder if you want to keep delegation data.

Five workstreams are preloaded (Wheelchairs / ALYN, Afeka / Documentation & Media, University / Innovation Hub, Students / Local Collaboration, General Delegation). They can be renamed or added to from the Workstreams tab — nothing is hard-coded beyond the initial seed.

## Using the app

1. **Open the app** — one-time prompt for your name (remembered per device, attached to everything you add — no repeated sign-in).
2. **+ Add** (always visible) — capture Field Feedback, a Task, a Daily Note, an Insight, a Photo, a Meeting, or a quick Idea in under 20 seconds.
3. **Today** — day number, focus, current location, open tasks, latest field updates, and workstream cards at a glance.
4. **Daily Log** — the day's running notebook: quick notes, plus lightweight sections for meetings, findings, decisions, problems and follow-ups. Nothing is required.
5. **Generate Daily Update** — turns the day's raw notes into a short WhatsApp/email-ready update (AI or template), editable, copyable, regeneratable.
6. **Close Day** — a fast end-of-day review that surfaces everything captured that day and lets you generate the update and close.
7. **Tasks** — a single shared list, filterable by workstream/owner/status, with an "After Delegation" filter for post-trip follow-ups.
8. **Delegation Review** — an auto-organized final summary by workstream plus a bucketed follow-up plan (Immediate / Short Term / Longer Term).
9. **Export** — pick sections and generate a clean shareable document (Markdown download or print-to-PDF).

Field feedback marked "requires follow-up" can create a task in one tap; that task then shows up on its workstream card, in the daily close-day review, and in the final follow-up plan — nothing needs to be entered twice.
