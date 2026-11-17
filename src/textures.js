// Small drawn-in-code textures. UVs across the model are in feet, so each
// texture says how many feet one tile covers.
import * as THREE from 'three';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return `#${c.getHexString()}`;
}

function tex(w, h, tileFt, draw, { color = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tileFt[0], 1 / tileFt[1]);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function speckle(ctx, w, h, base, amount, seed = 1, grain = 1) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < (w * h) / (3 * grain * grain); i++) {
    const v = (r() - 0.5) * amount;
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    ctx.fillRect(r() * w, r() * h, grain, grain);
  }
}

export const T = {
  boardBatten: (base) => tex(64, 64, [1, 1], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(base, 0.03); ctx.fillRect(26, 0, 12, h);
    ctx.fillStyle = shade(base, -0.13); ctx.fillRect(24, 0, 2, h); ctx.fillRect(38, 0, 2, h);
  }),

  brick: (colors, mortar, seed = 7) => tex(256, 256, [2.667, 2.667], (ctx, w, h) => {
    ctx.fillStyle = mortar; ctx.fillRect(0, 0, w, h);
    const r = rng(seed), bw = 64, bh = 256 / 12;
    for (let row = 0; row < 12; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let i = -1; i < 5; i++) {
        ctx.fillStyle = shade(colors[Math.floor(r() * colors.length)], (r() - 0.5) * 0.06);
        ctx.fillRect(i * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
      }
    }
  }),

  shingle: (base, seed = 3) => tex(256, 128, [3, 1.667], (ctx, w, h) => {
    const r = rng(seed);
    for (let row = 0; row < 4; row++) {
      let x = -r() * 30;
      while (x < w) {
        const tw = 18 + r() * 22;
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.09);
        ctx.fillRect(x, row * 32, tw, 32);
        x += tw;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, row * 32, w, 3);
    }
  }),

  concrete: (base, seed = 11) => tex(256, 256, [8, 8], (ctx, w, h) => {
    speckle(ctx, w, h, base, 0.09, seed);
    ctx.strokeStyle = 'rgba(0,0,0,0.035)';
    for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }),

  plain: (base, amount = 0.06, tile = 4, seed = 5) => tex(128, 128, [tile, tile], (ctx, w, h) => speckle(ctx, w, h, base, amount, seed)),

  grass: () => tex(256, 256, [14, 14], (ctx, w, h) => {
    speckle(ctx, w, h, '#6f8f4a', 0.16, 21, 2);
    const r = rng(9);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${90 + r() * 50},${120 + r() * 40},60,0.18)`;
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 10 + r() * 26, 0, 7); ctx.fill();
    }
  }),

  gravel: () => tex(256, 256, [4, 4], (ctx, w, h) => {
    ctx.fillStyle = '#bdb8ab'; ctx.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 2600; i++) {
      const v = 150 + r() * 80;
      ctx.fillStyle = `rgb(${v},${v - 4},${v - 14})`;
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 1 + r() * 2.4, 0, 7); ctx.fill();
    }
  }),

  // planks run along V; one board every `board` feet across U
  wood: (base, board = 0.5, seed = 2) => tex(256, 256, [board * 4, 6], (ctx, w, h) => {
    const r = rng(seed);
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.07); ctx.fillRect(b * 64, 0, 64, h);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = `rgba(40,20,5,${0.03 + r() * 0.07})`;
        ctx.fillRect(b * 64 + r() * 62, 0, 1 + r() * 2, h);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(b * 64, 0, 2, h);
    }
  }),

  // raised seams every 16" across U
  seam: (base) => tex(64, 16, [1.333, 1], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(base, 0.12); ctx.fillRect(28, 0, 4, h);
    ctx.fillStyle = shade(base, -0.1); ctx.fillRect(32, 0, 4, h);
  }),

  // horizontal panel ribs (roll-up / garage door), every 6"
  ribs: (base) => tex(16, 64, [1, 0.5], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(base, -0.1); ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = shade(base, 0.07); ctx.fillRect(0, 5, w, 4);
  }),

  tile: (base, sizeFt = 0.5) => tex(64, 64, [sizeFt, sizeFt], (ctx, w, h) => {
    speckle(ctx, w, h, base, 0.08, 31);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(0, 0, w, 3); ctx.fillRect(0, 0, 3, h);
  }),

  ripples: () => tex(256, 256, [9, 9], (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
    const r = rng(77);
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = r() * h, rad = 8 + r() * 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const up = r() > 0.5;
      g.addColorStop(0, up ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)');
      g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, rad, 0, 7); ctx.fill(); }
    }
  }, { color: false }),
};
