// Pool, coping, deck and fence from site.json.
import * as THREE from 'three';
import { boxAt, slab, rectPts } from './helpers.js';

export function buildPoolAndDeck(site, M) {
  const g = new THREE.Group(); g.name = 'poolArea';
  const pool = site.pool, [x0, z0] = pool.outline[0], [x1, z1] = pool.outline[2];
  const waterY = -pool.waterBelowDeckIn / 12;
  const shallowY = waterY - pool.depthShallow, deepY = waterY - pool.depthDeep;
  const len = z1 - z0, zDeepEnd = z0 + len * 0.3, zShallowStart = z0 + len * 0.62; // slope between the two flats

  // deck with the pool cut out, coping as a 12" band around the opening
  const cw = 1, c = rectPts(x0 - cw, z0 - cw, x1 + cw, z1 + cw);
  const deck = slab(site.poolDeck.outline, [c], 0, 0.333, M.deck); deck.name = 'deck';
  const coping = slab(c, [pool.outline], 0.045, 0.2, M.coping); coping.name = 'coping';
  g.add(deck, coping);

  // shell: side walls follow the floor profile
  const side = new THREE.Shape();
  [[z0, 0], [z1, 0], [z1, shallowY], [zShallowStart, shallowY], [zDeepEnd, deepY], [z0, deepY]].forEach(([z, y], i) => (i ? side.lineTo(z, y) : side.moveTo(z, y)));
  for (const x of [x0, x1]) {
    const w = new THREE.Mesh(new THREE.ShapeGeometry(side), M.poolFinish);
    w.rotation.y = -Math.PI / 2; w.position.x = x; w.receiveShadow = true; g.add(w);
  }
  const quad = (pts) => {
    const geo = new THREE.BufferGeometry();
    const [a, b, cc, d] = pts;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...cc, ...a, ...cc, ...d], 3));
    const upright = a[2] === cc[2];
    const uv = (p) => [p[0], upright ? p[1] : p[2]];
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([a, b, cc, a, cc, d].flatMap(uv), 2));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.poolFinish); m.receiveShadow = true; g.add(m);
  };
  quad([[x0, 0, z0], [x1, 0, z0], [x1, deepY, z0], [x0, deepY, z0]]);                         // deep end wall
  quad([[x0, 0, z1], [x1, 0, z1], [x1, shallowY, z1], [x0, shallowY, z1]]);                   // house end wall
  quad([[x0, deepY, z0], [x1, deepY, z0], [x1, deepY, zDeepEnd], [x0, deepY, zDeepEnd]]);     // deep floor
  quad([[x0, deepY, zDeepEnd], [x1, deepY, zDeepEnd], [x1, shallowY, zShallowStart], [x0, shallowY, zShallowStart]]);
  quad([[x0, shallowY, zShallowStart], [x1, shallowY, zShallowStart], [x1, shallowY, z1], [x0, shallowY, z1]]);

  // waterline tile: 6" band just under the coping
  const tb = waterY - 0.25, i = 0.03;
  const tiles = new THREE.Group(); tiles.name = 'waterlineTile';
  tiles.add(boxAt([x0, tb, z0], [x1, 0, z0 + i], M.waterlineTile, { shadow: false }), boxAt([x0, tb, z1 - i], [x1, 0, z1], M.waterlineTile, { shadow: false }));
  tiles.add(boxAt([x0, tb, z0], [x0 + i, 0, z1], M.waterlineTile, { shadow: false }), boxAt([x1 - i, tb, z0], [x1, 0, z1], M.waterlineTile, { shadow: false }));
  g.add(tiles);

  // steps at the house end
  const st = pool.steps, [sx0] = st.outline[0], [sx1, sz1] = st.outline[2];
  const n = st.treads, tread = (sz1 - st.outline[0][1]) / n, rise = pool.depthShallow / (n + 1);
  for (let k = 1; k <= n; k++)
    g.add(boxAt([sx0, shallowY, sz1 - k * tread], [sx1, waterY - rise * k, sz1 - (k - 1) * tread], M.poolFinish, { shadow: false }));

  // water
  const water = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, len), M.water);
  water.name = 'water';
  const wuv = water.geometry.attributes.uv;
  for (let k = 0; k < wuv.count; k++) wuv.setXY(k, wuv.getX(k) * (x1 - x0), wuv.getY(k) * len);
  water.rotation.x = -Math.PI / 2;
  water.position.set((x0 + x1) / 2, waterY, (z0 + z1) / 2);
  water.receiveShadow = true;
  g.add(water);

  return g;
}

export function buildFence(site, M) {
  const g = new THREE.Group(); g.name = 'fence';
  const f = site.fence, H = f.height, base = -0.333, postEvery = 6, picketEvery = 0.333;
  const pickets = [], dummy = new THREE.Object3D();

  for (const run of f.runs) {
    for (let s = 0; s < run.length - 1; s++) {
      const [ax, az] = run[s], [bx, bz] = run[s + 1];
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const alongX = Math.abs(ux) > 0.5;
      const bays = Math.max(1, Math.round(L / postEvery));
      for (let k = 0; k <= bays; k++) {
        const x = ax + ux * (L * k) / bays, z = az + uz * (L * k) / bays;
        g.add(boxAt([x - 0.09, base, z - 0.09], [x + 0.09, H + 0.15, z + 0.09], M.fence));
      }
      for (const y of [0.45, H - 0.35]) {
        const a = [Math.min(ax, bx) - (alongX ? 0 : 0.04), y, Math.min(az, bz) - (alongX ? 0.04 : 0)];
        const b = [Math.max(ax, bx) + (alongX ? 0 : 0.04), y + 0.12, Math.max(az, bz) + (alongX ? 0.04 : 0)];
        g.add(boxAt(a, b, M.fence));
      }
      for (let d = picketEvery; d < L; d += picketEvery) pickets.push([ax + ux * d, az + uz * d]);
    }
  }
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, H - 0.25, 0.055), M.fence, pickets.length);
  pickets.forEach(([x, z], k) => { dummy.position.set(x, (H - 0.25) / 2 + 0.25, z); dummy.updateMatrix(); inst.setMatrixAt(k, dummy.matrix); });
  inst.castShadow = true;
  g.add(inst);

  // gates: taller posts either side and a latch so they read as gates
  for (const gt of f.gates) {
    const [x, z] = gt.at, half = gt.width / 2;
    for (const dz of [-half, half]) g.add(boxAt([x - 0.13, base, z + dz - 0.13], [x + 0.13, H + 0.7, z + dz + 0.13], M.fence));
    g.add(boxAt([x - 0.12, H - 0.9, z + half - 0.5], [x + 0.12, H - 0.6, z + half - 0.2], M.steel));
  }
  return g;
}
