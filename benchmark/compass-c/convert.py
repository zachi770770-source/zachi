#!/usr/bin/env python3
"""
Deterministic DOCX -> BookSource converter for "גרסה 888.docx" (canonical).

Design (grounded in the file's actual styles):
  Chapter start : ChapterNumber ("מבוא" -> 0; "פרק N" -> N) + following ChapterTitle
  Chapter deck  : ChapterDeck  -> first paragraph of the chapter's intro section
  Section       : H2 (main) / BackMatterH2 (back matter) -> section.name
  Body          : BodyIndent, BodyFirst, SceneFirst, Dialogue, Bullet, NumberedStep, Anchor
  Back matter   : each BackMatterTitle (after chapters) -> a new chapter unit
  Tables        : 1x1 boxes ("כלים לשימוש חוזר") -> cell paragraphs into current section

Excluded (reported explicitly), never enters the Q&A corpus:
  - Title page: styles "11"/BookSubtitle/BookAuthor  (captured as metadata only)
  - "זכויות והבהרה": copyright + disclaimer (publishing boilerplate)
  - "תוכן עניינים": TOC (TOCChapter/TOCMainUnit) — navigation + page numbers
  - Back-matter units by title: "לקריאה נוספת והעמקה" (bibliography),
    "על המחבר" (author bio)  [both flagged for your confirmation]
  - Empty paragraphs

Output: medaytim-laahava-888-final.source.json  (BookSource shape)
Also writes exclusions.json with every excluded block.
"""
import json, re, sys
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
DOC = "docx_extract/word/document.xml"
VERSION = "medaytim-laahava-888-final"

BODY_STYLES = {"BodyIndent","BodyFirst","SceneFirst","Dialogue","Bullet","NumberedStep","Anchor"}
BACKMATTER_EXCLUDE_TITLES = {"לקריאה נוספת והעמקה", "על המחבר"}

def para_text(p):
    """In-order text of a paragraph; tab/br -> single space."""
    out = []
    for el in p.iter():
        tag = el.tag.split("}")[-1]
        if tag == "t":
            out.append(el.text or "")
        elif tag in ("tab", "br"):
            out.append(" ")
    return re.sub(r"\s+", " ", "".join(out)).strip()

def pstyle(p):
    ppr = p.find(f"{W}pPr")
    if ppr is None: return None
    ps = ppr.find(f"{W}pStyle")
    return ps.get(f"{W}val") if ps is not None else None

def table_paragraphs(tbl):
    """All non-empty cell paragraphs, in row->cell->paragraph (logical) order."""
    res = []
    for tr in tbl.findall(f"{W}tr"):
        for tc in tr.findall(f"{W}tc"):
            for p in tc.findall(f"{W}p"):
                t = para_text(p)
                if t: res.append(t)
    return res

