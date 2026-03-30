---
name: beautiful-charts
description: >-
  Renders beautiful, publication-quality chart images (transparent PNG) from structured data using
  matplotlib. Use this skill whenever the user asks to draw, plot, chart, graph, or visualize any
  data — including "make a bar chart", "plot this data", "show me a line graph", "visualize these
  numbers", "create a donut chart", or any request to turn tables or numbers into a PNG image.
  Also trigger when the user uploads a CSV or spreadsheet and wants it visualized. Supports line,
  bar, horizontal bar, area, scatter, and donut chart types. Always use this skill proactively —
  do not attempt to describe a chart in prose when a visual is possible.
metadata:
  author: quanle96
  version: "1.0.0"
tags:
  - charts
  - visualization
  - matplotlib
  - data
  - png
  - plotting
---

# Beautiful Charts → PNG

Renders transparent-background PNG charts at 150 DPI using a clean, editorial design system.

## Pipeline

```
Write chart_config.json  →  uv run render_chart.py config.json ~/chart.png  →  view ~/chart.png
```

`render_chart.py` ships alongside this SKILL.md. Run with `uv run` — it auto-installs
`matplotlib` and `numpy` on first use, no pip or venv needed.

**One-time uv install:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # macOS / Linux
winget install astral-sh.uv                        # Windows
```

> **Display rule:** `view /home/claude/chart.png` renders inline in chat.
> `present_files` alone shows a download button with no preview — always call `view` first.

---

## Step 1 — Pick chart type

| Data | Type |
|---|---|
| Trend over time | `line` |
| Period comparisons | `bar` |
| Rankings / long labels | `hbar` |
| Filled trend | `area` |
| Correlation | `scatter` |
| Part-of-whole ≤6 slices | `donut` |

---

## Step 2 — Write chart_config.json

```jsonc
{
  "type":     "line",          // required
  "title":    "Chart title",   // top-left, 15px
  "subtitle": "Unit · note",   // muted, below title
  "source":   "Source: XYZ",  // bottom-left, tiny
  "labels":   ["A", "B"],     // x-axis (or y-axis for hbar)
  "yMin":     0,               // set explicitly — never leave to auto
  "yMax":     120,
  "yPrefix":  "$",             // prepended to y ticks → "$90"
  "ySuffix":  "M",             // appended  to y ticks → "90M"
  "width":    900,             // px, default 900
  "height":   480,             // px, default 480
  "datasets": [ ... ]
}
```

**Color names** (always use names, never hex):
`"blue"` · `"red"` · `"teal"` · `"amber"` · `"purple"` · `"gray"`

First series → `blue`. Second → `red`. Third → `teal`. Max 2–3 colors per chart.

Full dataset schemas for every chart type: see [references/schemas.md](references/schemas.md)

---

## Step 3 — Run & display

```bash
# Render
uv run render_chart.py chart_config.json /home/claude/chart.png

# Show inline in chat (REQUIRED)
# → call the view tool on /home/claude/chart.png

# Optional: offer download
cp /home/claude/chart.png /mnt/user-data/outputs/chart.png
# → call present_files ["/mnt/user-data/outputs/chart.png"]
```

---

## Quick examples

**Line — oil prices**
```json
{
  "type": "line", "title": "Crude oil prices", "subtitle": "$/barrel",
  "labels": ["Mar 21", "Mar 23", "Mar 24", "Mar 25"],
  "yMin": 80, "yMax": 120, "yPrefix": "$",
  "datasets": [
    { "label": "WTI",   "color": "blue", "fill": true,  "data": [112.0, 88.13, 91.61, 90.98] },
    { "label": "Brent", "color": "red",  "fill": false, "data": [112.0, 99.94, 103.0,  101.5] }
  ]
}
```

**Bar — revenue**
```json
{
  "type": "bar", "title": "Quarterly revenue", "subtitle": "USD millions",
  "labels": ["Q1","Q2","Q3","Q4"], "yMin": 0, "yPrefix": "$", "ySuffix": "M",
  "datasets": [
    { "label": "2025", "color": "blue", "data": [12.4, 18.7, 15.2, 22.1] },
    { "label": "2026", "color": "teal", "data": [14.1, 20.3, 17.8, 25.6] }
  ]
}
```

**Donut — market share**
```json
{
  "type": "donut", "title": "Browser share 2026",
  "datasets": [{
    "labels": ["Chrome","Safari","Firefox","Edge","Other"],
    "colors": ["blue","red","amber","teal","gray"],
    "data": [65, 18, 7, 5, 5]
  }]
}
```

---

## Checklist

- [ ] Chart type matches the data shape
- [ ] `labels` length == `data` length in every dataset
- [ ] Colors are names (`"blue"`), not hex
- [ ] `yMin`/`yMax` set intentionally
- [ ] `title` + `subtitle` present
- [ ] Output to `/home/claude/chart.png`
- [ ] `view` called after render (inline display)
- [ ] `hbar` height = `numRows × 48 + 100`

## Common mistakes

| Wrong | Right |
|---|---|
| Only `present_files` | Call `view` first |
| `python3 render_chart.py` | `uv run render_chart.py` |
| Hex in `"color"` field | Use name: `"blue"` |
| Donut top-level `"labels"` | Use `datasets[0].labels` |
| Auto y-axis on price data | Set `"yMin"` explicitly |
