// Furniture library at real US sizes (feet). Each piece is built around its own
// centre, sitting on the ground, with its front toward +z.
import * as THREE from 'three';
import { boxAt } from './build/helpers.js';
import { place, rectPoly, inRect } from './geom2d.js';
import { ftIn } from './units.js';

const cyl = (rTop, rBot, h, mat, x, y, z, seg = 18) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
};
const legs = (g, M, x, z, h, t = 0.07) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(boxAt([sx * x - t, 0, sz * z - t], [sx * x + t, h, sz * z + t], M.frame));
};

function chair(M) {
  const g = new THREE.Group();
  g.add(boxAt([-0.8, 1.3, -0.8], [0.8, 1.48, 0.8], M.cushion), boxAt([-0.8, 1.48, 0.62], [0.8, 2.9, 0.8], M.wicker));
  legs(g, M, 0.72, 0.72, 1.3);
  return g;
}

export const FURNITURE = [
  { type: 'chaise', name: 'Chaise Lounge', size: [2.17, 6.5], build(g, M) {
    g.add(boxAt([-1.08, 0.6, -3.25], [1.08, 0.78, 3.25], M.wicker));
    legs(g, M, 0.95, 3.05, 0.6);
    g.add(boxAt([-1, 0.78, -1], [1, 1.05, 3.2], M.cushion));
    const back = new THREE.Group();
    back.add(boxAt([-1, 0, -2.25], [1, 0.27, 0], M.cushion), boxAt([-1.08, -0.18, -2.3], [1.08, 0, 0], M.wicker));
    back.position.set(0, 0.8, -1); back.rotation.x = 0.6;
    g.add(back);
  } },
  { type: 'dining', name: 'Dining Set (table and 6 chairs)', size: [7, 7.5], note: 'Table 6\' 0" × 3\' 4"', build(g, M) {
    g.add(boxAt([-3, 2.38, -1.67], [3, 2.5, 1.67], M.teak));
    legs(g, M, 2.6, 1.3, 2.38, 0.12);
    for (const x of [-2, 0, 2]) for (const s of [-1, 1]) {
      const c = chair(M); c.position.set(x, 0, s * 2.75); if (s < 0) c.rotation.y = Math.PI; g.add(c);
    }
  } },
  { type: 'sectional', name: 'Sectional Sofa', size: [9, 9], rects: [[-4.5, -4.5, 4.5, -1.5], [-4.5, -1.5, -1.5, 4.5]], build(g, M) {
    g.add(boxAt([-4.5, 0.25, -4.5], [4.5, 1.25, -1.5], M.wicker), boxAt([-4.5, 0.25, -1.5], [-1.5, 1.25, 4.5], M.wicker));
    g.add(boxAt([-3.85, 1.25, -3.85], [4.45, 1.6, -1.55], M.cushion), boxAt([-3.85, 1.25, -1.55], [-1.55, 1.6, 4.45], M.cushion));
    g.add(boxAt([-4.5, 1.25, -4.5], [4.5, 2.7, -3.9], M.wicker), boxAt([-4.5, 1.25, -3.9], [-3.9, 2.7, 4.5], M.wicker));
    for (const x of [-2.4, 0.3, 3]) g.add(boxAt([x - 1.1, 1.6, -3.9], [x + 1.1, 2.6, -3.45], M.cushion));
    for (const z of [-0.3, 2.6]) g.add(boxAt([-3.9, 1.6, z - 1.1], [-3.45, 2.6, z + 1.1], M.cushion));
  } },
  { type: 'adirondack', name: 'Adirondack Chair', size: [2.6, 3], build(g, M) {
    g.add(boxAt([-1, 0.95, -0.9], [1, 1.1, 1.1], M.teak));
    const back = new THREE.Group();
    back.add(boxAt([-1, 0, -0.08], [1, 2.6, 0.06], M.teak));
    back.position.set(0, 1, -0.85); back.rotation.x = -0.3;
    g.add(back);
    for (const s of [-1, 1]) {
      g.add(boxAt([s * 1.1 - 0.2, 1.65, -1.2], [s * 1.1 + 0.2, 1.75, 1.3], M.teak));
      g.add(boxAt([s * 1.1 - 0.08, 0, 0.95], [s * 1.1 + 0.08, 1.65, 1.15], M.teak), boxAt([s * 1.1 - 0.08, 0, -1.15], [s * 1.1 + 0.08, 1.65, -0.95], M.teak));
    }
  } },
  { type: 'firepit', name: 'Fire Pit', size: [3.67, 3.67], note: '44" round', build(g, M) {
    g.add(cyl(1.83, 1.7, 1.45, M.stoneFurn, 0, 0.725, 0, 28), cyl(1.4, 1.4, 0.06, M.firebox, 0, 1.47, 0, 28));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, r = i ? 0.55 : 0;
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8 + (i % 3) * 0.25, 8), M.flame);
      f.position.set(Math.cos(a) * r, 1.9, Math.sin(a) * r); g.add(f);
    }
  } },
  { type: 'umbrella', name: 'Umbrella', size: [2, 2], note: '9\' 0" canopy', build(g, M) {
    g.add(cyl(0.95, 1, 0.3, M.frame, 0, 0.15, 0, 20), cyl(0.07, 0.07, 8.3, M.frame, 0, 4.15, 0, 10));
    const top = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1.5, 8, 1, true), M.canvas);
    top.position.y = 7.7; top.castShadow = true; g.add(top);
  } },
  { type: 'pergola', name: 'Pergola', size: [12, 12], note: '12\' 0" × 12\' 0", 8\' 6" tall',
    rects: [[-6, -6, -5.4, -5.4], [5.4, -6, 6, -5.4], [-6, 5.4, -5.4, 6], [5.4, 5.4, 6, 6]], build(g, M) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(boxAt([sx * 5.7 - 0.3, 0, sz * 5.7 - 0.3], [sx * 5.7 + 0.3, 8.5, sz * 5.7 + 0.3], M.teak));
    for (const sz of [-1, 1]) g.add(boxAt([-6.6, 8.5, sz * 5.7 - 0.2], [6.6, 9.15, sz * 5.7 + 0.2], M.teak));
    for (let i = 0; i < 10; i++) { const x = -5.85 + i * 1.3; g.add(boxAt([x - 0.1, 9.15, -6.8], [x + 0.1, 9.65, 6.8], M.teak)); }
  } },
  { type: 'fan', name: 'Ceiling Fan', size: [4.33, 4.33], note: '52" blades', overhead: true, rects: [], build(g, M) {
    g.add(cyl(0.05, 0.05, 4.5, M.frame, 0, 11.4, 0, 8), cyl(0.45, 0.45, 0.45, M.frame, 0, 9.1, 0, 18));
    for (let i = 0; i < 5; i++) {
      const b = boxAt([0.4, 9.05, -0.22], [2.165, 9.09, 0.22], M.teak);
      const arm = new THREE.Group(); arm.add(b); arm.rotation.y = (i / 5) * Math.PI * 2; g.add(arm);
    }
  } },
  { type: 'planter', name: 'Planter', size: [2, 2], build(g, M) {
    g.add(boxAt([-1, 0, -1], [1, 2.1, 1], M.pot));
    for (const [x, y, z, r] of [[0, 3, 0, 1.25], [0.6, 2.6, 0.4, 0.8], [-0.6, 2.7, -0.3, 0.85]]) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.plant); p.position.set(x, y, z); p.castShadow = true; g.add(p);
    }
  } },
  { type: 'rug', name: 'Outdoor Rug', size: [8, 10], flat: true, build(g, M) {
    const r = boxAt([-4, 0, -5], [4, 0.04, 5], M.rug, { shadow: false }); g.add(r);
  } },
];

