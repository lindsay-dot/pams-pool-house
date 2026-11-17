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

// ---- Stage 2 finishes ------------------------------------------------------
function blotches(ctx, w, h, seed, count, alpha, minR, maxR) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h, rad = minR + r() * (maxR - minR), dark = r() > 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, rad, 0, 7); ctx.fill(); }
  }
}

Object.assign(T, {
  salt: (base) => tex(256, 256, [6, 6], (ctx, w, h) => {
    speckle(ctx, w, h, base, 0.07, 41);
    const r = rng(42);
    for (let i = 0; i < 520; i++) { ctx.fillStyle = `rgba(0,0,0,${0.16 + r() * 0.22})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.7 + r() * 1.5, 0, 7); ctx.fill(); }
  }),

  // random ashlar: rectangles of mixed sizes that always fill an 8' x 8' tile
  ashlar: (base) => tex(512, 512, [8, 8], (ctx, w, h) => {
    const r = rng(51), n = 8, cell = w / n, used = Array.from({ length: n }, () => Array(n).fill(false));
    const sizes = [[3, 2], [2, 2], [2, 1], [1, 2], [3, 1], [2, 3], [1, 1]];
    ctx.fillStyle = shade(base, -0.3); ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (used[y][x]) continue;
      const order = sizes.map((s) => [r(), s]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
      const fit = order.find(([sw, sh]) => {
        if (x + sw > n || y + sh > n) return false;
        for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) if (used[y + j][x + i]) return false;
        return true;
      }) || [1, 1];
      for (let j = 0; j < fit[1]; j++) for (let i = 0; i < fit[0]; i++) used[y + j][x + i] = true;
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.12);
      ctx.fillRect(x * cell + 2, y * cell + 2, fit[0] * cell - 4, fit[1] * cell - 4);
    }
    blotches(ctx, w, h, 52, 90, 0.07, 10, 50);
  }),

  cobble: (base) => tex(256, 256, [3, 3], (ctx, w, h) => {
    const r = rng(61), cols = 4, rows = 6, cw = w / cols, ch = h / rows;
    ctx.fillStyle = shade(base, -0.28); ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < rows; row++) for (let i = -1; i <= cols; i++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.14);
      ctx.beginPath(); ctx.roundRect(i * cw + (row % 2 ? cw / 2 : 0) + 3, row * ch + 3, cw - 6, ch - 6, 9); ctx.fill();
    }
    blotches(ctx, w, h, 62, 60, 0.06, 6, 22);
  }),

  aggregate: (base) => tex(256, 256, [3, 3], (ctx, w, h) => {
    ctx.fillStyle = shade(base, -0.08); ctx.fillRect(0, 0, w, h);
    const r = rng(71);
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.36);
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.9 + r() * 1.9, 0, 7); ctx.fill();
    }
  }),

  stained: (base) => tex(256, 256, [10, 10], (ctx, w, h) => {
    speckle(ctx, w, h, base, 0.05, 81);
    blotches(ctx, w, h, 82, 70, 0.13, 20, 70);
  }),

  coolDeck: (base) => tex(256, 256, [4, 4], (ctx, w, h) => {
    ctx.fillStyle = shade(base, -0.07); ctx.fillRect(0, 0, w, h);
    const r = rng(91);
    ctx.fillStyle = base;
    for (let i = 0; i < 520; i++) { ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 3 + r() * 9, 2 + r() * 6, r() * 3, 0, 7); ctx.fill(); }
  }),

  // rectangular pavers in running bond: cols x rows per tile
  pavers: (base, cols, rows, tileFt, veined = false, seed = 101) => tex(256, 256, tileFt, (ctx, w, h) => {
    const r = rng(seed), cw = w / cols, ch = h / rows;
    ctx.fillStyle = shade(base, -0.22); ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < rows; row++) for (let i = -1; i <= cols; i++) {
      const x = i * cw + (row % 2 ? cw / 2 : 0), y = row * ch;
      ctx.fillStyle = shade(base, (r() - 0.5) * (veined ? 0.07 : 0.13));
      ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
      if (veined) for (let k = 0; k < 7; k++) {
        ctx.fillStyle = `rgba(90,70,40,${0.05 + r() * 0.08})`;
        ctx.fillRect(x + 3 + r() * (cw - 30), y + 3 + r() * (ch - 8), 8 + r() * 26, 1 + r() * 2);
      }
    }
  }),

  mosaic: (colors) => tex(128, 128, [0.667, 0.667], (ctx, w, h) => {
    const r = rng(111), n = 8, c = w / n;
    ctx.fillStyle = '#eef2f3'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = shade(colors[Math.floor(r() * colors.length)], (r() - 0.5) * 0.08);
      ctx.fillRect(x * c + 1, y * c + 1, c - 2, c - 2);
    }
  }),

  // raised-panel garage door: one panel per 18" x 21" tile
  panels: (base) => tex(96, 112, [1.5, 1.75], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(base, -0.16); ctx.fillRect(0, 0, w, 3); ctx.fillRect(10, 14, w - 20, h - 28);
    ctx.fillStyle = shade(base, 0.05); ctx.fillRect(14, 18, w - 28, h - 36);
  }),

  // roll-up door: narrow curved slats every 3"
  slats: (base) => tex(16, 32, [1, 0.25], (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(base, -0.14)); g.addColorStop(0.35, shade(base, 0.08)); g.addColorStop(1, shade(base, -0.06));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }),

  pebble: (base) => tex(256, 256, [2.5, 2.5], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const r = rng(121);
    for (let i = 0; i < 4200; i++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.26);
      ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.8 + r() * 1.5, 0, 7); ctx.fill();
    }
  }),
});

// ---- Stage 3: kitchen and furniture ---------------------------------------
Object.assign(T, {
  granite: (base) => tex(256, 256, [3, 3], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const r = rng(201);
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 0.45);
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
    }
  }),
  quartzite: (base) => tex(256, 256, [6, 6], (ctx, w, h) => {
    speckle(ctx, w, h, base, 0.04, 211);
    const r = rng(212);
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      ctx.strokeStyle = `rgba(120,105,85,${0.1 + r() * 0.2})`; ctx.lineWidth = 0.6 + r() * 2.2;
      let x = r() * w, y = -10; ctx.beginPath(); ctx.moveTo(x, y);
      while (y < h + 10) { x += (r() - 0.35) * 26; y += 14 + r() * 16; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }),
  stackedStone: (base) => tex(256, 256, [3, 3], (ctx, w, h) => {
    ctx.fillStyle = shade(base, -0.3); ctx.fillRect(0, 0, w, h);
    const r = rng(221);
    let y = 0;
    while (y < h) {
      const rh = 10 + Math.floor(r() * 12);
      let x = -r() * 40;
      while (x < w) {
        const rw = 26 + r() * 60;
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.2);
        ctx.fillRect(x + 1, y + 1, rw - 2, Math.min(rh, h - y) - 2);
        x += rw;
      }
      y += rh;
    }
  }),
  rug: () => tex(256, 320, [8, 10], (ctx, w, h) => {
    ctx.fillStyle = '#31506b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e9e3d3'; ctx.fillRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#31506b'; ctx.fillRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = '#d9cfb8';
    for (let y = 40; y < h - 40; y += 24) ctx.fillRect(38, y, w - 76, 8);
  }),
  weave: (base) => tex(32, 32, [0.25, 0.25], (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(base, -0.12); ctx.fillRect(0, 0, 16, 16); ctx.fillRect(16, 16, 16, 16);
  }),
});
