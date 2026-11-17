// The side panel: big tabs, named swatches, Undo. Plus the Layout tab for Lindsay.
import { TABS, panelGroups } from './finishes.js';
import { LAYOUT_FIELDS } from './layout.js';
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

export function createPanel(root, { store, layout }) {
  let tab = TABS[0].id, showLayout = false;

  const tabs = el('div', { class: 'tabs', role: 'tablist' });
  const body = el('div', { class: 'panel-body' });
  const undoBtn = el('button', { type: 'button', class: 'big', text: 'Undo', onclick: () => store.undo() });
  const overBtn = el('button', { type: 'button', class: 'big quiet', text: 'Start Over', onclick: () => store.startOver() });
  const layoutLink = el('button', { type: 'button', class: 'link', text: 'Layout (for Lindsay)', onclick: () => { showLayout = !showLayout; render(); } });
  const foot = el('div', { class: 'panel-foot' }, [el('div', { class: 'row' }, [undoBtn, overBtn]), layoutLink]);
  root.append(tabs, body, foot);

  function renderFinishes() {
    const d = store.get();
    body.replaceChildren();
    for (const g of panelGroups(d).filter((x) => x.tab === tab)) {
      const current = g.options.find((o) => o.id === g.value);
      const grid = el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': g.label });
      for (const o of g.options) {
        const chip = el('span', { class: 'chip' });
        chip.style.background = o.swatch;
        grid.append(el('button', {
          type: 'button', class: `swatch${o.id === g.value ? ' on' : ''}${o.wide ? ' wide' : ''}`,
          role: 'radio', 'aria-checked': String(o.id === g.value),
          onclick: () => store.set(g.path, o.id),
        }, [chip, el('span', { class: 'name', text: o.name })]));
      }
      body.append(el('section', {}, [
        el('h2', { text: g.label }),
        el('p', { class: 'picked', text: `Now: ${current ? current.name : ''}` }),
        grid,
      ]));
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
      let ftIn_, inIn_;
      const commit = () => {
        const v = (Number(ftIn_.querySelector('input').value) || 0) + (Number(inIn_.querySelector('input').value) || 0) / 12;
        layout.set(f.key, Math.min(f.max, Math.max(f.min, v)));
      };
      ftIn_ = numberField(ft, f.max, 'ft', commit);
      inIn_ = numberField(inch, 11, 'in', commit);
      form.append(el('div', { class: 'field' }, [el('span', { class: 'flabel', text: f.label }), el('div', { class: 'row' }, [ftIn_, inIn_])]));
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
    tabs.replaceChildren(...TABS.map((t) => el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(!showLayout && t.id === tab), class: !showLayout && t.id === tab ? 'on' : '', text: t.name,
      onclick: () => { tab = t.id; showLayout = false; body.scrollTop = 0; render(); },
    })));
    undoBtn.disabled = !store.canUndo();
    undoBtn.hidden = overBtn.hidden = showLayout;
    layoutLink.textContent = showLayout ? 'Close Layout' : 'Layout (for Lindsay)';
    if (showLayout) renderLayout(); else renderFinishes();
  }

  store.subscribe(render);
  layout.subscribe(render);
  render();
}
