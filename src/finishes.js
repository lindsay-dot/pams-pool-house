// Every finish and color she can pick, with plain names. Picking one only changes
// how a surface looks; no size in site.json is ever touched here.
import { T } from './textures.js';

const C = (id, name, hex, extra = {}) => ({ id, name, hex, ...extra });

const GRAY = C('natural-gray', 'Natural Gray', '#cfccc2');
const SAND = C('sand', 'Sand', '#d8c9ab');

export const DECK = [
  { id: 'broom', name: 'Broom Finish', make: (c) => T.concrete(c), rough: 0.95,
    colors: [GRAY, C('soft-white', 'Soft White', '#e6e3da'), SAND, C('pewter', 'Pewter', '#a9aaa6')] },
  { id: 'salt', name: 'Salt Finish', make: (c) => T.salt(c), rough: 0.9,
    colors: [GRAY, SAND, C('buff', 'Buff', '#d9c39a')] },
  { id: 'ashlar', name: 'Stamped Ashlar Slate', make: (c) => T.ashlar(c), rough: 0.8,
    colors: [C('slate-gray', 'Slate Gray', '#8f9496'), C('sandstone', 'Sandstone', '#c9b592'), C('walnut', 'Walnut Brown', '#8a6a52'), C('terra-cotta', 'Terra Cotta', '#b9765a')] },
  { id: 'cobble', name: 'Stamped Cobblestone', make: (c) => T.cobble(c), rough: 0.85,
    colors: [C('old-gray', 'Old Gray', '#9a9a96'), C('sandstone', 'Sandstone', '#c9b592'), C('brownstone', 'Brownstone', '#8c6f5c')] },
  { id: 'plank', name: 'Stamped Wood Plank', make: (c) => T.wood(c, 0.5, 9), rough: 0.8,
    colors: [C('driftwood', 'Driftwood Gray', '#a39c90'), C('oak', 'Weathered Oak', '#b08f68'), C('walnut', 'Walnut', '#7b5a42')] },
  { id: 'aggregate', name: 'Exposed Aggregate', make: (c) => T.aggregate(c), rough: 1,
    colors: [C('river', 'River Pebble', '#b3aa9a'), C('tan', 'Tan Pebble', '#c8b08a'), C('salt-pepper', 'Salt & Pepper', '#9d9d9b')] },
  { id: 'stained', name: 'Stained Concrete', make: (c) => T.stained(c), rough: 0.5,
    colors: [C('walnut', 'Walnut', '#7a5a44'), C('terra-cotta', 'Terra Cotta', '#b06f52'), C('slate-blue', 'Slate Blue', '#74838c'), C('sandstone', 'Sandstone', '#c4ad85'), C('adobe', 'Adobe', '#c08a62'), C('charcoal', 'Charcoal', '#5d5f61')] },
  { id: 'cooldeck', name: 'Cool-Deck Coating', make: (c) => T.coolDeck(c), rough: 0.95,
    colors: [C('cool-white', 'Cool White', '#ecebe4'), C('desert-tan', 'Desert Tan', '#dccbb0'), C('pale-gray', 'Pale Gray', '#d0d2d0'), C('shell', 'Shell', '#e6d3c4')] },
  { id: 'travertine', name: 'Travertine Pavers', make: (c) => T.pavers(c, 2, 2, [4, 2.667], true), rough: 0.7,
    colors: [C('ivory', 'Ivory', '#e6dcc6'), C('walnut', 'Walnut', '#bfa888'), C('silver', 'Silver', '#c9c6bd'), C('noce', 'Noce Brown', '#a58a6c')] },
  { id: 'brick', name: 'Brick Pavers', make: (c) => T.pavers(c, 4, 8, [2.667, 2.667], false, 131), rough: 0.9,
    colors: [C('red', 'Classic Red', '#9c4f3d'), C('old-town', 'Old Town Blend', '#8a5a48'), C('charcoal', 'Charcoal', '#56524f'), C('tan', 'Tan', '#c3a27c')] },
];

