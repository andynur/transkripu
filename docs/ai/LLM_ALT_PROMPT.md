# Task: LLM providers settings + Recap + Chat

> Paste into Claude Code at the repo root, or run it as `/feature` with a pointer to this file.
> Read `AGENTS.md` first and follow its invariants, workflow and token discipline.
> Work in the 4 phases below. After each phase, run `python3 scripts/smoke_test.py`, make one commit, and give a ≤3-line status. Don't pause between phases unless something is blocked.

## Goal
Add an LLM layer to Transkripu so that I can:
1. **Configure providers and models** in a Settings UI, with sensible defaults already filled in.
2. **Generate a recap** of any finished transcript (EN or ID).
3. **Chat** about a transcript, with answers citing clickable timestamps.

Backends: OpenAI-compatible HTTP APIs (Gemini, Groq, SumoPod, Ollama/LM Studio, Custom) **and** local CLIs (Claude Code `claude`, Codex `codex`). Default: Gemini.

## Constraints
- **No new Python dependencies.** Use `urllib.request` for HTTP, including streaming. No frontend build step; keep vanilla JS/CSS.
- **Follow the existing patterns.** The backend returns codes and the UI owns text: every new string goes into both `I18N.en` and `I18N.id`. CSS tokens only; it must look right in light and dark mode; Jira/ADS look.
- **Secrets:**
  - API keys live in `data/config.json` (written with `0600` permissions; `data/` is already git-ignored).
  - Env vars override the file: `GEMINI_API_KEY`, `GROQ_API_KEY`, `SUMOPOD_API_KEY`, `OPENAI_COMPAT_API_KEY`.
  - The API **never returns a key**, only `has_key: true` plus the last 4 characters.
  - Never log keys, including in `log.txt`.
- **CLI backends run non-interactively and read-only.** Before writing any code for them, run `claude --help` and `codex exec --help` (or `codex --help`) locally and use the real flags; don't guess. Requirements:
  - Prompt goes in via stdin or an argument; output comes back as plain text (streamed if the CLI supports it).
  - No tool use and no file edits: use the most restrictive permission/sandbox flags the CLI offers.
  - `cwd` is the job's temp dir, never the repo.
  - A timeout applies (default 300 s) and the process is killable (reuse the process-group pattern from `run_process`).
  - If a CLI isn't on PATH, its provider shows as "not installed" and stays selectable only after install.

## Provider presets (defaults)

| Preset id | Kind | Base URL | Default model(s) | Notes |
|---|---|---|---|---|
| `gemini` | openai | `https://generativelanguage.googleapis.com/v1beta/openai/` | latest **Flash**; fallback **Flash-Lite** | **Default provider.** Free tier; ~1M context; free-tier data may be used by Google (show a small info note). |
| `groq` | openai | `https://api.groq.com/openai/v1` | `qwen/qwen3.8-27b`; alt `openai/gpt-oss-120b` | Free tier is ~8K tokens/min → set `max_input_tokens: 6000` so recaps run in chunked mode (see Recap). |
| `sumopod` | openai | user fills it in (empty by default; placeholder hint "copy from SumoPod dashboard") | `deepseek-v4-flash`; alt `qwen3.7-flash-2026-07-15` | Paid (IDR/QRIS). |
| `ollama` | openai | `http://127.0.0.1:11434/v1` | `qwen3.5:9b` | No key. |
| `lmstudio` | openai | `http://127.0.0.1:1234/v1` | first model from `/models` | No key. |
| `custom` | openai | user | user | Any OpenAI-compatible endpoint. |
| `claude_cli` | cli | — | CLI default (optional `--model` text field) | Uses my Claude Code login. |
| `codex_cli` | cli | — | CLI default (optional model field) | Uses my Codex login. |

**Model IDs change often.** Treat the IDs above as preferred defaults, not hard-coded truth:
- A **"Load models"** button calls `GET {base_url}/models` and fills a searchable select.
- On first load, if a preferred ID isn't in the list, pick the first ID matching a pattern: Gemini `/flash/` without `lite`; fallback `/flash-lite/`.
- The model field always allows free text as well.

**Default routing** (editable in Settings):
- Recap → `gemini` / Flash, fallback `gemini` / Flash-Lite
- Chat → `gemini` / Flash, fallback `groq` / `qwen/qwen3.8-27b`

## Phase 1: provider layer + Settings

**Backend (`app.py`, new section `# LLM providers`):**
- `config.json` schema:
  `{ "providers": {id: {kind, base_url, api_key?, model, fallback_model?, max_input_tokens?, extra_args?}}, "routing": {"recap": {provider, model, fallback: {provider, model}?}, "chat": {…}}, "recap_language": "auto|en|id" }`
- Merge: presets ← file ← env.
- `llm_complete(route, messages, stream=False)`:
  - Dispatches to `_openai_chat()` (POST `/chat/completions`, SSE parsing when `stream=True`) or `_cli_chat()` (flatten messages into one prompt).
  - On `429`, `5xx` or timeout, retries once on the route's fallback.
  - Returns/yields text chunks plus `{provider, model, usage?}`.
- Error codes, mapped to I18N keys:
  `llm_no_key`, `llm_auth` (401/403), `llm_rate_limited` (429), `llm_context_too_long`, `llm_unreachable`, `llm_cli_missing`, `llm_timeout`, `llm_bad_response`.
- Endpoints (add to the README API table):
  - `GET /api/settings`: masked config, plus `providers[*].available` (key present / CLI found / reachable-unknown).
  - `PUT /api/settings`: partial update. An empty `api_key` string means "keep the current key"; `null` means "delete it".
  - `POST /api/settings/test`: body `{provider, model}`. Sends a 1-token "ping" and returns `{ok, latency_ms, error_code?}`.
  - `GET /api/settings/models?provider=`: proxies `/models`.

