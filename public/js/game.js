// The Dance game flow and views.
// Progress is derived entirely from `history`, so replaying a scene is just popping it.
(function () {
  const { thinkers, thinkerOrder, skills, grades } = PP;
  const STORE_KEY = 'powerplay:ep1:v2';
  const START_RATING = 1200;
  const EPS = PP.episodes.filter(e => !e.locked);
  const LIST = EPS.flatMap(ep => ep.scenes.map(id => ({ ...PP.scenarios.find(s => s.id === id), stage: PP.scenes[id], ep })));
  const placeOf = id => EPS.flatMap(e => e.places).find(p => p.scenes.includes(id));
  // Scene numbers restart in each episode.
  const pos = i => { const sc = LIST[i], eps = LIST.filter(s => s.ep === sc.ep); return { n: eps.indexOf(sc) + 1, of: eps.length, ep: sc.ep }; };
  const epEnd = i => !!LIST[i] && (!LIST[i + 1] || LIST[i + 1].ep !== LIST[i].ep);
  const DANCE_AT = EPS[0].scenes.length; // "Your Dance" opens once the first episode is played
  const READ_LABEL = { right: `Spot on`, part: `Partly`, suspicious: `Too suspicious`, naive: `Too trusting` };
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const fresh = (clues = [], read = null) => ({ selected: null, clues, read });
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
  let draft = fresh();
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
      const read = readOf(sc, h);
      if (read) totals.inc += read.kind === 'right' ? 0.5 : read.kind === 'part' ? 0 : -0.5;
      Object.entries(opt.rel || {}).forEach(([k, v]) => { rel[k] = (rel[k] || 0) + v; });
      Object.assign(flags, opt.flags || {});
      const before = rating;
      rating += (opt.q - 2) * 40;
      return { sc, opt, read, outcomeIdx: h.outcome, outcome: opt.outcomes[h.outcome], clues: h.clues, ratingBefore: before, ratingAfter: rating };
    });
    return { totals, rel, flags, rating, moves };
  }
  function readOf(sc, h) {
    const R = (PP.insight.scenes[sc.id] || {}).read;
    if (!R || h.read == null || !R.options[h.read]) return null;
    return { ...R.options[h.read], R };
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
    const ep = LIST[current].ep;
    const mine = LIST.map((sc, i) => ({ sc, i })).filter(x => x.sc.ep === ep);
    return `<ol class="file-strip" style="--n:${mine.length}" aria-label="Episode ${ep.number} progress">${mine.map(({ sc, i }, j) => {
      const m = d.moves[i];
      const cls = ['sq', j % 2 ? 'sq-l' : 'sq-d', i === current ? 'is-current' : '', m ? 'is-done' : ''].join(' ');
      const inner = i === current ? pawnSvg : m ? `<span class="sq-glyph">${grades[m.opt.q].glyph}</span>` : `<span class="sq-rank">${j + 1}</span>`;
      return `<li class="${cls}" title="Scene ${j + 1}: ${sc.title}"><span class="sr">Scene ${j + 1}, ${sc.title}${m ? ', played' : ''}</span>${inner}</li>`;
    }).join('')}</ol>`;
  }

  function staticScene(sc, moods) {
    return PP.art.sceneSvg(sc.stage, PP.people, moods || {}, `${sc.title}: illustrated scene`).svg;
  }

  // ───────────────────────── Home

  function viewHome() {
    const d = derive(history);
    const n = history.length, done = n >= LIST.length;
    const at = done ? null : pos(n);
    const cont = !at ? '' : at.n === 1 ? `Play Episode ${at.ep.number}` : `Continue · Scene ${at.n}`;
    const primary = done ? `<button class="btn btn-primary" data-act="profile">See your dance</button>`
      : `<button class="btn btn-primary" data-act="play">${cont}</button>`;
    const curEp = at ? at.ep : EPS[EPS.length - 1];
    const words = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

    const placesOf = ep => ep.places.map(p => {
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
                <span class="ps-n">${pos(i).n}</span><span class="ps-title">${asking ? `Replay ${LIST[i].title}?` : LIST[i].title}</span>
                ${asking ? `<span class="ps-note">${i < n - 1 ? 'Tap again. Later scenes reset.' : 'Tap again to replay.'}</span>` : `<span class="ps-g g${m.opt.q}" title="${grades[m.opt.q].name}">${grades[m.opt.q].glyph}</span><span class="ps-tag">Replay</span>`}
              </button></li>`;
            }
            if (i === n) {
              return `<li><button type="button" class="ps-btn is-next" data-act="scene" data-i="${i}"><span class="ps-n">${pos(i).n}</span><span class="ps-title">${LIST[i].title}</span><span class="ps-tag ps-tag-next">Up next</span></button></li>`;
            }
            return `<li><span class="ps-btn is-locked" aria-disabled="true"><span class="ps-n">${pos(i).n}</span><span class="ps-title">${LIST[i].title}</span><span class="ps-lock"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Unlocks after ${LIST[i - 1].title}</span></span></li>`;
          }).join('')}</ul>
        </div>
      </article>`;
    }).join('');
    const placesSec = ep => `<section class="wrap places">
        <div class="section-head"><p class="eyebrow">Episode ${ep.number} · ${ep.title} · ${words[ep.places.length] || ep.places.length} places</p><h2>${ep.blurb}</h2></div>
        <div class="place-grid place-grid-${ep.places.length}">${placesOf(ep)}</div>
      </section>`;

    const cred = LIST.find(s => s.id === 'credit-taker');
    const pins = cred.stage.cast.map((c, i) => {
      const h = PP.people[c.id].look.h || 1;
      const p = PP.art.place(cred.stage.env, c);
      return `<span class="pin" style="left:${(p.x / 1600 * 100).toFixed(1)}%;top:${((p.y - 600 * p.s * h) / 900 * 100).toFixed(1)}%">${i + 1}</span>`;
    }).join('');

    const bench = thinkerOrder.map(k => {
      const t = thinkers[k];
      return `<li class="${t.practitioner ? 'is-wide' : ''}"><button type="button" class="bench-card ${t.grandfather ? 'is-grand' : ''} ${t.practitioner ? 'is-practitioner' : ''}" data-thinker="${k}" aria-haspopup="dialog" style="--tc:${t.color}"><span class="bench-icon">${t.icon}</span>${t.grandfather ? `<span class="bench-badge">Intellectual grandfather</span>` : ''}${t.practitioner ? `<span class="bench-badge">The practitioner · Market Wizards</span>` : ''}<span class="bench-name">${t.name}</span><span class="bench-teaches">teaches you ${t.teaches}</span><span class="bench-more" aria-hidden="true">Read more</span></button></li>`;
    }).join('');

    const soon = PP.episodes.find(e => e.locked);
    return `
      <section class="hero-cine">
        <div class="hero-art"><img src="/img/hero-dance-floor.webp?v=${PP.assetV}" width="2400" height="1028" alt="Two chess pieces, one ivory and one black, face each other on a checkered dance floor. Each stands in its own spotlight; where the light overlaps, a teal circle glows between them. Dice rest in the foreground, and a corridor of doorways recedes into a soft glow of haze."></div>
        <div class="hero-over">
          <div class="wrap hero-over-in">
            <p class="eyebrow eyebrow-on-dark">Episode ${curEp.number} · ${curEp.title}</p>
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

      ${placesSec(EPS[0])}

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
        <div class="section-head"><p class="eyebrow">The bench</p><h2>Six thinkers and a trader. One question each.</h2>
          <p class="lede">Each scene is seen through one of their lenses. Thomas Schelling sits at the head of the table: he studied people whose interests partly conflict and partly overlap, which describes almost everyone you'll meet.</p></div>
        <ul class="bench-grid">${bench}</ul>
        <dialog class="thinker-dialog" id="thinker-dialog" aria-labelledby="thinker-dialog-h">
          <div class="thinker thinker-pop"></div>
          <form method="dialog" class="thinker-close-row"><button class="btn btn-ghost btn-sm" value="close">Close</button></form>
          <form method="dialog"><button class="thinker-x" value="close" aria-label="Close" autofocus>×</button></form>
        </dialog>
        <button class="btn btn-link" data-act="bench">Read what each one teaches →</button>
      </section>

      ${EPS.slice(1).map(placesSec).join('')}

      ${soon ? `<section class="wrap next-ep">
        <div class="next-card">
          <span class="lock" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>
          <div><p class="eyebrow">Episode ${soon.number} · In development</p><h3>${soon.title}</h3><p>${soon.blurb}</p></div>
        </div>
      </section>` : ''}

      <section class="wrap next-move" aria-labelledby="next-move-h">
        <div class="section-head"><p class="eyebrow">Your next move</p><h2 id="next-move-h">See the game without becoming part of the game.</h2></div>
        <div class="nm-grid">
          <button class="nm nm-play" data-act="${done ? 'profile' : 'play'}">
            <img class="nm-art" src="/img/next/play.webp?v=${PP.assetV}" width="720" height="720" alt="" loading="lazy">
            <span class="nm-k">${done ? 'Every scene played' : n ? `Episode ${at.ep.number} · Scene ${at.n} of ${at.of}` : 'Start here'}</span>
            <span class="nm-t">${done ? 'See your dance' : !n ? 'Play Episode 1' : at.n === 1 ? `Start Episode ${at.ep.number}` : 'Continue playing'}</span>
            <span class="nm-d">${done ? 'What the room saw, what your choices were buying, and one question to take with you.' : n ? `Pick up at ${LIST[n].title}.` : `${LIST.length} scenes across two episodes, starting at a grocery store checkout.`}</span>
            <span class="nm-go" aria-hidden="true">→</span>
          </button>
          <button class="nm nm-bench" data-act="bench">
            <img class="nm-art" src="/img/next/bench.webp?v=${PP.assetV}" width="720" height="720" alt="" loading="lazy">
            <span class="nm-k">The bench</span>
            <span class="nm-t">Meet the thinkers</span>
            <span class="nm-d">Six thinkers and a trader, from Schelling and Nash to Ed Seykota, one question each.</span>
            <span class="nm-go" aria-hidden="true">→</span>
          </button>
          <button class="nm nm-prof" data-act="profile">
            <img class="nm-art" src="/img/next/profile.webp?v=${PP.assetV}" width="720" height="720" alt="" loading="lazy">
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
    return `<header class="te-head">
          <span class="te-icon">${t.icon}</span>
          <div class="te-title"><p class="te-field">${t.field}</p><${h}${id ? ` id="${id}"` : ''}>${t.name}</${h}>${t.grandfather ? `<p class="te-badge">Intellectual grandfather of The Dance</p>` : ''}</div>
        </header>
        <p class="te-teaches"><span class="te-mark">${I.teaches}</span><span>${t.short} teaches you <strong>${t.teaches}</strong>.</span></p>
        <p class="te-idea">${t.idea}</p>
        <div class="te-ask"><p class="te-label"><span class="te-mark">${I.ask}</span>The question to ask</p><p class="te-q">${t.ask}</p></div>
        ${t.quote ? `<figure class="te-quote"><blockquote>“${t.quote.text}”</blockquote><figcaption>${t.quote.source}</figcaption></figure>` : ''}
        ${t.steps ? `<div class="te-block"><p class="te-label">His game in five moves</p><ol class="te-steps">${t.steps.map(x => `<li>${x}</li>`).join('')}</ol></div>` : ''}
        ${t.lessons ? `<div class="te-block"><p class="te-label">Seven lessons for everyday play</p><ol class="te-lessons">${t.lessons.map(l => `<li><p class="te-l-tag">${l.tag}</p><h4>${l.name}</h4><p>${l.body}</p></li>`).join('')}</ol></div>` : ''}
        ${t.takeaway ? `<p class="te-takeaway">${t.takeaway}</p>` : ''}
        ${t.related ? `<p class="te-related">${t.related}</p>` : ''}`;
  }


  function viewBench() {
    const cards = thinkerOrder.map(k => `<article class="thinker ${thinkers[k].grandfather ? 'is-grand' : ''} ${thinkers[k].practitioner ? 'is-practitioner' : ''}" style="--tc:${thinkers[k].color}">${thinkerEntry(k)}</article>`).join('');
    return `<section class="wrap page">
      <div class="section-head"><p class="eyebrow">The bench</p><h1>The thinkers behind the game</h1>
        <p class="lede">You won't be asked to memorize anything. Each scene puts one of these ideas in front of you as a situation, and the analysis afterward names it. Six thinkers built the theory, and a practitioner from the markets shows what it takes to live by it.</p></div>
      <div class="thinker-grid">${cards}</div>
      <div class="page-actions"><button class="btn btn-primary" data-act="play">${history.length ? 'Back to the game' : 'Play Episode 1'}</button></div>
    </section>`;
  }

  // ───────────────────────── Play

  function currentIndex() { return ui.phase === 'result' || ui.phase === 'react' ? history.length - 1 : history.length; }

  function viewPlay() {
    const idx = currentIndex();
    const sc = LIST[idx];
    const d = derive(history.slice(0, idx));
    const place = placeOf(sc.id), at = pos(idx);
    return `<section class="play">
      <div class="wrap play-head">
        ${strip(idx, derive(history))}
        <div class="play-meta">
          <p class="meta">Episode ${at.ep.number} · Scene ${at.n} of ${at.of} · ${place.name}</p>
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
    await stage.run(sc.stage.intro, { title: `<span>${pos(idx).n === 1 ? `Episode ${sc.ep.number} · ` : ''}Scene ${pos(idx).n} · ${placeOf(sc.id).name}</span><strong>${sc.title}</strong>` });
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
    const R = (PP.insight.scenes[sc.id] || {}).read;
    const read = R ? `<fieldset class="read"><legend class="read-q"><span class="read-k">First, your read</span>${R.q}</legend>
        <ul class="read-opts">${R.options.map((o, i) => `<li><input type="radio" name="read" id="read-${sc.id}-${i}" value="${i}" ${draft.read === i ? 'checked' : ''}><label for="read-${sc.id}-${i}" class="read-opt">${o.t}</label></li>`).join('')}</ul>
        <p class="read-note">You'll see how close you were after you move.</p></fieldset>` : '';
    return `<form id="decide-form" class="decide">
      <div class="decide-top">
        ${read}
        <fieldset><legend class="decide-q">${R ? `<span class="read-k">Then, your move</span>` : ''}${sc.question}</legend><ul class="options">${options}</ul></fieldset>
      </div>
      <div class="decide-bar">
        <button type="button" class="btn btn-ghost" data-act="freeze"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Freeze and analyze</button>
        <button type="submit" class="btn btn-primary" id="evaluate-btn" ${ready(sc) ? '' : 'disabled'}>${!R || draft.read !== null ? 'Make this move' : 'Make your read first'}</button>
      </div>
      <p class="decide-hint">${draft.clues.length ? `You've read ${draft.clues.length} of ${sc.clues.length} details in the room.` : `Tip: freezing the scene lets you read the room before you commit.`} <button type="button" class="btn-link-sm" data-act="replay-intro">Watch the scene again</button></p>
    </form>`;
  }

  const ready = sc => !!draft.selected && (draft.read !== null || !(PP.insight.scenes[sc.id] || {}).read);

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
    const last = epEnd(idx);
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
        + (move.clues.length ? `<li class="delta up"><span>+${Math.min(move.clues.length, 2) * 0.5}</span>${skills.inf} (read the room)</li>` : '')
        + (move.read && move.read.kind !== 'part' ? `<li class="delta ${move.read.kind === 'right' ? 'up' : 'down'}"><span>${move.read.kind === 'right' ? '+' : '−'}0.5</span>${skills.inc} (your read)</li>` : '');
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
        ${move.read ? `<div class="read-reveal is-${move.read.kind}">
          <p class="rr-k">Your read <span class="rr-tag">${READ_LABEL[move.read.kind]}</span></p>
          <p class="rr-guess">“${move.read.t}”</p>
          <p class="rr-truth">${move.read.R.truth}</p>
        </div>` : ''}
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
        <button class="btn btn-primary" data-act="${last ? 'profile' : 'next'}">${last ? 'See your dance' : `Next scene`}</button>
      </div>
    </div>`;
  }

  // ───────────────────────── Your Dance
  // A mirror, not a lesson: what the people saw, what the choices bought, three moments, one question.

  function portrait(id, mood) {
    const look = PP.people[id].look, h = look.h || 1;
    return `<svg class="portrait" viewBox="-80 ${Math.round(-618 * h)} 160 ${Math.round(150 * h)}" aria-hidden="true">${PP.art.actor(id, look, { mood, pose: 'down' })}</svg>`;
  }

  function moments(d) {
    const ms = d.moves.map((m, i) => ({ ...m, i, trust: Object.values(m.opt.rel || {}).reduce((a, v) => a + v, 0) }));
    const taken = new Set();
    const take = (list, pick) => { const m = list.filter(x => !taken.has(x.i)).sort(pick)[0]; if (m) taken.add(m.i); return m; };
    const nameOf = m => PP.people[m.sc.stage.cast[0].id].name;
    const out = [];

    const best = take(ms.filter(m => m.opt.q >= 3), (a, b) => b.opt.q - a.opt.q || (b.outcome.tone === 'good') - (a.outcome.tone === 'good'));
    if (best) out.push({ m: best, k: `Your best call`, by: 'nash',
      note: `Given your move, ${nameOf(best)}'s best reply was also good for you. That's what an equilibrium feels like from the inside.` });

    const luck = take(ms.filter(m => (m.opt.q <= 1 && m.outcome.tone === 'good') || (m.opt.q >= 3 && m.outcome.tone !== 'good')), (a, b) => Math.abs(b.opt.q - 2) - Math.abs(a.opt.q - 2))
      || take(ms, (a, b) => a.opt.q - b.opt.q);
    if (luck) {
      const lucky = luck.opt.q <= 1 && luck.outcome.tone === 'good', unlucky = luck.opt.q >= 3 && luck.outcome.tone !== 'good';
      out.push({ m: luck, k: lucky ? `Where luck covered for you` : unlucky ? `Where the dice let you down` : `The one to replay`, by: 'duke',
        note: lucky ? `It worked, and that's the danger. A good result rewarded a weak decision, and it will tempt you to do it again.`
          : unlucky ? `It didn't land, but the decision was sound. Judge the choice, not the draw, and make it again.`
            : `This one wasn't the dice. The choice itself left the most on the table.` });
    }

    const echo = take(ms.filter(m => m.trust), (a, b) => Math.abs(b.trust) - Math.abs(a.trust));
    if (echo) out.push({ m: echo, k: echo.trust > 0 ? `What they'll remember` : `What they'll hold onto`, by: 'schelling',
      note: echo.trust > 0 ? `You'll see ${nameOf(echo)} again. In a game that repeats, what they expect of you next time is worth more than this round.`
        : `This round wasn't the last. ${nameOf(echo)} trusts you less now, and that changes every move after it.` });
    return out;
  }

  function yourDance(d, ranked) {
    const I = PP.insight;
    const said = d.moves.map(m => {
      const v = ((I.scenes[m.sc.id] || {}).options || {})[m.opt.key];
      if (!v) return '';
      const mood = m.opt.q >= 3 ? 'smile' : m.opt.q === 2 ? 'neutral' : m.outcome.tone === 'good' ? 'awkward' : 'skeptical';
      return `<li class="said"><span class="said-face">${portrait(v.verdict.who, mood)}</span>
        <blockquote><p>“${v.verdict.line}”</p><footer><strong>${PP.people[v.verdict.who].name}</strong> · ${m.sc.title}</footer></blockquote></li>`;
    }).join('');

    const counts = {};
    d.moves.forEach(m => (((I.scenes[m.sc.id] || {}).options || {})[m.opt.key] || { buys: [] }).buys.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const buys = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = buys.length ? buys[0][1] : 1;
    const buyBars = buys.map(([t, c]) => `<li><span class="buy-name">${I.tags[t]}</span><span class="buy-track" aria-hidden="true"><span class="buy-fill" style="width:${Math.round(c / max * 100)}%"></span></span><span class="buy-n">${c}</span></li>`).join('');

    const reads = d.moves.filter(m => m.read);
    const kinds = { right: 0, part: 0, suspicious: 0, naive: 0 };
    reads.forEach(m => { kinds[m.read.kind]++; });
    const readLine = !reads.length ? '' : kinds.suspicious >= 2 ? `You assumed bad intent ${kinds.suspicious} times when the room didn't support it. Most people are mostly trying to get through their day.`
      : kinds.naive >= 1 && kinds.naive >= kinds.suspicious ? `You gave the benefit of the doubt where a quick check was cheap. Trust is a good default. Checking is a better one.`
        : kinds.right + kinds.part / 2 >= reads.length * 0.7 ? `You read people well. You looked for what they needed before deciding who they were.`
          : `Your reads were mixed. The details in each room usually said more than first impressions did.`;

    const mo = moments(d).map(({ m, k, by, note }) => {
      const t = thinkers[by];
      return `<li class="moment">
        <div class="mo-main"><p class="mo-k">${k}</p><h4>${m.sc.title}</h4><p class="mo-move"><span class="mo-key">${m.opt.key}</span>${m.opt.text}</p><p class="mo-out">${m.outcome.text}</p></div>
        <aside class="mo-note" style="--tc:${t.color}"><span class="mo-icon">${t.icon}</span><p><strong>${t.short}</strong> ${note}</p></aside>
      </li>`;
    }).join('');

    const weakest = ranked.length ? ranked[ranked.length - 1].k : 'inc';
    return `<section class="dance" aria-labelledby="dance-h">
      <div class="section-head"><p class="eyebrow">Your dance</p><h2 id="dance-h">What the room saw</h2>
        <p class="lede">Every person you met formed an opinion. Here's what each of them would say about you.</p></div>
      <svg width="0" height="0" class="defs-only" aria-hidden="true">${PP.art.DEFS}</svg>
      <ul class="said-list">${said}</ul>
      <div class="dance-grid">
        <section class="card"><h3 class="block-h">What your choices were buying</h3>
          <ul class="buys">${buyBars}</ul>
          ${buys.length ? `<p class="buy-note">${I.buyNotes[buys[0][0]]}</p>` : ''}
          <aside class="mo-note" style="--tc:${thinkers.seykota.color}"><span class="mo-icon">${thinkers.seykota.icon}</span><p><strong>${thinkers.seykota.short}</strong> Everybody gets what they want. Your choices show what that was.</p></aside>
        </section>
        <section class="card"><h3 class="block-h">How you read people</h3>
          ${reads.length ? `<p class="read-score"><span class="rs-n">${kinds.right}</span><span class="rs-of">of ${reads.length} reads spot on${kinds.part ? `, ${kinds.part} partly` : ''}</span></p>
          <ul class="read-kinds">${['suspicious', 'naive'].filter(k => kinds[k]).map(k => `<li class="is-${k}">${READ_LABEL[k]} · ${kinds[k]}</li>`).join('')}</ul>
          <p class="read-line">${readLine}</p>` : `<p class="small">Your reads start with your next scene. Before each move you'll guess what the other person is after.</p>`}
        </section>
      </div>
      <h3 class="block-h block-h-gap">Three moments</h3>
      <ol class="moments">${mo}</ol>
      <div class="carry"><p class="eyebrow">One question to take with you</p><p class="carry-q">${I.questions[weakest]}</p></div>
    </section>`;
  }

  // ───────────────────────── Profile

  function viewProfile() {
    const d = derive(history);
    const n = history.length;
    if (!n) return `<section class="wrap page empty"><p class="eyebrow">Your profile</p><h1>No moves yet.</h1>
      <p class="lede">Your profile builds from real choices: ten measures of strategic intelligence, how your relationships changed, and whether your good results came from good decisions.</p>
      <div class="page-actions"><button class="btn btn-primary" data-act="play">Play Episode 1</button></div></section>`;
    const done = n >= LIST.length;
    const finished = epEnd(n - 1) ? LIST[n - 1].ep : null;
    const at = done ? null : pos(n);
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
        <div><p class="eyebrow">${done ? 'Every scene played' : finished ? `Episode ${finished.number} complete` : `${n} of ${LIST.length} scenes played`}</p>
          <h1>${done ? 'You read the room.' : finished ? `${finished.title}, played.` : 'Your profile so far'}</h1>
          <p class="lede">${done ? `You walked into ${NUM[LIST.length] || LIST.length} ordinary situations with no title and no special power. Here's how you played them.`
            : finished ? `Here's what the room saw. Episode ${at.ep.number}, ${at.ep.title}, is waiting when you are.`
              : `Built from your actual choices. It sharpens as you play the remaining ${LIST.length - n} scene${LIST.length - n === 1 ? '' : 's'}.`}</p></div>
        <div class="rating-card"><span class="rating-label">Strategic rating</span><span class="rating-num">${d.rating}</span><span class="rating-sub">Started at ${START_RATING}</span></div>
      </header>
      ${n >= DANCE_AT ? yourDance(d, ranked) + `<h2 class="profile-sub">The numbers behind it</h2>` : ''}
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
      <div class="page-actions">${done ? '' : `<button class="btn btn-primary" data-act="play">${at.n === 1 ? `Play Episode ${at.ep.number} · ${at.ep.title}` : `Continue · Scene ${at.n}`}</button>`}
        <button class="${done && !confirmReset ? 'btn btn-primary' : 'btn btn-ghost'} ${confirmReset ? 'is-danger' : ''}" data-act="reset">${confirmReset ? 'Tap again to erase this run' : done ? 'Play again from the start' : 'Start over'}</button></div>
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
      dlg.scrollTop = 0;
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
      case 'next': draft = fresh(); ui.phase = 'intro'; render(); window.scrollTo({ top: 0 }); break;
      case 'takeback': {
        const last = history.pop(); save();
        draft = fresh(last.clues.slice(), last.read ?? null);
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
        draft = fresh(); ui.phase = 'intro'; go('play');
        break;
      }
      case 'reset':
        if (!confirmReset) { confirmReset = true; render(); app.querySelector('[data-act="reset"]').focus(); return; }
        confirmReset = false; history = []; draft = fresh(); save(); ui.phase = 'intro'; go('play');
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
    if (e.target.name !== 'move' && e.target.name !== 'read') return;
    if (e.target.name === 'move') draft.selected = e.target.value;
    else draft.read = Number(e.target.value);
    const btn = document.getElementById('evaluate-btn');
    if (btn) { btn.disabled = !ready(LIST[history.length]); btn.textContent = draft.read === null && (PP.insight.scenes[LIST[history.length].id] || {}).read ? 'Make your read first' : 'Make this move'; }
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'decide-form') return;
    e.preventDefault();
    if (!ready(LIST[history.length])) return;
    if (stage && stage.paused) stage.resume();
    const sc = LIST[history.length];
    const opt = sc.options.find(o => o.key === draft.selected);
    history.push({ id: sc.id, key: opt.key, outcome: pickOutcome(opt), clues: draft.clues.slice(), read: draft.read });
    save();
    draft = fresh();
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
