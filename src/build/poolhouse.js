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

  // --- enclosed back section: every door, window and the dividing wall come from site.json ---
  const along = (o) => (o.wall === 'west' || o.wall === 'east' ? [o.from[1], o.to[1]] : [o.from[0], o.to[0]]);
  const onWall = (name) => (o) => (name === 'south' ? o.wall.startsWith('south') : o.wall === name);
  const openings = (name) => [
    ...ph.doors.filter(onWall(name)).map((d) => ({ a: along(d)[0], b: along(d)[1], y0: 0, y1: d.height })),
    ...ph.windows.filter(onWall(name)).map((w) => ({ a: along(w)[0], b: along(w)[1], y0: w.sillHeight, y1: w.sillHeight + w.height })),
  ];
  g.add(wallX({ x0: sx0, x1: sx1, z: sz0, thickness: t, height: H, mat: M.siding, openings: openings('north') }));
  g.add(wallZ({ z0: sz0, z1: bandZ, x: sx0, thickness: t, height: H, mat: M.siding, openings: openings('west') }));
  g.add(wallZ({ z0: sz0, z1: bandZ, x: sx1 - t, thickness: t, height: H, mat: M.siding, openings: openings('east') }));
  // porch-side wall rises to meet the underside of the hip roof
  const topY = roof.eaveHeight + (bandZ - t + over) * pitch - 0.06;
  const xr = (topY - roof.eaveHeight) / pitch - over;
  g.add(wallX({ x0: sx0, x1: sx1, z: bandZ - t, thickness: t, height: H, mat: M.siding,
    top: [[0, H - 0.15], [xr, topY - 0.15], [sx1 - xr, topY - 0.15], [sx1, H - 0.15]], openings: openings('south') }));
  const partX = band.walls.find((w) => w.id === 'partition').from[0];
  g.add(boxAt([partX - t / 2, 0, t], [partX + t / 2, H, bandZ - t], M.siding));
  g.add(boxAt([t, H - 0.2, t], [sx1 - t, H - 0.1, bandZ - t], M.trim));           // flat ceiling over the rooms

  // brick base course on the outside faces, skipping doorways (and the fireplace on the porch side)
  const bh = ph.exteriorAsDrawn.brickBaseHeight, p = 0.06;
  const stretches = (from, to, gaps) => {
    const out = []; let at = from;
    for (const [g0, g1] of gaps.sort((m, n) => m[0] - n[0])) { if (g0 > at) out.push([at, g0]); at = Math.max(at, g1); }
    if (to > at) out.push([at, to]);
    return out;
  };
  const doorGaps = (name) => ph.doors.filter(onWall(name)).map(along);
  for (const [u0, u1] of stretches(sx0, sx1, doorGaps('north'))) g.add(boxAt([u0, GROUND, sz0 - p], [u1, bh, sz0], M.brick));
  for (const [u0, u1] of stretches(sz0, bandZ, doorGaps('west'))) g.add(boxAt([sx0 - p, GROUND, u0], [sx0, bh, u1], M.brick));
  for (const [u0, u1] of stretches(sz0, bandZ, doorGaps('east'))) g.add(boxAt([sx1, GROUND, u0], [sx1 + p, bh, u1], M.brick));
  for (const [u0, u1] of stretches(sx0, sx1, [...doorGaps('south'), [fp.footprint[0][0], fp.footprint[1][0]]])) g.add(boxAt([u0, 0, bandZ], [u1, bh, bandZ + p], M.brick));

  // doors
  const doors = new THREE.Group(); doors.name = 'doors';
  for (const d of ph.doors) {
    const [u0, u1] = along(d);
    if (d.id === 'garage') {
      // overhead door sits just inside whichever end wall it is on
      const x = d.wall === 'west' ? [sx0 + 0.12, sx0 + 0.3] : [sx1 - 0.3, sx1 - 0.12];
      const garage = boxAt([x[0], 0, u0], [x[1], d.height, u1], M.garageDoor); garage.name = 'garageDoor';
      doors.add(garage);
    } else if (d.wall === 'north') {
      const curb = (d.curbIn || 0) / 12;
      doors.add(boxAt([u0, curb, sz0 + 0.15], [u1, d.height, sz0 + 0.3], M.serviceDoor));
      doors.add(boxAt([u0 - 0.2, GROUND, sz0 - 0.5], [u1 + 0.2, curb, sz0 + t], M.slab));
    } else {
      const z = bandZ - 0.32;
      doors.add(boxAt([u0, 0, z], [u1, d.height, z + 0.16], M.doorWood));
      doors.add(boxAt([u0 + 0.45, 4, z + 0.15], [u1 - 0.45, 6.5, z + 0.19], M.glass));
      doors.add(boxAt([u0 + 0.2, 3.3, z + 0.16], [u0 + 0.3, 3.75, z + 0.3], M.black)); // handle
    }
  }
  g.add(doors);

  // high bath window, glass set in the wall with trim on the outside face
  for (const w of ph.windows) {
    const wy0 = w.sillHeight, wy1 = w.sillHeight + w.height, [wz0, wz1] = along(w), west = w.wall === 'west';
    const gx = west ? [sx0 + 0.22, sx0 + 0.3] : [sx1 - 0.3, sx1 - 0.22];
    g.add(boxAt([gx[0], wy0, wz0], [gx[1], wy1, wz1], M.glass));
    const tr = 0.25, tx0 = west ? sx0 - 0.08 : sx1, tx1 = west ? sx0 : sx1 + 0.08;
    g.add(boxAt([tx0, wy0 - tr, wz0 - tr], [tx1, wy0, wz1 + tr], M.trim), boxAt([tx0, wy1, wz0 - tr], [tx1, wy1 + tr, wz1 + tr], M.trim));
    g.add(boxAt([tx0, wy0, wz0 - tr], [tx1, wy1, wz0], M.trim), boxAt([tx0, wy0, wz1], [tx1, wy1, wz1 + tr], M.trim));
  }

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

  // --- rinse station (removed in Rev. J; built only if site.json has one) ------------
  if (site.rinseStation) {
  const rs = site.rinseStation, [rx0, rz0] = rs.pad[0], [rx1, rz1] = rs.pad[2], rc = (rz0 + rz1) / 2;
  g.add(boxAt([rx0, GROUND, rz0], [rx1, 0, rz1], M.slab, { shadow: false }));
  g.add(boxAt([rx0 + p, 1.2, rc - rs.backerPanel.width / 2], [rx0 + p + 0.1, 1.2 + rs.backerPanel.height, rc + rs.backerPanel.width / 2], M.doorWood));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 12), M.steel); pipe.position.set(rx0 + 0.32, 4, rc - 0.6); pipe.castShadow = true;
  const arm = boxAt([rx0 + 0.32, 6.44, rc - 0.65], [rx0 + 1.1, 6.54, rc - 0.55], M.steel);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20), M.steel); head.position.set(rx0 + 1.1, 6.4, rc - 0.6);
  g.add(pipe, arm, head, boxAt([rx0 + p, 1.6, rc + 0.5], [rx0 + 0.35, 1.85, rc + 0.75], M.black));
  }

  return g;
}

