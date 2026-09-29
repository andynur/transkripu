#!/usr/bin/env python3
"""
Smoke test for Transkripu. No GPU, network or real models needed.

Starts app.py on a spare port with stub `mlx_whisper` / `yt-dlp` / `claude` / `codex` (scripts/stubs),
a stub OpenAI-compatible LLM server (scripts/stubs/openai_server.py) and a temporary data dir (incl. the
SQLite chat DB and config.json), exercises the API end to end, and checks that the EN and ID i18n
dictionaries have the same keys.

Usage:  python3 scripts/smoke_test.py        (from the repo root)
Output: one line per check, then "PASS n/n" or "FAIL k/n". Exit code 0/1.
"""
import json
import os
import py_compile
import re
import socket
import sqlite3
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


def request(base: str, method: str, path: str, fields=None, file=None, headers=None, json_body=None):
    """Tiny HTTP client (stdlib only). Returns (status, parsed JSON or None)."""
    body, headers = None, dict(headers or {})
    if json_body is not None:
        body = json.dumps(json_body).encode()
        headers["Content-Type"] = "application/json"
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


def wait_chat(base: str, job_id: str, timeout: float = 10) -> dict:
    deadline = time.time() + timeout
    chat = {}
    while time.time() < deadline:
        _, chat = request(base, "GET", f"/api/jobs/{job_id}/chat")
        if chat and not chat.get("busy"):
            return chat
        time.sleep(0.1)
    return chat or {}


