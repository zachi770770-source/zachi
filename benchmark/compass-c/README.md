# Benchmark C — local "Ask the Book" retrieval evaluation

Runs entirely on your own machine, offline. It decides—​with evidence—​whether
semantic retrieval clears the quality gates for the book's Q&A. It is **not**
wired to the website, imports nothing into production, and leaves
`COMPASS_ASSISTANT_ENABLED` untouched.

You need three things installed first:
- **Python 3.10+**
- **Docker Desktop** (used to run a throwaway local Postgres automatically).
  *Alternative:* if you already have Postgres, set `COMPASS_PG` to its
  connection string and Docker isn't needed.
- Your **canonical manuscript** file `גרסה 888.docx` (kept on your machine).

Internet is needed **once**, during setup, only to download the two open models.
Everything after that runs offline.

---

## The three commands (in order)

Set `COMPASS_SOURCE` to your `.docx` once, then run the three scripts.

### macOS / Linux
```bash
cd benchmark/compass-c
export COMPASS_SOURCE="/full/path/to/גרסה 888.docx"

./setup-benchmark.sh     # 1. venv + deps + download the 2 models
./run-benchmark.sh       # 2. tune on the 56-set; freezes a winner if gates pass
./run-holdout.sh         # 3. runs the frozen winner ONCE on the 75 holdout
```

### Windows (PowerShell)
```powershell
cd benchmark\compass-c
$env:COMPASS_SOURCE = "C:\full\path\to\גרסה 888.docx"

.\setup-benchmark.ps1    # 1. venv + deps + download the 2 models
.\run-benchmark.ps1      # 2. tune on the 56-set; freezes a winner if gates pass
.\run-holdout.ps1        # 3. runs the frozen winner ONCE on the 75 holdout
```

> `run-holdout` refuses to run unless step 2 produced `winner.frozen.json`
> (i.e. a configuration cleared **all** gates). If no config passed, the
> holdout stays untouched by design.

---

## What each step does

**1. setup** — creates `.venv`, installs `requirements.txt`, and downloads the
two approved models to `./models/`:
`intfloat/multilingual-e5-small` and
`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
No manuscript is read in this step.

**2. run-benchmark** (tuning, 56-set only) — converts your DOCX → `source.json`
locally, verifies the corpus produces the canonical **382 chunks**, embeds them
(cached by corpus-checksum + model), starts a local Postgres for the production
FTS signal, then for **each model** evaluates:
- **A. vector-only**
- **B. hybrid** = production FTS ∪ vector, fused with **RRF (k=60)**

sweeping the **semantic no-match threshold on the 56-set only**. It prints the
full metrics table (Recall@1/3/5, MRR, off-topic refusal, block accuracy,
citation faithfulness, latency p50/p95, query-embed latency, dims, footprint,
threshold) and, if a config clears every gate, freezes the lightest one to
`winner.frozen.json`.

Gates: `Recall@5 ≥ 95%`, `off-topic refusal ≥ 95%`, `block/extraction = 100%`,
`citation faithfulness = 100%`.

**3. run-holdout** — loads `winner.frozen.json`, re-verifies the holdout
**SHA-256** and the corpus checksum, refuses any parameter override, runs the
frozen config **once** on the 75-question holdout, and writes
`holdout_report.json`. Do not tune after seeing holdout results.

---

## Send the results back

Paste back (metrics only—​no manuscript text):
`tune_report.json` (both models), `winner.frozen.json`, and—​after step 3—​
`holdout_report.json`. Or paste the printed tables.

---

## Safeguards (built in)

- **No external embedding API, ever.** Runtime forces `TRANSFORMERS_OFFLINE=1`,
  `HF_HUB_OFFLINE=1`, loads models with `local_files_only=True`.
- **Telemetry off:** `HF_HUB_DISABLE_TELEMETRY=1` during download and run.
- **Manuscript stays local:** the DOCX and generated `source.json` never leave
  your machine and are **git-ignored**; only chapter/section counts appear in
  logs—​never manuscript body text.
- **Nothing sensitive is committable:** `.gitignore` blocks `*.source.json`,
  `*.docx`, `models/`, `.cache/`, `*.npy`, `.local/`, reports, and `.env`.
- **Holdout discipline enforced in code:** `run-holdout` needs
  `winner.frozen.json`, verifies the frozen SHA-256
  `29e01d70…6633804975`, verifies the corpus checksum, and rejects
  `--mode/--threshold/--model-id` overrides.

## Frozen inputs (do not edit)
`data/tuning56.json` (56 questions), `data/gold.json` (labels),
`data/holdout75.json` (SHA-256 `29e01d708416c6268c8fae2f34f56a8aa6e2dafa722ec0717063206633804975`).

## Advanced / manual
The scripts wrap `run_benchmark.py` (`selfcheck | tune | run-holdout`). See its
`--help`. Embeddings cache in `.cache/`; delete it to recompute. If you manage
your own Postgres, `export COMPASS_PG=postgresql://…` (or `$env:COMPASS_PG`) to
skip Docker.
