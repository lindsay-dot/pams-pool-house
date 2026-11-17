// Three ways to look at the yard: look around (orbit), from above, and standing on the deck.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const EYE = 5 + 4 / 12; // 5' 4" eye height

export function createViews(camera, dom, getSite) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // worked out fresh each time, because the Layout tab can move things
  function geo() {
    const site = getSite(), pool = site.pool.outline, deck = site.poolDeck.outline;
    const cx = (pool[0][0] + pool[2][0]) / 2, cz = (pool[0][1] + pool[2][1]) / 2;
    return {
      cx, cz, centre: new THREE.Vector3(cx, 2, cz - 8),
      // places to stand, all on the deck or the pool house porch
      spots: [
        { name: 'by the house steps', pos: [cx, deck[2][1] - 2.5], look: [cx, 4.5, 15] },
        { name: 'beside the pool', pos: [deck[2][0] - 3, cz - 4], look: [cx - 6, 3, cz + 20] },
        { name: 'on the pool house porch', pos: [cx, 20], look: [cx, 3.5, cz + 10] },
        { name: 'at the deep end', pos: [deck[0][0] + 3, 28.5], look: [cx + 4, 3, cz + 14] },
      ],
    };
  }
  const NAMES = geo().spots.map((s) => s.name);
  let mode = 'orbit', spot = -1, tween = null;

  function setMode(m) {
    mode = m;
    const standing = m === 'stand';
    controls.enableZoom = !standing;
    controls.enablePan = !standing;
    controls.rotateSpeed = standing ? -0.45 : 0.7;
    controls.minDistance = standing ? 0 : 10;
    controls.maxDistance = standing ? Infinity : 260;
    controls.minPolarAngle = standing ? 0.6 : 0;
    controls.maxPolarAngle = standing ? 2.5 : Math.PI / 2 - 0.04;
  }

  function fly(pos, target, m) {
    setMode(m);
    controls.enabled = false;
    tween = { t: 0, p0: camera.position.clone(), p1: pos, q0: controls.target.clone(), q1: target, standing: m === 'stand' };
  }

  const api = {
    controls,
    get mode() { return mode; },
    get spotName() { return spot >= 0 ? NAMES[spot] : ''; },
    orbit() { const { cx, cz, centre } = geo(); spot = -1; fly(new THREE.Vector3(cx + 62, 34, cz + 6), centre, 'orbit'); },
    above() { const { cx, cz } = geo(); spot = -1; fly(new THREE.Vector3(cx, 135, cz + 5), new THREE.Vector3(cx, 0, cz - 7), 'above'); },
    stand() {
      const { spots } = geo();
      spot = mode === 'stand' ? (spot + 1) % spots.length : 0;
      const s = spots[spot];
      fly(new THREE.Vector3(s.pos[0], EYE, s.pos[1]), new THREE.Vector3(...s.look), 'stand');
    },
    /** Camera spots for "download all pictures". */
    shots() {
      const { cx, cz, centre, spots } = geo();
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      return [
        { name: 'Look-Around', pos: V(cx + 62, 34, cz + 6), target: centre },
        { name: 'From-Above', pos: V(cx, 135, cz + 5), target: V(cx, 0, cz - 7) },
        ...spots.map((s) => ({ name: `Standing-${s.name.replace(/\s+/g, '-')}`, pos: V(s.pos[0], EYE, s.pos[1]), target: V(...s.look) })),
        { name: 'Kitchen', pos: V(19, 8, 27), target: V(5, 2.5, 18) },
        { name: 'Fireplace', pos: V(cx, EYE, 24.5), target: V(cx, 5, 8) },
      ];
    },
    update(dt) {
      if (tween) {
        tween.t = Math.min(1, tween.t + dt / 1.1);
        const k = tween.t * tween.t * (3 - 2 * tween.t);
        camera.position.lerpVectors(tween.p0, tween.p1, k);
        controls.target.lerpVectors(tween.q0, tween.q1, k);
        if (tween.t >= 1) {
          if (tween.standing) {
            // look around from a fixed spot: pivot just in front of the eyes
            const dir = tween.q1.clone().sub(tween.p1).normalize();
            controls.target.copy(tween.p1).addScaledVector(dir, 0.4);
          }
          tween = null;
          controls.enabled = true;
        }
        camera.lookAt(controls.target);
        return;
      }
      controls.update();
      if (mode !== 'stand') {
        // keep the yard in view and the camera above the grass
        controls.target.x = THREE.MathUtils.clamp(controls.target.x, -60, 90);
        controls.target.z = THREE.MathUtils.clamp(controls.target.z, -50, 130);
        controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 25);
        if (camera.position.y < 1.5) camera.position.y = 1.5;
      }
    },
  };
  setMode('orbit');
  const g0 = geo();
  camera.position.set(g0.cx + 62, 34, g0.cz + 6);
  controls.target.copy(g0.centre);
  return api;
}
