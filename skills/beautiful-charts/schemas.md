# Dataset Schemas & Sizing Reference

Full dataset schemas for every chart type supported by `render_chart.py`.

---

## line — time series, trends

```json
"datasets": [
  {
    "label": "Series name",
    "color": "blue",
    "fill": true,
    "data": [112.0, 88.13, 91.61, 90.98]
  }
]
```

- `"fill": true` → faint area under line (primary series only)
- `data` length must equal `labels` length

---

## bar — grouped vertical bars

```json
"datasets": [
  { "label": "2025", "color": "blue", "data": [12.4, 18.7, 15.2, 22.1] },
  { "label": "2026", "color": "teal", "data": [14.1, 20.3, 17.8, 25.6] }
]
```

- Multiple datasets render side-by-side (grouped)
- Single dataset = simple bars

---

## hbar — horizontal bars

```json
"datasets": [
  { "label": "Revenue", "color": "blue", "data": [42.1, 31.8, 18.4, 14.2, 12.9] }
]
```

- `labels` = category names on y-axis
- Set `"height": numRows * 48 + 100` to avoid squished bars
- The `yPrefix`/`ySuffix` apply to the x-axis for hbar

---

## area — filled area

```json
"datasets": [
  { "label": "Mobile",  "color": "blue", "data": [30, 38, 45, 52] },
  { "label": "Desktop", "color": "teal", "data": [70, 62, 55, 48] }
]
```

---

## scatter — correlation / bubble

```json
"datasets": [
  {
    "label": "Group A",
    "color": "blue",
    "data": [[1.2, 3.4], [2.5, 4.1], [3.1, 2.8, 2.0]]
  }
]
```

- Each point: `[x, y]` or `[x, y, radius]`
- Radius scales bubble size (optional)

---

## donut — part-of-whole (with hole)

```json
"datasets": [
  {
    "labels": ["Chrome", "Safari", "Firefox", "Edge", "Other"],
    "colors": ["blue", "red", "amber", "teal", "gray"],
    "data":   [65, 18, 7, 5, 5]
  }
]
```

- Use `datasets[0].labels` — NOT the top-level `"labels"` field
- `"colors"` array: one name per slice, in order
- Works best with ≤6 slices

---

## pie — part-of-whole (solid)

```json
"datasets": [
  {
    "labels": ["Product A", "Product B", "Product C", "Product D"],
    "colors": ["blue", "red", "teal", "amber"],
    "data":   [40, 30, 20, 10]
  }
]
```

- Same schema as `donut` — just no center hole
- Use `datasets[0].labels` and `datasets[0].colors`

---

## polarArea — circular comparison

```json
"datasets": [
  {
    "labels": ["Speed", "Reliability", "Comfort", "Efficiency"],
    "colors": ["blue", "red", "teal", "amber"],
    "data":   [85, 72, 90, 68]
  }
]
```

- Each slice has equal angle; radius reflects value
- Same schema as `donut`/`pie`

---

## radar — multivariate comparison

```json
"labels": ["Coding", "Design", "Communication", "Leadership", "Testing"],
"datasets": [
  { "label": "Developer A", "color": "blue", "data": [90, 65, 70, 55, 75] },
  { "label": "Developer B", "color": "red",  "data": [75, 80, 85, 70, 90] }
]
```

- Top-level `"labels"` = axis labels around the circle
- Multiple datasets overlay for comparison
- Each `data` array length must equal `labels` length

---

## Color palette

| Name       | Hex       | Use for         |
| ---------- | --------- | --------------- |
| `"blue"`   | `#185FA5` | 1st / primary   |
| `"red"`    | `#E24B4A` | 2nd / negative  |
| `"teal"`   | `#1D9E75` | 3rd / positive  |
| `"amber"`  | `#BA7517` | 4th / warning   |
| `"purple"` | `#534AB7` | 5th             |
| `"gray"`   | `#888780` | neutral / other |

---

## Sizing guide

| Use case        | width × height     |
| --------------- | ------------------ |
| Default         | 900 × 480          |
| Wide panel      | 1200 × 400         |
| Square / social | 800 × 800          |
| hbar (N rows)   | 900 × (N×48 + 100) |
| Thumbnail       | 600 × 320          |

---

## Y-axis formatting

| Data type               | Config                                |
| ----------------------- | ------------------------------------- |
| Dollar                  | `"yPrefix": "$"`                      |
| Percent                 | `"ySuffix": "%"`                      |
| Millions                | `"ySuffix": "M"` (data already in M)  |
| Price range e.g. 88–113 | `"yMin": 80` — do not auto-scale to 0 |
| Must start at zero      | `"yMin": 0` explicitly                |
