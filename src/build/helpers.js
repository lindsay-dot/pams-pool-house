// Geometry helpers. 1 unit = 1 foot. Site x -> world x, site y -> world z, up = world y.
import * as THREE from 'three';

const V3 = THREE.Vector3;

/** Box between two corners [x,y,z]. Texture coordinates are in feet. */
export function boxAt(a, b, mat, { shadow = true } = {}) {
  const w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]), d = Math.abs(b[2] - a[2]);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const su = f < 2 ? d : w;
    const sv = f === 2 || f === 3 ? d : h;
    for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * su, uv.getY(k) * sv); }
  }
  const m = new THREE.Mesh(g, mat);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

/**
 * Wall elevation with door notches and window holes, extruded to a thickness.
 * Local coords: x along the wall (0..length), y up. openings: {a, b, y0, y1}.
 * top: optional list of [x, y] points for a shaped top edge (left to right).
 */
function wallGeometry(length, height, thickness, openings = [], top = null) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  const doors = openings.filter((o) => o.y0 <= 0).sort((p, q) => p.a - q.a);
  for (const o of doors) { s.lineTo(o.a, 0); s.lineTo(o.a, o.y1); s.lineTo(o.b, o.y1); s.lineTo(o.b, 0); }
  s.lineTo(length, 0);
  const pts = top ? [...top].reverse() : [[length, height], [0, height]];
  for (const p of pts) s.lineTo(p[0], p[1]);
  s.closePath();
  for (const o of openings.filter((o) => o.y0 > 0)) {
    const hole = new THREE.Path();
    hole.moveTo(o.a, o.y0); hole.lineTo(o.b, o.y0); hole.lineTo(o.b, o.y1); hole.lineTo(o.a, o.y1); hole.closePath();
    s.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
}

/** Wall running along x from x0 to x1, occupying z .. z + thickness. */
export function wallX({ x0, x1, z, thickness, height, openings, top, mat, y = 0 }) {
  const m = new THREE.Mesh(wallGeometry(x1 - x0, height, thickness, openings, top), mat);
  m.position.set(x0, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Wall running along z from z0 to z1, occupying x .. x + thickness. */
export function wallZ({ z0, z1, x, thickness, height, openings, top, mat, y = 0 }) {
  const m = new THREE.Mesh(wallGeometry(z1 - z0, height, thickness, openings, top), mat);
  m.rotation.y = -Math.PI / 2;
  m.position.set(x + thickness, y, z0);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/**
 * Flat slab from an outline [[x, z], ...] with optional holes, top face at `top`.
 */
export function slab(outline, holes, top, thickness, mat) {
  const toPath = (pts, P) => { const p = new P(); pts.forEach(([x, z], i) => (i ? p.lineTo(x, -z) : p.moveTo(x, -z))); p.closePath(); return p; };
  const s = toPath(outline, THREE.Shape);
  for (const h of holes || []) s.holes.push(toPath(h, THREE.Path));
  const g = new THREE.ExtrudeGeometry(s, { depth: thickness, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = top - thickness;
  m.castShadow = false; m.receiveShadow = true;
  return m;
}

export const rectPts = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** Hip roof over a rectangle of eave edges. Returns { geometry, ridgeY, ridge }. */
export function hipRoofGeometry(x0, z0, x1, z1, eaveY, pitch) {
  const W = x1 - x0, D = z1 - z0, run = Math.min(W, D) / 2;
  const ridgeY = eaveY + run * pitch;
  const k = Math.sqrt(1 + pitch * pitch) / pitch;
  const E = (x, z) => new V3(x, eaveY, z);
  const c00 = E(x0, z0), c10 = E(x1, z0), c11 = E(x1, z1), c01 = E(x0, z1);
  let a, b, faces;
  if (W >= D) {
    a = new V3(x0 + run, ridgeY, (z0 + z1) / 2); b = new V3(x1 - run, ridgeY, (z0 + z1) / 2);
    faces = [[c00, c10, b, a], [c11, c01, a, b], [c01, c00, a], [c10, c11, b]];
  } else {
    a = new V3((x0 + x1) / 2, ridgeY, z0 + run); b = new V3((x0 + x1) / 2, ridgeY, z1 - run);
    faces = [[c00, c10, a], [c11, c01, b], [c01, c00, a, b], [c10, c11, b, a]];
  }
  const pos = [], uv = [];
  const n = new V3(), e1 = new V3(), e2 = new V3();
  for (const f of faces) {
    const dir = f[1].clone().sub(f[0]).normalize();
    for (let i = 1; i < f.length - 1; i++) {
      let tri = [f[0], f[i], f[i + 1]];
      e1.subVectors(tri[1], tri[0]); e2.subVectors(tri[2], tri[0]); n.crossVectors(e1, e2);
      if (n.y < 0) tri = [tri[0], tri[2], tri[1]];
      for (const p of tri) {
        pos.push(p.x, p.y, p.z);
        uv.push(p.clone().sub(f[0]).dot(dir), (p.y - eaveY) * k);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return { geometry: g, ridgeY, ridge: [a, b] };
}

/** Fascia boards around a rectangular eave. */
export function fascia(x0, z0, x1, z1, eaveY, depth, mat) {
  const g = new THREE.Group(), t = 0.1, y0 = eaveY - depth, y1 = eaveY + 0.06;
  g.add(boxAt([x0, y0, z0], [x1, y1, z0 + t], mat), boxAt([x0, y0, z1 - t], [x1, y1, z1], mat));
  g.add(boxAt([x0, y0, z0], [x0 + t, y1, z1], mat), boxAt([x1 - t, y0, z0], [x1, y1, z1], mat));
  return g;
}
