// Lawn, tree line and the existing house (a backdrop estimated from photos).
import * as THREE from 'three';
import { boxAt, hipRoofGeometry, fascia } from './helpers.js';

const GROUND = -0.333;

export function buildGrounds(site, M) {
  const g = new THREE.Group(); g.name = 'grounds';
  // lawn with the pool cut out of it, so the water is not hidden under grass
  const R = 2500, shape = new THREE.Shape();
  shape.moveTo(-R, -R); shape.lineTo(R, -R); shape.lineTo(R, R); shape.lineTo(-R, R); shape.closePath();
  const hole = new THREE.Path();
  site.pool.outline.forEach(([x, z], i) => (i ? hole.lineTo(x, -z) : hole.moveTo(x, -z)));
  hole.closePath(); shape.holes.push(hole);
  const lawn = new THREE.Mesh(new THREE.ShapeGeometry(shape), M.grass);
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = GROUND; lawn.receiveShadow = true;
  g.add(lawn);

  // tree line around the open acreage
  let s = 12345; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const N = 700, dummy = new THREE.Object3D();
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.7, 1, 1, 6), M.trunk, N);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), M.leaves, N);
  const pines = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), M.pine, N);
  let nc = 0, np = 0;
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = 230 + r() * 240, h = 40 + r() * 35;
    const x = 15 + Math.cos(a) * d, z = 40 + Math.sin(a) * d;
    dummy.rotation.set(0, r() * 6, 0);
    dummy.position.set(x, GROUND + h * 0.22, z); dummy.scale.set(1, h * 0.45, 1); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    if (r() < 0.3) {
      dummy.position.set(x, GROUND + h * 0.62, z); dummy.scale.set(h * 0.2, h * 0.8, h * 0.2); dummy.updateMatrix(); pines.setMatrixAt(np++, dummy.matrix);
    } else {
      const w = h * (0.3 + r() * 0.12);
      dummy.position.set(x, GROUND + h * 0.68, z); dummy.scale.set(w, h * 0.4, w); dummy.updateMatrix(); crowns.setMatrixAt(nc++, dummy.matrix);
    }
  }
  crowns.count = nc; pines.count = np;
  g.add(trunks, crowns, pines);
  return g;
}

export function buildHouse(site, M) {
  const g = new THREE.Group(); g.name = 'existingHouse';
  const h = site.existingHouse, top = h.wallHeight + h.backPorch.floorHeight;
  const [bx0, bz0] = h.body.outline[0], [bx1, bz1] = h.body.outline[2];
  const [wx0, wz0] = h.wing.outline[0], [wx1, wz1] = h.wing.outline[2];
  const [px0, pz0] = h.backPorch.outline[0], [px1, pz1] = h.backPorch.outline[2];
  const fl = h.backPorch.floorHeight, brickH = 3.2, p = 0.08;

  // walls + brick base
  g.add(boxAt([bx0, GROUND, bz0], [bx1, top, bz1], M.houseSiding), boxAt([wx0, GROUND, wz0], [wx1, top, wz1], M.houseSiding));
  g.add(boxAt([bx0 - p, GROUND, bz0 + 0.02], [bx1 + p, brickH, bz1 + p], M.houseBrick));
  g.add(boxAt([wx0 - p, GROUND, wz0 - p], [wx1 + p, brickH, wz1 + 0.02], M.houseBrick));

  // back porch: brick floor, two steps, dark posts
  const floorZ = pz0 + 1;
  g.add(boxAt([px0, GROUND, floorZ], [bx1, fl, pz1], M.houseBrick));
  const c = (px0 + px1) / 2;
  g.add(boxAt([c - 5.5, GROUND, pz0], [c + 5.5, fl / 3, floorZ], M.houseBrick), boxAt([c - 5.5, GROUND, pz0 + 0.5], [c + 5.5, (fl * 2) / 3, floorZ], M.houseBrick));
  const ceil = top - 0.7, n = h.backPorch.posts.count;
  for (let i = 0; i < n; i++) {
    const x = px0 + 0.5 + ((px1 - px0 - 0.2) * i) / (n - 1);
    g.add(boxAt([x - 0.3, fl, floorZ + 0.2], [x + 0.3, ceil, floorZ + 0.8], M.housePost));
  }
  g.add(boxAt([px0, ceil, pz0 - 1.4], [bx1 + 1.4, top, pz1], M.trim));

  // French doors and a window on the porch wall
  g.add(boxAt([c - 4.2, fl, pz1 - 0.12], [c + 2.2, fl + 7, pz1], M.trim), boxAt([c - 3.9, fl + 0.5, pz1 - 0.16], [c - 1.15, fl + 6.7, pz1 - 0.12], M.glass), boxAt([c - 0.85, fl + 0.5, pz1 - 0.16], [c + 1.9, fl + 6.7, pz1 - 0.12], M.glass));
  g.add(boxAt([c + 6, fl + 3, pz1 - 0.12], [c + 9.4, fl + 7, pz1], M.trim), boxAt([c + 6.25, fl + 3.25, pz1 - 0.16], [c + 9.15, fl + 6.75, pz1 - 0.12], M.glass));

  // one hip roof over the body, wing and porch
  const o = 1.5, rx0 = bx0 - o, rz0 = wz0 - o, rx1 = bx1 + o, rz1 = bz1 + o;
  const hip = hipRoofGeometry(rx0, rz0, rx1, rz1, top, 8 / 12);
  const roof = new THREE.Mesh(hip.geometry, M.houseRoof); roof.castShadow = true; roof.receiveShadow = true;
  const under = new THREE.Mesh(hip.geometry, new THREE.MeshStandardMaterial({ color: '#efece4', side: THREE.BackSide }));
  g.add(roof, under, fascia(rx0, rz0, rx1, rz1, top, 0.6, M.trim));
  return g;
}
