/**
 * Transkripu — frontend (vanilla JS, no build step).
 *
 * - i18n: all UI strings live in I18N below. English is the default; the
 *   EN/ID switch is stored in localStorage ("transkripu-lang").
 * - Theme: light by default; the dark-mode toggle sets <html data-theme> and
 *   is stored in localStorage ("transkripu-theme").
 * - Data: polls /api/jobs (and /api/jobs/:id while the drawer is open).
 *   The backend sends machine-readable status/stage/error codes that are
 *   translated here.
 */
(() => {
  // ---------------------------------------------------------------- i18n
  const I18N = {
    en: {
      "nav.transcripts": "Transcripts",
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
      "create.urlHelp": "Only the audio track is downloaded.",
      "create.cookiesLabel": "Use browser sign-in",
      "create.cookiesNone": "No (public video)",
      "create.cookiesHelp": "For videos that require login, e.g. your campus LMS.",
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
      "err.unsupported_file": "Unsupported file type. Use a video or audio file (MP4, MOV, MKV, MP3, M4A, WAV, …).",
      "err.disk_full": "Not enough free disk space for this file.",
      "err.forbidden": "Request blocked. Open the app at http://127.0.0.1:8765.",

      "drawer.close": "Close",
      "drawer.failed": "Processing failed",
      "drawer.transcript": "Transcript",
      "drawer.search": "Search transcript",
      "drawer.follow": "Follow playback",
      "drawer.language": "Language: {lang}",
      "drawer.processed": "processed in {d}",
      "drawer.waiting": "Text will appear here while processing…",
      "drawer.noText": "No text.",
      "drawer.noResults": "No results for “{q}”.",
      "timing.download": "Download {d}", "timing.model": "Load model {d}", "timing.transcribe": "Transcribe {d}",

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

      "unit.sec": "{n}s", "unit.min": "{n} min", "unit.hour": "{h} h {m} min", "unit.lt1": "<1s",
    },

    id: {
      "nav.transcripts": "Transkrip",
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
      "create.urlHelp": "Hanya audionya yang diunduh.",
      "create.cookiesLabel": "Pakai sesi login browser",
      "create.cookiesNone": "Tidak (video publik)",
      "create.cookiesHelp": "Untuk video yang perlu login, misalnya LMS kampus.",
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
      "err.unsupported_file": "Jenis file tidak didukung. Gunakan file video atau audio (MP4, MOV, MKV, MP3, M4A, WAV, …).",
      "err.disk_full": "Ruang disk tidak cukup untuk file ini.",
      "err.forbidden": "Permintaan diblokir. Buka aplikasi di http://127.0.0.1:8765.",

      "drawer.close": "Tutup",
      "drawer.failed": "Gagal diproses",
      "drawer.transcript": "Transkrip",
      "drawer.search": "Cari di transkrip",
      "drawer.follow": "Ikuti pemutaran",
      "drawer.language": "Bahasa: {lang}",
      "drawer.processed": "diproses {d}",
      "drawer.waiting": "Teks akan muncul di sini selama proses berjalan…",
      "drawer.noText": "Tidak ada teks.",
      "drawer.noResults": "Tidak ada hasil untuk “{q}”.",
      "timing.download": "Unduh {d}", "timing.model": "Muat model {d}", "timing.transcribe": "Transkrip {d}",

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
    tab: "file", file: null, jobs: [], models: [], languages: [],
    openId: null, detail: null, renderedSegKey: "", renderedSegCount: 0, segCache: null, mediaFor: null,
    historyQuery: "", statusFilter: "all", segQuery: "", activeSeg: -1, health: null,
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
  const fmtSize = (b) => (b > 1e9 ? (b / 1e9).toFixed(1) + " GB" : (b / 1e6).toFixed(1) + " MB");

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
    }
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
    storage.set(LS_PREFS, JSON.stringify({ model: $("#modelInput").value, language: $("#langInput").value, prompt: $("#promptInput").value }));
  }
  function restorePrefs() {
    let p = {};
    try { p = JSON.parse(storage.get(LS_PREFS) || "{}"); } catch {}
    if (p.model && state.models.includes(p.model)) $("#modelInput").value = p.model;
    if (p.language && state.languages.includes(p.language)) $("#langInput").value = p.language;
    else $("#langInput").value = "auto";
    if (p.prompt) $("#promptInput").value = p.prompt;
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
  }
  function setFile(f) { state.file = f; renderFile(); }
  function renderFile() {
    const f = state.file;
    $("#dropzone").classList.toggle("has-file", !!f);
    $("#dropTitle").innerHTML = f ? esc(f.name) : t("create.dropTitle");
    $("#dropHint").textContent = f ? t("create.dropReplace", { size: fmtSize(f.size) }) : t("create.dropHint");
  }
  function resetSubmit() {
    const btn = $("#submitBtn");
    btn.disabled = false;
    btn.textContent = t("create.submit");
  }

  function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("model", $("#modelInput").value);
    fd.append("language", $("#langInput").value);
    fd.append("prompt", $("#promptInput").value);
    if (state.tab === "file") {
      if (!state.file) return flag("error", t("flag.noFile"), t("flag.noFileDesc"));
      fd.append("file", state.file);
    } else {
      const url = $("#urlInput").value.trim();
      if (!url) return flag("error", t("flag.noUrl"), t("flag.noUrlDesc"));
      fd.append("url", url);
      fd.append("cookies_browser", $("#cookiesInput").value);
    }
    savePrefs();

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${esc(t("create.sending"))}`;

    // XHR (not fetch) so we get upload progress for large videos.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/jobs");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && state.tab === "file") {
        btn.innerHTML = `<span class="spinner"></span> ${esc(t("create.uploading", { pct: Math.round((ev.loaded / ev.total) * 100) }))}`;
      }
    };
    xhr.onload = () => {
      resetSubmit();
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      if (xhr.status >= 300) return flag("error", t("flag.createFailed"), errorText(data.error_code, data.error) || `HTTP ${xhr.status}`);
      flag("success", t("flag.queued"), data.title);
      setFile(null);
      $("#fileInput").value = "";
      $("#urlInput").value = "";
      refreshJobs().then(() => openDrawer(data.id));
    };
    xhr.onerror = () => { resetSubmit(); flag("error", t("flag.serverDown"), t("flag.serverDownDesc")); };
    xhr.send(fd);
  }

  // ---------------------------------------------------------------- history table
  const lastStatus = {};
  async function refreshJobs() {
    const jobs = await api("/api/jobs");
    for (const j of jobs) {
      const prev = lastStatus[j.id];
      if (prev && prev !== j.status) {
        if (j.status === "done") flag("success", t("flag.done"), j.title);
        if (j.status === "error") flag("error", t("flag.failed"), j.title);
      }
      lastStatus[j.id] = j.status;
    }
    state.jobs = jobs;
    renderJobs();
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
    const jobs = state.jobs.filter((j) => byStatus(j) && (!q || (j.title || "").toLowerCase().includes(q)));
    $$("#statusFilter .chip").forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.filter === state.statusFilter));
      $(".chip__count", c).textContent = state.jobs.filter(FILTERS[c.dataset.filter]).length;
    });
    $("#emptyState").hidden = state.jobs.length > 0;
    $("#noMatch").hidden = !state.jobs.length || jobs.length > 0;
    // Show the running job's progress in the browser tab title.
    const running = state.jobs.find((j) => j.status === "transcribing" || j.status === "downloading");
    document.title = running ? `(${Math.round(running.progress || 0)}%) Transkripu` : "Transkripu";
    $("#jobRows").innerHTML = jobs.map((j) => {
      const isUrl = j.source === "url";
      const pct = j.status === "done" ? 100 : Math.round(j.progress || 0);
      const barCls = j.status === "done" ? "progress--done" : j.status === "error" ? "progress--error" : "";
      const sub = [
        t(isUrl ? "history.srcUrl" : "history.srcFile"),
        j.duration ? fmtDur(j.duration) : "",
        j.segments_count ? t("history.segments", { n: j.segments_count }) : "",
      ].filter(Boolean).join(" · ");
      return `<tr data-id="${esc(j.id)}" tabindex="0" class="${state.openId === j.id ? "is-selected" : ""}">
        <td><div class="job-title">
          <span class="job-title__icon job-title__icon--${isUrl ? "url" : "upload"}">${isUrl ? ICON_URL : ICON_FILE}</span>
          <span class="job-title__text"><span class="job-title__name" title="${esc(j.title)}">${esc(j.title)}</span><span class="job-title__sub">${esc(sub)}</span></span>
        </div></td>
        <td>${lozenge(j.status)}</td>
        <td><div class="progress-cell"><div class="progress ${barCls}"><div class="progress__bar" style="width:${pct}%"></div></div><span>${pct}%</span></div></td>
        <td><span class="date">${fmtDate(j.created)}</span></td>
      </tr>`;
    }).join("");
  }

  // ---------------------------------------------------------------- detail drawer
  let focusBeforeDrawer = null;
  async function openDrawer(id) {
    if (!state.openId) focusBeforeDrawer = document.activeElement;
    Object.assign(state, { openId: id, renderedSegKey: "", renderedSegCount: 0, segCache: null, mediaFor: null, activeSeg: -1, segQuery: "" });
    $("#segSearch").value = "";
    $("#dActions").dataset.key = "";
    $("#blanket").hidden = false;
    requestAnimationFrame(() => $("#drawer").classList.add("is-open"));
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#closeDrawer").focus();
    renderJobs();
    await refreshDetail();
  }

  function closeDrawer() {
    $("#dPlayer video, #dPlayer audio")?.pause();
    state.openId = null;
    state.detail = null;
    state.segCache = null;
    $("#drawer").classList.remove("is-open");
    $("#drawer").setAttribute("aria-hidden", "true");
    focusBeforeDrawer?.focus?.();
    focusBeforeDrawer = null;
    setTimeout(() => { if (!state.openId) { $("#blanket").hidden = true; $("#dPlayer").innerHTML = ""; } }, 220);
    renderJobs();
  }

  /** Fetch the open job. While it is transcribing, only new live segments are requested (?since=N). */
  async function refreshDetail() {
    const id = state.openId;
    if (!id) return;
    const c = state.segCache;
    const since = c && c.id === id && c.live ? c.segs.length : 0;
    let d;
    try {
      d = await api(`/api/jobs/${encodeURIComponent(id)}${since ? `?since=${since}` : ""}`);
    } catch {
      return closeDrawer();
    }
    if (state.openId !== id) return; // drawer switched while the request was in flight
    if (d.segments_from > 0) {
      if (!c || c.segs.length !== d.segments_from) { state.segCache = null; return refreshDetail(); } // out of sync: refetch all
      c.segs.push(...d.segments);
    } else {
      state.segCache = { id, live: !!d.segments_live, segs: d.segments || [] };
    }
    state.segCache.live = !!d.segments_live;
    d.segments = state.segCache.segs;
    state.detail = d;
    renderDetail(d);
  }

  function timingLine(tm) {
    if (!tm) return "";
    const parts = [
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
    ].join("") + timingLine(d.timings);
    $("#dTitle").textContent = d.title || "";

    // Action bar — only re-rendered when status/outputs change so an open dropdown survives polling.
    const actionsKey = `${lang}:${d.status}:${(d.outputs || []).join()}`;
    if ($("#dActions").dataset.key !== actionsKey) {
      const a = [];
      if (d.status === "done") {
        a.push(`<div class="dropdown"><button class="btn btn--primary" data-act="dl-menu">${esc(t("act.download"))}
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.3 10.3a1 1 0 0 1 1.4 0L12 12.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0l-3-3a1 1 0 0 1 0-1.4z"/></svg></button>
          <div class="dropdown__menu" hidden>${["srt", "vtt", "txt", "json"].map((f) => downloadItem(d, f)).join("")}</div></div>`);
        a.push(`<button class="btn" data-act="copy">${esc(t("act.copy"))}</button>`);
        a.push(`<button class="btn" data-act="reveal">${esc(t("act.reveal"))}</button>`);
        a.push(`<button class="btn" data-act="retry">${esc(t("act.rerun"))}</button>`);
      }
      if (ACTIVE.has(d.status)) a.push(`<button class="btn" data-act="cancel">${esc(t("act.cancel"))}</button>`);
      if (d.status === "error" || d.status === "cancelled") a.push(`<button class="btn btn--primary" data-act="retry">${esc(t("act.retry"))}</button>`);
      a.push(`<span style="flex:1"></span><button class="btn btn--subtle" data-act="delete">${esc(t("act.delete"))}</button>`);
      $("#dActions").innerHTML = a.join("");
      $("#dActions").dataset.key = actionsKey;
    }

    const active = ACTIVE.has(d.status);
    $("#dProgress").hidden = !active;
    if (active) {
      $("#dStage").textContent = stageText(d);
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
    } else if (!d.media) {
      $("#dPlayer").innerHTML = "";
      state.mediaFor = null;
    }

    renderSegments(d);
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

  function highlightAt(time) {
    const segs = state.detail?.segments || [];
    // Last segment starting at or before `time` (segments are sorted by start).
    let lo = 0, hi = segs.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (segs[mid].start <= time + 0.05) { idx = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (idx === state.activeSeg) return;
    state.activeSeg = idx;
    $$(".seg.is-active").forEach((el) => el.classList.remove("is-active"));
    const el = $(`.seg[data-i="${idx}"]`);
    if (el) {
      el.classList.add("is-active");
      if ($("#followToggle").checked) el.scrollIntoView({ block: "center", behavior: "smooth" });
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
          await api(`/api/jobs/${d.id}/retry`, { method: "POST" });
          state.renderedSegKey = "";
          state.segCache = null;
          flag("info", t("flag.requeued"), d.title);
          break;
        case "delete":
          if (!confirm(t("act.confirmDelete", { title: d.title }))) return;
          await api(`/api/jobs/${d.id}`, { method: "DELETE" });
          flag("success", t("flag.deleted"), d.title);
          closeDrawer();
          break;
      }
      await refreshJobs();
      await refreshDetail();
    } catch (err) {
      flag("error", t("flag.actionFailed"), err.message);
    }
  }

  // ---------------------------------------------------------------- polling
  // Polls while the tab is visible; a hidden tab stops polling and resumes on return.
  let pollTimer = null;
  async function tick() {
    clearTimeout(pollTimer);
    pollTimer = null;
    if (document.hidden) return;
    try {
      await refreshJobs();
      if (state.openId && (!state.detail || ACTIVE.has(state.detail.status))) await refreshDetail();
    } catch {}
    const busy = state.jobs.some((j) => ACTIVE.has(j.status));
    if (!document.hidden && !pollTimer) pollTimer = setTimeout(tick, busy ? 1200 : 5000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

  // ---------------------------------------------------------------- event wiring
  $$(".tab").forEach((el) => el.addEventListener("click", () => setTab(el.dataset.tab)));
  $("#fileInput").addEventListener("change", (e) => setFile(e.target.files[0] || null));

  const dz = $("#dropzone");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("is-over"); }));
  // Accept drops anywhere on the page.
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) { setTab("file"); setFile(f); }
  });

  $("#createForm").addEventListener("submit", submit);
  $("#modelInput").addEventListener("change", () => { updateModelHint(); savePrefs(); });
  $("#langInput").addEventListener("change", savePrefs);
  $("#historySearch").addEventListener("input", (e) => { state.historyQuery = e.target.value; renderJobs(); });
  $("#statusFilter").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (c) { state.statusFilter = c.dataset.filter; renderJobs(); }
  });
  dz.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#fileInput").click(); }
  });
  // "/" jumps to the history search (unless typing in a field or the drawer is open).
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
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#blanket").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (!state.openId) return;
    if (e.key === "Escape") return closeDrawer();
    if (e.key !== "Tab") return;
    // Keep keyboard focus inside the open drawer (modal dialog).
    const focusable = $$('button, [href], input, select, textarea, audio, video, [tabindex]:not([tabindex="-1"])', $("#drawer"))
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!$("#drawer").contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });
  $("#dActions").addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b) onAction(b.dataset.act, b); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".dropdown")) $$(".dropdown__menu").forEach((m) => (m.hidden = true)); });
  $("#segSearch").addEventListener("input", (e) => { state.segQuery = e.target.value; if (state.detail) renderSegments(state.detail); });
  $("#dSegments").addEventListener("click", (e) => {
    const li = e.target.closest(".seg");
    const media = $("#dPlayer video, #dPlayer audio");
    if (li && media) { media.currentTime = parseFloat(li.dataset.start); media.play().catch(() => {}); }
  });
  $("#recheckTools").addEventListener("click", () => loadHealth(true).then(() => flag("info", t("tools.rechecked"))));
  $$("#langSwitch button").forEach((b) => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
  $("#themeToggle").addEventListener("change", (e) => setTheme(e.target.checked ? "dark" : "light"));

  // ---------------------------------------------------------------- boot
  // index.html already applied the saved theme (default light) before first paint.
  setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
  applyStaticTranslations();
  renderFile();
  resetSubmit();
  loadHealth().catch(() => flag("error", t("flag.connect")));
  tick();
})();
