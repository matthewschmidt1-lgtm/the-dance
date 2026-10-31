// Strategy visualizations: decision tree, payoff matrix, relationship map, leverage scale.
// Each returns an HTML/SVG string. Animations are CSS-driven and respect reduced motion.
window.PP = window.PP || {};

PP.viz = (function () {
  const toneWord = { good: `Went well`, mixed: `Mixed`, bad: `Went badly` };

  // Every move, every possible result, with the path you actually took highlighted.
  function tree(sc, chosenKey, outcomeIdx) {
    const rows = sc.options.map(o => {
      const g = PP.grades[o.q];
      const mine = o.key === chosenKey;
      const segs = o.outcomes.map((oc, i) => {
        const hit = mine && i === outcomeIdx;
        return `<span class="tree-seg tone-${oc.tone} ${hit ? 'is-hit' : ''}" style="flex:${oc.p}" title="${Math.round(oc.p * 100)}% ${toneWord[oc.tone]}">
          <span class="tree-p">${Math.round(oc.p * 100)}%</span><span class="tree-t">${toneWord[oc.tone]}</span></span>`;
      }).join('');
      return `<li class="tree-row ${mine ? 'is-mine' : ''}">
        <span class="tree-move"><span class="tree-key">${o.key}</span><span class="tree-g g${o.q}" title="${g.name}">${g.glyph}</span></span>
        <span class="tree-bar">${segs}</span>
      </li>`;
    }).join('');
    return `<div class="tree">
      <div class="tree-root"><span>Your moves</span></div>
      <ol class="tree-rows">${rows}</ol>
      <p class="viz-note">Each bar is one move. Its segments show how often that move goes well, mixed or badly. Your move and result are outlined. A strong move can still land in a bad segment.</p>
    </div>`;
  }

  function matrix(m, row, col) {
    if (!m) return '';
    const head = `<tr><th class="mx-corner"><span>${m.you}</span> ↓ <span>${m.them}</span> →</th>${m.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr>`;
    const body = m.rows.map((r, ri) => `<tr><th scope="row">${r}</th>${m.cols.map((_, ci) => {
      const [a, b] = m.cells[ri][ci];
      const hit = row === ri && col === ci;
      const best = m.best && m.best[0] === ri && m.best[1] === ci;
      const eq = m.eq && m.eq[0] === ri && m.eq[1] === ci;
      const tags = [hit ? '<span class="mx-tag">You landed here</span>' : '', best ? '<span class="mx-tag mx-tag-best">Pareto optimal · best for both</span>' : '', eq ? '<span class="mx-tag mx-tag-eq">Nash equilibrium · stable if you meet once</span>' : ''].join('');
      return `<td class="${hit ? 'is-hit' : ''} ${best ? 'is-best' : ''} ${eq ? 'is-eq' : ''}">
        <span class="mx-pay"><span class="mx-you">${a}</span><span class="mx-sep">/</span><span class="mx-them">${b}</span></span>
        ${tags}
      </td>`;
    }).join('')}</tr>`).join('');
    return `<div class="mx-wrap"><table class="mx"><caption class="sr">Payoff matrix</caption><thead>${head}</thead><tbody>${body}</tbody></table></div>
      <p class="viz-note"><strong>${m.you} / ${m.them}</strong>, scored ${m.eq ? '0–4' : '0–3'} for how well each side does. ${m.eq ? 'The stable cell is where neither side gains by switching alone. Here it is worse for both than the best cell, which is what makes this a prisoner\'s dilemma.' : 'The highlighted cell is where neither side gains by switching alone, and here it is also best for both.'} ${m.note}</p>`;
  }

  // People around you, edges colored by trust. `deltas` pulse the edges that just changed.
  function relMap(nodes, links = [], deltas = {}) {
    const W = 560, H = 360, cx = W / 2, cy = H / 2 - 4;
    const n = nodes.length;
    const pos = {};
    nodes.forEach((p, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (n === 2 ? Math.PI / 2 : 0);
      pos[p.id] = { x: cx + Math.cos(a) * 185, y: cy + Math.sin(a) * 118 };
    });
    const trustColor = v => v > 0 ? 'var(--good)' : v < 0 ? 'var(--bad)' : 'var(--muted)';
    const word = v => v >= 3 ? 'Trusting' : v >= 1 ? 'Warm' : v === 0 ? 'Neutral' : v >= -2 ? 'Wary' : 'Strained';
    const edges = nodes.map(p => {
      const q = pos[p.id], v = p.trust || 0;
      const changed = deltas[p.id];
      return `<line x1="${cx}" y1="${cy}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="${trustColor(v)}" stroke-width="${2 + Math.min(Math.abs(v), 4) * 1.4}" stroke-linecap="round" class="rm-edge ${changed ? 'is-changed' : ''}" ${v === 0 ? 'stroke-dasharray="4 6"' : ''}/>`;
    }).join('');
    const side = links.filter(([a, b]) => pos[a] && pos[b]).map(([a, b, label]) => {
      const p = pos[a], q = pos[b];
      // Label sits a third of the way along, nudged off the line, clear of both nodes' text.
      const mx = p.x + (q.x - p.x) * 0.5, my = p.y + (q.y - p.y) * 0.5;
      const len = Math.hypot(q.x - p.x, q.y - p.y) || 1, ox = -(q.y - p.y) / len * 12, oy = (q.x - p.x) / len * 12;
      return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="rm-link"/><text x="${(mx + ox).toFixed(1)}" y="${(my + oy + 4).toFixed(1)}" class="rm-link-t rm-halo" text-anchor="middle">${label}</text>`;
    }).join('');
    const dots = nodes.map(p => {
      const q = pos[p.id];
      const d = deltas[p.id];
      return `<g class="rm-node" transform="translate(${q.x.toFixed(1)},${q.y.toFixed(1)})">
        <circle r="24" class="rm-dot"/><text class="rm-init" text-anchor="middle" dy="5">${(p.short || p.name)[0]}</text>
        <text class="rm-name rm-halo" text-anchor="middle" y="41">${p.short || p.name}</text>
        <text class="rm-state rm-halo" text-anchor="middle" y="56" fill="${trustColor(p.trust || 0)}">${p.recurring ? word(p.trust || 0) : (p.role || '')}${d ? (d > 0 ? ' ▲' : ' ▼') : ''}</text>
      </g>`;
    }).join('');
    return `<svg class="relmap" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="Relationship map">
      ${edges}${side}
      <g transform="translate(${cx},${cy})"><circle r="30" class="rm-you"/><text class="rm-you-t" text-anchor="middle" dy="5">You</text></g>
      ${dots}
    </svg>`;
  }

  // A balance scale. Positive tilt means the other side holds more leverage.
  function leverage(l, themLabel) {
    if (!l) return '';
    const deg = Math.max(-12, Math.min(12, l.tilt * 1.6));
    return `<div class="lev">
      <svg class="lev-svg" viewBox="0 0 420 178" aria-hidden="true">
        <path d="M196,140 L210,92 L224,140 Z" class="lev-base"/>
        <g class="lev-beam" style="--tilt:${deg}deg">
          <rect x="40" y="86" width="340" height="7" rx="3.5" class="lev-bar"/>
          <path d="M70,93 L50,126 L110,126 Z" class="lev-pan lev-you"/><path d="M350,93 L330,126 L390,126 Z" class="lev-pan lev-them"/>
          <text x="80" y="148" text-anchor="middle" class="lev-t">You</text><text x="360" y="148" text-anchor="middle" class="lev-t">${themLabel}</text>
        </g>
        <circle cx="210" cy="90" r="6" class="lev-pivot"/>
      </svg>
      <div class="lev-cols">
        <div><h4>Your leverage</h4><ul>${l.you.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div><h4>Their leverage</h4><ul>${l.them.map(x => `<li>${x}</li>`).join('')}</ul></div>
      </div>
      <p class="viz-note">${l.tilt >= 4 ? `The other side held more leverage here. Strategy mattered more than force.` : l.tilt >= 1 ? `The other side held slightly more leverage. Goodwill could close the gap.` : l.tilt <= -4 ? `You held more leverage than it felt like in the moment.` : l.tilt <= -1 ? `You held slightly more leverage. Using it gently was the point.` : `Leverage was even. The relationship decided most of it.`}</p>
    </div>`;
  }

  return { tree, matrix, relMap, leverage };
})();
