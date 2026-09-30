# Hosting plan for an Ubuntu VPS (not started)

Status: **parked** — the focus stays local (macOS, Apple Silicon). This document records what must change if Transkripu later moves to an Ubuntu VPS. Research as of 2026-09-30; re-check prices and limits before starting.

## Blockers in short

1. **`mlx_whisper` only runs on Apple Silicon** (MLX). Linux needs a different transcription engine.
2. **YouTube blocks datacenter IPs** → YouTube URL downloads from a VPS often fail.
3. **The API has no auth** and is designed for `127.0.0.1` only → it must be protected before it is reachable from outside.

## 1. Transcription engine (STT)

| Option | Cost | Speed | Notes |
|---|---|---|---|
| **Groq API** `whisper-large-v3-turbo` | Free: 7,200 audio seconds/hour, 28,800/day (≈8 hours of audio/day), 20 RPM, 2,000 RPD. Paid: $0.04/audio hour (minimum billed 10 s/request) | Very fast | Audio goes to a third party. Free-tier file limit 25 MB → re-encode to mono 16 kHz opus and split into chunks when needed |
| **faster-whisper** (CTranslate2, CPU int8) | VPS cost only | Turbo int8 on CPU ≈1–2.5× the audio duration, depending on the CPU; RAM ≈1.5 GB | Stays private/local. Needs 4–8 dedicated vCPUs |
| VPS with GPU | Expensive | Fast | Not worth it for personal use |

**Recommendation:** an "STT provider" layer like `PROVIDER_PRESETS` for the LLM. Default Groq (free/cheap), fallback local faster-whisper (`small` or `turbo`). Example: 30 hours of audio/month via Groq ≈ $1.20 — far cheaper than a bigger VPS.

Affected code:
- `whisper_worker.py` → a faster-whisper variant. Print segments in the same `[mm:ss.xxx --> mm:ss.xxx] text` format so the progress parser in `app.py` stays unchanged.
- `app.py`: `MODELS =`, `def resolve_tools`, `class WhisperWorker`, `def step_transcribe`.
- Error code `mlx_missing` → a generic code (e.g. `stt_missing`); add keys to `I18N.en` and `I18N.id`.
- Groq: request `response_format=verbose_json` (segments + timestamps), then write SRT/VTT/TXT/JSON with the existing segment-rewrite logic (`PUT /segments/:i`).
- Smoke test: new stubs for the Groq/faster-whisper backends.

## 2. LLM (recap/chat)

- Gemini (default) and Groq already use HTTP → fine on a VPS. Note: Gemini's free tier may use data for training.
- The `claude_cli`/`codex_cli` fallbacks depend on an OAuth login on the Mac; awkward on a server and unsuitable for a personal subscription if several people use it. Switch the fallback to Groq or DeepSeek (via sumopod).
- Ollama/LM Studio on a CPU VPS is too slow for long recaps → skip.

## 3. YouTube downloads

Datacenter IPs (Hetzner, DigitalOcean, AWS, OVH, etc.) almost always hit `Sign in to confirm you're not a bot`. Options:
- Upload a `cookies.txt` and use `--cookies <file>`. `--cookies-from-browser` does not work (no browser on the server) → replace the `COOKIE_BROWSERS` dropdown with an upload field.
- A PO token provider (bgutil, needs Node) — prevention only; it does not help once the IP is blocked.
- Residential proxy (paid).
- Accept that on a VPS the main path is file upload; non-YouTube sites are usually fine.

## 4. Security (required before going online)

- The API has no auth; the settings endpoint can change API keys and `base_url` → SSRF risk and drained API quota if exposed publicly.
- `guard_request` only allows localhost Hosts (`ALLOWED_HOSTS`). Behind a reverse proxy with a domain every request gets 403 → needs a new env var, e.g. `TRANSKRIPU_ALLOWED_HOSTS` (update the config table in README).
- **Simplest:** the app keeps binding `127.0.0.1` and is reached via **Tailscale** (no public port, no auth changes).
- If it must be public: Caddy (automatic HTTPS) + basic auth or Cloudflare Access; set an upload size limit in the proxy.
- Must stay **1 process** (queue and worker live in memory, invariant 3). With gunicorn: `-w 1 --threads N` — a new dependency, needs a decision first (invariant 4). The built-in Flask server behind a proxy is still fine for personal use.

## 5. Ops on Ubuntu

- `apt install ffmpeg python3-venv`; yt-dlp in a venv with a weekly auto-update (cron/systemd timer) because YouTube changes often; install `deno`.
- `start.command`/`stop.command` are Mac-only → replace with a **systemd** unit using `TRANSKRIPU_NO_BROWSER=1`, `TRANSKRIPU_DATA_DIR=/var/lib/transkripu`.
- Disk: media in `data/jobs` keeps growing → retention policy (delete old media, keep transcripts).
- Back up `data/transkripu.db` and `data/config.json` (holds API keys, permission 0600).
- The Hugging Face access problem from Indonesian ISPs (see `NOTES.md`) does not apply on a VPS abroad.

## 6. VPS size

- **API mode (Groq):** 2 vCPU / 2–4 GB RAM / 40 GB+ disk — Hetzner CX22 class or similar, ≈€4–6/month.
- **Local mode (faster-whisper):** 4–8 dedicated vCPU / 8–16 GB RAM — ≈€15–35/month, still slower than Groq.

## Order of work when starting

1. STT provider abstraction: Groq + faster-whisper backends, smoke test stubs, new i18n keys. Decide the default: Groq or local.
2. `TRANSKRIPU_ALLOWED_HOSTS` env var, `cookies.txt` upload, non-CLI LLM fallback.
3. systemd + Caddy/Tailscale, media retention, README update (API table + config table).

## Sources

- Groq Speech to Text: https://console.groq.com/docs/speech-to-text
- Groq whisper-large-v3-turbo: https://console.groq.com/docs/model/whisper-large-v3-turbo
- Groq whisper free-tier limits: https://www.free-model.com/models/groq/whisper-large-v3-turbo/
- faster-whisper turbo benchmark: https://github.com/SYSTRAN/faster-whisper/issues/1030
- whisper.cpp vs faster-whisper 2026: https://www.promptquorum.com/power-local-llm/local-whisper-stt-comparison-2026
- yt-dlp "not a bot" 2026: https://tunelio.dev/blog/yt-dlp-sign-in-to-confirm-not-a-bot/
- YouTube datacenter IP blocking: https://ansaribilal.com/blog/ytagent-datacenter-ip-block-youtube-ai-agents-2026/
- yt-dlp issue #9890: https://github.com/yt-dlp/yt-dlp/issues/9890
