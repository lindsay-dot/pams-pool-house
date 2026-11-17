// Layout = the real sizes. Only the Layout tab (meant for Lindsay) changes these.
// The approved numbers live in site.json; anything changed here is kept as an
// override in this browser and can be downloaded as a new site.json.
import { storage } from './store.js';

const KEY = 'pph.layout.v1';
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** The numbers the Layout tab can change, read from the approved site.json. */
export function approvedLayout(base) {
  const w = base.poolDeck.widths;
  return {
    poolWidth: base.pool.size[0], poolLength: base.pool.size[1],
    depthShallow: base.pool.depthShallow, depthDeep: base.pool.depthDeep,
    deckHouseSide: w.houseSide, deckLeft: w.leftFromHouse, deckRight: w.rightFromHouse, deckPoolHouseSide: w.poolHouseSide,
    fenceHeight: base.fence.height,
    sunDirection: 46, sunHeight: 46,
  };
}

export const LAYOUT_FIELDS = [
  { key: 'poolWidth', label: 'Pool width', min: 8, max: 40 },
  { key: 'poolLength', label: 'Pool length', min: 12, max: 80 },
  { key: 'depthShallow', label: 'Shallow end depth', min: 2, max: 6 },
  { key: 'depthDeep', label: 'Deep end depth', min: 3, max: 12 },
  { key: 'deckHouseSide', label: 'Deck: house to pool', min: 3, max: 40 },
  { key: 'deckLeft', label: 'Deck: left side (from house)', min: 1, max: 40 },
  { key: 'deckRight', label: 'Deck: right side (from house)', min: 1, max: 40 },
  { key: 'deckPoolHouseSide', label: 'Deck: pool to pool house', min: 2, max: 40 },
  { key: 'fenceHeight', label: 'Fence height', min: 3, max: 8 },
];

export function loadLayout(base) {
  const saved = storage.read(KEY) || {};
  const out = approvedLayout(base);
  for (const k of Object.keys(out)) if (Number.isFinite(saved[k])) out[k] = saved[k];
  return out;
}
export const saveLayout = (layout) => storage.write(KEY, layout);
export const isApproved = (base, layout) => JSON.stringify(layout) === JSON.stringify(approvedLayout(base));

/** A full site description with the layout numbers applied. The pool house itself never moves. */
export function deriveSite(base, L) {
  const site = JSON.parse(JSON.stringify(base));
  const porchEdge = base.poolHouse.slab.outline[2][1];
  const cx = base.layoutAlongYard.centerLineX;
  const bandZ = base.poolHouse.enclosedBand.outline[2][1];
  const slabX1 = base.poolHouse.slab.outline[2][0];

  const px0 = cx - L.poolWidth / 2, px1 = cx + L.poolWidth / 2;
  const pz0 = porchEdge + L.deckPoolHouseSide, pz1 = pz0 + L.poolLength;
  site.pool.size = [L.poolWidth, L.poolLength];
  site.pool.outline = rect(px0, pz0, px1, pz1);
  site.pool.depthShallow = L.depthShallow;
  site.pool.depthDeep = Math.max(L.depthDeep, L.depthShallow);
  const sw = Math.min(8, L.poolWidth), sd = Math.min(4, L.poolLength / 3);
  site.pool.steps.outline = rect(cx - sw / 2, pz1 - sd, cx + sw / 2, pz1);

  const dx0 = px0 - L.deckLeft, dx1 = px1 + L.deckRight, dz1 = pz1 + L.deckHouseSide;
  site.poolDeck.outline = rect(dx0, porchEdge, dx1, dz1);
  site.poolDeck.size = [dx1 - dx0, dz1 - porchEdge];
  site.poolDeck.widths = { houseSide: L.deckHouseSide, leftFromHouse: L.deckLeft, rightFromHouse: L.deckRight, poolHouseSide: L.deckPoolHouseSide };

  // the house stays glued to the house-side edge of the deck
  const dz = dz1 - base.poolDeck.outline[2][1];
  const h = site.existingHouse;
  for (const part of [h.backPorch, h.wing, h.body]) part.outline = part.outline.map(([x, z]) => [x, z + dz]);

  site.fence.height = L.fenceHeight;
  site.fence.runs = [
    [[dx0, dz1], [dx0, bandZ], [0, bandZ]],
    [[Math.min(h.backPorch.outline[1][0], dx1), dz1], [dx1, dz1], [dx1, bandZ], [slabX1, bandZ]],
  ];
  site.fence.gates = [
    { id: 'left', at: [dx0, (pz0 + pz1) / 2 + 2], width: 4 },
    { id: 'right', at: [dx1, bandZ + 4], width: 4 },
  ];
  site.meta.status = isApproved(base, L) ? base.meta.status : 'EDITED in the Layout tab - not the approved layout';
  return site;
}