/** Rainwater harvesting: gutters, downspouts and the lids of the underground tank. */
export function buildRainwater(site, M) {
  const g = new THREE.Group(); g.name = 'rainwater';
  const rw = site.rainwater;
  if (!rw) return g;
  const roof = site.poolHouse.roof, e = roof.eaveOutline, y = roof.eaveHeight, w = rw.gutters.widthIn / 12, h = 0.38;
  const [x0, z0] = e[0], [x1, z1] = e[2];
  // gutters hang just outside the fascia on all four eaves
  g.add(boxAt([x0 - w, y - h, z0 - w], [x1 + w, y, z0], M.trim), boxAt([x0 - w, y - h, z1], [x1 + w, y, z1 + w], M.trim));
  g.add(boxAt([x0 - w, y - h, z0], [x0, y, z1], M.trim), boxAt([x1, y - h, z0], [x1 + w, y, z1], M.trim));
  // lean-to: one gutter along the low edge
  const lt = site.leanTo, lz0 = lt.outline[0][1], lowY = lt.roof.highSideHeight - (lt.outline[2][1] - lz0 + 0.6) * 0.25;
  g.add(boxAt([lt.outline[0][0] - 0.5, lowY - h, lz0 - 0.6 - w], [lt.outline[2][0] + 0.5, lowY, lz0 - 0.6], M.trim));
  // downspouts: a short run back from the gutter, then straight down into the ground
  for (const d of rw.downspouts) {
    const [ax, az] = d.at, [fx, fz] = d.from, s = 0.14;
    g.add(boxAt([ax - s, -0.333, az - s], [ax + s, d.top, az + s], M.trim));
    g.add(boxAt([Math.min(ax, fx) - s, d.top - 0.05, Math.min(az, fz) - s], [Math.max(ax, fx) + s, d.top + 2 * s, Math.max(az, fz) + s], M.trim));
  }
  // the tank is underground: only its two access lids show in the lawn
  for (const [lx, lz] of rw.tank.accessLids) {
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 28), M.tankLid);
    lid.position.set(lx, -0.333 + 0.06, lz); lid.receiveShadow = true;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 28), M.slab);
    collar.position.set(lx, -0.333 + 0.03, lz); collar.receiveShadow = true;
    g.add(collar, lid);
  }
  return g;
}
