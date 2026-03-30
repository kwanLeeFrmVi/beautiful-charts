#!/usr/bin/env bun
/**
 * render_chart.js — Beautiful Chart Renderer (Bun + Chart.js)
 * Usage: bunx -y beautiful-chartsjs config.json [output.png]
 *
 * If output path is given  → saves PNG file to that path
 * If output path is absent → prints base64 JSON block to stdout so Claude
 *                            renders the image inline in the chat automatically
 */

import { createCanvas } from '@napi-rs/canvas';
import { readFileSync, writeFileSync } from 'node:fs';

// ── Minimal browser polyfills — must come BEFORE the Chart.js dynamic import ─
const _mkMockCanvas = () => {
  const c = createCanvas(1, 1);
  c.style = {};
  c.addEventListener = () => { };
  c.removeEventListener = () => { };
  return c;
};

globalThis.window ??= globalThis;
globalThis.navigator ??= { userAgent: 'Bun', maxTouchPoints: 0 };
globalThis.document ??= {
  createElement: (t) => t === 'canvas' ? _mkMockCanvas() : { style: {}, addEventListener() { }, removeEventListener() { } },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() { },
  removeEventListener() { },
};

// ── Chart.js loaded after polyfills so its module-init sees a mock window ───
const { Chart, registerables } = await import('chart.js');
Chart.register(...registerables);

// ── Design tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  blue: '#185FA5',
  red: '#E24B4A',
  teal: '#1D9E75',
  amber: '#BA7517',
  purple: '#534AB7',
  gray: '#888780',
};
const PALETTE_ORDER = Object.keys(PALETTE);

const COLOR_TEXT = '#111111';
const COLOR_MUTED = '#999999';
const COLOR_FAINT = '#bbbbbb';
const COLOR_GRID = '#e8e8e8';
const COLOR_SPINE = '#e0e0e0';

// ── Helpers ──────────────────────────────────────────────────────────────────
const colorFor = (name, i = 0) =>
  PALETTE[name] ?? PALETTE[PALETTE_ORDER[i % PALETTE_ORDER.length]];

const rgba = (hex, a) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// ── Custom plugin: title / subtitle / source ─────────────────────────────────
Chart.register({
  id: 'headerFooter',
  beforeDraw({ ctx, width, height, options: { plugins: p } }) {
    const hf = p?.headerFooter;
    if (!hf) return;
    const PAD = 14;
    ctx.save();
    ctx.textAlign = 'left';
    if (hf.title) {
      ctx.font = '600 18px Arial,Helvetica,sans-serif';
      ctx.fillStyle = COLOR_TEXT;
      ctx.textBaseline = 'top';
      ctx.fillText(hf.title, PAD, PAD);
    }
    if (hf.subtitle) {
      ctx.font = '13px Arial,Helvetica,sans-serif';
      ctx.fillStyle = COLOR_MUTED;
      ctx.textBaseline = 'top';
      ctx.fillText(hf.subtitle, PAD, PAD + (hf.title ? 26 : 0));
    }
    if (hf.source) {
      ctx.font = '10px Arial,Helvetica,sans-serif';
      ctx.fillStyle = COLOR_FAINT;
      ctx.textBaseline = 'bottom';
      ctx.fillText(hf.source, PAD, height - 6);
    }
    ctx.restore();
  },
});

// ── Scale factories ──────────────────────────────────────────────────────────
const valScale = (pre, suf, mn, mx) => ({
  grid: { color: COLOR_GRID, lineWidth: 0.6 },
  border: { display: false },
  ticks: { color: COLOR_MUTED, font: { size: 11 }, callback: v => `${pre}${v}${suf}` },
  ...(mn != null && { min: mn }),
  ...(mx != null && { max: mx }),
});

const catScale = () => ({
  grid: { display: false },
  border: { color: COLOR_SPINE, width: 0.7 },
  ticks: { color: COLOR_MUTED, font: { size: 11 } },
});

// ── Chart-type builders (return { type, data, typeOptions }) ─────────────────
function cfgLine({ labels, datasets, pre, suf, ymin, ymax }) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, i) => {
        const c = colorFor(ds.color, i);
        return {
          label: ds.label || `Series ${i + 1}`,
          data: ds.data,
          borderColor: c,
          backgroundColor: ds.fill ? rgba(c, 0.06) : 'transparent',
          borderWidth: 2.2,
          pointRadius: 5.5,
          pointHoverRadius: 5.5,
          pointBackgroundColor: c,
          pointBorderWidth: 0,
          fill: ds.fill ? 'origin' : false,
          tension: 0,
        };
      }),
    },
    typeOptions: { scales: { x: catScale(), y: valScale(pre, suf, ymin, ymax) } },
  };
}

