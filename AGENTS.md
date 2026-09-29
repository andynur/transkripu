# AGENTS.md — Transkripu

Local web app (macOS, Apple Silicon) that transcribes uploaded media or a YouTube/web URL with `mlx_whisper` and serves SRT/VTT/TXT/JSON. Flask backend + vanilla JS UI, no build step. Styling follows the Atlassian Design System (Jira).

## Commands
| Purpose | Command |
|---|---|
| Verify (run after every change) | `python3 scripts/smoke_test.py` → prints `PASS n/n` |
| Run app | `./start.command` → http://127.0.0.1:8765 |
| Run headless | `TRANSKRIPU_NO_BROWSER=1 python3 app.py` |
| JS syntax (if node exists) | `node --check static/app.js` |

The smoke test needs no GPU/network: it shadows tools with `scripts/stubs/*` via `TRANSKRIPU_PATH_PREPEND` and uses a temp data dir. Real transcription only works on the user's Mac.

## Code map (grep the anchor, then read only that range)
| File | What | Anchors |
|---|---|---|
| `app.py` | config, tool discovery, job persistence, subprocess runner, pipeline, API | `MODELS =`, `def resolve_tools`, `def update`, `def run_process`, `def step_download`, `def step_transcribe`, `def process_job`, `def guard_request`, `@app.` |
| `static/app.js` | `I18N` dict (top ~250 lines), render + event code below | `const I18N`, `function renderDetail`, `function renderJobs`, `function submit`, `event wiring` |
| `static/app.css` | design tokens on `:root` and `:root[data-theme="dark"]`, then components | `/* ----------` section comments |
| `static/index.html` | markup; visible text via `data-i18n*` attributes | ids: `createForm`, `jobRows`, `drawer` |
| `scripts/smoke_test.py` | end-to-end API checks + i18n key parity | `def main` |
| `docs/ai/NOTES.md` | decisions & gotchas log | read when touching the pipeline |

Job state: `data/jobs/<id>/job.json` (+ `log.txt` with every tool command and its output).

## Invariants (do not break)
1. **Backend sends codes, UI owns text.** New status/stage/error → add a key in `app.py` and the matching strings in **both** `I18N.en` and `I18N.id`. English is the default UI language.
2. **External tools run as subprocesses** (`yt-dlp`, `mlx_whisper`, `ffprobe`); never import them into the server.
3. **One worker, sequential jobs.** GPU-bound; don't parallelize.
4. **No new dependencies or build tooling** (Flask only, vanilla JS/CSS) without asking.
5. **Bind to 127.0.0.1.** The API has no auth.
6. **UI uses CSS tokens only** (no hard-coded colors in components); every change must look right in light (default) and dark.
7. **API changes** → update the API table in `README.md`. **New env var** → README config table.
8. Never read or commit `data/`, `.venv/`, or media files.

## Workflow
1. Restate the task in one line. Ask only if it is ambiguous **and** costly to redo; otherwise pick the reasonable reading and state it.
2. Locate with `grep -n`; read targeted ranges (`offset/limit`), not whole files.
3. Make the smallest diff that solves it; prefer Edit over rewriting files.
4. Run `python3 scripts/smoke_test.py`. Extend it when you add an endpoint, stage or error code.
5. If you made a non-obvious decision or hit a gotcha, add one line to `docs/ai/NOTES.md`.
6. Report in ≤6 lines: what changed, files touched, verification result, anything the user must check on the Mac (UI look, real model run).

## Token discipline
- Don't read `README.md`, the whole `app.js`, or `app.css` unless the task is about them. The I18N block is long; grep the key you need.
- Don't re-read a file after editing it; don't paste whole files or long logs into replies (`tail -n 30`).
- Batch related edits into one pass; don't narrate each step.
- Don't create new docs unless asked; update the existing ones.

## Definition of done
Smoke test passes · both i18n dictionaries updated · README/NOTES updated when relevant · no stray debug code · summary given.
