#!/usr/bin/env python3
"""
Transkripu — local transcription web app for Apple Silicon Macs.

Turns a local video/audio file or a YouTube/web URL into a transcript and
subtitles (SRT/VTT/TXT/TSV/JSON) using mlx-whisper, fully on-device.

Architecture
------------
- Flask serves the static UI (./static) and a small JSON API (/api/*).
- Jobs are processed one at a time by a single background worker thread
  (the GPU is the bottleneck, so running jobs in parallel would not help).
- External tools are invoked as subprocesses:
    yt-dlp       -> downloads the audio track for URL jobs
    mlx_whisper  -> runs Whisper on the Apple GPU via MLX
    ffprobe      -> reads media duration to compute progress
- Every job lives in ./data/jobs/<job_id>/ (source media, job.json, log.txt,
  transcript.*). job.json is the source of truth and is reloaded on start.

Status/stage values are machine-readable keys; the UI translates them.

Run:   ./start.command      (or: python3 app.py)
Open:  http://127.0.0.1:8765
"""
from __future__ import annotations

import atexit
import ipaddress
import json
import logging
import os
import queue
import re
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import uuid
import webbrowser
from logging.handlers import RotatingFileHandler
from pathlib import Path

from flask import Flask, Request, abort, jsonify, request, send_file, send_from_directory

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = Path(os.environ.get("TRANSKRIPU_DATA_DIR", BASE_DIR / "data")) / "jobs"
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = DATA_DIR.parent / "server.log"

HOST = os.environ.get("TRANSKRIPU_HOST", "127.0.0.1")
PORT = int(os.environ.get("TRANSKRIPU_PORT", "8765"))
OPEN_BROWSER = os.environ.get("TRANSKRIPU_NO_BROWSER") is None
MAX_UPLOAD_BYTES = 10 * 1024 ** 3  # 10 GB
MIN_FREE_BYTES = 512 * 1024 ** 2   # keep this much disk free after an upload
PERSIST_INTERVAL = 1.0             # seconds between job.json writes for progress-only updates

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                    handlers=[logging.StreamHandler(),
                              RotatingFileHandler(LOG_FILE, maxBytes=2 * 1024 ** 2, backupCount=2,
                                                  encoding="utf-8")])
log = logging.getLogger("transkripu")
logging.getLogger("werkzeug").setLevel(logging.WARNING)  # skip per-request lines from polling

# Make Homebrew and pipx binaries visible even when launched from Finder,
# where PATH is minimal. TRANSKRIPU_PATH_PREPEND goes first so tests can
# shadow the real tools with stubs (see scripts/stubs/).
EXTRA_PATHS = ["/opt/homebrew/bin", "/usr/local/bin", str(Path.home() / ".local/bin")]
_prepend = [p for p in os.environ.get("TRANSKRIPU_PATH_PREPEND", "").split(os.pathsep) if p]
os.environ["PATH"] = os.pathsep.join(_prepend + EXTRA_PATHS + [os.environ.get("PATH", "")])

# Hugging Face repos for MLX-converted Whisper weights. Labels/hints live in
# the UI (static/app.js) so they can be translated.
MODELS = [
    "mlx-community/whisper-large-v3-turbo",
    "mlx-community/whisper-large-v3-mlx",
    "mlx-community/whisper-medium-mlx",
    "mlx-community/whisper-small-mlx",
]
DEFAULT_MODEL = MODELS[0]
LANGUAGES = ["en", "id", "auto"]  # "auto" = let Whisper detect it
COOKIE_BROWSERS = ["", "chrome", "safari", "firefox", "edge", "brave"]  # "" = no cookies
OUTPUT_FORMATS = ["srt", "vtt", "txt", "tsv", "json"]
VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mpg", ".mpeg", ".3gp", ".ts", ".wmv", ".flv"}
AUDIO_EXTS = {".mp3", ".m4a", ".wav", ".aac", ".flac", ".ogg", ".oga", ".opus", ".wma", ".aif", ".aiff", ".caf"}
MEDIA_EXTS = VIDEO_EXTS | AUDIO_EXTS
# Progress fields that change many times per second; only persisted every PERSIST_INTERVAL.
PROGRESS_FIELDS = {"stage", "stage_pct", "stage_detail", "progress", "segments_count"}

