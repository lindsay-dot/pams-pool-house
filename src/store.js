// All of her designs, saved in this browser automatically.
// Each design has a name, Undo while she works, and earlier versions she can go back to.
import { DEFAULT_DESIGN, normalizeDesign } from './finishes.js';

const LIB = 'pph.library.v1', OLD = 'pph.design.v1';
const MAX_VERSIONS = 30, VERSION_GAP_MS = 3 * 60 * 1000;
export const FILE_TAG = 'pams-pool-house-design';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window or storage full: keep working */ }
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const newId = () => `d${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export function createStore() {
  let lib = read(LIB);
  if (!lib || !Array.isArray(lib.designs) || !lib.designs.length) {
    lib = { currentId: 'd1', designs: [{ id: 'd1', name: 'My First Design', design: read(OLD), versions: [], updated: Date.now() }] };
  }
  for (const d of lib.designs) {
    d.design = normalizeDesign(d.design);
    d.name = String(d.name || 'Design');
    d.versions = (Array.isArray(d.versions) ? d.versions : []).filter((v) => v && v.design).slice(-MAX_VERSIONS);
  }
  let cur = lib.designs.find((d) => d.id === lib.currentId) || lib.designs[0];
  lib.currentId = cur.id;
  let undo = [];
  const subs = new Set();
  const changed = () => { write(LIB, lib); subs.forEach((fn) => fn(cur.design)); };

  /** Keep an earlier version: always when forced, otherwise only every few minutes. */
  function keepVersion(force) {
    const last = cur.versions.at(-1), now = Date.now();
    if (last && same(last.design, cur.design)) return;
    if (!force && last && now - last.t < VERSION_GAP_MS) return;
    cur.versions.push({ t: now, design: clone(cur.design) });
    if (cur.versions.length > MAX_VERSIONS) cur.versions.splice(0, cur.versions.length - MAX_VERSIONS);
  }
  function commit(next, force = false) {
    keepVersion(force);
    undo.push(JSON.stringify(cur.design));
    if (undo.length > 200) undo.shift();
    cur.design = normalizeDesign(next);
    cur.updated = Date.now();
    changed();
  }
  function uniqueName(name) {
    const base = String(name || 'New Design').trim().slice(0, 40) || 'New Design';
    let n = base, i = 2;
    while (lib.designs.some((d) => d.name.toLowerCase() === n.toLowerCase())) n = `${base} ${i++}`;
    return n;
  }
  function add(name, design) {
    keepVersion(true);
    cur = { id: newId(), name: uniqueName(name), design: normalizeDesign(design), versions: [], updated: Date.now() };
    lib.designs.push(cur);
    lib.currentId = cur.id;
    undo = [];
    changed();
    return cur.id;
  }

  return {
    get: () => cur.design,
    canUndo: () => undo.length > 0,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    /** path like "deck.finish" */
    set(path, value) {
      const keys = path.split('.');
      let o = cur.design;
      for (const k of keys.slice(0, -1)) o = o[k];
      if (same(o[keys.at(-1)], value)) return;
      const next = clone(cur.design);
      o = next;
      for (const k of keys.slice(0, -1)) o = o[k];
      o[keys.at(-1)] = value;
      commit(next);
    },
    undo() {
      if (!undo.length) return;
      cur.design = normalizeDesign(JSON.parse(undo.pop()));
      cur.updated = Date.now();
      changed();
    },
    startOver() {
      if (!same(cur.design, normalizeDesign(DEFAULT_DESIGN))) commit(DEFAULT_DESIGN, true);
    },

    // ---- named designs ----
    currentId: () => cur.id,
    currentName: () => cur.name,
    designs: () => lib.designs.map((d) => ({ id: d.id, name: d.name, updated: d.updated, current: d.id === cur.id })),
    designById: (id) => lib.designs.find((d) => d.id === id) || null,
    rename(name) {
      const n = String(name || '').trim().slice(0, 40);
      if (!n || n === cur.name) return;
      cur.name = lib.designs.some((d) => d !== cur && d.name.toLowerCase() === n.toLowerCase()) ? uniqueName(n) : n;
      changed();
    },
    create: (name) => add(name, DEFAULT_DESIGN),
    copy: () => add(`${cur.name} Copy`, cur.design),
    open(id) {
      const d = lib.designs.find((x) => x.id === id);
      if (!d || d === cur) return;
      keepVersion(true);
      cur = d; lib.currentId = d.id; undo = [];
      changed();
    },
    remove(id) {
      if (lib.designs.length < 2) return;
      lib.designs = lib.designs.filter((d) => d.id !== id);
      if (cur.id === id) { cur = lib.designs[0]; lib.currentId = cur.id; undo = []; }
      changed();
    },

    // ---- earlier versions (newest first) ----
    versions: () => cur.versions.map((v, i) => ({ index: i, t: v.t })).reverse(),
    restore(index) {
      const v = cur.versions[index];
      if (v) commit(clone(v.design), true);
    },

    // ---- files ----
    toFile: () => ({ file: FILE_TAG, version: 1, name: cur.name, savedAt: new Date().toISOString(), design: clone(cur.design) }),
    /** Returns the new design's name, or throws a plain-language Error. */
    fromFile(obj) {
      if (!obj || obj.file !== FILE_TAG || typeof obj.design !== 'object') throw new Error('That file is not a Pam’s Pool House design.');
      add(obj.name || 'Opened Design', obj.design);
      return cur.name;
    },
  };
}

export const storage = { read, write };
