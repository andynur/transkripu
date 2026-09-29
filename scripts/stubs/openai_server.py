#!/usr/bin/env python3
"""Test stub for an OpenAI-compatible API (Gemini/Groq/Ollama style), used by smoke_test.py.

Usage: openai_server.py <port>
- GET  /models             -> stub-model, stub-429, stub-401
- POST /chat/completions   -> fixed recap / chunk notes / chat answer citing a timestamp,
                              streamed as SSE when "stream" is true
- model "stub-429" answers 429 (rate limited), "stub-401" or a wrong key answers 401
- GET  /stats              -> {"calls": [{"model", "chars", "kind"}]} for assertions
"""
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

KEY = "sk-test-stub-1234"
calls = []


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_json(self, status, data, headers=None):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        if self.headers.get("Authorization") == f"Bearer {KEY}":
            return True
        self.send_json(401, {"error": {"message": "Invalid API key"}})
        return False

    def do_GET(self):
        if self.path == "/stats":
            return self.send_json(200, {"calls": calls})
        if not self.authorized():
            return
        if self.path.rstrip("/").endswith("/models"):
            return self.send_json(200, {"object": "list", "data": [{"id": m} for m in ("stub-model", "stub-429", "stub-401")]})
        self.send_json(404, {"error": {"message": "not found"}})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        if not self.authorized():
            return
        model = body.get("model", "")
        if model == "stub-401":
            return self.send_json(401, {"error": {"message": "Invalid API key"}})
        if model == "stub-429":
            return self.send_json(429, {"error": {"message": "Rate limit reached. Please try again in 20s."}},
                                  {"Retry-After": "20"})
        prompt = body["messages"][-1]["content"]
        stamps = re.findall(r"\[(\d+:\d{2}(?::\d{2})?)\]", prompt)
        last = stamps[-1] if stamps else "00:00"
        if "The user's latest question" in prompt:
            kind, chunks = "chat", [f"Stub answer from {model} ", f"see [{last}]"]
        elif "This is part" in prompt:
            kind, chunks = "map", [f"- Note on part {prompt.count(chr(10))} ", f"[{last}]"]
        else:
            lang = "Indonesian" if "in Indonesian" in prompt else "English"
            kind, chunks = "recap", [f"# Stub HTTP recap\n\n## Summary\nA {lang} recap.\n\n", f"## Key points\n- Point [{last}]\n"]
        calls.append({"model": model, "chars": len(prompt), "kind": kind})
        text = "".join(chunks)
        if not body.get("stream"):
            return self.send_json(200, {"choices": [{"message": {"role": "assistant", "content": text}}]})
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        for c in chunks:
            self.wfile.write(f"data: {json.dumps({'choices': [{'delta': {'content': c}}]})}\n\n".encode())
            self.wfile.flush()
        self.wfile.write(b'data: {"choices": [], "usage": {"prompt_tokens": 1, "completion_tokens": 1}}\n\ndata: [DONE]\n\n')


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), Handler).serve_forever()
