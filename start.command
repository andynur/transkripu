#!/bin/bash
# Transkripu launcher for macOS.
# Double-click in Finder, or run ./start.command from Terminal.
set -u
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

pause_and_exit() { echo "$1"; read -r -p "Press Enter to exit"; exit 1; }

# Prefer Homebrew's Python over the old Python 3.9 that ships with macOS.
PY=""
for candidate in /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then PY="$(command -v "$candidate")"; break; fi
done
[ -n "$PY" ] || pause_and_exit "Python 3 not found. Install it with: brew install python"

# Create a local virtualenv on first run (only Flask is installed into it;
# yt-dlp and mlx-whisper are used as external CLIs).
if [ ! -x ".venv/bin/python" ]; then
  echo "→ First run: setting up the Python environment…"
  "$PY" -m venv .venv || pause_and_exit "Failed to create .venv"
  .venv/bin/python -m pip install --upgrade pip -q
fi
# Install requirements only when requirements.txt changed (faster start, works offline).
STAMP=".venv/.requirements.installed"
if ! cmp -s requirements.txt "$STAMP"; then
  .venv/bin/python -m pip install -q -r requirements.txt || pause_and_exit "Failed to install requirements"
  cp requirements.txt "$STAMP"
fi

# Already running? Reuse it if it's this folder, otherwise explain who holds the port.
PORT="${TRANSKRIPU_PORT:-8765}"
PID="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1)"
if [ -n "$PID" ]; then
  OTHER_DIR="$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
  if [ "$OTHER_DIR" = "$(pwd -P)" ]; then
    echo "Transkripu is already running (pid $PID). Opening http://127.0.0.1:$PORT"
    [ -z "${TRANSKRIPU_NO_BROWSER:-}" ] && open "http://127.0.0.1:$PORT"
    exit 0
  fi
  pause_and_exit "Port $PORT is used by pid $PID from: ${OTHER_DIR:-unknown folder}
Stop it with ./stop.command (or: kill $PID), then start again."
fi

# Optional: uncomment if huggingface.co is blocked on your network.
# export HF_ENDPOINT=https://hf-mirror.com

exec .venv/bin/python app.py
