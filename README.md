<div align="center">

# Transkripu

**Local, private transcription for lectures, talks and videos on Apple Silicon.**

Drop in a file or paste a YouTube link and get SRT, VTT, TXT, TSV and JSON transcripts.
Transcription runs on your Mac's GPU with [mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper).

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Platform: macOS Apple Silicon](https://img.shields.io/badge/platform-macOS%20%7C%20Apple%20Silicon-lightgrey)
![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-3776AB)
![Flask](https://img.shields.io/badge/backend-Flask-000000)
![No build step](https://img.shields.io/badge/frontend-vanilla%20JS-F7DF1E)

[Features](#features) · [Quick start](#quick-start) · [Usage](#usage) · [Configuration](#configuration) · [API](#http-api) · [Development](#development) · [Contributing](#contributing)

</div>

---

## Features

- **Local and private.** Media and transcripts stay on your machine. Only the one-time model download and URL downloads use the network.
- **Any source.** Upload MP4, MOV, MKV, MP3, M4A, WAV and more, or paste a YouTube/web URL (via [yt-dlp](https://github.com/yt-dlp/yt-dlp)).
- **Uses existing subtitles.** When a video already has subtitles in the spoken language, Transkripu uses them and skips Whisper.
- **Fast after the first job.** A long-lived worker keeps the Whisper model loaded between jobs.
- **Live progress.** Text streams in while it is transcribed, with per-stage timings and an ETA.
- **Transcript player.** Media player synced to the transcript: click a line to seek, search, copy, and fix a segment in place.
- **AI recap and chat (optional).** Generate study notes from a transcript and ask questions about it with Gemini, Groq, SumoPod, Ollama, LM Studio, or the `claude` / `codex` CLI.
- **Many formats.** Download SRT, VTT, TXT, TSV, JSON, and the recap as Markdown.
- **Polished UI.** English and Indonesian interface, light and dark theme, styled after the Atlassian Design System.
- **Small stack.** Flask plus vanilla HTML/CSS/JS. No build step, no Node, no database server.

## Requirements

- macOS on Apple Silicon (M1 or later). `mlx-whisper` does not run on Intel Macs, Linux or Windows.
- Python 3.10 or later (the launcher avoids macOS's bundled Python 3.9)
- [Homebrew](https://brew.sh)
- About 1.6 GB of free disk space for the default model

## Quick start

### 1. Install the prerequisites

```bash
brew install python ffmpeg yt-dlp deno pipx
pipx ensurepath          # then open a new Terminal window
pipx install mlx-whisper
```

| Tool | Why |
|---|---|
| `python` (3.10+) | Runs the Flask server. |
| `ffmpeg` / `ffprobe` | Decodes media for Whisper and reads the duration for progress. |
| `mlx-whisper` | Whisper on the Apple GPU via MLX. |
| `yt-dlp` + `deno` | Downloads audio from URLs. Recent yt-dlp needs Deno for YouTube. Optional if you only use local files. |
| An LLM provider | Optional. Needed only for the AI recap and chat. See [AI providers](#ai-providers). |

### 2. Clone and run

```bash
git clone https://github.com/andynur/transkripu.git
cd transkripu
./start.command
```

The launcher creates `.venv/`, installs Flask, starts the server and opens **http://127.0.0.1:8765**.

The first transcription downloads the selected model into `~/.cache/huggingface` (about 1.6 GB for Large v3 Turbo). After that, transcription works offline.

> [!TIP]
> You can also double-click `start.command` in Finder. The first time, right-click it and choose **Open** to get past Gatekeeper.

### 3. Stop

Press **Ctrl+C**, close the Terminal window, or run `./stop.command`.

If Transkripu from this folder is already running, `start.command` only opens the browser. If another program holds the port, the launcher shows that program's PID and folder, then exits.

<details>
<summary><strong>Optional: add Transkripu to the Dock</strong></summary>

1. Open Automator and choose **New → Application**.
2. Add a **Run Shell Script** action with:
   ```bash
   open -a Terminal "/path/to/transkripu/start.command"
   ```
3. Save it as `Transkripu.app` outside the repository and drag it to the Dock.

</details>

## Usage

1. Choose a file, or paste one or more URLs.
2. Pick a model and the spoken language (`English`, `Indonesian` or `Auto-detect`).
3. Optional: add **Vocabulary hints** (names, technical terms) to improve spelling.
4. Optional: for sites that need a login, choose a browser under **Use browser sign-in**. Transkripu then uses that browser's cookies.
5. Click **Start transcription**. Jobs run one at a time, in queue order.
6. Open a finished job to play the media, read and edit the transcript, download files, or create an AI recap.

### Models

| Model | Notes |
|---|---|
| `mlx-community/whisper-large-v3-turbo` | Default. Best balance of speed and accuracy. |
| `mlx-community/whisper-large-v3-mlx` | Most accurate, slower. |
| `mlx-community/whisper-medium-mlx` | Faster, less accurate. |
| `mlx-community/whisper-small-mlx` | Fastest, for quick drafts. |

### Command line

The API also works from scripts:

```bash
curl -F url="https://youtu.be/VIDEO_ID" -F language=id -F prompt="Data Structures, Dijkstra" \
     http://127.0.0.1:8765/api/jobs
```

See [HTTP API](#http-api) for all endpoints.

## Configuration

Set environment variables before you run `./start.command`.

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

Example:

```bash
TRANSKRIPU_PORT=9000 HF_ENDPOINT=https://hf-mirror.com ./start.command
```

### AI providers

The AI recap and chat are optional. Configure them in the app under ⚙ **AI settings**. Settings (base URLs, models, routing, keys) are stored in `data/config.json` with permissions `0600`. The API never returns a key, and keys are never written to logs.

| Provider | Cost | Notes |
|---|---|---|
| Google Gemini (default) | Free tier | Large context: a 1-hour lecture fits in one request. Free-tier data may be used by Google. Key: [aistudio.google.com](https://aistudio.google.com/apikey). |
| Groq | Free tier | Very fast, but ~8K tokens/minute, so `max_input_tokens` is 6000 and long recaps run in parts (map → reduce), pausing on 429. |
| SumoPod | Paid (IDR / QRIS) | Copy the base URL and key from the SumoPod dashboard. |
| Ollama / LM Studio | Free, offline | Runs on this Mac; no key. Start the server first. |
| Claude Code CLI / Codex CLI | Your existing subscription | Uses the `claude` / `codex` login. Runs headless and read-only in an empty temp folder. |

Default routing: recap and chat go to Gemini. Without a Gemini key, or on a rate limit or outage, they fall back to the Claude Code CLI. Model IDs change often, so use **Load models** to pick from what the provider offers.

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

### Project layout

```
transkripu/
├── app.py              # Flask server, job queue, yt-dlp / mlx_whisper integration, LLM providers
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
│   └── stubs/          # fake mlx_whisper / yt-dlp / LLM CLIs used by the smoke test
├── AGENTS.md           # guide for AI coding agents (commands, code map, rules)
├── CLAUDE.md           # imports AGENTS.md for Claude Code
├── .claude/commands/   # /feature, /fix, /review, /handoff for Claude Code
├── docs/ai/            # agent prompts and a decisions & gotchas log (NOTES.md)
└── data/               # created at runtime, git-ignored
    ├── config.json       # AI provider settings (0600)
    ├── transkripu.db     # SQLite: chat history (table chat_messages, keyed by job id)
    ├── server.log        # server events and tracebacks
    └── jobs/<job_id>/
        ├── job.json          # job state (source of truth, reloaded on start)
        ├── source.<ext>      # uploaded or downloaded media
        ├── source.info.json  # yt-dlp metadata (URL jobs)
        ├── log.txt           # full stdout/stderr of every tool invocation
        ├── segments.json     # [{start, end, text}] used by the UI
        ├── recap.md          # AI recap (optional)
        └── transcript.{srt,vtt,txt,tsv,json}
```

### Job model

`status`: `queued` → `downloading` (URL only) → `transcribing` → `done` | `error` | `cancelled`

`stage` is a machine-readable key that the UI translates: `queued`, `fetching_info`, `downloading_audio`, `loading_model`, `downloading_model`, `detecting_language`, `transcribing`, `done`, `failed`, `cancelled`. `stage_pct` and `stage_detail` carry the variable parts.

`error_code` is set for known failures (`interrupted`, `ytdlp_missing`, `mlx_missing`, `no_media`, `no_output`). `error` always holds the English or raw tool output.

`timings` holds `download`, `model_load` and `transcribe` in seconds.

Other fields the UI uses: `queued_at` (queue order), `transcribe_started` (ETA and speed while transcribing), `media_bytes`, `media_removed` (source deleted to save space), `edited` (a segment was corrected), `transcript_source` (`manual_subs`/`auto_captions` when the transcript came from the video's subtitles, track key in `caption_lang`; absent for Whisper), and `options.condition_previous` (`false` = Whisper does not condition on the previous text, which reduces repetition loops).

## HTTP API

All endpoints are served on `127.0.0.1` only. The API has no authentication, so it refuses requests that another website could forge:

- a `Host` header other than `127.0.0.1`, `localhost` or `[::1]` on the configured port (blocks DNS rebinding);
- `Sec-Fetch-Site: cross-site`, or a non-GET request whose `Origin` differs from the app's own (blocks cross-site form posts).

Clients that send neither header, such as `curl` or scripts, are allowed.

<details>
<summary><strong>Endpoint reference</strong></summary>

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health[?refresh=1]` | Tool availability, model IDs, language codes. `refresh` re-scans `PATH`. |
| `GET` | `/api/jobs` | All jobs, newest first (without segments). Sends an `ETag`; with a matching `If-None-Match` it answers `304`. |
| `GET` | `/api/jobs/:id[?since=N]` | One job including `segments` (live while running) and `recap` (Markdown, when `recap_status` is `done`). `ai_lang_default` is the default recap/chat language: the chosen spoken language, else the detected one (`ms` counts as `id`), else `en`. While live, `since` returns only segments from index `N`; `segments_from` gives the start index of the returned list and `segments_live` whether it is still growing. `?segments=0` leaves out a finished job's segments (`segments: null`). Finished jobs also report `disk_bytes` (size of the job folder). |
| `POST` | `/api/jobs` | Multipart form: `file` **or** `url`, plus `model`, `language` (`en`/`id`/`auto`), `prompt`, `cookies_browser` (`chrome`/`safari`/`firefox`/`edge`/`brave`), `condition_previous` (`0` turns off conditioning on the previous text), `transcript_source` for URL jobs (`auto` = uploaded subtitles in the spoken language when available, else Whisper; `captions` = also the original auto-generated captions; `whisper` = always transcribe). Uploads must have a known audio/video extension. One job per request; the UI posts several files or URLs one after another. |
| `POST` | `/api/jobs/:id/cancel` | Cancel a running or queued job. |
| `POST` | `/api/jobs/:id/retry` | Re-queue a finished, failed or cancelled job. Reuses already downloaded media and clears the previous outputs (including the recap and segment edits). An upload job whose media was deleted answers 409 `media_removed`; a URL job downloads it again. Optional JSON body `{"transcript_source": "whisper"}` switches a subtitle-based job to Whisper. |
| `GET` | `/api/jobs/:id/chat[?after=ID]` | Chat history `{messages: [{id, role: user\|assistant\|error, text, created, meta}], after, total, busy, partial}`. `after` returns only messages with a higher id; `total` is the full count (a mismatch means the chat was cleared). `partial` is the answer streamed so far while `busy`. |
| `POST` | `/api/jobs/:id/chat` | JSON `{"text": "...", "lang": "en"\|"id"}` (max 4000 chars). Asks the chat route's provider about a `done` job (202); answers are written in `lang`, which is remembered as the job's `chat_lang` (default: `ai_lang_default`); the transcript, recap and last 20 messages are sent along. If the transcript exceeds the provider's `max_input_tokens`, only the best-matching segments are sent (`meta.excerpt`). Answers carry `meta.provider`, `meta.model`, `meta.fallback`, and `meta.suggestions` (5 follow-up questions in `lang`, asked in the same call; a separate call when the model leaves them out). Errors: `empty_message`, `message_too_long` (400), `chat_not_ready`, `chat_busy` (409). A failed answer is stored as an `error` message with `meta.error_code` (an `llm_*` code or `chat_failed`). |
| `POST` | `/api/jobs/:id/chat/suggestions` | JSON `{"lang": "en"\|"id"}`. 5 starter questions for an empty chat from the chat route's provider (recap, else a thinned-out transcript). Cached per language in `suggestions.json`; dropped on retry or segment edit. Errors: `unknown_language` (400), `chat_not_ready` (409), `llm_*` (502). |
| `POST` | `/api/jobs/:id/chat/stop` | Stop the answer being written; the part received so far is stored with `meta.stopped`. |
| `POST` | `/api/jobs/:id/chat/retry` | JSON `{"text": "..."?, "lang": ...?}`. Answers the last question again (Regenerate), or reworded when `text` is given (Edit); messages after that question are removed first (202). Errors: `chat_empty`, `chat_busy`, `chat_not_ready` (409). |
| `POST` | `/api/jobs/:id/chapters` | JSON `{"lang": "en"\|"id"}`. Splits a `done` transcript into titled chapters with the recap route's provider and waits for the reply: `{chapters: {lang, items: [{start, title}], provider, model, created}}`. Saved to `chapters.json`, returned in `GET /api/jobs/:id` as `chapters`, dropped on retry. Errors: `study_not_ready`, `study_busy` (409), `ai_bad_reply` / `llm_*` (502). |
| `POST` | `/api/jobs/:id/quiz` | JSON `{"lang": ..., "count": 5\|10}`. New multiple-choice quiz (recap route, waits for the reply). Returned without answers as `quiz` (also in `GET /api/jobs/:id`, with `last` and `best` scores). Errors as for chapters, plus `bad_quiz_size` (400). |
| `POST` | `/api/jobs/:id/quiz/check` | JSON `{"answers": [index\|null, ...]}` → `{score, total, best, results: [{picked, answer, correct, explain}]}`; keeps the last and best score. `no_quiz` (404). |
| `PATCH` | `/api/jobs/:id` | JSON `{"tags": ["..."]}`: sets the job's tags (max 10, 30 characters each, case-insensitive duplicates dropped). |
| `GET` | `/api/search?q=` | Case-insensitive text search over every finished transcript (min. 2 characters): `{query, results: [{job_id, title, count, hits: [{index, start, text}]}]}` (max 30 jobs, 5 hits each). |
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

</details>

### Errors

Validation errors return `{ "error_code": "...", "error": "..." }` with a 4xx status: `missing_input`, `invalid_url`, `unknown_model`, `unknown_language`, `unknown_browser`, `unsupported_file`, `job_running` (409), `forbidden` (403), `disk_full` (507).

LLM error codes (recap, chat, test): `llm_no_key`, `llm_no_url`, `llm_auth` (401/403, or Gemini's 400 for a bad key), `llm_rate_limited` (429), `llm_context_too_long`, `llm_model_not_found` (404), `llm_server_error` (5xx), `llm_unreachable`, `llm_timeout`, `llm_bad_response`, `llm_cli_missing`, `llm_cli_failed`. After `llm_no_key`, `llm_no_url`, `llm_cli_missing`, `llm_rate_limited`, `llm_server_error`, `llm_unreachable` or `llm_timeout` the route's fallback provider is tried.

Server events and unexpected errors (with tracebacks) are logged to the terminal and to `data/server.log`.

## Development

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
TRANSKRIPU_NO_BROWSER=1 .venv/bin/python app.py
```

The frontend is plain HTML/CSS/JS with no build step, so reload the page after you edit it. Restart the server after you edit `app.py`.

### Tests

```bash
python3 scripts/smoke_test.py   # → PASS n/n (switches to .venv/bin/python if Flask is missing)
node --check static/app.js      # optional JS syntax check, if Node is installed
```

The smoke test starts the server on a random port with a temporary data directory and the stubs in `scripts/stubs/`. It then checks the upload, URL, validation, retry, delete, settings, recap and chat flows, plus EN/ID i18n key parity. It needs only Flask, not a GPU or network, so it runs anywhere, including CI.

### Customising

- **Add a model:** append the Hugging Face repo ID to `MODELS` in `app.py`, then add a label and hint under `MODEL_KEYS` and `model.<key>` / `model.<key>.hint` in `static/app.js`.
- **Add a spoken language:** append its Whisper code (e.g. `"ja"`) to `LANGUAGES` in `app.py`, and add `lang.ja` to both dictionaries in `static/app.js`.
- **Add a UI language:** add a new dictionary to `I18N` in `static/app.js` and a button to `#langSwitch` in `index.html`. Missing keys fall back to English.
- **Change mlx_whisper options:** edit the `cmd` list in `step_transcribe()`. Run `mlx_whisper --help` for the full list (e.g. `--word-timestamps True`, `--max-line-width`).
- **Theme tokens:** colors are CSS custom properties on `:root` (light) and `:root[data-theme="dark"]` in `static/app.css`.

### Working with AI agents

[`AGENTS.md`](AGENTS.md) is the entry point for coding agents: commands, a code map with grep anchors, invariants and a token-lean workflow. Ready-made prompts are in [`docs/ai/MASTER_PROMPT.md`](docs/ai/MASTER_PROMPT.md). In Claude Code, use `/feature`, `/fix`, `/review` and `/handoff`.

## Contributing

Contributions are welcome: bug reports, fixes, new UI languages and docs.

1. Fork the repository and create a branch: `git checkout -b feat/my-change`.
2. Make a small, focused change. Follow the rules in [`AGENTS.md`](AGENTS.md#invariants-do-not-break). The most important rules are:
   - The backend sends codes and the UI owns the text. Add every new string to **both** `I18N.en` and `I18N.id`.
   - External tools (`yt-dlp`, `mlx_whisper`, `ffprobe`) run as subprocesses, never as imports.
   - Do not add dependencies or build tooling without discussing it in an issue first.
   - Use CSS tokens only, and check the UI in light and dark themes.
   - If you change the API or add an environment variable, update this README.
3. Run `python3 scripts/smoke_test.py` and make sure it prints `PASS n/n`. Add a check when you add an endpoint, stage or error code.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `perf:`, `test:`).
5. Open a pull request. Describe what changed, and how you tested it on a Mac if the change touches transcription or the UI.

When you report a bug, include your macOS version, chip, the `mlx-whisper` and `yt-dlp` versions, and the relevant part of `data/jobs/<id>/log.txt`.

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

## Security

Transkripu is a single-user local app. The API has **no authentication** and binds to `127.0.0.1` by default. Do not expose it to a network or the internet. Host and origin checks block DNS rebinding and cross-site requests from other websites.

To report a security problem, please contact the maintainer privately through GitHub instead of opening a public issue.

## Acknowledgements

- [mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper) and [MLX](https://github.com/ml-explore/mlx) by Apple
- [OpenAI Whisper](https://github.com/openai/whisper)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org)
- [Flask](https://flask.palletsprojects.com)
- [Atlassian Design System](https://atlassian.design) for the visual style

## License

Released under the [MIT License](LICENSE).

You are responsible for how you use this software. Respect the copyright and terms of service of the platforms and materials you download and transcribe.
