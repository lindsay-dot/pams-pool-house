// Flat (top-down) shape helpers, in feet. Points are [x, z].
export const rectPoly = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** Move and turn a shape the same way Three.js turns an object around its up axis. */
export function place(poly, x, z, rotDeg = 0) {
  const a = (rotDeg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return poly.map(([px, pz]) => [x + px * c + pz * s, z - px * s + pz * c]);
}

/** Do two convex shapes overlap? Just touching does not count. */
export function overlap(A, B, eps = 0.02) {
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % P.length];
      const nx = -(z2 - z1), nz = x2 - x1;
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
      for (const [x, z] of A) { const d = x * nx + z * nz; minA = Math.min(minA, d); maxA = Math.max(maxA, d); }
      for (const [x, z] of B) { const d = x * nx + z * nz; minB = Math.min(minB, d); maxB = Math.max(maxB, d); }
      const len = Math.hypot(nx, nz) || 1;
      if (maxA <= minB + eps * len || maxB <= minA + eps * len) return false;
    }
  }
  return true;
}

export function inRect(p, outline) {
  const [x0, z0] = outline[0], [x1, z1] = outline[2];
  return p[0] >= x0 && p[0] <= x1 && p[1] >= z0 && p[1] <= z1;
}
