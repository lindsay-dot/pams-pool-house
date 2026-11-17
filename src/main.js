import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import approvedSite from '../site.json';
import './style.css';
import { createMaterials } from './materials.js';
import { buildPoolHouse } from './build/poolhouse.js';
import { buildPoolAndDeck, buildFence } from './build/pool.js';
import { buildGrounds, buildHouse } from './build/grounds.js';
import { buildDimensions } from './dimensions.js';
import { createViews } from './views.js';
import { createStore } from './store.js';
import { applyDesign } from './finishes.js';
import { approvedLayout, loadLayout, saveLayout, deriveSite, isApproved } from './layout.js';
import { createPanel, itemTitle } from './ui.js';
import { kitchenPlan, buildKitchen } from './kitchen.js';
import { buildItem, positionItem, startingSpot, furnitureDef } from './furniture.js';
import { checkDesign } from './checks.js';
import { createInteraction } from './interact.js';
import { saveBlob, fileSafe, zip, pickJsonFile } from './files.js';

const wrap = document.getElementById('stage');
const canvas = document.getElementById('view');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

const labels = new CSS2DRenderer();
labels.domElement.className = 'labels';
wrap.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc5d6e0, 320, 2200);
const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 9000);

// --- sky, sun, light -----------------------------------------------------------
const sunDir = new THREE.Vector3();
const sky = new Sky();
sky.scale.setScalar(8000);
sky.material.uniforms.turbidity.value = 3.2;
sky.material.uniforms.rayleigh.value = 1.1;
sky.material.uniforms.mieCoefficient.value = 0.004;
sky.material.uniforms.mieDirectionalG.value = 0.8;
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
scene.environmentIntensity = 0.55;

scene.add(new THREE.HemisphereLight(0xdcebf5, 0x7b8a5c, 0.9));
const sun = new THREE.DirectionalLight(0xfff3df, 2.7);
const focus = new THREE.Vector3(8, 0, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 105, bottom: -105, near: 20, far: 560 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target);
// nothing moves on its own, so the shadow map is only redrawn when something changes
sun.shadow.autoUpdate = false;
const refreshShadows = () => { sun.shadow.needsUpdate = true; };

let envTarget = null;
function setSun(directionDeg, heightDeg) {
  const a = THREE.MathUtils.degToRad(directionDeg), e = THREE.MathUtils.degToRad(heightDeg);
  sunDir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  sky.material.uniforms.sunPosition.value.copy(sunDir);
  sun.position.copy(focus).addScaledVector(sunDir, 280);
  sun.target.position.copy(focus);
  envScene.add(sky);
  const next = pmrem.fromScene(envScene);
  scene.environment = next.texture;
  envTarget?.dispose();
  envTarget = next;
  scene.add(sky);
  refreshShadows();
}

// --- the site: approved site.json + anything changed in the Layout tab -------------
const M = createMaterials();
let layoutState = loadLayout(approvedSite);
let site = deriveSite(approvedSite, layoutState);
let siteGroup = null, dims = null, dimsVisible = false;

function disposeGroup(g) {
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  scene.remove(g);
}
function rebuildSite() {
  site = deriveSite(approvedSite, layoutState);
  if (siteGroup) disposeGroup(siteGroup);
  if (dims) disposeGroup(dims);
  siteGroup = new THREE.Group();
  siteGroup.add(
    buildGrounds(site, M), buildHouse(site, M), buildPoolAndDeck(site, M), buildFence(site, M),
    buildPoolHouse(site, M),
  );
  dims = buildDimensions(site);
  dims.visible = dimsVisible;
  scene.add(siteGroup, dims);
  setSun(layoutState.sunDirection, layoutState.sunHeight);
  rebuildDynamic();
}

// --- design: finishes, kitchen and furniture --------------------------------------------
const store = createStore();
const dyn = new THREE.Group(); dyn.name = 'kitchenAndFurniture';
scene.add(dyn);
let itemsRoot = null, selectedId = null, plan = null, panel = null;
const warnBox = document.getElementById('warnings'), selBar = document.getElementById('selbar'), selName = document.getElementById('selname');