# Job statuses
QUEUED, DOWNLOADING, TRANSCRIBING = "queued", "downloading", "transcribing"
DONE, ERROR, CANCELLED = "done", "error", "cancelled"
ACTIVE = {QUEUED, DOWNLOADING, TRANSCRIBING}

# ----------------------------------------------------------------------------
# App state (in memory, mirrored to disk)
# ----------------------------------------------------------------------------
UPLOAD_PREFIX = ".upload-"


class UploadRequest(Request):
    """Spool uploaded files straight into DATA_DIR (not the system temp dir) so
    create_job can move them into the job folder instead of copying gigabytes."""

    def _get_file_stream(self, total_content_length, content_type, filename=None, content_length=None):
        return tempfile.NamedTemporaryFile("wb+", dir=DATA_DIR, prefix=UPLOAD_PREFIX,
                                           suffix=".part", delete=False)


app = Flask(__name__, static_folder=None)
app.request_class = UploadRequest
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

jobs: dict[str, dict] = {}            # job_id -> job dict (persisted as job.json)
live_segments: dict[str, list] = {}   # job_id -> segments streamed while running
procs: dict[str, subprocess.Popen] = {}
lock = threading.Lock()
work_queue: "queue.Queue[str]" = queue.Queue()
current_job: str | None = None       # id the worker is processing right now


class Cancelled(Exception):
    """Raised inside the worker when the user cancels a job."""


