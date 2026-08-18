#!/usr/bin/env python3
"""
Portable Benchmark C runner for the "Ask the Book" retrieval layer.

PRIVACY / DATA FLOW (read before running):
  * Model weights must already be on local disk (--model-path). The runner
    NEVER downloads models and NEVER calls an external embedding API
    (TRANSFORMERS_OFFLINE / HF_HUB_OFFLINE are forced to 1).
  * The manuscript (source.json), its chunks, and all questions stay on the
    local machine. Embedding inference runs locally. Nothing leaves the box.
  * The manuscript, its source.json, and embeddings are NOT part of this repo
    and must not be committed (see .gitignore).

WHAT IT DOES
  tune         embed the 382 canonical chunks (cached by corpus+model),
               evaluate A=vector-only and B=hybrid(FTS+vector, RRF) on the
               frozen 56-question set, sweep the semantic no-match threshold
               ON THE 56-SET ONLY, print full metrics, and if a config clears
               all gates, freeze the lightest one to winner.frozen.json.
  run-holdout  REQUIRES winner.frozen.json, verifies the holdout SHA-256,
               forbids any parameter override, runs the frozen config ONCE on
               the 75-question holdout, writes holdout_report.json.
  selfcheck    validate the non-model parts (chunk count, block accuracy,
               holdout hash, optional FTS) without any model.

GATES (on the 56-set): Recall@5>=0.95, off-topic refusal>=0.95,
                       block/extraction=1.0, citation faithfulness=1.0
"""
from __future__ import annotations
import argparse, hashlib, json, os, sys, time
from pathlib import Path

os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_HUB_OFFLINE", "1")

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
EXPECTED_HOLDOUT_SHA256 = "29e01d708416c6268c8fae2f34f56a8aa6e2dafa722ec0717063206633804975"
WINNER_FILE = HERE / "winner.frozen.json"
# Persistent one-run marker for the holdout. Tied to (holdout SHA-256 + winner
# config hash + corpus checksum). Once written, a second run of the SAME triple
# is refused. Deleting this file by hand is the only way to re-run — there is no
# override flag (that is intentional).
HOLDOUT_LOCK = HERE / "holdout.lock.json"

RECALL5_MIN, OFFTOPIC_MIN, BLOCK_MIN, CIT_MIN = 0.95, 0.95, 1.0, 1.0
RRF_K = 60
FTS_MIN_SCORE, MAX_RESULTS, MAX_PER_CH, FETCH = 0.01, 5, 2, 12

from chunk import chunk_book, corpus_checksum, EXPECTED_CANONICAL_CHUNKS  # noqa: E402
from block_patterns import is_blocked_request  # noqa: E402

STOP = set("מה מהו מהי מהם איך כיצד האם למה מדוע מתי איפה היכן מי של על אל את עם גם כי זה זו זאת אלה אני אתה הוא היא אנחנו אתם אתן הם הן אם או כמו יש אין לא כן אבל רק עד כל כדי בין לבין אשר הזה הזו יותר פחות כך שם כאן הכי עוד כבר איזה איזו כמה לי לך לו לה היה להיות".split())
import re as _re


def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def winner_hash(frozen: dict) -> str:
    payload = {"model_id": frozen["model_id"], "mode": frozen["mode"],
               "threshold": frozen["threshold"], "rrf_k": frozen.get("rrf_k", RRF_K)}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def lock_identity(frozen: dict, corpus_sha: str) -> dict:
    return {"holdout_sha256": EXPECTED_HOLDOUT_SHA256,
            "winner_hash": winner_hash(frozen), "corpus_checksum": corpus_sha}


def holdout_already_ran(frozen: dict, corpus_sha: str) -> bool:
    if not HOLDOUT_LOCK.exists():
        return False
    try:
        lk = json.loads(HOLDOUT_LOCK.read_text(encoding="utf-8"))
    except Exception:
        return False
    return all(lk.get(k) == v for k, v in lock_identity(frozen, corpus_sha).items())


def write_holdout_lock(frozen: dict, corpus_sha: str) -> None:
    rec = lock_identity(frozen, corpus_sha)
    rec["ran_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    HOLDOUT_LOCK.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")


def build_tsquery(q: str) -> str:
    seen, terms = set(), []
    for raw in _re.split(r"[^\w]+", (q or ""), flags=_re.UNICODE):
        t = raw.strip()
        if len(t) < 2 or t in STOP or t in seen:
            continue
        seen.add(t); terms.append(t)
    return " | ".join(terms)


