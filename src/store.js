// The current design, saved in this browser automatically, with Undo.
import { DEFAULT_DESIGN, normalizeDesign } from './finishes.js';

const KEY = 'pph.design.v1';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window or storage full: keep working */ }
}

export function createStore() {
  let state = normalizeDesign(read(KEY));
  const undo = [];
  const subs = new Set();
  const changed = () => { write(KEY, state); subs.forEach((fn) => fn(state)); };
  const remember = () => { undo.push(JSON.stringify(state)); if (undo.length > 200) undo.shift(); };

  return {
    get: () => state,
    canUndo: () => undo.length > 0,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    /** path like "deck.finish" */
    set(path, value) {
      const keys = path.split('.');
      let cur = state;
      for (const k of keys.slice(0, -1)) cur = cur[k];
      if (cur[keys.at(-1)] === value) return;
      remember();
      const next = JSON.parse(JSON.stringify(state));
      let o = next;
      for (const k of keys.slice(0, -1)) o = o[k];
      o[keys.at(-1)] = value;
      state = normalizeDesign(next);
      changed();
    },
    undo() {
      if (!undo.length) return;
      state = normalizeDesign(JSON.parse(undo.pop()));
      changed();
    },
    startOver() {
      if (JSON.stringify(state) === JSON.stringify(normalizeDesign(DEFAULT_DESIGN))) return;
      remember();
      state = normalizeDesign(DEFAULT_DESIGN);
      changed();
    },
  };
}

export const storage = { read, write };
