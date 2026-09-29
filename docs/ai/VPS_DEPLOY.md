# Rencana hosting di VPS Ubuntu (belum dikerjakan)

Status: **ditunda** — fokus saat ini tetap lokal (macOS, Apple Silicon). Dokumen ini mencatat apa yang harus berubah bila nanti Transkripu dipindah ke VPS Ubuntu. Riset per 2026-09-30; cek ulang harga/limit sebelum mulai.

## Ringkasan blocker

1. **`mlx_whisper` hanya jalan di Apple Silicon** (MLX). Di Linux perlu mesin transkripsi lain.
2. **YouTube memblokir IP datacenter** → download URL YouTube dari VPS sering gagal.
3. **API tanpa auth**, didesain untuk `127.0.0.1` saja → wajib dilindungi sebelum bisa diakses dari luar.

## 1. Mesin transkripsi (STT)

| Opsi | Biaya | Kecepatan | Catatan |
|---|---|---|---|
| **Groq API** `whisper-large-v3-turbo` | Free: 7.200 detik audio/jam, 28.800/hari (±8 jam audio/hari), 20 RPM, 2.000 RPD. Berbayar: $0,04/jam audio (minimum tagihan 10 detik/request) | Sangat cepat | Audio dikirim ke pihak ketiga. Batas file free tier 25 MB → re-encode ke mono 16 kHz opus dan potong per chunk bila perlu |
| **faster-whisper** (CTranslate2, CPU int8) | Hanya biaya VPS | Turbo int8 di CPU ±1–2,5× durasi audio, tergantung CPU; RAM ±1,5 GB | Tetap privat/lokal. Butuh 4–8 vCPU dedicated |
| VPS dengan GPU | Mahal | Cepat | Tidak sepadan untuk pemakaian pribadi |

**Rekomendasi:** lapisan "STT provider" seperti `PROVIDER_PRESETS` untuk LLM. Default Groq (gratis/murah), fallback faster-whisper lokal (`small` atau `turbo`). Contoh: 30 jam audio/bulan via Groq ≈ $1,2 — jauh lebih murah dari upgrade VPS.

Titik kode yang terdampak:
- `whisper_worker.py` → varian faster-whisper. Cetak segmen dengan format `[mm:ss.xxx --> mm:ss.xxx] text` yang sama supaya parser progress di `app.py` tidak berubah.
- `app.py`: `MODELS =`, `def resolve_tools`, `class WhisperWorker`, `def step_transcribe`.
- Kode error `mlx_missing` → kode generik (mis. `stt_missing`), tambah key di `I18N.en` dan `I18N.id`.
- Groq: minta `response_format=verbose_json` (segmen + timestamp), lalu tulis SRT/VTT/TXT/JSON memakai logika rewrite segmen yang sudah ada (`PUT /segments/:i`).
- Smoke test: stub baru untuk backend Groq/faster-whisper.

## 2. LLM (recap/chat)

- Gemini (default) dan Groq sudah via HTTP → aman di VPS. Catatan: free tier Gemini boleh memakai data untuk training.
- Fallback `claude_cli`/`codex_cli` bergantung login OAuth di Mac; di server merepotkan dan tidak cocok untuk langganan pribadi bila dipakai banyak orang. Ganti fallback ke Groq atau DeepSeek (via sumopod).
- Ollama/LM Studio di VPS CPU terlalu lambat untuk recap panjang → lewati.

## 3. Download YouTube

IP datacenter (Hetzner, DigitalOcean, AWS, OVH, dll.) hampir selalu kena `Sign in to confirm you're not a bot`. Opsi:
- Upload `cookies.txt` dan pakai `--cookies <file>`. `--cookies-from-browser` tidak bisa (server tanpa browser) → dropdown `COOKIE_BROWSERS` diganti field upload.
- PO token provider (bgutil, butuh Node) — hanya pencegahan, tidak membantu bila IP sudah diblok.
- Proxy residensial (berbayar).
- Terima bahwa di VPS jalur utama adalah upload file; situs non-YouTube umumnya aman.

## 4. Keamanan (wajib sebelum online)

- API tanpa auth; endpoint settings bisa mengubah API key dan `base_url` → risiko SSRF dan kuota API terkuras bila terbuka publik.
- `guard_request` hanya mengizinkan Host localhost (`ALLOWED_HOSTS`). Di belakang reverse proxy dengan domain, semua request jadi 403 → perlu env baru, mis. `TRANSKRIPU_ALLOWED_HOSTS` (update tabel config di README).
- **Paling sederhana:** app tetap bind `127.0.0.1`, akses via **Tailscale** (tanpa port publik, tanpa ubah auth).
- Bila harus publik: Caddy (HTTPS otomatis) + basic auth atau Cloudflare Access; set batas ukuran upload di proxy.
- Harus tetap **1 proses** (antrean dan worker ada di memori, invariant 3). Bila pakai gunicorn: `-w 1 --threads N` — ini dependency baru, perlu keputusan dulu (invariant 4). Server Flask bawaan di belakang proxy masih oke untuk pemakaian pribadi.

## 5. Ops di Ubuntu

- `apt install ffmpeg python3-venv`; yt-dlp di venv, auto-update mingguan (cron/systemd timer) karena YouTube sering berubah; pasang `deno`.
- `start.command`/`stop.command` khusus Mac → ganti unit **systemd** dengan `TRANSKRIPU_NO_BROWSER=1`, `TRANSKRIPU_DATA_DIR=/var/lib/transkripu`.
- Disk: media di `data/jobs` terus bertambah → kebijakan retensi (hapus media lama, simpan transkrip).
- Backup `data/transkripu.db` dan `data/config.json` (berisi API key, permission 0600).
- Masalah akses Hugging Face dari ISP Indonesia (lihat `NOTES.md`) tidak berlaku di VPS luar negeri.

## 6. Ukuran VPS

- **Mode API (Groq):** 2 vCPU / 2–4 GB RAM / disk 40 GB+ — kelas Hetzner CX22 atau setara, ±€4–6/bulan.
- **Mode lokal (faster-whisper):** 4–8 vCPU dedicated / 8–16 GB RAM — ±€15–35/bulan, tetap lebih lambat dari Groq.

## Urutan kerja bila dimulai

1. Abstraksi STT provider: backend Groq + faster-whisper, stub smoke test, key i18n baru. Putuskan default: Groq atau lokal.
2. Env `TRANSKRIPU_ALLOWED_HOSTS`, upload `cookies.txt`, fallback LLM non-CLI.
3. systemd + Caddy/Tailscale, retensi media, update README (API table + config table).

## Sumber

- Groq Speech to Text: https://console.groq.com/docs/speech-to-text
- Groq whisper-large-v3-turbo: https://console.groq.com/docs/model/whisper-large-v3-turbo
- Limit free tier Groq whisper: https://www.free-model.com/models/groq/whisper-large-v3-turbo/
- Benchmark faster-whisper turbo: https://github.com/SYSTRAN/faster-whisper/issues/1030
- whisper.cpp vs faster-whisper 2026: https://www.promptquorum.com/power-local-llm/local-whisper-stt-comparison-2026
- yt-dlp "not a bot" 2026: https://tunelio.dev/blog/yt-dlp-sign-in-to-confirm-not-a-bot/
- Blokir IP datacenter YouTube: https://ansaribilal.com/blog/ytagent-datacenter-ip-block-youtube-ai-agents-2026/
- yt-dlp issue #9890: https://github.com/yt-dlp/yt-dlp/issues/9890