class JobError(Exception):
    """A known failure with a translatable code."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


# ----------------------------------------------------------------------------
# External tool discovery
# ----------------------------------------------------------------------------
def _python_that_imports(module: str) -> str | None:
    """Find a Python interpreter that can import `module` (fallback when no CLI shim)."""
    for py in [sys.executable, "/opt/homebrew/bin/python3", "/usr/local/bin/python3", "/usr/bin/python3"]:
        if not py or not Path(py).exists():
            continue
        try:
            r = subprocess.run([py, "-c", f"import {module}"], capture_output=True, timeout=10)
            if r.returncode == 0:
                return py
        except Exception:
            pass
    return None


def resolve_tools() -> dict:
    """Return the command prefix for each external tool, or None if missing."""
    tools: dict = {"ffmpeg": shutil.which("ffmpeg"), "ffprobe": shutil.which("ffprobe")}

    yt = shutil.which("yt-dlp")
    if yt:
        tools["yt_dlp"] = [yt]
    else:
        py = _python_that_imports("yt_dlp")
        tools["yt_dlp"] = [py, "-m", "yt_dlp"] if py else None

    mw = shutil.which("mlx_whisper")
    if mw:
        tools["mlx_whisper"] = [mw]
    else:
        py = _python_that_imports("mlx_whisper")
        tools["mlx_whisper"] = [py, "-m", "mlx_whisper.cli"] if py else None
    return tools


TOOLS = resolve_tools()


# ----------------------------------------------------------------------------
# Persistence helpers
# ----------------------------------------------------------------------------
def job_dir(job_id: str) -> Path:
    return DATA_DIR / job_id


def public(job: dict) -> dict:
    """Job fields safe to serialize (keys starting with '_' are private)."""
    return {k: v for k, v in job.items() if not k.startswith("_")}


def write_json_atomic(path: Path, data, indent: int | None = None) -> None:
    """Write JSON via a temp file + rename so readers never see a half-written file."""
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=indent), encoding="utf-8")
    tmp.replace(path)


def save(job: dict) -> None:
    """Atomically write job.json. Caller holds `lock`."""
    now = time.time()
    job["updated"] = now
    job["_saved_at"] = now
    write_json_atomic(job_dir(job["id"]) / "job.json", public(job), indent=2)


def update(job_id: str, *, reopen: bool = False, **fields) -> None:
    """Merge `fields` into the job and persist it.

    A cancelled job only changes again through retry (`reopen=True`): late
    progress from the worker is dropped, and an attempt to move it back to an
    active status raises Cancelled so the worker stops.
    Progress-only updates are written to disk at most every PERSIST_INTERVAL.
    """
    with lock:
        job = jobs.get(job_id)
        if not job:
            return
        if job["status"] == CANCELLED and not reopen and fields.get("status") != CANCELLED:
            if fields.get("status") in ACTIVE:
                raise Cancelled()
            return
        job.update(fields)
        if fields.keys() <= PROGRESS_FIELDS and time.time() - job.get("_saved_at", 0) < PERSIST_INTERVAL:
            return
        save(job)


def set_timing(job_id: str, key: str, seconds: float) -> None:
    with lock:
        job = jobs.get(job_id)
        if job:
            job.setdefault("timings", {})[key] = round(seconds, 1)
            save(job)


def load_jobs() -> None:
    """Load jobs from disk. Jobs that were running when the server stopped are marked failed."""
    for d in sorted(DATA_DIR.iterdir()):
        if d.name.startswith(UPLOAD_PREFIX):
            d.unlink(missing_ok=True)  # upload interrupted by a previous shutdown
            continue
        f = d / "job.json"
        if not f.is_file():
            continue
        try:
            job = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            log.warning("Skipping unreadable %s", f)
            continue
        if job.get("id") != d.name:
            log.warning("Skipping %s: id does not match folder", f)
            continue
        if job.get("status") in ACTIVE:
            job.update(status=ERROR, stage="failed", stage_pct=None,
                       error_code="interrupted",
                       error="Processing stopped because the server was shut down.")
            save(job)
        jobs[job["id"]] = job


# ----------------------------------------------------------------------------
# Subprocess helpers
# ----------------------------------------------------------------------------
def kill_proc(proc: subprocess.Popen) -> None:
    """Terminate a tool and its children (ffmpeg); tools run in their own process group."""
    if proc.poll() is not None:
        return
    try:
        os.killpg(proc.pid, signal.SIGTERM)
    except Exception:
        proc.terminate()


def kill_all_procs() -> None:
    """Called on shutdown: start_new_session=True means Ctrl+C never reaches the tools."""
    with lock:
        running = list(procs.values())
    for proc in running:
        kill_proc(proc)


def run_process(job_id: str, cmd: list, on_line=None, cwd: str | None = None) -> None:
    """Run `cmd`, stream merged stdout/stderr line by line to `on_line` and log.txt.

    Raises Cancelled if the job was cancelled, RuntimeError on non-zero exit.
    Text mode with universal newlines also splits tqdm's '\\r' progress updates.
    """
    env = dict(os.environ, PYTHONUNBUFFERED="1")
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
        cwd=cwd, env=env, start_new_session=True, errors="replace",
    )
    with lock:
        procs[job_id] = proc
        # cancel_job may have run before the process was registered.
        if jobs.get(job_id, {}).get("status") == CANCELLED:
            kill_proc(proc)

    tail: list[str] = []
    with open(job_dir(job_id) / "log.txt", "a", encoding="utf-8") as log:
        log.write("\n$ " + " ".join(map(str, cmd)) + "\n")
        try:
            for raw in proc.stdout:
                line = raw.rstrip("\n")
                if not line.strip():
                    continue
                log.write(line + "\n")
                tail = (tail + [line])[-15:]
                if on_line:
                    try:
                        on_line(line)
                    except Exception:
                        pass  # a parsing bug must never kill the job
            proc.wait()
        finally:
            with lock:
                procs.pop(job_id, None)

    if jobs.get(job_id, {}).get("status") == CANCELLED:
        raise Cancelled()
    if proc.returncode != 0:
        message = "\n".join(tail)[-1200:]
        raise RuntimeError(message or f"Process exited with code {proc.returncode}")


def check_cancelled(job_id: str) -> None:
    if jobs.get(job_id, {}).get("status") == CANCELLED:
        raise Cancelled()


def media_duration(path: Path) -> float | None:
    if not TOOLS.get("ffprobe"):
        return None
    try:
        r = subprocess.run(
            [TOOLS["ffprobe"], "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=60,
        )
        return float(r.stdout.strip())
    except Exception:
        return None


def find_downloaded_media(directory: Path) -> Path | None:
    skip = {".json", ".part", ".ytdl", ".txt", ".srt", ".vtt", ".tsv", ".tmp"}
    for f in sorted(directory.glob("source.*")):
        if f.suffix.lower() not in skip and not f.name.endswith(".info.json"):
            return f
    return None


# ----------------------------------------------------------------------------
# Pipeline
# ----------------------------------------------------------------------------
YTDLP_PROGRESS_RE = re.compile(r"\[download\]\s+([\d.]+)%")
# mlx_whisper verbose output: "[00:12.340 --> 00:15.000] some text"
SEGMENT_RE = re.compile(
    r"^\[((?:\d+:)?\d{1,2}:\d{2}\.\d{3}) --> ((?:\d+:)?\d{1,2}:\d{2}\.\d{3})\]\s?(.*)$"
)
DOWNLOAD_SHARE = 20.0  # % of the overall progress bar reserved for downloading


def timestamp_to_seconds(ts: str) -> float:
    seconds = 0.0
    for part in ts.split(":"):
        seconds = seconds * 60 + float(part)
    return seconds


def step_download(job: dict) -> None:
    """Download the best audio-only stream for a URL job."""
    job_id, directory = job["id"], job_dir(job["id"])
    if not TOOLS.get("yt_dlp"):
        raise JobError("ytdlp_missing", "yt-dlp not found. Install it with: brew install yt-dlp deno")
    update(job_id, status=DOWNLOADING, stage="fetching_info", stage_pct=None, progress=0)

    def on_line(line: str) -> None:
        m = YTDLP_PROGRESS_RE.search(line)
        if m:
            pct = float(m.group(1))
            update(job_id, stage="downloading_audio", stage_pct=round(pct),
                   progress=round(pct * DOWNLOAD_SHARE / 100, 1))

    # Keep the original audio container (no -x re-encode): mlx_whisper reads
    # m4a/webm/opus through ffmpeg. -N 4 downloads fragments in parallel.
    cmd = TOOLS["yt_dlp"] + [
        "--newline", "--no-playlist", "--no-part", "-N", "4",
        "-f", "bestaudio[ext=m4a]/bestaudio/best",
        "--write-info-json", "-o", str(directory / "source.%(ext)s"),
    ]
    if job["options"].get("cookies_browser"):
        cmd += ["--cookies-from-browser", job["options"]["cookies_browser"]]
    cmd.append(job["url"])

    started = time.time()
    run_process(job_id, cmd, on_line)
    set_timing(job_id, "download", time.time() - started)

    title = job.get("title")
    info_file = directory / "source.info.json"
    if info_file.exists():
        try:
            title = json.loads(info_file.read_text()).get("title") or title
        except Exception:
            pass
    media = find_downloaded_media(directory)
    if not media:
        raise JobError("no_media", "Download finished but no audio file was found.")
    update(job_id, title=title, media=media.name, media_kind="audio")


def step_transcribe(job: dict) -> None:
    """Run mlx_whisper and collect segments + output files."""
    job_id, directory = job["id"], job_dir(job["id"])
    if not TOOLS.get("mlx_whisper"):
        raise JobError("mlx_missing", "mlx-whisper not found. Install it with: pipx install mlx-whisper")

    media = directory / job["media"]
    duration = media_duration(media)
    base = DOWNLOAD_SHARE if job["source"] == "url" else 0.0
    update(job_id, status=TRANSCRIBING, stage="loading_model", stage_pct=None,
           duration=duration, progress=base)
    live_segments[job_id] = []
    started = time.time()
    first_segment_at: list[float] = []

    def on_line(line: str) -> None:
        m = SEGMENT_RE.match(line.strip())
        if m:
            if not first_segment_at:
                first_segment_at.append(time.time())
                set_timing(job_id, "model_load", first_segment_at[0] - started)
            start, end = timestamp_to_seconds(m.group(1)), timestamp_to_seconds(m.group(2))
            live_segments[job_id].append({"start": start, "end": end, "text": m.group(3).strip()})
            frac = min(end / duration, 1.0) if duration else 0.0
            update(job_id, stage="transcribing", stage_pct=round(frac * 100),
                   progress=round(base + frac * (100 - base), 1),
                   segments_count=len(live_segments[job_id]))
        elif "Fetching" in line or ".safetensors" in line:
            update(job_id, stage="downloading_model", stage_pct=None)
        elif line.startswith("Detected language"):
            update(job_id, stage="detecting_language", stage_detail=line.split(":", 1)[-1].strip())

    opts = job["options"]
    cmd = TOOLS["mlx_whisper"] + [
        str(media), "--model", opts["model"],
        "--output-dir", str(directory), "--output-name", "transcript",
        "--output-format", "all",
    ]
    if opts.get("language") and opts["language"] != "auto":
        cmd += ["--language", opts["language"]]
    if opts.get("prompt"):
        # "=" form: a prompt starting with "-" would otherwise be parsed as a flag.
        cmd.append(f"--initial-prompt={opts['prompt']}")

    run_process(job_id, cmd, on_line, cwd=str(directory))
    set_timing(job_id, "transcribe", time.time() - (first_segment_at[0] if first_segment_at else started))

    # Prefer the authoritative JSON output; fall back to the streamed segments.
    segments = live_segments.get(job_id, [])
    json_out = directory / "transcript.json"
    if json_out.exists():
        try:
            data = json.loads(json_out.read_text())
            segments = [{"start": s["start"], "end": s["end"], "text": s["text"].strip()}
                        for s in data.get("segments", [])]
            if data.get("language"):
                update(job_id, detected_language=data["language"])
        except Exception:
            log.warning("Job %s: unreadable transcript.json, using streamed segments", job_id)
    write_json_atomic(directory / "segments.json", segments)

    outputs = [fmt for fmt in OUTPUT_FORMATS if (directory / f"transcript.{fmt}").exists()]
    if not outputs:
        raise JobError("no_output", "Transcription finished but no output files were found.")
    update(job_id, outputs=outputs, segments_count=len(segments))


def worker() -> None:
    """Single background worker: processes queued jobs sequentially."""
    while True:
        job_id = work_queue.get()
        try:
            process_job(job_id)
        except Exception:  # noqa: BLE001 - never let the only worker thread die
            log.exception("Worker: unexpected error on job %s", job_id)


def process_job(job_id: str) -> None:
    global current_job
    with lock:
        job = jobs.get(job_id)
        if not job or job["status"] != QUEUED:
            return  # cancelled/deleted while queued, or a duplicate queue entry
        job["timings"] = {}
        current_job = job_id
    started = time.time()
    log.info("Job %s: started", job_id)
    try:
        if job["source"] == "url" and not job.get("media"):
            step_download(job)
        check_cancelled(job_id)
        step_transcribe(jobs[job_id])
        update(job_id, status=DONE, stage="done", stage_pct=None, progress=100,
               elapsed=round(time.time() - started, 1), error=None, error_code=None)
        log.info("Job %s: done in %.1fs", job_id, time.time() - started)
    except Cancelled:
        update(job_id, status=CANCELLED, stage="cancelled", stage_pct=None)
        log.info("Job %s: cancelled", job_id)
    except JobError as e:
        update(job_id, status=ERROR, stage="failed", stage_pct=None, error=str(e), error_code=e.code)
        log.warning("Job %s: %s", job_id, e.code)
    except Exception as e:  # noqa: BLE001 - surface tool output to the user
        update(job_id, status=ERROR, stage="failed", stage_pct=None, error=str(e), error_code=None)
        log.exception("Job %s: failed", job_id)
    finally:
        live_segments.pop(job_id, None)
        current_job = None


# ----------------------------------------------------------------------------
# HTTP API
# ----------------------------------------------------------------------------
def api_error(code: str, message: str, status: int = 400):
    return jsonify(error_code=code, error=message), status


def get_job_or_404(job_id: str) -> dict:
    job = jobs.get(job_id)
    if not job:
        abort(404)
    return job


def is_loopback(host: str) -> bool:
    if host == "localhost":
        return True
    try:
        return ipaddress.ip_address(host.strip("[]")).is_loopback
    except ValueError:
        return False


LOCAL_BIND = is_loopback(HOST)
ALLOWED_HOSTS = {f"{h}:{PORT}" for h in ("127.0.0.1", "localhost", "[::1]")}
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@app.before_request
def guard_request():
    """Stop other websites from driving this unauthenticated local API.

    - Host allowlist defeats DNS rebinding (attacker domain resolving to 127.0.0.1).
    - Sec-Fetch-Site / Origin checks defeat cross-site form posts (CSRF), which
      browsers send without a CORS preflight.
    Clients that send neither header (curl, scripts) are allowed.
    """
    if LOCAL_BIND and request.host not in ALLOWED_HOSTS:
        return api_error("forbidden", "Host not allowed.", 403)
    if request.headers.get("Sec-Fetch-Site") == "cross-site":
        return api_error("forbidden", "Cross-site request blocked.", 403)
    origin = request.headers.get("Origin")
    if request.method not in SAFE_METHODS and origin and origin != request.host_url.rstrip("/"):
        return api_error("forbidden", "Cross-origin request blocked.", 403)
    return None


@app.teardown_request
def cleanup_uploads(_exc=None) -> None:
    """Delete spooled upload files that create_job did not move into a job folder."""
    files = request.__dict__.get("files")  # only if the form was parsed; never parse here
    for upload in (files.values() if files else []):
        name = getattr(upload.stream, "name", None)
        if isinstance(name, str) and Path(name).name.startswith(UPLOAD_PREFIX):
            upload.stream.close()
            Path(name).unlink(missing_ok=True)


@app.get("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


@app.get("/static/<path:name>")
def static_files(name):
    return send_from_directory(STATIC_DIR, name)


@app.get("/api/health")
def health():
    """Tool availability and available options. `?refresh=1` re-scans PATH."""
    global TOOLS
    if request.args.get("refresh"):
        TOOLS = resolve_tools()
    return jsonify(
        tools={name: bool(TOOLS.get(name)) for name in ("ffmpeg", "yt_dlp", "mlx_whisper")},
        models=MODELS,
        languages=LANGUAGES,
        hf_endpoint=os.environ.get("HF_ENDPOINT"),
    )


@app.get("/api/jobs")
def list_jobs():
    with lock:
        items = sorted((public(j) for j in jobs.values()), key=lambda j: j["created"], reverse=True)
    return jsonify(items)


@app.get("/api/jobs/<job_id>")
def job_detail(job_id):
    """One job with its segments. `?since=N` returns only live segments from index N
    (`segments_from` tells the client whether it got a slice or the full list)."""
    job = public(get_job_or_404(job_id))
    live = live_segments.get(job_id)
    since = request.args.get("since", default=0, type=int)
    if live is not None:
        segments = list(live)
        since = since if 0 <= since <= len(segments) else 0
        job.update(segments=segments[since:], segments_from=since, segments_live=True)
        return jsonify(job)
    segments = []
    segments_file = job_dir(job_id) / "segments.json"
    if segments_file.exists():
        try:
            segments = json.loads(segments_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            log.warning("Job %s: unreadable segments.json", job_id)
    job.update(segments=segments, segments_from=0, segments_live=False)
    return jsonify(job)


@app.post("/api/jobs")
def create_job():
    """Create a job from multipart form data: `file` OR `url`, plus options."""
    # Checked before touching request.form, which is what spools the upload to disk.
    size = request.content_length or 0
    if size + MIN_FREE_BYTES > shutil.disk_usage(DATA_DIR).free:
        return api_error("disk_full", "Not enough free disk space.", 507)
    form = request.form
    model = form.get("model") or DEFAULT_MODEL
    if model not in MODELS:
        return api_error("unknown_model", "Unknown model.")
    language = form.get("language") or "auto"
    if language not in LANGUAGES:
        return api_error("unknown_language", "Unknown language.")
    cookies_browser = form.get("cookies_browser") or ""
    if cookies_browser not in COOKIE_BROWSERS:
        return api_error("unknown_browser", "Unknown browser.")

    job_id = time.strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:6]
    directory = job_dir(job_id)
    job = {
        "id": job_id, "status": QUEUED, "stage": "queued", "stage_pct": None, "progress": 0,
        "created": time.time(), "outputs": [], "error": None, "error_code": None,
        "segments_count": 0,
        "options": {
            "model": model,
            "language": language,
            "prompt": (form.get("prompt") or "").strip()[:1000],
            "cookies_browser": cookies_browser,
        },
    }

    upload = request.files.get("file")
    url = (form.get("url") or "").strip()
    if upload and upload.filename:
        ext = Path(upload.filename).suffix.lower()
        if ext not in MEDIA_EXTS:
            return api_error("unsupported_file", "Unsupported file type.")
        directory.mkdir(parents=True)
        dest = directory / f"source{ext}"
        spooled = getattr(upload.stream, "name", None)
        if isinstance(spooled, str) and Path(spooled).parent == DATA_DIR:
            upload.stream.flush()
            os.replace(spooled, dest)  # same filesystem: a rename, not a multi-GB copy
        else:
            upload.save(dest)
        job.update(source="upload", title=Path(upload.filename).stem, filename=upload.filename,
                   media=dest.name, media_kind="video" if ext in VIDEO_EXTS else "audio")
    elif url:
        if not re.match(r"^https?://", url, re.I):
            return api_error("invalid_url", "URL must start with http:// or https://")
        directory.mkdir(parents=True)
        job.update(source="url", url=url, title=url)
    else:
        return api_error("missing_input", "Provide a file or a URL.")

    with lock:
        jobs[job_id] = job
        save(job)
    work_queue.put(job_id)
    log.info("Job %s: queued (%s)", job_id, job["source"])
    return jsonify(public(job)), 201


@app.post("/api/jobs/<job_id>/cancel")
def cancel_job(job_id):
    job = get_job_or_404(job_id)
    if job["status"] not in ACTIVE:
        return jsonify(public(job))
    # Status first, then look up the process; run_process re-checks the status
    # right after registering its process, so neither order can miss a kill.
    update(job_id, status=CANCELLED, stage="cancelled", stage_pct=None)
    with lock:
        proc = procs.get(job_id)
    if proc:
        kill_proc(proc)
    return jsonify(public(jobs[job_id]))


@app.post("/api/jobs/<job_id>/retry")
def retry_job(job_id):
    job = get_job_or_404(job_id)
    # current_job: a cancelled job can still be winding down in the worker.
    if job["status"] in ACTIVE or current_job == job_id:
        return api_error("job_running", "Job is still running.", 409)
    directory = job_dir(job_id)
    for f in [directory / "segments.json", *(directory / f"transcript.{fmt}" for fmt in OUTPUT_FORMATS)]:
        f.unlink(missing_ok=True)
    update(job_id, reopen=True, status=QUEUED, stage="queued", stage_pct=None, stage_detail=None,
           progress=0, error=None, error_code=None, outputs=[], segments_count=0, timings={},
           elapsed=None, detected_language=None)
    work_queue.put(job_id)
    return jsonify(public(jobs[job_id]))


@app.delete("/api/jobs/<job_id>")
def delete_job(job_id):
    job = get_job_or_404(job_id)
    if job["status"] in ACTIVE:
        cancel_job(job_id)
        with lock:
            proc = procs.get(job_id)
        if proc:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except Exception:
                    proc.kill()
    with lock:
        jobs.pop(job_id, None)  # later worker updates for this id become no-ops
    shutil.rmtree(job_dir(job_id), ignore_errors=True)
    log.info("Job %s: deleted", job_id)
    return jsonify(ok=True)


@app.get("/api/jobs/<job_id>/media")
def job_media(job_id):
    """Stream the source media (supports HTTP Range for seeking)."""
    job = get_job_or_404(job_id)
    if not job.get("media"):
        abort(404)
    return send_file(job_dir(job_id) / job["media"], conditional=True)


def safe_filename(title: str | None) -> str:
    name = re.sub(r"[\\/:*?\"<>|\n\r\t]+", " ", title or "transcript").strip()
    return name[:120] or "transcript"


@app.get("/api/jobs/<job_id>/download/<fmt>")
def download_output(job_id, fmt):
    job = get_job_or_404(job_id)
    path = job_dir(job_id) / f"transcript.{fmt}"
    if fmt not in OUTPUT_FORMATS or not path.exists():
        abort(404)
    return send_file(path, as_attachment=True, download_name=f"{safe_filename(job.get('title'))}.{fmt}")


@app.post("/api/jobs/<job_id>/reveal")
def reveal_in_finder(job_id):
    get_job_or_404(job_id)
    directory = job_dir(job_id)
    target = directory / "transcript.srt"
    if sys.platform == "darwin":
        subprocess.Popen(["open", "-R", str(target if target.exists() else directory)])
    return jsonify(ok=True)


# ----------------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------------
def port_in_use() -> bool:
    """True if something already listens on HOST:PORT (e.g. an older Transkripu)."""
    with socket.socket(socket.AF_INET6 if ":" in HOST else socket.AF_INET) as s:
        s.settimeout(0.5)
        return s.connect_ex((HOST, PORT)) == 0


def main() -> None:
    if port_in_use():
        # Otherwise the browser would open whatever old server holds the port.
        print(f"\n  Port {PORT} is already in use (another Transkripu still running?).\n"
              f"  Stop it with ./stop.command or: lsof -ti tcp:{PORT} | xargs kill\n")
        sys.exit(1)
    load_jobs()
    threading.Thread(target=worker, name="transcribe-worker", daemon=True).start()
    # Tools run in their own session, so stop them explicitly on exit.
    atexit.register(kill_all_procs)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))  # run atexit on `kill` too

    url = f"http://{HOST}:{PORT}"
    print(f"\n  Transkripu is running at {url}\n  Press Ctrl+C to stop.\n")
    if not LOCAL_BIND:
        log.warning("Listening on %s: anyone on this network can use the app (no authentication).", HOST)
    missing = [name for name in ("ffmpeg", "yt_dlp", "mlx_whisper") if not TOOLS.get(name)]
    if missing:
        print("  ⚠️  Missing tools:", ", ".join(missing))
    if OPEN_BROWSER:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    app.run(host=HOST, port=PORT, threaded=True, debug=False)


if __name__ == "__main__":
    main()
