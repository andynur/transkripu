# Master prompts

Copy-paste prompts for working on Transkripu with any coding agent (Claude Code, Cursor, Codex, Copilot Chat…). They lean on `AGENTS.md`, so they stay short. In Claude Code the same flows exist as `/feature`, `/fix`, `/review`, `/handoff`.

Fill the `<…>` parts; delete lines you don't need.

---

## 1. Session init (start of every new session)

```
Read AGENTS.md (and docs/ai/NOTES.md only if the task touches the pipeline). Do not read other files yet.
Run: python3 scripts/smoke_test.py
Reply in ≤5 lines: smoke result, and your one-line understanding of the task below.
Task: <what you want this session>
```

For a pure question about the code, skip the smoke test:

```
Using AGENTS.md's code map, answer: <question>. Read only the ranges you need. Answer in ≤8 lines with file:anchor references.
```

## 2. Feature

```
Feature: <what the user should be able to do>
Why/context: <optional, one line>
Scope: <in> / Out of scope: <out>
Acceptance:
- <observable behavior 1>
- <observable behavior 2>
Constraints: follow AGENTS.md invariants; no new deps.
Process: restate in one line + files you'll touch → implement smallest diff → extend and run smoke test → ≤6-line summary incl. what I should check on my Mac.
```

## 3. Bug fix

```
Bug: <what happens>
Expected: <what should happen>
Repro: <steps / URL / file type>  Job id (if any): <id>
Evidence: <paste ≤20 lines of error or log.txt tail>
State the root cause in one sentence before editing. Fix at the root, add a smoke-test check if feasible, run it, ≤6-line summary.
```

## 4. UI change

```
UI change: <component/screen> → <desired look/behavior>
Follow the Atlassian (Jira) style already in static/app.css: use existing tokens/components, no hard-coded colors, correct in light (default) and dark, strings in I18N.en + I18N.id.
Only touch index.html / app.css / app.js. Run the smoke test. Tell me exactly what to click to see it.
```

## 5. Review before commit

```
Review `git diff` against AGENTS.md. Report only: Bugs · Invariant violations · Missing i18n/README/test updates · max 3 nits.
One line each: file:anchor — problem — fix. If clean: "No issues."
```

## 6. Handoff (end of session)

```
No code changes. Append new decisions/gotchas to docs/ai/NOTES.md (one line each, skip if none).
Reply ≤10 lines: Done · Next steps · Verify commands.
```

## 7. Bootstrap the same harness in a new project

Use this once in any other repo to get an equivalent setup.

```
Set up an agent harness for this repo. Keep every file short; optimize for low token usage.
1. Inspect only: the file tree (depth 2), package/config manifests, and the entry point. Don't read everything.
2. Create AGENTS.md (≤80 lines) with: one-paragraph purpose · Commands table (run, test, lint) · Code map table with grep anchors (no line numbers) · numbered Invariants · Workflow (restate → locate with grep → smallest diff → verify → log decisions → ≤6-line report) · Token discipline rules · Definition of done.
3. Create CLAUDE.md containing "@AGENTS.md" plus tool-specific notes.
4. Create one verify command that runs in <30 s with no external services (stub slow/paid dependencies) and prints a single PASS/FAIL line. Make it pass.
5. Create docs/ai/NOTES.md for one-line decisions/gotchas, seeded with anything non-obvious you found.
6. Create .claude/commands/{feature,fix,review,handoff}.md as short templates that point to AGENTS.md.
Report the files created and the verify output in ≤8 lines.
```

---

## Why this stays cheap

- **`AGENTS.md` is the only file loaded every session.** Everything else is pulled on demand through the code map's grep anchors.
- **Anchors, not line numbers.** They don't go stale, and a `grep -n` plus a ranged read costs far less than opening a whole file.
- **One verify command with a one-line verdict.** The agent doesn't read logs unless something fails.
- **Fixed, short report formats.** This cuts output tokens and makes results easy to scan.
- **`NOTES.md` replaces re-discovery.** Past debugging (blocked Hugging Face, yt-dlp breakage, slow re-encode) never has to be repeated.
- **Tips:** start a fresh session per feature instead of one endless thread; paste log excerpts rather than whole logs; name the files when you already know them.
