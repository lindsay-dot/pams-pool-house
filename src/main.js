import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import site from '../site.json';
import './style.css';
import { createMaterials } from './materials.js';
import { buildPoolHouse, buildKitchenAsDrawn } from './build/poolhouse.js';
import { buildPoolAndDeck, buildFence } from './build/pool.js';
import { buildGrounds, buildHouse } from './build/grounds.js';
import { buildDimensions } from './dimensions.js';
import { createViews } from './views.js';

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
const sunDir = new THREE.Vector3(0.5, 0.72, 0.48).normalize();
const sky = new Sky();
sky.scale.setScalar(8000);
Object.assign(sky.material.uniforms.turbidity, { value: 3.2 });
Object.assign(sky.material.uniforms.rayleigh, { value: 1.1 });
Object.assign(sky.material.uniforms.mieCoefficient, { value: 0.004 });
Object.assign(sky.material.uniforms.mieDirectionalG, { value: 0.8 });
sky.material.uniforms.sunPosition.value.copy(sunDir);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(sky);
scene.environment = pmrem.fromScene(envScene).texture;
scene.environmentIntensity = 0.55;
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xdcebf5, 0x7b8a5c, 0.9));
const sun = new THREE.DirectionalLight(0xfff3df, 2.7);
const focus = new THREE.Vector3(8, 0, 45);
sun.position.copy(focus).addScaledVector(sunDir, 260);
sun.target.position.copy(focus);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -85, right: 85, top: 95, bottom: -95, near: 20, far: 520 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target);
// nothing moves yet, so the shadow map only needs drawing once (call refreshShadows() after changes)
sun.shadow.autoUpdate = false;
const refreshShadows = () => { sun.shadow.needsUpdate = true; };
refreshShadows();

// --- the site, built from site.json ----------------------------------------------
const M = createMaterials();
const dims = buildDimensions(site);
scene.add(
  buildGrounds(site, M), buildHouse(site, M), buildPoolAndDeck(site, M), buildFence(site, M),
  buildPoolHouse(site, M), buildKitchenAsDrawn(site, M), dims,
);

// --- views and buttons -------------------------------------------------------------
const views = createViews(camera, canvas, site);
const hint = document.getElementById('hint');
const HINTS = {
  orbit: 'Drag to turn the view. Scroll or pinch to zoom.',
  above: 'Looking straight down. Drag to tilt, scroll or pinch to zoom.',
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
  dims.visible = !dims.visible;
  dimBtn.classList.toggle('on', dims.visible);
  dimBtn.setAttribute('aria-pressed', String(dims.visible));
  dimBtn.textContent = dims.visible ? 'Hide Measurements' : 'Show Measurements';
});
setActive('orbit');

// --- size + loop ---------------------------------------------------------------------
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  labels.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let frames = 0, t0 = performance.now();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  views.update(dt);
  M.water.bumpMap.offset.x += dt * 0.012;
  M.water.bumpMap.offset.y += dt * 0.02;
  renderer.render(scene, camera);
  labels.render(scene, camera);
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
    document.title = `SELFTEST OK webgl${renderer.capabilities.isWebGL2 ? 2 : 1} ${fps}fps draws=${info.calls} tris=${info.triangles} colors=${seen.size} glerr=${gl.getError()} ${canvas.width}x${canvas.height}`;
  }
});

document.getElementById('loading')?.remove();
window.__designer = { scene, camera, renderer, views, site, M, refreshShadows };
