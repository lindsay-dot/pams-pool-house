// Draws stage0-plan.html (a labeled top-down plan) straight from site.json.
// Run:  node tools/make-plan.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'site.json'), 'utf8'));

const S = 17;                     // pixels per foot
const X0 = -13, Y0 = -15, X1 = 47, Y1 = 52;
const px = (x) => (x - X0) * S;
const py = (y) => (y - Y0) * S;
const W = (X1 - X0) * S, H = (Y1 - Y0) * S;

export function ftIn(ft) {
  let inches = Math.round(ft * 12);
  const f = Math.floor(inches / 12);
  inches -= f * 12;
  return `${f}' ${inches}"`;
}

const out = [];
const add = (s) => out.push(s);
const rect = (a, b, attrs) =>
  add(`<rect x="${px(Math.min(a[0], b[0]))}" y="${py(Math.min(a[1], b[1]))}" width="${Math.abs(b[0] - a[0]) * S}" height="${Math.abs(b[1] - a[1]) * S}" ${attrs}/>`);
const box = (outline, attrs) => rect(outline[0], outline[2], attrs);
const text = (x, y, s, cls = 'lbl', extra = '') =>
  add(`<text x="${px(x)}" y="${py(y)}" class="${cls}" ${extra}>${s}</text>`);
const line = (a, b, attrs) =>
  add(`<line x1="${px(a[0])}" y1="${py(a[1])}" x2="${px(b[0])}" y2="${py(b[1])}" ${attrs}/>`);

// dimension line between two points (horizontal or vertical), offset already applied by caller
function dim(a, b, label) {
  const horiz = a[1] === b[1];
  line(a, b, 'class="dim"');
  const t = 0.35;
  for (const p of [a, b]) {
    if (horiz) line([p[0], p[1] - t], [p[0], p[1] + t], 'class="dim"');
    else line([p[0] - t, p[1]], [p[0] + t, p[1]], 'class="dim"');
  }
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  if (horiz) text(mx, my - 0.3, label, 'dimtxt', 'text-anchor="middle"');
  else add(`<text x="${px(mx) - 6}" y="${py(my)}" class="dimtxt" text-anchor="middle" transform="rotate(-90 ${px(mx) - 6} ${py(my)})">${label}</text>`);
}

const ph = site.poolHouse;

// --- unknown pool / deck area -------------------------------------------
rect([-11, 36.5], [45, 50.5], 'class="unknown"');
text(18, 42, 'POOL + POOL DECK', 'big', 'text-anchor="middle"');
text(18, 43.8, 'Not on the drawings — shape, size, depth and distance from the porch needed', 'note', 'text-anchor="middle"');
text(18, 45.3, '(lawn / back property and the existing house position are also not on the drawings)', 'note', 'text-anchor="middle"');

// --- lean-to --------------------------------------------------------------
box(site.leanTo.outline, 'class="gravel"');
text(15, -5.6, 'EQUIPMENT LEAN-TO', 'lbl', 'text-anchor="middle"');
text(15, -4.5, `${ftIn(site.leanTo.size[0])} × ${ftIn(site.leanTo.size[1])} · gravel · metal roof 3:12`, 'note', 'text-anchor="middle"');
for (const c of site.leanTo.posts.centers) rect([c[0] - 0.42, c[1] - 0.42], [c[0] + 0.42, c[1] + 0.42], 'class="col"');

// --- slab, porch ----------------------------------------------------------
box(ph.porch.outline, 'class="porch"');
box(ph.slab.outline, 'class="slab"');

// --- band walls -----------------------------------------------------------
const t = ph.enclosedBand.wallThickness;
rect([0, 0], [30, t], 'class="wall"');
rect([0, 0], [t, 8], 'class="wall"');
rect([30 - t, 0], [30, 8], 'class="wall"');
rect([0, 8 - t], [30, 8], 'class="wall"');
rect([20, 0], [20 + t, 8], 'class="wall"');
for (const r of ph.enclosedBand.rooms) rect(r.interior[0], r.interior[1], 'class="room"');
text(1.2, 2.2, 'STORAGE + EQUIPMENT', 'lbl');
text(1.2, 3.3, `${ftIn(19.5)} × ${ftIn(7)} clear`, 'note');
text(21.2, 2.2, 'BATH + CHANGING', 'lbl');
text(21.2, 3.3, `10' × 8' nominal`, 'note');
text(21.2, 4.3, `(9' × 7' clear as drawn)`, 'note');

