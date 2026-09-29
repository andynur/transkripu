# Transkripu

A local web app that turns lecture videos and audio into transcripts and subtitles, running entirely on your Apple Silicon Mac with [mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper).

- **Inputs:** local files (MP4, MOV, MKV, MP3, M4A, WAV, …) or a YouTube/web URL via [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Outputs:** SRT, VTT, TXT, TSV, JSON
- **UI:** live progress with streaming text, media player synced to the transcript (click a line to seek), search, copy, and Reveal in Finder
- **Extras:** EN/ID interface, light/dark theme (light by default), per-stage timings
- **Privacy:** nothing leaves your machine except the one-time model download and URL downloads

UI styling follows the Atlassian Design System (Jira).

---

## Quick start

### 1. Install prerequisites (once)

```bash
brew install python ffmpeg yt-dlp deno pipx
pipx ensurepath          # then open a new Terminal window
pipx install mlx-whisper
```

| Tool | Why |
|---|---|
| `python` (3.10+) | Runs the Flask server. The launcher avoids macOS's bundled Python 3.9. |
| `ffmpeg` / `ffprobe` | Decodes media for Whisper; reads duration for progress. |
| `mlx-whisper` | Whisper on the Apple GPU via MLX. |
| `yt-dlp` + `deno` | Downloads audio from URLs. Deno is required by recent yt-dlp for YouTube. Optional if you only use local files. |
| An LLM provider | Optional. Writes the **AI recap** (study notes) and answers **chat** questions about a finished transcript. Pick one under ⚙ **AI settings**: a Gemini/Groq/SumoPod API key, a local Ollama/LM Studio, or the `claude` / `codex` CLI with your own login. See [Choosing a provider](#choosing-a-provider). |

### 2. Run

```bash
./start.command
```

Or double-click `start.command` in Finder (the first time, right-click → **Open** to get past Gatekeeper). The launcher creates `.venv/`, installs Flask, starts the server and opens **http://127.0.0.1:8765**.

The first transcription downloads the selected model into `~/.cache/huggingface` (about 1.6 GB for Large v3 Turbo). After that everything works offline.

Stop the server with **Ctrl+C**, by closing the Terminal window, or by double-clicking `stop.command`.

If Transkripu from this folder is already running, `start.command` just opens the browser. If another program (or an old copy of Transkripu in a different folder) holds the port, it shows that program's pid and folder and stops.

**Optional: a Dock app.** Open Automator → New → Application → add **Run Shell Script** with `open -a Terminal "/path/to/transkripu/start.command"`, then save it as `Transkripu.app` outside the repo and drag it to the Dock.

---

## Project layout

```
transkripu/
├── app.py              # Flask server, job queue, yt-dlp / mlx_whisper integration
├── whisper_worker.py   # long-lived mlx_whisper process (keeps the model loaded between jobs)
├── requirements.txt    # Python deps for the server (Flask only)
├── start.command       # macOS launcher: venv + deps + run (reuses a running instance)
├── stop.command        # stops the server on the configured port
├── static/
│   ├── index.html      # markup; text comes from data-i18n keys
│   ├── app.css         # design tokens (light + [data-theme="dark"]) and components
│   └── app.js          # UI logic, i18n dictionary, polling
├── scripts/
│   ├── smoke_test.py   # end-to-end API test with stubbed tools (no GPU needed)
│   └── stubs/          # fake mlx_whisper / yt-dlp (CLI + pylib/ package) used by the smoke test
├── AGENTS.md           # guide for AI coding agents (commands, code map, rules)
├── CLAUDE.md           # imports AGENTS.md for Claude Code
├── .claude/commands/   # /feature, /fix, /review, /handoff for Claude Code
├── docs/ai/
│   ├── MASTER_PROMPT.md  # copy-paste prompts for any agent
│   └── NOTES.md          # one-line decisions & gotchas log
└── data/               # created at runtime (git-ignore this)
    ├── transkripu.db     # SQLite: chat history (table chat_messages, keyed by job id)
    └── jobs/<job_id>/
        ├── job.json          # job state (source of truth, reloaded on start)
        ├── source.<ext>      # uploaded or downloaded media
        ├── source.info.json  # yt-dlp metadata (URL jobs)
        ├── log.txt           # full stdout/stderr of every tool invocation
        ├── segments.json     # [{start, end, text}] used by the UI
        ├── recap.md          # AI recap (optional)
        └── transcript.{srt,vtt,txt,tsv,json}
```

## How it works

```
Browser ──HTTP──▶ Flask (app.py)
                    │  POST /api/jobs  → job.json + work_queue
                    ▼
              worker thread (one job at a time)
                    │
     URL job ──▶ yt-dlp  -f bestaudio[ext=m4a]/bestaudio -N 4   → source.<ext>
                    │
                    ▼
              whisper_worker.py (model stays loaded)             → transcript.*
              or: mlx_whisper <media> --output-format all
                    │  stdout "[mm:ss.xxx --> mm:ss.xxx] text" is parsed live
                    ▼
              job.json updated (status, stage, progress, timings)
Browser polls /api/jobs every 1.2 s while something is running (5 s when idle,
30 s in a background tab); an unchanged list answers 304 via its ETag.
```

- **One worker, sequential jobs.** Whisper saturates the GPU, so parallel jobs would only compete for it.
- **External CLIs, not imports.** `yt-dlp` and `mlx_whisper` run as subprocesses, so they can live in their own pipx/Homebrew environments and be upgraded independently. If a CLI isn't on `PATH`, the app falls back to `python3 -m <module>` from any interpreter that can import it.
- **Warm model.** `whisper_worker.py` runs on the Python behind the `mlx_whisper` command (read from its pipx shim) and keeps the model in memory, so every job after the first skips the model load. It exits after 10 idle minutes, when the server stops, or on cancel, and the next job starts a new one. If it cannot start, the `mlx_whisper` CLI is used.
- **Progress.** Downloads map to 0–20% of the bar and transcription to 20–100% (0–100% for uploads), computed from each segment's end time divided by the `ffprobe` duration.
- **Cancel** sends `SIGTERM` to the subprocess's process group, which also stops `ffmpeg` children.
- **Restart safety.** Jobs that were running when the server stopped are marked `error` with `error_code: "interrupted"` and can be retried.

### Job model

`status`: `queued` → `downloading` (URL only) → `transcribing` → `done` | `error` | `cancelled`

`stage` is a machine-readable key that the UI translates: `queued`, `fetching_info`, `downloading_audio`, `loading_model`, `downloading_model`, `detecting_language`, `transcribing`, `done`, `failed`, `cancelled`. `stage_pct` and `stage_detail` carry the variable parts.

`error_code` is set for known failures (`interrupted`, `ytdlp_missing`, `mlx_missing`, `no_media`, `no_output`). `error` always holds the English or raw tool output.

`timings` holds `download`, `model_load` and `transcribe` in seconds.

Other fields the UI uses: `queued_at` (queue order), `transcribe_started` (ETA and speed while transcribing), `media_bytes`, `media_removed` (source deleted to save space), `edited` (a segment was corrected), and `options.condition_previous` (`false` = Whisper does not condition on the previous text, which reduces repetition loops).

## HTTP API

All endpoints are served on `127.0.0.1` only. The API has no authentication, so it refuses requests that another website could forge:

- a `Host` header other than `127.0.0.1`, `localhost` or `[::1]` on the configured port (blocks DNS rebinding);
- `Sec-Fetch-Site: cross-site`, or a non-GET request whose `Origin` differs from the app's own (blocks cross-site form posts).

Clients that send neither header, such as `curl` or scripts, are allowed.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health[?refresh=1]` | Tool availability, model IDs, language codes. `refresh` re-scans `PATH`. |
| `GET` | `/api/jobs` | All jobs, newest first (without segments). Sends an `ETag`; with a matching `If-None-Match` it answers `304`. |
| `GET` | `/api/jobs/:id[?since=N]` | One job including `segments` (live while running) and `recap` (Markdown, when `recap_status` is `done`). `ai_lang_default` is the default recap/chat language: the chosen spoken language, else the detected one (`ms` counts as `id`), else `en`. While live, `since` returns only segments from index `N`; `segments_from` gives the start index of the returned list and `segments_live` whether it is still growing. `?segments=0` leaves out a finished job's segments (`segments: null`). Finished jobs also report `disk_bytes` (size of the job folder). |
| `POST` | `/api/jobs` | Multipart form: `file` **or** `url`, plus `model`, `language` (`en`/`id`/`auto`), `prompt`, `cookies_browser` (`chrome`/`safari`/`firefox`/`edge`/`brave`), `condition_previous` (`0` turns off conditioning on the previous text). Uploads must have a known audio/video extension. One job per request; the UI posts several files or URLs one after another. |
| `POST` | `/api/jobs/:id/cancel` | Cancel a running or queued job. |
| `POST` | `/api/jobs/:id/retry` | Re-queue a finished, failed or cancelled job. Reuses already downloaded media and clears the previous outputs (including the recap and segment edits). An upload job whose media was deleted answers 409 `media_removed`; a URL job downloads it again. |
| `GET` | `/api/jobs/:id/chat[?after=ID]` | Chat history `{messages: [{id, role: user\|assistant\|error, text, created, meta}], after, total, busy, partial}`. `after` returns only messages with a higher id; `total` is the full count (a mismatch means the chat was cleared). `partial` is the answer streamed so far while `busy`. |
| `POST` | `/api/jobs/:id/chat` | JSON `{"text": "...", "lang": "en"\|"id"}` (max 4000 chars). Asks the chat route's provider about a `done` job (202); answers are written in `lang`, which is remembered as the job's `chat_lang` (default: `ai_lang_default`); the transcript, recap and last 20 messages are sent along. If the transcript exceeds the provider's `max_input_tokens`, only the best-matching segments are sent (`meta.excerpt`). Answers carry `meta.provider`, `meta.model`, `meta.fallback`. Errors: `empty_message`, `message_too_long` (400), `chat_not_ready`, `chat_busy` (409). A failed answer is stored as an `error` message with `meta.error_code` (an `llm_*` code or `chat_failed`). |
| `POST` | `/api/jobs/:id/chat/stop` | Stop the answer being written; the part received so far is stored with `meta.stopped`. |
| `DELETE` | `/api/jobs/:id/chat` | Clear the chat (409 `chat_busy` while answering). Retry and delete also clear it. |
| `POST` | `/api/jobs/:id/recap` | JSON `{"lang": "en"\|"id"}`, default `ai_lang_default`. Starts an AI recap of a `done` job with the recap route's provider (202). Progress via `recap_status` (`running`/`done`/`error`), `recap_stage` (`recap_map` with `recap_pct`, `recap_reduce`; chunked mode only: up to 3 parts are summarised at once, one at a time on Groq, Ollama and LM Studio) and `recap_error_code`. Done: `recap_provider`, `recap_model`, `recap_fallback`, `recap_chunks`. Errors: `recap_not_ready`, `recap_running` (409). |
| `GET` | `/api/settings[?refresh=1]` | LLM providers and routing. Keys are never returned: only `has_key`, `key_last4` and `key_source` (`file`/`env`). `status` per provider: `ready`, `local`, `no_key`, `no_url`, `not_installed`. `refresh` re-scans `PATH` for the CLIs. |
| `PUT` | `/api/settings` | Partial update `{"providers": {id: {base_url, api_key, model, max_input_tokens}}, "routing": {"recap"\|"chat": {provider, model, fallback: {provider, model}\|null}}}`. `api_key: ""` keeps the stored key, `null` deletes it; an empty `base_url`/`model` means the preset default; `max_input_tokens: 0` means no limit. Errors: `unknown_provider`, `invalid_url`, `invalid_settings`. |
| `POST` | `/api/settings/test` | JSON `{provider, model?}`. Sends a tiny prompt with the saved settings; returns `{ok, latency_ms, model, error_code?, error?}`. |
| `GET` | `/api/settings/models?provider=id` | Model IDs from the provider's `GET /models` (`[]` for CLIs). |
| `DELETE` | `/api/jobs/:id` | Cancel if needed and delete the job folder. |
| `GET` | `/api/jobs/:id/media` | Source media (supports HTTP Range for seeking). |
| `DELETE` | `/api/jobs/:id/media` | Delete the source media to free disk space; transcript, recap and chat stay (`media: null`, `media_removed: true`). 409 `job_running` while active. |
| `PUT` | `/api/jobs/:id/segments/:index` | JSON `{"text": "..."}` (whitespace collapsed, max 2000 chars). Corrects one segment of a `done` job and rewrites `segments.json` and every `transcript.*`. Errors: `empty_segment`, `segment_too_long` (400), `edit_not_ready` (409), 404 for an unknown index. |
| `GET` | `/api/jobs/:id/download/:fmt` | `srt`, `vtt`, `txt`, `tsv`, `json`, or `md` (the AI recap) as an attachment. |
| `POST` | `/api/jobs/:id/reveal` | Reveal the output in Finder (macOS). |

LLM error codes (recap, chat, test): `llm_no_key`, `llm_no_url`, `llm_auth` (401/403, or Gemini's 400 for a bad key), `llm_rate_limited` (429), `llm_context_too_long`, `llm_model_not_found` (404), `llm_server_error` (5xx), `llm_unreachable`, `llm_timeout`, `llm_bad_response`, `llm_cli_missing`, `llm_cli_failed`. After `llm_no_key`, `llm_no_url`, `llm_cli_missing`, `llm_rate_limited`, `llm_server_error`, `llm_unreachable` or `llm_timeout` the route's fallback provider is tried.

Validation errors return `{ "error_code": "...", "error": "..." }` with a 4xx status: `missing_input`, `invalid_url`, `unknown_model`, `unknown_language`, `unknown_browser`, `unsupported_file`, `job_running` (409), `forbidden` (403), `disk_full` (507).

Server events and unexpected errors (with tracebacks) are logged to the terminal and to `data/server.log`.

Example from the command line:

```bash
curl -F url="https://youtu.be/VIDEO_ID" -F language=id -F prompt="Data Structures, Dijkstra" \
     http://127.0.0.1:8765/api/jobs
```

## Configuration

Environment variables (set them before `./start.command`):

| Variable | Default | Purpose |
|---|---|---|
| `TRANSKRIPU_PORT` | `8765` | HTTP port |
| `TRANSKRIPU_HOST` | `127.0.0.1` | Bind address. Keep it local: the API has no authentication. With a non-loopback address the `Host` check is off and anyone on the network can use the app. |
| `TRANSKRIPU_DATA_DIR` | `./data` | Where job folders are stored |
| `TRANSKRIPU_NO_BROWSER` | unset | Set to any value to skip opening the browser |
| `HF_ENDPOINT` | unset | Hugging Face mirror, e.g. `https://hf-mirror.com` if huggingface.co is blocked |
| `TRANSKRIPU_WHISPER_WORKER` | `1` | `0` runs the `mlx_whisper` CLI for every job instead of keeping the model loaded in `whisper_worker.py` |
| `TRANSKRIPU_WHISPER_PYTHON` | auto | Python that runs `whisper_worker.py` (must import `mlx_whisper`); default: the one behind the `mlx_whisper` command |
| `TRANSKRIPU_PATH_PREPEND` | unset | Directories searched first for tools (used by tests to inject stubs) |
| `TRANSKRIPU_CLAUDE` | auto | Path to the `claude` binary if it is not on `PATH` (nvm and `~/.claude/local` are also searched) |
| `TRANSKRIPU_CODEX` | auto | Path to the `codex` binary if it is not on `PATH` (nvm is also searched) |
| `GEMINI_API_KEY` | unset | Gemini API key; overrides the key saved in AI settings |
| `GROQ_API_KEY` | unset | Groq API key; overrides the saved key |
| `SUMOPOD_API_KEY` | unset | SumoPod API key; overrides the saved key |
| `OPENAI_COMPAT_API_KEY` | unset | Key for the "Custom (OpenAI-compatible)" provider; overrides the saved key |

Provider settings (base URLs, models, routing, keys) are edited in the app under ⚙ **AI settings** and stored in `data/config.json` with permissions `0600`. The API never returns a key, and keys are never written to logs.

### Choosing a provider

| Provider | Cost | Notes |
|---|---|---|
| Google Gemini (default) | Free tier | Large context: a 1-hour lecture fits in one request. Free-tier data may be used by Google. Key: [aistudio.google.com](https://aistudio.google.com/apikey). |
| Groq | Free tier | Very fast, but ~8K tokens/minute, so `max_input_tokens` is 6000 and long recaps run in parts (map → reduce), pausing on 429. |
| SumoPod | Paid (IDR / QRIS) | Copy the base URL and key from the SumoPod dashboard. |
| Ollama / LM Studio | Free, offline | Runs on this Mac; no key. Start the server first. |
| Claude Code CLI / Codex CLI | Your existing subscription | Uses the `claude` / `codex` login. Runs headless and read-only in an empty temp folder. |

Default routing: recap and chat go to Gemini; without a Gemini key (or on a rate limit/outage) they fall back to the Claude Code CLI. Model IDs change often: use **Load models** to pick from what the provider offers.

## Customising

- **Add a model:** append the Hugging Face repo ID to `MODELS` in `app.py`, then add a label and hint under `MODEL_KEYS` and `model.<key>` / `model.<key>.hint` in `static/app.js`.
- **Add a spoken language:** append its Whisper code (e.g. `"ja"`) to `LANGUAGES` in `app.py`, and add `lang.ja` to both dictionaries in `static/app.js`.
- **Add a UI language:** add a new dictionary to `I18N` in `static/app.js` and a button to `#langSwitch` in `index.html`. Missing keys fall back to English.
- **Change mlx_whisper options:** edit the `cmd` list in `step_transcribe()`. Run `mlx_whisper --help` for the full list (e.g. `--word-timestamps True`, `--max-line-width`).
- **Theme tokens:** colors are CSS custom properties on `:root` (light) and `:root[data-theme="dark"]` in `static/app.css`.

## Development

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
TRANSKRIPU_NO_BROWSER=1 .venv/bin/python app.py
```

The frontend is plain HTML/CSS/JS with no build step, so reload the page after editing. Restart the server after editing `app.py`.

### Tests

```bash
python3 scripts/smoke_test.py   # → PASS n/n (switches to .venv/bin/python if Flask is missing)
```

Starts the server on a random port with a temp data dir and the stubs in `scripts/stubs/`, then checks upload, URL, validation, retry and delete flows plus EN/ID i18n key parity. It needs only Flask, so it runs anywhere, including CI. Add a check whenever you add an endpoint, stage or error code.

### Working with AI agents

`AGENTS.md` is the entry point for coding agents: commands, a code map with grep anchors, invariants and a token-lean workflow. Ready-made prompts live in `docs/ai/MASTER_PROMPT.md`. In Claude Code, use `/feature`, `/fix`, `/review` and `/handoff`.

Recommended `.gitignore`:

```
.venv/
data/
__pycache__/
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Header shows "tool(s) missing" | Install the listed tool, then click **Check again**. |
| `Connection reset by peer` / `LocalEntryNotFoundError` | The model download from huggingface.co is blocked. Use another network or VPN once, or set `HF_ENDPOINT=https://hf-mirror.com`. |
| YouTube: "The page needs to be reloaded" or HTTP 403 | `brew upgrade yt-dlp` (YouTube changes often). |
| URL job needs login | Choose a browser under **Use browser sign-in** (uses that browser's cookies). |
| Text in the wrong spelling for technical terms | Put the terms in **Vocabulary hints**. |
| Repeated or invented text over silence | A known Whisper behavior. Try Large v3, or trim long silences. |
| UI changes don't show up / page looks old | Another copy is holding the port. Run `./stop.command`, then `./start.command`, then hard-reload (Cmd+Shift+R). |
| Anything else | Check `data/jobs/<id>/log.txt` for the exact commands and tool output. |

## License

Personal use. Respect the copyright and terms of the platforms and the lecture materials you process.
# transkripu
