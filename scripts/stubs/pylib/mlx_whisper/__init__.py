"""Test stub for the mlx_whisper package, used by whisper_worker.py in the smoke test.
Same verbose output and STUB_* switches as the scripts/stubs/mlx_whisper CLI stub."""
import os
import time


def transcribe(audio, path_or_hf_repo=None, verbose=None, language=None, initial_prompt=None,
               condition_on_previous_text=True, **_):
    if os.environ.get("STUB_FAIL") == "mlx":
        raise RuntimeError("stub: simulated mlx_whisper failure")
    print("Fetching 4 files: 100%|####| 4/4")
    segments = []
    for i in range(3):
        start, end = i * 2.0, i * 2.0 + 2
        text = f"Stub segment {i + 1}."
        print(f"[00:{int(start):02d}.000 --> 00:{int(end):02d}.000] {text}")
        segments.append({"start": start, "end": end, "text": " " + text})
        # "STUB_SLOW" in the prompt keeps the job running long enough to cancel it.
        time.sleep(1.0 if "STUB_SLOW" in (initial_prompt or "") else float(os.environ.get("STUB_DELAY", "0.1")))
    return {"text": "", "segments": segments, "language": language or "en",
            "stub_condition": condition_on_previous_text, "stub_pid": os.getpid()}