function showChecks(items) {
  const res = checkDesign(site, store.get(), plan, items);
  warnBox.hidden = res.messages.length === 0;
  warnBox.replaceChildren(...res.messages.slice(0, 3).map((m) => Object.assign(document.createElement('p'), { textContent: m })));
  if (res.messages.length > 3) warnBox.append(Object.assign(document.createElement('p'), { className: 'more', textContent: `…and ${res.messages.length - 3} more to look at.` }));
  for (const g of itemsRoot.children) {
    const ring = g.getObjectByName('ring'), id = g.userData.itemId;
    ring.visible = id === selectedId || res.bad.has(id);
    ring.material.color.set(res.bad.has(id) ? 0xd4380d : 0x1f6f8b);
  }
  return res;
}
function showSelection() {
  const it = store.get().items.find((i) => i.id === selectedId);
  if (!it) selectedId = null;
  selBar.hidden = !it;
  document.getElementById('hint').hidden = !!it;
  if (it) selName.textContent = itemTitle(it.type);
}
function makeDynamic(d) {
  const p = kitchenPlan(site, d.kitchen), root = new THREE.Group(), g = new THREE.Group();
  for (const it of d.items) root.add(buildItem(it, site, M));
  g.add(buildKitchen(site, d.kitchen, p, M), root);
  return { g, p, root };
}
function clearGroup(g) {
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  g.clear();
}
function rebuildDynamic() {
  clearGroup(dyn);
  const m = makeDynamic(store.get());
  plan = m.p; itemsRoot = m.root;
  dyn.add(m.g);
  showSelection();
  showChecks();
  refreshShadows();
  document.getElementById('designName').textContent = store.currentName();
  compare.refresh();
}

// --- compare two designs side by side: same camera, left = the open design ------------
const compare = {
  on: false, otherId: null, dirty: true, group: new THREE.Group(), last: '',
  start(id) {
    if (!store.designById(id) || id === store.currentId()) return;
    this.otherId = id; this.on = true;
    selectedId = null; showSelection();
    document.body.classList.add('comparing');
    document.getElementById('comparebar').hidden = false;
    this.refresh();
    panel?.render();
  },
  stop() {
    if (!this.on) return;
    this.on = false;
    clearGroup(this.group);
    this.group.visible = false; dyn.visible = true;
    document.body.classList.remove('comparing');
    document.getElementById('comparebar').hidden = true;
    renderer.setScissorTest(false);
    applyDesign(store.get(), M);
    resize();
    refreshShadows();
    panel?.render();
  },
  refresh() {
    if (!this.on) return;
    const other = store.designById(this.otherId);
    if (!other || other.id === store.currentId()) { this.stop(); return; }
    clearGroup(this.group);
    this.group.add(makeDynamic(other.design).g);
    document.getElementById('cmpA').textContent = store.currentName();
    document.getElementById('cmpB').textContent = other.name;
    this.dirty = true;
  },
  render() {
    // only redraw when the camera or a design changed; each side needs its own shadows
    const key = camera.position.toArray().concat(camera.quaternion.toArray()).map((v) => v.toFixed(4)).join();
    if (!this.dirty && key === this.last) return;
    this.dirty = false; this.last = key;
    const size = renderer.getSize(new THREE.Vector2()), half = Math.floor(size.x / 2);
    camera.aspect = half / size.y; camera.updateProjectionMatrix();
    renderer.setScissorTest(true);
    const sides = [[store.get(), dyn], [store.designById(this.otherId).design, this.group]];
    sides.forEach(([design, group], i) => {
      applyDesign(design, M);
      dyn.visible = group === dyn; this.group.visible = group === this.group;
      sun.shadow.needsUpdate = true;
      renderer.setViewport(i * half, 0, half, size.y); renderer.setScissor(i * half, 0, half, size.y);
      renderer.render(scene, camera);
    });
    applyDesign(store.get(), M);
    dyn.visible = true; this.group.visible = false;
  },
};
compare.group.visible = false;
scene.add(compare.group);
document.getElementById('cmpDone').addEventListener('click', () => compare.stop());
rebuildSite();
applyDesign(store.get(), M);
store.subscribe((d) => { applyDesign(d, M); rebuildDynamic(); });

