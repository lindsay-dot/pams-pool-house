// Measurement lines and labels, all read from site.json and shown in feet and inches.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ftIn } from './units.js';

export function buildDimensions(site) {
  const g = new THREE.Group(); g.name = 'dimensions';
  const pts = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const label = (text, pos, cls = '') => {
    const el = document.createElement('div');
    el.className = `dim-label ${cls}`;
    el.textContent = text;
    const o = new CSS2DObject(el);
    o.position.copy(pos);
    g.add(o);
  };
  const dim = (a, b, text) => {
    pts.push(a, b);
    const vertical = Math.abs(b.y - a.y) > 0.01;
    for (const p of [a, b]) {
      if (vertical) pts.push(V(p.x - 0.5, p.y, p.z), V(p.x + 0.5, p.y, p.z));
      else pts.push(V(p.x, p.y - 0.4, p.z), V(p.x, p.y + 0.4, p.z));
    }
    label(text ?? ftIn(a.distanceTo(b)), a.clone().lerp(b, 0.5));
  };

  const y = 0.5;
  const pool = site.pool, [px0, pz0] = pool.outline[0], [px1, pz1] = pool.outline[2];
  const [dx0, dz0] = site.poolDeck.outline[0], [dx1, dz1] = site.poolDeck.outline[2];
  const ph = site.poolHouse, [sx0, sz0] = ph.slab.outline[0], [sx1, sz1] = ph.slab.outline[2];
  const bandZ = ph.enclosedBand.outline[2][1];
  const mid = (pz0 + pz1) / 2;

  // pool
  dim(V(px0, y, pz1 - 11), V(px1, y, pz1 - 11));
  dim(V(px1 - 2, y, pz0), V(px1 - 2, y, pz1));
  label(`Pool ${ftIn(px1 - px0)} × ${ftIn(pz1 - pz0)}`, V((px0 + px1) / 2, 0.2, mid - 5), 'big');
  label(`Shallow end ${ftIn(pool.depthShallow)}`, V((px0 + px1) / 2, 0, pz1 - 6), 'soft');
  label(`Deep end ${ftIn(pool.depthDeep)}`, V((px0 + px1) / 2, 0, pz0 + 4), 'soft');

  // deck widths
  dim(V(dx0, y, mid), V(px0, y, mid));
  dim(V(px1, y, mid), V(dx1, y, mid));
  dim(V(px1 + 3, y, dz0), V(px1 + 3, y, pz0));
  dim(V(px1 + 3, y, pz1), V(px1 + 3, y, dz1));
  dim(V(dx1 + 4, y, dz0), V(dx1 + 4, y, dz1), `Deck ${ftIn(dz1 - dz0)}`);
  dim(V(dx0, y, dz1 + 2.5), V(dx1, y, dz1 + 2.5), `Deck ${ftIn(dx1 - dx0)}`);

  // pool house
  const lz0 = site.leanTo.outline[0][1];
  dim(V(sx0, y, lz0 - 3), V(sx1, y, lz0 - 3), `Pool house ${ftIn(sx1 - sx0)}`);
  dim(V(sx0 - 5, y, sz0), V(sx0 - 5, y, bandZ));
  dim(V(sx0 - 5, y, bandZ), V(sx0 - 5, y, sz1), `Porch ${ftIn(sz1 - bandZ)}`);
  dim(V(sx0 - 5, y, lz0), V(sx0 - 5, y, sz0), `Lean-to ${ftIn(sz0 - lz0)}`);
  const k = site.outdoorKitchen.asDrawn.footprint;
  dim(V(k[2][0] + 0.6, y, k[0][1]), V(k[2][0] + 0.6, y, k[2][1]), `Kitchen ${ftIn(k[2][1] - k[0][1])}`);
  const fp = ph.fireplace;
  dim(V(fp.footprint[0][0], 6.6, fp.footprint[2][1] + 0.9), V(fp.footprint[1][0], 6.6, fp.footprint[2][1] + 0.9), `Fireplace ${ftIn(fp.width)}`);

  // heights
  const r = ph.roof, e = r.eaveOutline;
  dim(V(e[3][0], 0, e[3][1]), V(e[3][0], r.eaveHeight, e[3][1]), `Roof edge ${ftIn(r.eaveHeight)}`);
  label(`Roof peak ${ftIn(r.ridgeHeight)}`, V((r.ridge.from[0] + r.ridge.to[0]) / 2, r.ridgeHeight + 1.2, r.ridge.from[1]));
  dim(V(sx1 - 1, 0, sz1 + 0.6), V(sx1 - 1, ph.porch.beamUndersideHeight, sz1 + 0.6), `Ceiling beam ${ftIn(ph.porch.beamUndersideHeight)}`);
  const gate = site.fence.gates[0];
  label(`Fence ${ftIn(site.fence.height)} high`, V(gate.at[0], site.fence.height + 1.2, gate.at[1] + 8));

  // rainwater tank: underground, so its outline only shows with the measurements
  if (site.rainwater) {
    const tk = site.rainwater.tank, o = tk.outline, ty = -0.2;
    for (let i = 0; i < 4; i++) pts.push(V(o[i][0], ty, o[i][1]), V(o[(i + 1) % 4][0], ty, o[(i + 1) % 4][1]));
    label(`Rainwater tank (underground) · ${tk.capacityGallons.toLocaleString('en-US')} gallons · ${ftIn(tk.size[0])} × ${ftIn(tk.size[1])}`, V((o[0][0] + o[2][0]) / 2, 1.2, (o[0][1] + o[2][1]) / 2));
  }

  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x10202b, depthTest: false, transparent: true }),
  );
  lines.renderOrder = 10;
  g.add(lines);
  g.visible = false;
  return g;
}
