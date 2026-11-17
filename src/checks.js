// Friendly warnings. These never change anything; they only tell her what to look at.
import { rectPoly, overlap, place } from './geom2d.js';
import { furnitureDef, itemPolys, itemOutline, onHardSurface } from './furniture.js';

const lower = (s) => s.replace(/ \(.*\)$/, '').toLowerCase().replace('adirondack', 'Adirondack');

/** Fixed things furniture can run into, and the clear space doors need. */
export function siteShapes(site, plan) {
  const ph = site.poolHouse, band = ph.enclosedBand.outline, fp = ph.fireplace.footprint;
  const obstacles = [
    { name: 'the pool house wall', poly: rectPoly(band[0][0], band[0][1], band[2][0], band[2][1]) },
    { name: 'the fireplace', poly: rectPoly(fp[0][0], fp[0][1], fp[2][0], fp[2][1] + 1) },
  ];
  const ps = ph.columns.pier.width / 2, cs = ph.columns.size / 2, slab = ph.slab.outline;
  for (const [cx, cz] of ph.columns.centers) {
    const x = Math.min(Math.max(cx, slab[0][0] + cs), slab[2][0] - cs), z = Math.min(Math.max(cz, slab[0][1] + cs), slab[2][1] - cs);
    obstacles.push({ name: 'a porch column', poly: rectPoly(x - ps, z - ps, x + ps, z + ps) });
  }
  for (const poly of plan.footprints) obstacles.push({ name: 'the outdoor kitchen', poly });
  const h = site.existingHouse;
  for (const part of [h.body, h.wing]) obstacles.push({ name: 'the house', poly: part.outline });
  const porch = h.backPorch.outline;
  obstacles.push({ name: 'the house porch', poly: rectPoly(porch[0][0], porch[0][1] + 1, h.body.outline[1][0], porch[2][1]) });
  for (const run of site.fence.runs) for (let i = 0; i < run.length - 1; i++) {
    const [ax, az] = run[i], [bx, bz] = run[i + 1];
    obstacles.push({ name: 'the fence', poly: rectPoly(Math.min(ax, bx) - 0.15, Math.min(az, bz) - 0.15, Math.max(ax, bx) + 0.15, Math.max(az, bz) + 0.15) });
  }
  const lt = site.leanTo;
  for (const [x, z] of lt.posts.centers) obstacles.push({ name: 'a lean-to post', poly: rectPoly(x - 0.5, z - 0.1, x + 0.5, z + 0.9) });

  const CLEAR = 3, doors = [];
  for (const d of ph.doors) {
    const [ax, az] = d.from, [bx, bz] = d.to;
    const name = { garage: 'the storage garage door', service: 'the service door', storage: 'the storage door', bath: 'the bath door' }[d.id];
    if (d.wall === 'west') doors.push({ name, poly: rectPoly(ax - CLEAR - 1, az, ax, bz) });
    else if (d.wall === 'north') doors.push({ name, poly: rectPoly(ax, az - CLEAR, bx, az) });
    else doors.push({ name, poly: rectPoly(ax, az, bx, az + CLEAR) });
  }
  for (const g of site.fence.gates) doors.push({ name: 'a fence gate', poly: rectPoly(g.at[0] - CLEAR, g.at[1] - g.width / 2, g.at[0] + CLEAR, g.at[1] + g.width / 2) });
  const c = (porch[0][0] + porch[1][0]) / 2;
  doors.push({ name: 'the steps to the house', poly: rectPoly(c - 5.5, porch[0][1] - CLEAR, c + 5.5, porch[0][1] + 1) });

  return { obstacles, doors, pool: site.pool.outline, porchRoof: ph.porch.outline };
}

/**
 * Returns { messages: [text], bad: Set(itemId) }.
 * `items` can be passed in to check a piece while it is being dragged.
 */
export function checkDesign(site, design, plan, items = design.items) {
  const shapes = siteShapes(site, plan);
  const messages = [], bad = new Set();
  const say = (id, text) => { messages.push(text); if (id) bad.add(id); };

  if (plan.unplaced.length) say(null, `Not everything fits in this kitchen. Left out: ${plan.unplaced.map((a) => lower(a.name)).join(', ')}. Take something out, or pick a bigger kitchen shape.`);

  const polysOf = new Map(items.map((it) => [it.id, itemPolys(it)]));
  const hits = (id, poly) => polysOf.get(id).some((p) => overlap(p, poly));
  const pergolas = items.filter((it) => it.type === 'pergola');

  for (const it of items) {
    const def = furnitureDef(it.type), name = lower(def.name);

    if (def.overhead) {
      const spot = place(rectPoly(-0.5, -0.5, 0.5, 0.5), it.x, it.z, 0);
      const covered = overlap(spot, shapes.porchRoof) || pergolas.some((p) => overlap(spot, itemOutline(p)));
      if (!covered) say(it.id, `The ${name} needs a roof over it. Move it under the pool house porch or a pergola.`);
      continue;
    }
    if (hits(it.id, shapes.pool)) { say(it.id, `The ${name} is over the pool. Slide it back onto the deck.`); continue; }

    const corners = itemOutline(it), hard = corners.filter((p) => onHardSurface(site, p)).length;
    if (hard > 0 && hard < corners.length && def.type !== 'pergola') say(it.id, `The ${name} is hanging off the edge of the deck or porch.`);
    if (def.flat) continue;

    const door = shapes.doors.find((d) => hits(it.id, d.poly));
    if (door) { say(it.id, `The ${name} is blocking ${door.name}. Leave about 3 feet clear in front of it.`); continue; }
    const wall = shapes.obstacles.find((o) => hits(it.id, o.poly));
    if (wall) { say(it.id, `The ${name} does not fit there. It runs into ${wall.name}.`); continue; }
  }

  // two pieces on top of each other (rugs, fans and things under a pergola are fine)
  const solid = items.filter((it) => { const d = furnitureDef(it.type); return !d.flat && !d.overhead; });
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const A = solid[i], B = solid[j];
    if (polysOf.get(A.id).some((p) => polysOf.get(B.id).some((q) => overlap(p, q)))) {
      say(A.id, `The ${lower(furnitureDef(A.type).name)} and the ${lower(furnitureDef(B.type).name)} are on top of each other.`);
      bad.add(B.id);
    }
  }
  return { messages, bad };
}
