/**
 * Transkripu — frontend (vanilla JS, no build step).
 *
 * - i18n: all UI strings live in I18N below. English is the default; the
 *   EN/ID switch is stored in localStorage ("transkripu-lang").
 * - Theme: light by default; the dark-mode toggle sets <html data-theme> and
 *   is stored in localStorage ("transkripu-theme").
 * - Routing: "#/" is the home page, "#/job/<id>" the transcript page (see route()).
 * - Data: polls /api/jobs (and /api/jobs/:id while a transcript page is open).
 *   The backend sends machine-readable status/stage/error codes that are
 *   translated here.
 */
(() => {
  // ---------------------------------------------------------------- i18n
  const I18N = {
    en: {
      "nav.transcripts": "Home",
      "health.checking": "Checking…",
      "health.ok": "Ready · running locally",
      "health.missing": "{n} tool(s) missing",
      "theme.dark": "Dark mode",
      "lang.switch": "Interface language",
      "crumb.workspace": "Workspace",
      "crumb.page": "Lecture transcripts",
      "page.title": "Lecture transcripts",
      "page.desc": "Upload a video/audio file or paste a URL, and Whisper on your Mac creates a transcript & subtitles. Everything runs locally.",
      "tools.title": "Some tools are not installed",
      "tools.run": "run {cmd} in Terminal",
      "tools.after": "After installing, restart the app or click “Check again”.",
      "tools.recheck": "Check again",
      "tools.rechecked": "Tools re-checked",
      "tools.ytdlp": "yt-dlp (for URLs)",

      "create.title": "New transcript",
      "create.tabFile": "Local file",
      "create.tabUrl": "YouTube / web URL",
      "create.dropTitle": "Drop a file here or <u>browse</u>",
      "create.dropHint": "MP4, MOV, MKV, MP3, M4A, WAV, etc.",
      "create.dropReplace": "{size} · click to replace",
      "create.urlLabel": "Video URL",
      "create.urlHelp": "Only the audio track is downloaded. Paste several URLs, one per line, to queue them all.",
      "create.cookiesLabel": "Use browser sign-in",
      "create.cookiesNone": "No (public video)",
      "create.cookiesHelp": "For videos that require login, e.g. your campus LMS.",
      "create.sourceLabel": "Transcript source",
      "create.source.auto": "Uploaded subtitles if available, else Whisper",
      "create.source.captions": "Any subtitles, incl. auto-generated (fastest)",
      "create.source.whisper": "Always Whisper (best quality)",
      "create.sourceHelp": "Subtitles skip the audio download and transcription. Auto-generated ones often lack punctuation.",
      "create.model": "Model",
      "create.language": "Spoken language",
      "create.prompt": "Vocabulary hints",
      "create.optional": "(optional)",
      "create.promptPlaceholder": "e.g. Data Structures lecture: linked list, binary tree, Dijkstra's algorithm.",
      "create.promptHelp": "Technical terms, lecturer names or acronyms so they're spelled correctly.",
      "create.submit": "Start transcription",
      "create.sending": "Sending…",
      "create.uploading": "Uploading {pct}%",

      "model.turbo": "Large v3 Turbo", "model.turbo.hint": "Recommended · fast & accurate · ~1.6 GB",
      "model.large": "Large v3", "model.large.hint": "Most accurate · slower · ~3 GB",
      "model.medium": "Medium", "model.medium.hint": "Balanced · ~1.5 GB",
      "model.small": "Small", "model.small.hint": "Lightest · lower accuracy · ~0.5 GB",
      "lang.en": "English", "lang.id": "Indonesian", "lang.auto": "Auto-detect",

      "history.title": "History",
      "history.search": "Search history",
      "history.colTitle": "Title", "history.colStatus": "Status",
      "history.colProgress": "Progress", "history.colCreated": "Created",
      "history.emptyTitle": "No transcripts yet",
      "history.emptyDesc": "Upload your first lecture recording to get started.",
      "history.srcUrl": "URL", "history.srcFile": "Local file",
      "history.segments": "{n} segments",
      "history.searchHint": "Press / to search",
      "history.noMatch": "No transcripts match this filter.",
      "filter.label": "Filter by status", "filter.all": "All", "filter.active": "In progress",
      "filter.done": "Done", "filter.failed": "Failed / cancelled",

      "status.queued": "Queued", "status.downloading": "Downloading", "status.transcribing": "Transcribing",
      "status.done": "Done", "status.error": "Failed", "status.cancelled": "Cancelled",

      "stage.queued": "Waiting in queue…",
      "stage.fetching_info": "Fetching video info…",
      "stage.downloading_audio": "Downloading audio… {pct}%",
      "stage.loading_model": "Loading model…",
      "stage.downloading_model": "Downloading model (one-time)…",
      "stage.checking_captions": "Checking for subtitles…",
      "stage.downloading_captions": "Downloading subtitles…",
      "stage.detecting_language": "Detected language: {detail}",
      "stage.transcribing": "Transcribing… {pct}%",
      "stage.done": "Done", "stage.failed": "Failed", "stage.cancelled": "Cancelled",

      "err.interrupted": "Processing stopped because the server was shut down. Click “Retry” to run it again.",
      "err.ytdlp_missing": "yt-dlp not found. Install it with: brew install yt-dlp deno",
      "err.mlx_missing": "mlx-whisper not found. Install it with: pipx install mlx-whisper",
      "err.no_media": "Download finished but no audio file was found.",
      "err.no_output": "Transcription finished but no output files were found.",
      "err.invalid_url": "URL must start with http:// or https://",
      "err.missing_input": "Provide a file or a URL.",
      "err.unknown_model": "Unknown model.",
      "err.job_running": "Job is still running.",
      "err.unknown_language": "Unknown language.",
      "err.unknown_browser": "Unknown browser for sign-in.",
      "err.unknown_transcript_source": "Unknown transcript source.",
      "err.unsupported_file": "Unsupported file type. Use a video or audio file (MP4, MOV, MKV, MP3, M4A, WAV, …).",
      "err.disk_full": "Not enough free disk space for this file.",
      "err.forbidden": "Request blocked. Open the app at http://127.0.0.1:8765.",

      "drawer.close": "Close",
      "detail.back": "Back", "detail.backHint": "Back to the transcript list", "detail.crumbs": "Breadcrumb",
      "detail.notFound": "Transcript not found",
      "drawer.failed": "Processing failed",
      "drawer.transcript": "Transcript",
      "drawer.search": "Search transcript",
      "drawer.follow": "Follow playback",
      "drawer.language": "Language: {lang}",
      "drawer.processed": "processed in {d}",
      "drawer.waiting": "Text will appear here while processing…",
      "drawer.noText": "No text.",
      "drawer.noResults": "No results for “{q}”.",
      "timing.download": "Download {d}", "timing.model": "Load model {d}", "timing.transcribe": "Transcribe {d}", "timing.captions": "Subtitles {d}",

      "act.download": "Download",
      "act.srt": "SRT subtitles", "act.srt.sub": "For VLC, IINA, Premiere, YouTube",
      "act.vtt": "VTT subtitles", "act.vtt.sub": "For web players",
      "act.txt": "Plain text (.txt)", "act.txt.sub": "For notes & summaries",
      "act.json": "JSON", "act.json.sub": "Full segment data",
      "act.copy": "Copy text", "act.reveal": "Show in Finder",
      "act.cancel": "Cancel", "act.retry": "Retry", "act.rerun": "Transcribe again", "act.delete": "Delete",
      "act.confirmDelete": "Delete “{title}” and all its files?",

      "flag.noFile": "No file selected", "flag.noFileDesc": "Choose or drop a video/audio file first.",
      "flag.noUrl": "URL is empty", "flag.noUrlDesc": "Paste a YouTube or video page URL.",
      "flag.createFailed": "Could not create job",
      "flag.queued": "Added to queue",
      "flag.serverDown": "Server not responding", "flag.serverDownDesc": "Make sure the app is still running in Terminal.",
      "flag.done": "Transcript ready", "flag.failed": "Transcription failed",
      "flag.copied": "Text copied", "flag.copiedDesc": "{n} segments copied to clipboard",
      "flag.cancelled": "Cancelled", "flag.requeued": "Queued again", "flag.deleted": "Deleted",
      "flag.actionFailed": "Action failed", "flag.connect": "Cannot reach the server",
      "recap.title": "AI recap",
      "recap.intro": "Turn this transcript into study notes: summary, key points with timestamps, terms, action items and review questions.",
      "ai.using": "Uses {provider}", "ai.change": "Change in AI settings",
      "recap.generate": "Generate recap", "recap.regenerate": "Regenerate", "recap.retry": "Try again",
      "recap.regenerateIn": "Regenerate in {lang}",
      "ai.lang": "Output language (default: language of the recording)",
      "recap.running": "Writing the recap… this usually takes 20–90 seconds.",
      "stage.recap_map": "Long transcript: reading it in parts… {pct}%",
      "stage.recap_reduce": "Combining the notes into a recap…",
      "recap.copy": "Copy", "recap.download": "Download .md",
      "recap.failed": "Recap failed",
      "recap.meta": "Written by {provider} · {model} in {d}. Check important facts against the transcript.",
      "recap.chunks": "Read in {n} parts.", "ai.fallback": "fallback",
      "recap.jump": "Play from {t}",
      "flag.recapDone": "Recap ready", "flag.recapFailed": "Recap failed", "flag.recapCopied": "Recap copied",
      "err.recap_not_ready": "The transcript is not finished yet.",
      "err.recap_running": "A recap is already being generated.",
      "err.recap_failed": "Something went wrong while writing the recap.",
      "err.recap_interrupted": "The recap stopped because the server was shut down. Try again.",
      "chat.title": "Ask about this recording",
      "chat.intro": "Ask anything about this transcript. The AI answers from the transcript (and the recap, if there is one) and cites timestamps you can click.",
      "chat.s1": "What is the main idea, in simple words?",
      "chat.s2": "List the 3 most important takeaways.",
      "chat.s3": "Quiz me with 3 questions, then check my answers.",
      "chat.suggesting": "Finding questions about this recording…", "chat.followups": "Ask next",
      "chat.edit": "Edit", "chat.regen": "Regenerate", "chat.editing": "Editing your last question", "chat.editCancel": "Cancel",
      "chapters.title": "Chapters", "chapters.intro": "Split the recording into titled chapters you can jump to.",
      "chapters.generate": "Find chapters", "chapters.regenerate": "Redo", "chapters.regenerateIn": "Redo in {lang}",
      "chapters.running": "Finding chapters…", "chapters.failed": "Could not find chapters",
      "quiz.title": "Quiz", "quiz.intro": "Test yourself with multiple-choice questions written from this recording.",
      "quiz.make": "{n} questions", "quiz.new": "New quiz", "quiz.running": "Writing the quiz…", "quiz.failed": "Could not write the quiz",
      "quiz.check": "Check answers", "quiz.score": "Score {s}/{n}", "quiz.best": "Best {s}/{n}", "quiz.unanswered": "{n} not answered yet",
      "quiz.correct": "Correct", "quiz.wrong": "Not quite", "quiz.retake": "Try again",
      "act.notes": "Study notes", "act.notes.sub": ".md with chapters, recap and chat",
      "act.print": "Print / PDF", "act.print.sub": "Chapters, recap and chat, ready to print",
      "notes.chapters": "Chapters", "notes.recap": "Recap", "notes.chat": "Questions & answers", "notes.q": "Q",
      "flag.notesSaved": "Study notes downloaded",
      "tags.placeholder": "+ tag", "tags.remove": "Remove tag {tag}", "tags.label": "Tags", "filter.tags": "Filter by tag",
      "search.inTranscripts": "Found in transcripts", "search.more": "+{n} more in this transcript", "search.searching": "Searching transcripts…",
      "estimate.len": "Length {d}", "estimate.eta": "≈ {d} to transcribe", "estimate.based": "based on {n} earlier jobs with this model",
      "onboard.s1": "Add a recording", "onboard.s1d": "Drop a file or paste a YouTube or web link above.",
      "onboard.s2": "Pick a model", "onboard.s2d": "Turbo is fast and accurate enough for most lectures.",
      "onboard.s3": "Study with AI", "onboard.s3d": "Get a recap, chapters and a quiz, and ask questions with clickable timestamps.",
      "onboard.ai": "Recap, chat, chapters and quizzes need an AI provider.", "onboard.aiBtn": "Set up AI",
      "err.ai_bad_reply": "The AI reply could not be read. Try again.", "err.study_busy": "This is already being generated.",
      "err.study_not_ready": "The transcript is not finished yet.", "err.chat_empty": "There is no question to answer again.",
      "chat.placeholder": "Ask a question…", "chat.send": "Send", "chat.copy": "Copy",
      "chat.clear": "Clear chat", "chat.confirmClear": "Delete the whole chat for this transcript?",
      "chat.thinking": "Thinking…", "chat.failed": "No answer", "chat.stop": "Stop",
      "chat.help": "Enter to send · Shift+Enter for a new line · answers in {lang} · {provider}",
      "chat.excerpt": "partial context", "chat.stopped": "stopped",
      "flag.chatFailed": "Could not send", "flag.chatCopied": "Answer copied",
      "err.empty_message": "Type a question first.",
      "err.message_too_long": "Questions can be at most 4000 characters.",
      "err.chat_not_ready": "The transcript is not finished yet.",
      "err.chat_busy": "The previous answer is still being written.",
      "err.chat_failed": "Something went wrong while answering.",

      "settings.open": "AI settings", "settings.title": "AI settings", "settings.meta": "Recap & chat",
      "settings.routing": "Routing",
      "settings.routingHelp": "Which provider writes recaps and answers chat. If it can't (no key, rate limit, offline), the fallback takes over.",
      "settings.providers": "Providers",
      "settings.providersHelp": "API keys are stored only on this Mac (data/config.json) and are never shown again.",
      "settings.recap": "Recap", "settings.chat": "Chat",
      "settings.provider": "Provider", "settings.model": "Model", "settings.fallback": "Fallback",
      "settings.fallbackModel": "Fallback model", "settings.none": "None",
      "settings.modelDefault": "Default: {model}", "settings.modelCli": "CLI default",
      "settings.baseUrl": "Base URL", "settings.apiKey": "API key", "settings.apiKeyOptional": "API key (optional)",
      "settings.keyNew": "Paste API key", "settings.keySaved": "Saved key ••••{last4}", "settings.keySavedShort": "Key saved",
      "settings.keyEnv": "Key from environment variable {name}", "settings.keyRemove": "Remove key",
      "settings.show": "Show", "settings.hide": "Hide",
      "settings.loadModels": "Load models", "settings.modelsLoaded": "{n} models loaded",
      "settings.maxTokens": "Max input tokens",
      "settings.maxTokensHelp": "Longer transcripts are recapped in parts and chat uses the best-matching excerpts. Empty = no limit.",
      "settings.test": "Test", "settings.testFailed": "Failed", "settings.testOk": "Connected · {ms} ms", "settings.saved": "Saved",
      "settings.usedFor": "Used for: {tasks}", "settings.urlSumopod": "Copy from the SumoPod dashboard",
      "pstatus.ready": "Ready", "pstatus.local": "Local", "pstatus.no_key": "No key", "pstatus.no_url": "No URL",
      "pstatus.not_installed": "Not installed",
      "provider.gemini": "Google Gemini", "provider.groq": "Groq", "provider.sumopod": "SumoPod",
      "provider.ollama": "Ollama", "provider.lmstudio": "LM Studio", "provider.custom": "Custom (OpenAI-compatible)",
      "provider.claude_cli": "Claude Code CLI", "provider.codex_cli": "Codex CLI",
      "help.gemini": "Free tier with a large context: a 1-hour lecture fits in one request. On the free tier, Google may use the data you send to improve its products.",
      "help.groq": "Fast. The free tier allows about 8K tokens per minute, so long recaps run in parts and may pause between requests.",
      "help.sumopod": "Paid in IDR (QRIS).",
      "help.ollama": "Offline on this Mac. Start Ollama and pull the model first.",
      "help.lmstudio": "Offline on this Mac. Start LM Studio's local server; an empty model uses the loaded one.",
      "help.custom": "Any OpenAI-compatible /chat/completions endpoint.",
      "help.claude_cli": "Uses your Claude Code login and plan. Runs with no tools, in an empty temporary folder.",
      "help.codex_cli": "Uses your Codex login and plan. Runs in a read-only sandbox, in an empty temporary folder.",
      "err.llm_no_key": "No API key set for this provider. Add one in AI settings.",
      "err.llm_no_url": "The provider has no base URL. Set it in AI settings.",
      "err.llm_auth": "The provider rejected the API key. Check it in AI settings.",
      "err.llm_rate_limited": "Rate limit reached. Wait a moment, or pick another provider or a fallback.",
      "err.llm_context_too_long": "The transcript is too long for this model. Set “Max input tokens” in AI settings or pick a model with a larger context.",
      "err.llm_unreachable": "Cannot reach the provider. Check the base URL and your connection (is Ollama / LM Studio running?).",
      "err.llm_server_error": "The provider had a server error. Try again later.",
      "err.llm_cli_missing": "This CLI is not installed. Install it, then click “Check again”.",
      "err.llm_cli_failed": "The CLI returned an error. Make sure you are logged in (run it once in Terminal).",
      "err.llm_timeout": "The model did not answer in time. Try again.",
      "err.llm_bad_response": "The provider sent an unexpected answer.",
      "err.llm_model_not_found": "Model not found. Pick one with “Load models”.",
      "err.unknown_provider": "Unknown provider.", "err.invalid_settings": "Invalid settings.",

      "create.dropMany": "{n} files selected",
      "create.dropManyHint": "{size} in total · click to replace",
      "create.uploadingMany": "Uploading {i}/{n} · {pct}%",
      "create.condition": "Reduce repeated lines",
      "create.conditionHelp": "Turn on if long or quiet recordings repeat the same sentence. Wording can be slightly less consistent.",
      "flag.queuedMany": "{n} jobs added to queue",
      "history.queuePos": "#{n} in queue",
      "eta.left": "~{d} left",
      "eta.speed": "{x}× real time",
      "drawer.disk": "{size} on disk",
      "drawer.edited": "edited",
      "drawer.editHint": "Double-click a line to correct it. Enter saves, Esc cancels.",
      "drawer.shortcuts": "K or Space: play/pause · J / L: back / forward 5 s.",
      "drawer.mediaRemoved": "The source media was deleted to save space. The transcript is kept.",
      "drawer.src.manual_subs": "from uploaded subtitles", "drawer.src.auto_captions": "from auto-generated subtitles",
      "drawer.noMediaCaptions": "Transcript taken from the video's subtitles, so no audio was downloaded.",
      "act.whisper": "Transcribe with Whisper",
      "act.deleteMedia": "Delete media file",
      "act.confirmDeleteMedia": "Delete the media file of “{title}” ({size})? The transcript, recap and chat stay.",
      "act.confirmDeleteMediaUpload": "You can no longer transcribe it again.",
      "flag.mediaDeleted": "Media file deleted", "flag.segSaved": "Line saved",
      "err.media_removed": "The source file was deleted, so this job cannot run again.",
      "err.empty_segment": "A line cannot be empty.",
      "err.segment_too_long": "A line can be at most 2000 characters.",
      "err.edit_not_ready": "The transcript is not finished yet.",

      "unit.sec": "{n}s", "unit.min": "{n} min", "unit.hour": "{h} h {m} min", "unit.lt1": "<1s",
    },

    id: {
      "nav.transcripts": "Beranda",
      "health.checking": "Memeriksa…",
      "health.ok": "Siap · berjalan lokal",
      "health.missing": "{n} tool belum ada",
      "theme.dark": "Mode gelap",
      "lang.switch": "Bahasa antarmuka",
      "crumb.workspace": "Ruang kerja",
      "crumb.page": "Transkrip kuliah",
      "page.title": "Transkrip kuliah",
      "page.desc": "Unggah video/audio atau tempel URL, lalu model Whisper di Mac Anda membuat transkrip & subtitle. Semua diproses secara lokal.",
      "tools.title": "Beberapa tool belum terpasang",
      "tools.run": "jalankan {cmd} di Terminal",
      "tools.after": "Setelah terpasang, mulai ulang aplikasi atau klik “Periksa ulang”.",
      "tools.recheck": "Periksa ulang",
      "tools.rechecked": "Tool diperiksa ulang",
      "tools.ytdlp": "yt-dlp (untuk URL)",

      "create.title": "Buat transkrip",
      "create.tabFile": "File lokal",
      "create.tabUrl": "URL YouTube / web",
      "create.dropTitle": "Seret file ke sini atau <u>pilih file</u>",
      "create.dropHint": "MP4, MOV, MKV, MP3, M4A, WAV, dll.",
      "create.dropReplace": "{size} · klik untuk mengganti",
      "create.urlLabel": "URL video",
      "create.urlHelp": "Hanya audionya yang diunduh. Tempel beberapa URL, satu per baris, untuk mengantrekan semuanya.",
      "create.cookiesLabel": "Pakai sesi login browser",
      "create.cookiesNone": "Tidak (video publik)",
      "create.cookiesHelp": "Untuk video yang perlu login, misalnya LMS kampus.",
      "create.sourceLabel": "Sumber transkrip",
      "create.source.auto": "Subtitle unggahan bila ada, selain itu Whisper",
      "create.source.captions": "Subtitle apa pun, termasuk otomatis (tercepat)",
      "create.source.whisper": "Selalu Whisper (kualitas terbaik)",
      "create.sourceHelp": "Subtitle melewati unduh audio dan transkripsi. Subtitle otomatis sering tanpa tanda baca.",
      "create.model": "Model",
      "create.language": "Bahasa ucapan",
      "create.prompt": "Petunjuk istilah",
      "create.optional": "(opsional)",
      "create.promptPlaceholder": "Contoh: Kuliah Struktur Data: linked list, binary tree, algoritma Dijkstra.",
      "create.promptHelp": "Istilah teknis, nama dosen, atau singkatan agar ejaannya benar.",
      "create.submit": "Mulai transkrip",
      "create.sending": "Mengirim…",
      "create.uploading": "Mengunggah {pct}%",

      "model.turbo": "Large v3 Turbo", "model.turbo.hint": "Direkomendasikan · cepat & akurat · ±1,6 GB",
      "model.large": "Large v3", "model.large.hint": "Paling akurat · lebih lambat · ±3 GB",
      "model.medium": "Medium", "model.medium.hint": "Seimbang · ±1,5 GB",
      "model.small": "Small", "model.small.hint": "Paling ringan · akurasi lebih rendah · ±0,5 GB",
      "lang.en": "Bahasa Inggris", "lang.id": "Bahasa Indonesia", "lang.auto": "Deteksi otomatis",

      "history.title": "Riwayat",
      "history.search": "Cari riwayat",
      "history.colTitle": "Judul", "history.colStatus": "Status",
      "history.colProgress": "Progres", "history.colCreated": "Dibuat",
      "history.emptyTitle": "Belum ada transkrip",
      "history.emptyDesc": "Unggah rekaman kuliah pertama Anda untuk memulai.",
      "history.srcUrl": "URL", "history.srcFile": "File lokal",
      "history.segments": "{n} segmen",
      "history.searchHint": "Tekan / untuk mencari",
      "history.noMatch": "Tidak ada transkrip yang cocok dengan filter ini.",
      "filter.label": "Saring berdasarkan status", "filter.all": "Semua", "filter.active": "Diproses",
      "filter.done": "Selesai", "filter.failed": "Gagal / dibatalkan",

      "status.queued": "Antrean", "status.downloading": "Mengunduh", "status.transcribing": "Mentranskrip",
      "status.done": "Selesai", "status.error": "Gagal", "status.cancelled": "Dibatalkan",

      "stage.queued": "Menunggu antrean…",
      "stage.fetching_info": "Mengambil info video…",
      "stage.downloading_audio": "Mengunduh audio… {pct}%",
      "stage.loading_model": "Memuat model…",
      "stage.downloading_model": "Mengunduh model (hanya sekali)…",
      "stage.checking_captions": "Memeriksa subtitle…",
      "stage.downloading_captions": "Mengunduh subtitle…",
      "stage.detecting_language": "Bahasa terdeteksi: {detail}",
      "stage.transcribing": "Mentranskrip… {pct}%",
      "stage.done": "Selesai", "stage.failed": "Gagal", "stage.cancelled": "Dibatalkan",

      "err.interrupted": "Proses terhenti karena server ditutup. Klik “Ulangi” untuk menjalankan lagi.",
      "err.ytdlp_missing": "yt-dlp tidak ditemukan. Pasang dengan: brew install yt-dlp deno",
      "err.mlx_missing": "mlx-whisper tidak ditemukan. Pasang dengan: pipx install mlx-whisper",
      "err.no_media": "Unduhan selesai tetapi file audio tidak ditemukan.",
      "err.no_output": "Transkripsi selesai tetapi file hasil tidak ditemukan.",
      "err.invalid_url": "URL harus diawali http:// atau https://",
      "err.missing_input": "Pilih file atau masukkan URL.",
      "err.unknown_model": "Model tidak dikenal.",
      "err.job_running": "Job masih berjalan.",
      "err.unknown_language": "Bahasa tidak dikenal.",
      "err.unknown_browser": "Browser untuk login tidak dikenal.",
      "err.unknown_transcript_source": "Sumber transkrip tidak dikenal.",
      "err.unsupported_file": "Jenis file tidak didukung. Gunakan file video atau audio (MP4, MOV, MKV, MP3, M4A, WAV, …).",
      "err.disk_full": "Ruang disk tidak cukup untuk file ini.",
      "err.forbidden": "Permintaan diblokir. Buka aplikasi di http://127.0.0.1:8765.",

      "drawer.close": "Tutup",
      "detail.back": "Kembali", "detail.backHint": "Kembali ke daftar transkrip", "detail.crumbs": "Navigasi",
      "detail.notFound": "Transkrip tidak ditemukan",
      "drawer.failed": "Gagal diproses",
      "drawer.transcript": "Transkrip",
      "drawer.search": "Cari di transkrip",
      "drawer.follow": "Ikuti pemutaran",
      "drawer.language": "Bahasa: {lang}",
      "drawer.processed": "diproses {d}",
      "drawer.waiting": "Teks akan muncul di sini selama proses berjalan…",
      "drawer.noText": "Tidak ada teks.",
      "drawer.noResults": "Tidak ada hasil untuk “{q}”.",
      "timing.download": "Unduh {d}", "timing.model": "Muat model {d}", "timing.transcribe": "Transkrip {d}", "timing.captions": "Subtitle {d}",

      "act.download": "Unduh",
      "act.srt": "Subtitle SRT", "act.srt.sub": "Untuk VLC, IINA, Premiere, YouTube",
      "act.vtt": "Subtitle VTT", "act.vtt.sub": "Untuk web player",
      "act.txt": "Teks polos (.txt)", "act.txt.sub": "Untuk catatan & ringkasan",
      "act.json": "JSON", "act.json.sub": "Data segmen lengkap",
      "act.copy": "Salin teks", "act.reveal": "Tampilkan di Finder",
      "act.cancel": "Batalkan", "act.retry": "Ulangi", "act.rerun": "Transkrip ulang", "act.delete": "Hapus",
      "act.confirmDelete": "Hapus “{title}” beserta semua filenya?",

      "flag.noFile": "Belum ada file", "flag.noFileDesc": "Pilih atau seret file video/audio terlebih dahulu.",
      "flag.noUrl": "URL kosong", "flag.noUrlDesc": "Tempel URL YouTube atau halaman video.",
      "flag.createFailed": "Gagal membuat job",
      "flag.queued": "Masuk antrean",
      "flag.serverDown": "Server tidak merespons", "flag.serverDownDesc": "Pastikan aplikasi masih berjalan di Terminal.",
      "flag.done": "Transkrip selesai", "flag.failed": "Transkrip gagal",
      "flag.copied": "Teks disalin", "flag.copiedDesc": "{n} segmen disalin ke clipboard",
      "flag.cancelled": "Dibatalkan", "flag.requeued": "Masuk antrean lagi", "flag.deleted": "Dihapus",
      "flag.actionFailed": "Aksi gagal", "flag.connect": "Tidak bisa terhubung ke server",
      "recap.title": "Rekap AI",
      "recap.intro": "Ubah transkrip ini menjadi catatan belajar: ringkasan, poin penting dengan timestamp, istilah, tugas, dan pertanyaan latihan.",
      "ai.using": "Memakai {provider}", "ai.change": "Ubah di Pengaturan AI",
      "recap.generate": "Buat rekap", "recap.regenerate": "Buat ulang", "recap.retry": "Coba lagi",
      "recap.regenerateIn": "Buat ulang dalam {lang}",
      "ai.lang": "Bahasa hasil (default: bahasa rekaman)",
      "recap.running": "Sedang menulis rekap… biasanya 20–90 detik.",
      "stage.recap_map": "Transkrip panjang: dibaca per bagian… {pct}%",
      "stage.recap_reduce": "Menggabungkan catatan menjadi rekap…",
      "recap.copy": "Salin", "recap.download": "Unduh .md",
      "recap.failed": "Rekap gagal",
      "recap.meta": "Ditulis oleh {provider} · {model} dalam {d}. Cek fakta penting dengan transkripnya.",
      "recap.chunks": "Dibaca dalam {n} bagian.", "ai.fallback": "cadangan",
      "recap.jump": "Putar dari {t}",
      "flag.recapDone": "Rekap selesai", "flag.recapFailed": "Rekap gagal", "flag.recapCopied": "Rekap disalin",
      "err.recap_not_ready": "Transkrip belum selesai.",
      "err.recap_running": "Rekap sedang dibuat.",
      "err.recap_failed": "Terjadi kesalahan saat menulis rekap.",
      "err.recap_interrupted": "Rekap terhenti karena server ditutup. Coba lagi.",
      "chat.title": "Tanya tentang rekaman ini",
      "chat.intro": "Tanyakan apa saja tentang transkrip ini. AI menjawab berdasarkan transkrip (dan rekap, jika ada) serta menyertakan timestamp yang bisa diklik.",
      "chat.s1": "Apa ide utamanya, dengan bahasa sederhana?",
      "chat.s2": "Sebutkan 3 poin terpenting.",
      "chat.s3": "Beri saya kuis 3 soal, lalu periksa jawaban saya.",
      "chat.suggesting": "Mencari pertanyaan tentang rekaman ini…", "chat.followups": "Tanya selanjutnya",
      "chat.edit": "Ubah", "chat.regen": "Buat ulang", "chat.editing": "Mengubah pertanyaan terakhir", "chat.editCancel": "Batal",
      "chapters.title": "Bab", "chapters.intro": "Bagi rekaman menjadi bab berjudul yang bisa langsung dilompati.",
      "chapters.generate": "Buat bab", "chapters.regenerate": "Ulangi", "chapters.regenerateIn": "Ulangi dalam {lang}",
      "chapters.running": "Mencari bab…", "chapters.failed": "Gagal membuat bab",
      "quiz.title": "Kuis", "quiz.intro": "Uji pemahaman dengan soal pilihan ganda yang dibuat dari rekaman ini.",
      "quiz.make": "{n} soal", "quiz.new": "Kuis baru", "quiz.running": "Menyusun kuis…", "quiz.failed": "Gagal menyusun kuis",
      "quiz.check": "Periksa jawaban", "quiz.score": "Skor {s}/{n}", "quiz.best": "Terbaik {s}/{n}", "quiz.unanswered": "{n} belum dijawab",
      "quiz.correct": "Benar", "quiz.wrong": "Belum tepat", "quiz.retake": "Coba lagi",
      "act.notes": "Catatan belajar", "act.notes.sub": ".md berisi bab, rekap, dan chat",
      "act.print": "Cetak / PDF", "act.print.sub": "Bab, rekap, dan chat, siap dicetak",
      "notes.chapters": "Bab", "notes.recap": "Rekap", "notes.chat": "Tanya jawab", "notes.q": "T",
      "flag.notesSaved": "Catatan belajar diunduh",
      "tags.placeholder": "+ tag", "tags.remove": "Hapus tag {tag}", "tags.label": "Tag", "filter.tags": "Saring per tag",
      "search.inTranscripts": "Ditemukan di transkrip", "search.more": "+{n} lagi di transkrip ini", "search.searching": "Mencari di transkrip…",
      "estimate.len": "Durasi {d}", "estimate.eta": "≈ {d} untuk ditranskrip", "estimate.based": "berdasarkan {n} pekerjaan sebelumnya dengan model ini",
      "onboard.s1": "Tambah rekaman", "onboard.s1d": "Seret file atau tempel link YouTube/web di atas.",
      "onboard.s2": "Pilih model", "onboard.s2d": "Turbo cepat dan cukup akurat untuk sebagian besar kuliah.",
      "onboard.s3": "Belajar dengan AI", "onboard.s3d": "Dapatkan rekap, bab, dan kuis, lalu bertanya dengan timestamp yang bisa diklik.",
      "onboard.ai": "Rekap, chat, bab, dan kuis memerlukan provider AI.", "onboard.aiBtn": "Atur AI",
      "err.ai_bad_reply": "Balasan AI tidak bisa dibaca. Coba lagi.", "err.study_busy": "Sedang dibuat.",
      "err.study_not_ready": "Transkrip belum selesai.", "err.chat_empty": "Belum ada pertanyaan untuk dijawab ulang.",
      "chat.placeholder": "Tulis pertanyaan…", "chat.send": "Kirim", "chat.copy": "Salin",
      "chat.clear": "Hapus chat", "chat.confirmClear": "Hapus seluruh chat untuk transkrip ini?",
      "chat.thinking": "Sedang berpikir…", "chat.failed": "Tidak ada jawaban", "chat.stop": "Hentikan",
      "chat.help": "Enter untuk kirim · Shift+Enter untuk baris baru · jawaban dalam {lang} · {provider}",
      "chat.excerpt": "konteks sebagian", "chat.stopped": "dihentikan",
      "flag.chatFailed": "Gagal mengirim", "flag.chatCopied": "Jawaban disalin",
      "err.empty_message": "Tulis pertanyaan terlebih dahulu.",
      "err.message_too_long": "Pertanyaan maksimal 4000 karakter.",
      "err.chat_not_ready": "Transkrip belum selesai.",
      "err.chat_busy": "Jawaban sebelumnya masih ditulis.",
      "err.chat_failed": "Terjadi kesalahan saat menjawab.",

      "settings.open": "Pengaturan AI", "settings.title": "Pengaturan AI", "settings.meta": "Rekap & chat",
      "settings.routing": "Rute",
      "settings.routingHelp": "Provider yang menulis rekap dan menjawab chat. Jika gagal (tanpa key, kena limit, offline), cadangannya yang dipakai.",
      "settings.providers": "Provider",
      "settings.providersHelp": "API key hanya disimpan di Mac ini (data/config.json) dan tidak pernah ditampilkan lagi.",
      "settings.recap": "Rekap", "settings.chat": "Chat",
      "settings.provider": "Provider", "settings.model": "Model", "settings.fallback": "Cadangan",
      "settings.fallbackModel": "Model cadangan", "settings.none": "Tidak ada",
      "settings.modelDefault": "Default: {model}", "settings.modelCli": "Default CLI",
      "settings.baseUrl": "Base URL", "settings.apiKey": "API key", "settings.apiKeyOptional": "API key (opsional)",
      "settings.keyNew": "Tempel API key", "settings.keySaved": "Key tersimpan ••••{last4}", "settings.keySavedShort": "Key tersimpan",
      "settings.keyEnv": "Key dari variabel lingkungan {name}", "settings.keyRemove": "Hapus key",
      "settings.show": "Lihat", "settings.hide": "Sembunyikan",
      "settings.loadModels": "Muat model", "settings.modelsLoaded": "{n} model dimuat",
      "settings.maxTokens": "Maks. token input",
      "settings.maxTokensHelp": "Transkrip yang lebih panjang direkap per bagian dan chat memakai potongan yang paling relevan. Kosong = tanpa batas.",
      "settings.test": "Tes", "settings.testFailed": "Gagal", "settings.testOk": "Terhubung · {ms} ms", "settings.saved": "Tersimpan",
      "settings.usedFor": "Dipakai untuk: {tasks}", "settings.urlSumopod": "Salin dari dashboard SumoPod",
      "pstatus.ready": "Siap", "pstatus.local": "Lokal", "pstatus.no_key": "Tanpa key", "pstatus.no_url": "Tanpa URL",
      "pstatus.not_installed": "Belum terpasang",
      "provider.gemini": "Google Gemini", "provider.groq": "Groq", "provider.sumopod": "SumoPod",
      "provider.ollama": "Ollama", "provider.lmstudio": "LM Studio", "provider.custom": "Kustom (kompatibel OpenAI)",
      "provider.claude_cli": "Claude Code CLI", "provider.codex_cli": "Codex CLI",
      "help.gemini": "Tier gratis dengan konteks besar: kuliah 1 jam muat dalam satu permintaan. Di tier gratis, Google dapat memakai data yang dikirim untuk meningkatkan produknya.",
      "help.groq": "Cepat. Tier gratis sekitar 8K token per menit, jadi rekap panjang dibuat per bagian dan bisa jeda di antara permintaan.",
      "help.sumopod": "Berbayar dalam Rupiah (QRIS).",
      "help.ollama": "Offline di Mac ini. Jalankan Ollama dan unduh modelnya dulu.",
      "help.lmstudio": "Offline di Mac ini. Jalankan server lokal LM Studio; model kosong = model yang sedang dimuat.",
      "help.custom": "Endpoint /chat/completions apa pun yang kompatibel dengan OpenAI.",
      "help.claude_cli": "Memakai login dan paket Claude Code kamu. Berjalan tanpa tool, di folder sementara yang kosong.",
      "help.codex_cli": "Memakai login dan paket Codex kamu. Berjalan di sandbox read-only, di folder sementara yang kosong.",
      "err.llm_no_key": "Provider ini belum punya API key. Tambahkan di Pengaturan AI.",
      "err.llm_no_url": "Provider ini belum punya base URL. Isi di Pengaturan AI.",
      "err.llm_auth": "API key ditolak provider. Periksa di Pengaturan AI.",
      "err.llm_rate_limited": "Kena batas pemakaian. Tunggu sebentar, atau pilih provider lain atau cadangan.",
      "err.llm_context_too_long": "Transkrip terlalu panjang untuk model ini. Isi “Maks. token input” di Pengaturan AI atau pilih model dengan konteks lebih besar.",
      "err.llm_unreachable": "Provider tidak bisa dihubungi. Periksa base URL dan koneksi (Ollama / LM Studio sudah jalan?).",
      "err.llm_server_error": "Server provider sedang error. Coba lagi nanti.",
      "err.llm_cli_missing": "CLI ini belum terpasang. Pasang dulu, lalu klik “Periksa ulang”.",
      "err.llm_cli_failed": "CLI mengembalikan error. Pastikan sudah login (jalankan sekali di Terminal).",
      "err.llm_timeout": "Model tidak menjawab tepat waktu. Coba lagi.",
      "err.llm_bad_response": "Provider mengirim jawaban yang tidak terduga.",
      "err.llm_model_not_found": "Model tidak ditemukan. Pilih lewat “Muat model”.",
      "err.unknown_provider": "Provider tidak dikenal.", "err.invalid_settings": "Pengaturan tidak valid.",

      "create.dropMany": "{n} file dipilih",
      "create.dropManyHint": "Total {size} · klik untuk mengganti",
      "create.uploadingMany": "Mengunggah {i}/{n} · {pct}%",
      "create.condition": "Kurangi kalimat berulang",
      "create.conditionHelp": "Aktifkan bila rekaman panjang atau banyak hening mengulang kalimat yang sama. Pilihan kata bisa sedikit kurang konsisten.",
      "flag.queuedMany": "{n} tugas masuk antrean",
      "history.queuePos": "Antrean ke-{n}",
      "eta.left": "sisa ~{d}",
      "eta.speed": "{x}× waktu nyata",
      "drawer.disk": "{size} di disk",
      "drawer.edited": "diedit",
      "drawer.editHint": "Klik dua kali pada baris untuk memperbaikinya. Enter menyimpan, Esc membatalkan.",
      "drawer.shortcuts": "K atau Spasi: putar/jeda · J / L: mundur / maju 5 dtk.",
      "drawer.mediaRemoved": "File media sumber sudah dihapus untuk menghemat ruang. Transkrip tetap tersimpan.",
      "drawer.src.manual_subs": "dari subtitle unggahan", "drawer.src.auto_captions": "dari subtitle otomatis",
      "drawer.noMediaCaptions": "Transkrip diambil dari subtitle video, jadi audio tidak diunduh.",
      "act.whisper": "Transkrip dengan Whisper",
      "act.deleteMedia": "Hapus file media",
      "act.confirmDeleteMedia": "Hapus file media “{title}” ({size})? Transkrip, rekap, dan chat tetap ada.",
      "act.confirmDeleteMediaUpload": "Tugas ini tidak bisa ditranskrip ulang lagi.",
      "flag.mediaDeleted": "File media dihapus", "flag.segSaved": "Baris disimpan",
      "err.media_removed": "File sumber sudah dihapus, jadi tugas ini tidak bisa dijalankan lagi.",
      "err.empty_segment": "Baris tidak boleh kosong.",
      "err.segment_too_long": "Satu baris maksimal 2000 karakter.",
      "err.edit_not_ready": "Transkrip belum selesai.",

      "unit.sec": "{n} dtk", "unit.min": "{n} mnt", "unit.hour": "{h} j {m} mnt", "unit.lt1": "<1 dtk",
    },
  };

  const MODEL_KEYS = {
    "mlx-community/whisper-large-v3-turbo": "turbo",
    "mlx-community/whisper-large-v3-mlx": "large",
    "mlx-community/whisper-medium-mlx": "medium",
    "mlx-community/whisper-small-mlx": "small",
  };

  const LS_LANG = "transkripu-lang";
  const LS_THEME = "transkripu-theme";
  const LS_PREFS = "transkripu-prefs";

  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  let lang = storage.get(LS_LANG) === "id" ? "id" : "en";

  /** Translate `key`, replacing {placeholders} from `vars`. Falls back to English, then the key. */
  function t(key, vars = {}) {
    const s = I18N[lang][key] ?? I18N.en[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  }

  // ---------------------------------------------------------------- helpers
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ACTIVE = new Set(["queued", "downloading", "transcribing"]);

  const state = {
    tab: "file", files: [], jobs: [], models: [], languages: [],
    openId: null, detail: null, renderedSegKey: "", renderedSegCount: 0, segCache: null, mediaFor: null,
    historyQuery: "", statusFilter: "all", segQuery: "", activeSeg: -1, health: null, chat: null, recapLang: null, chatLang: null, starters: {},
    studyLang: {}, studyBusy: {}, studyError: {}, quizPick: {}, quizResult: null, chatEdit: false,
    tagFilter: null, search: null, fileDur: 0,
    settings: null, settingsOpen: false,
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clock = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };
  const locale = () => (lang === "id" ? "id-ID" : "en-US");
  const fmtDate = (ts) => new Date(ts * 1000).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  /** Human duration: "42s", "12 min", "1 h 5 min". */
  const fmtDur = (sec) => {
    if (sec == null) return "";
    if (sec < 1) return t("unit.lt1");
    if (sec < 60) return t("unit.sec", { n: Math.round(sec) });
    const m = Math.round(sec / 60);
    return m >= 60 ? t("unit.hour", { h: Math.floor(m / 60), m: m % 60 }) : t("unit.min", { n: m });
  };
  const fmtSize = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");

  const LOZENGE_KIND = { queued: "", downloading: "inprogress", transcribing: "inprogress", done: "success", error: "removed", cancelled: "moved" };
  const lozenge = (status) => {
    const kind = LOZENGE_KIND[status] ?? "";
    return `<span class="lozenge ${kind ? "lozenge--" + kind : ""}">${esc(t("status." + status))}</span>`;
  };
  /** Stage text from the backend's machine-readable stage (older jobs may carry free text). */
  const stageText = (j) => (I18N.en["stage." + j.stage] ? t("stage." + j.stage, { pct: j.stage_pct ?? 0, detail: j.stage_detail ?? "" }) : j.stage || "");
  const errorText = (code, fallback) => (code && I18N.en["err." + code] ? t("err." + code) : fallback || "");

  async function api(path, opts = {}) {
    const r = await fetch(path, opts);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(errorText(data.error_code, data.error) || `HTTP ${r.status}`);
    return data;
  }

  // ---------------------------------------------------------------- flags (toasts)
  const ICONS = {
    success: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"/>',
    error: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
    info: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
  };
  function flag(kind, title, desc = "") {
    const el = document.createElement("div");
    el.className = `flag flag--${kind}`;
    el.innerHTML = `<svg class="flag__icon" viewBox="0 0 24 24">${ICONS[kind]}</svg>
      <div><div class="flag__title">${esc(title)}</div>${desc ? `<div class="flag__desc">${esc(desc)}</div>` : ""}</div>`;
    $("#flags").appendChild(el);
    setTimeout(() => el.remove(), kind === "error" ? 8000 : 4500);
  }

  // ---------------------------------------------------------------- language & theme
  function applyStaticTranslations() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
    $$("#langSwitch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  function setLanguage(next) {
    lang = next;
    storage.set(LS_LANG, lang);
    applyStaticTranslations();
    renderOptions();
    renderFile();
    renderHealth();
    renderJobs();
    if (state.detail) {
      $("#dActions").dataset.key = "";
      state.renderedSegKey = "";
      renderDetail(state.detail);
      renderChat(true);
    }
    if (state.settingsOpen) renderSettings();
  }

  function setTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    $("#themeToggle").checked = theme === "dark";
    if (persist) storage.set(LS_THEME, theme);
  }

  // ---------------------------------------------------------------- health & options
  async function loadHealth(refresh = false) {
    state.health = await api("/api/health" + (refresh ? "?refresh=1" : ""));
    state.models = state.health.models;
    state.languages = state.health.languages;
    renderOptions(true);
    renderHealth();
  }

  function renderOptions(restore = false) {
    const mSel = $("#modelInput"), lSel = $("#langInput");
    const mVal = mSel.value, lVal = lSel.value;
    mSel.innerHTML = state.models.map((id) => `<option value="${esc(id)}">${esc(t("model." + (MODEL_KEYS[id] || id)))}</option>`).join("");
    lSel.innerHTML = state.languages.map((id) => `<option value="${esc(id)}">${esc(t("lang." + id))}</option>`).join("");
    if (mVal) mSel.value = mVal;
    if (lVal) lSel.value = lVal;
    if (restore) restorePrefs();
    updateModelHint();
  }

  function renderHealth() {
    const h = state.health;
    if (!h) return;
    const missing = [];
    if (!h.tools.ffmpeg) missing.push(["ffmpeg", "brew install ffmpeg"]);
    if (!h.tools.mlx_whisper) missing.push(["mlx-whisper", "pipx install mlx-whisper"]);
    if (!h.tools.yt_dlp) missing.push([t("tools.ytdlp"), "brew install yt-dlp deno"]);
    const el = $("#health");
    el.classList.toggle("is-ok", !missing.length);
    el.classList.toggle("is-warn", !!missing.length);
    $(".health__text", el).textContent = missing.length ? t("health.missing", { n: missing.length }) : t("health.ok");
    $("#toolWarning").hidden = !missing.length;
    $("#toolWarningBody").innerHTML =
      missing.map(([n, c]) => `<div><b>${esc(n)}</b>: ${t("tools.run", { cmd: `<code>${esc(c)}</code>` })}</div>`).join("") +
      `<div style="margin-top:6px">${esc(t("tools.after"))}</div>`;
  }

  // ---------------------------------------------------------------- form preferences
  function savePrefs() {
    storage.set(LS_PREFS, JSON.stringify({ model: $("#modelInput").value, language: $("#langInput").value, prompt: $("#promptInput").value,
      noCondition: $("#conditionInput").checked, source: $("#sourceInput").value }));
  }
  function restorePrefs() {
    let p = {};
    try { p = JSON.parse(storage.get(LS_PREFS) || "{}"); } catch {}
    if (p.model && state.models.includes(p.model)) $("#modelInput").value = p.model;
    if (p.language && state.languages.includes(p.language)) $("#langInput").value = p.language;
    else $("#langInput").value = "auto";
    if (p.prompt) $("#promptInput").value = p.prompt;
    $("#conditionInput").checked = !!p.noCondition;
    if (["auto", "captions", "whisper"].includes(p.source)) $("#sourceInput").value = p.source;
  }
  function updateModelHint() {
    const key = MODEL_KEYS[$("#modelInput").value];
    $("#modelHint").textContent = key ? t(`model.${key}.hint`) : "";
  }

  // ---------------------------------------------------------------- create form
  function setTab(tab) {
    state.tab = tab;
    $$(".tab").forEach((el) => el.classList.toggle("is-active", el.dataset.tab === tab));
    $$(".tabpanel").forEach((p) => (p.hidden = p.dataset.panel !== tab));
    renderEstimate();
  }
  function setFiles(list) { state.files = [...(list || [])]; renderFile(); measureFiles(); }

  /** Length of one media file from its metadata (0 when the browser can't read it). */
  const mediaLength = (file) => new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith("video") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (sec) => { clearTimeout(timer); URL.revokeObjectURL(url); resolve(Number.isFinite(sec) ? sec : 0); };
    const timer = setTimeout(() => done(0), 5000);
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    el.src = url;
  });
  async function measureFiles() {
    const files = state.files;
    state.fileDur = 0;
    renderEstimate();
    const lengths = await Promise.all(files.map(mediaLength));
    if (files !== state.files) return; // selection changed meanwhile
    state.fileDur = lengths.reduce((a, b) => a + b, 0);
    renderEstimate();
  }
  /** Median speed (media seconds per second of transcription) of earlier jobs with `model`. */
  function modelSpeed(model) {
    const r = state.jobs.filter((j) => j.status === "done" && j.options?.model === model && !j.transcript_source
      && j.duration > 0 && j.timings?.transcribe > 0).map((j) => j.duration / j.timings.transcribe).sort((a, b) => a - b);
    return r.length ? { x: r[r.length >> 1], n: r.length } : null;
  }
  function renderEstimate() {
    const el = $("#estimate");
    if (state.tab !== "file" || !state.fileDur) { el.textContent = ""; return; }
    const speed = modelSpeed($("#modelInput").value);
    el.textContent = [t("estimate.len", { d: fmtDur(state.fileDur) }),
      speed ? `${t("estimate.eta", { d: fmtDur(state.fileDur / speed.x) })} (${t("estimate.based", { n: speed.n })})` : ""].filter(Boolean).join(" · ");
  }
  function renderFile() {
    const fs = state.files, size = fs.reduce((n, f) => n + f.size, 0);
    $("#dropzone").classList.toggle("has-file", fs.length > 0);
    $("#dropTitle").innerHTML = fs.length > 1 ? esc(t("create.dropMany", { n: fs.length })) : fs.length ? esc(fs[0].name) : t("create.dropTitle");
    $("#dropHint").textContent = fs.length > 1 ? t("create.dropManyHint", { size: fmtSize(size) })
      : fs.length ? t("create.dropReplace", { size: fmtSize(size) }) : t("create.dropHint");
  }
  function resetSubmit() {
    const btn = $("#submitBtn");
    btn.disabled = false;
    btn.textContent = t("create.submit");
  }

  /** POST one job (XHR, not fetch, so large uploads report progress). Resolves with the job. */
  function postJob(fd, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/jobs");
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100)); };
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 300) reject(new Error(errorText(data.error_code, data.error) || `HTTP ${xhr.status}`));
        else resolve(data);
      };
      xhr.onerror = () => reject(Object.assign(new Error(t("flag.serverDownDesc")), { down: true }));
      xhr.send(fd);
    });
  }

  /** One job per selected file or per pasted URL, posted one after another. */
  async function submit(e) {
    e.preventDefault();
    const form = () => {
      const fd = new FormData();
      fd.append("model", $("#modelInput").value);
      fd.append("language", $("#langInput").value);
      fd.append("prompt", $("#promptInput").value);
      if ($("#conditionInput").checked) fd.append("condition_previous", "0");
      return fd;
    };
    let items;
    if (state.tab === "file") {
      if (!state.files.length) return flag("error", t("flag.noFile"), t("flag.noFileDesc"));
      items = state.files.map((f) => { const fd = form(); fd.append("file", f); return fd; });
    } else {
      const urls = $("#urlInput").value.split(/\s+/).filter(Boolean);
      if (!urls.length) return flag("error", t("flag.noUrl"), t("flag.noUrlDesc"));
      items = urls.map((u) => { const fd = form(); fd.append("url", u); fd.append("cookies_browser", $("#cookiesInput").value);
        fd.append("transcript_source", $("#sourceInput").value); return fd; });
    }
    savePrefs();
    // Ask once, on a click, so a finished job can notify while the tab is in the background.
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${esc(t("create.sending"))}`;
    const created = [];
    for (const [i, fd] of items.entries()) {
      try {
        created.push(await postJob(fd, (pct) => {
          if (state.tab !== "file") return;
          const label = items.length > 1 ? t("create.uploadingMany", { i: i + 1, n: items.length, pct }) : t("create.uploading", { pct });
          btn.innerHTML = `<span class="spinner"></span> ${esc(label)}`;
        }));
      } catch (err) {
        flag("error", err.down ? t("flag.serverDown") : t("flag.createFailed"), err.message);
        if (err.down) break;
      }
    }
    resetSubmit();
    if (!created.length) return;
    flag("success", created.length > 1 ? t("flag.queuedMany", { n: created.length }) : t("flag.queued"), created.length > 1 ? "" : created[0].title);
    if (created.length === items.length) {
      setFiles([]);
      $("#fileInput").value = "";
      $("#urlInput").value = "";
    }
    await refreshJobs();
    openDrawer(created[0].id);
  }

  // ---------------------------------------------------------------- history table
  const lastStatus = {};
  const lastRecap = {};
  let jobsEtag = null;
  /** Poll the job list; an unchanged list comes back as 304 and is not re-rendered. */
  async function refreshJobs() {
    const r = await fetch("/api/jobs", { cache: "no-store", headers: jobsEtag ? { "If-None-Match": jobsEtag } : {} });
    if (r.status === 304) return;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const jobs = await r.json();
    jobsEtag = r.headers.get("ETag");
    const tell = (kind, key, title) => { flag(kind, t(key), title); notify(t(key), title); };
    for (const j of jobs) {
      const prev = lastStatus[j.id];
      if (prev && prev !== j.status) {
        if (j.status === "done") tell("success", "flag.done", j.title);
        if (j.status === "error") tell("error", "flag.failed", j.title);
      }
      lastStatus[j.id] = j.status;
      if (lastRecap[j.id] === "running" && j.recap_status === "done") tell("success", "flag.recapDone", j.title);
      if (lastRecap[j.id] === "running" && j.recap_status === "error") tell("error", "flag.recapFailed", j.title);
      lastRecap[j.id] = j.recap_status;
    }
    state.jobs = jobs;
    renderJobs();
  }

  /** System notification, only while the tab is in the background (and allowed). */
  function notify(title, body) {
    if (!document.hidden || !("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(title, { body, tag: "transkripu" }); } catch {}
  }

  /** "~4 min left · 3.1× real time" for a transcribing job, from its progress so far. */
  function eta(j) {
    if (j.status !== "transcribing" || !j.transcribe_started || !j.duration || !j.stage_pct) return "";
    const frac = j.stage_pct / 100, elapsed = Date.now() / 1000 - j.transcribe_started;
    if (frac < 0.02 || frac >= 1 || elapsed < 5) return "";
    return `${t("eta.left", { d: fmtDur((elapsed * (1 - frac)) / frac) })} · ${t("eta.speed", { x: ((frac * j.duration) / elapsed).toFixed(1) })}`;
  }

  /** Queue position (1 = next) of each queued job, in the order the worker takes them. */
  function queuePositions(jobs) {
    const q = jobs.filter((j) => j.status === "queued").sort((a, b) => (a.queued_at || a.created) - (b.queued_at || b.created));
    return Object.fromEntries(q.map((j, i) => [j.id, i + 1]));
  }

  const ICON_URL = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z"/></svg>';
  const ICON_FILE = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';

  const FILTERS = {
    all: () => true,
    active: (j) => ACTIVE.has(j.status),
    done: (j) => j.status === "done",
    failed: (j) => j.status === "error" || j.status === "cancelled",
  };

  function renderJobs() {
    const q = state.historyQuery.toLowerCase();
    const byStatus = FILTERS[state.statusFilter];
    const allTags = [...new Set(state.jobs.flatMap((j) => j.tags || []))].sort((a, b) => a.localeCompare(b));
    if (state.tagFilter && !allTags.includes(state.tagFilter)) state.tagFilter = null;
    const tagKey = `${allTags.join("\u0001")}|${state.tagFilter || ""}`;
    if ($("#tagFilter").dataset.key !== tagKey) {
      $("#tagFilter").dataset.key = tagKey;
      $("#tagFilter").hidden = !allTags.length;
      $("#tagFilter").innerHTML = allTags.map((tag) => `<button type="button" class="chip chip--tag" data-tag="${esc(tag)}" aria-pressed="${tag === state.tagFilter}">#${esc(tag)}</button>`).join("");
    }
    const jobs = state.jobs.filter((j) => byStatus(j) && (!state.tagFilter || (j.tags || []).includes(state.tagFilter))
      && (!q || (j.title || "").toLowerCase().includes(q) || (j.tags || []).some((tag) => tag.toLowerCase().includes(q))));
    $$("#statusFilter .chip").forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.filter === state.statusFilter));
      $(".chip__count", c).textContent = state.jobs.filter(FILTERS[c.dataset.filter]).length;
    });
    $("#emptyState").hidden = state.jobs.length > 0;
    const chatProvider = state.settings?.providers?.[routeProvider("chat")];
    $("#emptyAi").hidden = !chatProvider || ["ready", "local"].includes(chatProvider.status);
    $("#noMatch").hidden = !state.jobs.length || jobs.length > 0;
    // Show the running job's progress in the browser tab title.
    const running = state.jobs.find((j) => j.status === "transcribing" || j.status === "downloading");
    const base = state.openId && state.detail?.title ? `${state.detail.title} · Transkripu` : "Transkripu";
    document.title = running ? `(${Math.round(running.progress || 0)}%) ${base}` : base;
    // Rows are patched, not rebuilt: progress/sub-line change in place, other rows keep focus and hover.
    const pos = queuePositions(state.jobs);
    const tbody = $("#jobRows");
    const old = new Map($$("tr[data-id]", tbody).map((tr) => [tr.dataset.id, tr]));
    let prev = null;
    for (const j of jobs) {
      const v = jobRow(j, pos[j.id]);
      let tr = old.get(j.id);
      old.delete(j.id);
      if (!tr || tr._key !== v.key) {
        const tmp = document.createElement("tbody");
        tmp.innerHTML = v.html;
        const fresh = tmp.firstElementChild;
        fresh._key = v.key;
        if (tr) {
          const hadFocus = document.activeElement === tr;
          tr.replaceWith(fresh);
          if (hadFocus) fresh.focus();
        }
        tr = fresh;
      } else {
        $(".job-title__sub", tr).textContent = v.sub;
        $(".progress__bar", tr).style.width = `${v.pct}%`;
        $(".progress-cell > span", tr).textContent = `${v.pct}%`;
      }
      const at = prev ? prev.nextElementSibling : tbody.firstElementChild;
      if (at !== tr) tbody.insertBefore(tr, at);
      prev = tr;
    }
    old.forEach((tr) => tr.remove());
  }

  /** One history row: `key` covers everything except progress and the sub-line. */
  function jobRow(j, queuePos) {
    const isUrl = j.source === "url";
    const pct = j.status === "done" ? 100 : Math.round(j.progress || 0);
    const barCls = j.status === "done" ? "progress--done" : j.status === "error" ? "progress--error" : "";
    const sub = [
      t(isUrl ? "history.srcUrl" : "history.srcFile"),
      j.duration ? fmtDur(j.duration) : "",
      j.segments_count ? t("history.segments", { n: j.segments_count }) : "",
      queuePos ? t("history.queuePos", { n: queuePos }) : "",
      eta(j),
    ].filter(Boolean).join(" · ");
    const selected = state.openId === j.id;
    const tags = (j.tags || []).map((tag) => `<span class="job-tag">#${esc(tag)}</span>`).join("");
    const key = [lang, j.title, j.status, isUrl, selected, j.created, (j.tags || []).join("\u0001")].join("|");
    const html = `<tr data-id="${esc(j.id)}" tabindex="0" class="${selected ? "is-selected" : ""}">
        <td><div class="job-title">
          <span class="job-title__icon job-title__icon--${isUrl ? "url" : "upload"}">${isUrl ? ICON_URL : ICON_FILE}</span>
          <span class="job-title__text"><span class="job-title__name" title="${esc(j.title)}">${esc(j.title)}${tags}</span><span class="job-title__sub">${esc(sub)}</span></span>
        </div></td>
        <td>${lozenge(j.status)}</td>
        <td><div class="progress-cell"><div class="progress ${barCls}"><div class="progress__bar" style="width:${pct}%"></div></div><span>${pct}%</span></div></td>
        <td><span class="date">${fmtDate(j.created)}</span></td>
      </tr>`;
    return { key, html, sub, pct };
  }

  // ---------------------------------------------------------------- routing: "#/" home, "#/job/<id>" transcript page
  // Opening a job from the app pushes a history entry marked fromHome, so Back returns to the
  // list (scroll and focus restored); a deep link or reload gets a Back that replaces instead.
  const routeId = () => { const m = location.hash.match(/^#\/job\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
  let homeScroll = 0, lastOpenId = null;

  function openDrawer(id) {
    if (routeId() === id) return route();
    history.pushState({ fromHome: !routeId() }, "", `#/job/${encodeURIComponent(id)}`);
    return route();
  }

  function goHome() {
    if (history.state?.fromHome) history.back();
    else { history.replaceState(null, "", "#/"); route(); }
  }

  async function route() {
    const id = routeId();
    if (id === state.openId) return;
    if (id) return showDetail(id);
    closeDetail();
    $("#detailView").hidden = true;
    $("#homeView").hidden = false;
    $(".topnav__link").classList.add("is-active");
    renderJobs();
    window.scrollTo(0, homeScroll);
    $(`#jobRows tr[data-id="${CSS.escape(lastOpenId || "")}"]`)?.focus({ preventScroll: true });
  }

  async function showDetail(id) {
    if (!state.openId) homeScroll = window.scrollY;
    closeDetail();
    Object.assign(state, { openId: id, renderedSegKey: "", renderedSegCount: 0, segCache: null, mediaFor: null, activeSeg: -1, segQuery: "" });
    lastOpenId = id;
    $("#segSearch").value = "";
    $("#dActions").dataset.key = "";
    $("#dRecap").dataset.key = "";
    Object.assign(state, { chat: null, recapLang: null, chatLang: null, studyLang: {}, studyError: {}, quizPick: {}, quizResult: null, chatEdit: false });
    ["#dChapters", "#dQuiz", "#dTags"].forEach((sel) => { $(sel).dataset.key = ""; });
    $("#chatEdit").hidden = true;
    $("#chatLang").dataset.key = "";
    $("#chatInput").value = "";
    const cached = state.jobs.find((j) => j.id === id);
    $("#dTitle").textContent = $("#dCrumb").textContent = cached?.title || "";
    $("#dMeta").innerHTML = "";
    $("#homeView").hidden = true;
    $("#detailView").hidden = false;
    $(".topnav__link").classList.remove("is-active");
    window.scrollTo(0, 0);
    $("#dTitle").focus({ preventScroll: true });
    renderJobs();
    await refreshDetail();
    loadChat();
  }

  /** Stop playback and drop the open job's state (leaving the page or switching jobs). */
  function closeDetail() {
    if (!state.openId) return;
    $("#dPlayer video, #dPlayer audio")?.pause();
    $("#dPlayer").innerHTML = "";
    $("#dSegments").innerHTML = "";
    clearTimeout(chatTimer);
    Object.assign(state, { chat: null, openId: null, detail: null, segCache: null });
  }

  /** Fetch the open job. While it is transcribing, only new live segments are requested (?since=N);
   *  once its final segments are cached (e.g. while a recap runs), none at all (?segments=0). */
  async function refreshDetail() {
    const id = state.openId;
    if (!id) return;
    const c = state.segCache;
    const since = c && c.id === id && c.live ? c.segs.length : 0;
    const lean = !!c && c.id === id && !c.live && state.detail?.id === id && !ACTIVE.has(state.detail.status);
    let d;
    try {
      d = await api(`/api/jobs/${encodeURIComponent(id)}${since ? `?since=${since}` : lean ? "?segments=0" : ""}`);
    } catch (err) {
      if (state.openId !== id) return;
      flag("error", t("detail.notFound"), err.message);
      return goHome();
    }
    if (state.openId !== id) return; // page switched while the request was in flight
    if (d.segments == null) {
      if (!lean || state.segCache !== c) { state.segCache = null; return refreshDetail(); }
    } else if (d.segments_from > 0) {
      if (!c || c.segs.length !== d.segments_from) { state.segCache = null; return refreshDetail(); } // out of sync: refetch all
      c.segs.push(...d.segments);
    } else {
      state.segCache = { id, live: !!d.segments_live, segs: d.segments || [] };
    }
    state.segCache.live = !!d.segments_live;
    d.segments = state.segCache.segs;
    const titled = state.detail?.title === d.title;
    state.detail = d;
    renderDetail(d);
    if (!titled) renderJobs(); // tab title shows the open transcript
  }

  function timingLine(tm) {
    if (!tm) return "";
    const parts = [
      tm.captions != null ? t("timing.captions", { d: fmtDur(tm.captions) }) : "",
      tm.download != null ? t("timing.download", { d: fmtDur(tm.download) }) : "",
      tm.model_load != null ? t("timing.model", { d: fmtDur(tm.model_load) }) : "",
      tm.transcribe != null ? t("timing.transcribe", { d: fmtDur(tm.transcribe) }) : "",
    ].filter(Boolean);
    return parts.length ? `<span class="timings">⏱ ${esc(parts.join(" · "))}</span>` : "";
  }

  function downloadItem(d, fmt) {
    if (!(d.outputs || []).includes(fmt)) return "";
    return `<a class="dropdown__item" href="/api/jobs/${d.id}/download/${fmt}">${esc(t("act." + fmt))}<small>${esc(t(`act.${fmt}.sub`))}</small></a>`;
  }

  function renderDetail(d) {
    const modelKey = MODEL_KEYS[d.options?.model];
    const langLabel = d.detected_language ? t("drawer.language", { lang: d.detected_language }) : t("lang." + (d.options?.language || "auto"));
    $("#dMeta").innerHTML = [
      lozenge(d.status),
      `<span>${esc(modelKey ? t("model." + modelKey) : d.options?.model || "")}</span>`,
      `<span>· ${esc(langLabel)}</span>`,
      d.duration ? `<span>· ${esc(fmtDur(d.duration))}</span>` : "",
      d.elapsed ? `<span>· ${esc(t("drawer.processed", { d: fmtDur(d.elapsed) }))}</span>` : "",
      d.disk_bytes ? `<span>· ${esc(t("drawer.disk", { size: fmtSize(d.disk_bytes) }))}</span>` : "",
      d.transcript_source ? `<span>· ${esc(t("drawer.src." + d.transcript_source))}</span>` : "",
      d.edited ? `<span>· ${esc(t("drawer.edited"))}</span>` : "",
    ].join("") + timingLine(d.timings);
    $("#dTitle").textContent = $("#dCrumb").textContent = d.title || "";

    // Action bar — only re-rendered when status/outputs change so an open dropdown survives polling.
    const actionsKey = `${lang}:${d.status}:${(d.outputs || []).join()}:${d.media || ""}:${d.transcript_source || ""}`;
    const canRerun = d.source !== "upload" || !!d.media;
    if ($("#dActions").dataset.key !== actionsKey) {
      const a = [];
      if (d.status === "done") {
        a.push(`<div class="dropdown"><button class="btn btn--primary" data-act="dl-menu">${esc(t("act.download"))}
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.3 10.3a1 1 0 0 1 1.4 0L12 12.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0l-3-3a1 1 0 0 1 0-1.4z"/></svg></button>
          <div class="dropdown__menu" hidden>${["srt", "vtt", "txt", "json"].map((f) => downloadItem(d, f)).join("")}
          <button type="button" class="dropdown__item" data-act="notes-md">${esc(t("act.notes"))}<small>${esc(t("act.notes.sub"))}</small></button>
          <button type="button" class="dropdown__item" data-act="notes-print">${esc(t("act.print"))}<small>${esc(t("act.print.sub"))}</small></button></div></div>`);
        a.push(`<button class="btn" data-act="copy">${esc(t("act.copy"))}</button>`);
        a.push(`<button class="btn" data-act="reveal">${esc(t("act.reveal"))}</button>`);
        if (d.transcript_source) a.push(`<button class="btn" data-act="whisper">${esc(t("act.whisper"))}</button>`);
        else if (canRerun) a.push(`<button class="btn" data-act="retry">${esc(t("act.rerun"))}</button>`);
      }
      if (ACTIVE.has(d.status)) a.push(`<button class="btn" data-act="cancel">${esc(t("act.cancel"))}</button>`);
      if ((d.status === "error" || d.status === "cancelled") && canRerun) a.push(`<button class="btn btn--primary" data-act="retry">${esc(t("act.retry"))}</button>`);
      a.push(`<span style="flex:1"></span>`);
      if (d.media && !ACTIVE.has(d.status)) a.push(`<button class="btn btn--subtle" data-act="delete-media">${esc(t("act.deleteMedia"))}</button>`);
      a.push(`<button class="btn btn--subtle" data-act="delete">${esc(t("act.delete"))}</button>`);
      $("#dActions").innerHTML = a.join("");
      $("#dActions").dataset.key = actionsKey;
    }

    const active = ACTIVE.has(d.status);
    $("#dProgress").hidden = !active;
    if (active) {
      const pos = d.status === "queued" ? queuePositions(state.jobs)[d.id] : 0;
      $("#dStage").textContent = [stageText(d), pos ? t("history.queuePos", { n: pos }) : "", eta(d)].filter(Boolean).join(" · ");
      $("#dPct").textContent = `${Math.round(d.progress || 0)}%`;
      $("#dBar").style.width = `${d.progress || 0}%`;
    }
    $("#dError").hidden = d.status !== "error";
    $("#dErrorText").textContent = errorText(d.error_code, d.error);

    // Media player — created once per job so playback isn't interrupted by polling.
    if (d.media && state.mediaFor !== d.id + d.media) {
      state.mediaFor = d.id + d.media;
      const tag = d.media_kind === "video" ? "video" : "audio";
      $("#dPlayer").innerHTML = `<${tag} controls preload="metadata" src="/api/jobs/${d.id}/media?v=${encodeURIComponent(d.media)}"></${tag}>`;
      const media = $("#dPlayer " + tag);
      media.addEventListener("timeupdate", () => highlightAt(media.currentTime));
    } else if (!d.media && state.mediaFor !== `none:${lang}:${!!d.media_removed}:${d.transcript_source || ""}`) {
      state.mediaFor = `none:${lang}:${!!d.media_removed}:${d.transcript_source || ""}`;
      const note = d.media_removed ? "drawer.mediaRemoved" : d.transcript_source ? "drawer.noMediaCaptions" : "";
      $("#dPlayer").innerHTML = note ? `<p class="player__note">${esc(t(note))}</p>` : "";
    }
    $("#dSegHint").hidden = d.status !== "done";

    renderTags(d);
    renderChapters(d);
    renderRecap(d);
    renderChat();
    renderQuiz(d);
    renderSegments(d);
  }

  // ---------------------------------------------------------------- AI recap
  const tsSeconds = (ts) => ts.split(":").reduce((acc, n) => acc * 60 + Number(n), 0);

  /** Inline Markdown on escaped text: code, bold, italic, and [mm:ss] timestamps as seek buttons. */
  function mdInline(text, maxSec) {
    return esc(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, (m, ts) => {
        const sec = tsSeconds(ts);
        // Drop timestamps past the end of the recording (the model can make them up).
        return maxSec && sec > maxSec + 1 ? "" :
          `<button type="button" class="ts" data-ts="${sec}" title="${esc(t("recap.jump", { t: ts }))}">${ts}</button>`;
      });
  }

  /** Minimal Markdown → HTML for the recap: headings, bullet/numbered lists, paragraphs. */
  function renderMarkdown(md, maxSec) {
    const out = [];
    let list = null, para = [];
    const flush = () => { if (para.length) out.push(`<p>${mdInline(para.join(" "), maxSec)}</p>`); para = []; };
    const closeList = () => { if (list) out.push(`</${list}>`); list = null; };
    for (const raw of md.split("\n")) {
      const line = raw.trim();
      let m;
      if (!line || /^(-{3,}|\*{3,})$/.test(line)) { flush(); closeList(); }
      else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flush(); closeList(); out.push(`<h${m[1].length + 2}>${mdInline(m[2], maxSec)}</h${m[1].length + 2}>`); }
      else if ((m = line.match(/^(?:([-*+])|\d+[.)])\s+(.*)$/))) {
        flush();
        const tag = m[1] ? "ul" : "ol";
        if (list !== tag) { closeList(); out.push(`<${tag}>`); list = tag; }
        out.push(`<li>${mdInline(m[2], maxSec)}</li>`);
      } else if (list && /^\s/.test(raw)) out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, ` ${mdInline(line, maxSec)}</li>`);
      else { closeList(); para.push(line); }
    }
    flush(); closeList();
    return out.join("");
  }

  /** Recap section of a finished job. Re-rendered only when its state changes. */
  // Recap/chat output language: the user's pick on the transcript page, else what the job used
  // last, else the recording's language (ai_lang_default from the backend).
  const recapLangOf = (d) => state.recapLang || (d.recap_status === "done" && d.recap_lang) || d.ai_lang_default || "en";
  const chatLangOf = (d) => state.chatLang || d.chat_lang || d.ai_lang_default || "en";
  const providerLabel = (id) => t("provider." + (id || "claude_cli")); // recaps from before Settings used Claude
  const routeProvider = (task) => state.settings?.routing?.[task]?.provider;
  // Error codes whose raw message (HTTP status, CLI output) helps the user; the others say it all.
  const showErrorDetail = (code, detail) => !!detail && !["llm_no_key", "llm_no_url", "llm_cli_missing", "recap_interrupted"].includes(code);
  const settingsLink = () => `<button type="button" class="btn btn--link" data-act="settings">${esc(t("ai.change"))}</button>`;
  const aiLangToggle = (kind, cur) => `<div class="segmented" role="group" aria-label="${esc(t("ai.lang"))}" title="${esc(t("ai.lang"))}">${
    ["en", "id"].map((c) => `<button type="button" data-ai-lang="${kind}:${c}" aria-pressed="${c === cur}" title="${esc(t("lang." + c))}">${c.toUpperCase()}</button>`).join("")}</div>`;

  function renderRecap(d) {
    const box = $("#dRecap");
    box.hidden = d.status !== "done";
    if (box.hidden) return;
    const st = d.recap_status || "none";
    const out = recapLangOf(d);
    const key = `${lang}:${d.id}:${st}:${d.recap_created || ""}:${d.recap_error_code || ""}:${out}:${d.recap_stage || ""}:${d.recap_pct ?? ""}:${routeProvider("recap") || ""}`;
    if (box.dataset.key === key) return;
    box.dataset.key = key;

    const actions = [];
    let body = "";
    if (st === "none") {
      body = `<p class="recap__intro">${esc(t("recap.intro"))}</p>
        <p class="recap__note">${routeProvider("recap") ? esc(t("ai.using", { provider: providerLabel(routeProvider("recap")) })) + " · " : ""}${settingsLink()}</p>`;
      actions.push(`<button class="btn btn--primary btn--compact" data-act="recap">${esc(t("recap.generate"))}</button>`);
    } else if (st === "running") {
      body = `<p class="recap__running"><span class="spinner"></span> ${esc(d.recap_stage ? stageText({ stage: d.recap_stage, stage_pct: d.recap_pct }) : t("recap.running"))}</p>`;
    } else if (st === "error") {
      const detail = showErrorDetail(d.recap_error_code, d.recap_error) ? `<pre class="section-msg__pre">${esc(d.recap_error)}</pre>` : "";
      body = `<div class="section-msg section-msg--error"><div><h4 class="section-msg__title">${esc(t("recap.failed"))}</h4>
        <div class="section-msg__body">${esc(errorText(d.recap_error_code, d.recap_error))} ${settingsLink()}</div>${detail}</div></div>`;
      actions.push(`<button class="btn btn--compact" data-act="recap">${esc(t("recap.retry"))}</button>`);
    } else {
      body = `<div class="md">${renderMarkdown(d.recap || "", d.duration)}</div>
        <p class="recap__note">${esc([
          t("recap.meta", { provider: providerLabel(d.recap_provider), model: d.recap_model || "", d: fmtDur(d.recap_seconds) }),
          d.recap_chunks ? t("recap.chunks", { n: d.recap_chunks }) : "",
          d.recap_fallback ? `(${t("ai.fallback")})` : "",
        ].filter(Boolean).join(" "))}</p>`;
      actions.push(`<button class="btn btn--compact" data-act="recap-copy">${esc(t("recap.copy"))}</button>`,
        `<a class="btn btn--compact" href="/api/jobs/${d.id}/download/md">${esc(t("recap.download"))}</a>`,
        out !== d.recap_lang
          ? `<button class="btn btn--primary btn--compact" data-act="recap">${esc(t("recap.regenerateIn", { lang: t("lang." + out) }))}</button>`
          : `<button class="btn btn--subtle btn--compact" data-act="recap">${esc(t("recap.regenerate"))}</button>`);
    }
    if (st !== "running") actions.unshift(aiLangToggle("recap", out));
    $("#dRecapActions").innerHTML = actions.join("");
    $("#dRecapBody").innerHTML = body;
  }

  // ---------------------------------------------------------------- chat
  let chatTimer = null;
  const seekTo = (sec) => {
    const media = $("#dPlayer video, #dPlayer audio");
    if (media) { media.currentTime = sec; media.play().catch(() => {}); }
  };

  /** Fetch the open job's chat; keeps polling (for the streamed answer) while Claude replies. */
  async function loadChat() {
    const id = state.openId;
    clearTimeout(chatTimer);
    if (!id) return;
    // Only messages newer than the last one we have; `total` reveals a chat cleared elsewhere.
    const have = state.chat?.id === id ? state.chat.messages : [];
    const after = have.length ? have[have.length - 1].id : 0;
    let c;
    try { c = await api(`/api/jobs/${encodeURIComponent(id)}/chat${after ? `?after=${after}` : ""}`); } catch { return; }
    if (state.openId !== id) return;
    const messages = after ? [...have, ...c.messages] : c.messages;
    if (after && messages.length !== c.total) { state.chat = null; return loadChat(); }
    state.chat = { id, ...c, messages };
    renderChat();
    if (c.busy) chatTimer = setTimeout(loadChat, 600);
  }

  const askChips = (list) => `<div class="chips">${list
    .map((q) => `<button type="button" class="chip" data-ask="${esc(q)}">${esc(q)}</button>`).join("")}</div>`;

  /** Starter questions for an empty chat, generated once per job + answer language (cached server-side). */
  async function loadStarters(id, out) {
    const key = `${id}:${out}`;
    if (state.starters[key]) return;
    state.starters[key] = { loading: true };
    let list = [];
    try { list = (await api(`/api/jobs/${encodeURIComponent(id)}/chat/suggestions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: out }),
    })).suggestions || []; } catch { /* keep the fixed starters */ }
    state.starters[key] = { list };
    if (state.openId === id) renderChat();
  }

  const regenBtn = () => `<button type="button" class="btn btn--subtle btn--compact" data-chat="regen">${esc(t("chat.regen"))}</button>`;

  /** One chat bubble. `lastUser` / `last`: the latest question / message, which get Edit / Regenerate. */
  function chatItem(m, dur, lastUser = false, last = false) {
    if (m.role === "user") {
      return `<li class="msg msg--user">${esc(m.text)}</li>${lastUser
        ? `<li class="msg-tools"><button type="button" class="btn btn--subtle btn--compact" data-chat="edit">${esc(t("chat.edit"))}</button></li>` : ""}`;
    }
    if (m.role === "error") {
      const code = m.meta?.error_code;
      return `<li class="msg msg--error"><b>${esc(t("chat.failed"))}</b> · ${esc(errorText(code, m.text))} ${code?.startsWith("llm_") ? settingsLink() : ""}
        ${showErrorDetail(code, m.text) ? `<pre class="section-msg__pre">${esc(m.text)}</pre>` : ""}${last ? `<div class="msg__actions">${regenBtn()}</div>` : ""}</li>`;
    }
    const meta = [
      m.meta?.provider ? `${providerLabel(m.meta.provider)} · ${m.meta.model || ""}` : "",
      m.meta?.fallback ? t("ai.fallback") : "",
      m.meta?.excerpt ? t("chat.excerpt") : "",
      m.meta?.stopped ? t("chat.stopped") : "",
    ].filter(Boolean).join(" · ");
    return `<li class="msg msg--assistant"><div class="md">${renderMarkdown(m.text, dur)}</div>
      <div class="msg__actions"><span class="msg__meta">${esc(meta)}</span>${last ? regenBtn() : ""}<button type="button" class="btn btn--subtle btn--compact" data-copy="${m.id}">${esc(t("chat.copy"))}</button></div></li>`;
  }

  /** Chat section of a finished job. Re-rendered only when messages or the streamed answer change. */
  function renderChat(force = false) {
    const d = state.detail, c = state.chat, box = $("#dChat");
    box.hidden = !d || d.status !== "done";
    if (box.hidden || !c || c.id !== d.id) return;
    const last = c.messages[c.messages.length - 1];
    const out = chatLangOf(d);
    const starters = c.messages.length || c.busy ? null : state.starters[`${d.id}:${out}`];
    if (!c.messages.length && !c.busy && !starters) loadStarters(d.id, out);
    const baseKey = `${lang}:${c.messages.length}:${last?.id ?? ""}:${c.busy}:${d.id}:${out}:${starters?.loading ?? starters?.list?.length ?? ""}`;
    const key = `${baseKey}:${(c.partial || "").length}`;
    $("#chatSend").hidden = c.busy;
    $("#chatStop").hidden = !c.busy;
    const helpKey = `${lang}:${out}:${routeProvider("chat") || ""}`;
    if ($("#chatLang").dataset.key !== helpKey) {
      $("#chatLang").dataset.key = helpKey;
      $("#chatLang").innerHTML = aiLangToggle("chat", out);
      $("#chatHelp").textContent = t("chat.help", { lang: t("lang." + out), provider: routeProvider("chat") ? providerLabel(routeProvider("chat")) : "" });
    }
    $("#chatClear").hidden = c.busy || !c.messages.length;
    const list = $("#dChatList");
    if (!force && list.dataset.key === key) return;
    const grew = list.dataset.key !== undefined && list.dataset.key.split(":")[1] !== String(c.messages.length);
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    list.dataset.key = key;
    // While an answer streams in, only its own bubble changes: skip re-rendering the history.
    const streaming = $(".is-streaming .md", list);
    if (!force && streaming && c.busy && c.partial && list.dataset.base === baseKey) {
      streaming.innerHTML = renderMarkdown(c.partial, d.duration);
      if (nearBottom) list.scrollTop = list.scrollHeight;
      return;
    }
    list.dataset.base = baseKey;

    const lastUser = [...c.messages].reverse().find((m) => m.role === "user");
    const items = c.messages.map((m) => chatItem(m, d.duration, !c.busy && m === lastUser, !c.busy && m === last && m !== lastUser));
    if (c.busy) {
      items.push(c.partial
        ? `<li class="msg msg--assistant is-streaming"><div class="md">${renderMarkdown(c.partial, d.duration)}</div></li>`
        : `<li class="msg msg--typing"><span class="spinner"></span> ${esc(t("chat.thinking"))}</li>`);
    }
    // Follow-up questions only under the latest answer, so the next step is always one click away.
    if (!c.busy && last?.role === "assistant" && last.meta?.suggestions?.length) {
      items.push(`<li class="chat__followups"><span class="chat__followups-label">${esc(t("chat.followups"))}</span>${askChips(last.meta.suggestions)}</li>`);
    }
    if (!items.length) {
      const list = starters?.list?.length ? starters.list : ["chat.s1", "chat.s2", "chat.s3"].map((k) => t(k));
      items.push(`<li class="chat__empty"><p>${esc(t("chat.intro"))}</p>${askChips(list)}${starters?.loading
        ? `<p class="chat__suggesting"><span class="spinner"></span> ${esc(t("chat.suggesting"))}</p>` : ""}</li>`);
    }
    list.innerHTML = items.join("");
    list.setAttribute("aria-busy", String(!!c.busy));
    if (nearBottom || grew) list.scrollTop = list.scrollHeight;
  }

  async function sendChat(text) {
    const d = state.detail;
    text = (text || "").trim();
    if (!d || !text || state.chat?.busy) return;
    if (state.chatEdit) return retryChat(text);
    try {
      const r = await api(`/api/jobs/${d.id}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: chatLangOf(d) }),
      });
      $("#chatInput").value = "";
      if (state.chat?.id === d.id) Object.assign(state.chat, { messages: [...state.chat.messages, r.message], busy: true, partial: null });
      renderChat();
      $("#dChatList").scrollTop = $("#dChatList").scrollHeight;
      chatTimer = setTimeout(loadChat, 600);
    } catch (err) {
      flag("error", t("flag.chatFailed"), err.message);
    }
  }

  /** Answer the last question again, reworded when `text` is given (Edit), else as is (Regenerate). */
  async function retryChat(text = "") {
    const d = state.detail;
    if (!d || state.chat?.busy) return;
    try {
      await api(`/api/jobs/${d.id}/chat/retry`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang: chatLangOf(d) }),
      });
      setChatEdit(false);
      $("#chatInput").value = "";
      state.chat = null; // earlier answer removed: reload the whole chat
      loadChat();
    } catch (err) {
      flag("error", t("flag.chatFailed"), err.message);
    }
  }
  function setChatEdit(on) {
    state.chatEdit = on;
    $("#chatEdit").hidden = !on;
    if (!on) return;
    const q = [...(state.chat?.messages || [])].reverse().find((m) => m.role === "user");
    if (!q) return setChatEdit(false);
    $("#chatInput").value = q.text;
    $("#chatInput").focus();
  }

  // ---------------------------------------------------------------- tags
  function renderTags(d) {
    const box = $("#dTags"), tags = d.tags || [];
    const key = `${lang}:${d.id}:${tags.join("\u0001")}`;
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    const refocus = document.activeElement?.id === "tagInput";
    const known = [...new Set(state.jobs.flatMap((j) => j.tags || []))].filter((tag) => !tags.includes(tag));
    box.innerHTML = tags.map((tag) => `<span class="tag">#${esc(tag)}<button type="button" class="tag__rm" data-tag-rm="${esc(tag)}"
        aria-label="${esc(t("tags.remove", { tag }))}" title="${esc(t("tags.remove", { tag }))}">×</button></span>`).join("")
      + (tags.length < 10 ? `<input class="tag-input" id="tagInput" maxlength="30" list="tagList" placeholder="${esc(t("tags.placeholder"))}" aria-label="${esc(t("tags.label"))}">
        <datalist id="tagList">${known.map((tag) => `<option value="${esc(tag)}">`).join("")}</datalist>` : "");
    if (refocus) $("#tagInput")?.focus();
  }
  async function saveTags(tags) {
    const d = state.detail;
    if (!d) return;
    try {
      await api(`/api/jobs/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags }) });
      await refreshJobs();
      await refreshDetail();
    } catch (err) {
      flag("error", t("flag.actionFailed"), err.message);
    }
  }

  // ---------------------------------------------------------------- chapters & quiz (recap route, on demand)
  const studyLangOf = (kind, d) => state.studyLang[kind] || d[kind]?.lang || d.ai_lang_default || "en";
  const studyBusy = (kind, d) => state.studyBusy[kind] === d.id;

  async function generateStudy(kind, extra = {}) {
    const d = state.detail;
    if (!d || studyBusy(kind, d)) return;
    state.studyBusy[kind] = d.id;
    delete state.studyError[kind];
    if (kind === "quiz") { state.quizPick = {}; state.quizResult = null; }
    renderDetail(d);
    try {
      await api(`/api/jobs/${d.id}/${kind}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: studyLangOf(kind, d), ...extra }),
      });
    } catch (err) {
      if (state.detail?.id === d.id) state.studyError[kind] = err.message;
    }
    delete state.studyBusy[kind];
    if (state.openId === d.id) await refreshDetail();
  }

  const studyHead = (kind, d, actions) => `<div class="recap__head"><h3>${kind === "chapters"
    ? '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 5h2v2H4V5zm4 0h12v2H8V5zm-4 6h2v2H4v-2zm4 0h12v2H8v-2zm-4 6h2v2H4v-2zm4 0h12v2H8v-2z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2v2zm2.1-7.7-.9.9A3.4 3.4 0 0 0 13 15h-2v-.5c0-1.1.4-2.1 1.2-2.8l1.2-1.3A2 2 0 1 0 10 9H8a4 4 0 1 1 7.1 2.3z"/></svg>'}
    <span>${esc(t(kind + ".title"))}</span></h3><div class="recap__actions">${actions.join("")}</div></div>`;
  const studyError = (kind) => state.studyError[kind] ? `<div class="section-msg section-msg--error"><div><h4 class="section-msg__title">${esc(t(kind + ".failed"))}</h4>
    <div class="section-msg__body">${esc(state.studyError[kind])} ${settingsLink()}</div></div></div>` : "";

  function renderChapters(d) {
    const box = $("#dChapters");
    box.hidden = d.status !== "done";
    if (box.hidden) return;
    const ch = d.chapters, out = studyLangOf("chapters", d), busy = studyBusy("chapters", d);
    const key = `${lang}:${d.id}:${ch?.created || ""}:${out}:${busy}:${state.studyError.chapters || ""}`;
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    const actions = busy ? [] : [aiLangToggle("chapters", out), ch
      ? `<button type="button" class="btn btn--${out !== ch.lang ? "primary" : "subtle"} btn--compact" data-study="chapters">${esc(out !== ch.lang ? t("chapters.regenerateIn", { lang: t("lang." + out) }) : t("chapters.regenerate"))}</button>`
      : `<button type="button" class="btn btn--primary btn--compact" data-study="chapters">${esc(t("chapters.generate"))}</button>`];
    const body = busy ? `<p class="recap__running"><span class="spinner"></span> ${esc(t("chapters.running"))}</p>`
      : ch ? `<ol class="chapter-list">${ch.items.map((c) => `<li><button type="button" class="chapter" data-seek="${c.start}">
          <span class="chapter__time">${clock(c.start)}</span><span class="chapter__title">${esc(c.title)}</span></button></li>`).join("")}</ol>`
      : `<p class="recap__intro">${esc(t("chapters.intro"))}</p>`;
    box.innerHTML = studyHead("chapters", d, actions) + studyError("chapters") + body;
    state.activeChapter = null;
  }

  function renderQuiz(d) {
    const box = $("#dQuiz");
    box.hidden = d.status !== "done";
    if (box.hidden) return;
    const quiz = d.quiz, out = studyLangOf("quiz", d), busy = studyBusy("quiz", d);
    const res = state.quizResult?.created === quiz?.created ? state.quizResult : null;
    const key = `${lang}:${d.id}:${quiz?.created || ""}:${out}:${busy}:${res?.at || ""}:${quiz?.best?.score ?? ""}:${state.studyError.quiz || ""}`;
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    const sizes = (primary) => [5, 10].map((n) => `<button type="button" class="btn btn--${primary ? "primary" : "subtle"} btn--compact" data-study="quiz" data-count="${n}">${esc(t("quiz.make", { n }))}</button>`);
    const actions = busy ? [] : [aiLangToggle("quiz", out),
      quiz?.best ? `<span class="quiz__best">${esc(t("quiz.best", { s: quiz.best.score, n: quiz.best.total }))}</span>` : "",
      ...(quiz ? [`<span class="quiz__new">${esc(t("quiz.new"))}:</span>`, ...sizes(out !== quiz.lang)] : sizes(true))];
    let body;
    if (busy) body = `<p class="recap__running"><span class="spinner"></span> ${esc(t("quiz.running"))}</p>`;
    else if (!quiz) body = `<p class="recap__intro">${esc(t("quiz.intro"))}</p>`;
    else {
      body = `<ol class="quiz__list">${quiz.questions.map((q, i) => {
        const r = res?.results[i];
        return `<li class="quiz__q${r ? (r.correct ? " is-correct" : " is-wrong") : ""}"><fieldset><legend>${mdInline(q.q, d.duration)}</legend>
          ${q.options.map((o, k) => `<label class="quiz__opt${r && k === r.answer ? " is-answer" : ""}${r && k === r.picked && !r.correct ? " is-picked" : ""}">
            <input type="radio" name="quiz${i}" value="${k}" ${state.quizPick[i] === k ? "checked" : ""} ${r ? "disabled" : ""}> <span>${mdInline(o, d.duration)}</span></label>`).join("")}
          ${r ? `<p class="quiz__explain"><b>${esc(t(r.correct ? "quiz.correct" : "quiz.wrong"))}.</b> ${mdInline(r.explain || "", d.duration)}${
            q.start != null ? ` <button type="button" class="ts" data-ts="${q.start}">${clock(q.start)}</button>` : ""}</p>` : ""}
        </fieldset></li>`;
      }).join("")}</ol>
      <div class="quiz__foot">${res
        ? `<span class="quiz__score" role="status">${esc(t("quiz.score", { s: res.score, n: res.total }))}</span>
           <button type="button" class="btn btn--compact" data-quiz="retake">${esc(t("quiz.retake"))}</button>`
        : `<button type="button" class="btn btn--primary btn--compact" data-quiz="check">${esc(t("quiz.check"))}</button>
           <span class="quiz__hint" id="quizHint"></span>`}</div>`;
    }
    box.innerHTML = studyHead("quiz", d, actions) + studyError("quiz") + body;
    updateQuizHint();
  }
  function updateQuizHint() {
    const hint = $("#quizHint"), quiz = state.detail?.quiz;
    if (!hint || !quiz) return;
    const left = quiz.questions.length - Object.keys(state.quizPick).length;
    hint.textContent = left ? t("quiz.unanswered", { n: left }) : "";
  }
  async function checkQuiz() {
    const d = state.detail;
    if (!d?.quiz) return;
    try {
      const r = await api(`/api/jobs/${d.id}/quiz/check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: d.quiz.questions.map((_, i) => state.quizPick[i] ?? null) }),
      });
      state.quizResult = { ...r, created: d.quiz.created };
      await refreshDetail();
    } catch (err) {
      flag("error", t("flag.actionFailed"), err.message);
    }
  }

  // ---------------------------------------------------------------- study notes export
  function buildNotes(d) {
    const out = [`# ${d.title || ""}`, "", [d.duration ? fmtDur(d.duration) : "", fmtDate(d.created), d.url || ""].filter(Boolean).join(" · "), ""];
    if (d.chapters?.items?.length) {
      out.push(`## ${t("notes.chapters")}`, "", ...d.chapters.items.map((c) => `- [${clock(c.start)}] ${c.title}`), "");
    }
    if (d.recap) out.push(`## ${t("notes.recap")}`, "", d.recap.replace(/^(#+) /gm, "#$1 ").trim(), "");
    const chat = state.chat?.id === d.id ? state.chat.messages.filter((m) => m.role !== "error") : [];
    if (chat.length) {
      out.push(`## ${t("notes.chat")}`, "");
      for (const m of chat) out.push(m.role === "user" ? `### ${t("notes.q")}: ${m.text.replace(/\s+/g, " ")}` : m.text, "");
    }
    return out.join("\n").trim() + "\n";
  }
  function printNotes(d) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(d.title || "Transkripu")}</title>
      <style>body{font:14px/1.6 -apple-system,system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 16px}
      h1{font-size:22px}h2{font-size:18px;margin-top:28px}h3{font-size:15px}button{all:unset}</style></head>
      <body>${renderMarkdown(buildNotes(d), d.duration)}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  // ---------------------------------------------------------------- search in all transcripts
  let searchTimer = null, searchSeq = 0;
  function searchTranscripts(q) {
    clearTimeout(searchTimer);
    q = q.trim();
    if (q.length < 2) { state.search = null; return renderSearch(); }
    state.search = { q, results: state.search?.q === q ? state.search.results : null };
    renderSearch();
    searchTimer = setTimeout(async () => {
      const seq = ++searchSeq;
      let r;
      try { r = await api(`/api/search?q=${encodeURIComponent(q)}`); } catch { return; }
      if (seq !== searchSeq || state.search?.q !== q) return;
      state.search = { q, results: r.results };
      renderSearch();
    }, 300);
  }
  function renderSearch() {
    const box = $("#searchResults"), sr = state.search;
    box.hidden = !sr || (sr.results && !sr.results.length);
    if (box.hidden) return;
    if (!sr.results) { box.innerHTML = `<p class="search-results__head"><span class="spinner"></span> ${esc(t("search.searching"))}</p>`; return; }
    const q = sr.q.toLowerCase();
    box.innerHTML = `<p class="search-results__head">${esc(t("search.inTranscripts"))}</p><ul class="search-results__list">${sr.results.map((r) => `
      <li><div class="search-results__title">${esc(r.title)}</div>${r.hits.map((h) => `<button type="button" class="search-hit" data-job="${esc(r.job_id)}" data-start="${h.start}">
        <span class="seg__time">${clock(h.start)}</span><span>${highlight(h.text, q)}</span></button>`).join("")}${
        r.count > r.hits.length ? `<span class="search-results__more">${esc(t("search.more", { n: r.count - r.hits.length }))}</span>` : ""}</li>`).join("")}</ul>`;
  }
  async function openHit(id, start) {
    await openDrawer(id);
    if (state.openId !== id) return;
    const media = $("#dPlayer video, #dPlayer audio");
    if (media) media.currentTime = start;
    state.activeSeg = -2;
    highlightAt(start);
    const seg = $(".seg.is-active");
    if (seg) scrollSeg(seg);
  }

  /** Escape `text` and wrap case-insensitive matches of `q` in <mark> (matching on raw text, not on entities). */
  function highlight(text, q) {
    if (!q) return esc(text);
    const lower = text.toLowerCase();
    let out = "", from = 0, at;
    while ((at = lower.indexOf(q, from)) !== -1) {
      out += esc(text.slice(from, at)) + `<mark>${esc(text.slice(at, at + q.length))}</mark>`;
      from = at + q.length;
    }
    return out + esc(text.slice(from));
  }

  const segItem = (s, i, q) => `<li class="seg${i === state.activeSeg ? " is-active" : ""}" data-i="${i}" data-start="${s.start}">
        <span class="seg__time">${clock(s.start)}</span><span class="seg__text">${highlight(s.text, q)}</span></li>`;

  function renderSegments(d) {
    const segs = d.segments || [];
    $("#dCount").textContent = segs.length;
    const q = state.segQuery.trim().toLowerCase();
    // Key without the count: same key + more segments = live output, so only append.
    const key = `${lang}:${d.id}:${state.segCache?.live ? "live" : "final"}:${q}`;
    const list = $("#dSegments");
    const scroller = list.parentElement;
    const nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80;

    if (key === state.renderedSegKey && segs.length === state.renderedSegCount) return;
    if (key === state.renderedSegKey && state.renderedSegCount > 0 && segs.length > state.renderedSegCount) {
      const added = segs.slice(state.renderedSegCount)
        .map((s, k) => [s, state.renderedSegCount + k])
        .filter(([s]) => !q || s.text.toLowerCase().includes(q));
      if (added.length) {
        list.querySelector(".segments__empty")?.remove();
        list.insertAdjacentHTML("beforeend", added.map(([s, i]) => segItem(s, i, q)).join(""));
      }
    } else if (!segs.length) {
      list.innerHTML = `<li class="segments__empty">${esc(t(ACTIVE.has(d.status) ? "drawer.waiting" : "drawer.noText"))}</li>`;
    } else {
      list.innerHTML = segs.map((s, i) => (q && !s.text.toLowerCase().includes(q)) ? "" : segItem(s, i, q)).join("")
        || `<li class="segments__empty">${esc(t("drawer.noResults", { q: state.segQuery }))}</li>`;
    }
    state.renderedSegKey = key;
    state.renderedSegCount = segs.length;
    // Auto-scroll with live output only if the user hasn't scrolled up.
    if (ACTIVE.has(d.status) && nearBottom) scroller.scrollTop = scroller.scrollHeight;
  }

  async function saveSegment(li, save) {
    const d = state.detail, i = +li.dataset.i, text = $(".seg__text", li);
    const q = state.segQuery.trim().toLowerCase();
    li.classList.remove("is-editing");
    delete li.dataset.cancel;
    text.removeAttribute("contenteditable");
    const value = text.textContent.replace(/\s+/g, " ").trim(), before = d?.segments[i]?.text ?? "";
    text.innerHTML = highlight(before, q);
    if (!save || !value || value === before || !d) return;
    text.innerHTML = highlight(value, q);
    try {
      const r = await api(`/api/jobs/${d.id}/segments/${i}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value }),
      });
      d.segments[i].text = r.segment.text;
      d.edited = Date.now() / 1000;
      if (text.isConnected) text.innerHTML = highlight(r.segment.text, q);
      flag("success", t("flag.segSaved"));
    } catch (err) {
      if (text.isConnected) text.innerHTML = highlight(before, q);
      flag("error", t("flag.actionFailed"), err.message);
    }
  }

  /** Center a transcript line inside its own scroll pane, without scrolling the page. */
  function scrollSeg(el, behavior = "auto") {
    const list = $("#dSegments");
    if (list.scrollHeight <= list.clientHeight) return el.scrollIntoView({ block: "center", behavior });
    list.scrollTo({ top: el.offsetTop - (list.clientHeight - el.offsetHeight) / 2, behavior });
  }

  function highlightAt(time) {
    const segs = state.detail?.segments || [];
    // Last segment starting at or before `time` (segments are sorted by start).
    let lo = 0, hi = segs.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (segs[mid].start <= time + 0.05) { idx = mid; lo = mid + 1; } else hi = mid - 1;
    }
    const chapters = $$("#dChapters .chapter");
    let cur = null;
    for (const c of chapters) if (parseFloat(c.dataset.seek) <= time + 0.05) cur = c;
    if (cur !== state.activeChapter) {
      chapters.forEach((c) => c.classList.toggle("is-active", c === cur));
      state.activeChapter = cur;
    }
    if (idx === state.activeSeg) return;
    state.activeSeg = idx;
    $$(".seg.is-active").forEach((el) => el.classList.remove("is-active"));
    const el = $(`.seg[data-i="${idx}"]`);
    if (el) {
      el.classList.add("is-active");
      if ($("#followToggle").checked) scrollSeg(el, "smooth");
    }
  }

  async function onAction(act, btn) {
    const d = state.detail;
    if (!d) return;
    try {
      switch (act) {
        case "dl-menu": {
          const menu = btn.nextElementSibling;
          menu.hidden = !menu.hidden;
          return;
        }
        case "copy":
          await navigator.clipboard.writeText((d.segments || []).map((s) => s.text).join("\n"));
          flag("success", t("flag.copied"), t("flag.copiedDesc", { n: d.segments.length }));
          break;
        case "reveal":
          await api(`/api/jobs/${d.id}/reveal`, { method: "POST" });
          break;
        case "cancel":
          await api(`/api/jobs/${d.id}/cancel`, { method: "POST" });
          flag("info", t("flag.cancelled"), d.title);
          break;
        case "retry":
        case "whisper":
          await api(`/api/jobs/${d.id}/retry`, act === "whisper" ? {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript_source: "whisper" }),
          } : { method: "POST" });
          state.renderedSegKey = "";
          state.segCache = null;
          flag("info", t("flag.requeued"), d.title);
          break;
        case "recap":
          await api(`/api/jobs/${d.id}/recap`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: recapLangOf(d) }),
          });
          setTimeout(tick, 1200); // switch polling to the fast interval
          break;
        case "settings":
          openSettings();
          return;
        case "notes-md": {
          btn.closest(".dropdown__menu").hidden = true;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([buildNotes(d)], { type: "text/markdown" }));
          a.download = `${(d.title || "notes").replace(/[\\/:*?"<>|]+/g, " ").trim()}.notes.md`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          flag("success", t("flag.notesSaved"), d.title);
          return;
        }
        case "notes-print":
          btn.closest(".dropdown__menu").hidden = true;
          printNotes(d);
          return;
        case "recap-copy":
          await navigator.clipboard.writeText(d.recap || "");
          flag("success", t("flag.recapCopied"), d.title);
          return;
        case "delete-media": {
          const msg = t("act.confirmDeleteMedia", { title: d.title, size: fmtSize(d.media_bytes || 0) });
          if (!confirm(d.source === "upload" ? `${msg} ${t("act.confirmDeleteMediaUpload")}` : msg)) return;
          $("#dPlayer video, #dPlayer audio")?.pause();
          await api(`/api/jobs/${d.id}/media`, { method: "DELETE" });
          flag("success", t("flag.mediaDeleted"), d.title);
          break;
        }
        case "delete":
          if (!confirm(t("act.confirmDelete", { title: d.title }))) return;
          await api(`/api/jobs/${d.id}`, { method: "DELETE" });
          flag("success", t("flag.deleted"), d.title);
          goHome();
          await refreshJobs();
          return;
      }
      await refreshJobs();
      await refreshDetail();
    } catch (err) {
      flag("error", t("flag.actionFailed"), err.message);
    }
  }

  // ---------------------------------------------------------------- AI settings drawer
  // Fields save on change (PUT /api/settings). Inputs are rendered once per opening so a
  // save never wipes what the user is typing elsewhere; refreshSettingsMeta() updates the rest.
  const ENV_KEYS = { gemini: "GEMINI_API_KEY", groq: "GROQ_API_KEY", sumopod: "SUMOPOD_API_KEY", custom: "OPENAI_COMPAT_API_KEY" };
  const PSTATUS_KIND = { ready: "success", local: "inprogress", no_key: "moved", no_url: "moved", not_installed: "removed" };
  const loadedModels = {}; // provider id -> model IDs from "Load models"
  let settingsSaving = Promise.resolve();
  let focusBeforeSettings = null;

  async function loadSettings(refresh = false) {
    state.settings = await api("/api/settings" + (refresh ? "?refresh=1" : ""));
    if (state.detail) { $("#dRecap").dataset.key = ""; renderRecap(state.detail); renderChat(true); }
    renderJobs(); // onboarding hint depends on the chat provider
  }

  function saveSettings(patch) {
    settingsSaving = api("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    }).then((data) => { state.settings = data; refreshSettingsMeta(); flag("success", t("settings.saved")); })
      .catch((err) => { flag("error", t("flag.actionFailed"), err.message); });
    return settingsSaving;
  }

  async function openSettings() {
    focusBeforeSettings = document.activeElement;
    state.settingsOpen = true;
    $("#blanket").hidden = false;
    requestAnimationFrame(() => $("#settings").classList.add("is-open"));
    $("#settings").setAttribute("aria-hidden", "false");
    $("#closeSettings").focus();
    try { await loadSettings(true); } catch (err) { flag("error", t("flag.connect"), err.message); }
    renderSettings();
  }

  function closeSettings() {
    state.settingsOpen = false;
    $("#settings").classList.remove("is-open");
    $("#settings").setAttribute("aria-hidden", "true");
    focusBeforeSettings?.focus?.();
    focusBeforeSettings = null;
    setTimeout(() => { if (!state.settingsOpen) $("#blanket").hidden = true; }, 220);
    if (state.detail) { $("#dRecap").dataset.key = ""; renderRecap(state.detail); renderChat(true); }
    renderJobs(); // onboarding hint depends on the chat provider
  }

  const modelPlaceholder = (id) => {
    const p = state.settings?.providers?.[id];
    if (!p) return "";
    if (!p.model) return p.kind === "cli" ? t("settings.modelCli") : "";
    return t("settings.modelDefault", { model: p.model });
  };

  // Model combobox: free text plus a list of known models. Not a <datalist>: browsers filter
  // those by the current value, so a filled field would only offer itself.
  const modelOptions = (id) => [...new Set([...(state.settings?.providers?.[id]?.suggest || []), ...(loadedModels[id] || [])])];
  const comboInput = (label, attrs, value) => `<div class="combo"><input class="textfield" ${attrs} data-combo value="${esc(value)}"
      role="combobox" aria-expanded="false" aria-autocomplete="list" aria-label="${esc(label)}" autocomplete="off" spellcheck="false">
      <ul class="combo__menu" role="listbox" hidden></ul></div>`;

  /** Show the model list under `input`: all models, or only matches once the user types. */
  function openCombo(input, filter = false) {
    const menu = input.nextElementSibling, cur = input.value.trim();
    const q = filter ? cur.toLowerCase() : "";
    const items = modelOptions(input.dataset.models).filter((m) => !q || m.toLowerCase().includes(q));
    const active = items.indexOf(cur);
    menu.innerHTML = items.map((m, i) => `<li role="option" class="combo__item${i === active ? " is-active" : ""}"
      data-value="${esc(m)}" aria-selected="${m === cur}">${esc(m)}</li>`).join("");
    menu.hidden = !items.length;
    input.setAttribute("aria-expanded", String(!menu.hidden));
    $(".is-active", menu)?.scrollIntoView({ block: "nearest" });
  }
  function closeCombo(input) {
    input.nextElementSibling.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }
  function pickCombo(input, value) {
    input.value = value;
    closeCombo(input);
    input.dispatchEvent(new Event("change", { bubbles: true })); // saves like a typed value
  }
  function moveCombo(input, step) {
    const menu = input.nextElementSibling;
    if (menu.hidden) return openCombo(input);
    const items = $$(".combo__item", menu);
    if (!items.length) return;
    const i = items.findIndex((el) => el.classList.contains("is-active"));
    const next = items[(i + step + items.length) % items.length];
    items.forEach((el) => el.classList.toggle("is-active", el === next));
    next.scrollIntoView({ block: "nearest" });
  }

  function routeRow(task) {
    const r = state.settings.routing[task];
    const fb = r.fallback || { provider: "", model: "" };
    const opts = (sel, none) => (none ? `<option value="">${esc(t("settings.none"))}</option>` : "") +
      state.settings.order.map((id) => `<option value="${id}"${id === sel ? " selected" : ""}>${esc(providerLabel(id))}</option>`).join("");
    const field = (label, control) => `<label class="field"><span class="field__label">${esc(label)}</span>${control}</label>`;
    return `<div class="route" data-task="${task}">
      <h4 class="route__title">${esc(t("settings." + task))}</h4>
      <div class="route__grid">
        ${field(t("settings.provider"), `<select class="select" data-r="provider">${opts(r.provider)}</select>`)}
        ${field(t("settings.model"), comboInput(t("settings.model"), 'data-r="model"', r.model))}
        ${field(t("settings.fallback"), `<select class="select" data-r="fb-provider">${opts(fb.provider, true)}</select>`)}
        ${field(t("settings.fallbackModel"), comboInput(t("settings.fallbackModel"), 'data-r="fb-model"', fb.model))}
      </div></div>`;
  }

  function providerPanel(id) {
    const p = state.settings.providers[id];
    const http = p.kind === "openai";
    const keyField = http && (p.needs_key || id === "custom");
    const field = (label, control, help = "") => `<div class="field"><label class="field__label">${esc(label)}</label>${control}${help ? `<p class="field__help">${help}</p>` : ""}</div>`;
    return `<details class="provider" data-p="${id}">
      <summary class="provider__summary">
        <svg class="provider__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10 17l5-5-5-5v10z"/></svg>
        <span class="provider__name">${esc(providerLabel(id))}</span>
        <span class="provider__used"></span>
        <span class="provider__status"></span>
      </summary>
      <div class="provider__body">
        <p class="provider__help">${esc(t("help." + id))}</p>
        ${http ? field(t("settings.baseUrl"), `<input class="textfield" data-f="base_url" type="url" value="${esc(p.base_url === p.default_base_url ? "" : p.base_url)}"
            placeholder="${esc(p.default_base_url || (id === "sumopod" ? t("settings.urlSumopod") : "https://…/v1"))}" autocomplete="off" spellcheck="false">`) : ""}
        ${keyField ? field(t(p.needs_key ? "settings.apiKey" : "settings.apiKeyOptional"), `<div class="inline-field">
            <input class="textfield" data-f="api_key" type="password" autocomplete="off" spellcheck="false">
            <button type="button" class="btn" data-sact="toggle-key">${esc(t("settings.show"))}</button></div>`,
            `<span class="provider__key"></span> <button type="button" class="btn btn--link" data-sact="remove-key" hidden>${esc(t("settings.keyRemove"))}</button>`) : ""}
        ${field(t("settings.model"), `<div class="inline-field">
            ${comboInput(t("settings.model"), `data-f="model" data-models="${id}"`, p.model === p.default_model ? "" : p.model)}
            ${http ? `<button type="button" class="btn" data-sact="load-models">${esc(t("settings.loadModels"))}</button>` : ""}</div>`)}
        ${http ? field(t("settings.maxTokens"), `<input class="textfield textfield--narrow" data-f="max_input_tokens" type="number" min="0" step="500" value="${p.max_input_tokens ?? ""}">`,
            esc(t("settings.maxTokensHelp"))) : ""}
        <div class="provider__footer">
          <button type="button" class="btn" data-sact="test">${esc(t("settings.test"))}</button>
          <span class="provider__result" aria-live="polite"></span>
        </div>
      </div>
    </details>`;
  }

  function renderSettings() {
    const s = state.settings;
    if (!s) return;
    const open = new Set($$("#sProviders details[open]").map((el) => el.dataset.p));
    if (!open.size) open.add(s.routing.recap.provider);
    $("#sRouting").innerHTML = ["recap", "chat"].map(routeRow).join("");
    $("#sProviders").innerHTML = s.order.map(providerPanel).join("");
    $$("#sProviders details").forEach((el) => (el.open = open.has(el.dataset.p)));
    refreshSettingsMeta();
  }

  /** Status lozenges, key hints, "used for" and placeholders: everything a save can change. */
  function refreshSettingsMeta() {
    const s = state.settings;
    if (!s || !state.settingsOpen) return;
    for (const el of $$("#sProviders .provider")) {
      const id = el.dataset.p, p = s.providers[id];
      $(".provider__status", el).innerHTML = `<span class="lozenge lozenge--${PSTATUS_KIND[p.status] || ""}">${esc(t("pstatus." + p.status))}</span>`;
      const used = ["recap", "chat"].filter((task) => s.routing[task].provider === id || s.routing[task].fallback?.provider === id);
      $(".provider__used", el).textContent = used.length ? t("settings.usedFor", { tasks: used.map((x) => t("settings." + x)).join(", ") }) : "";
      $("[data-f=model]", el).placeholder = modelPlaceholder(id);
      const keyInput = $("[data-f=api_key]", el);
      if (keyInput) {
        const env = p.key_source === "env";
        keyInput.disabled = env;
        keyInput.placeholder = env ? "" : p.has_key ? (p.key_last4 ? `••••${p.key_last4}` : "••••") : t("settings.keyNew");
        $(".provider__key", el).textContent = env ? t("settings.keyEnv", { name: ENV_KEYS[id] || "" })
          : p.has_key ? (p.key_last4 ? t("settings.keySaved", { last4: p.key_last4 }) : t("settings.keySavedShort")) : "";
        $("[data-sact=remove-key]", el).hidden = !(p.has_key && p.key_source === "file");
      }
    }
    for (const row of $$("#sRouting .route")) {
      const [prov, model, fbProv, fbModel] = ["provider", "model", "fb-provider", "fb-model"].map((k) => $(`[data-r=${k}]`, row));
      model.placeholder = modelPlaceholder(prov.value);
      model.dataset.models = prov.value;
      fbModel.disabled = !fbProv.value;
      fbModel.placeholder = fbProv.value ? modelPlaceholder(fbProv.value) : "";
      fbModel.dataset.models = fbProv.value;
    }
  }

  function saveRouting() {
    const routing = {};
    for (const row of $$("#sRouting .route")) {
      const v = (k) => $(`[data-r=${k}]`, row).value.trim();
      routing[row.dataset.task] = { provider: v("provider"), model: v("model"), fallback: v("fb-provider") ? { provider: v("fb-provider"), model: v("fb-model") } : null };
    }
    return saveSettings({ routing });
  }

  async function onSettingsAction(act, btn) {
    const panel = btn.closest(".provider"), id = panel?.dataset.p;
    if (act === "toggle-key") {
      const input = $("[data-f=api_key]", panel);
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = t(input.type === "password" ? "settings.show" : "settings.hide");
    } else if (act === "remove-key") {
      await saveSettings({ providers: { [id]: { api_key: null } } });
    } else if (act === "load-models") {
      await settingsSaving;
      btn.disabled = true;
      try {
        const r = await api(`/api/settings/models?provider=${encodeURIComponent(id)}`);
        loadedModels[id] = r.models;
        flag("info", t("settings.modelsLoaded", { n: r.models.length }), providerLabel(id));
        const input = $("[data-f=model]", panel);
        input.focus(); // focusin opens the full list
        openCombo(input);
      } catch (err) { flag("error", providerLabel(id), err.message); }
      btn.disabled = false;
    } else if (act === "test") {
      await settingsSaving; // a field edited just before clicking Test is saved first
      const out = $(`.provider[data-p="${id}"] .provider__result`);
      btn.disabled = true;
      out.innerHTML = `<span class="spinner"></span>`;
      try {
        const r = await api("/api/settings/test", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: id }),
        });
        out.innerHTML = r.ok
          ? `<span class="lozenge lozenge--success">${esc(t("settings.testOk", { ms: r.latency_ms }))}</span> <span class="provider__model">${esc(r.model || "")}</span>`
          : `<span class="lozenge lozenge--removed">${esc(t("settings.testFailed"))}</span> ${esc(errorText(r.error_code, r.error))}`;
        if (!r.ok && showErrorDetail(r.error_code, r.error)) out.insertAdjacentHTML("beforeend", `<pre class="section-msg__pre">${esc(r.error)}</pre>`);
      } catch (err) { out.textContent = err.message; }
      btn.disabled = false;
    }
  }

  // ---------------------------------------------------------------- polling
  // Polls fast while work runs. A hidden tab keeps polling the list slowly (tab-title progress,
  // notifications) and skips the transcript page; returning to the tab polls at once.
  let pollTimer = null;
  async function tick() {
    clearTimeout(pollTimer);
    pollTimer = null;
    try {
      await refreshJobs();
      if (!document.hidden && state.openId && (!state.detail || ACTIVE.has(state.detail.status) || state.detail.recap_status === "running")) await refreshDetail();
    } catch {}
    const busy = state.jobs.some((j) => ACTIVE.has(j.status) || j.recap_status === "running");
    if (!pollTimer) pollTimer = setTimeout(tick, document.hidden ? (busy ? 5000 : 30000) : busy ? 1200 : 5000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

  // ---------------------------------------------------------------- event wiring
  $$(".tab").forEach((el) => el.addEventListener("click", () => setTab(el.dataset.tab)));
  $("#fileInput").addEventListener("change", (e) => setFiles(e.target.files));

  const dz = $("#dropzone");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-over"); }));
  // Accept drops anywhere on the page.
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length) { setTab("file"); setFiles(files); }
  });

  $("#createForm").addEventListener("submit", submit);
  $("#modelInput").addEventListener("change", () => { updateModelHint(); savePrefs(); renderEstimate(); });
  $("#langInput").addEventListener("change", savePrefs);
  $("#conditionInput").addEventListener("change", savePrefs);
  // Enter submits; Shift+Enter starts another line for the next URL.
  $("#urlInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("#createForm").requestSubmit(); }
  });
  $("#historySearch").addEventListener("input", (e) => { state.historyQuery = e.target.value; renderJobs(); searchTranscripts(e.target.value); });
  $("#historySearch").addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !e.target.value) return;
    e.target.value = state.historyQuery = "";
    renderJobs();
    searchTranscripts("");
  });
  $("#statusFilter").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (c) { state.statusFilter = c.dataset.filter; renderJobs(); }
  });
  dz.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#fileInput").click(); }
  });
  // "/" jumps to the history search (unless typing in a field or a transcript page is open).
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || state.openId || e.target.closest("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    $("#historySearch").focus();
  });
  $("#jobRows").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) openDrawer(tr.dataset.id); });
  $("#jobRows").addEventListener("keydown", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDrawer(tr.dataset.id); }
  });
  $("#backBtn").addEventListener("click", goHome);
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);
  $("#blanket").addEventListener("click", closeSettings);
  document.addEventListener("keydown", (e) => {
    const panel = state.settingsOpen ? $("#settings") : null;
    if (!panel) return;
    if (e.key === "Escape") return closeSettings();
    if (e.key !== "Tab") return;
    // Keep keyboard focus inside the open drawer (modal dialog).
    const focusable = $$('button, [href], input, select, textarea, summary, audio, video, [tabindex]:not([tabindex="-1"])', panel)
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
  $("#openSettings").addEventListener("click", openSettings);
  $("#closeSettings").addEventListener("click", closeSettings);
  $("#settings").addEventListener("change", (e) => {
    if (e.target.closest("#sRouting")) {
      // A model ID only makes sense for the provider it was picked for.
      const row = e.target.closest(".route"), r = e.target.dataset.r;
      if (r === "provider") $("[data-r=model]", row).value = "";
      if (r === "fb-provider") $("[data-r=fb-model]", row).value = "";
      return saveRouting();
    }
    const f = e.target.dataset.f, id = e.target.closest(".provider")?.dataset.p;
    if (!f || !id) return;
    const value = e.target.value.trim();
    if (f === "api_key" && !value) return;
    if (f === "api_key") e.target.value = ""; // never kept in the page after saving
    saveSettings({ providers: { [id]: { [f]: f === "max_input_tokens" ? Number(value) || 0 : value } } });
  });
  $("#settings").addEventListener("focusin", (e) => { if (e.target.matches("[data-combo]")) openCombo(e.target); });
  $("#settings").addEventListener("focusout", (e) => { if (e.target.matches("[data-combo]")) closeCombo(e.target); });
  $("#settings").addEventListener("input", (e) => { if (e.target.matches("[data-combo]")) openCombo(e.target, true); });
  $("#settings").addEventListener("mousedown", (e) => {
    const item = e.target.closest(".combo__item");
    if (!item) return;
    e.preventDefault(); // keep focus in the input until the pick is done
    pickCombo($("input", item.closest(".combo")), item.dataset.value);
  });
  $("#settings").addEventListener("keydown", (e) => {
    const input = e.target.closest("[data-combo]");
    if (!input) return;
    const menu = input.nextElementSibling;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); moveCombo(input, e.key === "ArrowDown" ? 1 : -1); }
    else if (e.key === "Enter" && !menu.hidden) {
      const active = $(".combo__item.is-active", menu);
      if (active) { e.preventDefault(); pickCombo(input, active.dataset.value); }
    } else if (e.key === "Escape" && !menu.hidden) { e.stopPropagation(); closeCombo(input); }
  });
  $("#settings").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sact]");
    if (b) onSettingsAction(b.dataset.sact, b);
  });
  $("#dActions").addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b) onAction(b.dataset.act, b); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".dropdown")) $$(".dropdown__menu").forEach((m) => (m.hidden = true)); });
  // EN/ID output-language toggles in the recap and chat cards.
  $("#detailView").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ai-lang]");
    if (!b || !state.detail) return;
    const [kind, code] = b.dataset.aiLang.split(":");
    if (kind === "recap") { state.recapLang = code; renderRecap(state.detail); }
    else if (kind === "chapters" || kind === "quiz") { state.studyLang[kind] = code; renderDetail(state.detail); }
    else { state.chatLang = code; renderChat(true); }
  });
  $("#dRecap").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (b) return onAction(b.dataset.act, b);
    const ts = e.target.closest(".ts");
    if (ts) seekTo(parseFloat(ts.dataset.ts));
  });
  $("#dChat").addEventListener("click", async (e) => {
    const act = e.target.closest("[data-act]");
    if (act) return onAction(act.dataset.act, act);
    const ts = e.target.closest(".ts");
    if (ts) return seekTo(parseFloat(ts.dataset.ts));
    const chip = e.target.closest("[data-ask]");
    if (chip) return sendChat(chip.dataset.ask);
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      const m = state.chat?.messages.find((x) => String(x.id) === copy.dataset.copy);
      if (m) navigator.clipboard.writeText(m.text).then(() => flag("success", t("flag.chatCopied")));
    }
  });
  $("#dChat").addEventListener("click", (e) => {
    const b = e.target.closest("[data-chat]");
    if (!b) return;
    if (b.dataset.chat === "regen") retryChat();
    else setChatEdit(true);
  });
  $("#chatEditCancel").addEventListener("click", () => { setChatEdit(false); $("#chatInput").value = ""; });
  // Up arrow in an empty chat box edits the last question (as in chat apps).
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && !e.target.value && !state.chat?.busy && state.chat?.messages.some((m) => m.role === "user")) { e.preventDefault(); setChatEdit(true); }
    if (e.key === "Escape" && state.chatEdit) { e.stopPropagation(); setChatEdit(false); e.target.value = ""; }
  });
  ["#dChapters", "#dQuiz"].forEach((sel) => $(sel).addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act) return onAction(act.dataset.act, act);
    const study = e.target.closest("[data-study]");
    if (study) return generateStudy(study.dataset.study, study.dataset.count ? { count: +study.dataset.count } : {});
    const seek = e.target.closest("[data-seek], .ts");
    if (seek) return seekTo(parseFloat(seek.dataset.seek ?? seek.dataset.ts));
    const q = e.target.closest("[data-quiz]");
    if (q?.dataset.quiz === "check") return checkQuiz();
    if (q?.dataset.quiz === "retake") { state.quizPick = {}; state.quizResult = null; $("#dQuiz").dataset.key = ""; renderQuiz(state.detail); }
  }));
  $("#dQuiz").addEventListener("change", (e) => {
    const m = e.target.name?.match(/^quiz(\d+)$/);
    if (m) { state.quizPick[+m[1]] = +e.target.value; updateQuizHint(); }
  });
  $("#dTags").addEventListener("click", (e) => {
    const rm = e.target.closest("[data-tag-rm]");
    if (rm && state.detail) saveTags((state.detail.tags || []).filter((tag) => tag !== rm.dataset.tagRm));
  });
  $("#dTags").addEventListener("keydown", (e) => {
    if (e.target.id !== "tagInput" || e.isComposing) return;
    const value = e.target.value.trim();
    if ((e.key === "Enter" || e.key === ",") && value) { e.preventDefault(); saveTags([...(state.detail?.tags || []), value]); }
    else if (e.key === "Backspace" && !e.target.value && state.detail?.tags?.length) saveTags(state.detail.tags.slice(0, -1));
  });
  $("#tagFilter").addEventListener("click", (e) => {
    const c = e.target.closest("[data-tag]");
    if (c) { state.tagFilter = state.tagFilter === c.dataset.tag ? null : c.dataset.tag; renderJobs(); }
  });
  $("#searchResults").addEventListener("click", (e) => {
    const hit = e.target.closest(".search-hit");
    if (hit) openHit(hit.dataset.job, parseFloat(hit.dataset.start));
  });
  $("#emptyAiBtn").addEventListener("click", openSettings);
  // Cmd/Ctrl+Enter starts the transcription from any field of the form.
  $("#createForm").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); $("#createForm").requestSubmit(); }
  });
  $("#chatForm").addEventListener("submit", (e) => { e.preventDefault(); sendChat($("#chatInput").value); });
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendChat(e.target.value); }
  });
  $("#chatStop").addEventListener("click", async () => {
    const d = state.detail;
    if (!d) return;
    try { await api(`/api/jobs/${d.id}/chat/stop`, { method: "POST" }); } catch (err) { flag("error", t("flag.actionFailed"), err.message); }
    loadChat();
  });
  $("#chatClear").addEventListener("click", async () => {
    const d = state.detail;
    if (!d || !confirm(t("chat.confirmClear"))) return;
    try { await api(`/api/jobs/${d.id}/chat`, { method: "DELETE" }); } catch (err) { flag("error", t("flag.actionFailed"), err.message); }
    loadChat();
  });
  // Debounced: filtering a long transcript on every keystroke rebuilds thousands of rows.
  let segSearchTimer = null;
  $("#segSearch").addEventListener("input", (e) => {
    clearTimeout(segSearchTimer);
    segSearchTimer = setTimeout(() => { state.segQuery = e.target.value; if (state.detail) renderSegments(state.detail); }, 150);
  });
  $("#dSegments").addEventListener("click", (e) => {
    const li = e.target.closest(".seg");
    const media = $("#dPlayer video, #dPlayer audio");
    if (li && media && !li.classList.contains("is-editing")) { media.currentTime = parseFloat(li.dataset.start); media.play().catch(() => {}); }
  });
  // Inline correction of a finished transcript: double-click, Enter saves, Esc or empty text cancels.
  $("#dSegments").addEventListener("dblclick", (e) => {
    const li = e.target.closest(".seg"), d = state.detail;
    if (!li || !d || d.status !== "done" || li.classList.contains("is-editing")) return;
    const text = $(".seg__text", li);
    li.classList.add("is-editing");
    text.textContent = d.segments[+li.dataset.i].text; // drop search highlights while editing
    text.contentEditable = "true";
    text.focus();
    getSelection().selectAllChildren(text);
  });
  $("#dSegments").addEventListener("keydown", (e) => {
    const li = e.target.closest(".seg.is-editing");
    if (!li) return;
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.target.blur(); }
    if (e.key === "Escape") { e.stopPropagation(); li.dataset.cancel = "1"; e.target.blur(); }
  });
  $("#dSegments").addEventListener("focusout", (e) => {
    const li = e.target.closest(".seg.is-editing");
    if (li) saveSegment(li, !li.dataset.cancel);
  });
  // Player shortcuts while a transcript page is open: K / Space play-pause, J / L jump 5 s.
  document.addEventListener("keydown", (e) => {
    const media = $("#dPlayer video, #dPlayer audio");
    if (!state.openId || state.settingsOpen || !media || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target instanceof Element ? e.target : document.body;
    if (el.closest("input, textarea, select, [contenteditable=true], audio, video")) return;
    const key = e.key.toLowerCase();
    if (key === "k" || (key === " " && !el.closest("button, a, summary"))) {
      e.preventDefault();
      if (media.paused) media.play().catch(() => {}); else media.pause();
    } else if (key === "j" || key === "l") {
      e.preventDefault();
      media.currentTime = Math.max(0, media.currentTime + (key === "j" ? -5 : 5));
    }
  });
  $("#recheckTools").addEventListener("click", () => Promise.all([loadHealth(true), loadSettings(true)]).then(() => flag("info", t("tools.rechecked"))));
  $$("#langSwitch button").forEach((b) => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
  $("#themeToggle").addEventListener("change", (e) => setTheme(e.target.checked ? "dark" : "light"));

  // ---------------------------------------------------------------- boot
  // index.html already applied the saved theme (default light) before first paint.
  setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
  applyStaticTranslations();
  renderFile();
  resetSubmit();
  loadHealth().catch(() => flag("error", t("flag.connect")));
  loadSettings().catch(() => {});
  route();
  tick();
})();
