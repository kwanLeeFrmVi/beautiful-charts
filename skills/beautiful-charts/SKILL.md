---
name: beautiful-charts
description: >-
  Renders PNG charts (line, bar, hbar, area, scatter, donut) from data/CSV using Chart.js. Trigger for requests to draw, plot, chart, graph, or visualize data/numbers. Use proactively instead of prose.
metadata:
  author: quanle96
  version: "2.0.0"
tags:
  - charts
  - visualization
  - chartjs
  - data
  - png
  - plotting
---

# Beautiful Charts → PNG

Renders transparent-background PNG charts using Chart.js with a clean, editorial design system.

## Pipeline

```
Write chart_config.json  →  bunx -y beautiful-chartsjs config.json ./chart.png  →  view ./chart.png
```

> **Display rule:** `view ./chart.png` renders inline in chat.
> `present_files` alone shows a download button with no preview — always call `view` first.

---

## Step 1 — Pick chart type

| Data                       | Type        |
| -------------------------- | ----------- |
| Trend over time            | `line`      |
| Period comparisons         | `bar`       |
| Rankings / long labels     | `hbar`      |
| Filled trend               | `area`      |
| Correlation / bubbles      | `scatter`   |
| Part-of-whole (donut hole) | `donut`     |
| Part-of-whole (solid)      | `pie`       |
| Circular comparison        | `polarArea` |
| Multivariate comparison    | `radar`     |

---

## Step 2 — Write chart_config.json

```json
{
  "type":     "line",
  "title":    "Chart title",
  "subtitle": "Unit · note",
  "source":   "Source: XYZ",
  "labels":   ["A", "B"],
  "yMin":     0,
  "yMax":     120,
  "yPrefix":  "$",
  "ySuffix":  "M",
  "width":    900,
  "height":   480,
  "datasets": [ ... ]
}
```

**Field notes:**

- `type` — required chart type
- `title` — top-left, 15px font
- `subtitle` — muted, below title
- `source` — bottom-left, tiny font
- `labels` — x-axis labels (or y-axis for hbar)
- `yMin`/`yMax` — set explicitly, never leave to auto
- `yPrefix`/`ySuffix` — prepended/appended to y ticks

**Color names** (always use names, never hex):
`"blue"` · `"red"` · `"teal"` · `"amber"` · `"purple"` · `"gray"`

First series → `blue`. Second → `red`. Third → `teal`. Max 2–3 colors per chart.

Full dataset schemas for every chart type: see `schemas.md`

---

## Step 3 — Run & display

```bash
# Render
bunx -y beautiful-chartsjs chart_config.json ~/chart.png

# Show inline in chat (REQUIRED)
# → call the view tool on ~/chart.png

# Optional: offer download
cp ~/chart.png ./outputs/chart.png
# → call present_files ["./outputs/chart.png"]
```

---

### Quick examples

#### Line — oil prices

```json
{
  "type": "line",
  "title": "Crude oil prices",
  "subtitle": "$/barrel",
  "labels": ["Mar 21", "Mar 23", "Mar 24", "Mar 25"],
  "yMin": 80,
  "yMax": 120,
  "yPrefix": "$",
  "datasets": [
    {
      "label": "WTI",
      "color": "blue",
      "fill": true,
      "data": [112.0, 88.13, 91.61, 90.98]
    },
    {
      "label": "Brent",
      "color": "red",
      "fill": false,
      "data": [112.0, 99.94, 103.0, 101.5]
    }
  ]
}
```

#### Bar — revenue

```json
{
  "type": "bar",
  "title": "Quarterly revenue",
  "subtitle": "USD millions",
  "labels": ["Q1", "Q2", "Q3", "Q4"],
  "yMin": 0,
  "yMax": 30,
  "yPrefix": "$",
  "ySuffix": "M",
  "datasets": [
    { "label": "2025", "color": "blue", "data": [12.4, 18.7, 15.2, 22.1] },
    { "label": "2026", "color": "teal", "data": [14.1, 20.3, 17.8, 25.6] }
  ]
}
```

#### Donut — market share

```json
{
  "type": "donut",
  "title": "Browser share 2026",
  "datasets": [
    {
      "labels": ["Chrome", "Safari", "Firefox", "Edge", "Other"],
      "colors": ["blue", "red", "amber", "teal", "gray"],
      "data": [65, 18, 7, 5, 5]
    }
  ]
}
```

---

## Checklist

- [ ] Chart type matches the data shape
- [ ] `labels` length == `data` length in every dataset
- [ ] Colors are names (`"blue"`), not hex
- [ ] `yMin`/`yMax` set intentionally
- [ ] `title` + `subtitle` present
- [ ] Output to `./chart.png`
- [ ] `view` called after render (inline display)
- [ ] `hbar` height = `numRows × 48 + 100`

## Common mistakes

| Wrong                      | Right                        |
| -------------------------- | ---------------------------- |
| Only `present_files`       | Call `view` first            |
| `node render_chart.js`     | `bunx -y beautiful-chartsjs` |
| Hex in `"color"` field     | Use name: `"blue"`           |
| Donut top-level `"labels"` | Use `datasets[0].labels`     |
| Auto y-axis on price data  | Set `"yMin"` explicitly      |