export const furnitureDef = (type) => FURNITURE.find((f) => f.type === type);
export const sizeLabel = (def) => def.note ? `${def.note}` : `${ftIn(def.size[0])} × ${ftIn(def.size[1])}`;

/** Floor shapes for one placed item, in yard coordinates. */
export function itemPolys(item) {
  const def = furnitureDef(item.type);
  const rects = def.rects || [[-def.size[0] / 2, -def.size[1] / 2, def.size[0] / 2, def.size[1] / 2]];
  return rects.map((r) => place(rectPoly(...r), item.x, item.z, item.rot));
}
export function itemOutline(item) {
  const def = furnitureDef(item.type), [w, d] = def.size;
  return place(rectPoly(-w / 2, -d / 2, w / 2, d / 2), item.x, item.z, item.rot);
}

/** Hard surfaces sit one slab (4") above the lawn. */
export function onHardSurface(site, p) {
  return inRect(p, site.poolDeck.outline) || inRect(p, site.poolHouse.slab.outline) || inRect(p, site.rinseStation.pad);
}

export function buildItem(item, site, M) {
  const def = furnitureDef(item.type);
  const g = new THREE.Group();
  def.build(g, M);
  // selection outline, hidden until picked
  const [w, d] = def.size, y = 0.08;
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => new THREE.Vector3(x * 1.04, y, z * 1.04))),
    new THREE.LineBasicMaterial({ color: 0x1f6f8b, depthTest: false, transparent: true }),
  );
  ring.renderOrder = 20; ring.visible = false; ring.name = 'ring';
  g.add(ring);
  g.userData.itemId = item.id;
  positionItem(g, item, site);
  return g;
}

export function positionItem(g, item, site) {
  g.position.set(item.x, onHardSurface(site, [item.x, item.z]) ? 0 : -0.333, item.z);
  g.rotation.y = (item.rot * Math.PI) / 180;
}

/** A sensible first spot for a new piece; she drags it from there. */
export function startingSpot(type, site, count) {
  const deck = site.poolDeck.outline, pool = site.pool.outline, slab = site.poolHouse.slab.outline;
  const midZ = (pool[0][1] + pool[2][1]) / 2;
  // fill the right-hand strip of deck first, then the left
  const rightX = count < 9 ? (pool[2][0] + deck[2][0]) / 2 : (pool[0][0] + deck[0][0]) / 2;
  const porchX = (slab[0][0] + slab[2][0]) / 2, porchZ = slab[2][1] - 6.5;
  const step = [0, 1, -1, 2, -2, 3, -3, 4, -4][count % 9] * 3.4;
  switch (type) {
    case 'fan': return { x: porchX + step, z: porchZ - 2, rot: 0 };
    case 'rug': return { x: porchX, z: porchZ, rot: 90 };
    case 'sectional': return { x: porchX + 4, z: porchZ, rot: 0 };
    case 'pergola': return { x: deck[2][0] + 10, z: midZ + step, rot: 0 };
    case 'chaise': return { x: rightX, z: midZ + step, rot: 90 };
    case 'dining': return { x: rightX + 0.5, z: midZ + step, rot: 90 };
    default: return { x: rightX, z: midZ + step, rot: 0 };
  }
}
