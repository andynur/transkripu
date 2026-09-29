#!/usr/bin/env python3
"""
Smoke test for Transkripu. No GPU, network or real models needed.

Starts app.py on a spare port with stub `mlx_whisper` / `yt-dlp` (scripts/stubs)
and a temporary data dir, exercises the API end to end, and checks that the
EN and ID i18n dictionaries have the same keys.

Usage:  python3 scripts/smoke_test.py        (from the repo root)
Output: one line per check, then "PASS n/n" or "FAIL k/n". Exit code 0/1.
"""
import json
import os
import py_compile
import re
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The system python3 usually has no Flask; rerun with the project venv if it exists.
try:
    import flask  # noqa: F401
except ImportError:
    venv_py = ROOT / ".venv" / "bin" / "python"
    if venv_py.exists() and Path(sys.executable).resolve() != venv_py.resolve():
        os.execv(str(venv_py), [str(venv_py), *sys.argv])
STUBS = ROOT / "scripts" / "stubs"
results: list[tuple[bool, str]] = []


def check(ok: bool, name: str, detail: str = "") -> None:
    results.append((bool(ok), name))
    print(f"{'ok ' if ok else 'FAIL'} {name}" + (f"  ({detail})" if detail and not ok else ""))


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def request(base: str, method: str, path: str, fields=None, file=None, headers=None):
    """Tiny HTTP client (stdlib only). Returns (status, parsed JSON or None)."""
    body, headers = None, dict(headers or {})
    if fields is not None or file is not None:
        boundary = uuid.uuid4().hex
        parts = []
        for k, v in (fields or {}).items():
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        if file:
            name, data = file
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\n'
                         f"Content-Type: application/octet-stream\r\n\r\n".encode() + data + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    req = urllib.request.Request(base + path, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read()
            status = r.status
    except urllib.error.HTTPError as e:
        raw, status = e.read(), e.code
    try:
        return status, json.loads(raw)
    except Exception:
        return status, None


def wait_for(base: str, job_id: str, statuses: set, timeout: float = 20) -> dict:
    deadline = time.time() + timeout
    job = {}
    while time.time() < deadline:
        _, job = request(base, "GET", f"/api/jobs/{job_id}")
        if job and job.get("status") in statuses:
            return job
        time.sleep(0.2)
    return job or {}


def i18n_keys() -> tuple[set, set]:
    src = (ROOT / "static" / "app.js").read_text()
    en = src[src.index("    en: {"):src.index("    id: {")]
    idb = src[src.index("    id: {"):src.index("  const MODEL_KEYS")]
    pat = re.compile(r'"([a-z_]+\.[\w.]+)":')
    return set(pat.findall(en)), set(pat.findall(idb))


def main() -> int:
    # Static checks
    try:
        py_compile.compile(str(ROOT / "app.py"), doraise=True)
        check(True, "app.py compiles")
    except py_compile.PyCompileError as e:
        check(False, "app.py compiles", str(e).splitlines()[-1])
        return summary()

    en, idk = i18n_keys()
    check(en == idk, "i18n en/id keys match",
          f"missing in id: {sorted(en - idk)[:5]} missing in en: {sorted(idk - en)[:5]}")

    # Server
    port = free_port()
    base = f"http://127.0.0.1:{port}"
    data_dir = tempfile.mkdtemp(prefix="transkripu-test-")
    env = dict(os.environ, TRANSKRIPU_PORT=str(port), TRANSKRIPU_DATA_DIR=data_dir,
               TRANSKRIPU_NO_BROWSER="1", TRANSKRIPU_PATH_PREPEND=str(STUBS), STUB_DELAY="0.05")
    log = open(Path(data_dir) / "server.log", "w")
    server = subprocess.Popen([sys.executable, str(ROOT / "app.py")], env=env, stdout=log, stderr=subprocess.STDOUT)
    try:
        for _ in range(50):
            try:
                status, health = request(base, "GET", "/api/health")
                if status == 200:
                    break
            except Exception:
                time.sleep(0.1)
        else:
            check(False, "server starts", f"see {log.name}")
            return summary()
        check(health["tools"]["mlx_whisper"] and health["tools"]["yt_dlp"], "health: stub tools detected", str(health["tools"]))

        # Upload flow
        s, job = request(base, "POST", "/api/jobs", {"language": "id", "prompt": "test"}, ("lecture.mp4", b"\0" * 2048))
        check(s == 201 and job.get("status") == "queued", "upload: job created", f"{s} {job}")
        job = wait_for(base, job["id"], {"done", "error"})
        check(job.get("status") == "done", "upload: job done", job.get("error") or job.get("status"))
        check(len(job.get("segments", [])) == 3, "upload: 3 segments")
        check({"srt", "vtt", "txt", "json"} <= set(job.get("outputs", [])), "upload: outputs written")
        check(set(job.get("timings", {})) >= {"model_load", "transcribe"}, "upload: timings recorded")
        s, _ = request(base, "GET", f"/api/jobs/{job['id']}/download/srt")
        check(s == 200, "upload: srt download")

        # URL flow
        s, job = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub", "language": "auto"})
        job = wait_for(base, job["id"], {"done", "error"})
        check(job.get("status") == "done" and job.get("title") == "Stub Video", "url: downloaded + transcribed",
              job.get("error") or job.get("status"))
        check("download" in job.get("timings", {}), "url: download timing")

        # Validation
        s, body = request(base, "POST", "/api/jobs", {"url": "ftp://nope"})
        check(s == 400 and body.get("error_code") == "invalid_url", "validation: invalid_url")
        s, body = request(base, "POST", "/api/jobs", {"model": "bogus", "url": "https://x.y"})
        check(s == 400 and body.get("error_code") == "unknown_model", "validation: unknown_model")

        # Retry + delete
        s, _ = request(base, "POST", f"/api/jobs/{job['id']}/retry")
        job2 = wait_for(base, job["id"], {"done", "error"})
        check(s == 200 and job2.get("status") == "done", "retry: reruns job")
        check(len(job2.get("segments", [])) == 3 and job2.get("segments_from") == 0, "detail: full segments after rerun")
        _, sliced = request(base, "GET", f"/api/jobs/{job['id']}?since=2")
        check(len(sliced.get("segments", [])) == 3, "detail: since ignored once final")

        # Validation (new checks)
        s, body = request(base, "POST", "/api/jobs", {"url": "https://x.y", "cookies_browser": "--exec"})
        check(s == 400 and body.get("error_code") == "unknown_browser", "validation: unknown_browser")
        s, body = request(base, "POST", "/api/jobs", {"language": "xx", "url": "https://x.y"})
        check(s == 400 and body.get("error_code") == "unknown_language", "validation: unknown_language")
        s, body = request(base, "POST", "/api/jobs", {}, ("evil.exe", b"MZ" * 10))
        check(s == 400 and body.get("error_code") == "unsupported_file", "validation: unsupported_file")

        # Security: cross-site requests and foreign Host headers are refused
        s, body = request(base, "POST", "/api/jobs", {"url": "https://x.y"}, headers={"Origin": "https://evil.example"})
        check(s == 403 and body.get("error_code") == "forbidden", "security: foreign Origin blocked")
        s, _ = request(base, "POST", "/api/jobs", {"url": "https://x.y"}, headers={"Sec-Fetch-Site": "cross-site"})
        check(s == 403, "security: cross-site fetch blocked")
        s, _ = request(base, "GET", "/api/jobs", headers={"Host": f"evil.example:{port}"})
        check(s == 403, "security: DNS-rebinding Host blocked")
        s, _ = request(base, "GET", "/api/jobs", headers={"Origin": base, "Sec-Fetch-Site": "same-origin"})
        check(s == 200, "security: same-origin allowed")

        # Prompt starting with "-" must not be parsed as a flag
        s, job3 = request(base, "POST", "/api/jobs", {"prompt": "-dash first"}, ("dash.mp3", b"\0" * 64))
        job3 = wait_for(base, job3["id"], {"done", "error"})
        check(job3.get("status") == "done", "prompt: leading dash ok", job3.get("error") or job3.get("status"))

        # Cancel: a running job and a queued one both end (and stay) cancelled
        _, slow = request(base, "POST", "/api/jobs", {"prompt": "STUB_SLOW"}, ("slow.wav", b"\0" * 64))
        _, queued = request(base, "POST", "/api/jobs", {}, ("queued.wav", b"\0" * 64))
        wait_for(base, slow["id"], {"transcribing"})
        request(base, "POST", f"/api/jobs/{queued['id']}/cancel")
        request(base, "POST", f"/api/jobs/{slow['id']}/cancel")
        slow = wait_for(base, slow["id"], {"done", "error"}, timeout=3)
        _, queued = request(base, "GET", f"/api/jobs/{queued['id']}")
        check(slow.get("status") == "cancelled" and queued.get("status") == "cancelled", "cancel: running + queued",
              f"{slow.get('status')} {queued.get('status')}")
        s, retried = request(base, "POST", f"/api/jobs/{slow['id']}/retry")
        check(s in (200, 409), "retry: accepted after cancel", str(s))
        if s == 200:
            check(retried.get("outputs") == [] and retried.get("segments_count") == 0, "retry: stale outputs cleared")
            wait_for(base, slow["id"], {"done", "error"})

        leftovers = [f.name for f in (Path(data_dir) / "jobs").iterdir() if f.name.startswith(".upload-")]
        check(not leftovers, "upload: no spooled temp files left", str(leftovers))
        s, _ = request(base, "DELETE", f"/api/jobs/{job['id']}")
        s2, _ = request(base, "GET", f"/api/jobs/{job['id']}")
        check(s == 200 and s2 == 404, "delete: job removed")
    finally:
        server.terminate()
        server.wait(timeout=5)
    return summary(log.name)


def summary(log_path: str = "") -> int:
    passed = sum(ok for ok, _ in results)
    total = len(results)
    if passed == total:
        print(f"PASS {passed}/{total}")
        return 0
    print(f"FAIL {total - passed}/{total}" + (f"  server log: {log_path}" if log_path else ""))
    return 1


if __name__ == "__main__":
    sys.exit(main())
