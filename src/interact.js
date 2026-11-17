// Click a piece to pick it, drag it to move it. Works with a mouse or a finger.
import * as THREE from 'three';

export function createInteraction({ canvas, camera, controls, getItemsRoot, canDrag, onSelect, onDrag, onDrop }) {
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let drag = null, downAt = null;

  const setPtr = (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
  };
  const pick = () => {
    const root = getItemsRoot();
    if (!root) return null;
    for (const h of ray.intersectObjects(root.children, true)) {
      if (h.object.name === 'ring') continue;
      let o = h.object;
      while (o && !o.userData.itemId) o = o.parent;
      if (o) return { id: o.userData.itemId, group: o, point: h.point };
    }
    return null;
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    setPtr(e);
    downAt = [e.clientX, e.clientY];
    const p = pick();
    if (!p) return;
    onSelect(p.id);
    if (!canDrag()) return;
    // drag on a flat sheet at the height where the piece was grabbed, so it stays under the pointer
    ground.constant = -p.point.y;
    drag = { id: p.id, group: p.group, dx: p.group.position.x - p.point.x, dz: p.group.position.z - p.point.z, moved: false, pointer: e.pointerId };
    controls.enabled = false;
    canvas.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }, { capture: true });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    setPtr(e);
    if (!ray.ray.intersectPlane(ground, hit)) return;
    const x = Math.round((hit.x + drag.dx) * 12) / 12, z = Math.round((hit.z + drag.dz) * 12) / 12;
    if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) drag.moved = true;
    if (drag.moved) onDrag(drag.id, drag.group, x, z);
  });

  const end = (e) => {
    if (drag && e.pointerId === drag.pointer) {
      controls.enabled = true;
      if (drag.moved) onDrop(drag.id, drag.group);
      drag = null;
      return;
    }
    // a plain click on empty ground lets go of the selected piece
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 4) {
      setPtr(e);
      if (!pick()) onSelect(null);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}
