"""Swimlane flowchart spec (JSON) -> editable .drawio, laid out on a fixed grid.

Usage: python flowgen.py spec.json out.drawio

Spec:
{
  "id": "a1-enable-2fa",
  "title": "Bật xác thực hai lớp",
  "lanes": [{"name": "Người dùng"}, {"name": "Ứng dụng", "cols": 2}, {"name": "Máy chủ"}],
  "nodes": [
    {"id": "s", "type": "start", "lane": 0, "row": 0, "label": "Mở Cài đặt"},
    {"id": "d", "type": "decision", "lane": 2, "row": 3, "col": 0, "label": "Mã đúng?"}
  ],
  "edges": [
    {"from": "s", "to": "d", "label": "Có", "exit": "right", "entry": "top", "via": [[2.5, 3]]}
  ]
}
Node types: start, end, process, decision, data (database), io (screen / input-output), sub (calls another flow).
lane = lane index, col = sub-column inside that lane (default 0), row = grid row (0-based, may be .5).
Edge "exit"/"entry" (top|bottom|left|right) override the automatic sides; "via" is a list of
[global_column, row] grid points (column centre = .0 offset from the lane's first column, e.g. 1.5 = gap
between global columns 1 and 2) used as waypoints.
"""
import json
import sys
from xml.sax.saxutils import escape as _escape


def escape(text):
    return _escape(text, {'"': '&quot;'})

COL_W = 200
ROW_H = 96
HEADER = 34
TOP_PAD = 14
BOTTOM_PAD = 16
FONT = "fontFamily=Times New Roman;fontColor=#000000;"
SIZES = {
    "start": (150, 44), "end": (150, 44), "process": (172, 58), "decision": (176, 80),
    "data": (150, 64), "io": (176, 58), "sub": (172, 58),
}
STYLES = {
    "start": "rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;",
    "end": "rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#000000;strokeWidth=1.5;fontStyle=1;",
    "process": "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;",
    "decision": "rhombus;whiteSpace=wrap;html=1;fillColor=#F2F2F2;strokeColor=#000000;",
    "data": "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#FFFFFF;strokeColor=#000000;",
    "io": "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;size=14;fillColor=#FFFFFF;strokeColor=#000000;",
    "sub": "shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;size=0.08;fillColor=#FFFFFF;strokeColor=#000000;",
}
SIDE = {"top": (0.5, 0), "bottom": (0.5, 1), "left": (0, 0.5), "right": (1, 0.5)}


def build(spec):
    lanes = spec["lanes"]
    starts, x = [], 0
    for lane in lanes:
        starts.append(x)
        x += lane.get("cols", 1)
    total_cols = x
    rows = max(n["row"] for n in spec["nodes"]) + 1
    lane_h = HEADER + TOP_PAD + rows * ROW_H + BOTTOM_PAD
    errors = []
    if total_cols > 4:
        errors.append(f"{total_cols} columns: at most 4 fit an A4 page")
    if rows > 11:
        errors.append(f"{rows} rows: at most 11 fit an A4 page, split the flow")

    pos, cells, seen = {}, [], {}
    for i, lane in enumerate(lanes):
        w = lane.get("cols", 1) * COL_W
        cells.append(
            f'<mxCell id="lane-{i}" value="{escape(lane["name"])}" style="swimlane;horizontal=1;startSize={HEADER};'
            f'html=1;collapsible=0;fillColor=#FFFFFF;swimlaneFillColor=#FFFFFF;strokeColor=#000000;fontStyle=1;fontSize=14;{FONT}" '
            f'vertex="1" parent="1"><mxGeometry x="{starts[i] * COL_W}" y="0" width="{w}" height="{lane_h}" as="geometry"/></mxCell>')
    for n in spec["nodes"]:
        t = n.get("type", "process")
        if t not in SIZES:
            errors.append(f"node {n['id']}: unknown type {t}")
            continue
        lane, col = n["lane"], n.get("col", 0)
        if col >= lanes[lane].get("cols", 1):
            errors.append(f"node {n['id']}: col {col} outside lane {lane}")
        key = (lane, col, n["row"])
        if key in seen:
            errors.append(f"nodes {seen[key]} and {n['id']} share lane {lane} col {col} row {n['row']}")
        seen[key] = n["id"]
        w, h = SIZES[t]
        cx = col * COL_W + COL_W / 2
        cy = HEADER + TOP_PAD + n["row"] * ROW_H + ROW_H / 2
        gcol = starts[lane] + col
        pos[n["id"]] = (gcol, n["row"], lane)
        cells.append(
            f'<mxCell id="n-{n["id"]}" value="{escape(n.get("label", n["id"]))}" style="{STYLES[t]}fontSize=13;{FONT}" '
            f'vertex="1" parent="lane-{lane}"><mxGeometry x="{cx - w / 2:.0f}" y="{cy - h / 2:.0f}" width="{w}" height="{h}" as="geometry"/></mxCell>')

    for k, e in enumerate(spec["edges"]):
        if e["from"] not in pos or e["to"] not in pos:
            errors.append(f"edge {k}: unknown node {e['from']} -> {e['to']}")
            continue
        (sc, sr, _), (tc, tr, _) = pos[e["from"]], pos[e["to"]]
        if sc == tc:
            ex, en = ("bottom", "top") if tr > sr else ("right", "right")
        elif sr == tr:
            ex, en = ("right", "left") if tc > sc else ("left", "right")
        elif tr > sr:
            src_type = next(n.get("type", "process") for n in spec["nodes"] if n["id"] == e["from"])
            side = "right" if tc > sc else "left"
            ex, en = (side, "top") if src_type == "decision" else ("bottom", "top")
        else:
            ex, en = ("right", "left") if tc > sc else ("left", "right")
        ex, en = e.get("exit", ex), e.get("entry", en)
        ax, ay = SIDE[ex]
        bx, by = SIDE[en]
        pts = "".join(
            f'<mxPoint x="{c * COL_W + COL_W / 2:.0f}" y="{HEADER + TOP_PAD + r * ROW_H + ROW_H / 2:.0f}"/>'
            for c, r in e.get("via", []))
        geo = f'<mxGeometry relative="1" as="geometry">{"<Array as=\"points\">" + pts + "</Array>" if pts else ""}</mxGeometry>'
        style = (f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;"
                 f"strokeColor=#000000;fontSize=12;labelBackgroundColor=#FFFFFF;{FONT}"
                 f"exitX={ax};exitY={ay};exitDx=0;exitDy=0;entryX={bx};entryY={by};entryDx=0;entryDy=0;")
        if e.get("dashed"):
            style += "dashed=1;"
        cells.append(
            f'<mxCell id="e-{k}" value="{escape(e.get("label", ""))}" style="{style}" edge="1" parent="1" '
            f'source="n-{e["from"]}" target="n-{e["to"]}">{geo}</mxCell>')

    xml = (f'<mxfile host="flowgen"><diagram id="{escape(spec["id"])}" name="{escape(spec.get("title", spec["id"]))}">'
           f'<mxGraphModel grid="0" page="0" background="#FFFFFF"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
           + "".join(cells) + "</root></mxGraphModel></diagram></mxfile>\n")
    return xml, errors


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    xml, errors = build(spec)
    for err in errors:
        print("ERROR:", err)
    open(sys.argv[2], "w", encoding="utf-8").write(xml)
    print(f"wrote {sys.argv[2]}")
    sys.exit(1 if errors else 0)