// --- rinse station --------------------------------------------------------
box(site.rinseStation.pad, 'class="conc"');
text(35.5, 4.6, 'RINSE STATION', 'lbl');
text(35.5, 5.7, `${ftIn(5)} × ${ftIn(4)} pad`, 'note');

// --- fireplace ------------------------------------------------------------
box(ph.fireplace.footprint, 'class="brick"');
rect([12.5, 8.1], [17.5, 10], 'class="firebox"');
text(15, 11.3, `FIREPLACE · ${ftIn(10)} wide · ${ftIn(3.5)} deep`, 'lbl', 'text-anchor="middle"');

// --- doors / window -------------------------------------------------------
for (const d of ph.doors) {
  const vertical = d.from[0] === d.to[0];
  const a = vertical ? [d.from[0] - 0.35, d.from[1]] : [d.from[0], d.from[1] - 0.35];
  const b = vertical ? [d.to[0] + 0.35, d.to[1]] : [d.to[0], d.to[1] + 0.35];
  rect(a, b, 'class="door"');
}
text(-0.8, 3.6, 'GARAGE DOOR', 'lbl', 'text-anchor="end"');
text(-0.8, 4.7, `${ftIn(6)} wide × ${ftIn(7)} high`, 'note', 'text-anchor="end"');
text(12, -0.8, `SERVICE DOOR · ${ftIn(2.83)}`, 'note');
text(1.2, 9.3, `STORAGE DOOR · ${ftIn(3)}`, 'note');
text(28.8, 9.3, `BATH DOOR · ${ftIn(3)}`, 'note', 'text-anchor="end"');
for (const w of ph.windows) rect([w.from[0] - 0.2, w.from[1]], [w.to[0] + 0.2, w.to[1]], 'class="win"');
text(30.6, 1.2, `HIGH WINDOW · ${ftIn(6.3)}`, 'note');

// --- kitchen --------------------------------------------------------------
box(site.outdoorKitchen.asDrawn.footprint, 'class="kitchen"');
text(3.2, 18, 'OUTDOOR KITCHEN', 'lbl');
text(3.2, 19.1, `${ftIn(12.5)} run × ${ftIn(2.5)} deep`, 'note');

// --- seating guide --------------------------------------------------------
box(site.seatingArea.asDrawn, 'class="guide"');
text(15, 22.3, 'COVERED PORCH', 'big', 'text-anchor="middle"');
text(15, 23.6, `${ftIn(30)} × ${ftIn(18)} · open on three sides`, 'note', 'text-anchor="middle"');

// --- columns --------------------------------------------------------------
for (const c of ph.columns.centers) rect([c[0] - 0.42, c[1] - 0.42], [c[0] + 0.42, c[1] + 0.42], 'class="col"');

// --- roof -----------------------------------------------------------------
box(ph.roof.eaveOutline, 'class="roof"');
const r0 = ph.roof.ridge.from, r1 = ph.roof.ridge.to, e = ph.roof.eaveOutline;
line(r0, r1, 'class="roof"');
line(e[0], r0, 'class="roof"'); line(e[3], r0, 'class="roof"');
line(e[1], r1, 'class="roof"'); line(e[2], r1, 'class="roof"');
text(-1.8, 28.9, `Roof edge (dashed): hip roof, 8:12, ${ftIn(2)} overhang all around`, 'note');
text(17.4, 13.3, `ridge ${ftIn(ph.roof.ridgeHeight)}`, 'note');

// --- dimensions -----------------------------------------------------------
dim([0, 31.2], [10, 31.2], ftIn(10)); dim([10, 31.2], [20, 31.2], ftIn(10)); dim([20, 31.2], [30, 31.2], ftIn(10));
dim([0, 33], [30, 33], `${ftIn(30)} pool house`);
dim([0, 34.8], [35, 34.8], `${ftIn(35)} overall`);
dim([-9.5, -10], [-9.5, 0], `${ftIn(10)} lean-to`);
dim([-9.5, 0], [-9.5, 8], ftIn(8));
dim([-9.5, 8], [-9.5, 26], `${ftIn(18)} porch`);
dim([-11.5, -10], [-11.5, 26], `${ftIn(36)} overall`);
dim([41.5, 0], [41.5, 26], `${ftIn(26)} pool house`);
dim([38.5, 8], [38.5, 17], ftIn(9)); dim([38.5, 17], [38.5, 26], ftIn(9));
dim([10, 5.6], [20, 5.6], ftIn(10));

