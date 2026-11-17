// Outdoor kitchen: four shapes, real US appliance sizes, 36" counter and 42" bar.
// The kitchen always sits where the drawing puts it, on the left side of the porch.
import * as THREE from 'three';
import { boxAt } from './build/helpers.js';
import { place, rectPoly } from './geom2d.js';

export const KITCHEN_LAYOUTS = [
  { id: 'straight', name: 'Straight (as drawn)' },
  { id: 'l', name: 'L-Shape' },
  { id: 'u', name: 'U-Shape' },
  { id: 'island', name: 'Straight + Island with Bar Seating' },
];

const C = (id, name, hex, kind) => ({ id, name, hex, kind });
export const COUNTERS = [
  C('granite-black', 'Black Pearl Granite', '#2f3133', 'granite'), C('granite-gold', 'Santa Cecilia Granite', '#c9b58c', 'granite'), C('granite-gray', 'Steel Gray Granite', '#6f7377', 'granite'),
  C('quartzite-white', 'White Quartzite', '#e9e7e1', 'quartzite'), C('quartzite-taj', 'Taj Mahal Quartzite', '#e2d6c0', 'quartzite'),
  C('concrete-natural', 'Natural Concrete', '#b9b7b0', 'concrete'), C('concrete-charcoal', 'Charcoal Concrete', '#5b5d5f', 'concrete'),
  C('tile-white', 'White Tile', '#eeeeea', 'tile'), C('tile-terra', 'Terra Cotta Tile', '#b66f4f', 'tile'), C('tile-blue', 'Blue Tile', '#3f6f9c', 'tile'),
];
export const BASES = [
  C('stucco-white', 'White Stucco', '#ece9e0', 'stucco'), C('stucco-sand', 'Sand Stucco', '#d6c7a8', 'stucco'), C('stucco-greige', 'Greige Stucco', '#c5bdae', 'stucco'),
  C('stone-gray', 'Gray Stacked Stone', '#8d8f8d', 'stone'), C('stone-tan', 'Tan Stacked Stone', '#b39f84', 'stone'),
  C('brick-red', 'Red Brick (matches fireplace)', '#9c5b4a', 'brick'),
  C('stainless', 'Stainless Steel', '#b9bec2', 'stainless'),
];

export const GRILL_SIZES = [{ id: '30', name: '30" Grill' }, { id: '36', name: '36" Grill' }, { id: '42', name: '42" Grill' }];

/** Widths are the real cut-out / unit widths in inches. */
export const APPLIANCES = [
  { id: 'grill', name: 'Built-In Grill', widthIn: null },
  { id: 'burner', name: 'Side Burner', widthIn: 13 },
  { id: 'griddle', name: 'Flat-Top Griddle', widthIn: 30 },
  { id: 'sink', name: 'Sink', widthIn: 21 },
  { id: 'fridge', name: 'Undercounter Fridge', widthIn: 24 },
  { id: 'ice', name: 'Ice Maker', widthIn: 15 },
  { id: 'doors', name: 'Storage Doors', widthIn: 30 },
  { id: 'drawers', name: 'Drawers', widthIn: 18 },
  { id: 'pizza', name: 'Pizza Oven', widthIn: 32 },
];
export const applianceWidthIn = (a, k) => (a.id === 'grill' ? Number(k.grill) : a.widthIn);

export const DEFAULT_KITCHEN = { layout: 'straight', counter: 'granite-black', base: 'stucco-white', grill: '36', appliances: ['grill', 'sink', 'fridge', 'doors'] };

const LEG = 3.5, ISLAND_LEN = 8, ISLAND_DEPTH = 3, AISLE = 4.5, GAP = 0.25, BAR_OVERHANG = 1.25;

function subtract(segments, [b0, b1]) {
  const out = [];
  for (const [a0, a1] of segments) {
    if (b1 <= a0 || b0 >= a1) { out.push([a0, a1]); continue; }
    if (b0 > a0) out.push([a0, b0]);
    if (b1 < a1) out.push([b1, a1]);
  }
  return out;
}

/**
 * Work out the counter runs and where each appliance lands.
 * A run has a front edge centre (cx, cz) and turn angle; along the run is local x,
 * and local z goes from 0 (front edge) back to -depth.
 */