# ---------------- model (local only) ----------------
def load_model(model_path: str):
    from sentence_transformers import SentenceTransformer
    if not Path(model_path).exists():
        sys.exit(f"ERROR: --model-path '{model_path}' does not exist. Weights must be pre-downloaded locally.")
    return SentenceTransformer(model_path, local_files_only=True)


def prefixes(model_id: str):
    return ("query: ", "passage: ") if "e5" in model_id.lower() else ("", "")


def embed_corpus(model, model_id, chunks, corpus_sha, cache_dir: Path):
    import numpy as np
    cache_dir.mkdir(parents=True, exist_ok=True)
    slug = _re.sub(r"[^a-z0-9]+", "-", model_id.lower())
    npy = cache_dir / f"{corpus_sha[:16]}__{slug}.npy"
    _, ppfx = prefixes(model_id)
    if npy.exists():
        return np.load(npy), 0.0, npy
    t0 = time.perf_counter()
    mat = model.encode([ppfx + c.content for c in chunks], normalize_embeddings=True,
                       batch_size=32, show_progress_bar=False).astype("float32")
    dt = time.perf_counter() - t0
    np.save(npy, mat)
    return mat, dt, npy


# ---------------- retrieval ----------------
def fts_ranked(cur, version, q):
    ts = build_tsquery(q)
    if not ts:
        return []
    cur.execute(
        "select chapter_number, section_order, ts_rank_cd(search_tsv, query, 32) as score "
        "from compass_book_sections, to_tsquery('simple', %s) query "
        "where book_version=%s and is_active and search_tsv @@ query order by score desc limit %s",
        (ts, version, FETCH))
    out = []
    for cn, so, sc in cur.fetchall():
        sc = float(sc)
        if sc < FTS_MIN_SCORE:
            continue
        out.append((so - 1, cn, sc))  # so is 1-based -> chunk index
    return out


def cap_and_top(order_idx, chunks):
    per, out = {}, []
    for i in order_idx:
        cn = chunks[i].chapter_number
        if per.get(cn, 0) >= MAX_PER_CH:
            continue
        per[cn] = per.get(cn, 0) + 1
        out.append(i)
        if len(out) >= MAX_RESULTS:
            break
    return out


def retrieve(mode, qvec, mat, fts_list, chunks, threshold):
    import numpy as np
    sims = mat @ qvec  # cosine (both normalized)
    max_cos = float(sims.max()) if len(sims) else 0.0
    if max_cos < threshold:                      # semantic no-match floor
        return {"matched": False, "top": [], "max_cos": max_cos}
    vec_order = list(np.argsort(-sims))
    if mode == "vector":
        top = cap_and_top(vec_order, chunks)
    else:  # hybrid RRF: keep production FTS signal + vector, fuse by RRF
        rank = {}
        for r, i in enumerate(vec_order[:FETCH]):
            rank[i] = rank.get(i, 0.0) + 1.0 / (RRF_K + r + 1)
        for r, (i, _cn, _sc) in enumerate(fts_list):
            rank[i] = rank.get(i, 0.0) + 1.0 / (RRF_K + r + 1)
        fused = sorted(rank.keys(), key=lambda i: -rank[i])
        top = cap_and_top(fused, chunks)
    return {"matched": True, "top": top, "max_cos": max_cos}


def build_citation(top, chunks):
    seen = {}
    for i in top:
        c = chunks[i]
        if c.chapter_number not in seen:
            seen[c.chapter_number] = c.chapter_name
        if len(seen) >= 2:
            break
    parts = []
    for num, name in seen.items():
        if num == 0:
            parts.append(f"מבוא: {name}")           # approved label semantics
        elif 1 <= num <= 13:
            parts.append(f"פרק {num}: {name}")
        else:
            parts.append(name)                        # back-matter: title only
    return "מבוסס על " + " ו".join(parts) if parts else "", set(seen.keys())


