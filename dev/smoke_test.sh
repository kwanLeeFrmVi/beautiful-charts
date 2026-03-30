#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/dev/test_configs.json"

for type in bar hbar area scatter donut; do
  echo -n "Testing $type... "
  bun -e "
    import cfg from '$CFG' assert { type: 'json' };
    import fs from 'node:fs';
    fs.writeFileSync('/tmp/test_${type}_input.json', JSON.stringify(cfg['$type']));
  "
  bun "$ROOT/render_chart.js" "/tmp/test_${type}_input.json" "/tmp/test_${type}.png"
  echo "OK → /tmp/test_${type}.png"
done
echo "All tests passed."
