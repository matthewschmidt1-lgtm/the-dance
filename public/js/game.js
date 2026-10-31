// The Dance game flow and views.
// Progress is derived entirely from `history`, so replaying a scene is just popping it.
(function () {
  const { thinkers, thinkerOrder, skills, grades } = PP;
  const STORE_KEY = 'powerplay:ep1:v2';
  const START_RATING = 1200;
  const EP = PP.episodes[0];
  const LIST = EP.scenes.map(id => ({ ...PP.scenarios.find(s => s.id === id), stage: PP.scenes[id] }));
  const placeOf = id => EP.places.find(p => p.scenes.includes(id));
  const RECURRING = ['dana', 'gary', 'jordan', 'priya', 'marcus'];
  const app = document.getElementById('app');

  const growthAdvice = {
    str: `Before choosing, ask what each person's best reply to your move would be.`,
    reg: `Your strongest urge to act usually arrives when you know the least. Wait one beat, name the feeling, then decide.`,
    inc: `Ask what each person gains or loses before deciding what they "really" want.`,
    neg: `Look for a "yes, if" before settling for a yes or a no.`,
    com: `Say what you need plainly and give the other person an easy way to help.`,
    lng: `Ask whether you'll see this person again. If so, you're playing a different game.`,
    coo: `Look for the version where both people come out ahead before defending your share.`,
    bnd: `A clear, early limit is kinder than a late, resentful one.`,
    inf: `One good question often beats a confident guess. Freeze the scene and read the room first.`,
    jdg: `Before you act, ask two things: what does it cost to check, and what does it cost to be wrong? When checking is cheap, check.`
  };
  const strengthNote = {
    str: `You think a move ahead of the conversation.`,
    reg: `You stay steady when the room gets warm.`,
    inc: `You look for what people want before judging them.`,
    neg: `You find terms instead of settling for yes or no.`,
    com: `You make it easy for people to say yes to you.`,
    lng: `You play for the next ten rounds, so you rarely overpay to win this one.`,
    coo: `You look for outcomes where both sides win.`,
    bnd: `You protect your time without burning bridges.`,
    inf: `You gather facts before you commit.`,
    jdg: `You match the size of your move to how much you actually know.`
  };
  const toneLabel = { good: `Went well`, mixed: `Mixed`, bad: `Went badly` };

  // ───────────────────────── State

  let history = load();
  let draft = { selected: null, clues: [] };
  let confirmReset = false;
  let confirmScene = -1; // index of a played scene awaiting a second tap to replay
  let stage = null;
  const ui = { view: 'home', phase: 'intro', frozen: false, tab: 'outcome', runId: 0 };

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((h, i) => LIST[i] && LIST[i].id === h.id) : [];
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(history)); } catch (e) { /* storage unavailable */ } }

  function derive(hist) {
    const totals = Object.fromEntries(Object.keys(skills).map(k => [k, 0]));
    const rel = {}, flags = {};
    let rating = START_RATING;
    const moves = hist.map((h, i) => {
      const sc = LIST[i];
      const opt = sc.options.find(o => o.key === h.key);
      Object.entries(opt.s || {}).forEach(([k, v]) => { totals[k] += v; });
      totals.inf += Math.min(h.clues.length, 2) * 0.5;
      Object.entries(opt.rel || {}).forEach(([k, v]) => { rel[k] = (rel[k] || 0) + v; });
      Object.assign(flags, opt.flags || {});
      const before = rating;
      rating += (opt.q - 2) * 40;
      return { sc, opt, outcomeIdx: h.outcome, outcome: opt.outcomes[h.outcome], clues: h.clues, ratingBefore: before, ratingAfter: rating };
    });
    return { totals, rel, flags, rating, moves };
  }
  const skillScore = t => Math.max(0, Math.min(100, Math.round(50 + t * 3.5)));
  const text = (v, ctx) => (typeof v === 'function' ? v(ctx) : v);
  function pickOutcome(opt) {
    let r = Math.random();
    for (let i = 0; i < opt.outcomes.length; i++) { r -= opt.outcomes[i].p; if (r <= 0) return i; }
    return opt.outcomes.length - 1;
  }

  // ───────────────────────── Routing

  function teardown() {
    if (stage) { stage.destroy(); stage = null; }
    ui.runId++;
  }

  function go(view) {
    teardown();
    ui.view = view;
    const hash = view === 'home' ? '' : '#' + view;
    if (location.hash !== hash) window.history.replaceState(null, '', hash || location.pathname);
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // ───────────────────────── Shared pieces

  const pawnSvg = `<svg class="pawn" viewBox="0 0 40 48" aria-hidden="true"><circle cx="20" cy="10" r="7"/><path d="M13 20h14l-2.5 4c3 4 4.5 9 5 15H10.5c.5-6 2-11 5-15z"/><rect x="7" y="40" width="26" height="6" rx="2"/></svg>`;

  function strip(current, d) {
    return `<ol class="file-strip" aria-label="Episode progress">${LIST.map((sc, i) => {
      const m = d.moves[i];
      const cls = ['sq', i % 2 ? 'sq-l' : 'sq-d', i === current ? 'is-current' : '', m ? 'is-done' : ''].join(' ');
      const inner = i === current ? pawnSvg : m ? `<span class="sq-glyph">${grades[m.opt.q].glyph}</span>` : `<span class="sq-rank">${i + 1}</span>`;
      return `<li class="${cls}" title="Scene ${i + 1}: ${sc.title}"><span class="sr">Scene ${i + 1}, ${sc.title}${m ? ', played' : ''}</span>${inner}</li>`;
    }).join('')}</ol>`;
  }

  function staticScene(sc, moods) {
    return PP.art.sceneSvg(sc.stage, PP.people, moods || {}, `${sc.title}: illustrated scene`).svg;
  }

  // ───────────────────────── Home

  function viewHome() {
    const d = derive(history);
    const n = history.length, done = n >= LIST.length;
    const primary = done ? `<button class="btn btn-primary" data-act="profile">See your results</button>`
      : n ? `<button class="btn btn-primary" data-act="play">Continue · Scene ${n + 1}</button>`
        : `<button class="btn btn-primary" data-act="play">Play Episode 1</button>`;

    const places = EP.places.map(p => {
      const sc = LIST.find(s => s.id === p.preview);
      return `<article class="place">
        <div class="place-art">${staticScene(sc)}</div>
        <div class="place-copy">
          <h3>${p.name}</h3>
          <p>${p.theme}</p>
          <ul class="place-scenes">${p.scenes.map(id => {
            const i = LIST.findIndex(s => s.id === id), m = d.moves[i];
            // Scenes build on earlier choices, so: replay what you've played, start what's next, the rest unlock in order.
            if (i < n) {
              const asking = confirmScene === i;
              return `<li><button type="button" class="ps-btn ${asking ? 'is-asking' : ''}" data-act="scene" data-i="${i}">
                <span class="ps-n">${i + 1}</span><span class="ps-title">${asking ? `Replay ${LIST[i].title}?` : LIST[i].title}</span>
                ${asking ? `<span class="ps-note">${i < n - 1 ? 'Tap again. Later scenes reset.' : 'Tap again to replay.'}</span>` : `<span class="ps-g g${m.opt.q}" title="${grades[m.opt.q].name}">${grades[m.opt.q].glyph}</span><span class="ps-tag">Replay</span>`}
              </button></li>`;
            }
            if (i === n) {
              return `<li><button type="button" class="ps-btn is-next" data-act="scene" data-i="${i}"><span class="ps-n">${i + 1}</span><span class="ps-title">${LIST[i].title}</span><span class="ps-tag ps-tag-next">Up next</span></button></li>`;
            }
            return `<li><span class="ps-btn is-locked" aria-disabled="true"><span class="ps-n">${i + 1}</span><span class="ps-title">${LIST[i].title}</span><span class="ps-lock"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Unlocks after Scene ${i}</span></span></li>`;
          }).join('')}</ul>
        </div>
      </article>`;
    }).join('');

    const cred = LIST.find(s => s.id === 'credit-taker');
    const pins = cred.stage.cast.map((c, i) => {
      const h = PP.people[c.id].look.h || 1;
      const p = PP.art.place(cred.stage.env, c);
      return `<span class="pin" style="left:${(p.x / 1600 * 100).toFixed(1)}%;top:${((p.y - 600 * p.s * h) / 900 * 100).toFixed(1)}%">${i + 1}</span>`;
    }).join('');

    const bench = thinkerOrder.map(k => {
      const t = thinkers[k];
      return `<li><button type="button" class="bench-card ${t.grandfather ? 'is-grand' : ''}" data-thinker="${k}" aria-haspopup="dialog" style="--tc:${t.color}"><span class="bench-icon">${t.icon}</span>${t.grandfather ? `<span class="bench-badge">Intellectual grandfather</span>` : ''}<span class="bench-name">${t.name}</span><span class="bench-teaches">teaches you ${t.teaches}</span><span class="bench-more" aria-hidden="true">Read more</span></button></li>`;
    }).join('');

    const ep2 = PP.episodes[1];
    return `
      <section class="hero-cine">
        <div class="hero-art"><img src="/img/hero-dance-floor.webp" width="2400" height="1028" alt="Two chess pieces, one ivory and one black, face each other on a checkered dance floor. Each stands in its own spotlight; where the light overlaps, a teal circle glows between them. Dance steps lead toward them, dice rest in the foreground, and a corridor of doorways recedes into haze toward a lit exit."></div>
        <div class="hero-over">
          <div class="wrap hero-over-in">
            <p class="eyebrow eyebrow-on-dark">Episode ${EP.number} · ${EP.title}</p>
            <h1 class="hero-title">You don't have to be the most powerful person in the room.</h1>
            <p class="hero-sub">You have to understand the room.</p>
            <div class="hero-actions">${primary}<button class="btn btn-ghost btn-on-dark" data-act="bench">Meet the thinkers</button></div>
          </div>
        </div>
      </section>

      <section class="wrap hook">
        <p class="hook-line">"I've been in that exact situation. What should I have done?"</p>
        <p class="hook-sub">Every scene in The Dance is something that has happened to you, or will. You watch it unfold, choose what to do, and see how the people in the room react. Then you see the game underneath.</p>
      </section>

      <section class="wrap places">
        <div class="section-head"><p class="eyebrow">Episode 1 · Three places</p><h2>${EP.blurb}</h2></div>
        <div class="place-grid">${places}</div>
      </section>

      <section class="band">
        <div class="wrap slowmo">
          <div class="slowmo-copy">
            <p class="eyebrow">Signature feature</p>
            <h2>Slow Motion Strategy</h2>
            <p class="lede">Freeze any scene mid-conversation. The room goes still, and you see what each person wants, what you know, what you don't, and where each option might lead. Then resume, or replay the scene with a different approach.</p>
          </div>
          <div class="slowmo-still">
            <div class="stage is-frozen is-still">${staticScene(cred, { jordan: { mood: 'awkward', pose: 'clicker' }, ellen: { mood: 'happy' } })}
              <div class="pins">${pins}</div><div class="freeze-badge"><span class="freeze-dot"></span>Slow Motion Strategy</div></div>
            <ol class="still-legend">${cred.stage.cast.map((c, i) => `<li><span class="pin pin-inline">${i + 1}</span><strong>${PP.people[c.id].name}</strong> wants ${c.wants.charAt(0).toLowerCase() + c.wants.slice(1)}</li>`).join('')}</ol>
          </div>
        </div>
      </section>

      <section class="wrap bench-sec">
        <div class="section-head"><p class="eyebrow">The bench</p><h2>Six thinkers. One question each.</h2>
          <p class="lede">Each scene is seen through one of their lenses. Thomas Schelling sits at the head of the table: he studied people whose interests partly conflict and partly overlap, which describes almost everyone you'll meet.</p></div>
        <ul class="bench-grid">${bench}</ul>
        <dialog class="thinker-dialog" id="thinker-dialog" aria-labelledby="thinker-dialog-h">
          <div class="thinker thinker-pop"></div>
          <form method="dialog" class="thinker-close-row"><button class="btn btn-ghost btn-sm" value="close">Close</button></form>
          <form method="dialog"><button class="thinker-x" value="close" aria-label="Close">×</button></form>
        </dialog>
        <button class="btn btn-link" data-act="bench">Read what each one teaches →</button>
      </section>

      <section class="wrap next-ep">
        <div class="next-card">
          <span class="lock" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>
          <div><p class="eyebrow">Episode ${ep2.number} · In development</p><h3>${ep2.title}</h3><p>${ep2.blurb}</p></div>
        </div>
      </section>

      <section class="wrap next-move" aria-labelledby="next-move-h">
        <div class="section-head"><p class="eyebrow">Your next move</p><h2 id="next-move-h">See the game without becoming the game.</h2></div>
        <div class="nm-grid">
          <button class="nm nm-play" data-act="${done ? 'profile' : 'play'}">
            <img class="nm-art" src="/img/next/play.webp" width="720" height="720" alt="" loading="lazy">
            <span class="nm-k">${done ? 'Episode complete' : n ? `Scene ${n + 1} of ${LIST.length}` : 'Start here'}</span>
            <span class="nm-t">${done ? 'See your results' : n ? 'Continue playing' : 'Play Episode 1'}</span>
            <span class="nm-d">${done ? 'Your rating, your ten measures, and who trusts you now.' : n ? `Pick up at ${LIST[n].title}.` : 'Six scenes across three places, starting at a grocery store checkout.'}</span>
            <span class="nm-go" aria-hidden="true">→</span>
          </button>
          <button class="nm nm-bench" data-act="bench">
            <img class="nm-art" src="/img/next/bench.webp" width="720" height="720" alt="" loading="lazy">
            <span class="nm-k">The bench</span>
            <span class="nm-t">Meet the thinkers</span>
            <span class="nm-d">Six ideas from Schelling, Nash, Aumann, Axelrod, Nalebuff and Duke, one question each.</span>
            <span class="nm-go" aria-hidden="true">→</span>
          </button>
          <button class="nm nm-prof" data-act="profile">
            <img class="nm-art" src="/img/next/profile.webp" width="720" height="720" alt="" loading="lazy">
            <span class="nm-k">Your profile</span>
            <span class="nm-t">${n ? 'See how you play' : 'What gets measured'}</span>
            <span class="nm-d">${n ? 'Strengths, blind spots, and decisions versus luck.' : 'Ten measures of strategic judgment. Getting your way isn\'t one of them.'}</span>
            <span class="nm-go" aria-hidden="true">→</span>
          </button>
        </div>
      </section>`;
  }

  // ───────────────────────── Bench

  function thinkerEntry(k, h = 'h3', id = '') {
    const t = thinkers[k], I = PP.uiIcons;
    const used = LIST.filter(s => s.lens[0] === k).map(s => s.title);
    const also = LIST.filter(s => s.lens.slice(1).includes(k)).map(s => s.title);
    const chips = list => list.map(x => `<li class="te-chip">${x}</li>`).join('');
    return `<header class="te-head">
          <span class="te-icon">${t.icon}</span>
          <div class="te-title"><p class="te-field">${t.field}</p><${h}${id ? ` id="${id}"` : ''}>${t.name}</${h}>${t.grandfather ? `<p class="te-badge">Intellectual grandfather of The Dance</p>` : ''}</div>
        </header>
        <p class="te-teaches"><span class="te-mark">${I.teaches}</span><span>${t.short} teaches you <strong>${t.teaches}</strong>.</span></p>
        <p class="te-idea">${t.idea}</p>
        <div class="te-ask"><p class="te-label"><span class="te-mark">${I.ask}</span>The question to ask</p><p class="te-q">${t.ask}</p></div>
        ${used.length || also.length ? `<div class="te-scenes"><p class="te-label"><span class="te-mark">${I.scenes}</span>Where you'll meet this idea</p>
          ${used.length ? `<div class="te-row"><span class="te-row-k">Main lens</span><ul class="te-chips">${chips(used)}</ul></div>` : ''}
          ${also.length ? `<div class="te-row"><span class="te-row-k">Also in</span><ul class="te-chips te-chips-soft">${chips(also)}</ul></div>` : ''}
        </div>` : ''}`;
  }

  function viewBench() {
    const cards = thinkerOrder.map(k => `<article class="thinker ${thinkers[k].grandfather ? 'is-grand' : ''}" style="--tc:${thinkers[k].color}">${thinkerEntry(k)}</article>`).join('');
    return `<section class="wrap page">
      <div class="section-head"><p class="eyebrow">The bench</p><h1>The thinkers behind the game</h1>
        <p class="lede">You won't be asked to memorize anything. Each scene puts one of these ideas in front of you as a situation, and the analysis afterward names it.</p></div>
      <div class="thinker-grid">${cards}</div>
      <div class="page-actions"><button class="btn btn-primary" data-act="play">${history.length ? 'Back to the episode' : 'Play Episode 1'}</button></div>
    </section>`;
  }

  // ───────────────────────── Play

  function currentIndex() { return ui.phase === 'result' || ui.phase === 'react' ? history.length - 1 : history.length; }

  function viewPlay() {
    const idx = currentIndex();
    const sc = LIST[idx];
    const d = derive(history.slice(0, idx));
    const place = placeOf(sc.id);
    return `<section class="play">
      <div class="wrap play-head">
        ${strip(idx, derive(history))}
        <div class="play-meta">
          <p class="meta">Episode 1 · Scene ${idx + 1} of ${LIST.length} · ${place.name}</p>
          <div class="chips"><span class="chip">${sc.level}</span>${sc.lens.map((k, i) => `<span class="chip ${i ? '' : 'chip-lens'}">${i ? 'Also' : 'Lens'} · ${thinkers[k].short}</span>`).join('')}</div>
        </div>
      </div>
      <div class="stage-wrap wrap-stage" id="stage-mount"></div>
      <div class="wrap panel-wrap"><div class="panel" id="panel"></div></div>
    </section>`;
  }

  function mountStage(sc, idx) {
    if (stage) stage.destroy();
    const d = derive(history.slice(0, idx));
    stage = new PP.Stage(document.getElementById('stage-mount'), sc.stage, {
      ctx: { rel: d.rel, flags: d.flags },
      label: `${sc.title}. ${sc.setting}`,
      onFreeze: () => { ui.frozen = true; renderPanel(); },
      onResume: () => { ui.frozen = false; renderPanel(); }
    });
  }

  async function playIntro() {
    const idx = history.length;
    const sc = LIST[idx];
    const run = ++ui.runId;
    ui.phase = 'intro'; ui.frozen = false;
    mountStage(sc, idx);
    renderPanel();
    await stage.run(sc.stage.intro, { title: `<span>Scene ${idx + 1} · ${placeOf(sc.id).name}</span><strong>${sc.title}</strong>` });
    if (run !== ui.runId) return;
    ui.phase = 'decide';
    renderPanel();
  }

  function toDecision() {
    const idx = history.length;
    const sc = LIST[idx];
    ui.runId++;
    ui.phase = 'decide'; ui.frozen = false;
    mountStage(sc, idx);
    stage.settle(sc.stage.intro);
    renderPanel();
  }

  async function playReaction() {
    const idx = history.length - 1;
    const sc = LIST[idx];
    const h = history[idx];
    const opt = sc.stage.options[h.key];
    const run = ++ui.runId;
    ui.phase = 'react';
    renderPanel();
    const beats = [opt.line ? { you: opt.line } : { caption: opt.caption, cam: 'wide' }, ...opt.outcomes[h.outcome].beats];
    await stage.run(beats);
    if (run !== ui.runId) return;
    ui.phase = 'result'; ui.tab = 'outcome';
    renderPanel();
    const p = document.getElementById('panel');
    if (p && window.innerWidth < 900) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPanel() {
    const p = document.getElementById('panel');
    if (!p) return;
    const idx = currentIndex();
    const sc = LIST[idx];
    let html;
    if (ui.frozen) html = panelFrozen(sc);
    else if (ui.phase === 'intro') html = panelWatching(sc, `Watch the scene. Tap the stage to move faster, or press Slow-mo to freeze it and study the room.`);
    else if (ui.phase === 'react') html = panelWatching(sc, `The room reacts…`);
    else if (ui.phase === 'decide') html = panelDecide(sc);
    else html = panelResult(sc);
    p.innerHTML = html;
    p.dataset.phase = ui.frozen ? 'frozen' : ui.phase;
  }

  function panelWatching(sc, msg) {
    return `<div class="watch"><span class="rec-dot" aria-hidden="true"></span><p>${msg}</p>
      ${ui.phase === 'intro' ? `<button class="btn btn-ghost btn-sm" data-act="to-decision">Skip to the decision</button>` : ''}</div>`;
  }

  function panelDecide(sc) {
    const options = sc.options.map(o => `<li>
      <input type="radio" name="move" id="move-${sc.id}-${o.key}" value="${o.key}" ${draft.selected === o.key ? 'checked' : ''}>
      <label for="move-${sc.id}-${o.key}" class="option"><span class="option-key">${o.key}</span><span class="option-text">${o.text}</span></label>
    </li>`).join('');
    return `<form id="decide-form" class="decide">
      <div class="decide-top">
        <fieldset><legend class="decide-q">${sc.question}</legend><ul class="options">${options}</ul></fieldset>
      </div>
      <div class="decide-bar">
        <button type="button" class="btn btn-ghost" data-act="freeze"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Freeze and analyze</button>
        <button type="submit" class="btn btn-primary" id="evaluate-btn" ${draft.selected ? '' : 'disabled'}>Make this move</button>
      </div>
      <p class="decide-hint">${draft.clues.length ? `You've read ${draft.clues.length} of ${sc.clues.length} details in the room.` : `Tip: freezing the scene lets you read the room before you commit.`} <button type="button" class="btn-link-sm" data-act="replay-intro">Watch the scene again</button></p>
    </form>`;
  }

  function panelFrozen(sc) {
    const cast = sc.stage.cast.map((c, i) => {
      const meta = sc.cast[i] || {};
      return `<li class="who"><span class="pin pin-inline">${i + 1}</span><div>
        <p class="who-name"><strong>${PP.people[c.id].name}</strong> <span>${meta.role || ''}</span></p>
        <p class="who-want">Wants: ${c.wants}</p>
        <p class="who-tags"><span class="tag">${meta.archetype || ''}</span><span class="tag tag-power">Power: ${meta.power || ''}</span></p>
      </div></li>`;
    }).join('');
    const clues = sc.clues.map((c, i) => {
      const open = draft.clues.includes(i);
      return `<li class="clue ${open ? 'is-open' : ''}"><button type="button" class="clue-btn" data-clue="${i}" ${open ? 'disabled' : ''} aria-expanded="${open}"><span class="clue-label">${c.label}</span><span class="clue-state">${open ? 'Noted' : 'Look'}</span></button>${open ? `<p class="clue-text">${c.text}</p>` : ''}</li>`;
    }).join('');
    const opts = sc.options.map(o => `<li><span class="option-key">${o.key}</span><div><p class="fo-text">${o.text}</p><p class="fo-prev">${sc.stage.options[o.key].preview}</p></div></li>`).join('');
    const canDecide = ui.phase === 'decide' || ui.phase === 'intro';
    return `<div class="frozen">
      <div class="frozen-head"><p class="eyebrow">Slow Motion Strategy · scene frozen</p>
        <div class="frozen-acts">
          <button class="btn btn-primary" data-act="resume"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2l10 6-10 6z"/></svg>Resume</button>
          <button class="btn btn-ghost" data-act="replay-intro">Replay from the start</button>
        </div></div>
      <div class="frozen-grid">
        <section class="fz"><h2 class="block-h">Who wants what</h2><ol class="whos">${cast}</ol></section>
        <section class="fz"><h2 class="block-h">Information</h2>
          <div class="ku"><div><h3 class="ku-h">You know</h3><ul class="ticks">${sc.known.map(k => `<li>${k}</li>`).join('')}</ul></div>
          <div><h3 class="ku-h">Still uncertain</h3><ul class="ticks ticks-q">${sc.unknown.map(k => `<li>${k}</li>`).join('')}</ul></div></div>
          <h3 class="ku-h ku-gap">Read the room</h3><ul class="clues">${clues}</ul></section>
      </div>
      ${canDecide ? `<section class="fz"><h2 class="block-h">Your options and where they might lead</h2><ol class="fopts">${opts}</ol>
        <p class="small">These are possibilities, not grades. The scene decides what actually happens.</p></section>` : ''}
    </div>`;
  }

  function panelResult(sc) {
    const idx = history.length - 1;
    const all = derive(history);
    const move = all.moves[idx];
    const before = derive(history.slice(0, idx));
    const { opt, outcome } = move;
    const st = sc.stage.options[opt.key];
    const g = grades[opt.q];
    const a = sc.analysis;
    const last = idx === LIST.length - 1;
    const ctxAfter = { rel: all.rel, flags: all.flags };
    const ratingDelta = move.ratingAfter - move.ratingBefore;
    const why = opt.q >= 3 && outcome.tone !== 'good' ? `A sound decision that didn't fully pay off this time. Keep making it. Over many tries, sound decisions come out ahead.`
      : opt.q <= 1 && outcome.tone === 'good' ? `It worked out, but the reasoning was weak. Be most careful here: a lucky win teaches you to do it again.`
        : `The grade judges the decision. The result includes things you couldn't control.`;

    const tabs = [['outcome', 'Outcome'], ['game', 'The game'], ['people', 'The people'], ['lens', 'The lens']];
    const tabBar = `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="tab" data-tab="${k}" aria-selected="${ui.tab === k}" id="tab-${k}" aria-controls="tp-${k}">${l}</button>`).join('')}</div>`;

    let body = '';
    if (ui.tab === 'outcome') {
      const deltas = Object.entries(opt.s || {}).filter(([, v]) => v).sort((x, y) => y[1] - x[1])
        .map(([k, v]) => `<li class="delta ${v > 0 ? 'up' : 'down'}"><span>${v > 0 ? '+' : '−'}${Math.abs(v)}</span>${skills[k]}</li>`).join('')
        + (move.clues.length ? `<li class="delta up"><span>+${Math.min(move.clues.length, 2) * 0.5}</span>${skills.inf} (read the room)</li>` : '');
      const rels = Object.entries(opt.rel || {}).filter(([, v]) => v).map(([k, v]) => `<li class="relchip ${v > 0 ? 'up' : 'down'}">${PP.people[k].name} ${v > 0 ? 'trusts you more' : 'trusts you less'}</li>`).join('');
      body = `
        <div class="verdict">
          <div class="verdict-glyph g${opt.q}" aria-hidden="true">${g.glyph}</div>
          <div class="verdict-copy">
            <p class="eyebrow">You played ${opt.key}</p><h2>${g.name}</h2><p class="verdict-note">${g.note}</p>
            <div class="verdict-pills"><span class="pill">Decision: ${g.name}</span><span class="pill pill-${outcome.tone}">Result: ${toneLabel[outcome.tone]}</span><span class="pill pill-num">Rating ${move.ratingAfter} <small>(${ratingDelta >= 0 ? '+' : '−'}${Math.abs(ratingDelta)})</small></span></div>
            <p class="verdict-why">${why}</p>
          </div>
        </div>
        <ol class="timeline">
          <li><span class="tl-k">Right now</span><p>${outcome.text}</p></li>
          <li><span class="tl-k">Later</span><p>${text(opt.later, ctxAfter)}</p>${rels ? `<ul class="relchips">${rels}</ul>` : ''}</li>
        </ol>
        <h3 class="block-h">How it shaped your profile</h3><ul class="deltas">${deltas}</ul>`;
    } else if (ui.tab === 'game') {
      body = `
        <h3 class="viz-h">Payoff matrix</h3>${PP.viz.matrix(sc.stage.matrix, st.row, st.outcomes[move.outcomeIdx].col)}
        <h3 class="viz-h">Decision tree</h3>${PP.viz.tree(sc, opt.key, move.outcomeIdx)}
        <h3 class="viz-h">What reading the room would have shown</h3>
        <ul class="clue-recap">${sc.clues.map((c, i) => `<li class="${move.clues.includes(i) ? 'is-seen' : ''}"><strong>${c.label}</strong> <span class="seen">${move.clues.includes(i) ? 'You looked' : 'You didn\'t look'}</span><p>${c.text}</p></li>`).join('')}</ul>`;
    } else if (ui.tab === 'people') {
      const nodes = sc.stage.cast.map((c, i) => ({ id: c.id, name: PP.people[c.id].name, short: PP.people[c.id].short, trust: all.rel[c.id] || 0, recurring: RECURRING.includes(c.id), role: (sc.cast[i] || {}).role }));
      const mainThem = PP.people[sc.stage.cast[0].id].name;
      body = `
        <div class="people-grid">
          <div><h3 class="viz-h">Relationship map</h3>${PP.viz.relMap(nodes, sc.stage.links, opt.rel || {})}
            <p class="viz-note">Lines show trust between you and each person. Gray dashed lines are neutral. Labels between others show how they're connected to each other.</p></div>
          <div><h3 class="viz-h">Where the leverage was</h3>${PP.viz.leverage(sc.stage.leverage, mainThem)}</div>
        </div>
        <h3 class="viz-h">What each person wanted</h3>
        <ul class="wants">${sc.stage.cast.map(c => `<li><strong>${PP.people[c.id].name}</strong>${c.wants}</li>`).join('')}</ul>
        <dl class="analysis">${[['What game you were playing', a.game], ['What people wanted', a.incentives], ['What you controlled', a.controlled], ['What you couldn\'t control', a.couldnt]].map(([k, v]) => `<div class="arow"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    } else {
      const concept = c => { const t = thinkers[c.thinker]; return `<article class="concept ${t.grandfather ? 'is-grand' : ''}"><p class="concept-who">${t.name} · ${t.field}</p><h3>${c.name}</h3><p>${c.body}</p></article>`; };
      const others = sc.options.map(o => `<li class="other ${o.key === opt.key ? 'is-mine' : ''}"><span class="other-glyph g${o.q}" title="${grades[o.q].name}">${grades[o.q].glyph}</span><span class="other-text"><strong>${o.key}.</strong> ${o.text}${o.key === opt.key ? ' <em>(your move)</em>' : ''}</span></li>`).join('');
      body = `<div class="concepts">${concept(a.concept)}${concept(a.second)}</div>
        <dl class="analysis">${[['Where the leverage was', a.leverage], ['What information was missing', a.missing], ['Assumptions you might have made', a.assumptions]].map(([k, v]) => `<div class="arow"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <h3 class="viz-h">Every move on the board</h3><ul class="others">${others}</ul>
        <p class="better"><strong>Strongest line:</strong> ${a.better}</p>
        <p class="lesson">${a.lesson}</p>`;
    }

    return `<div class="result">
      ${tabBar}
      <div class="tabpanel" role="tabpanel" id="tp-${ui.tab}" aria-labelledby="tab-${ui.tab}">${body}</div>
      <div class="result-bar">
        <button class="btn btn-ghost" data-act="takeback">Replay with another strategy</button>
        <button class="btn btn-primary" data-act="${last ? 'profile' : 'next'}">${last ? 'See your results' : `Next scene`}</button>
      </div>
    </div>`;
  }

  // ───────────────────────── Profile

  function viewProfile() {
    const d = derive(history);
    const n = history.length;
    if (!n) return `<section class="wrap page empty"><p class="eyebrow">Your profile</p><h1>No moves yet.</h1>
      <p class="lede">Your profile builds from real choices: ten measures of strategic intelligence, how your relationships changed, and whether your good results came from good decisions.</p>
      <div class="page-actions"><button class="btn btn-primary" data-act="play">Play Episode 1</button></div></section>`;
    const done = n >= LIST.length;
    const touched = Object.keys(skills).filter(k => d.moves.some(m => m.opt.s && m.opt.s[k] !== undefined) || (k === 'inf' && d.moves.some(m => m.clues.length)));
    const ranked = touched.map(k => ({ k, v: skillScore(d.totals[k]) })).sort((x, y) => y.v - x.v);
    const strengths = ranked.filter(r => r.v > 55).slice(0, 2);
    const growth = ranked.filter(r => r.v < 60).slice(-2).reverse();
    const bars = Object.keys(skills).map(k => {
      const has = touched.includes(k), v = skillScore(d.totals[k]);
      return `<li class="bar ${has ? '' : 'is-empty'}"><span class="bar-name">${skills[k]}</span><span class="bar-track" aria-hidden="true"><span class="bar-mid"></span><span class="bar-fill" style="width:${has ? v : 0}%"></span></span><span class="bar-val">${has ? v : '—'}</span></li>`;
    }).join('');
    const quad = { earned: 0, unlucky: 0, lucky: 0, lesson: 0 };
    d.moves.forEach(m => { const gd = m.opt.q >= 3, gr = m.outcome.tone === 'good'; quad[gd ? (gr ? 'earned' : 'unlucky') : (gr ? 'lucky' : 'lesson')]++; });
    const record = d.moves.map((m, i) => `<li class="rec"><span class="rec-n">${i + 1}.</span><span class="rec-move">${m.opt.key}<span class="rec-glyph g${m.opt.q}">${grades[m.opt.q].glyph}</span></span><span class="rec-title">${m.sc.title}</span><span class="rec-tone pill-${m.outcome.tone}">${toneLabel[m.outcome.tone]}</span></li>`).join('');
    const met = RECURRING.filter(id => d.rel[id] !== undefined);
    const net = met.length ? PP.viz.relMap(met.map(id => ({ id, name: PP.people[id].name, trust: d.rel[id], recurring: true })), [['priya', 'marcus', 'rivals'], ['jordan', 'marcus', 'allies']].filter(([x, y]) => met.includes(x) && met.includes(y))) : `<p class="small">Nobody remembers you yet.</p>`;
    const lensesMet = [...new Set(d.moves.flatMap(m => m.sc.lens))];

    return `<section class="wrap page profile">
      <header class="profile-head">
        <div><p class="eyebrow">${done ? 'Episode 1 complete' : `Scene ${n} of ${LIST.length} played`}</p>
          <h1>${done ? 'You read the room.' : 'Your profile so far'}</h1>
          <p class="lede">${done ? `You walked into six ordinary situations with no title and no special power. Here's how you played them.` : `Built from your actual choices. It sharpens as you play the remaining ${LIST.length - n} scene${LIST.length - n === 1 ? '' : 's'}.`}</p></div>
        <div class="rating-card"><span class="rating-label">Strategic rating</span><span class="rating-num">${d.rating}</span><span class="rating-sub">Started at ${START_RATING}</span></div>
      </header>
      <div class="profile-grid">
        <section class="block card"><h2 class="block-h">Ten measures <span class="block-hint">50 is where everyone starts</span></h2><ul class="bars">${bars}</ul></section>
        <section class="block card"><h2 class="block-h">Decisions vs. results</h2><p class="small">Annie Duke's warning: don't grade a decision by how it turned out.</p>
          <div class="quad">
            <div class="quad-cell q-earned"><span class="quad-n">${quad.earned}</span><span class="quad-k">Earned</span><span class="quad-d">Good decision, good result</span></div>
            <div class="quad-cell q-unlucky"><span class="quad-n">${quad.unlucky}</span><span class="quad-k">Unlucky</span><span class="quad-d">Good decision, poor result</span></div>
            <div class="quad-cell q-lucky"><span class="quad-n">${quad.lucky}</span><span class="quad-k">Got lucky</span><span class="quad-d">Weak decision, good result</span></div>
            <div class="quad-cell q-lesson"><span class="quad-n">${quad.lesson}</span><span class="quad-k">Lesson</span><span class="quad-d">Weak decision, poor result</span></div>
          </div></section>
      </div>
      <section class="block feedback">
        <div><h2 class="block-h">What you do well</h2>${strengths.length ? `<ul class="fb">${strengths.map(r => `<li><strong>${skills[r.k]}.</strong> ${strengthNote[r.k]}</li>`).join('')}</ul>` : `<p class="small">No clear strength yet. That usually means your choices have been inconsistent, which is worth noticing.</p>`}</div>
        <div><h2 class="block-h">What to work on</h2>${growth.length ? `<ul class="fb">${growth.map(r => `<li><strong>${skills[r.k]}.</strong> ${growthAdvice[r.k]}</li>`).join('')}</ul>` : `<p class="small">No recurring weakness so far. Keep an eye on whether that holds as the scenes get harder.</p>`}</div>
      </section>
      <div class="profile-grid">
        <section class="block card"><h2 class="block-h">Your network</h2>${net}</section>
        <section class="block card"><h2 class="block-h">Game record</h2><ol class="record">${record}</ol>
          <h2 class="block-h block-h-gap">Lenses you've played through</h2><ul class="lenses">${lensesMet.map(k => `<li>${thinkers[k].name}</li>`).join('')}</ul></section>
      </div>
      <div class="page-actions">${done ? '' : `<button class="btn btn-primary" data-act="play">Continue · Scene ${n + 1}</button>`}
        <button class="${done && !confirmReset ? 'btn btn-primary' : 'btn btn-ghost'} ${confirmReset ? 'is-danger' : ''}" data-act="reset">${confirmReset ? 'Tap again to erase this run' : done ? 'Play Episode 1 again' : 'Start over'}</button></div>
    </section>`;
  }

  // ───────────────────────── Render + events

  function render() {
    if (ui.view === 'play' && history.length >= LIST.length && ui.phase !== 'result' && ui.phase !== 'react') ui.view = 'profile';
    const views = { home: viewHome, bench: viewBench, play: viewPlay, profile: viewProfile };
    app.innerHTML = views[ui.view]();
    document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === ui.view ? 'page' : 'false'));
    // The home page opens on a dark image, so its nav bar and the phone's browser bar go dark to match.
    document.body.classList.toggle('on-home', ui.view === 'home');
    const light = document.querySelector('meta[name="theme-color"][media*="light"]');
    if (light) light.content = ui.view === 'home' ? '#0e1014' : '#f6f1e7';
    const sc = ui.view === 'play' ? LIST[currentIndex()] : null;
    document.title = (sc ? `${sc.title} · ` : ui.view === 'bench' ? 'The Bench · ' : ui.view === 'profile' ? 'Profile · ' : '') + 'The Dance';

    if (ui.view === 'play') {
      if (ui.phase === 'result') { mountStage(LIST[history.length - 1], history.length - 1); settleResult(); renderPanel(); }
      else playIntro();
    }
  }

  function settleResult() {
    const idx = history.length - 1, sc = LIST[idx], h = history[idx];
    stage.settle([...sc.stage.intro, ...sc.stage.options[h.key].outcomes[h.outcome].beats]);
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); if (nav.dataset.nav === 'play') ui.phase = 'intro'; go(nav.dataset.nav); return; }

    const clue = e.target.closest('[data-clue]');
    if (clue) { const i = Number(clue.dataset.clue); if (!draft.clues.includes(i)) draft.clues.push(i); renderPanel(); return; }

    const who = e.target.closest('[data-thinker]');
    if (who) {
      const dlg = document.getElementById('thinker-dialog');
      const box = dlg.querySelector('.thinker-pop');
      box.className = `thinker thinker-pop ${thinkers[who.dataset.thinker].grandfather ? 'is-grand' : ''}`;
      box.style.setProperty('--tc', thinkers[who.dataset.thinker].color);
      box.innerHTML = thinkerEntry(who.dataset.thinker, 'h2', 'thinker-dialog-h');
      dlg.returnTo = who;
      dlg.showModal();
      return;
    }
    // A click on the dimmed backdrop (the dialog element itself) closes the popup.
    if (e.target.id === 'thinker-dialog') { e.target.close(); return; }

    const tab = e.target.closest('[data-tab]');
    if (tab) {
      const before = tab.getBoundingClientRect().top;
      ui.tab = tab.dataset.tab; renderPanel();
      const now = document.getElementById(`tab-${ui.tab}`);
      if (now) { window.scrollBy(0, now.getBoundingClientRect().top - before); now.focus({ preventScroll: true }); }
      return;
    }

    const act = e.target.closest('[data-act]');
    if (!act) return;
    const a = act.dataset.act;
    if (a !== 'reset') confirmReset = false;
    if (a !== 'scene') confirmScene = -1;
    switch (a) {
      case 'play': ui.phase = 'intro'; go('play'); break;
      case 'bench': go('bench'); break;
      case 'profile': go('profile'); break;
      case 'freeze': stage && stage.freeze(); break;
      case 'resume': stage && stage.resume(); break;
      case 'to-decision': toDecision(); break;
      case 'replay-intro': draft.selected = null; playIntro(); break;
      case 'next': draft = { selected: null, clues: [] }; ui.phase = 'intro'; render(); window.scrollTo({ top: 0 }); break;
      case 'takeback': {
        const last = history.pop(); save();
        draft = { selected: null, clues: last.clues.slice() };
        ui.phase = 'decide';
        app.innerHTML = viewPlay();
        toDecision();
        document.getElementById('stage-mount').scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'scene': {
        const i = Number(act.dataset.i);
        if (i < history.length && confirmScene !== i) {
          confirmScene = i; render();
          app.querySelector(`[data-act="scene"][data-i="${i}"]`)?.focus({ preventScroll: true });
          return;
        }
        confirmScene = -1;
        if (i < history.length) { history = history.slice(0, i); save(); }
        draft = { selected: null, clues: [] }; ui.phase = 'intro'; go('play');
        break;
      }
      case 'reset':
        if (!confirmReset) { confirmReset = true; render(); app.querySelector('[data-act="reset"]').focus(); return; }
        confirmReset = false; history = []; draft = { selected: null, clues: [] }; save(); ui.phase = 'intro'; go('play');
        break;
    }
  });

  document.addEventListener('keydown', e => {
    if (ui.view !== 'play' || !stage) return;
    if (e.target.closest('input, textarea, button')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!stage.paused) stage.skip(); }
    if (e.key === 'p' || e.key === 'P') stage.paused ? stage.resume() : stage.freeze();
  });

  document.addEventListener('change', e => {
    if (e.target.name !== 'move') return;
    draft.selected = e.target.value;
    const btn = document.getElementById('evaluate-btn');
    if (btn) btn.disabled = false;
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'decide-form') return;
    e.preventDefault();
    if (!draft.selected) return;
    if (stage && stage.paused) stage.resume();
    const sc = LIST[history.length];
    const opt = sc.options.find(o => o.key === draft.selected);
    history.push({ id: sc.id, key: opt.key, outcome: pickOutcome(opt), clues: draft.clues.slice() });
    save();
    draft = { selected: null, clues: [] };
    document.querySelector('.play-head').innerHTML = document.querySelector('.play-head').innerHTML.replace(/<ol class="file-strip"[\s\S]*?<\/ol>/, strip(history.length - 1, derive(history)));
    document.getElementById('stage-mount').scrollIntoView({ behavior: 'smooth', block: 'start' });
    playReaction();
  });

  document.addEventListener('close', e => {
    if (e.target.id === 'thinker-dialog' && e.target.returnTo) e.target.returnTo.focus();
  }, true);

  window.addEventListener('resize', () => { if (stage && stage.paused) stage.placePins(); });
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (['bench', 'profile', 'play'].includes(h) && h !== ui.view) { ui.phase = 'intro'; go(h); }
  });

  const initial = location.hash.replace('#', '');
  if (['bench', 'profile', 'play'].includes(initial)) ui.view = initial;
  render();
})();
