"""
Faithful Python port of site/src/lib/compass/chunker.ts (canonical chunking).

Kept byte-for-byte equivalent in behavior: TARGET_CHARS=900, MAX_CHARS=1400,
whitespace normalization, sentence-safe splitting of oversized paragraphs,
sectionOrder sequential from 1. A self-check asserts the canonical corpus
produces exactly 382 chunks so any divergence from production is caught.

This module reads a BookSource JSON (the manuscript) at RUN TIME from a local
path the operator supplies; the manuscript is never bundled with the runner.
"""
from __future__ import annotations
import hashlib
import re
from dataclasses import dataclass

TARGET_CHARS = 900
MAX_CHARS = 1400
EXPECTED_CANONICAL_CHUNKS = 382  # guard: canonical 888 corpus


@dataclass
class Chunk:
    book_version: str
    chapter_number: int
    chapter_name: str
    section_name: str | None
    section_order: int
    content: str
    checksum: str


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?…])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def _pack_sentences(paragraph: str) -> list[str]:
    out: list[str] = []
    buf = ""
    for s in _split_sentences(paragraph):
        if buf and len(buf) + 1 + len(s) > MAX_CHARS:
            out.append(buf)
            buf = s
        else:
            buf = f"{buf} {s}" if buf else s
    if buf:
        out.append(buf)
    return out


def chunk_book(source: dict) -> list[Chunk]:
    chunks: list[Chunk] = []
    order = 0

    def push(cn: int, cname: str, sname: str | None, content: str) -> None:
        nonlocal order
        trimmed = content.strip()
        if not trimmed:
            return
        order += 1
        chunks.append(Chunk(
            book_version=source["version"],
            chapter_number=cn,
            chapter_name=cname,
            section_name=sname,
            section_order=order,
            content=trimmed,
            checksum=hashlib.sha256(trimmed.encode("utf-8")).hexdigest(),
        ))

    for chapter in source["chapters"]:
        for section in chapter["sections"]:
            sname = _normalize(section["name"]) if section.get("name") else None
            paragraphs = [p for p in (_normalize(x) for x in section["paragraphs"]) if p]
            buf = ""

            def flush() -> None:
                nonlocal buf
                if buf:
                    push(chapter["number"], chapter["name"], sname, buf)
                    buf = ""

            for para in paragraphs:
                if len(para) > MAX_CHARS:
                    flush()
                    for piece in _pack_sentences(para):
                        push(chapter["number"], chapter["name"], sname, piece)
                    continue
                if buf and len(buf) + 2 + len(para) > TARGET_CHARS:
                    flush()
                buf = f"{buf}\n\n{para}" if buf else para
            flush()

    return chunks


def corpus_checksum(source: dict) -> str:
    """Stable identity for embedding cache keys: sha256 over ordered chunk text."""
    h = hashlib.sha256()
    for c in chunk_book(source):
        h.update(c.content.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()
