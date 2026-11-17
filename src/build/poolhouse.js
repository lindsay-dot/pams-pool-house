// Pool house, lean-to, rinse station and the as-drawn kitchen, all from site.json.
import * as THREE from 'three';
import { boxAt, wallX, wallZ, hipRoofGeometry, fascia } from './helpers.js';

const GROUND = -0.333; // lawn sits one 4" slab below the slab top

export function buildPoolHouse(site, M) {
  const g = new THREE.Group(); g.name = 'poolHouse';
  const ph = site.poolHouse, band = ph.enclosedBand, roof = ph.roof, fp = ph.fireplace;
  const H = band.wallHeight, t = band.wallThickness;
  const [sx0, sz0] = ph.slab.outline[0], [sx1, sz1] = ph.slab.outline[2];
  const bandZ = band.outline[2][1]; // where the enclosed part ends and the porch begins
  const door = (id) => ph.doors.find((d) => d.id === id);
  const pitch = 8 / 12, over = roof.overhang;

  // slab
  g.add(boxAt([sx0, GROUND, sz0], [sx1, 0, sz1], M.slab, { shadow: false }));

  // --- enclosed back section -------------------------------------------------
  const gd = door('garage'), sd = door('service'), std = door('storage'), bd = door('bath'), win = ph.windows[0];
  g.add(wallX({ x0: sx0, x1: sx1, z: sz0, thickness: t, height: H, mat: M.siding,
    openings: [{ a: sd.from[0], b: sd.to[0], y0: 0, y1: sd.height }] }));
  g.add(wallZ({ z0: sz0, z1: bandZ, x: sx0, thickness: t, height: H, mat: M.siding,
    openings: [{ a: gd.from[1], b: gd.to[1], y0: 0, y1: gd.height }] }));
  g.add(wallZ({ z0: sz0, z1: bandZ, x: sx1 - t, thickness: t, height: H, mat: M.siding,
    openings: [{ a: win.from[1], b: win.to[1], y0: win.sillHeight, y1: win.sillHeight + win.height }] }));
  // porch-side wall rises to meet the underside of the hip roof
  const topY = roof.eaveHeight + (bandZ - t + over) * pitch - 0.06;
  const xr = (topY - roof.eaveHeight) / pitch - over;
  g.add(wallX({ x0: sx0, x1: sx1, z: bandZ - t, thickness: t, height: H, mat: M.siding,
    top: [[0, H - 0.15], [xr, topY - 0.15], [sx1 - xr, topY - 0.15], [sx1, H - 0.15]],
    openings: [{ a: std.from[0], b: std.to[0], y0: 0, y1: std.height }, { a: bd.from[0], b: bd.to[0], y0: 0, y1: bd.height }] }));
  g.add(boxAt([20, 0, t], [20 + t, H, bandZ - t], M.siding));               // partition
  g.add(boxAt([t, H - 0.2, t], [sx1 - t, H - 0.1, bandZ - t], M.trim));           // flat ceiling over the rooms

  // brick base course, outside faces
  const bh = ph.exteriorAsDrawn.brickBaseHeight, p = 0.06;
  const base = (a, b) => g.add(boxAt(a, b, M.brick));
  base([sx0, GROUND, sz0 - p], [sd.from[0], bh, sz0]); base([sd.to[0], GROUND, sz0 - p], [sx1, bh, sz0]);
  base([sx0 - p, GROUND, sz0], [sx0, bh, gd.from[1]]); base([sx0 - p, GROUND, gd.to[1]], [sx0, bh, bandZ]);
  base([sx1, GROUND, sz0], [sx1 + p, bh, bandZ]);
  base([sx0, 0, bandZ], [std.from[0], bh, bandZ + p]); base([std.to[0], 0, bandZ], [fp.footprint[0][0], bh, bandZ + p]);
  base([fp.footprint[1][0], 0, bandZ], [bd.from[0], bh, bandZ + p]); base([bd.to[0], 0, bandZ], [sx1, bh, bandZ + p]);

  // doors
  const doors = new THREE.Group(); doors.name = 'doors';
  const garage = boxAt([sx0 + 0.12, 0, gd.from[1]], [sx0 + 0.3, gd.height, gd.to[1]], M.garageDoor); garage.name = 'garageDoor';
  doors.add(garage);
  doors.add(boxAt([sd.from[0], sd.curbIn / 12, sz0 + 0.15], [sd.to[0], sd.height, sz0 + 0.3], M.serviceDoor));
  doors.add(boxAt([sd.from[0] - 0.2, GROUND, sz0 - 0.5], [sd.to[0] + 0.2, sd.curbIn / 12, sz0 + t], M.slab));
  for (const d of [std, bd]) {
    const z = bandZ - 0.32;
    doors.add(boxAt([d.from[0], 0, z], [d.to[0], d.height, z + 0.16], M.doorWood));
    doors.add(boxAt([d.from[0] + 0.45, 4, z + 0.15], [d.to[0] - 0.45, 6.5, z + 0.19], M.glass));
    doors.add(boxAt([d.from[0] + 0.2, 3.3, z + 0.16], [d.from[0] + 0.3, 3.75, z + 0.3], M.black)); // handle
  }
  g.add(doors);

  // high bath window
  const wy0 = win.sillHeight, wy1 = win.sillHeight + win.height, wz0 = win.from[1], wz1 = win.to[1];
  g.add(boxAt([sx1 - 0.3, wy0, wz0], [sx1 - 0.22, wy1, wz1], M.glass));
  const tr = 0.25, tx0 = sx1, tx1 = sx1 + 0.08;
  g.add(boxAt([tx0, wy0 - tr, wz0 - tr], [tx1, wy0, wz1 + tr], M.trim), boxAt([tx0, wy1, wz0 - tr], [tx1, wy1 + tr, wz1 + tr], M.trim));
  g.add(boxAt([tx0, wy0, wz0 - tr], [tx1, wy1, wz0], M.trim), boxAt([tx0, wy0, wz1], [tx1, wy1, wz1 + tr], M.trim));

  // sconces either side of the fireplace
  for (const x of [6.4, 23.6]) g.add(boxAt([x - 0.2, 5.1, bandZ], [x + 0.2, 6, bandZ + 0.28], M.black));

  // --- porch: columns on brick piers, beams -----------------------------------
  const col = ph.columns, cs = col.size / 2, ps = col.pier.width / 2, beamY = 9.3;
  for (const [cx, cz] of col.centers) {
    const x = Math.min(Math.max(cx, sx0 + cs), sx1 - cs), z = Math.min(Math.max(cz, sz0 + cs), sz1 - cs);
    g.add(boxAt([x - ps, 0, z - ps], [x + ps, col.pier.height, z + ps], M.brick));
    g.add(boxAt([x - cs, col.pier.height, z - cs], [x + cs, beamY, z + cs], M.timber));
  }
  const bw = col.size;
  g.add(boxAt([sx0, beamY, sz1 - bw], [sx1, H, sz1], M.stain));
  g.add(boxAt([sx0, beamY, bandZ], [sx0 + bw, H, sz1 - bw], M.stain));
  g.add(boxAt([sx1 - bw, beamY, bandZ], [sx1, H, sz1 - bw], M.stain));

  // --- fireplace ----------------------------------------------------------------
  const [fx0, fz0] = fp.footprint[0], [fx1, fz1] = fp.footprint[2], fc = (fx0 + fx1) / 2;
  const hr = fp.hearth.raisedIn / 12;
  g.add(boxAt([fx0, 0, fz0], [fx1, fp.massHeight, fz1], M.brick));
  g.add(boxAt([fc - fp.hearth.width / 2, 0, fz1], [fc + fp.hearth.width / 2, hr, fz1 + 1], M.hearth));
  g.add(boxAt([fc - fp.firebox.width / 2, hr, fz1 - 0.2], [fc + fp.firebox.width / 2, 4.5, fz1 + 0.03], M.firebox));
  for (const x of [fx0 + 0.6, fx1 - 0.6 - fp.woodBoxes.width])
    g.add(boxAt([x, 1, fz1 - 0.1], [x + fp.woodBoxes.width - 0.1, 4.25, fz1 + 0.04], M.stone));
  g.add(boxAt([fc - fp.mantel.width / 2, fp.mantel.heightToUnderside, fz1], [fc + fp.mantel.width / 2, fp.mantel.heightToUnderside + 0.85, fz1 + 0.8], M.stain));
  const ch = fp.chimney, capH = 0.8;
  g.add(boxAt([fc - ch.width / 2, fp.massHeight, fz0], [fc + ch.width / 2, ch.topHeight - capH, fz1], M.brickDark));
  g.add(boxAt([fc - ch.width / 2 - 0.5, ch.topHeight - capH, fz0 - 0.4], [fc + ch.width / 2 + 0.5, ch.topHeight, fz1 + 0.4], M.brick));

  // --- hip roof -------------------------------------------------------------------
  const e = roof.eaveOutline;
  const hip = hipRoofGeometry(e[0][0], e[0][1], e[2][0], e[2][1], roof.eaveHeight, pitch);
  const top = new THREE.Mesh(hip.geometry, M.roof); top.name = 'roof'; top.castShadow = true; top.receiveShadow = true;
  const under = new THREE.Mesh(hip.geometry, M.ceilingWood); under.name = 'ceiling'; under.receiveShadow = true;
  g.add(top, under, fascia(e[0][0], e[0][1], e[2][0], e[2][1], roof.eaveHeight, 0.55, M.trim));

  // --- lean-to ---------------------------------------------------------------------
  const lt = site.leanTo, [lx0, lz0] = lt.outline[0], [lx1, lz1] = lt.outline[2];
  g.add(boxAt([lx0, GROUND - 0.1, lz0], [lx1, GROUND + 0.06, lz1], M.gravel, { shadow: false }));
  const lp = lt.posts.size / 2, slope = 3 / 12, hi = lt.roof.highSideHeight;
  const roofAt = (z) => hi + (z - lz1) * slope; // z is negative behind the wall
  for (const [px0] of lt.posts.centers) {
    const x = Math.min(Math.max(px0, lx0 + lp), lx1 - lp), z = lz0 + lp;
    g.add(boxAt([x - lp, GROUND, z - lp], [x + lp, roofAt(z) - 0.25, z + lp], M.timber));
  }
  g.add(boxAt([lx0, roofAt(lz0 + lp) - 0.75, lz0], [lx1, roofAt(lz0 + lp) - 0.2, lz0 + 2 * lp], M.timber));
  const run = lz1 - lz0 + 0.6, len = Math.hypot(run, run * slope);
  const lroof = boxAt([-15.5, -0.07, -len / 2], [15.5, 0.07, len / 2], M.metalRoof);
  lroof.name = 'leanToRoof';
  lroof.rotation.x = -Math.atan(slope);
  lroof.position.set((lx0 + lx1) / 2, hi - (run / 2) * slope, lz1 - run / 2);
  g.add(lroof);

  // --- rinse station ---------------------------------------------------------------
  const rs = site.rinseStation, [rx0, rz0] = rs.pad[0], [rx1, rz1] = rs.pad[2], rc = (rz0 + rz1) / 2;
  g.add(boxAt([rx0, GROUND, rz0], [rx1, 0, rz1], M.slab, { shadow: false }));
  g.add(boxAt([rx0 + p, 1.2, rc - rs.backerPanel.width / 2], [rx0 + p + 0.1, 1.2 + rs.backerPanel.height, rc + rs.backerPanel.width / 2], M.doorWood));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 12), M.steel); pipe.position.set(rx0 + 0.32, 4, rc - 0.6); pipe.castShadow = true;
  const arm = boxAt([rx0 + 0.32, 6.44, rc - 0.65], [rx0 + 1.1, 6.54, rc - 0.55], M.steel);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20), M.steel); head.position.set(rx0 + 1.1, 6.4, rc - 0.6);
  g.add(pipe, arm, head, boxAt([rx0 + p, 1.6, rc + 0.5], [rx0 + 0.35, 1.85, rc + 0.75], M.black));

  return g;
}
