#!/usr/bin/env python3
"""Long-lived mlx_whisper process for Transkripu: keeps the model loaded between jobs.

app.py starts it with the Python that has mlx_whisper installed (never imported by
the server itself). Protocol, one job at a time:
  stdin : one JSON object per line: audio, model, output_dir, output_name,
          language, initial_prompt, condition_on_previous_text
  stdout: "@@ready" once imports succeed, then mlx_whisper's verbose output
          (segments, "Detected language: …"), ending each job with "@@done 0"
          or "@@done 1 <error>".
The process exits on EOF or after `idle` seconds (argv[1]) without a job, which
frees the model's memory; app.py starts a new one when needed.
"""
import json
import select
import sys
import traceback

from mlx_whisper import transcribe
from mlx_whisper.writers import get_writer

# Same writer options the mlx_whisper CLI passes when word timestamps are off.
WRITER_ARGS = {"highlight_words": False, "max_line_count": None, "max_line_width": None, "max_words_per_line": None}


def main() -> None:
    idle = float(sys.argv[1]) if len(sys.argv) > 1 else 600
    print("@@ready", flush=True)
    while True:
        ready, _, _ = select.select([sys.stdin], [], [], idle)
        if not ready:
            return  # idle too long: give the memory back
        line = sys.stdin.readline()
        if not line:
            return  # server closed the pipe
        try:
            job = json.loads(line)
            result = transcribe(
                job["audio"], path_or_hf_repo=job["model"], verbose=True,
                language=job.get("language"), initial_prompt=job.get("initial_prompt"),
                condition_on_previous_text=job.get("condition_on_previous_text", True),
            )
            get_writer("all", job["output_dir"])(result, job["output_name"], **WRITER_ARGS)
            print("@@done 0", flush=True)
        except Exception as e:  # noqa: BLE001 - report and wait for the next job
            traceback.print_exc(file=sys.stdout)
            print(f"@@done 1 {type(e).__name__}: {e}", flush=True)


if __name__ == "__main__":
    main()
