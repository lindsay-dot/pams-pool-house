// The side panel: big tabs, named swatches, Undo. Plus the Layout tab for Lindsay.
import { TABS, panelGroups } from './finishes.js';
import { LAYOUT_FIELDS } from './layout.js';
import { furnitureDef, sizeLabel } from './furniture.js';
import { ftIn } from './units.js';

const el = (tag, props = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) if (kid) n.append(kid);
  return n;
};

export function createPanel(root, { store, layout, furniture }) {
  let tab = TABS[0].id, showLayout = false;

  const tabs = el('div', { class: 'tabs', role: 'tablist' });
  const body = el('div', { class: 'panel-body' });
  const undoBtn = el('button', { type: 'button', class: 'big', text: 'Undo', onclick: () => store.undo() });
  const overBtn = el('button', { type: 'button', class: 'big quiet', text: 'Start Over', onclick: () => store.startOver() });
  const layoutLink = el('button', { type: 'button', class: 'link', text: 'Layout (for Lindsay)', onclick: () => { showLayout = !showLayout; render(); } });
  const foot = el('div', { class: 'panel-foot' }, [el('div', { class: 'row' }, [undoBtn, overBtn]), layoutLink]);
  root.append(tabs, body, foot);

  function swatchGroup(g) {
    const current = g.options.find((o) => o.id === g.value);
    const grid = el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': g.label });
    for (const o of g.options) {
      const chip = el('span', { class: 'chip', text: o.chipText || '' });
      chip.style.background = o.swatch;
      grid.append(el('button', {
        type: 'button', class: `swatch${o.id === g.value ? ' on' : ''}${o.wide ? ' wide' : ''}`,
        role: 'radio', 'aria-checked': String(o.id === g.value),
        onclick: () => store.set(g.path, o.id),
      }, [chip, el('span', { class: 'name', text: o.name })]));
    }
    return el('section', {}, [el('h2', { text: g.label }), el('p', { class: 'picked', text: `Now: ${current ? current.name : ''}` }), grid]);
  }

  function toggleGroup(g) {
    const list = el('div', { class: 'list' });
    for (const o of g.options) {
      const on = g.value.includes(o.id);
      list.append(el('button', {
        type: 'button', class: `rowbtn${on ? ' on' : ''}`, role: 'checkbox', 'aria-checked': String(on),
        onclick: () => store.set(g.path, on ? g.value.filter((id) => id !== o.id) : [...g.value, o.id]),
      }, [el('span', { class: 'box', text: on ? '✓' : '' }), el('span', { class: 'grow', text: o.name }), el('span', { class: 'note', text: o.note })]));
    }
    return el('section', {}, [el('h2', { text: g.label }), el('p', { class: 'picked', text: 'Tap to add or take out. Sizes are real US sizes.' }), list]);
  }

  function libraryGroup(g) {
    const list = el('div', { class: 'list' });
    for (const o of g.options) {
      list.append(el('div', { class: 'rowbtn plain' }, [
        el('span', { class: 'grow' }, [el('strong', { text: o.name }), el('span', { class: 'note block', text: o.note })]),
        el('button', { type: 'button', class: 'add', text: 'Add', 'aria-label': `Add ${o.name}`, onclick: () => furniture.add(o.id) }),
      ]));
    }
    const items = store.get().items, placed = el('div', { class: 'list' });
    for (const it of items) {
      const def = furnitureDef(it.type);
      placed.append(el('div', { class: `rowbtn plain${furniture.selected() === it.id ? ' on' : ''}` }, [
        el('button', { type: 'button', class: 'grow pickname', text: def.name, onclick: () => furniture.select(it.id) }),
        el('button', { type: 'button', class: 'add quiet', text: 'Remove', 'aria-label': `Remove ${def.name}`, onclick: () => furniture.remove(it.id) }),
      ]));
    }
    return [
      el('section', {}, [el('h2', { text: g.label }), el('p', { class: 'picked', text: 'Press Add, then drag the piece where you want it.' }), list]),
      el('section', {}, [el('h2', { text: `In the yard now (${items.length})` }), items.length ? placed : el('p', { class: 'picked', text: 'Nothing yet.' })]),
    ];
  }

  function renderFinishes() {
    const d = store.get();
    body.replaceChildren();
    for (const g of panelGroups(d).filter((x) => x.tab === tab)) {
      if (g.kind === 'toggles') body.append(toggleGroup(g));
      else if (g.kind === 'library') body.append(...libraryGroup(g));
      else body.append(swatchGroup(g));
    }
  }

  function numberField(value, max, unit, onchange) {
    const input = el('input', { type: 'number', min: '0', max: String(max), step: '1', inputmode: 'numeric', value: String(value), 'aria-label': unit });
    input.addEventListener('change', onchange);
    return el('label', { class: 'num' }, [input, el('span', { text: unit })]);
  }

  function renderLayout() {
    const L = layout.get();
    body.replaceChildren();
    body.append(el('section', { class: 'warn' }, [
      el('h2', { text: 'Layout — for Lindsay' }),
      el('p', { text: 'These are the real sizes of the yard. Changing them rebuilds the 3D model. The pool house comes from the drawings and cannot be changed here.' }),
      el('p', { class: 'picked', text: layout.isApproved() ? 'Using the approved layout.' : 'Edited — not the approved layout.' }),
    ]));
    const form = el('section', { class: 'fields' });
    for (const f of LAYOUT_FIELDS) {
      const total = Math.round(L[f.key] * 12), ft = Math.floor(total / 12), inch = total - ft * 12;
      let ftBox, inBox;
      const commit = () => {
        const v = (Number(ftBox.querySelector('input').value) || 0) + (Number(inBox.querySelector('input').value) || 0) / 12;
        layout.set(f.key, Math.min(f.max, Math.max(f.min, v)));
      };
      ftBox = numberField(ft, f.max, 'ft', commit);
      inBox = numberField(inch, 11, 'in', commit);
      form.append(el('div', { class: 'field' }, [el('span', { class: 'flabel', text: f.label }), el('div', { class: 'row' }, [ftBox, inBox])]));
    }
    for (const [key, label, min, max] of [['sunDirection', 'Sun direction', 0, 359], ['sunHeight', 'Sun height in the sky', 15, 80]]) {
      const out = el('span', { class: 'flabel', text: `${label}: ${Math.round(L[key])}°` });
      const slider = el('input', { type: 'range', min: String(min), max: String(max), value: String(L[key]), 'aria-label': label });
      slider.addEventListener('input', () => { out.textContent = `${label}: ${slider.value}°`; });
      slider.addEventListener('change', () => layout.set(key, Number(slider.value)));
      form.append(el('div', { class: 'field' }, [out, slider]));
    }
    body.append(form, el('section', {}, [
      el('p', { class: 'picked', text: `Pool ${ftIn(L.poolWidth)} × ${ftIn(L.poolLength)} · Deck ${ftIn(L.poolWidth + L.deckLeft + L.deckRight)} × ${ftIn(L.poolLength + L.deckHouseSide + L.deckPoolHouseSide)}` }),
      el('div', { class: 'row' }, [
        el('button', { type: 'button', class: 'big', text: 'Back to Approved Layout', onclick: () => layout.reset() }),
        el('button', { type: 'button', class: 'big quiet', text: 'Download site.json', onclick: () => layout.download() }),
      ]),
    ]));
  }

  function render() {
    const keep = body.scrollTop;
    tabs.replaceChildren(...TABS.map((t) => el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(!showLayout && t.id === tab), class: !showLayout && t.id === tab ? 'on' : '', text: t.name,
      onclick: () => { tab = t.id; showLayout = false; render(); body.scrollTop = 0; },
    })));
    undoBtn.disabled = !store.canUndo();
    undoBtn.hidden = overBtn.hidden = showLayout;
    layoutLink.textContent = showLayout ? 'Close Layout' : 'Layout (for Lindsay)';
    if (showLayout) renderLayout(); else renderFinishes();
    body.scrollTop = keep;
  }

  store.subscribe(render);
  layout.subscribe(render);
  render();
  return { render, showTab(id) { tab = id; showLayout = false; render(); } };
}

/** "Chaise Lounge · 2' 2" × 6' 6"" */
export const itemTitle = (type) => { const d = furnitureDef(type); return `${d.name} · ${sizeLabel(d)}`; };