function cfgBar({ labels, datasets, pre, suf, ymin, ymax }) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label || `Series ${i + 1}`,
        data: ds.data,
        backgroundColor: colorFor(ds.color, i),
        borderWidth: 0,
      })),
    },
    typeOptions: { scales: { x: catScale(), y: valScale(pre, suf, ymin, ymax) } },
  };
}

function cfgHBar({ labels, datasets, pre, suf, ymin, ymax }) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => ({
        label: ds.label || `Series ${i + 1}`,
        data: ds.data,
        backgroundColor: colorFor(ds.color, i),
        borderWidth: 0,
      })),
    },
    typeOptions: {
      indexAxis: 'y',
      scales: {
        x: { ...valScale(pre, suf, ymin, ymax), grid: { color: COLOR_GRID, lineWidth: 0.6 } },
        y: { ...catScale(), grid: { display: false } },
      },
    },
  };
}

function cfgArea({ labels, datasets, pre, suf, ymin, ymax }) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((ds, i) => {
        const c = colorFor(ds.color, i);
        return {
          label: ds.label || `Series ${i + 1}`,
          data: ds.data,
          borderColor: c,
          backgroundColor: rgba(c, 0.18),
          borderWidth: 2,
          pointRadius: 0,
          fill: 'origin',
          tension: 0,
        };
      }),
    },
    typeOptions: { scales: { x: catScale(), y: valScale(pre, suf, ymin, ymax) } },
  };
}

function cfgScatter({ datasets, pre, suf, ymin, ymax }) {
  return {
    type: 'bubble',
    data: {
      datasets: datasets.map((ds, i) => {
        const c = colorFor(ds.color, i);
        return {
          label: ds.label || `Series ${i + 1}`,
          data: ds.data.map(p => ({ x: p[0], y: p[1], r: p[2] ? p[2] * 3 : 7 })),
          backgroundColor: rgba(c, 0.72),
          borderWidth: 0,
        };
      }),
    },
    typeOptions: {
      scales: {
        x: { ...catScale(), grid: { color: COLOR_GRID, lineWidth: 0.6 }, border: { display: false } },
        y: valScale(pre, suf, ymin, ymax),
      },
    },
  };
}

function cfgDonut({ datasets }) {
  const ds = datasets[0] || {};
  const cnames = ds.colors || PALETTE_ORDER;
  const colors = (ds.data || []).map((_, i) => colorFor(cnames[i] || '', i));
  return {
    type: 'doughnut',
    data: {
      labels: ds.labels || [],
      datasets: [{ data: ds.data || [], backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }],
    },
    typeOptions: { cutout: '52%' },
  };
}

function cfgPie({ datasets }) {
  const ds = datasets[0] || {};
  const cnames = ds.colors || PALETTE_ORDER;
  const colors = (ds.data || []).map((_, i) => colorFor(cnames[i] || '', i));
  return {
    type: 'pie',
    data: {
      labels: ds.labels || [],
      datasets: [{ data: ds.data || [], backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }],
    },
    typeOptions: {},
  };
}

function cfgPolarArea({ datasets }) {
  const ds = datasets[0] || {};
  const cnames = ds.colors || PALETTE_ORDER;
  const colors = (ds.data || []).map((_, i) => colorFor(cnames[i] || '', i));
  return {
    type: 'polarArea',
    data: {
      labels: ds.labels || [],
      datasets: [{ data: ds.data || [], backgroundColor: colors.map(c => rgba(c, 0.72)), borderWidth: 1, borderColor: '#ffffff' }],
    },
    typeOptions: {
      scales: {
        r: {
          grid: { color: COLOR_GRID, lineWidth: 0.6 },
          ticks: { color: COLOR_MUTED, font: { size: 10 }, backdropColor: 'transparent' },
        },
      },
    },
  };
}

function cfgRadar({ labels, datasets }) {
  return {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((ds, i) => {
        const c = colorFor(ds.color, i);
        return {
          label: ds.label || `Series ${i + 1}`,
          data: ds.data,
          borderColor: c,
          backgroundColor: rgba(c, 0.18),
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: c,
        };
      }),
    },
    typeOptions: {
      scales: {
        r: {
          grid: { color: COLOR_GRID, lineWidth: 0.6 },
          angleLines: { color: COLOR_GRID, lineWidth: 0.6 },
          pointLabels: { color: COLOR_MUTED, font: { size: 11 } },
          ticks: { color: COLOR_MUTED, font: { size: 10 }, backdropColor: 'transparent' },
        },
      },
    },
  };
}

