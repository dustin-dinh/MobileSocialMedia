"""Assemble the plan: template + feature sections + rendered flowcharts -> HTML -> PDF.

Usage: python build_plan.py <template.html> <out.html> <out.pdf>
Reads PLAN/sections/<ID>.html, PLAN/sections/G*-summary.json, PLAN/specs/<flow>.json (titles),
PLAN/render/<flow>.svg, PLAN/risks.html, PLAN/questions.html.
"""
import glob
import html
import json
import os
import re
import subprocess
import sys
import tempfile

PLAN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
MAX_W = 600  # px; A4 content width with 30/20 mm margins is ~605 px
GROUPS = [
    ("A", "Nhóm A. Bảo mật tài khoản", ["A1", "A2", "A3", "A4", "A5", "A6"]),
    ("B", "Nhóm B. An toàn – điểm khác biệt của sản phẩm", ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]),
    ("C", "Nhóm C. Kiểm duyệt và quản trị", ["C1", "C2", "C3"]),
    ("D", "Nhóm D. Mạng xã hội", ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]),
    ("E", "Nhóm E. Quyền riêng tư và tuân thủ", ["E1", "E2", "E3", "E4"]),
]
ORDER = [fid for _, _, ids in GROUPS for fid in ids]
PHASES = {1: "GĐ1 – Sẵn sàng phát hành", 2: "GĐ2 – Bảo mật và an toàn", 3: "GĐ3 – Mạng xã hội đầy đủ", 4: "GĐ4 – Mở rộng"}


def read(path):
    return open(path, encoding="utf-8").read()


def load_summaries():
    items = {}
    for path in glob.glob(os.path.join(PLAN, "sections", "G*-summary.json")):
        for it in json.load(open(path, encoding="utf-8")):
            items[it["id"]] = it
    missing = [fid for fid in ORDER if fid not in items]
    if missing:
        sys.exit(f"missing summaries for {missing}")
    return items


def days(it):
    return it["be_days"] + it["mb_days"] + it["qa_days"]


def phase_of(it):
    # A5 is "1 if the law requires it, else 4": the summary may give a number or text.
    p = it["phase"]
    return p if isinstance(p, int) else int(re.search(r"\d", str(p)).group(0))


def feature_table(items):
    rows = ["<table><tr><th style=\"width:7%\">Mã</th><th>Tính năng</th><th style=\"width:8%\">GĐ</th>"
            "<th style=\"width:24%\">Ngày công (BE / MB / KT)</th><th style=\"width:14%\">Phụ thuộc</th></tr>"]
    for fid in ORDER:
        it = items[fid]
        rows.append(f"<tr><td>{fid}</td><td>{html.escape(it['name'])}</td><td>{html.escape(str(it['phase']))}</td>"
                    f"<td>{days(it):g} ({it['be_days']:g} / {it['mb_days']:g} / {it['qa_days']:g})</td>"
                    f"<td>{html.escape(', '.join(it.get('depends', [])) or '–')}</td></tr>")
    rows.append("</table><p><i>BE: backend · MB: mobile · KT: kiểm thử. Ngày công của một lập trình viên đã quen code; "
                "đề xuất để bàn, chưa phải cam kết.</i></p>")
    return "\n".join(rows)


def phase_table(items):
    rows = ["<table><tr><th style=\"width:28%\">Giai đoạn</th><th>Tính năng</th><th style=\"width:16%\">Ngày công</th></tr>"]
    total = 0
    for p, name in PHASES.items():
        ids = [fid for fid in ORDER if phase_of(items[fid]) == p]
        d = sum(days(items[fid]) for fid in ids)
        total += d
        rows.append(f"<tr><td>{name}</td><td>{', '.join(ids)}</td><td>{d:g}</td></tr>")
    rows.append(f"<tr><td><b>Tổng</b></td><td></td><td><b>{total:g}</b></td></tr></table>")
    rows.append(f"<p>Với một lập trình viên làm toàn thời gian (khoảng 21 ngày công một tháng), toàn bộ kế hoạch mất khoảng "
                f"<b>{total / 21:.0f} tháng</b>; hai người làm song song backend và mobile rút còn khoảng {total / 42:.0f}–{total / 30:.0f} tháng, "
                "vì có những phần phải làm tuần tự.</p>")
    return "\n".join(rows)