# ---------------- evaluation ----------------
def evaluate(name, mode, threshold, model, model_id, mat, chunks, version, cur, qset, gold):
    import numpy as np
    qpfx, _ = prefixes(model_id)
    ans = [q for q in qset if q["expect"] == "answerable"]
    off = [q for q in qset if q["expect"] == "refuse"]
    blk = [q for q in qset if q["expect"] == "block"]

    r1 = r3 = r5 = 0
    mrr = 0.0
    cit_ok = cit_tot = 0
    ret_lat, qemb_lat = [], []
    fails = []

    def gold_of(q):
        return gold[str(q["id"])] if str(q["id"]) in gold else q.get("gold", [])

    for q in ans:
        te = time.perf_counter()
        qv = model.encode([qpfx + q["q"]], normalize_embeddings=True)[0].astype("float32")
        qemb_lat.append(time.perf_counter() - te)
        fts = fts_ranked(cur, version, q["q"]) if mode == "hybrid" else []
        tr = time.perf_counter()
        res = retrieve(mode, qv, mat, fts, chunks, threshold)
        ret_lat.append(time.perf_counter() - tr)
        top = res["top"]
        g = gold_of(q)
        rank = 0
        for idx, ci in enumerate(top):
            if chunks[ci].chapter_number in g:
                rank = idx + 1
                break
        if rank == 1: r1 += 1
        if 1 <= rank <= 3: r3 += 1
        if 1 <= rank <= 5: r5 += 1
        if rank >= 1: mrr += 1.0 / rank
        if top:
            cit_tot += 1
            _cit, cited = build_citation(top, chunks)
            if cited.issubset({chunks[i].chapter_number for i in top}):
                cit_ok += 1
        if rank == 0:
            got = ",".join(f"ch{chunks[i].chapter_number}" for i in top) or "(none/refused)"
            fails.append(f"Q{q['id']} gold={g} got=[{got}] cos={res['max_cos']:.3f} | {q['q']}")

    off_ok, off_fp = 0, []
    for q in off:
        qv = model.encode([qpfx + q["q"]], normalize_embeddings=True)[0].astype("float32")
        fts = fts_ranked(cur, version, q["q"]) if mode == "hybrid" else []
        res = retrieve(mode, qv, mat, fts, chunks, threshold)
        if not res["matched"]:
            off_ok += 1
        else:
            off_fp.append(f"Q{q['id']} cos={res['max_cos']:.3f} top=ch{chunks[res['top'][0]].chapter_number} | {q['q']}")

    blk_ok = sum(1 for q in blk if is_blocked_request(q["q"]))

    n = len(ans)
    pct = lambda a, b: (a / b * 100) if b else 100.0
    p = lambda xs, q: (sorted(xs)[min(len(xs) - 1, int(q * (len(xs) - 1)))] * 1000) if xs else 0.0
    return {
        "config": name, "mode": mode, "threshold": round(threshold, 4),
        "recall@1": round(pct(r1, n), 1), "recall@3": round(pct(r3, n), 1), "recall@5": round(pct(r5, n), 1),
        "mrr": round(mrr / n, 3) if n else 0.0,
        "offtopic_refusal": round(pct(off_ok, len(off)), 1),
        "block_accuracy": round(pct(blk_ok, len(blk)), 1),
        "citation_faithfulness": f"{cit_ok}/{cit_tot}",
        "ret_p50_ms": round(p(ret_lat, 0.5), 2), "ret_p95_ms": round(p(ret_lat, 0.95), 2),
        "qembed_p50_ms": round(p(qemb_lat, 0.5), 2), "qembed_p95_ms": round(p(qemb_lat, 0.95), 2),
        "passes_gates": (pct(r5, n) >= RECALL5_MIN * 100 and pct(off_ok, len(off)) >= OFFTOPIC_MIN * 100
                          and pct(blk_ok, len(blk)) >= BLOCK_MIN * 100 and cit_ok == cit_tot),
        "answerable_failures": fails, "offtopic_false_positives": off_fp,
    }


# ---------------- postgres corpus load ----------------
def pg_connect(dsn):
    import psycopg2
    return psycopg2.connect(dsn)


def pg_load_corpus(conn, chunks, version):
    cur = conn.cursor()
    cur.execute("""create table if not exists compass_book_sections (
        id bigint generated always as identity primary key, book_version text not null,
        chapter_number int not null, chapter_name text not null, section_name text,
        section_order int not null, content text not null, checksum text not null,
        is_active boolean not null default false,
        search_tsv tsvector generated always as (
          setweight(to_tsvector('simple', coalesce(chapter_name,'')),'A') ||
          setweight(to_tsvector('simple', coalesce(section_name,'')),'B') ||
          setweight(to_tsvector('simple', coalesce(content,'')),'C')) stored,
        unique(book_version, section_order))""")
    cur.execute("create index if not exists compass_tsv_idx on compass_book_sections using gin(search_tsv)")
    cur.execute("delete from compass_book_sections where book_version=%s", (version,))
    for c in chunks:
        cur.execute("insert into compass_book_sections (book_version,chapter_number,chapter_name,section_name,section_order,content,checksum,is_active) "
                    "values (%s,%s,%s,%s,%s,%s,%s,true)",
                    (version, c.chapter_number, c.chapter_name, c.section_name, c.section_order, c.content, c.checksum))
    conn.commit()
    return cur


