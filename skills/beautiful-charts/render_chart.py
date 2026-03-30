# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "matplotlib>=3.7",
#   "numpy>=1.24",
# ]
# ///
"""
render_chart.py — Beautiful Chart Renderer
Usage: uv run render_chart.py chart_config.json [output.png]

If output path is given  → saves PNG file to that path
If output path is absent → prints base64 JSON block to stdout so Claude Code
                           renders the image inline in the chat automatically
"""
import sys, json, io, base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches
import numpy as np

# ── Design tokens ─────────────────────────────────────────────────────────────
PALETTE = {
    'blue':   '#185FA5',
    'red':    '#E24B4A',
    'teal':   '#1D9E75',
    'amber':  '#BA7517',
    'purple': '#534AB7',
    'gray':   '#888780',
}
PALETTE_ORDER = list(PALETTE.keys())

FONT        = 'Liberation Sans'
COLOR_TEXT  = '#111111'
COLOR_MUTED = '#999999'
COLOR_FAINT = '#bbbbbb'
COLOR_GRID  = '#e8e8e8'
COLOR_SPINE = '#e0e0e0'

plt.rcParams.update({
    'font.family':        FONT,
    'font.size':          11,
    'axes.spines.top':    False,
    'axes.spines.right':  False,
    'axes.spines.left':   False,
    'axes.spines.bottom': True,
    'axes.grid':          True,
    'axes.axisbelow':     True,
    'grid.alpha':         1.0,
    'grid.color':         COLOR_GRID,
    'grid.linewidth':     0.6,
    'xtick.bottom':       False,
    'ytick.left':         False,
    'xtick.major.pad':    6,
    'ytick.major.pad':    6,
})


def color_for(name, idx=0):
    if name in PALETTE:
        return PALETTE[name]
    return PALETTE[PALETTE_ORDER[idx % len(PALETTE_ORDER)]]


def base_ax(fig, ax):
    fig.patch.set_alpha(0)
    ax.set_facecolor('none')
    ax.spines['bottom'].set_color(COLOR_SPINE)
    ax.spines['bottom'].set_linewidth(0.7)
    ax.tick_params(colors=COLOR_MUTED, labelsize=10.5)


def add_labels(fig, title, subtitle, source):
    y = 0.98
    if title:
        fig.text(0.0, y, title, ha='left', va='top', transform=fig.transFigure,
                 fontsize=15, fontweight='medium', color=COLOR_TEXT, font=FONT)
        y -= 0.075
    if subtitle:
        fig.text(0.0, y, subtitle, ha='left', va='top', transform=fig.transFigure,
                 fontsize=11, color=COLOR_MUTED, font=FONT)
    if source:
        fig.text(0.0, 0.0, source, ha='left', va='bottom', transform=fig.transFigure,
                 fontsize=9, color=COLOR_FAINT, font=FONT)


def fmt_axis(ax, y_prefix, y_suffix, ymin, ymax, x_labels=None, horizontal=False):
    fmt = mticker.FuncFormatter(lambda v, _: f'{y_prefix}{v:g}{y_suffix}')
    if horizontal:
        ax.xaxis.set_major_formatter(fmt)
    else:
        ax.yaxis.set_major_formatter(fmt)
        if x_labels is not None:
            ax.set_xticks(range(len(x_labels)))
            ax.set_xticklabels(x_labels, color=COLOR_MUTED)
    if ymin is not None:
        if horizontal: ax.set_xlim(left=ymin)
        else:          ax.set_ylim(bottom=ymin)
    if ymax is not None:
        if horizontal: ax.set_xlim(right=ymax)
        else:          ax.set_ylim(top=ymax)


def line_legend(ax, datasets):
    handles = [
        Line2D([0],[0], color=color_for(ds.get('color',''), i),
               linewidth=2, marker='o', markersize=5,
               label=ds.get('label', f'Series {i+1}'))
        for i, ds in enumerate(datasets)
    ]
    ax.legend(handles=handles, frameon=False, labelcolor=COLOR_MUTED,
              fontsize=10, loc='upper right',
              handlelength=1.6, borderpad=0, labelspacing=0.35)


def patch_legend(ax_or_fig, handles, loc='upper right', anchor=None):
    kw = dict(frameon=False, labelcolor=COLOR_MUTED, fontsize=10,
              handlelength=1.0, borderpad=0, labelspacing=0.4)
    if anchor:
        ax_or_fig.legend(handles=handles, loc=loc, bbox_to_anchor=anchor, **kw)
    else:
        ax_or_fig.legend(handles=handles, loc=loc, **kw)
    leg = ax_or_fig.get_legend() if hasattr(ax_or_fig, 'get_legend') else None
    if leg:
        for patch in leg.get_patches():
            patch.set_height(9); patch.set_width(9)


def draw_line(fig, ax, labels, datasets):
    xi = range(len(labels))
    for i, ds in enumerate(datasets):
        c = color_for(ds.get('color',''), i)
        ax.plot(xi, ds['data'], color=c, linewidth=2.2,
                marker='o', markersize=5.5, markerfacecolor=c,
                markeredgewidth=0, zorder=3, solid_capstyle='round')
        if ds.get('fill', False):
            base = min(ds['data']) - (max(ds['data']) - min(ds['data'])) * 0.1
            ax.fill_between(xi, ds['data'], base, alpha=0.06, color=c)
    line_legend(ax, datasets)


