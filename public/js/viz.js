// The decision tree: every move and every possible result, with the path you took highlighted.
// Returns an HTML string. Animations are CSS-driven and respect reduced motion.
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

  return { tree };
})();