def load_source(path):
    src = json.loads(Path(path).read_text(encoding="utf-8"))
    chunks = chunk_book(src)
    if len(chunks) != EXPECTED_CANONICAL_CHUNKS:
        print(f"WARNING: chunk count {len(chunks)} != expected {EXPECTED_CANONICAL_CHUNKS}. "
              "Corpus differs from the canonical 888 manuscript.", file=sys.stderr)
    return src, chunks, corpus_checksum(src)


# ---------------- commands ----------------
def cmd_selfcheck(a):
    tuning = json.loads((DATA / "tuning56.json").read_text(encoding="utf-8"))["questions"]
    gold = json.loads((DATA / "gold.json").read_text(encoding="utf-8"))
    hh = sha256_file(DATA / "holdout75.json")
    print("holdout SHA-256:", hh, "OK" if hh == EXPECTED_HOLDOUT_SHA256 else "*** MISMATCH ***")
    blk = [q for q in tuning if q["expect"] == "block"]
    ok = sum(1 for q in blk if is_blocked_request(q["q"]))
    print(f"56-set block accuracy: {ok}/{len(blk)}")
    if a.source:
        _src, chunks, sha = load_source(a.source)
        print(f"chunks: {len(chunks)}  corpus_checksum: {sha[:16]}…")
    print("selfcheck done (no model loaded).")


