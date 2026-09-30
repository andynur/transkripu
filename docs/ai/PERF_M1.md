# Transcription performance on Apple Silicon (M1 Pro)

Findings from a check on 2026-09-30 on a MacBook Pro 16" M1 Pro (8 performance + 2 efficiency cores, 16 GB RAM). Nothing in the code was changed; this file records the state and the open options.

## Already optimal in the code

- Default model `mlx-community/whisper-large-v3-turbo`: the fastest large Whisper model.
- MLX runs on the GPU (`mx.default_device()` → `Device(gpu, 0)`).
- `mlx` 0.32.3 / `mlx-metal` 0.32.3 / `mlx-whisper` 0.4.3 are the latest PyPI releases (pipx venv `~/Library/Application Support/pipx/venvs/mlx-whisper`).
- `whisper_worker.py` keeps the model loaded between jobs (no reload for the 2nd job).
- URL jobs download audio only (`bestaudio[ext=m4a]/bestaudio`, `-N 4`, no re-encode) and use the video's own subtitles when available, skipping Whisper entirely.

## Main bottleneck: Low Power Mode

`pmset -g custom` showed `lowpowermode 1` on the battery profile and `0` on the AC profile. Low Power Mode throttles CPU and GPU, and benchmark times varied a lot between runs because of it.

Fix (no code change):
- Plug in the charger, or
- System Settings → Battery → Low Power Mode → "Never" or "Only on Power Adapter".

Check with `pmset -g | grep lowpowermode` (must print `0` while transcribing).

## Why more CPU cores don't help

- mlx_whisper decodes 30-second windows one after another on the GPU; extra CPU cores stay mostly idle.
- Parallel jobs would compete for the same GPU and gain nothing. AGENTS.md invariant 3 (one worker, sequential jobs) stays.

## Benchmark (battery + Low Power Mode on)

Audio: 280.7 s of English speech generated with `say`, converted to 16 kHz mono WAV, `language="en"`, model already loaded (warm-up run excluded).

| Model | Run 1 | Run 2 | Word match vs source text |
|---|---|---|---|
| `whisper-large-v3-turbo` | 84.0 s | 65.7 s | 0.974 |
| `whisper-large-v3-turbo-q4` | 56.0 s | 69.3 s | 0.998 |
| `whisper-large-v3-turbo-8bit` | fails to load | – | – |

- Turbo runs at about 3–4× realtime under Low Power Mode. These numbers are **not** representative; repeat the benchmark on AC power.
- q4 shows no consistent speed gain; its accuracy was equal or better on this synthetic audio only. Real recordings (Indonesian, noisy audio) still need a test.
- `turbo-8bit` fails in mlx_whisper 0.4.3 with `ValueError: [load_npz] Input must be a zip file ...` (weight format not supported).
- The q4 and 8bit models were downloaded to `~/.cache/huggingface/hub` during the test; delete them there if not used.

### How to repeat

```sh
PY="$HOME/Library/Application Support/pipx/venvs/mlx-whisper/bin/python"
say -f text.txt -o t.aiff && ffmpeg -loglevel error -y -i t.aiff -ar 16000 -ac 1 t.wav
"$PY" - <<'EOF'
import time, mlx_whisper
for m in ["mlx-community/whisper-large-v3-turbo", "mlx-community/whisper-large-v3-turbo-q4"]:
    mlx_whisper.transcribe("t.wav", path_or_hf_repo=m, language="en", clip_timestamps=[0, 5])  # load model
    t = time.time(); mlx_whisper.transcribe("t.wav", path_or_hf_repo=m, language="en")
    print(m, f"{time.time() - t:.1f}s")
EOF
```

## Open options (not implemented)

1. **Pre-warm the worker at server start** so the first job skips the model load (saves about 2–3 s once).
2. **Raise `WHISPER_IDLE`** (`app.py`, now 600 s) so the model stays in memory longer. Turbo uses about 1.6 GB; 16 GB RAM has room.
3. **Add `whisper-large-v3-turbo-q4` to `MODELS`** only if an AC-power benchmark on real recordings shows a clear gain.
4. **Batched engine** (`lightning-whisper-mlx`, or whisper.cpp with Core ML/ANE): possibly much faster, but a new dependency; needs approval (AGENTS.md invariant 4) and must keep running as a subprocess (invariant 2).

Next step: repeat the benchmark on AC power, then decide on options 1–3.