const furniture = {
  selected: () => selectedId,
  select(id) { if (id === selectedId) return; selectedId = id; showSelection(); showChecks(); panel?.render(); },
  add(type) {
    const items = store.get().items, id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
    selectedId = id;
    // try a few starting spots and take the first one that is clear
    let item = null;
    for (let k = 0; k < 18; k++) {
      item = { id, type, ...startingSpot(type, site, k) };
      if (!checkDesign(site, store.get(), plan, [...items, item]).bad.has(id)) break;
    }
    store.set('items', [...items, item]);
  },
  remove(id) {
    if (!id) return;
    if (id === selectedId) selectedId = null;
    store.set('items', store.get().items.filter((i) => i.id !== id));
  },
  change(id, patch) { store.set('items', store.get().items.map((i) => (i.id === id ? { ...i, ...patch } : i))); },
  turn(deg) {
    const it = store.get().items.find((i) => i.id === selectedId);
    if (it) this.change(it.id, { rot: (((it.rot + deg) % 360) + 360) % 360 });
  },
};
document.getElementById('turnL').addEventListener('click', () => furniture.turn(15));
document.getElementById('turnR').addEventListener('click', () => furniture.turn(-15));
document.getElementById('removeItem').addEventListener('click', () => furniture.remove(selectedId));
window.addEventListener('keydown', (e) => {
  if (!selectedId || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  const it = store.get().items.find((i) => i.id === selectedId), step = 0.5;
  const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (e.key === 'Delete' || e.key === 'Backspace') furniture.remove(selectedId);
  else if (e.key === 'r' || e.key === 'R') furniture.turn(e.shiftKey ? -15 : 15);
  else if (e.key === 'Escape') furniture.select(null);
  else if (move) furniture.change(it.id, { x: it.x + move[0], z: it.z + move[1] });
  else return;
  e.preventDefault();
});

const layoutSubs = new Set();
const layout = {
  get: () => layoutState,
  isApproved: () => isApproved(approvedSite, layoutState),
  subscribe: (fn) => layoutSubs.add(fn),
  set(key, value) {
    if (layoutState[key] === value) return;
    layoutState = { ...layoutState, [key]: value };
    this.commit();
  },
  reset() { layoutState = approvedLayout(approvedSite); this.commit(); },
  commit() { saveLayout(layoutState); rebuildSite(); layoutSubs.forEach((fn) => fn()); },
  download() {
    const blob = new Blob([JSON.stringify(site, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'site.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
};
// --- pictures and files -----------------------------------------------------------------
const PICTURE_WIDTH = navigator.maxTouchPoints > 1 ? 2560 : 3840;
/** Draw one high-resolution picture. shot = { pos, target } or nothing for the view on screen. */
function capture(shot) {
  const size = renderer.getSize(new THREE.Vector2()), ratio = renderer.getPixelRatio();
  // as wide as PICTURE_WIDTH, but never taller than 2400 (keeps tall iPad views within Safari's limits)
  let W = PICTURE_WIDTH, H = Math.round((W * size.y) / size.x);
  if (H > 2400) { W = Math.round((2400 * size.x) / size.y); H = 2400; }
  const cam = camera.clone();
  if (shot) { cam.position.copy(shot.pos); cam.up.set(0, 1, 0); cam.lookAt(shot.target); }
  cam.aspect = W / H; cam.updateProjectionMatrix();
  const rings = [];
  itemsRoot.traverse((o) => { if (o.name === 'ring' && o.visible) { rings.push(o); o.visible = false; } });
  const dimsWere = dims.visible; dims.visible = false;
  renderer.setScissorTest(false);
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.render(scene, cam);
  const blob = new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  renderer.setPixelRatio(ratio); renderer.setSize(size.x, size.y, false);
  rings.forEach((o) => { o.visible = true; });
  dims.visible = dimsWere;
  compare.dirty = true;
  return blob;
}
const tick = () => new Promise((r) => setTimeout(r, 30));
const actions = {
  compare: (id) => compare.start(id),
  endCompare: () => compare.stop(),
  comparing: () => compare.on,
  async downloadView() {
    compare.stop();
    await tick();
    const blob = await capture();
    if (!blob) return 'Sorry, the picture could not be made.';
    saveBlob(blob, `${fileSafe(store.currentName())}-view.jpg`);
    return 'Picture saved to your Downloads.';
  },
  async downloadAll(progress) {
    compare.stop();
    const shots = views.shots(), files = [];
    for (let i = 0; i < shots.length; i++) {
      progress(`Making picture ${i + 1} of ${shots.length}…`);
      await tick();
      const blob = await capture(shots[i]);
      if (blob) files.push({ name: `${String(i + 1).padStart(2, '0')}-${shots[i].name}.jpg`, blob });
    }
    if (!files.length) return 'Sorry, the pictures could not be made.';
    saveBlob(await zip(files), `${fileSafe(store.currentName())}-pictures.zip`);
    return `${files.length} pictures saved to your Downloads in one zip file.`;
  },
  saveFile() {
    const blob = new Blob([JSON.stringify(store.toFile(), null, 2)], { type: 'application/json' });
    saveBlob(blob, `${fileSafe(store.currentName())}.poolhouse.json`);
    return 'Design saved to your Downloads.';
  },
  async openFile() {
    try { return `Opened “${store.fromFile(await pickJsonFile())}”.`; } catch (err) { return err.message; }
  },
};
panel = createPanel(document.getElementById('panel'), { store, layout, furniture, actions });

// --- views and buttons -------------------------------------------------------------
const views = createViews(camera, canvas, () => site);
const hint = document.getElementById('hint');
const HINTS = {
  orbit: 'Drag to turn the view. Scroll or pinch to zoom.',
  above: 'Looking down from above. Drag to tilt, scroll or pinch to zoom.',
  stand: () => `Standing ${views.spotName}. Drag to look around. Press “Stand on the Deck” again to move.`,
};
function setActive(name) {
  document.querySelectorAll('#views [data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
  hint.textContent = typeof HINTS[name] === 'function' ? HINTS[name]() : HINTS[name];
}
document.querySelectorAll('#views [data-view]').forEach((b) =>
  b.addEventListener('click', () => { views[b.dataset.view](); setActive(b.dataset.view); }));
const dimBtn = document.getElementById('dims');
dimBtn.addEventListener('click', () => {
  dimsVisible = !dimsVisible;
  dims.visible = dimsVisible;
  dimBtn.classList.toggle('on', dimsVisible);
  dimBtn.setAttribute('aria-pressed', String(dimsVisible));
  dimBtn.textContent = dimsVisible ? 'Hide Measurements' : 'Show Measurements';
});
setActive('orbit');

// pick up and drag furniture
const clampYard = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
createInteraction({
  canvas, camera, controls: views.controls,
  getItemsRoot: () => itemsRoot,
  canDrag: () => views.mode !== 'stand' && !compare.on,
  onSelect: (id) => { if (!compare.on) furniture.select(id); },
  onDrag(id, group, x, z) {
    const moved = { ...store.get().items.find((i) => i.id === id), x: clampYard(x, -70, 100), z: clampYard(z, -40, 130) };
    positionItem(group, moved, site);
    group.userData.pending = moved;
    showChecks(store.get().items.map((i) => (i.id === id ? moved : i)));
    refreshShadows();
  },
  onDrop(id, group) {
    const m = group.userData.pending;
    if (m) furniture.change(id, { x: m.x, z: m.z });
  },
});

// --- size + loop ---------------------------------------------------------------------
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  labels.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  compare.dirty = true;
}
new ResizeObserver(resize).observe(wrap);
resize();

let frames = 0, t0 = performance.now();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  views.update(dt);
  M.water.bumpMap.offset.x += dt * 0.012;
  M.water.bumpMap.offset.y += dt * 0.02;
  if (compare.on) compare.render();
  else { renderer.render(scene, camera); labels.render(scene, camera); }
  if (window.SELFTEST && ++frames === 30) t0 = performance.now(); // skip start-up when timing
  if (window.SELFTEST && frames === 90) {
    // read a few pixels back to prove the picture is really being drawn
    const gl = renderer.getContext(), px = new Uint8Array(4), seen = new Set();
    for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.6], [0.7, 0.4], [0.5, 0.95]]) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * fx), Math.floor(gl.drawingBufferHeight * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      seen.add(px.slice(0, 3).join(','));
    }
    const fps = Math.round(60000 / (performance.now() - t0));
    const info = renderer.info.render;
    const swatches = document.querySelectorAll('#panel .swatch').length;
    document.title = `SELFTEST OK webgl${renderer.capabilities.isWebGL2 ? 2 : 1} ${fps}fps draws=${info.calls} tris=${info.triangles} colors=${seen.size} glerr=${gl.getError()} swatches=${swatches} ${canvas.width}x${canvas.height}`;
    // also prove a high-resolution picture can be made in this browser
    capture().then(async (b) => {
      const bmp = b ? await createImageBitmap(b) : null;
      document.title += bmp ? ` picture=${bmp.width}x${bmp.height}/${Math.round(b.size / 1024)}KB designs=${store.designs().length}` : ' picture=FAILED';
    }).catch((err) => { document.title += ` picture=FAILED(${err.message})`; });
  }
});

document.getElementById('loading')?.remove();
window.__designer = { scene, camera, renderer, views, M, store, layout, furniture, actions, compare, capture, refreshShadows, get site() { return site; }, get plan() { return plan; }, checks: () => checkDesign(site, store.get(), plan), furnitureDef };