def cmd_tune(a):
    import numpy as np
    tuning = json.loads((DATA / "tuning56.json").read_text(encoding="utf-8"))["questions"]
    gold = json.loads((DATA / "gold.json").read_text(encoding="utf-8"))
    src, chunks, corpus_sha = load_source(a.source)
    version = f"bench-{corpus_sha[:12]}"
    model = load_model(a.model_path)
    mat, emb_time, npy = embed_corpus(model, a.model_id, chunks, corpus_sha, HERE / ".cache")
    conn = pg_connect(a.pg); cur = pg_load_corpus(conn, chunks, version)
    dims = int(mat.shape[1]); footprint = npy.stat().st_size

    print(f"model={a.model_id} dims={dims} chunks={len(chunks)} "
          f"corpus_embed_time={emb_time:.2f}s footprint={footprint/1024:.1f}KB cache={npy.name}")
    grid = [round(x, 2) for x in np.arange(a.tmin, a.tmax + 1e-9, a.tstep)]
    results = []
    for mode in ("vector", "hybrid"):
        for th in grid:
            r = evaluate(f"{a.model_id}/{mode}", mode, th, model, a.model_id, mat, chunks, version, cur, tuning, gold)
            results.append(r)
    # report
    print("\nmode    thr   R@1   R@3   R@5   MRR   off%  blk%  cit    gates")
    for r in results:
        print(f"{r['mode']:7s} {r['threshold']:.2f} {r['recall@1']:5.1f} {r['recall@3']:5.1f} {r['recall@5']:5.1f} "
              f"{r['mrr']:.3f} {r['offtopic_refusal']:5.1f} {r['block_accuracy']:5.1f} {r['citation_faithfulness']:>5} "
              f"{'PASS' if r['passes_gates'] else '-'}")
    passing = [r for r in results if r["passes_gates"]]
    Path(HERE / "tune_report.json").write_text(json.dumps(
        {"model": a.model_id, "dims": dims, "footprint_bytes": footprint,
         "corpus_embed_time_s": emb_time, "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    if not passing:
        print("\nNo configuration cleared all gates on the 56-set. Nothing frozen.")
        return
    # lightest/simplest with margin: prefer vector-only, then highest threshold margin, then R@5
    passing.sort(key=lambda r: (r["mode"] != "vector", -r["recall@5"], -r["threshold"]))
    win = passing[0]
    frozen = {"model_id": a.model_id, "mode": win["mode"], "threshold": win["threshold"],
              "rrf_k": RRF_K, "corpus_checksum": corpus_sha, "tuning_metrics": win,
              "holdout_sha256": EXPECTED_HOLDOUT_SHA256}
    WINNER_FILE.write_text(json.dumps(frozen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nFROZEN winner -> {WINNER_FILE.name}: mode={win['mode']} threshold={win['threshold']} "
          f"R@5={win['recall@5']}% off={win['offtopic_refusal']}%  (run-holdout to evaluate once)")


def cmd_run_holdout(a):
    for bad in ("mode", "threshold", "model_id"):
        if getattr(a, bad, None):
            sys.exit(f"ERROR: --{bad} may not be overridden during a holdout run. Parameters come only from {WINNER_FILE.name}.")
    if not WINNER_FILE.exists():
        sys.exit("ERROR: winner.frozen.json not found. A configuration must pass all gates in `tune` first.")
    hh = sha256_file(DATA / "holdout75.json")
    if hh != EXPECTED_HOLDOUT_SHA256:
        sys.exit(f"ERROR: holdout SHA-256 mismatch ({hh}); refusing to run.")
    frozen = json.loads(WINNER_FILE.read_text(encoding="utf-8"))
    holdout = json.loads((DATA / "holdout75.json").read_text(encoding="utf-8"))["questions"]
    src, chunks, corpus_sha = load_source(a.source)
    if corpus_sha != frozen["corpus_checksum"]:
        sys.exit("ERROR: corpus checksum differs from the frozen winner's corpus. Refusing to run.")
    # One-run enforcement: refuse a second run of the same (holdout, winner, corpus).
    if holdout_already_ran(frozen, corpus_sha):
        prev = json.loads(HOLDOUT_LOCK.read_text(encoding="utf-8"))
        sys.exit(
            f"ERROR: this holdout was already run once (at {prev.get('ran_at')}) for the same "
            f"holdout SHA-256, winner config, and corpus. Refusing a second run.\n"
            f"See {HOLDOUT_LOCK.name}. There is no override flag; if you truly must re-run, delete "
            f"that file by hand — a deliberate act, not a parameter.")
    version = f"bench-{corpus_sha[:12]}"
    model = load_model(a.model_path)
    mat, _t, _npy = embed_corpus(model, frozen["model_id"], chunks, corpus_sha, HERE / ".cache")
    conn = pg_connect(a.pg); cur = pg_load_corpus(conn, chunks, version)
    gold = {str(q["id"]): q.get("gold", []) for q in holdout}
    r = evaluate(f"HOLDOUT/{frozen['model_id']}/{frozen['mode']}", frozen["mode"], frozen["threshold"],
                 model, frozen["model_id"], mat, chunks, version, cur, holdout, gold)
    Path(HERE / "holdout_report.json").write_text(json.dumps(
        {"frozen": frozen, "holdout_sha256": hh, "metrics": r}, ensure_ascii=False, indent=2), encoding="utf-8")
    write_holdout_lock(frozen, corpus_sha)  # persistent one-run marker
    print(json.dumps(r, ensure_ascii=False, indent=2))
    print(f"\nHOLDOUT complete (run once; locked via {HOLDOUT_LOCK.name}). "
          "Do not tune after seeing these results.")


def main():
    ap = argparse.ArgumentParser(description="Portable Benchmark C runner (local models only).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("tune", "run-holdout"):
        s = sub.add_parser(name)
        s.add_argument("--source", required=True, help="path to medaytim-laahava-888-final.source.json (local, never committed)")
        s.add_argument("--model-path", required=True, help="local directory with pre-downloaded model weights")
        s.add_argument("--pg", required=True, help="Postgres DSN for the FTS signal (local benchmark DB)")
        if name == "tune":
            s.add_argument("--model-id", required=True, help="e.g. intfloat/multilingual-e5-small")
            s.add_argument("--tmin", type=float, default=0.30)
            s.add_argument("--tmax", type=float, default=0.88)
            s.add_argument("--tstep", type=float, default=0.02)
        else:
            s.add_argument("--model-id", default=None)   # presence -> hard error (override guard)
            s.add_argument("--mode", default=None)
            s.add_argument("--threshold", default=None)
    sc = sub.add_parser("selfcheck"); sc.add_argument("--source", default=None)
    a = ap.parse_args()
    {"selfcheck": cmd_selfcheck, "tune": cmd_tune, "run-holdout": cmd_run_holdout}[a.cmd](a)


if __name__ == "__main__":
    main()