def risk_table(items):
    rows = ["<p>Rủi ro riêng của từng tính năng, do người viết đặc tả nêu ra; chi tiết và cách giảm rủi ro nằm ở phần i) của tính năng đó.</p>",
            "<table><tr><th style=\"width:7%\">Mã</th><th>Rủi ro chính</th></tr>"]
    for fid in ORDER:
        risks = items[fid].get("risks", [])
        if risks:
            rows.append(f"<tr><td>{fid}</td><td>{'; '.join(html.escape(r.rstrip('.')) for r in risks)}.</td></tr>")
    rows.append("</table>")
    return "\n".join(rows)


def figures(doc):
    n = 0
    used = []

    def fig(m):
        nonlocal n
        fid = m.group(1).strip()
        svg_path = os.path.join(PLAN, "render", fid + ".svg")
        spec_path = os.path.join(PLAN, "specs", fid + ".json")
        if not os.path.exists(svg_path):
            sys.exit(f"missing render for flow {fid}")
        n += 1
        used.append(fid)
        title = json.load(open(spec_path, encoding="utf-8")).get("title", fid)
        svg = read(svg_path)
        w = int(re.search(r'width="(\d+)"', svg).group(1))
        # max-height keeps a tall flow on one page together with the paragraph that introduces it
        svg = re.sub(r'^<svg ', f'<svg style="width:{min(w, MAX_W)}px;max-height:200mm" ', svg, count=1)
        svg = re.sub(r' width="\d+" height="\d+"', "", svg, count=1)
        return f'<div class="fig">{svg}</div><p class="caption">Hình {n}. {html.escape(title)}</p>'

    doc = re.sub(r"<!--\s*FLOW:([^>]+?)\s*-->", fig, doc)
    return doc, used


def build(template, out_html, out_pdf):
    items = load_summaries()
    parts, toc = [], ['<div class="toc"><ul>',
                      '<li>I. Mục tiêu và cách đọc tài liệu</li><li>II. Thế nào là "hoàn hảo"</li>',
                      '<li>III. Hiện trạng và khoảng trống so với Facebook</li><li>IV. Danh sách tính năng và lộ trình</li>',
                      '<li>V. Đặc tả chi tiết từng tính năng<ul>']
    for key, title, ids in GROUPS:
        parts.append(f'<h3 class="group feature" id="g-{key}">{html.escape(title)}</h3>')
        toc.append(f'<li><a href="#g-{key}">{html.escape(title)}</a><ul>')
        for k, fid in enumerate(ids):
            sec = read(os.path.join(PLAN, "sections", fid + ".html"))
            heading = re.search(r"<h3>(.*?)</h3>", sec, re.S).group(1)
            cls = ' class="feature"' if k else ""  # every feature after the first of a group starts a new page
            sec = sec.replace("<h3>", f'<h3 id="f-{fid}"{cls}>', 1)
            toc.append(f'<li><a href="#f-{fid}">{heading}</a></li>')
            parts.append(sec)
        toc.append("</ul></li>")
    toc.append("</ul></li><li>VI. Rủi ro, pháp lý và chi phí</li><li>VII. Câu hỏi cần chủ dự án quyết</li></ul></div>")
    doc = read(template)
    doc = doc.replace("<!--FEATURES-->", "\n".join(parts))
    doc = doc.replace("<!--TOC-->", "\n".join(toc))
    doc = doc.replace("<!--FEATURE_TABLE-->", feature_table(items))
    doc = doc.replace("<!--PHASE_TABLE-->", phase_table(items))
    doc = doc.replace("<!--FEATURE_COUNT-->", str(len(ORDER)))
    doc = doc.replace("<!--RISKS-->", read(os.path.join(PLAN, "risks.html")))
    doc = doc.replace("<!--QUESTIONS-->", read(os.path.join(PLAN, "questions.html")))
    doc = doc.replace("<!--AGENT_RISKS-->", risk_table(items))
    doc, used = figures(doc)
    left = re.findall(r"<!--[A-Z_]+(?::[^>]*)?-->", doc)
    if left:
        sys.exit(f"unreplaced markers: {left}")
    open(out_html, "w", encoding="utf-8").write(doc)
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-pdf-header-footer", "--generate-pdf-document-outline",
                        f"--print-to-pdf={os.path.abspath(out_pdf)}", "file:///" + os.path.abspath(out_html).replace("\\", "/")],
                       capture_output=True, timeout=300)
    print(f"{len(used)} figures, {len(ORDER)} features -> {out_pdf}")
    return used


if __name__ == "__main__":
    build(*sys.argv[1:4])