export const POOL_INTERIOR = [
  C('white-plaster', 'White Plaster', '#e3f0f3', { water: '#5cc6e0' }),
  C('blue-plaster', 'Light Blue Plaster', '#bfe0ee', { water: '#3fb0dc' }),
  C('gray-plaster', 'Gray Plaster', '#aab8bd', { water: '#3f9fb5' }),
  C('caribbean', 'Caribbean Blue Pebble', '#7fc4cf', { water: '#2fb7c4', pebble: true }),
  C('tahoe', 'Tahoe Blue Pebble', '#4f87b5', { water: '#2a7fb8', pebble: true }),
  C('onyx', 'Black Onyx Pebble', '#4c5a63', { water: '#1e5d78', pebble: true }),
  C('sandy', 'Sandy Beach Pebble', '#d9cfae', { water: '#6fd0c8', pebble: true }),
];

export const COPING = [
  { id: 'bullnose', name: 'Bullnose Concrete', make: (c) => T.plain(c, 0.05, 3), rough: 0.9,
    colors: [C('white', 'White', '#e8e5db'), GRAY, SAND] },
  { id: 'travertine', name: 'Travertine', make: (c) => T.pavers(c, 2, 1, [4, 1], true, 141), rough: 0.65,
    colors: [C('ivory', 'Ivory', '#e6dcc6'), C('walnut', 'Walnut', '#bfa888'), C('silver', 'Silver', '#c9c6bd')] },
  { id: 'brick', name: 'Brick', make: (c) => T.pavers(c, 4, 4, [1.333, 1.333], false, 151), rough: 0.9,
    colors: [C('red', 'Classic Red', '#9c4f3d'), C('charcoal', 'Charcoal', '#56524f'), C('tan', 'Tan', '#c3a27c')] },
];

export const TILE = [
  C('cobalt', 'Cobalt Blue', '#2f5fa8'),
  C('ocean', 'Ocean Blue', '#3d7fa6'),
  C('aqua', 'Aqua Glass Mosaic', '#58b8c4', { mosaic: ['#58b8c4', '#7fd0d4', '#3c9fb0', '#a7e0de'] }),
  C('navy', 'Navy Mosaic', '#26406b', { mosaic: ['#26406b', '#31558c', '#1c3052', '#4a6fa5'] }),
  C('sandstone', 'Sandstone', '#c9b592'),
  C('slate', 'Gray Slate', '#7d858a'),
];

export const SIDING = [
  C('warm-white', 'Warm White (matches house)', '#eeeadf'), C('cream', 'Cream', '#e9dfc4'), C('greige', 'Greige', '#cfc8b8'),
  C('light-gray', 'Light Gray', '#c9cdcd'), C('sage', 'Sage Green', '#a9b39b'), C('sky', 'Coastal Blue', '#a9bfca'),
  C('navy', 'Navy', '#33435a'), C('charcoal', 'Charcoal', '#4d5052'), C('barn-red', 'Barn Red', '#8a3a31'),
];

export const TRIM = [
  C('white', 'White', '#f1efe8'), C('cream', 'Cream', '#e6dcc2'), C('bronze', 'Dark Bronze', '#4a4038'), C('black', 'Black', '#232425'), C('gray', 'Soft Gray', '#b9bcbb'),
];

export const ROOF = [
  { id: 'shingle', name: 'Architectural Shingle', make: (c) => T.shingle(c), rough: 0.95, metal: 0,
    colors: [C('weathered-wood', 'Weathered Wood (as drawn)', '#5f534c'), C('charcoal', 'Charcoal', '#3f4144'), C('driftwood', 'Driftwood', '#7b756c'), C('black', 'Onyx Black', '#2b2c2e'), C('slate', 'Slate Gray', '#59626a')] },
  { id: 'metal', name: 'Standing Seam Metal', make: (c) => T.seam(c), rough: 0.42, metal: 0.55,
    colors: [C('charcoal', 'Charcoal', '#4a4842'), C('bronze', 'Dark Bronze', '#4b3d33'), C('galvalume', 'Galvalume Silver', '#b4b8ba'), C('barn-red', 'Barn Red', '#8b3b32'), C('forest', 'Forest Green', '#35523f'), C('black', 'Matte Black', '#27282a'), C('white', 'Bright White', '#e8e9e6')] },
];