def wait_recap(base: str, job_id: str, timeout: float = 10) -> dict:
    deadline = time.time() + timeout
    job = {}
    while time.time() < deadline:
        _, job = request(base, "GET", f"/api/jobs/{job_id}")
        if job and job.get("recap_status") != "running":
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
               TRANSKRIPU_NO_BROWSER="1", TRANSKRIPU_PATH_PREPEND=str(STUBS), STUB_DELAY="0.05",
               # whisper_worker.py runs on this Python with the stub mlx_whisper package.
               TRANSKRIPU_WHISPER_PYTHON=sys.executable, PYTHONPATH=str(STUBS / "pylib"))
    # Real keys or CLI paths on this machine must not leak into the test.
    for name in ("GEMINI_API_KEY", "GROQ_API_KEY", "SUMOPOD_API_KEY", "OPENAI_COMPAT_API_KEY",
                 "TRANSKRIPU_CLAUDE", "TRANSKRIPU_CODEX"):
        env.pop(name, None)
    llm_port = free_port()
    llm_stub = subprocess.Popen([sys.executable, str(STUBS / "openai_server.py"), str(llm_port)])
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
        upload_json = json.loads((Path(data_dir) / "jobs" / job["id"] / "transcript.json").read_text())
        check("(whisper worker)" in (Path(data_dir) / "jobs" / job["id"] / "log.txt").read_text(),
              "worker: persistent whisper worker used")
        check(job.get("queued_at") and job["options"].get("condition_previous") is True, "upload: queued_at + default options")

        # Cheap polling: ETag/304 on the job list, detail without segments
        req = urllib.request.Request(base + "/api/jobs")
        with urllib.request.urlopen(req, timeout=5) as r:
            etag = r.headers.get("ETag")
        try:
            urllib.request.urlopen(urllib.request.Request(base + "/api/jobs", headers={"If-None-Match": etag}), timeout=5)
            not_modified = False
        except urllib.error.HTTPError as e:
            not_modified = e.code == 304
        check(etag and not_modified, "jobs: unchanged list -> 304", str(etag))
        _, lean = request(base, "GET", f"/api/jobs/{job['id']}?segments=0")
        check(lean.get("segments") is None and lean.get("disk_bytes", 0) > 0 and lean.get("status") == "done",
              "detail: segments=0 omits segments, reports disk_bytes")

        # Edit one segment: segments.json and every output rewritten
        eid = job["id"]
        s, body = request(base, "PUT", f"/api/jobs/{eid}/segments/1", json_body={"text": "  Fixed   text --> ok "})
        check(s == 200 and body.get("segment", {}).get("text") == "Fixed text --> ok", "edit: segment saved", f"{s} {body}")
        _, ej = request(base, "GET", f"/api/jobs/{eid}")
        srt = (Path(data_dir) / "jobs" / eid / "transcript.srt").read_text()
        vtt = (Path(data_dir) / "jobs" / eid / "transcript.vtt").read_text()
        tj = json.loads((Path(data_dir) / "jobs" / eid / "transcript.json").read_text())
        check(ej["segments"][1]["text"] == "Fixed text --> ok" and ej.get("edited"), "edit: detail shows the fix")
        check("2\n00:00:02,000 --> 00:00:04,000\nFixed text -> ok\n" in srt and vtt.startswith("WEBVTT")
              and "00:02.000 --> 00:04.000\nFixed text -> ok" in vtt and tj["segments"][1]["text"] == " Fixed text --> ok",
              "edit: srt/vtt/json rewritten", srt[:120])
        s, body = request(base, "PUT", f"/api/jobs/{eid}/segments/1", json_body={"text": "  "})
        check(s == 400 and body.get("error_code") == "empty_segment", "edit: empty_segment")
        s, _ = request(base, "PUT", f"/api/jobs/{eid}/segments/99", json_body={"text": "x"})
        check(s == 404, "edit: unknown segment -> 404")

        # AI recap (stub claude)
        check(health["tools"].get("claude"), "health: stub claude detected")
        rid = job["id"]
        s, body = request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "xx"})
        check(s == 400 and body.get("error_code") == "unknown_language", "recap: unknown language rejected")
        s, body = request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "id"})
        check(s == 202 and body.get("recap_status") == "running", "recap: started", f"{s} {body}")
        s, body = request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "id"})
        check(s == 409 and body.get("error_code") == "recap_running", "recap: second start refused", str(s))
        deadline, rj = time.time() + 10, {}
        while time.time() < deadline:
            _, rj = request(base, "GET", f"/api/jobs/{rid}")
            if rj.get("recap_status") != "running":
                break
            time.sleep(0.2)
        check(rj.get("recap_status") == "done" and "Indonesian" in (rj.get("recap") or "")
              and "[00:04]" in rj["recap"], "recap: done with transcript timestamps",
              f"{rj.get('recap_status')} {rj.get('recap_error')}")
        check(rj.get("recap_provider") == "claude_cli" and rj.get("recap_fallback") is True,
              "recap: no Gemini key -> claude_cli fallback", f"{rj.get('recap_provider')} {rj.get('recap_fallback')}")
        s, _ = request(base, "GET", f"/api/jobs/{rid}/download/md")
        check(s == 200, "recap: markdown download")
        s, _ = request(base, "POST", f"/api/jobs/{rid}/retry")
        _, rj = request(base, "GET", f"/api/jobs/{rid}")
        check(s == 200 and rj.get("recap") is None and rj.get("recap_status") is None, "recap: cleared on rerun")
        rj = wait_for(base, rid, {"done", "error"})
        check(rj.get("ai_lang_default") == "id", "ai lang: default follows spoken language", str(rj.get("ai_lang_default")))
        request(base, "POST", f"/api/jobs/{rid}/recap", json_body={})
        deadline = time.time() + 10
        while time.time() < deadline and rj.get("recap_status") != "done":
            time.sleep(0.2)
            _, rj = request(base, "GET", f"/api/jobs/{rid}")
        check(rj.get("recap_lang") == "id" and "Indonesian" in (rj.get("recap") or ""),
              "recap: default language = spoken language", str(rj.get("recap_lang")))

        # URL flow
        s, job = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub", "language": "auto"})
        job = wait_for(base, job["id"], {"done", "error"})
        check(job.get("status") == "done" and job.get("title") == "Stub Video", "url: downloaded + transcribed",
              job.get("error") or job.get("status"))
        check("download" in job.get("timings", {}), "url: download timing")
        check(job.get("duration") == 6, "url: duration taken from info.json", str(job.get("duration")))
        url_json = json.loads((Path(data_dir) / "jobs" / job["id"] / "transcript.json").read_text())
        check(url_json.get("stub_pid") and url_json.get("stub_pid") == upload_json.get("stub_pid"),
              "worker: model process reused across jobs", f"{upload_json.get('stub_pid')} {url_json.get('stub_pid')}")
        s, cj = request(base, "POST", "/api/jobs", {"condition_previous": "0"}, ("cond.wav", b"\0" * 64))
        cj = wait_for(base, cj["id"], {"done", "error"})
        cond = json.loads((Path(data_dir) / "jobs" / cj["id"] / "transcript.json").read_text())
        check(cj["options"].get("condition_previous") is False and cond.get("stub_condition") is False,
              "options: condition_previous=0 reaches Whisper")
        request(base, "DELETE", f"/api/jobs/{cj['id']}")

        # URL flow: site subtitles instead of Whisper
        s, sj = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub?subs=manual"})
        sj = wait_for(base, sj["id"], {"done", "error"})
        check(sj.get("status") == "done" and sj.get("transcript_source") == "manual_subs" and not sj.get("media"),
              "captions: uploaded subtitles used, no audio download", sj.get("error") or str(sj.get("transcript_source")))
        check([x["text"] for x in sj.get("segments", [])] == ["Hello from the captions.", "Second line."]
              and sj["segments"][0]["end"] == 2.0, "captions: json3 parsed, repeats merged, overlap trimmed",
              str(sj.get("segments")))
        check(sj.get("outputs") == ["srt", "vtt", "txt", "tsv", "json"] and sj.get("detected_language") == "en",
              "captions: all outputs written", str(sj.get("outputs")))
        s, _ = request(base, "POST", f"/api/jobs/{sj['id']}/retry", json_body={"transcript_source": "whisper"})
        sj = wait_for(base, sj["id"], {"done", "error"})
        check(s == 200 and sj.get("status") == "done" and sj.get("media") and sj.get("transcript_source") is None
              and sj["options"]["transcript_source"] == "whisper", "captions: rerun with Whisper downloads audio",
              sj.get("error") or str(sj.get("transcript_source")))
        s, body = request(base, "POST", f"/api/jobs/{sj['id']}/retry", json_body={"transcript_source": "nope"})
        check(s == 400 and body.get("error_code") == "unknown_transcript_source", "validation: retry transcript_source")
        request(base, "DELETE", f"/api/jobs/{sj['id']}")
        s, aj = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub?subs=auto"})
        aj = wait_for(base, aj["id"], {"done", "error"})
        check(aj.get("status") == "done" and aj.get("media") and not aj.get("transcript_source"),
              "captions: auto-captions ignored in auto mode", aj.get("error") or str(aj.get("transcript_source")))
        request(base, "DELETE", f"/api/jobs/{aj['id']}")
        s, aj = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub?subs=auto", "transcript_source": "captions"})
        aj = wait_for(base, aj["id"], {"done", "error"})
        check(aj.get("transcript_source") == "auto_captions" and aj.get("caption_lang") == "en-orig",
              "captions: original auto-caption track picked, not a translation", str(aj.get("caption_lang")))
        request(base, "DELETE", f"/api/jobs/{aj['id']}")
        s, aj = request(base, "POST", "/api/jobs", {"url": "https://youtu.be/stub?subs=manual", "language": "id"})
        aj = wait_for(base, aj["id"], {"done", "error"})
        check(aj.get("status") == "done" and not aj.get("transcript_source"),
              "captions: other-language subtitles fall back to Whisper", str(aj.get("transcript_source")))
        request(base, "DELETE", f"/api/jobs/{aj['id']}")
        s, body = request(base, "POST", "/api/jobs", {"url": "https://x.y", "transcript_source": "bogus"})
        check(s == 400 and body.get("error_code") == "unknown_transcript_source", "validation: unknown_transcript_source")

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

        # Chat (history in SQLite, stub claude)
        cid = job3["id"]
        chat_url = f"/api/jobs/{cid}/chat"
        s, chat = request(base, "GET", chat_url)
        check(s == 200 and chat.get("messages") == [] and chat.get("busy") is False, "chat: empty at start", f"{s} {chat}")
        s, body = request(base, "POST", chat_url, json_body={"text": "  "})
        check(s == 400 and body.get("error_code") == "empty_message", "chat: empty_message")
        s, body = request(base, "POST", chat_url, json_body={"text": "x" * 4001})
        check(s == 400 and body.get("error_code") == "message_too_long", "chat: message_too_long")
        s, body = request(base, "POST", chat_url, json_body={"text": "Apa intinya?"})
        check(s == 202 and body.get("message", {}).get("role") == "user", "chat: question accepted", f"{s} {body}")
        chat = wait_chat(base, cid)
        msgs = chat.get("messages", [])
        check([m["role"] for m in msgs] == ["user", "assistant"] and "[00:04]" in msgs[-1]["text"]
              and "earlier turns: 0" in msgs[-1]["text"], "chat: answer stored with timestamp", str(msgs)[:200])
        check("in English" in msgs[-1]["text"] if msgs else False, "chat: default language = detected language (en)")
        s, body = request(base, "POST", chat_url, json_body={"text": "x", "lang": "fr"})
        check(s == 400 and body.get("error_code") == "unknown_language", "chat: unknown language rejected")
        request(base, "POST", chat_url, json_body={"text": "Lalu?", "lang": "id"})
        msgs = wait_chat(base, cid).get("messages", [])
        check(len(msgs) == 4 and "earlier turns: 1" in msgs[-1]["text"], "chat: earlier turns sent as history",
              msgs[-1]["text"] if msgs else "")
        _, cj = request(base, "GET", f"/api/jobs/{cid}")
        check("in Indonesian" in msgs[-1]["text"] and msgs[-1]["meta"].get("lang") == "id" and cj.get("chat_lang") == "id",
              "chat: manual language switch applied and remembered", f"{msgs[-1]['text']} {cj.get('chat_lang')}")
        request(base, "POST", chat_url, json_body={"text": "STUB_FAIL please"})
        msgs = wait_chat(base, cid).get("messages", [])
        check(msgs and msgs[-1]["role"] == "error" and msgs[-1]["meta"].get("error_code") == "llm_cli_failed",
              "chat: claude error stored as error message", str(msgs[-1:]))
        request(base, "POST", chat_url, json_body={"text": "STUB_SLOW"})
        s, body = request(base, "POST", chat_url, json_body={"text": "again"})
        check(s == 409 and body.get("error_code") == "chat_busy", "chat: second question refused while busy", str(s))
        time.sleep(1.3)
        _, chat = request(base, "GET", chat_url)
        check(chat.get("busy") and (chat.get("partial") or "").startswith("Answer to"), "chat: partial answer streamed",
              str(chat)[:200])
        s, body = request(base, "DELETE", chat_url)
        check(s == 409 and body.get("error_code") == "chat_busy", "chat: clear refused while busy")
        chat = wait_chat(base, cid)
        check(len(chat.get("messages", [])) == 8, "chat: slow answer stored", str(len(chat.get("messages", []))))
        check("in Indonesian" in chat["messages"][-1]["text"], "chat: remembered language used without lang param")
        last_id = chat["messages"][-1]["id"] if chat.get("messages") else 0
        _, newer = request(base, "GET", f"{chat_url}?after={last_id}")
        _, tail = request(base, "GET", f"{chat_url}?after={chat['messages'][-2]['id']}")
        check(newer.get("messages") == [] and newer.get("total") == 8 and len(tail.get("messages", [])) == 1,
              "chat: ?after returns only newer messages")
        s, _ = request(base, "DELETE", chat_url)
        _, chat = request(base, "GET", chat_url)
        check(s == 200 and chat.get("messages") == [], "chat: history cleared")
        request(base, "POST", chat_url, json_body={"text": "STUB_SLOW stop me"})
        time.sleep(1.3)
        s, _ = request(base, "POST", f"{chat_url}/stop")
        chat = wait_chat(base, cid, timeout=4)
        last = (chat.get("messages") or [{}])[-1]
        check(s == 200 and not chat.get("busy") and last.get("role") == "assistant" and last["meta"].get("stopped")
              and last["text"].startswith("Answer to"), "chat: stop keeps the partial answer", str(chat)[:200])
        request(base, "POST", chat_url, json_body={"text": "keep until job is deleted"})
        wait_chat(base, cid)
        request(base, "DELETE", f"/api/jobs/{cid}")
        with sqlite3.connect(Path(data_dir) / "transkripu.db") as conn:
            left = conn.execute("SELECT COUNT(*) FROM chat_messages WHERE job_id = ?", (cid,)).fetchone()[0]
        check(left == 0, "chat: rows removed with the job (sqlite)", str(left))

        # LLM settings + providers (stub OpenAI-compatible server, stub codex)
        key = "sk-test-stub-1234"
        s, st = request(base, "GET", "/api/settings")
        check(s == 200 and st["routing"]["recap"]["provider"] == "gemini" and st["providers"]["gemini"]["status"] == "no_key",
              "settings: Gemini is the default, no key yet", str(st)[:200])
        check(st["providers"]["codex_cli"]["status"] == "ready" and st["providers"]["claude_cli"]["status"] == "ready",
              "settings: stub CLIs detected")
        s, st = request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {
            "base_url": f"http://127.0.0.1:{llm_port}/v1", "api_key": key, "model": "stub-model"}}})
        c = st.get("providers", {}).get("custom", {})
        check(s == 200 and c.get("has_key") and c.get("key_last4") == "1234" and c.get("status") == "ready",
              "settings: key saved and masked", str(c))
        with urllib.request.urlopen(base + "/api/settings", timeout=10) as r:
            raw = r.read().decode()
        cfg_file = Path(data_dir) / "config.json"
        check(key not in raw and key not in json.dumps(st), "settings: key never echoed back")
        check(cfg_file.stat().st_mode & 0o777 == 0o600, "settings: config.json is mode 0600", oct(cfg_file.stat().st_mode))
        s, st = request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"api_key": ""}}})
        check(st["providers"]["custom"]["has_key"], "settings: empty api_key keeps the key")
        s, body = request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"base_url": "file:///etc"}}})
        check(s == 400 and body.get("error_code") == "invalid_url", "settings: non-http base URL rejected")
        s, body = request(base, "PUT", "/api/settings", json_body={"routing": {"recap": {"provider": "nope"}}})
        check(s == 400 and body.get("error_code") == "unknown_provider", "settings: unknown provider rejected")
        s, body = request(base, "POST", "/api/settings/test", json_body={"provider": "custom"})
        check(s == 200 and body.get("ok") is True and body.get("latency_ms") is not None, "settings: test ok", str(body))
        s, body = request(base, "POST", "/api/settings/test", json_body={"provider": "custom", "model": "stub-401"})
        check(body.get("ok") is False and body.get("error_code") == "llm_auth", "settings: test 401 -> llm_auth", str(body))
        s, body = request(base, "POST", "/api/settings/test", json_body={"provider": "gemini"})
        check(body.get("error_code") == "llm_no_key", "settings: test without key -> llm_no_key", str(body))
        s, body = request(base, "GET", "/api/settings/models?provider=custom")
        check(s == 200 and "stub-model" in body.get("models", []), "settings: models listed", str(body))

        def llm_calls():
            with urllib.request.urlopen(f"http://127.0.0.1:{llm_port}/stats", timeout=5) as r:
                return json.loads(r.read())["calls"]

        request(base, "PUT", "/api/settings", json_body={"routing": {"recap": {"provider": "custom", "fallback": None}}})
        request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "en"})
        rj = wait_recap(base, rid)
        check(rj.get("recap_provider") == "custom" and "Stub HTTP recap" in (rj.get("recap") or "")
              and "[00:04]" in rj["recap"] and rj.get("recap_chunks") == 0,
              "recap: via OpenAI-compatible HTTP (streamed)", f"{rj.get('recap_error_code')} {rj.get('recap_error')}")
        request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"max_input_tokens": 10}}})
        before = len(llm_calls())
        request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "en"})
        rj = wait_recap(base, rid)
        kinds = [c["kind"] for c in llm_calls()[before:]]
        check(rj.get("recap_status") == "done" and rj.get("recap_chunks", 0) >= 2 and kinds.count("map") >= 2
              and kinds[-1] == "recap", "recap: chunked mode (map + reduce) over max_input_tokens",
              f"{rj.get('recap_chunks')} {kinds} {rj.get('recap_error')}")
        check((Path(data_dir) / "jobs" / rid / "recap.md").exists(), "recap: recap.md written")

        request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"max_input_tokens": 0}}, "routing": {
            "chat": {"provider": "custom", "model": "stub-429", "fallback": {"provider": "custom", "model": "stub-model"}}}})
        request(base, "DELETE", f"/api/jobs/{rid}/chat")
        request(base, "POST", f"/api/jobs/{rid}/chat", json_body={"text": "Fallback?"})
        msgs = wait_chat(base, rid).get("messages", [])
        m = msgs[-1] if msgs else {}
        check(m.get("role") == "assistant" and m["meta"].get("fallback") is True and m["meta"].get("model") == "stub-model"
              and "Stub answer from stub-model" in m["text"] and not m["meta"].get("excerpt"),
              "chat: 429 on primary -> fallback answers", str(m)[:200])
        request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"max_input_tokens": 10}}, "routing": {
            "chat": {"provider": "custom", "model": "", "fallback": None}}})
        request(base, "POST", f"/api/jobs/{rid}/chat", json_body={"text": "What about segment 2?"})
        msgs = wait_chat(base, rid).get("messages", [])
        check(msgs and msgs[-1]["meta"].get("excerpt") is True, "chat: transcript over the limit -> excerpt mode", str(msgs[-1:])[:200])
        request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"max_input_tokens": 0}}})

        request(base, "PUT", "/api/settings", json_body={"routing": {"recap": {"provider": "codex_cli", "fallback": None}}})
        request(base, "POST", f"/api/jobs/{rid}/recap", json_body={"lang": "id"})
        rj = wait_recap(base, rid)
        check(rj.get("recap_provider") == "codex_cli" and "Stub Codex recap" in (rj.get("recap") or "")
              and "Indonesian" in rj["recap"], "recap: via codex CLI (read-only flags)",
              f"{rj.get('recap_error_code')} {rj.get('recap_error')}")
        s, st = request(base, "PUT", "/api/settings", json_body={"providers": {"custom": {"api_key": None}}})
        check(not st["providers"]["custom"]["has_key"] and key not in cfg_file.read_text(), "settings: null api_key deletes it")
        log_txt = (Path(data_dir) / "jobs" / rid / "log.txt").read_text()
        check(key not in log_txt and key not in Path(log.name).read_text(), "settings: key never written to logs")

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
        s, body = request(base, "POST", f"/api/jobs/{slow['id']}/recap", json_body={})
        check(s == 409 and body.get("error_code") == "recap_not_ready", "recap: refused for unfinished job", str(s))
        s, body = request(base, "POST", f"/api/jobs/{slow['id']}/chat", json_body={"text": "hi"})
        check(s == 409 and body.get("error_code") == "chat_not_ready", "chat: refused for unfinished job", str(s))
        s, body = request(base, "PUT", f"/api/jobs/{slow['id']}/segments/0", json_body={"text": "x"})
        check(s == 409 and body.get("error_code") == "edit_not_ready", "edit: refused for unfinished job", str(s))
        s, retried = request(base, "POST", f"/api/jobs/{slow['id']}/retry")
        check(s in (200, 409), "retry: accepted after cancel", str(s))
        if s == 200:
            check(retried.get("outputs") == [] and retried.get("segments_count") == 0, "retry: stale outputs cleared")
            wait_for(base, slow["id"], {"done", "error"})

        # Free disk space: media deleted, transcript kept; an upload job can no longer rerun
        s, body = request(base, "DELETE", f"/api/jobs/{rid}/media")
        s2, _ = request(base, "GET", f"/api/jobs/{rid}/media")
        s3, _ = request(base, "GET", f"/api/jobs/{rid}/download/srt")
        check(s == 200 and body.get("media") is None and body.get("media_removed") and s2 == 404 and s3 == 200,
              "media: deleted, transcript kept", f"{s} {s2} {s3}")
        s, body = request(base, "POST", f"/api/jobs/{rid}/retry")
        check(s == 409 and body.get("error_code") == "media_removed", "media: rerun refused without source", str(s))

        leftovers = [f.name for f in (Path(data_dir) / "jobs").iterdir() if f.name.startswith(".upload-")]
        check(not leftovers, "upload: no spooled temp files left", str(leftovers))
        s, _ = request(base, "DELETE", f"/api/jobs/{job['id']}")
        s2, _ = request(base, "GET", f"/api/jobs/{job['id']}")
        check(s == 200 and s2 == 404, "delete: job removed")
    finally:
        server.terminate()
        server.wait(timeout=5)
        llm_stub.terminate()
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