def main():
    root = ET.parse(DOC).getroot()
    body = root.find(f"{W}body")
    blocks = [c for c in list(body) if c.tag.split("}")[-1] in ("p","tbl")]

    meta = {"title": None, "subtitle": None, "author": None}
    excluded = []            # list of {reason, style, text}
    chapters = []            # BookSource chapters
    cur_ch = None            # current chapter dict
    cur_sec = None           # current section dict
    mode = "front"           # front -> main -> back
    backmatter_num = 13      # back-matter units numbered 14,15,...
    pending_number = None    # ("מבוא"|int) captured from ChapterNumber, awaiting ChapterTitle
    skip_backunit = False    # currently inside an excluded back-matter unit

    def new_section(name):
        nonlocal cur_sec
        cur_sec = {"name": name, "paragraphs": []}
        cur_ch["sections"].append(cur_sec)

    def ensure_section():
        if cur_sec is None:
            new_section(None)

    def add_paragraph(t):
        if not t: return
        ensure_section()
        cur_sec["paragraphs"].append(t)

    for blk in blocks:
        tag = blk.tag.split("}")[-1]

        if tag == "tbl":
            if mode == "back" and not skip_backunit and cur_ch is not None:
                for t in table_paragraphs(blk):
                    add_paragraph(t)
            else:
                for t in table_paragraphs(blk):
                    excluded.append({"reason":"table outside included content","style":"tbl","text":t[:80]})
            continue

        style = pstyle(blk) or "(none)"
        text = para_text(blk)

        # ---- front matter metadata capture + exclusion ----
        if mode == "front":
            if style == "11" and text and meta["title"] is None:
                meta["title"] = text
                excluded.append({"reason":"front matter: title page","style":style,"text":text}); continue
            if style == "BookSubtitle":
                meta["subtitle"] = text
                excluded.append({"reason":"front matter: subtitle","style":style,"text":text}); continue
            if style == "BookAuthor":
                meta["author"] = text
                excluded.append({"reason":"front matter: author line","style":style,"text":text}); continue
            if style != "ChapterNumber":
                # copyright / disclaimer / TOC / blanks — all front matter
                if text:
                    reason = ("front matter: TOC" if style in ("TOCChapter","TOCMainUnit")
                              else "front matter: copyright/disclaimer/other")
                    excluded.append({"reason":reason,"style":style,"text":text[:80]})
                continue
            # first ChapterNumber -> enter main content
            mode = "main"

        # ---- back matter entry: a BackMatterTitle once we're in main ----
        if mode == "main" and style == "BackMatterTitle":
            mode = "back"

        # ================= MAIN CHAPTERS =================
        if mode == "main":
            if style == "ChapterNumber":
                pending_number = 0 if text.strip() == "מבוא" else int(re.sub(r"\D","",text) or 0)
                continue
            if style == "ChapterTitle":
                num = pending_number if pending_number is not None else 0
                pending_number = None
                cur_ch = {"number": num, "name": text, "sections": []}
                chapters.append(cur_ch); cur_sec = None
                continue
            if style == "ChapterDeck":
                add_paragraph(text); continue          # deck = first line of intro section
            if style == "H2":
                new_section(text); continue
            if style in BODY_STYLES:
                add_paragraph(text); continue
            if text:                                    # (none)/"11"/stray -> keep as body, don't lose content
                add_paragraph(text)
            continue

        # ================= BACK MATTER =================
        if mode == "back":
            if style == "BackMatterTitle":
                if text in BACKMATTER_EXCLUDE_TITLES:
                    skip_backunit = True
                    excluded.append({"reason":"back matter unit excluded (editorial)","style":style,"text":text})
                    cur_ch = None; cur_sec = None
                    continue
                skip_backunit = False
                backmatter_num += 1
                cur_ch = {"number": backmatter_num, "name": text, "sections": []}
                chapters.append(cur_ch); cur_sec = None
                continue
            if skip_backunit:
                if text:
                    excluded.append({"reason":"inside excluded back-matter unit","style":style,"text":text[:80]})
                continue
            if style == "BackMatterH2":
                new_section(text); continue
            if style in BODY_STYLES or style == "BackMatterBody":
                add_paragraph(text); continue
            if text:
                add_paragraph(text)
            continue

    # prune empty sections/chapters
    for ch in chapters:
        ch["sections"] = [s for s in ch["sections"] if s["paragraphs"]]
    chapters = [c for c in chapters if c["sections"]]

    source = {"version": VERSION, "title": meta["title"] or "מדייטים לאהבה", "chapters": chapters}
    with open(VERSION + ".source.json","w",encoding="utf-8") as f:
        json.dump(source, f, ensure_ascii=False, indent=2)
    with open("exclusions.json","w",encoding="utf-8") as f:
        json.dump({"meta":meta,"excluded":excluded}, f, ensure_ascii=False, indent=2)

    print("meta:", json.dumps(meta, ensure_ascii=False))
    print("chapters:", len(chapters))
    print("excluded blocks:", len(excluded))
    print("wrote", VERSION + ".source.json")

if __name__ == "__main__":
    main()
