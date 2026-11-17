// Draws stage0-plan.html (a labeled top-down plan) straight from site.json.
// Run:  node tools/make-plan.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'site.json'), 'utf8'));

const S = 17;                     // pixels per foot
const X0 = -26, Y0 = -18, X1 = 47, Y1 = 87;
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

// --- existing house (backdrop, estimated) ---------------------------------
const hs = site.existingHouse;
rect([hs.body.outline[0][0], 78], [hs.body.outline[1][0], 86], 'class="house"');
box(hs.wing.outline, 'class="house"');
box(hs.backPorch.outline, 'class="hporch"');
text(15, 74.5, 'HOUSE BACK PORCH', 'lbl', 'text-anchor="middle"');
text(15, 75.7, 'estimated from photos', 'note', 'text-anchor="middle"');
text(8, 82.5, 'EXISTING HOUSE (continues) — backdrop only, estimated from photos', 'lbl', 'text-anchor="middle"');
text(-11, 74.5, 'HOUSE WING', 'lbl', 'text-anchor="middle"');

// --- deck, pool -----------------------------------------------------------
box(site.poolDeck.outline, 'class="deck"');
box(site.pool.outline, 'class="pool"');
box(site.pool.steps.outline, 'class="steps"');
text(15, 60.4, 'STEPS', 'note', 'text-anchor="middle"');
text(15, 44, 'POOL', 'big', 'text-anchor="middle"');
text(15, 45.5, `${ftIn(16)} × ${ftIn(32)}`, 'lbl', 'text-anchor="middle"');
text(15, 34, `deep end ${ftIn(site.pool.depthDeep)} (assumed)`, 'note', 'text-anchor="middle"');
text(15, 56.5, `shallow end ${ftIn(site.pool.depthShallow)} (assumed)`, 'note', 'text-anchor="middle"');
text(-0.5, 67.5, 'CONCRETE POOL DECK', 'lbl');
text(-0.5, 68.7, `${ftIn(34)} × ${ftIn(44)}`, 'note');
dim([7, 51], [23, 51], ftIn(16));
dim([20.5, 30], [20.5, 62], ftIn(32));
dim([-1, 40], [7, 40], ftIn(8));
dim([23, 40], [33, 40], ftIn(10));
dim([26.5, 26], [26.5, 30], ftIn(4));
dim([26.5, 62], [26.5, 70], ftIn(8));
dim([41.5, 26], [41.5, 70], `${ftIn(44)} deck`);

// --- fence (proposed) -----------------------------------------------------
for (const run of site.fence.runs)
  add(`<polyline points="${run.map((p) => `${px(p[0])},${py(p[1])}`).join(' ')}" class="fence"/>`);
for (const g of site.fence.gates) {
  rect([g.at[0] - 0.3, g.at[1] - 2], [g.at[0] + 0.3, g.at[1] + 2], 'class="gate"');
}
text(-1.8, 48.3, 'GATE', 'note', 'text-anchor="end"');
text(33.8, 12.3, 'GATE', 'note');
text(-1.8, 58, `FENCE · ${ftIn(site.fence.height)} high`, 'note', 'text-anchor="end"');

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
const part = ph.enclosedBand.walls.find((w) => w.id === 'partition');
rect([part.from[0] - t / 2, 0], [part.from[0] + t / 2, 8], 'class="wall"');
for (const r of ph.enclosedBand.rooms) {
  rect(r.interior[0], r.interior[1], 'class="room"');
  const [x, y] = r.interior[0];
  text(x + 0.7, y + 1.7, r.label.toUpperCase(), 'lbl');
  if (r.clear) text(x + 0.7, y + 2.8, `${ftIn(r.clear[0])} × ${ftIn(r.clear[1])} clear`, 'note');
  else { text(x + 0.7, y + 2.8, `${r.nominal[0]}' × ${r.nominal[1]}' nominal`, 'note'); text(x + 0.7, y + 3.8, `(${r.clearAsDrawn[0]}' × ${r.clearAsDrawn[1]}' clear as drawn)`, 'note'); }
}

// --- rinse station (removed in Rev. J; drawn only if site.json has one) -----
if (site.rinseStation) {
  box(site.rinseStation.pad, 'class="conc"');
  text(35.5, 4.6, 'RINSE STATION', 'lbl');
}

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
  const name = d.label.replace(/ \(.*\)/, '').toUpperCase();
  if (d.wall === 'west' || d.wall === 'east') {
    const x = d.wall === 'west' ? -0.8 : d.from[0] + 0.8, anchor = d.wall === 'west' ? 'text-anchor="end"' : '';
    text(x, 3.6, name, 'lbl', anchor);
    text(x, 4.7, `${ftIn(d.width)} wide × ${ftIn(d.height)} high`, 'note', anchor);
  } else if (d.wall === 'north') text(d.to[0] + 0.6, -0.8, `${name} · ${ftIn(d.width)}`, 'note');
  else text((d.from[0] + d.to[0]) / 2, 9.3, `${name} · ${ftIn(d.width)}`, 'note', 'text-anchor="middle"');
}
for (const w of ph.windows) {
  rect([w.from[0] - 0.2, w.from[1]], [w.to[0] + 0.2, w.to[1]], 'class="win"');
  const room = ph.enclosedBand.rooms.find((r) => r.id === 'bath');
  text(room.interior[0][0] + 0.7, room.interior[1][1] - 0.6, `HIGH WINDOW · ${ftIn(w.width)}`, 'note');
}

