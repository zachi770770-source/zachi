# Benchmark C — portable hybrid-retrieval evaluation ("Ask the Book")

Isolated, **offline** benchmark to decide whether semantic retrieval clears the
quality gates for the 888 corpus. It is not wired to production and imports
nothing into production. `COMPASS_ASSISTANT_ENABLED` is irrelevant here.

## Privacy / data-flow statement (authoritative)

- **Nothing leaves the machine.** The runner forces `TRANSFORMERS_OFFLINE=1`
  and `HF_HUB_OFFLINE=1`, loads models with `local_files_only=True`, and never
  calls an external embedding API.
- **Model weights must already be on local disk** (`--model-path`). The runner
  never downloads them.
- **The manuscript** (`source.json`), its chunks, and its embeddings stay local
  and are **git-ignored** — they must never be committed. Only code, the
  question sets, gold labels, and the frozen holdout live in the repo.
- The FTS signal uses a **local** Postgres you control (`--pg`), loaded only
  with the local corpus.

## What's in this folder (committed)

| File | Purpose |
|---|---|
| `run_benchmark.py` | runner: `tune`, `run-holdout`, `selfcheck` |
| `chunk.py` | faithful port of `chunker.ts` (382-chunk canonical chunking) |
| `block_patterns.py` | mirror of `isBlockedRequest` in `prompt.ts` @ main (PR #63) |
| `convert.py` | DOCX → `source.json` converter (no manuscript text inside) |
| `data/tuning56.json` | frozen 56-question tuning set |
| `data/gold.json` | gold supporting-chapter labels (unchanged) |
| `data/holdout75.json` | **frozen** blind holdout — SHA-256 `29e01d70…6633804975` |

Never committed (git-ignored): `*.source.json`, `*.docx`, `.cache/`, `*.npy`,
`winner.frozen.json`, `*_report.json`, `.env`.

## 1. Download model weights on another (online) machine

Do this on a machine with internet, then copy the folders to the isolated box.

```bash
pip install "huggingface_hub[cli]"
# Model A (recommended first — small, 384-dim, strong multilingual/Hebrew):
huggingface-cli download intfloat/multilingual-e5-small \
  --local-dir ./models/multilingual-e5-small
# Model B:
huggingface-cli download sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 \
  --local-dir ./models/paraphrase-multilingual-MiniLM-L12-v2
# Copy ./models to the benchmark machine (scp/rsync/USB). No other download needed.
```

## 2. Run the benchmark locally (offline)

```bash
cd benchmark/compass-c
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# a local Postgres for the FTS signal (throwaway):
#   docker run -d --name compass-pg -e POSTGRES_PASSWORD=x -p 5432:5432 postgres:16
export PG="postgresql://postgres:x@127.0.0.1:5432/postgres"

# regenerate source.json from YOUR canonical DOCX (stays local, git-ignored):
python3 convert.py   # run inside a copy of the extracted docx; writes medaytim-laahava-888-final.source.json
export SRC=/abs/path/medaytim-laahava-888-final.source.json

# sanity (no model): chunk count, block accuracy, holdout hash
python3 run_benchmark.py selfcheck --source "$SRC"

# TUNE on the 56-set only (sweeps the semantic threshold; freezes a winner if gates pass):
python3 run_benchmark.py tune --source "$SRC" --pg "$PG" \
  --model-path ./models/multilingual-e5-small --model-id intfloat/multilingual-e5-small
python3 run_benchmark.py tune --source "$SRC" --pg "$PG" \
  --model-path ./models/paraphrase-multilingual-MiniLM-L12-v2 \
  --model-id sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

# Only if a config PASSED all gates (winner.frozen.json now exists), run the
# holdout ONCE. Parameters come only from winner.frozen.json; overrides are refused.
python3 run_benchmark.py run-holdout --source "$SRC" --pg "$PG" \
  --model-path ./models/<the frozen model's folder>
```

Gates (on the 56-set): `Recall@5 ≥ 95%`, `off-topic refusal ≥ 95%`,
`block/extraction = 100%`, `citation faithfulness = 100%`.

Holdout discipline enforced by the tool: `run-holdout` requires
`winner.frozen.json`, re-verifies the holdout SHA-256, verifies the corpus
checksum matches the frozen one, and **rejects** any `--mode/--threshold/--model-id`
override. Do not tune after seeing holdout results.

## 3. Send the results back here

Paste back these files (they contain metrics only — no manuscript text):
- `tune_report.json` (both models)
- `winner.frozen.json`
- `holdout_report.json` (only after a pass)

Or paste the printed tables. I'll interpret against the gates and give the
architectural recommendation (lightest config that clears all gates with margin).

## Notes
- e5 models require `query:` / `passage:` prefixes — the runner applies them
  automatically when the model id contains `e5`.
- Embeddings are cached at `.cache/<corpus16>__<model>.npy` (corpus checksum +
  model id); delete `.cache/` to force recompute.
- Hybrid mode keeps the exact production FTS signal (`to_tsvector('simple')`,
  `ts_rank_cd(...,32)`) and fuses with vector via RRF (k=60). The semantic
  no-match floor is what lets off-topic questions return nothing.
