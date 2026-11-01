"""Render a .drawio with the official draw.io viewer (headless Edge) -> clean .svg + preview .png.

Usage: python render.py diagram.drawio out_dir
Writes out_dir/<name>.svg (for the PDF) and out_dir/<name>.png (to look at).
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"


def edge(args):
    with tempfile.TemporaryDirectory() as profile:
        return subprocess.run([EDGE, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", *args],
                              capture_output=True, text=True, encoding="utf-8", timeout=180)


def render(src, out_dir):
    name = os.path.splitext(os.path.basename(src))[0]
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    xml = open(src, encoding="utf-8").read()
    cfg = {"xml": xml, "nav": False, "lightbox": False, "border": 0, "highlight": "none"}
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, "d.html")
        open(page, "w", encoding="utf-8").write(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">'
            f'<div class="mxgraph" data-mxgraph="{html.escape(json.dumps(cfg, ensure_ascii=False), quote=True)}"></div>'
            '<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script></body></html>')
        dom = edge(["--virtual-time-budget=30000", "--dump-dom", "file:///" + page.replace("\\", "/")]).stdout
    m = re.search(r"<svg.*?</svg>", dom, re.S)
    if not m:
        sys.exit(f"render failed for {src}: no <svg> in viewer output (network to viewer.diagrams.net?)")
    svg = m.group(0)
    w, h = (int(v) for v in re.search(r"min-width: (\d+)px; min-height: (\d+)px", svg).groups())
    svg = re.sub(r"light-dark\((#[0-9a-fA-F]+|rgb\([^)]*\)), [^)]*\)+", r"\1", svg)
    svg = re.sub(r'^<svg style="[^"]*"', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"', svg)
    svg_path = os.path.join(out_dir, name + ".svg")
    open(svg_path, "w", encoding="utf-8").write(svg)
    png_path = os.path.join(out_dir, name + ".png")
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, "p.html")
        open(page, "w", encoding="utf-8").write(f'<!DOCTYPE html><html><body style="margin:0;background:#fff">{svg}</body></html>')
        edge([f"--window-size={w + 20},{h + 20}", "--virtual-time-budget=5000",
              f"--screenshot={png_path}", "file:///" + page.replace("\\", "/")])
    print(f"wrote {svg_path} and {png_path} ({w}x{h}px)")


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2])