// --- compass --------------------------------------------------------------
add(`<g transform="translate(${px(42.5)} ${py(-11)})"><circle r="26" class="dim"/><path d="M0,-22 L7,8 L0,2 L-7,8 Z" fill="#1E2328"/><text y="-30" text-anchor="middle" class="lbl">N ?</text></g>`);
text(42.5, -8.2, 'compass to confirm', 'note', 'text-anchor="middle"');

const heights = [
  ['Roof ridge', ph.roof.ridgeHeight], ['Wall top / beam', ph.roof.plateHeight], ['Roof edge (eave)', ph.roof.eaveHeight],
  ['Chimney top (from sketch)', ph.fireplace.chimney.topHeight], ['Lean-to roof high / low (from sketch)', null],
].map(([k, v]) => `<tr><td>${k}</td><td>${v == null ? `${ftIn(site.leanTo.roof.highSideHeight)} / ${ftIn(site.leanTo.roof.lowSideHeight)}` : ftIn(v)}</td></tr>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stage 0 Site Plan</title>
<style>
  body{margin:0;padding:20px;background:#E9EBE8;color:#1E2328;font-family:"Helvetica Neue",Arial,sans-serif}
  h1{font-size:20px;margin:0 0 4px} p{margin:0 0 14px;color:#5C6570;font-size:14px}
  .sheet{background:#F5F6F4;border:1px solid #B4BAB6;padding:8px;max-width:1100px}
  svg{display:block;width:100%;height:auto}
  .slab{fill:none;stroke:#1E2328;stroke-width:2.5}
  .porch{fill:#E4E2D8}.room{fill:#FAFAF8}.wall{fill:#1E2328}
  .gravel{fill:#CFCBC0;stroke:#5C6570;stroke-width:1}
  .conc{fill:#CBC9C0;stroke:#1E2328;stroke-width:1.5}
  .brick{fill:#9C5B4A;stroke:#1E2328;stroke-width:1.5}.firebox{fill:#241F1C}
  .door{fill:#C9922F;stroke:#1E2328;stroke-width:1}
  .win{fill:#7FB2C8;stroke:#1E2328;stroke-width:1}
  .kitchen{fill:#D9D6C9;stroke:#1E2328;stroke-width:1.5}
  .col{fill:#3B3936;stroke:#1E2328;stroke-width:1}
  .roof{fill:none;stroke:#804A3C;stroke-width:1.2;stroke-dasharray:7 5}
  .guide{fill:none;stroke:#C9922F;stroke-width:1;stroke-dasharray:4 4}
  .unknown{fill:#DCE9EF;stroke:#4A7FA0;stroke-width:2;stroke-dasharray:10 7}
  .dim{stroke:#5C6570;stroke-width:1;fill:none}
  text{fill:#1E2328}.lbl{font-size:12px;font-weight:700;letter-spacing:.06em}
  .big{font-size:16px;font-weight:700;letter-spacing:.1em}
  .note{font-size:11px;fill:#5C6570}.dimtxt{font-size:12px;fill:#1E2328;font-weight:600}
  table{border-collapse:collapse;margin-top:16px;font-size:14px}td{padding:5px 18px 5px 0;border-bottom:1px solid #B4BAB6}
  .key span{display:inline-block;width:14px;height:14px;vertical-align:-2px;margin:0 6px 0 16px;border:1px solid #1E2328}
</style></head><body>
<h1>Stage 0 — Top-down plan (drawn from site.json)</h1>
<p>Source: Pool House Schematic, Rev. I. Pool side is at the bottom. Blue dashed area = not on the drawings.</p>
<div class="sheet"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Top-down site plan with dimensions">
${out.join('\n')}
</svg></div>
<p class="key" style="margin-top:12px"><span style="background:#C9922F;margin-left:0"></span>door<span style="background:#7FB2C8"></span>window<span style="background:#3B3936"></span>column / post<span style="background:#9C5B4A"></span>brick fireplace<span style="background:#CFCBC0"></span>gravel</p>
<table><tr><td><b>Heights above the slab</b></td><td></td></tr>${heights}</table>
</body></html>`;

writeFileSync(join(root, 'stage0-plan.html'), html);
console.log('wrote stage0-plan.html');