def draw_bar(fig, ax, labels, datasets):
    n = len(datasets)
    x = np.arange(len(labels))
    w = 0.65 / max(n, 1)
    handles = []
    for i, ds in enumerate(datasets):
        c = color_for(ds.get('color',''), i)
        offset = (i - (n-1)/2) * w
        ax.bar(x + offset, ds['data'], width=w*0.88, color=c, zorder=3, linewidth=0)
        handles.append(mpatches.Patch(color=c, label=ds.get('label', f'Series {i+1}')))
    ax.set_xticks(x)
    ax.set_xticklabels(labels, color=COLOR_MUTED)
    if len(handles) > 1:
        patch_legend(ax, handles)


def draw_hbar(fig, ax, labels, datasets):
    n = len(datasets)
    y = np.arange(len(labels))
    w = 0.65 / max(n, 1)
    handles = []
    for i, ds in enumerate(datasets):
        c = color_for(ds.get('color',''), i)
        offset = (i - (n-1)/2) * w
        ax.barh(y + offset, ds['data'], height=w*0.88, color=c, zorder=3, linewidth=0)
        handles.append(mpatches.Patch(color=c, label=ds.get('label', f'Series {i+1}')))
    ax.set_yticks(y)
    ax.set_yticklabels(labels, color=COLOR_MUTED)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_color(COLOR_SPINE)
    ax.spines['left'].set_linewidth(0.7)
    ax.xaxis.grid(True, color=COLOR_GRID, linewidth=0.6)
    ax.yaxis.grid(False)
    if len(handles) > 1:
        patch_legend(ax, handles)


def draw_area(fig, ax, labels, datasets):
    xi = range(len(labels))
    handles = []
    for i, ds in enumerate(datasets):
        c = color_for(ds.get('color',''), i)
        ax.fill_between(xi, ds['data'], alpha=0.18, color=c)
        ax.plot(xi, ds['data'], color=c, linewidth=2, zorder=3)
        handles.append(mpatches.Patch(color=c, label=ds.get('label', f'Series {i+1}')))
    if len(handles) > 1:
        patch_legend(ax, handles)


def draw_scatter(fig, ax, labels, datasets):
    handles = []
    for i, ds in enumerate(datasets):
        c = color_for(ds.get('color',''), i)
        pts = ds['data']
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        sz = [p[2]*12 if len(p) > 2 else 55 for p in pts]
        ax.scatter(xs, ys, s=sz, color=c, alpha=0.72, zorder=3, linewidths=0)
        handles.append(mpatches.Patch(color=c, label=ds.get('label', f'Series {i+1}')))
    if len(handles) > 1:
        patch_legend(ax, handles)


def draw_donut(fig, ax, labels, datasets):
    ax.axis('off')
    ds      = datasets[0]
    data    = ds['data']
    dlabels = ds.get('labels', labels)
    cnames  = ds.get('colors', PALETTE_ORDER)
    colors  = [color_for(cnames[i] if i < len(cnames) else '', i) for i in range(len(data))]
    pie_ax  = fig.add_axes([0.08, 0.08, 0.56, 0.84])
    pie_ax.set_facecolor('none')
    pie_ax.pie(data, colors=colors, startangle=90,
               wedgeprops={'linewidth': 2, 'edgecolor': 'white', 'width': 0.52})
    handles = [mpatches.Patch(color=colors[i], label=f'{dlabels[i]}  {data[i]}')
               for i in range(len(data))]
    patch_legend(fig, handles, loc='center right', anchor=(0.98, 0.5))


# ── Main renderer ─────────────────────────────────────────────────────────────

def render(cfg):
    ctype    = cfg.get('type', 'line')
    title    = cfg.get('title', '')
    subtitle = cfg.get('subtitle', '')
    source   = cfg.get('source', '')
    labels   = cfg.get('labels', [])
    datasets = cfg.get('datasets', [])
    width    = cfg.get('width',  900) / 96
    height   = cfg.get('height', 480) / 96
    ymin     = cfg.get('yMin', None)
    ymax     = cfg.get('yMax', None)
    y_prefix = cfg.get('yPrefix', '')
    y_suffix = cfg.get('ySuffix', '')

    fig, ax = plt.subplots(figsize=(width, height), dpi=150)
    base_ax(fig, ax)

    draw = {
        'line':    draw_line,
        'bar':     draw_bar,
        'hbar':    draw_hbar,
        'area':    draw_area,
        'scatter': draw_scatter,
        'donut':   draw_donut,
    }
    draw.get(ctype, draw_line)(fig, ax, labels, datasets)

    is_hbar = (ctype == 'hbar')
    fmt_axis(ax, y_prefix, y_suffix, ymin, ymax,
             x_labels=(labels if ctype not in ('hbar','scatter','donut') else None),
             horizontal=is_hbar)

    has_header = bool(title or subtitle)
    top_pad    = 0.15 if has_header else 0.05
    bot_pad    = 0.10 if source     else 0.06
    plt.subplots_adjust(left=0.07, right=0.97, top=1-top_pad, bottom=bot_pad)
    add_labels(fig, title, subtitle, source)

    buf = io.BytesIO()
    plt.savefig(buf, transparent=True, dpi=150,
                format='png', bbox_inches='tight',
                facecolor='none', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf.read()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: uv run render_chart.py config.json [output.png]')
        sys.exit(1)

    with open(sys.argv[1]) as f:
        cfg = json.load(f)

    png_bytes = render(cfg)

    if len(sys.argv) >= 3:
        # Save to file
        outfile = sys.argv[2]
        with open(outfile, 'wb') as f:
            f.write(png_bytes)
        print(f'saved → {outfile}', file=sys.stderr)
    else:
        # Print base64 JSON block to stdout — Claude Code renders this inline
        b64 = base64.b64encode(png_bytes).decode()
        print(json.dumps({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": b64
            }
        }))