export function kitchenPlan(site, k) {
  const f = site.outdoorKitchen.asDrawn.footprint;
  const x0 = f[0][0], z0 = f[0][1], x1 = f[2][0], z1 = f[2][1];
  const depth = x1 - x0, L = z1 - z0, zc = (z0 + z1) / 2;
  const top = site.outdoorKitchen.counterHeightIn / 12, bar = site.outdoorKitchen.barHeightIn / 12;
  const hasSouth = k.layout === 'l' || k.layout === 'u', hasNorth = k.layout === 'u';

  // main run faces into the porch; keep appliances clear of the porch column that stands in it
  let main = [[-L / 2, L / 2]];
  if (hasSouth) main = subtract(main, [-L / 2, -L / 2 + depth]);
  if (hasNorth) main = subtract(main, [L / 2 - depth, L / 2]);
  const half = site.poolHouse.columns.size / 2 + 0.2;
  for (const [cx, cz] of site.poolHouse.columns.centers) {
    if (cz > z0 && cz < z1 && cx <= x0 + 1) main = subtract(main, [zc - cz - half, zc - cz + half]);
  }
  const runs = [{ id: 'main', cx: x1, cz: zc, theta: Math.PI / 2, length: L, depth, segments: main }];
  if (hasSouth) runs.push({ id: 'south', cx: x1 + LEG / 2, cz: z1 - depth, theta: Math.PI, length: LEG, depth, segments: [[-LEG / 2, LEG / 2]] });
  if (hasNorth) runs.push({ id: 'north', cx: x1 + LEG / 2, cz: z0 + depth, theta: 0, length: LEG, depth, segments: [[-LEG / 2, LEG / 2]] });
  if (k.layout === 'island') runs.push({ id: 'island', cx: x1 + AISLE, cz: zc, theta: -Math.PI / 2, length: ISLAND_LEN, depth: ISLAND_DEPTH, segments: [[-ISLAND_LEN / 2, ISLAND_LEN / 2]], bar: true });

  // drop appliances into the first stretch of counter with room, then centre each stretch
  const slots = runs.flatMap((run) => run.segments.map((seg) => ({ run, seg, items: [], used: 0 })));
  const unplaced = [];
  // widest first, so the big pieces claim the long stretches of counter
  const wanted = APPLIANCES.filter((ap) => k.appliances.includes(ap.id)).sort((p, q) => applianceWidthIn(q, k) - applianceWidthIn(p, k));
  for (const a of wanted) {
    const w = applianceWidthIn(a, k) / 12;
    const slot = slots.find((s) => s.used + w + (s.items.length ? GAP : 0) <= s.seg[1] - s.seg[0] - 0.3);
    if (!slot) { unplaced.push(a); continue; }
    slot.used += w + (slot.items.length ? GAP : 0);
    slot.items.push({ a, w });
  }
  const placed = [];
  for (const s of slots) {
    s.items.sort((p, q) => APPLIANCES.indexOf(p.a) - APPLIANCES.indexOf(q.a));
    let x = (s.seg[0] + s.seg[1]) / 2 - s.used / 2;
    for (const it of s.items) { placed.push({ appliance: it.a, width: it.w, run: s.run, lx: x + it.w / 2 }); x += it.w + GAP; }
  }

  // floor area the kitchen takes up, for the "does not fit" checks on furniture
  const footprints = runs.map((r) => {
    const back = r.depth + (r.bar ? BAR_OVERHANG + 1.6 : 0); // bar stools need their floor too
    return place(rectPoly(-r.length / 2, -back, r.length / 2, 0), r.cx, r.cz, (r.theta * 180) / Math.PI);
  });
  return { runs, placed, unplaced, footprints, top, bar };
}

// ---- 3D ----------------------------------------------------------------------
const cyl = (r, h, mat, x, y, z, seg = 16) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; return m;
};

function knobs(g, n, w, y, M) {
  for (let i = 0; i < n; i++) {
    const k = cyl(0.07, 0.08, M.black, -w / 2 + (w * (i + 0.5)) / n, y, 0.09, 12);
    k.rotation.x = Math.PI / 2; g.add(k);
  }
}

