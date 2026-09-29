# Decisions & gotchas

One line each, newest at the bottom. Format: `YYYY-MM-DD — topic: note`.

- 2026-09-29 — env: macOS ships Python 3.9 + LibreSSL; yt-dlp dropped 3.9 and HF downloads can fail. Launcher prefers Homebrew Python; tools are installed via brew/pipx.
- 2026-09-29 — network: `Connection reset by peer` from huggingface.co = ISP blocking; fix with another network/VPN once or `HF_ENDPOINT=https://hf-mirror.com`. Model is cached in `~/.cache/huggingface` afterwards.
- 2026-09-29 — yt-dlp: YouTube breaks often ("The page needs to be reloaded"); the fix is `brew upgrade yt-dlp`, needs `deno`. Don't try to patch around it in code.
- 2026-09-29 — perf: don't use `yt-dlp -x --audio-format` (re-encodes, slow). Download `bestaudio[ext=m4a]/bestaudio` with `-N 4`; mlx_whisper reads any container via ffmpeg.
- 2026-09-29 — progress: parsed from mlx_whisper verbose lines `[mm:ss.xxx --> mm:ss.xxx] text` divided by ffprobe duration. Text-mode pipes split tqdm `\r` updates into lines.
- 2026-09-29 — ui: polling (1.2 s busy / 5 s idle) instead of SSE/WebSocket to keep the server trivial. Media element is created once per job so polling doesn't interrupt playback.
- 2026-09-29 — i18n: backend returns `stage`/`error_code` keys; UI translates. Theme via `<html data-theme>`, always light unless the user picked dark (OS preference ignored on purpose); both persisted in localStorage.
- 2026-09-29 — security: `guard_request` blocks foreign `Host` (DNS rebinding) and cross-site `Origin`/`Sec-Fetch-Site` (CSRF: multipart POST needs no CORS preflight). Header-less clients (curl, smoke test) pass.
- 2026-09-29 — cancel: `update()` never revives a CANCELLED job (only retry with `reopen=True`); `run_process` re-checks status after registering the process so a cancel can't slip between. Retry is refused while the worker still holds the job (`current_job`).
- 2026-09-29 — shutdown: tools run with `start_new_session=True`, so Ctrl+C doesn't reach them; `kill_all_procs` runs via atexit (SIGTERM mapped to sys.exit).
- 2026-09-29 — upload: `UploadRequest` spools files into `DATA_DIR/.upload-*.part` so `create_job` renames instead of copying; leftovers removed in teardown and on start.
- 2026-09-29 — perf: progress-only fields are persisted at most 1×/s (`PERSIST_INTERVAL`); drawer polls `?since=N` and appends DOM rows while live; polling stops in hidden tabs.
- 2026-09-29 — tests: `STUB_SLOW` in the prompt makes the mlx_whisper stub sleep 1 s per segment (used by the cancel check).
- 2026-09-29 — launch: `main()` exits if the port is already taken. Before, the browser opened an old server (even one running from a trashed copy), so UI changes seemed not to apply.
- 2026-09-29 — launch: `start.command` reuses a running instance from the same folder (compares the listener's cwd via `lsof`) and refuses if another folder holds the port; `stop.command` kills only processes running `app.py`. `smoke_test.py` re-execs into `.venv` when Flask is missing.