**UI:**
- Gear button in the top nav opens a **Settings drawer** (reuse the drawer component) with two sections:
  1. **Providers:** an accordion or list. Each row shows:
     - name, status lozenge ("Ready", "No key", "Not installed", "Local")
     - base URL, API key (password field with show/hide; shows "•••• last4" when saved), model select + Load models button
     - Test button, which shows the latency or a translated error as a flag
  2. **Routing:** Recap and Chat, each with provider + model + fallback; recap language `Auto (match transcript) / English / Indonesian`.
- Help text under Gemini (privacy note) and Groq (token-per-minute note).

## Phase 2: Recap

- **Transcript format fed to the model** (compact, cache-friendly, transcript first): one line per segment, `[mm:ss] text`. System prompt stays constant; the transcript sits at the top of the user message; the instruction goes last.
- **Recap output** (Markdown) in the chosen language:
  1. TL;DR (3–5 sentences)
  2. Key points with `[mm:ss]` refs
  3. Terms & definitions
  4. Action items / deadlines / assignments mentioned (or "None mentioned")
  5. Questions to review

  Rules for the model: don't invent anything not in the transcript; keep the original technical terms.
- **Chunked mode:** when the estimated tokens (chars/3.5 is enough) exceed the provider's `max_input_tokens`:
  - Split by segments into ~80%-of-limit chunks.
  - Summarize each chunk into bullet notes with timestamps (map), then merge them (reduce).
  - Pace requests if the provider returns 429 with a retry hint.
- **Runs as a background job step**, reusing the worker/queue pattern; it must not block transcription.
  - New statuses: `recap_status` ∈ `idle|queued|running|done|error` on the job.
  - New stages: `recap_map` (with `{pct}`), `recap_reduce`.
- Saves `data/jobs/<id>/recap.md` and `recap.json` `{provider, model, language, created, usage}`.
- **Endpoints:**
  - `POST /api/jobs/:id/recap` (optional body `{language}`; re-runs if one exists)
  - `GET /api/jobs/:id/recap`
  - `GET /api/jobs/:id/download/recap` → `.md`
- **UI:** a **Transcript | Recap | Chat** tab row in the job drawer.
  - Recap tab: Generate/Regenerate button, language select, progress, rendered Markdown (a tiny safe renderer covering headings, lists, bold, code — escape HTML first), Copy and Download .md.
  - `[mm:ss]` refs become links that seek the player.
  - Footer: "Generated with {provider} · {model}".

## Phase 3: Chat

- `POST /api/jobs/:id/chat` with body `{message}` → **SSE stream** (`text/event-stream`, events `delta`, `done`, `error`) using a Flask generator response.
- History persisted in `data/jobs/<id>/chat.json`; `GET` returns it; `DELETE` clears it.
- **Context:**
  - If the transcript fits the chat provider's `max_input_tokens` (or the provider has none), send the full transcript first for prompt-cache reuse, then the last ~10 turns.
  - Otherwise, pick the top-N segments by simple keyword overlap with the question (no embeddings; no deps) plus ±1 neighbouring segments, and note "(partial context)" in the answer metadata.
- System prompt: answer only from the transcript; say so when the answer isn't in it; reply in the user's language; cite `[mm:ss]`.
- **UI (Chat tab):**
  - Message list: user bubbles right, assistant left, ADS subtle surfaces.
  - Streaming text with a stop button (aborts the fetch; the server stops the upstream request or CLI process).
  - Textarea: Enter sends, Shift+Enter adds a newline.
  - Suggested prompts when empty: "Summarize the main idea", "What are the assignments?", "Explain {first term} simply".
  - Clear chat; timestamp links seek the player.
- Disable Recap/Chat tabs with a hint until the job is `done`.

## Phase 4: tests & docs

- **Stubs:**
  - `scripts/stubs/openai_server.py`: a tiny `http.server` on a free port that implements `/models`, and `/chat/completions` with and without `stream`, and can simulate `429`/`401` via a header or model name, e.g. `model=stub-429`.
  - `scripts/stubs/claude`, `scripts/stubs/codex`: echo a fixed recap/answer to stdout.
- **Extend `smoke_test.py`:**
  - Settings round-trip with key masking (the key is never echoed back).
  - Test endpoint ok, and `llm_auth` on 401.
  - Recap via stub HTTP (full and chunked mode via a tiny `max_input_tokens`); `recap.md` exists.
  - Fallback on 429 is used.
  - Chat SSE returns deltas and persists history.
  - Recap via the `claude_cli` stub.
  - I18N parity still passes.
- **Docs:**
  - README: new API rows, the config/env var table, a "Choosing a provider" section (short table: Gemini free = default, Groq free = fast but 8K TPM, SumoPod = paid IDR, Ollama/LM Studio = offline, Claude/Codex CLI = uses your existing subscription).
  - `docs/ai/NOTES.md`: one line each for the defaults, Groq TPM chunking, and the CLI read-only flags you verified.

## Acceptance checklist
- [ ] Fresh install: Settings shows Gemini as default; entering a Gemini key + Test → OK.
- [ ] Recap of a 1-hour lecture works on Gemini in one request; on Groq it switches to chunked mode automatically.
- [ ] Chat streams, cites clickable timestamps, and survives page reload (history).
- [ ] `claude_cli` / `codex_cli` produce a recap without touching repo files.
- [ ] 429 on the primary route → fallback used, and the UI shows which model answered.
- [ ] No key ever appears in API responses, logs or the browser.
- [ ] EN/ID and light/dark all correct; `python3 scripts/smoke_test.py` → PASS.

## Final report (≤8 lines)
Files changed · new endpoints · verified CLI flags · smoke result · what I should click through manually on my Mac (with a real Gemini key).