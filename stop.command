#!/bin/bash
# Stops the Transkripu server listening on TRANSKRIPU_PORT (default 8765).
# Double-click in Finder, or run ./stop.command from Terminal.
set -u
PORT="${TRANSKRIPU_PORT:-8765}"
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)"
if [ -z "$PIDS" ]; then
  echo "Nothing is running on port $PORT."
  exit 0
fi
for PID in $PIDS; do
  CMD="$(ps -o command= -p "$PID")"
  DIR="$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
  case "$CMD" in
    *app.py*) ;;
    *) echo "Port $PORT is used by something else (pid $PID: $CMD). Not stopping it."; continue ;;
  esac
  echo "Stopping Transkripu (pid $PID, $DIR)…"
  kill "$PID"   # SIGTERM: app.py stops running tools via atexit
  for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$PID" 2>/dev/null || break; sleep 0.5; done
  if kill -0 "$PID" 2>/dev/null; then
    echo "Still running; forcing stop."
    kill -9 "$PID"
  fi
done
echo "Done."