export const DOORS = [
  C('oak', 'Natural Oak Stain (as drawn)', '#9a6636', { stain: true }), C('walnut', 'Walnut Stain', '#6b452b', { stain: true }), C('espresso', 'Espresso Stain', '#3d2a20', { stain: true }),
  C('white', 'Painted White', '#f0eee7'), C('black', 'Painted Black', '#242526'), C('navy', 'Painted Navy', '#2e3f5c'), C('red', 'Painted Red', '#8e2f2a'), C('sage', 'Painted Sage', '#8e9a80'),
];

export const STORAGE_DOOR = [
  { id: 'panel', name: 'Raised-Panel Garage Door', make: (c) => T.panels(c) },
  { id: 'rollup', name: 'Roll-Up Steel Door', make: (c) => T.slats(c) },
];
export const STORAGE_DOOR_COLORS = [
  C('charcoal', 'Charcoal (as drawn)', '#3f4144'), C('white', 'White', '#eceae4'), C('bronze', 'Dark Bronze', '#4a4038'), C('sandstone', 'Sandstone', '#c8b99c'), C('gray', 'Gray', '#8f9496'), C('black', 'Black', '#232425'),
];

/** The look in the drawings and photos: what "Start Over" goes back to. */
export const DEFAULT_DESIGN = {
  deck: { finish: 'broom', color: 'natural-gray' },
  poolInterior: 'white-plaster',
  coping: { type: 'bullnose', color: 'white' },
  tile: 'ocean',
  siding: 'warm-white',
  trim: 'white',
  roof: { type: 'shingle', color: 'weathered-wood' },
  doors: 'oak',
  storageDoor: { style: 'panel', color: 'charcoal' },
};

const byId = (list, id) => list.find((o) => o.id === id) || list[0];

/** Fill gaps and fix any color that does not belong to its finish. */
export function normalizeDesign(d) {
  const out = JSON.parse(JSON.stringify(DEFAULT_DESIGN));
  for (const k of Object.keys(out)) {
    if (d && d[k] != null) out[k] = typeof out[k] === 'object' ? { ...out[k], ...d[k] } : d[k];
  }
  out.deck.finish = byId(DECK, out.deck.finish).id;
  out.deck.color = byId(byId(DECK, out.deck.finish).colors, out.deck.color).id;
  out.coping.type = byId(COPING, out.coping.type).id;
  out.coping.color = byId(byId(COPING, out.coping.type).colors, out.coping.color).id;
  out.roof.type = byId(ROOF, out.roof.type).id;
  out.roof.color = byId(byId(ROOF, out.roof.type).colors, out.roof.color).id;
  out.poolInterior = byId(POOL_INTERIOR, out.poolInterior).id;
  out.tile = byId(TILE, out.tile).id;
  out.siding = byId(SIDING, out.siding).id;
  out.trim = byId(TRIM, out.trim).id;
  out.doors = byId(DOORS, out.doors).id;
  out.storageDoor.style = byId(STORAGE_DOOR, out.storageDoor.style).id;
  out.storageDoor.color = byId(STORAGE_DOOR_COLORS, out.storageDoor.color).id;
  return out;
}

const cache = new Map();
function texture(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}
function setMap(mat, key, make) {
  const had = !!mat.map;
  mat.map = make ? texture(key, make) : null;
  if (had !== !!mat.map) mat.needsUpdate = true;
}