// --- rainwater harvesting -------------------------------------------------
if (site.rainwater) {
  const rw = site.rainwater, tk = rw.tank, [tx0, tz0] = tk.outline[0], [tx1, tz1] = tk.outline[2];
  box(tk.outline, 'class="tank"');
  for (const [x, z] of tk.accessLids) add(`<circle cx="${px(x)}" cy="${py(z)}" r="${S}" class="lid"/>`);
  for (const d of rw.downspouts) add(`<circle cx="${px(d.at[0])}" cy="${py(d.at[1])}" r="5" class="spout"/>`);
  const cx = (tx0 + tx1) / 2;
  text(cx, tz1 + 1.3, 'RAINWATER TANK', 'lbl', 'text-anchor="middle"');
  text(cx, tz1 + 2.4, `underground · ${tk.capacityGallons.toLocaleString('en-US')} gallons`, 'note', 'text-anchor="middle"');
  text(cx, tz1 + 3.5, `${ftIn(tk.size[0])} × ${ftIn(tk.size[1])} (placeholder)`, 'note', 'text-anchor="middle"');
}

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
text(33.6, 24.6, `Roof edge (dashed):`, 'note');
text(33.6, 25.6, `hip, 8:12, ${ftIn(2)} overhang`, 'note');
text(17.4, 13.3, `ridge ${ftIn(ph.roof.ridgeHeight)}`, 'note');

// --- dimensions -----------------------------------------------------------
dim([0, -11.6], [10, -11.6], ftIn(10)); dim([10, -11.6], [20, -11.6], ftIn(10)); dim([20, -11.6], [30, -11.6], ftIn(10));
dim([0, -13.6], [30, -13.6], `${ftIn(30)} pool house`);

dim([-13, -10], [-13, 0], `${ftIn(10)} lean-to`);
dim([-13, 0], [-13, 8], ftIn(8));
dim([-13, 8], [-13, 26], `${ftIn(18)} porch`);
dim([-15, -10], [-15, 26], `${ftIn(36)} overall`);
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
  .deck{fill:#DAD7CC;stroke:#1E2328;stroke-width:1.5}.pool{fill:#8CC4DA;stroke:#1E2328;stroke-width:2}.steps{fill:#B9DCE8;stroke:#4A7FA0;stroke-width:1}.house{fill:#EFEDE4;stroke:#5C6570;stroke-width:1.5;stroke-dasharray:8 5}.hporch{fill:#C99A84;stroke:#5C6570;stroke-width:1.5}.tank{fill:#DCE9EF;fill-opacity:.6;stroke:#4A7FA0;stroke-width:1.5;stroke-dasharray:8 5}.lid{fill:#4A7FA0}.spout{fill:#1f6f8b;stroke:#fff;stroke-width:1.5}.fence{fill:none;stroke:#2E7D4F;stroke-width:2.5;stroke-dasharray:3 4}.gate{fill:#2E7D4F}
  .dim{stroke:#5C6570;stroke-width:1;fill:none}
  text{fill:#1E2328}.lbl{font-size:12px;font-weight:700;letter-spacing:.06em}
  .big{font-size:16px;font-weight:700;letter-spacing:.1em}
  .note{font-size:11px;fill:#5C6570}.dimtxt{font-size:12px;fill:#1E2328;font-weight:600}
  table{border-collapse:collapse;margin-top:16px;font-size:14px}td{padding:5px 18px 5px 0;border-bottom:1px solid #B4BAB6}
  .key span{display:inline-block;width:14px;height:14px;vertical-align:-2px;margin:0 6px 0 16px;border:1px solid #1E2328}
</style></head><body>
<h1>Top-down plan, Rev. J (drawn from site.json)</h1>
<p>Source: Pool House Schematic, Rev. I. Rev. J: the Rev. I drawing with Pam's changes (rooms swapped, outdoor shower removed, rainwater tank added). House and fence are estimates.</p>
<div class="sheet"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Top-down site plan with dimensions">
${out.join('\n')}
</svg></div>
<p class="key" style="margin-top:12px"><span style="background:#C9922F;margin-left:0"></span>door<span style="background:#7FB2C8"></span>window<span style="background:#3B3936"></span>column / post<span style="background:#9C5B4A"></span>brick fireplace<span style="background:#CFCBC0"></span>gravel<span style="background:#1f6f8b;border-radius:50%"></span>downspout<span style="background:#DCE9EF;border:1.5px dashed #4A7FA0"></span>underground tank</p>
<table><tr><td><b>Heights above the slab</b></td><td></td></tr>${heights}</table>
</body></html>`;

writeFileSync(join(root, 'stage0-plan.html'), html);
console.log('wrote stage0-plan.html');
