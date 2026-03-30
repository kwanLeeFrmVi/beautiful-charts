# Beautiful Charts

A skill for rendering beautiful, publication-quality chart images (transparent PNG) from structured data using matplotlib.

## Installation

```bash
npx skill add kwanLeeFrmVi/beautiful-charts
```

## Features

- **Multiple chart types**: Line, bar, horizontal bar, area, scatter, and donut charts
- **Publication quality**: Renders transparent-background PNG charts at 150 DPI
- **Clean design system**: Editorial styling with thoughtful defaults
- **Zero setup**: Auto-installs `matplotlib` and `numpy` on first use via `uv`

## Prerequisites

Install `uv` (one-time setup):

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
winget install astral-sh.uv
```

## Usage

### Quick Start

1. Create a chart configuration JSON file
2. Run the renderer with `uv run`
3. View the generated PNG

```bash
uv run render_chart.py chart_config.json output.png
```

### Chart Types

| Chart Type | Use Case | Config Type |
|------------|----------|-------------|
| `line` | Trend over time | `line` |
| `bar` | Period comparisons | `bar` |
| `hbar` | Rankings / long labels | `hbar` |
| `area` | Filled trend | `area` |
| `scatter` | Correlation | `scatter` |
| `donut` | Part-of-whole (≤6 slices) | `donut` |

### Configuration Format

```json
{
  "type": "line",
  "title": "Chart Title",
  "subtitle": "Unit · note",
  "source": "Source: XYZ",
  "labels": ["A", "B", "C"],
  "yMin": 0,
  "yMax": 100,
  "yPrefix": "$",
  "ySuffix": "M",
  "width": 900,
  "height": 480,
  "datasets": [
    {
      "label": "Series 1",
      "color": "blue",
      "data": [10, 20, 30]
    }
  ]
}
```

### Color Palette

Use these color names (not hex codes):

| Name | Hex | Use Case |
|------|-----|----------|
| `blue` | `#185FA5` | 1st / primary |
| `red` | `#E24B4A` | 2nd / negative |
| `teal` | `#1D9E75` | 3rd / positive |
| `amber` | `#BA7517` | 4th / warning |
| `purple` | `#534AB7` | 5th |
| `gray` | `#888780` | neutral / other |

### Examples

#### Line Chart - Oil Prices

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
    { "label": "WTI", "color": "blue", "fill": true, "data": [112.0, 88.13, 91.61, 90.98] },
    { "label": "Brent", "color": "red", "fill": false, "data": [112.0, 99.94, 103.0, 101.5] }
  ]
}
```

#### Bar Chart - Revenue

```json
{
  "type": "bar",
  "title": "Quarterly revenue",
  "subtitle": "USD millions",
  "labels": ["Q1", "Q2", "Q3", "Q4"],
  "yMin": 0,
  "yPrefix": "$",
  "ySuffix": "M",
  "datasets": [
    { "label": "2025", "color": "blue", "data": [12.4, 18.7, 15.2, 22.1] },
    { "label": "2026", "color": "teal", "data": [14.1, 20.3, 17.8, 25.6] }
  ]
}
```

#### Donut Chart - Market Share

```json
{
  "type": "donut",
  "title": "Browser share 2026",
  "datasets": [{
    "labels": ["Chrome", "Safari", "Firefox", "Edge", "Other"],
    "colors": ["blue", "red", "amber", "teal", "gray"],
    "data": [65, 18, 7, 5, 5]
  }]
}
```

## Sizing Guide

| Use Case | Dimensions |
|----------|------------|
| Default | 900 × 480 |
| Wide panel | 1200 × 400 |
| Square / social | 800 × 800 |
| Horizontal bar (N rows) | 900 × (N×48 + 100) |
| Thumbnail | 600 × 320 |

## Schema Reference

See `skills/beautiful-charts/schemas.md` for detailed dataset schemas for each chart type.

## Triggers

This skill is automatically triggered when users ask to:
- Draw, plot, chart, or graph data
- Visualize numbers or tables
- Create bar charts, line graphs, pie/donut charts, scatter plots
- Convert CSV or spreadsheet data to visual charts

## License

MIT