/** Paint the chosen design onto the shared materials. */
export function applyDesign(design, M) {
  const d = normalizeDesign(design);

  const deck = byId(DECK, d.deck.finish), deckColor = byId(deck.colors, d.deck.color);
  setMap(M.deck, `deck:${deck.id}:${deckColor.hex}`, () => deck.make(deckColor.hex));
  M.deck.roughness = deck.rough;

  const interior = byId(POOL_INTERIOR, d.poolInterior);
  setMap(M.poolFinish, `pool:${interior.id}`, () => (interior.pebble ? T.pebble(interior.hex) : T.plain(interior.hex, 0.04, 4)));
  M.water.color.set(interior.water);

  const coping = byId(COPING, d.coping.type), copingColor = byId(coping.colors, d.coping.color);
  setMap(M.coping, `coping:${coping.id}:${copingColor.hex}`, () => coping.make(copingColor.hex));
  M.coping.roughness = coping.rough;

  const tile = byId(TILE, d.tile);
  setMap(M.waterlineTile, `tile:${tile.id}`, () => (tile.mosaic ? T.mosaic(tile.mosaic) : T.tile(tile.hex)));

  const siding = byId(SIDING, d.siding);
  setMap(M.siding, `siding:${siding.hex}`, () => T.boardBatten(siding.hex));
  M.trim.color.set(byId(TRIM, d.trim).hex);

  const roof = byId(ROOF, d.roof.type), roofColor = byId(roof.colors, d.roof.color);
  setMap(M.roof, `roof:${roof.id}:${roofColor.hex}`, () => roof.make(roofColor.hex));
  M.roof.roughness = roof.rough; M.roof.metalness = roof.metal;
  // the lean-to is always standing seam; it follows the main roof color when that is metal too
  const leanHex = roof.id === 'metal' ? roofColor.hex : '#4a4842';
  setMap(M.metalRoof, `roof:metal:${leanHex}`, () => T.seam(leanHex));

  const door = byId(DOORS, d.doors);
  setMap(M.doorWood, `door:${door.id}`, door.stain ? () => T.wood(door.hex, 0.75) : null);
  M.doorWood.color.set(door.stain ? '#ffffff' : door.hex);

  const sd = byId(STORAGE_DOOR, d.storageDoor.style), sdColor = byId(STORAGE_DOOR_COLORS, d.storageDoor.color);
  setMap(M.garageDoor, `sdoor:${sd.id}:${sdColor.hex}`, () => sd.make(sdColor.hex));
  return d;
}

function thumb(key, make) {
  const t = texture(`thumb:${key}`, make);
  if (!t.userData.url) t.userData.url = t.image.toDataURL();
  return `url(${t.userData.url})`;
}

/**
 * What the side panel shows: tabs -> groups -> options. Built from the design so
 * the color list always matches the chosen finish.
 */
export function panelGroups(design) {
  const d = normalizeDesign(design);
  const deck = byId(DECK, d.deck.finish), coping = byId(COPING, d.coping.type), roof = byId(ROOF, d.roof.type);
  const colors = (list) => list.map((c) => ({ id: c.id, name: c.name, swatch: c.hex }));
  const kinds = (list, key) => list.map((f) => ({ id: f.id, name: f.name, swatch: thumb(`${key}:${f.id}`, () => f.make((f.colors || STORAGE_DOOR_COLORS)[0].hex)), wide: true }));
  return [
    { tab: 'deck', label: 'Deck finish', path: 'deck.finish', value: d.deck.finish, options: kinds(DECK, 'deck') },
    { tab: 'deck', label: `Color for ${deck.name}`, path: 'deck.color', value: d.deck.color, options: colors(deck.colors) },
    { tab: 'pool', label: 'Inside of the pool', path: 'poolInterior', value: d.poolInterior, options: colors(POOL_INTERIOR) },
    { tab: 'pool', label: 'Pool edge (coping)', path: 'coping.type', value: d.coping.type, options: kinds(COPING, 'coping') },
    { tab: 'pool', label: `Color for ${coping.name}`, path: 'coping.color', value: d.coping.color, options: colors(coping.colors) },
    { tab: 'pool', label: 'Tile at the water line', path: 'tile', value: d.tile, options: colors(TILE) },
    { tab: 'house', label: 'Siding color', path: 'siding', value: d.siding, options: colors(SIDING) },
    { tab: 'house', label: 'Trim color', path: 'trim', value: d.trim, options: colors(TRIM) },
    { tab: 'house', label: 'Roof', path: 'roof.type', value: d.roof.type, options: kinds(ROOF, 'roof') },
    { tab: 'house', label: `Color for ${roof.name}`, path: 'roof.color', value: d.roof.color, options: colors(roof.colors) },
    { tab: 'house', label: 'Porch doors', path: 'doors', value: d.doors, options: colors(DOORS) },
    { tab: 'house', label: 'Storage door', path: 'storageDoor.style', value: d.storageDoor.style, options: kinds(STORAGE_DOOR, 'sdoor') },
    { tab: 'house', label: 'Storage door color', path: 'storageDoor.color', value: d.storageDoor.color, options: colors(STORAGE_DOOR_COLORS) },
  ];
}

export const TABS = [
  { id: 'deck', name: 'Deck' },
  { id: 'pool', name: 'Pool' },
  { id: 'house', name: 'Pool House' },
];
