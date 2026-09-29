Fix this bug in Transkripu: $ARGUMENTS

1. Reproduce or pinpoint first: grep the relevant anchor, read `data/jobs/<id>/log.txt` tail if a job id is given. State the root cause in one sentence before editing.
2. Smallest fix at the root cause; no drive-by refactors.
3. Add a smoke-test check that would have caught it when feasible; run `python3 scripts/smoke_test.py`.
4. If it's an environment/tool gotcha, add one line to docs/ai/NOTES.md.
5. ≤6-line summary.