// ── Main render function ─────────────────────────────────────────────────────
function render(cfg) {
  const {
    type = 'line',
    title = '',
    subtitle = '',
    source = '',
    labels = [],
    datasets = [],
    width = 900,
    height = 480,
    yMin: ymin = null,
    yMax: ymax = null,
    yPrefix: pre = '',
    ySuffix: suf = '',
  } = cfg;

  const BUILDERS = {
    line: cfgLine, bar: cfgBar, hbar: cfgHBar, area: cfgArea, scatter: cfgScatter,
    donut: cfgDonut, pie: cfgPie, polarArea: cfgPolarArea, radar: cfgRadar,
  };
  const { type: chartType, data, typeOptions } = (BUILDERS[type] ?? BUILDERS.line)({
    labels, datasets, pre, suf, ymin, ymax,
  });

  const hasHeader = !!(title || subtitle);
  const topPad = hasHeader ? (title && subtitle ? 56 : 38) : 12;
  const bottomPad = source ? 20 : 6;
  const isCircular = ['donut', 'pie', 'polarArea'].includes(type);
  const multiSeries = datasets.length > 1;

  const legendCfg = isCircular
    ? {
      display: true,
      position: 'right',
      labels: {
        color: COLOR_MUTED,
        font: { size: 10 },
        padding: 12,
        boxWidth: 12,
        boxHeight: 12,
        generateLabels: chart =>
          chart.data.labels.map((lbl, i) => ({
            text: `${lbl}  ${chart.data.datasets[0].data[i]}`,
            fillStyle: chart.data.datasets[0].backgroundColor[i],
            strokeStyle: '#ffffff',
            lineWidth: 1,
            hidden: false,
            index: i,
          })),
      },
    }
    : multiSeries
      ? {
        display: true,
        position: 'top',
        align: 'end',
        labels: { color: COLOR_MUTED, font: { size: 10 }, padding: 8, boxWidth: 10, boxHeight: 10 },
      }
      : { display: false };

  // Set up canvas with DOM-like properties Chart.js may touch
  const canvas = createCanvas(width, height);
  canvas.style = {};
  canvas.addEventListener = () => { };
  canvas.removeEventListener = () => { };
  canvas.getAttribute = (attr) => {
    if (attr === 'width') return canvas.width;
    if (attr === 'height') return canvas.height;
    return null;
  };
  canvas.setAttribute = (attr, value) => {
    if (attr === 'width') canvas.width = Number(value);
    if (attr === 'height') canvas.height = Number(value);
  };

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: chartType,
    data,
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      ...typeOptions,
      layout: {
        padding: { top: topPad, bottom: bottomPad, left: 8, right: 8 },
      },
      plugins: {
        legend: legendCfg,
        headerFooter: { title, subtitle, source },
      },
    },
  });

  return canvas.toBuffer('image/png');
}

// ── CLI entry point ──────────────────────────────────────────────────────────
const [, , arg1, outPath] = process.argv;

const HELP_TEXT = `
Beautiful Chart Renderer — Generate PNG charts from JSON config

USAGE
  bunx -y beautiful-chartsjs <config.json> [output.png]
  bunx -y beautiful-chartsjs --help | -h

ARGUMENTS
  config.json   Path to JSON configuration file (required)
  output.png    Output PNG file path (optional)
                - If provided: saves PNG to file
                - If omitted: prints base64 JSON to stdout

CHART TYPES
  line        Line chart with points
  bar         Vertical bar chart
  hbar        Horizontal bar chart
  area        Filled area chart
  scatter     Bubble/scatter chart
  donut       Donut chart
  pie         Pie chart
  polarArea   Polar area chart
  radar       Radar chart

CONFIG OPTIONS
  type        Chart type (default: "line")
  title       Chart title
  subtitle    Chart subtitle
  source      Source attribution (shown at bottom)
  labels      X-axis labels (array)
  datasets    Array of { label, data, color, fill? }
  width       Canvas width in px (default: 900)
  height      Canvas height in px (default: 480)
  yMin        Y-axis minimum value
  yMax        Y-axis maximum value
  yPrefix     Y-axis value prefix (e.g., "$")
  ySuffix     Y-axis value suffix (e.g., "%")

COLORS
  blue, red, teal, amber, purple, gray

EXAMPLE
  bunx -y beautiful-chartsjs chart.json output.png
`;

if (arg1 === '--help' || arg1 === '-h') {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (!arg1) {
  console.error('Usage: bunx -y beautiful-chartsjs config.json [output.png]');
  console.error('Run with --help for more information.');
  process.exit(1);
}

const cfgPath = arg1;

let cfg;
try {
  cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
} catch (e) {
  console.error(`Error reading config: ${e.message}`);
  process.exit(1);
}

const png = render(cfg);

if (outPath) {
  writeFileSync(outPath, png);
  console.error(`saved → ${outPath}`);
} else {
  process.stdout.write(
    JSON.stringify({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: png.toString('base64') },
    }) + '\n',
  );
}