const BUILD = {
  grill(g, w, top, M) {
    g.add(boxAt([-w / 2, top - 1, -0.05], [w / 2, top - 0.13, 0.05], M.steel));
    knobs(g, Math.round(w * 1.4), w - 0.3, top - 0.55, M);
    g.add(boxAt([-w / 2 + 0.04, top, -2.15], [w / 2 - 0.04, top + 0.85, -0.3], M.steel));
    g.add(boxAt([-w / 2 + 0.25, top + 0.42, -0.3], [w / 2 - 0.25, top + 0.5, -0.16], M.black));
  },
  burner(g, w, top, M) {
    g.add(boxAt([-w / 2, top, -1.9], [w / 2, top + 0.06, -0.25], M.steel));
    g.add(cyl(0.34, 0.07, M.black, 0, top + 0.09, -0.7), cyl(0.34, 0.07, M.black, 0, top + 0.09, -1.45));
    g.add(boxAt([-w / 2, top - 0.6, -0.05], [w / 2, top - 0.13, 0.05], M.steel));
    knobs(g, 2, w - 0.2, top - 0.36, M);
  },
  griddle(g, w, top, M) {
    g.add(boxAt([-w / 2, top, -2.05], [w / 2, top + 0.3, -0.25], M.steel));
    g.add(boxAt([-w / 2 + 0.12, top + 0.3, -1.95], [w / 2 - 0.12, top + 0.33, -0.4], M.firebox));
    g.add(boxAt([-w / 2, top - 0.7, -0.05], [w / 2, top - 0.13, 0.05], M.steel));
    knobs(g, 3, w - 0.3, top - 0.42, M);
  },
  sink(g, w, top, M) {
    g.add(boxAt([-w / 2, top - 0.01, -1.8], [w / 2, top + 0.015, -0.5], M.steel));
    g.add(boxAt([-w / 2 + 0.1, top, -1.7], [w / 2 - 0.1, top + 0.02, -0.6], M.sinkBowl));
    g.add(cyl(0.045, 0.9, M.steel, 0, top + 0.45, -1.95, 10), boxAt([-0.045, top + 0.86, -1.95], [0.045, top + 0.94, -1.35], M.steel));
  },
  fridge(g, w, top, M) {
    g.add(boxAt([-w / 2, 0, -0.05], [w / 2, 0.3, 0.02], M.black));
    g.add(boxAt([-w / 2 + 0.03, 0.3, -0.05], [w / 2 - 0.03, top - 0.17, 0.07], M.steel));
    g.add(boxAt([-w / 2 + 0.15, 1.1, 0.07], [-w / 2 + 0.23, top - 0.5, 0.16], M.black));
  },
  ice(g, w, top, M) {
    BUILD.fridge(g, w, top, M);
    g.add(boxAt([-w / 2 + 0.2, top - 0.6, 0.07], [w / 2 - 0.2, top - 0.4, 0.085], M.black));
  },
  doors(g, w, top, M) {
    for (const s of [-1, 1]) {
      g.add(boxAt([s > 0 ? 0.02 : -w / 2 + 0.03, 0.5, -0.05], [s > 0 ? w / 2 - 0.03 : -0.02, 2.4, 0.06], M.steel));
      g.add(boxAt([s * 0.12 - 0.03, 1.2, 0.06], [s * 0.12 + 0.03, 1.9, 0.13], M.black));
    }
  },
  drawers(g, w, top, M) {
    for (let i = 0; i < 3; i++) {
      const y = 0.45 + i * 0.75;
      g.add(boxAt([-w / 2 + 0.03, y, -0.05], [w / 2 - 0.03, y + 0.68, 0.06], M.steel));
      g.add(boxAt([-w / 2 + 0.3, y + 0.5, 0.06], [w / 2 - 0.3, y + 0.56, 0.13], M.black));
    }
  },
  pizza(g, w, top, M) {
    g.add(boxAt([-w / 2, top, -2.35], [w / 2, top + 0.35, -0.08], M.stone));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.ovenDome);
    dome.scale.set(w / 2 - 0.05, 1.45, 1.1); dome.position.set(0, top + 0.35, -1.22); dome.castShadow = true;
    g.add(dome, boxAt([-0.6, top + 0.35, -0.2], [0.6, top + 0.95, -0.1], M.firebox), cyl(0.2, 1.3, M.black, 0, top + 2.1, -0.75, 14));
  },
};

function stool(M, x, z) {
  const g = new THREE.Group();
  g.add(cyl(0.6, 0.12, M.teak, 0, 2.5, 0, 20));
  for (const [dx, dz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) g.add(boxAt([dx - 0.05, 0, dz - 0.05], [dx + 0.05, 2.45, dz + 0.05], M.frame));
  g.add(boxAt([-0.45, 0.8, -0.47], [0.45, 0.88, -0.4], M.frame), boxAt([-0.45, 0.8, 0.4], [0.45, 0.88, 0.47], M.frame));
  g.position.set(x, 0, z);
  return g;
}

export function buildKitchen(site, k, plan, M) {
  const g = new THREE.Group(); g.name = 'kitchen';
  const { top, bar } = plan;
  for (const r of plan.runs) {
    const run = new THREE.Group();
    run.position.set(r.cx, 0, r.cz); run.rotation.y = r.theta;
    const h = r.length / 2;
    run.add(boxAt([-h, 0, -r.depth], [h, top - 0.125, -0.08], M.counterBase));
    run.add(boxAt([-h - 0.04, top - 0.125, -r.depth - 0.04], [h + 0.04, top, 0.04], M.counterTop));
    if (r.bar) {
      run.add(boxAt([-h, 0, -r.depth - 0.25], [h, bar - 0.125, -r.depth + 0.25], M.counterBase));
      run.add(boxAt([-h - 0.04, bar - 0.125, -r.depth - BAR_OVERHANG], [h + 0.04, bar, -r.depth + 0.3], M.counterTop));
      for (let i = 0; i < 4; i++) run.add(stool(M, -h + 1 + i * ((r.length - 2) / 3), -r.depth - BAR_OVERHANG - 0.35));
    }
    for (const p of plan.placed.filter((q) => q.run === r)) {
      const a = new THREE.Group();
      a.position.x = p.lx;
      BUILD[p.appliance.id](a, p.width, top, M);
      run.add(a);
    }
    g.add(run);
  }
  return g;
}
