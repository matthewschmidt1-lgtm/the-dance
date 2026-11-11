// The Dance game flow and views.
// Progress is derived entirely from `history`, so replaying a scene is just popping it.
(function () {
  const { thinkers, thinkerOrder, skills, grades } = PP;
  const START_RATING = 1200;
  const EPS = PP.episodes.filter(e => !e.locked);
  const MK = PP.market;
  // Two tracks share one engine: the episodes, and The Trader's Mind. Each keeps its own progress.
  const TRACKS = {
    main: { key: 'powerplay:ep1:v2', list: EPS.flatMap(ep => ep.scenes.map(id => ({ ...PP.scenarios.find(s => s.id === id), stage: PP.scenes[id], ep }))) },
    market: { key: 'thedance:market:v1', list: MK.scenarios.map(s => ({ ...s, stage: MK.scenes[s.id], ep: MK.ep })) }
  };
  const RULES_KEY = 'thedance:market:rules';
  let track = 'main';
  let LIST = TRACKS.main.list;
  const isMarket = () => track === 'market';
  const trackFor = view => ['market', 'trade', 'call', 'phone'].includes(view) ? 'market' : view === 'bench' ? track : 'main';
  const NAV_OF = { trade: 'market', episodes: 'play', call: 'market', phone: 'market' };
  const placeOf = id => [...EPS, MK.ep].flatMap(e => e.places).find(p => p.scenes.includes(id));
  // Scene numbers restart in each episode.
  const pos = i => { const sc = LIST[i], eps = LIST.filter(s => s.ep === sc.ep); return { n: eps.indexOf(sc) + 1, of: eps.length, ep: sc.ep }; };
  const epEnd = i => !!LIST[i] && (!LIST[i + 1] || LIST[i + 1].ep !== LIST[i].ep);
  const DANCE_AT = EPS.length ? EPS[0].scenes.length : 0; // "Your Dance" opens once the first episode is played
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  // step / stake / push are for beat scenes (sc.play): stakes first, then reads, her pitch, your answer, her push.
  const fresh = (clues = [], type = null) => ({ selected: null, clues, type, step: null, stake: null, push: null });
  // Some people are one of several hidden types (Omar squares up or takes advantage). Each play draws one.
  // Scenes that share a key (Omar across the trip and the loan) keep whoever was drawn first.
  function drawType(sc, past = []) {
    if (!sc.types) return null;
    const prev = sc.share && past.find((h, i) => LIST[i] && LIST[i].share === sc.share && h.type);
    if (prev && sc.types.some(t => t.id === prev.type)) return prev.type;
    let r = Math.random();
    for (const t of sc.types) { r -= t.p; if (r <= 0) return t.id; }
    return sc.types[sc.types.length - 1].id;
  }
  const typeOf = (sc, h) => (h && h.type) || (sc.types ? sc.types[0].id : null);
  const RECURRING = ['omar', 'nate', 'jess', 'lena', 'carol'];
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
  let rules = loadRules();
  const FIRSTS_KEY = 'thedance:firsts:v1';
  let firsts = (() => {
    try {
      const f = JSON.parse(localStorage.getItem(FIRSTS_KEY) || '{}');
      return f && typeof f === 'object' && !Array.isArray(f) ? Object.fromEntries(Object.entries(f).filter(([, q]) => Number.isInteger(q) && q >= 0 && q <= 4)) : {};
    } catch (e) { return {}; }
  })();
  const saveFirsts = () => { try { localStorage.setItem(FIRSTS_KEY, JSON.stringify(firsts)); } catch (e) { /* storage unavailable */ } };
  let draft = fresh();
  let confirmReset = false;
  let confirmScene = -1; // index of a played scene awaiting a second tap to replay
  let stage = null;
  const ui = { view: 'home', phase: 'intro', frozen: false, tab: 'outcome', runId: 0 };

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TRACKS[track].key) || '[]');
      if (!Array.isArray(parsed)) return [];
      // Keep moves up to the first one that no longer fits the scenes; later moves depend on it.
      const ok = (h, i) => h && LIST[i] && LIST[i].id === h.id && typeof h.key === 'string' && Number.isInteger(h.outcome) && h.outcome >= 0 && Array.isArray(h.clues) && h.clues.every(Number.isInteger);
      const bad = parsed.findIndex((h, i) => !ok(h, i));
      return bad < 0 ? parsed : parsed.slice(0, bad);
    } catch (e) { return []; }
  }
  function save() { try { localStorage.setItem(TRACKS[track].key, JSON.stringify(history)); } catch (e) { /* storage unavailable */ } }
  function loadRules() {
    try {
      const r = JSON.parse(localStorage.getItem(RULES_KEY) || 'null');
      const known = k => r && MK.rules[k].options.some(o => o.v === r[k]);
      return known('risk') && known('edge') ? r : null;
    } catch (e) { return null; }
  }
  function saveRules() { try { rules ? localStorage.setItem(RULES_KEY, JSON.stringify(rules)) : localStorage.removeItem(RULES_KEY); } catch (e) { /* storage unavailable */ } }
  function useTrack(t) {
    if (t === track) return;
    track = t; LIST = TRACKS[t].list; history = playable(load()); draft = fresh(); ui.phase = 'intro'; confirmScene = -1;
  }
  // A save from an older version can name an option or outcome that no longer exists. Drop moves from there on.
  function playable(hist) {
    const fits = h => {
      try {
        const d = derive(h);
        if (!d.moves.every(m => m.opt && m.outcome)) return false;
        if (track === 'market') capitals(h);
        return true;
      } catch (e) { return false; }
    };
    let n = hist.length;
    while (n && !fits(hist.slice(0, n))) n--;
    return n === hist.length ? hist : hist.slice(0, n);
  }

  // ───────────────────────── The Trader's Mind: capital, rules, risk

  const ruleOf = (k, v) => MK.rules[k].options.find(o => o.v === v);
  const breaks = opt => !!rules && MK.exposure[opt.exposure] > ruleOf('risk', rules.risk).max;
  const money = k => k === 0 ? `$0` : `${k > 0 ? '+' : '−'}$${Math.abs(k)}k`;
  // Market text can name the player's own rules and account: {rule}, {edge}, {account}.
  const fill = t => typeof t !== 'string' || !t.includes('{') ? t : t
    .replace(/\{rule\}/g, rules ? ruleOf('risk', rules.risk).label : 'your')
    .replace(/\{edge\}/g, rules ? ruleOf('edge', rules.edge).label.toLowerCase() : 'your edge')
    .replace(/\{account\}/g, `$${capitals().cap.fin}k`)
    .replace(/\{halcyon\}/g, () => MK.rtPosition(derive(history).flags))
    .replace(/\{book\}/g, () => { const b = MK.books && MK.books[derive(history).flags.book]; return b ? b.name : `the book you built in June`; });
  function capitals(hist = history) {
    const cap = Object.fromEntries(MK.capitals.map(c => [c.k, c.start]));
    const flags = {}; // what earlier challenges left behind, like the book you built in June
    let ruinedAt = null;
    const steps = hist.map((h, i) => {
      const sc = TRACKS.market.list[i], opt = resolve(sc, { rel: {}, flags: { ...flags }, type: typeOf(sc, h), cap: { ...cap } }, h.clues).find(o => o.key === h.key), oc = opt.outcomes[h.outcome];
      Object.assign(flags, opt.flags || {});
      const before = { ...cap };
      if (!sc.freeTime) cap.time -= 1; // the later days of one trade share a single turn
      Object.entries(opt.cap || {}).forEach(([k, v]) => { cap[k] += v; });
      cap.fin = oc.ruin ? 0 : cap.fin + oc.fin;
      MK.capitals.forEach(c => { if (c.k !== 'fin') cap[c.k] = Math.max(0, Math.min(c.max, cap[c.k])); });
      if (ruinedAt === null && cap.fin <= MK.ruin) ruinedAt = i;
      return { sc, opt, oc, h, before, after: { ...cap }, broke: breaks(opt) };
    });
    return { cap, steps, ruinedAt };
  }
  const marketOver = () => history.length >= LIST.length || capitals().ruinedAt !== null;

  // Five meters. The account shows the line where the desk pulls your capital.
  function hud(cap, prev) {
    return MK.capitals.map(c => {
      const v = cap[c.k], d = prev ? Math.round((v - prev[c.k]) * 10) / 10 : 0;
      const pct = Math.max(0, Math.min(100, v / c.max * 100));
      const val = c.k === 'fin' ? `$${v}k` : `${v}`;
      const danger = c.k === 'fin' ? v <= MK.ruin + 15 : v <= 2;
      return `<div class="hud-m ${danger ? 'is-low' : ''}" title="${c.kind}: ${c.note}">
        <span class="hud-k">${c.name}</span>
        <span class="hud-v">${val}${d ? `<small class="${d > 0 ? 'up' : 'down'}">${c.k === 'fin' ? money(d) : (d > 0 ? '+' : '−') + Math.abs(d)}</small>` : ''}</span>
        <span class="hud-bar" aria-hidden="true"><span style="width:${pct.toFixed(1)}%"></span>${c.k === 'fin' ? `<i class="hud-ruin" style="left:${MK.ruin / c.max * 100}%"></i>` : ''}</span>
      </div>`;
    }).join('');
  }

  // Before the world is rolled: each outcome's chance, averaged over the worlds it could be.
  function priorOpts(sc, clues) {
    if (!sc.types) return resolve(sc, {}, clues);
    const per = sc.types.map(t => ({ t, opts: resolve(sc, { rel: {}, flags: {}, type: t.id }, clues) }));
    return per[0].opts.map((o, k) => ({ ...o, outcomes: o.outcomes.map((x, i) => ({ ...x, p: per.reduce((a, { t, opts }) => a + t.p * opts[k].outcomes[i].p, 0) })) }));
  }

  // What each move could cost or earn, sized by likelihood. The far left is the end of the game.
  function riskChart(sc, key, oi) {
    const vals = sc.options.flatMap(o => o.outcomes.filter(x => !x.ruin).map(x => x.fin));
    const hasRuin = sc.options.some(o => o.outcomes.some(x => x.ruin));
    const lo = hasRuin ? Math.min(-40, ...vals) - 20 : Math.min(-10, ...vals) - 3, hi = Math.max(10, ...vals) + 3;
    const X = v => (v - lo) / (hi - lo) * 100;
    const rows = sc.options.map(o => {
      const vs = o.outcomes.map(x => x.ruin ? lo : x.fin);
      const a = Math.min(...vs), b = Math.max(...vs);
      const dots = o.outcomes.map((x, i) => {
        const v = x.ruin ? lo : x.fin, hit = o.key === key && i === oi;
        return `<span class="rk-dot tone-${x.tone} ${hit ? 'is-hit' : ''} ${x.ruin ? 'is-ruin' : ''}" style="left:${X(v).toFixed(1)}%;--p:${x.p}" title="${Math.round(x.p * 100)}%: ${x.ruin ? 'out of the game' : money(x.fin)}"></span>`;
      }).join('');
      return `<li class="rk-row ${o.key === key ? 'is-mine' : ''}">
        <span class="rk-key">${o.key}</span>
        <span class="rk-track"><span class="rk-zero" style="left:${X(0).toFixed(1)}%"></span><span class="rk-span" style="left:${X(a).toFixed(1)}%;width:${(X(b) - X(a)).toFixed(1)}%"></span>${dots}</span>
        <span class="rk-exp">${MK.exposureLabel[o.exposure]}</span>
      </li>`;
    }).join('');
    return `<div class="rk">
      <div class="rk-axis" aria-hidden="true"><span>${hasRuin ? 'Out of the game' : money(Math.round(lo))}</span><span style="left:${X(0).toFixed(1)}%">$0</span><span>${money(Math.round(hi))}</span></div>
      <ol class="rk-rows">${rows}</ol>
      <p class="viz-note">Each row is one move. Its dots are what it could cost or earn, larger when more likely. Your move and result are outlined. Look at the left end of each row before the right.</p>
    </div>`;
  }

  // What you're protecting in a beat scene: standing with your manager, allies, and free hours this week.
  const START_METERS = { standing: 0, allies: 0, time: 10 };
  const METER_NAME = { standing: 'Reputation', allies: 'Friends', time: 'Time' };
  const addUp = (...objs) => objs.reduce((t, o) => { Object.entries(o || {}).forEach(([k, v]) => { t[k] = (t[k] || 0) + v; }); return t; }, {});
  function derive(hist) {
    const totals = Object.fromEntries(Object.keys(skills).map(k => [k, 0]));
    const rel = {}, flags = {};
    let rating = START_RATING;
    const moves = hist.map((h, i) => {
      const sc = LIST[i];
      const ctx = { rel: { ...rel }, flags: { ...flags }, type: typeOf(sc, h), known: metBefore(sc, i) };
      const opts = resolve(sc, ctx, h.clues);
      const opt = opts.find(o => o.key === h.key);
      Object.entries(opt.s || {}).forEach(([k, v]) => { totals[k] += v; });
      totals.inf += Math.min(h.clues.length, 2) * 0.5;
      Object.entries(opt.rel || {}).forEach(([k, v]) => { rel[k] = (rel[k] || 0) + v; });
      Object.assign(flags, opt.flags || {});
      // An outcome can leave a mark too (the salary you actually got), for later scenes to read.
      Object.assign(flags, val(opt.outcomes[h.outcome].flags, ctx) || {});
      // Some clues cost something to read: asking around gets back to people.
      h.clues.forEach(i => {
        const cost = ((sc.clues || [])[i] || {}).cost;
        if (!cost) return;
        Object.entries(cost.rel || {}).forEach(([k, v]) => { rel[k] = (rel[k] || 0) + v; });
        Object.assign(flags, cost.flags || {});
      });
      // Beat scenes also move what you're protecting (standing, allies, hours) and what people think of you.
      let fx = null, repDelta = null;
      if (sc.play) {
        const c = { ...ctx, clues: h.clues, rules };
        const push = h.push && sc.pushFx ? sc.pushFx[h.push] || {} : {};
        fx = addUp(val(opt.fx, c), val(opt.outcomes[h.outcome].fx, c), push.fx);
        repDelta = addUp(val(opt.rep, c), push.rep, ...h.clues.map(i => (sc.clues[i] || {}).cost && sc.clues[i].cost.rep));
        const m = flags.meters || { ...START_METERS };
        flags.meters = Object.fromEntries(Object.keys(START_METERS).map(k => [k, m[k] + (fx[k] || 0)]));
        flags.rep = addUp(flags.rep, repDelta);
        if (h.stake) flags.stake = h.stake;
      }
      const before = rating;
      // The rating counts your first try at a scene. Replays are practice.
      rating += ((firsts[sc.id] ?? opt.q) - 2) * 40;
      return { sc, opt, opts, ctx, type: ctx.type, outcomeIdx: h.outcome, outcome: opt.outcomes[h.outcome], clues: h.clues, ratingBefore: before, ratingAfter: rating, fx, rep: repDelta, stake: h.stake, push: h.push, said: h.said, replay: !!h.replay };
    });
    return { totals, rel, flags, rating, moves };
  }
  // An option can depend on what came before and on what you found out:
  //   q, outcome p, their, shaped  may be functions of ctx ({ rel, flags, rules })
  //   needs: [clue indexes]        without those clues you can only make the vague version
  const val = (v, ctx) => typeof v === 'function' ? v(ctx) : v;
  function resolveRaw(sc, ctx = { rel: {}, flags: {} }, clues = []) {
    const c = { ...ctx, rules, clues };
    // An option can exist only in some situations (when: fn of ctx), like cutting a book you never built.
    return sc.options.filter(o => !o.when || o.when(c)).map(o => {
      const needs = val(o.needs, c);
      const vague = !!needs && !needs.every(i => clues.includes(i));
      const b = vague ? { ...o, ...o.vague, vague } : { ...o, vague };
      // A vague version can keep the same results at different odds (pv), or bring its own.
      const outs = vague && o.vague.pv ? b.outcomes.map((x, i) => ({ ...x, p: o.vague.pv[i] })) : b.outcomes;
      const relv = b.rel && Object.fromEntries(Object.entries(b.rel).map(([k, v]) => [k, val(v, c)]));
      return { ...b, _c: c, needs, text: val(b.text, c), did: val(b.did, c), later: val(b.later, c), rel: relv, flags: val(b.flags, c), cap: val(b.cap, c), concept: val(b.concept, c), q: val(b.q, c), exposure: val(b.exposure, c), outcomes: outs.map(x => ({ ...x, p: val(x.p, c), fin: val(x.fin, c), text: val(x.text, c), tone: val(x.tone, c) })), their: val(b.their, c), shaped: val(b.shaped, c) };
    });
  }
  // Grades judge what you could know. Versions of the other person that nothing you saw could tell apart
  // (the scene's opening and the details you read) are graded together, weighted by how likely each was.
  // A person you've already met this episode is known. The Trader's Mind grades its own way.
  const MARKET_IDS = new Set(MK.scenarios.map(s => s.id));
  // The versions of the other side the player couldn't rule out, with their odds renormalized.
  function posterior(sc, ctx, clues) {
    if (!sc.types || !ctx.type) return null;
    const mineT = sc.types.find(t => t.id === ctx.type);
    if (ctx.known) return [{ t: mineT, w: 1 }];
    const seen = t => {
      const c = { ...ctx, type: t, clues };
      const intro = ((sc.stage && sc.stage.intro) || []).map(b => b.if ? (b.if(c) ? 1 : 0) : '').join('');
      return intro + '|' + clues.map(i => sc.clues[i] ? String(val(sc.clues[i].text, c)) : '').join('|');
    };
    const mine = seen(ctx.type);
    const ws = sc.types.filter(t => seen(t.id) === mine), total = ws.reduce((a, t) => a + t.p, 0);
    return ws.map(t => ({ t, w: t.p / total }));
  }
  function worlds(sc, ctx, clues) {
    if (MARKET_IDS.has(sc.id)) return null;
    const post = posterior(sc, ctx, clues);
    return post && post.length > 1 ? post.map(x => x.t) : null;
  }
  // Rules from your journal that bind Desk decision i: written after an earlier decision that's still in the saves.
  const deskHist = () => track === 'market' ? history : MK.journal.stored(TRACKS.market.key);
  function rulesAt(i) {
    const out = {};
    MK.journal.valid(deskHist(), MK.journal.stored('thedance:call:v1')).filter(e => e.src === 'desk' && e.at < i).forEach(e => { out[e.rule] = e; });
    return out;
  }
  function withJournal(sc, opts) {
    const i = TRACKS.market.list.indexOf(sc), active = rulesAt(i);
    if (!Object.keys(active).length) return opts;
    return opts.map(o => {
      const broke = (val(o.defies, o._c) || []).filter(r => active[r]);
      return broke.length ? { ...o, q: Math.max(0, o.q - 1), brokeRules: broke.map(r => active[r]) } : o;
    });
  }
  function resolve(sc, ctx = { rel: {}, flags: {} }, clues = []) {
    if (MARKET_IDS.has(sc.id)) return withJournal(sc, resolveRaw(sc, ctx, clues));
    const opts = resolveRaw(sc, ctx, clues);
    const ws = worlds(sc, ctx, clues);
    if (!ws) return opts;
    const total = ws.reduce((a, t) => a + t.p, 0);
    const per = ws.map(t => ({ w: t.p / total, opts: t.id === ctx.type ? opts : resolveRaw(sc, { ...ctx, type: t.id }, clues) }));
    return opts.map((o, k) => ({ ...o, qWorld: o.q, q: Math.round(per.reduce((a, x) => a + x.w * x.opts[k].q, 0)), worlds: ws }));
  }
  const metBefore = (sc, i) => !!sc.share && LIST.slice(0, i).some(s => s.share === sc.share);
  const optsNow = sc => { const i = LIST.indexOf(sc), d = derive(history.slice(0, i)); return resolve(sc, { rel: d.rel, flags: d.flags, type: draft.type, known: metBefore(sc, i), cap: isMarket() ? capitals().cap : null }, draft.clues); };
  const clueText = (c, ctx) => val(c.text, ctx);
  // Staging for the version actually played: a vague option may have its own line and reactions.
  const staged = (sc, opt) => {
    const so = sc.stage.options[opt.key];
    const said = o => typeof o.line === 'function' ? { ...o, line: o.line(opt._c || {}) } : o;
    if (!opt.vague || !so.vague) return said(so);
    const v = { ...so, ...so.vague };
    if (so.vague.outcomes) v.outcomes = so.vague.outcomes.map((o, i) => ({ col: (so.outcomes[i] || {}).col, ...o }));
    return said(v);
  };

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
    PP.callGame.stop();
    ui.runId++;
  }

  // With no episodes on the site, the Play pages (and the profile built on them) lead to the Market.
  const PLAY_VIEWS = ['play', 'episodes', 'profile'];
  const routeOf = view => !TRACKS.main.list.length && PLAY_VIEWS.includes(view) ? 'market' : view;
  function go(view, keepScroll) {
    view = routeOf(view);
    teardown();
    useTrack(trackFor(view));
    ui.view = view;
    const hash = view === 'home' ? '' : '#' + view;
    if (location.hash !== hash) window.history.replaceState(null, '', hash || location.pathname);
    render();
    if (!keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
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
      const label = `<span class="sr">Scene ${j + 1}, ${sc.title}${m ? ', played' : ''}</span>`;
      // Played scenes open the chooser with that scene ready to replay.
      if (m && i !== current && !isMarket()) return `<li class="${cls}"><button type="button" class="sq-btn" data-act="pick" data-i="${i}" title="Replay scene ${j + 1}: ${sc.title}">${label}${inner}</button></li>`;
      return `<li class="${cls}" title="Scene ${j + 1}: ${sc.title}">${label}${inner}</li>`;
    }).join('')}</ol>`;
  }

  // ───────────────────────── The campaign index (the Play link)
  // Every scene as a position on a path: completed, next, or waiting on the one before.
  // The signature is the logo's 2×2 matrix, read as the four forces every scene turns on.

  const IX_ARROW = `<svg class="ix-arrow" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5h38M33 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.25"/></svg>`;
  const FORCES = ['incentives', 'information', 'power', 'relationships'];
  const FORCE_NAME = { incentives: 'Incentives', information: 'Information', power: 'Power', relationships: 'Relationships' };
  // The matrix: four cells, the ones in play filled. Large and labelled in the masthead, small on each episode.
  const forceMatrix = (on, big) => `<svg class="ix-matrix ${big ? 'is-big' : ''}" viewBox="0 0 40 40" aria-hidden="true">${FORCES.map((f, k) =>
    `<rect class="${on.includes(f) ? 'is-on' : ''}" x="${(k % 2) * 21}" y="${Math.floor(k / 2) * 21}" width="19" height="19"/>`).join('')}</svg>`;
  const ixNo = i => `${LIST[i].ep.number}.${pos(i).n}`;

  // One scene: a node on the path, its number, its title, and its status in a fixed vocabulary.
  function ixRow(i, d) {
    const n = history.length, m = d.moves[i], sc = LIST[i];
    const node = `<span class="ix-node" aria-hidden="true"></span>`;
    const lead = `${node}<span class="ix-no">${ixNo(i)}</span><span class="ix-name">${sc.title}</span>`;
    if (i < n) {
      const asking = confirmScene === i, later = n - 1 - i, g = grades[m.opt.q];
      if (asking) {
        const lastEp = LIST[n - 1].ep;
        const what = !later ? 'Nothing after it changes.' : `Resets ${later === 1 ? 'the next scene' : `the ${NUM[later] || later} scenes after it`}${lastEp !== sc.ep ? `, through Episode ${lastEp.number}` : ''}.`;
        return `<li class="ix-step is-done is-asking"><button type="button" class="ix-row" data-act="scene" data-i="${i}">${lead}
          <span class="ix-meta"><span class="ix-label">Confirm replay</span><span class="ix-warn">${what}</span></span></button></li>`;
      }
      return `<li class="ix-step is-done"><button type="button" class="ix-row" data-act="scene" data-i="${i}" aria-label="${sc.title}. Completed, ${g.name}. Replay.">${lead}
        <span class="ix-meta"><span class="ix-label ix-rest">Completed · ${g.name}</span><span class="ix-label ix-hover">Replay this scenario</span></span><span class="ix-end ix-grade ix-q${m.opt.q}" title="${g.name}">${g.glyph}</span></button></li>`;
    }
    if (i === n) return `<li class="ix-step is-next"><button type="button" class="ix-row" data-act="scene" data-i="${i}" aria-label="${sc.title}. Next scenario. Play.">${lead}
      <span class="ix-meta"><span class="ix-label">Next scenario</span></span><span class="ix-end">${IX_ARROW}</span></button></li>`;
    return `<li class="ix-step is-locked"><span class="ix-row" aria-disabled="true">${lead}
      <span class="ix-meta"><span class="ix-label">Requires ${ixNo(i - 1)}</span></span></span></li>`;
  }

  function viewEpisodes() {
    const d = derive(history), n = history.length, done = n >= LIST.length;
    const at = done ? null : pos(n);
    const epsDone = EPS.filter(ep => LIST.every((sc, i) => sc.ep !== ep || i < n)).length;
    const sharp = d.moves.filter(m => m.opt.q >= 3).length;

    const resume = done
      ? `<button type="button" class="ix-resume" data-act="profile">
          <span class="ix-resume-k">Campaign complete</span>
          <span class="ix-resume-main"><span class="ix-resume-t">Review your dance</span><span class="ix-resume-d">Every scene played. Replay any of them below.</span></span>
          <span class="ix-resume-go">Open profile ${IX_ARROW}</span></button>`
      : `<button type="button" class="ix-resume" data-act="play">
          <span class="ix-resume-k"><span class="ix-node" aria-hidden="true"></span>${!n ? 'Begin' : at.n === 1 ? 'Next episode' : 'Resume'}</span>
          <span class="ix-resume-main"><span class="ix-resume-no">Scenario ${ixNo(n)} · ${placeOf(LIST[n].id).name}</span><span class="ix-resume-t">${LIST[n].title}</span><span class="ix-resume-d">Episode ${at.ep.number}, ${at.ep.title}. Scene ${at.n} of ${at.of}.</span></span>
          <span class="ix-resume-go">Enter scenario ${IX_ARROW}</span></button>`;

    const chapters = EPS.map((ep, e) => {
      const idx = LIST.map((sc, i) => i).filter(i => LIST[i].ep === ep);
      const played = idx.filter(i => i < n).length, total = idx.length;
      const current = !done && LIST[n].ep === ep, complete = played === total;
      const status = complete ? 'Completed' : current ? `In progress · ${played} of ${total}` : `Requires Episode ${EPS[e - 1].number}`;
      const forces = ep.forces || [];
      return `<article class="ix-ch ${current ? 'ix-ch-now' : ''} ${complete ? 'ix-ch-done' : ''} ${!current && !complete ? 'ix-ch-later' : ''}" aria-labelledby="ix-ch-${ep.number}">
        <header class="ix-ch-head">
          <div class="ix-ch-id"><span class="ix-ch-num">${String(ep.number).padStart(2, '0')}</span><span class="ix-label">Episode${current ? ' · Current' : ''}</span></div>
          <div class="ix-ch-main">
            <h2 class="ix-ch-title" id="ix-ch-${ep.number}">${ep.title}</h2>
            <p class="ix-ch-deck">${ep.blurb}</p>
          </div>
          <div class="ix-ch-side">
            <div class="ix-ch-forces">${forceMatrix(forces)}<span><span class="ix-label">In play</span><span class="ix-forces-list">${forces.map(f => FORCE_NAME[f]).join(' · ')}</span></span></div>
            <div class="ix-ch-status"><span class="ix-bar" aria-hidden="true"><span style="width:${Math.round(played / total * 100)}%"></span></span><span class="ix-label">${status}</span></div>
          </div>
        </header>
        <div class="ix-places">${ep.places.map(p => `<section class="ix-place">
          <h3 class="ix-place-h">${p.name}</h3>
          <p class="ix-place-d">${p.theme}</p>
          <ol class="ix-path">${p.scenes.map(id => ixRow(LIST.findIndex(s => s.id === id), d)).join('')}</ol>
        </section>`).join('')}</div>
      </article>`;
    }).join('');

    return `<section class="ix">
      <div class="wrap ix-in">
        <header class="ix-mast">
          <div class="ix-mast-main">
            <p class="ix-kicker ix-label">The campaign</p>
            <h1 class="ix-title">Where to next.</h1>
            <p class="ix-lede">How people behave when incentives, information, power and relationships collide. ${LIST.length} situations in ${NUM[EPS.length] || EPS.length} episodes; each remembers the ones before it.</p>
          </div>
          <figure class="ix-forces" aria-label="The four forces: incentives, information, power, relationships">
            <span class="ix-f ix-f-tl">Incentives</span><span class="ix-f ix-f-tr">Information</span>
            ${forceMatrix(FORCES, true)}
            <span class="ix-f ix-f-bl">Power</span><span class="ix-f ix-f-br">Relationships</span>
          </figure>
        </header>
        <dl class="ix-ledger">
          <div><dt class="ix-label">Scenes completed</dt><dd>${n}<span>/${LIST.length}</span></dd></div>
          <div><dt class="ix-label">Episodes completed</dt><dd>${epsDone}<span>/${EPS.length}</span></dd></div>
          <div><dt class="ix-label">Strong decisions</dt><dd>${sharp}<span>/${n || 0}</span></dd></div>
          <div><dt class="ix-label">Strategic rating</dt><dd>${d.rating}</dd></div>
        </dl>
        ${resume}
        <div class="ix-key" aria-hidden="true">
          <span><span class="ix-step is-done"><span class="ix-node"></span></span>Completed</span>
          <span><span class="ix-step is-next"><span class="ix-node"></span></span>Next scenario</span>
          <span><span class="ix-step is-locked"><span class="ix-node"></span></span>Requires the one before</span>
          <span class="ix-key-g">!! ! !? ?! ?&nbsp; Decision grade</span>
        </div>
        ${chapters}
        <button type="button" class="ix-aside" data-act="market">
          <span class="ix-label">Separate track</span>
          <span class="ix-aside-t">The Trader's Mind</span>
          <span class="ix-aside-d">Five challenges at one desk, with one account.</span>
          <span class="ix-aside-go ix-label">Open ${IX_ARROW}</span>
        </button>
      </div>
    </section>`;
  }

  function staticScene(sc, moods) {
    return PP.art.sceneSvg(sc.stage, PP.people, moods || {}, `${sc.title}: illustrated scene`).svg;
  }

  // ───────────────────────── Home

  function viewHome() {
    const bench = thinkerOrder.map(k => {
      const t = thinkers[k];
      return `<li class="${t.practitioner ? 'is-wide' : ''}"><button type="button" class="bench-card ${t.grandfather ? 'is-grand' : ''} ${t.practitioner ? 'is-practitioner' : ''}" data-thinker="${k}" aria-haspopup="dialog" style="--tc:${t.color}"><span class="bench-icon">${t.icon}</span>${t.grandfather ? `<span class="bench-badge">Intellectual grandfather</span>` : ''}${t.practitioner ? `<span class="bench-badge">The practitioner · Market Wizards</span>` : ''}<span class="bench-name">${t.name}</span><span class="bench-teaches">teaches you ${t.teaches}</span><span class="bench-more" aria-hidden="true">Read more</span></button></li>`;
    }).join('');

    return `<div class="hm">
      <section class="hm-hero">
        <div class="hm-hero-art"><img src="/img/hero-dance-floor.webp?v=${PP.assetV}" width="2400" height="1028" alt="Two chess pieces, one ivory and one black, face each other on a checkered dance floor. Each stands in its own spotlight; where the light overlaps, a teal circle glows between them. Dice rest in the foreground, and a corridor of doorways recedes into a soft glow of haze. Beyond the floor, a low moon lays a path of light across the waves of a dark sea."></div>
        <div class="hm-hero-shade" aria-hidden="true"></div>
        <div class="wrap hm-hero-in">
          <h1 class="hm-hero-title">You don't have to be the most powerful person in the room.</h1>
          <p class="hm-hero-sub">You have to understand the room.</p>
        </div>
      </section>

      <section class="wrap hm-intro">
        <div class="hm-intro-main">
          <p class="ix-label hm-label-accent">A game about understanding people</p>
          <p class="hm-statement">Why do smart people hold a losing position, chase a tip, or bet the account on one idea? Why does the person on the phone always seem to know a little more than you?</p>
          <p class="hm-intro-sub">There's a logic to all of it, and most of it isn't about markets. The Dance puts you at a trading desk and on the phone, lets you choose, and then shows you what was going on: what each person wanted, what you could have known, and how much of the result was skill and how much was luck.</p>
        </div>
      </section>

      <section class="hm-tm" aria-labelledby="hm-tm-h">
        <header class="wrap hm-tm-head">
          <p class="hm-tm-k"><span class="ix-node" aria-hidden="true"></span>Playing the Odds · Inspired by Market Wizards</p>
          <h2 id="hm-tm-h">The Trader's Mind</h2>
          <p class="hm-tm-sub">You don't have to predict the future. You have to survive it.</p>
          <p class="hm-tm-lede">One $100,000 account and five kinds of capital, played two ways. First against the market, then against the people who call you about it.</p>
        </header>
        <div class="hm-tm-split">
          <a class="hm-tm-door is-desk" href="#market" data-nav="market" aria-label="Part I, The Desk: you against the market. Five challenges.">
            <span class="hm-tm-bg" aria-hidden="true"><img src="/img/env/trading-bg.webp?v=${PP.assetV}" alt="" width="2400" height="1350" loading="lazy"></span>
            <span class="hm-tm-in">
              <span class="hm-tm-part">Part I</span>
              <span class="hm-tm-t">The Desk</span>
              <span class="hm-tm-vs">You against the market.</span>
              <span class="hm-tm-d">Five challenges at one trading desk. The price moves, the news arrives, and nobody tells you what it means.</span>
              <span class="hm-tm-live hm-tm-chart" aria-hidden="true">
                <span class="hm-tm-tick">HALCYON HOMES<b>−$2,250</b></span>
                <svg viewBox="0 0 320 110" preserveAspectRatio="none"><line class="stop" x1="0" y1="62" x2="320" y2="62"/><text x="316" y="56">STOP 37.00</text><polyline class="px" points="0,24 22,30 40,22 62,34 84,30 104,42 126,38 146,50 168,46 188,58 206,55 226,70 246,66 268,82 290,78 312,96"/><circle cx="312" cy="96" r="4"/></svg>
              </span>
              <span class="hm-tm-go">Sit down at the desk <i aria-hidden="true">→</i></span>
            </span>
          </a>
          <a class="hm-tm-door is-call" href="#call" data-nav="call" aria-label="Part II, The Call: you against the person on the line. Five phone calls.">
            <span class="hm-tm-bg" aria-hidden="true"><img src="/img/env/desk-dusk-bg.webp?v=${PP.assetV}" alt="" width="2400" height="1350" loading="lazy"></span>
            <span class="hm-tm-in">
              <span class="hm-tm-part">Part II <em>New</em></span>
              <span class="hm-tm-t">The Call</span>
              <span class="hm-tm-vs">You against the person on the line.</span>
              <span class="hm-tm-d">Five phone calls. Every caller has a reason for calling that isn't quite the one they give.</span>
              <span class="hm-tm-live hm-tm-paper" aria-hidden="true">
                <span class="hm-tm-ring"><i></i>Incoming · Michael Reeves</span>
                <span class="hm-tm-line">“I've got a buyer at <span class="hm-tm-key">$34.80<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path pathLength="100" d="M6,22 C6,4 94,2 96,20 C98,38 10,40 14,14"/></svg></span>.”</span>
                <span class="hm-tm-note">He has a buyer. Who?</span>
              </span>
              <span class="hm-tm-go">Answer the phone <i aria-hidden="true">→</i></span>
            </span>
          </a>
        </div>
        <div class="wrap hm-tm-qs">
          <p class="hm-tm-qk">The same five questions, asked two ways</p>
          <ol>${MK.ep.places.map((pl, k) => { const sc = TRACKS.market.list.find(x => x.id === pl.scenes[0]), call = PP.call.calls[k]; return `<li><span class="hm-tm-n">${String(k + 1).padStart(2, '0')}</span><span class="hm-tm-q">${sc.tests}</span><span class="hm-tm-a"><small>The Desk</small>${sc.title.split(' · ')[0]}</span><span class="hm-tm-a"><small>The Call</small>${call ? call.title : ''}</span></li>`; }).join('')}</ol>
        </div>
      </section>

      <section class="wrap bench-sec hm-bench">
        <header class="hm-sec-head"><p class="ix-label hm-label-accent">The bench</p><h2>Six thinkers and a trader. One question each.</h2>
          <p class="hm-sec-deck">Each scene is seen through one of their lenses. Thomas Schelling sits at the head of the table: he studied people whose interests partly conflict and partly overlap, which describes almost everyone you'll meet.</p></header>
        <ul class="bench-grid">${bench}</ul>
        <dialog class="thinker-dialog" id="thinker-dialog" aria-labelledby="thinker-dialog-h">
          <div class="thinker thinker-pop"></div>
          <form method="dialog" class="thinker-close-row"><button class="btn btn-ghost btn-sm" value="close">Close</button></form>
          <form method="dialog"><button class="thinker-x" value="close" aria-label="Close" autofocus>×</button></form>
        </dialog>
        <button class="hm-link" data-act="bench">Read what each one teaches ${IX_ARROW}</button>
      </section>

    </div>`;
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
        ${t.lessons ? `<div class="te-block"><p class="te-label">${NUM[t.lessons.length] ? NUM[t.lessons.length][0].toUpperCase() + NUM[t.lessons.length].slice(1) : t.lessons.length} lessons for everyday play</p><ol class="te-lessons">${t.lessons.map(l => `<li><p class="te-l-tag">${l.tag}</p><h4>${l.name}</h4>${[].concat(l.body).map(b => `<p class="te-l-body">${b}</p>`).join('')}${l.ask ? `<div class="te-l-ask"><p class="te-label">The question to ask</p><p class="te-l-q">${l.ask}</p></div>` : ''}${l.remember ? `<p class="te-l-remember"><strong>Remember:</strong> ${l.remember}</p>` : ''}</li>`).join('')}</ol></div>` : ''}
        ${t.takeaway ? `<div class="te-close"><p class="te-takeaway">${t.takeaway}</p>${t.credo ? `<ul class="te-credo">${t.credo.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}${t.closing ? `<p class="te-closing">${t.closing}</p>` : ''}</div>` : ''}
        ${t.related ? `<p class="te-related">${t.related}</p>` : ''}`;
  }


  function viewBench() {
    const cards = thinkerOrder.map(k => `<article class="thinker ${thinkers[k].grandfather ? 'is-grand' : ''} ${thinkers[k].practitioner ? 'is-practitioner' : ''}" style="--tc:${thinkers[k].color}">${thinkerEntry(k)}</article>`).join('');
    return `<section class="wrap page">
      <div class="section-head"><p class="eyebrow">The bench</p><h1>The thinkers behind the game</h1>
        <p class="lede">You won't be asked to memorize anything. Each scene puts one of these ideas in front of you as a situation, and the analysis afterward names it. Six thinkers built the theory, and a practitioner from the markets shows what it takes to live by it.</p></div>
      <div class="thinker-grid">${cards}</div>
      <div class="page-actions"><button class="btn btn-primary" data-act="market">Sit down at the desk</button></div>
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
          <p class="meta">${isMarket() ? `The Trader's Mind · Challenge ${at.n} of ${at.of}${sc.opponent ? ` · The opponent: ${sc.opponent}` : ''}` : `Episode ${at.ep.number} · Scene ${at.n} of ${at.of} · ${place.name}`}</p>
          ${isMarket() ? `<button type="button" class="btn btn-link play-out" data-act="market">All challenges</button>` : `<button type="button" class="btn btn-link play-out" data-act="episodes">All episodes</button>`}
          <div class="chips"><span class="chip">${sc.level}</span>${sc.lens.map((k, i) => `<span class="chip ${i ? '' : 'chip-lens'}">${i ? 'Also' : 'Lens'} · ${thinkers[k].short}</span>`).join('')}</div>
        </div>
        ${isMarket() ? `<div class="hud" id="hud" aria-label="Your capital">${hud(capitals(history.slice(0, idx)).cap)}</div>` : ''}
        ${sc.play ? `<div class="meters" id="meters" aria-label="What you're protecting"></div>` : ''}
      </div>
      <div class="play-body">
        <div class="stage-wrap" id="stage-mount"></div>
        <div class="panel-wrap"><div class="panel" id="panel"></div></div>
      </div>
    </section>`;
  }

  // What the desk remembers before challenge idx: your capital, your rules, and what you did.
  function marketMemory(idx) {
    const C = capitals(history.slice(0, idx));
    const steps = C.steps.map(x => ({ id: x.sc.id, title: x.sc.title, key: x.opt.key, did: x.opt.did || x.opt.text, broke: x.broke, tone: x.oc.tone, fin: x.oc.ruin ? null : x.oc.fin, opponent: x.sc.opponent }));
    return { cap: C.cap, past: Object.fromEntries(steps.map(x => [x.id, x.key])), steps, day: idx };
  }

  function mountStage(sc, idx) {
    if (stage) stage.destroy();
    const d = derive(history.slice(0, idx));
    if (idx >= history.length && sc.types && !draft.type) draft.type = drawType(sc, history.slice(0, idx));
    const type = idx < history.length ? typeOf(sc, history[idx]) : draft.type;
    stage = new PP.Stage(document.getElementById('stage-mount'), sc.stage, {
      ctx: { rel: d.rel, flags: d.flags, type, account: isMarket() ? capitals(history.slice(0, idx)).cap.fin : null, rules,
        ...(isMarket() ? marketMemory(idx) : {}) },
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
    await stage.run(sc.stage.intro, { title: `<span>${isMarket() ? `Challenge ${pos(idx).n}` : `${pos(idx).n === 1 ? `Episode ${sc.ep.number} · ` : ''}Scene ${pos(idx).n}`} · ${placeOf(sc.id).name}</span><strong>${sc.title}</strong>` });
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
    const opt = staged(sc, derive(history).moves[idx].opt);
    const run = ++ui.runId;
    ui.phase = 'react';
    renderPanel();
    const lead = h.said ? { you: h.said } : opt.line ? { you: opt.line } : { caption: opt.caption, cam: 'wide' };
    const epi = sc.epilogue && val(sc.epilogue, { type: h.type, clues: h.clues });
    const beats = [lead, ...opt.outcomes[h.outcome].beats, ...(epi ? [{ cam: 'wide', ...epi }] : [])];
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
    const mt = document.getElementById('meters');
    if (mt) {
      const after = derive(ui.phase === 'result' ? history : history.slice(0, idx));
      const mv = ui.phase === 'result' ? after.moves[idx] : null;
      mt.innerHTML = meterLine(after.flags.meters || START_METERS, mv && mv.fx, (mv && mv.stake) || draft.stake || after.flags.stake);
    }
    const h = document.getElementById('hud');
    if (h) h.innerHTML = ui.phase === 'result' ? hud(capitals().cap, capitals(history.slice(0, -1)).cap) : hud(capitals(history.slice(0, idx)).cap);
  }

  function panelWatching(sc, msg) {
    return `<div class="watch"><span class="rec-dot" aria-hidden="true"></span><p>${msg}</p>
      ${ui.phase === 'intro' ? `<button class="btn btn-ghost btn-sm" data-act="to-decision">Skip to the decision</button>` : ''}</div>`;
  }

  function panelDecide(sc) {
    if (sc.play) {
      if (!draft.step) draft.step = sc.stakes && !draft.stake && !ctxNow(sc).flags.stake ? 'stake' : 'read';
      if (draft.step !== 'choose') return panelBeats(sc);
    }
    const press = sc.play && sc.press ? val(sc.press, ctxNow(sc)) : null;
    const options = optsNow(sc).map(o => `<li>
      <input type="radio" name="move" id="move-${sc.id}-${o.key}" value="${o.key}" ${draft.selected === o.key ? 'checked' : ''} ${trustLocked(o) ? 'disabled' : ''}>
      <label for="move-${sc.id}-${o.key}" class="option ${trustLocked(o) ? 'is-locked' : ''}"><span class="option-key">${o.key}</span><span class="option-text">${fill(o.text)}${o.exposure ? `<span class="exp exp-${o.exposure} ${breaks(o) ? 'is-over' : ''}">${MK.exposureLabel[o.exposure]}${breaks(o) ? ' · over your limit' : ''}${o.brokeRules ? ' · breaks a rule in your journal' : ''}${trustLocked(o) ? ` · ${lockReason(o)}` : ''}</span>` : ''}</span></label>
    </li>`).join('');
    return `<form id="decide-form" class="decide">
      <div class="decide-top">
        ${press ? `<blockquote class="beat-say beat-say-lead"><span>${PP.people[press.who].name}</span>“${press.say}”</blockquote>` : ''}
        ${sc.facts ? `<section class="facts" aria-label="The situation"><p class="facts-k">The situation</p><ul>${sc.facts.map(f => `<li>${fill(f)}</li>`).join('')}</ul></section>` : ''}
        <fieldset><legend class="decide-q">${sc.question}</legend>
          ${isMarket() && rules ? marketState(sc) : ''}
          ${isMarket() && rules ? `<p class="rules-mini">Your rules: <strong>${ruleOf('risk', rules.risk).label}</strong> risk per decision · edge: <strong>${ruleOf('edge', rules.edge).label}</strong></p>` : ''}
          <ul class="options">${options}</ul></fieldset>
      </div>
      <div class="decide-bar">
        <button type="button" class="btn btn-ghost" data-act="freeze"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Freeze and analyze</button>
        <button type="submit" class="btn btn-primary" id="evaluate-btn" ${draft.selected ? '' : 'disabled'}>Make this move</button>
      </div>
      ${sc.play ? '' : `<p class="decide-hint">${draft.clues.length ? `You've read ${draft.clues.length} of ${sc.clues.length} details in the room.` : `Tip: freezing the scene lets you read the room before you commit.`} <button type="button" class="btn-link-sm" data-act="replay-intro">Watch the scene again</button></p>`}
    </form>`;
  }

  // The room's details. In a beat scene you only get so many reads, and they close once you answer.
  // In The Trader's Mind your state sets how much you can take in: rattled, you check one thing;
  // calm, three; a sharp edge buys one more look.
  function marketReads() {
    const c = capitals().cap;
    return (c.psy >= 7 ? 3 : c.psy >= 4 ? 2 : 1) + (c.str >= 7 ? 1 : 0);
  }
  const readsOf = sc => isMarket() ? marketReads() : sc.reads;
  const readsLeft = sc => readsOf(sc) ? Math.max(0, readsOf(sc) - draft.clues.length) : Infinity;
  // Nadia won't sign it: either the account is down her ladder, or she doesn't trust you.
  const lockReason = o => isMarket() ? MK.lockReason(capitals().cap, o.exposure, o) : null;
  const trustLocked = o => !!lockReason(o);
  function marketState(sc) {
    const c = capitals().cap, lines = [];
    const st = MK.step(c.fin);
    lines.push(`<strong>Nadia's limits.</strong> <span class="mk-ladder">${MK.ladder.map(l => `<span class="${st && st.k === l.k ? 'is-now' : ''}">${l.label}</span>`).join('')}</span>${st ? ` ${st.note}` : ` Account $${c.fin}k: no limits on you yet.`}`);
    if (sc && sc.cycle) lines.push(`<strong>The cycle.</strong> <span class="mk-cycle" aria-label="${sc.cycle.t} of 5, cold to hot">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= sc.cycle.t ? 'on' : ''}"></i>`).join('')}</span> ${sc.cycle.read}`);
    const reads = marketReads();
    if (c.psy <= 3) lines.push(`<strong>Rattled.</strong> Composure ${c.psy}/10: you only have it in you to check ${NUM[reads]} ${reads === 1 ? 'thing' : 'things'} before you decide.`);
    else lines.push(`<strong>${c.psy >= 7 ? 'Clear-headed' : 'Steady'}.</strong> Composure ${c.psy}/10: you can check ${NUM[reads]} things before you decide.`);
    if (c.str >= 7) lines.push(`<strong>Sharp edge.</strong> Edge ${c.str}/10: you know what you're looking for, so one more look is free.${c.psy <= 3 ? ' You know what to do. The question is whether you will.' : ''}`);
    if (c.soc < 5) lines.push(`<strong>Nadia is watching.</strong> Trust ${c.soc}/10: she won't sign anything above a normal-size risk.`);
    else if (c.soc >= 8) lines.push(`<strong>Nadia trusts you.</strong> Trust ${c.soc}/10: she'll hear an exception, though she may still say no.`);
    lines.push(`<strong>Runway ${c.time}/10.</strong> Every challenge spends one. It's the season you have left to recover from mistakes.`);
    return `<ul class="mk-state">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
  }
  const readsOpen = sc => !sc.play || (draft.step !== 'choose' && draft.step !== 'push');
  const readsNote = sc => readsOf(sc) && isFinite(readsLeft(sc)) ? `<p class="reads-note">${readsLeft(sc)} of ${readsOf(sc)} ${readsOf(sc) === 1 ? 'read' : 'reads'} left</p>` : '';
  function clueList(sc) {
    return sc.clues.map((c, i) => {
      const open = draft.clues.includes(i), shut = !open && (!readsLeft(sc) || !readsOpen(sc));
      return `<li class="clue ${open ? 'is-open' : ''} ${shut ? 'is-shut' : ''}"><button type="button" class="clue-btn" data-clue="${i}" ${open || shut ? 'disabled' : ''} aria-expanded="${open}"><span class="clue-label">${c.label}${c.cost ? `<span class="clue-cost">Costs something: ${c.cost.note}</span>` : ''}</span><span class="clue-state">${open ? 'Noted' : shut ? 'No reads left' : 'Look'}</span></button>${open ? `<p class="clue-text">${clueText(c, ctxNow(sc))}</p>` : ''}</li>`;
    }).join('');
  }

  // A beat scene in play: the state the scene's own functions see right now.
  const ctxNow = sc => { const d = derive(history.slice(0, LIST.indexOf(sc))); return { rel: d.rel, flags: d.flags, type: draft.type, clues: draft.clues, rules, stake: draft.stake }; };
  const meterLine = (m, delta, stake) => Object.keys(START_METERS).map(k => {
    const d = delta ? delta[k] || 0 : 0;
    const v = k === 'time' ? `${m[k]}h` : `${m[k] > 0 ? '+' : ''}${m[k]}`;
    return `<span class="mtr ${stake === k ? 'is-stake' : ''}"><span class="mtr-k">${METER_NAME[k]}${stake === k ? ' · protecting' : ''}</span><span class="mtr-v">${v}${d ? `<em class="${d > 0 ? 'up' : 'down'}" title="This scene">${d > 0 ? '↑' : '↓'}${Math.abs(d)}${k === 'time' ? 'h' : ''}</em>` : ''}</span></span>`;
  }).join('');

  function panelBeats(sc) {
    if (draft.step === 'stake') {
      return `<div class="beat"><p class="beat-k">Before anything else</p><h2 class="beat-q">${sc.stakes.ask}</h2>
        <div class="beat-choices">${sc.stakes.choices.map(c => `<button type="button" class="beat-choice" data-act="stake" data-v="${c.id}"><strong>${c.label}</strong><span>${c.note}</span></button>`).join('')}</div></div>`;
    }
    if (draft.step === 'push') {
      const p = val(optsNow(sc).find(o => o.key === draft.selected).push, ctxNow(sc));
      return `<div class="beat"><p class="beat-k">${PP.people[p.who].name} pushes back</p><blockquote class="beat-say">“${p.say}”</blockquote>
        <div class="beat-choices">${['hold', 'give', 'walk'].map(k => `<button type="button" class="beat-choice" data-act="push" data-v="${k}"><strong>${p[k].label}</strong><span>“${p[k].line}”</span></button>`).join('')}</div></div>`;
    }
    const left = readsLeft(sc);
    return `<div class="beat"><p class="beat-k">Read the room · ${left} of ${sc.reads} ${sc.reads === 1 ? 'read' : 'reads'} left</p><h2 class="beat-q">${sc.readAsk}</h2>
      <p class="beat-note">Each read takes a moment, and some of them get noticed. Slow-mo uses the same reads.</p>
      <ul class="clues">${clueList(sc)}</ul>
      <div class="decide-bar">
        <button type="button" class="btn btn-ghost" data-act="freeze"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>Freeze and study the room</button>
        <button type="button" class="btn btn-primary" data-act="press">${draft.clues.length ? 'Enough. Hear her out' : 'Answer without looking'}</button>
      </div></div>`;
  }

  function panelFrozen(sc) {
    const past = derive(history.slice(0, LIST.indexOf(sc))).rel;
    const cast = sc.stage.cast.map((c, i) => {
      const meta = sc.cast[i] || {};
      const t = past[c.id] || 0;
      return `<li class="who"><span class="pin pin-inline">${i + 1}</span><div>
        <p class="who-name"><strong>${PP.people[c.id].name}</strong> <span>${meta.role || ''}</span></p>
        ${t ? `<p class="who-trust ${t > 0 ? 'up' : 'down'}">${t > 0 ? 'Trusts you' : 'Wary of you'}, from earlier scenes</p>` : ''}
        <p class="who-want">Wants: ${c.wants}</p>
        <p class="who-tags"><span class="tag">${meta.archetype || ''}</span><span class="tag tag-power">Power: ${meta.power || ''}</span></p>
      </div></li>`;
    }).join('');
    const clues = clueList(sc);
    const opts = optsNow(sc).map(o => `<li><span class="option-key">${o.key}</span><div><p class="fo-text">${fill(o.text)}</p><p class="fo-prev">${staged(sc, o).preview}</p></div></li>`).join('');
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
          <div class="ku"><div><h3 class="ku-h">You know</h3><ul class="ticks">${val(sc.known, ctxNow(sc)).map(k => `<li>${k}</li>`).join('')}</ul></div>
          <div><h3 class="ku-h">Still uncertain</h3><ul class="ticks ticks-q">${sc.unknown.map(k => `<li>${k}</li>`).join('')}</ul></div></div>
          <h3 class="ku-h ku-gap">Read the room</h3>${readsNote(sc)}<ul class="clues">${clues}</ul></section>
      </div>
      ${canDecide ? `<section class="fz"><h2 class="block-h">Your options and where they might lead</h2><ol class="fopts">${opts}</ol>
        <p class="small">These are possibilities, not grades. The scene decides what actually happens.</p></section>` : ''}
    </div>`;
  }

  // Why it went the way it did, from the other side: their reasoning, what your history with
  // them changed, and whether you found what you needed to make the strong version of your move.
  function theirSide(sc, opt, type) {
    const t = sc.types && sc.types.find(x => x.id === type);
    const who = t ? `<div><p class="their-k">Who they were this time</p><p><strong>${t.label}.</strong> ${t.tell}</p><p class="their-note">${sc.share ? `${t.who} stays the same for the rest of this episode, so what you learned here still applies later. Replay the episode and that may change.` : `Play it again and ${t.who} may be different.`}</p></div>` : '';
    let knew = '';
    // needs: [-1] marks a move that has no sharper version for this type, so there is nothing to say.
    const needed = (opt.needs || []).filter(i => sc.clues[i]);
    if (needed.length) {
      const labels = needed.map(i => `“${sc.clues[i].label}”`).join(' and ');
      knew = opt.vague
        ? `You hadn't checked ${labels}, so you could only make the general version of this move. With it, you could have said: <em>${val(sc.options.find(o => o.key === opt.key).text, opt._c || {})}</em>`
        : `You checked ${labels}, which let you make the sharper version of this move. Sharper isn't always better: what matters is whether it fits the other side's incentives.`;
    }
    if (!opt.their && !opt.shaped && !knew && !who) return '';
    return `<section class="their">
      ${who}
      ${opt.their ? `<div><p class="their-k">The other side</p><p>${opt.their}</p></div>` : ''}
      ${opt.shaped ? `<div><p class="their-k">What earlier scenes changed</p><p>${opt.shaped}</p></div>` : ''}
      ${knew ? `<div><p class="their-k">What you knew</p><p>${knew}</p></div>` : ''}
    </section>`;
  }

  function lensBody(sc, opt, opts = sc.options) {
    const a = sc.analysis;
    // Formal term first, so players learn the words; the plain meaning sits under it.
    const concept = c => { const t = thinkers[c.thinker]; return `<article class="concept ${t.grandfather ? 'is-grand' : ''}"><p class="concept-who">${t.name} · ${t.field}</p><h3>${c.term || c.name}</h3>${c.term ? `<p class="concept-plain">${c.name}</p>` : ''}<p>${c.body}</p></article>`; };
    const others = opts.map(o => `<li class="other ${o.key === opt.key ? 'is-mine' : ''}"><span class="other-glyph g${o.q}" title="${grades[o.q].name}">${grades[o.q].glyph}</span><span class="other-text"><strong>${o.key}.</strong> ${fill(o.text)}${o.key === opt.key ? ' <em>(your move)</em>' : ''}</span></li>`).join('');
    // A move can carry its own idea; otherwise the scene's.
    return `<div class="concepts">${concept(opt.concept || a.concept)}${concept(opt.concept ? a.concept : a.second)}</div>
        <dl class="analysis">${[['Where the leverage was', a.leverage], ['What information was missing', a.missing], ['Assumptions you might have made', a.assumptions]].map(([k, v]) => `<div class="arow"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <h3 class="viz-h">Every move on the board</h3><ul class="others">${others}</ul>
        <p class="better"><strong>Strongest line:</strong> ${a.better}</p>
        <p class="lesson">${a.lesson}</p>`;
  }

  const whyOf = (opt, outcome) => opt.q >= 3 && outcome.tone !== 'good' ? `A sound decision that didn't fully pay off this time. Keep making it. Over many tries, sound decisions come out ahead.`
    : opt.q <= 1 && outcome.tone === 'good' ? `It worked out, but the reasoning was weak. Be most careful here: a lucky win teaches you to do it again.`
      : `The grade judges the decision. The result includes things you couldn't control.`;
  // When nothing you saw could tell some versions of the other person apart, say so, and what the move was worth in the one you got.
  const fairNote = opt => !opt.worlds || opt.qWorld === opt.q ? '' : ` <span class="verdict-fair">From what you'd seen, it could have been any of these: ${opt.worlds.map(t => t.label).join(' / ')}. Your grade weighs the move across all of them. In the version you actually got, it was ${grades[opt.qWorld].name.toLowerCase()}.</span>`;

  // Skill and luck: what each move was worth on average, given what you'd seen, and what this roll added.
  function skillLuck(sc, idx, move) {
    const capBefore = capitals(history.slice(0, idx)).cap;
    const ctx = { ...move.ctx, ...marketMemory(idx), cap: capBefore };
    const post = posterior(sc, ctx, move.clues) || [{ t: null, w: 1 }];
    const per = post.map(({ t, w }) => ({ w, opts: resolveRaw(sc, t ? { ...ctx, type: t.id } : ctx, move.clues) }));
    const rows = move.opts.map((o, k) => {
      let ev = 0, ruin = 0, worst = Infinity;
      per.forEach(({ w, opts }) => opts[k].outcomes.forEach(x => {
        if (!x.p) return;
        const f = x.ruin ? -capBefore.fin : x.fin;
        ev += w * x.p * f; if (x.ruin) ruin += w * x.p; worst = Math.min(worst, f);
      }));
      return { o, ev, ruin, worst: isFinite(worst) ? worst : 0, locked: !!MK.lockReason(capBefore, o.exposure, o) };
    });
    const mine = rows.find(r => r.o.key === move.opt.key);
    const got = move.outcome.ruin ? -capBefore.fin : move.outcome.fin;
    const luck = Math.round((got - mine.ev) * 10) / 10;
    const k$ = v => `${v < 0 ? '−' : v > 0 ? '+' : ''}$${Math.abs(Math.round(v * 10) / 10)}k`;
    const table = rows.map(r => `<tr class="${r.o.key === move.opt.key ? 'is-mine' : ''} ${r.locked ? 'is-locked' : ''}">
        <th scope="row"><span class="option-key">${r.o.key}</span></th>
        <td>${k$(r.ev)}</td><td>${k$(r.worst)}</td><td>${r.ruin ? `${Math.round(r.ruin * 100)}%` : '—'}</td>
        <td><span class="g${r.o.q}" title="${grades[r.o.q].name}">${grades[r.o.q].glyph}</span></td></tr>`).join('');
    return `<section class="evx"><h3 class="block-h">Skill and luck</h3>
      <p class="evx-line">On what you'd seen, your move was worth <strong>${k$(mine.ev)}</strong> on average. This time it came out <strong>${move.outcome.ruin ? 'at the whole account' : k$(got)}</strong>, so luck ${Math.abs(luck) < 0.1 ? 'didn\'t move it much' : luck > 0 ? `added <strong>${k$(luck).slice(1)}</strong>` : `cost you <strong>${k$(luck).slice(1)}</strong>`}.</p>
      <div class="evx-wrap"><table class="evx-t"><thead><tr><th scope="col">Move</th><th scope="col">Average</th><th scope="col">Worst case</th><th scope="col">Ends your game</th><th scope="col">Grade</th></tr></thead><tbody>${table}</tbody></table></div>
      <p class="evx-note">Averages use the odds of every world you couldn't rule out. The highest average isn't always the best move: one that can end your game, or breaks your rule, has to clear a much higher bar.${rows.some(r => r.locked) ? ' Faded moves were locked for you.' : ''}</p></section>`;
  }

  // After a weak decision or a loss bigger than planned, the desk asks you to write a rule. Later decisions are held to it.
  function journalBox(sc, idx, move) {
    const mine = MK.journal.load().find(e => e.src === 'desk' && e.id === sc.id && e.at === idx);
    if (mine) return `<section class="jbox is-set"><p class="jbox-k">In your journal</p><p class="jbox-rule">“${MK.journalRules[mine.rule].line}”</p><p class="jbox-note">Every decision after this one is held to it.</p></section>`;
    const plan = MK.plannedRisk[move.opt.exposure] || 0, lost = move.outcome.ruin ? Infinity : -move.outcome.fin;
    if (move.opt.q > 2 || (move.opt.q === 2 && lost <= plan + 0.05)) return '';
    if (idx >= LIST.length - 1) return '';
    const first = val(move.opt.defies, move.opt._c) || [];
    const order = [...first, ...Object.keys(MK.journalRules).filter(k => !first.includes(k))].slice(0, 3);
    return `<section class="jbox"><p class="jbox-k">Write it down</p><p class="jbox-note">${move.opt.q <= 1 ? `That decision graded ${grades[move.opt.q].name.toLowerCase()}.` : `That cost more than you planned to risk.`} Pick a rule for your journal. Every decision after this one will be held to it.</p>
      <div class="jbox-opts">${order.map(k => `<button type="button" class="btn btn-ghost jbox-opt" data-act="rule" data-r="${k}">“${MK.journalRules[k].line}”</button>`).join('')}</div></section>`;
  }

  function panelResultMarket(sc) {
    const idx = history.length - 1;
    const move = derive(history).moves[idx];
    const { opt, outcome } = move;
    const g = grades[opt.q];
    const C = capitals(), prev = capitals(history.slice(0, idx)).cap;
    const out = C.ruinedAt !== null;
    const last = idx === LIST.length - 1 || out;
    const tabs = [['outcome', 'Outcome'], ['game', 'The decision'], ['mind', 'The mind'], ['lens', 'The lens']];
    if (!tabs.some(t => t[0] === ui.tab)) ui.tab = 'outcome';
    const tabBar = `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="tab" data-tab="${k}" aria-selected="${ui.tab === k}" id="tab-${k}" aria-controls="tp-${k}">${l}</button>`).join('')}</div>`;
    const rule = rules ? ruleOf('risk', rules.risk) : null;
    const ruleLine = !rules ? '' : rules.risk === 'open'
      ? `You set no fixed limit, so nothing here broke a rule. Bruce Kovner would ask where you planned to get out before you got in.`
      : breaks(opt) ? `You said you'd risk no more than ${rule.label} of the account on one idea. This move <strong>${MK.exposureVerb[opt.exposure]}</strong>. You broke your own rule.`
        : `You said you'd risk no more than ${rule.label} of the account on one idea. This move stayed inside it.`;

    let body = '';
    if (ui.tab === 'outcome') {
      const caps = MK.capitals.map(c => {
        const d = C.steps[idx].after[c.k] - prev[c.k];
        return `<li class="capd ${d > 0 ? 'up' : d < 0 ? 'down' : ''}"><span class="capd-k">${c.name}</span><span class="capd-v">${c.k === 'fin' ? `$${C.steps[idx].after.fin}k` : C.steps[idx].after[c.k]}</span><span class="capd-d">${d ? (c.k === 'fin' ? money(d) : (d > 0 ? '+' : '−') + Math.abs(d)) : '·'}</span></li>`;
      }).join('');
      body = `
        ${out ? `<div class="ruin"><p class="eyebrow">The desk has pulled your capital</p><h2>You're out of the game.</h2><p>Your account fell 20% below where you started, and the desk took your capital back. ${LIST.length - idx - 1 ? `You won't get to play the ${NUM[LIST.length - idx - 1]} challenge${LIST.length - idx - 1 === 1 ? '' : 's'} that remained.` : ''} Everything you learned is still yours. The account isn't.</p></div>` : ''}
        <div class="verdict">
          <div class="verdict-glyph g${opt.q}" aria-hidden="true">${g.glyph}</div>
          <div class="verdict-copy">
            <p class="eyebrow">You played ${opt.key}</p><h2>${g.name}</h2><p class="verdict-note">${g.note}</p>
            <div class="verdict-pills"><span class="pill">Decision: ${g.name}</span><span class="pill pill-${outcome.tone}">Result: ${toneLabel[outcome.tone]}</span><span class="pill pill-num">${outcome.ruin ? 'Account: gone' : `Account ${money(outcome.fin)}`}</span></div>
            <p class="verdict-why">${whyOf(opt, outcome)}</p>
          </div>
        </div>
        ${(() => { const w = sc.types && sc.types.find(t => t.id === move.type); return w ? `<section class="their"><div><p class="their-k">What actually happened</p><p><strong>${w.label}.</strong> ${w.tell}</p><p class="their-note">That was about ${Math.round(w.p * 100)}% likely. Your grade judges the decision against what you could know, not the roll.</p></div></section>` : ''; })()}
        <ol class="timeline">
          <li><span class="tl-k">Right now</span><p>${outcome.text}</p></li>
          <li><span class="tl-k">What it means</span><p>${opt.later}</p></li>
        </ol>
        ${skillLuck(sc, idx, move)}
        <h3 class="block-h">Your capital after this decision</h3><ul class="capds">${caps}</ul>
        ${ruleLine ? `<p class="rule-line ${breaks(opt) ? 'is-broke' : ''}">${ruleLine}</p>` : ''}
        ${(opt.brokeRules || []).map(e => `<p class="rule-line is-broke">After ${MK.journal.from(e)} you wrote: <em>“${MK.journalRules[e.rule].line}”</em> This move broke it, and the grade counts that.</p>`).join('')}
        ${journalBox(sc, idx, move)}`;
    } else if (ui.tab === 'game') {
      body = `
        <h3 class="viz-h">What each move could cost or earn</h3>${riskChart({ ...sc, options: priorOpts(sc, move.clues) }, opt.key, move.outcomeIdx)}
        <h3 class="viz-h">How often each move goes well</h3>${PP.viz.tree({ ...sc, options: priorOpts(sc, move.clues) }, opt.key, move.outcomeIdx)}
        <h3 class="viz-h">What reading the room would have shown</h3>
        <ul class="clue-recap">${sc.clues.map((c, i) => `<li class="${move.clues.includes(i) ? 'is-seen' : ''}"><strong>${c.label}</strong> <span class="seen">${move.clues.includes(i) ? 'You looked' : 'You didn\'t look'}</span><p>${clueText(c, move.ctx)}</p></li>`).join('')}</ul>`;
    } else if (ui.tab === 'mind') {
      const v = opt.verdict;
      body = `
        <div class="mind-grid">
          <section class="card"><h3 class="block-h">Your rules vs. this move</h3>
            <p class="mind-p">${ruleLine || `You haven't set rules yet.`}</p>
            ${rules && sc.edgeNote ? `<p class="mind-p"><strong>Your edge: ${ruleOf('edge', rules.edge).label}.</strong> ${sc.edgeNote[rules.edge]}</p>` : ''}
          </section>
          ${v ? `<section class="card said said-card"><span class="said-face">${portrait(v.who, opt.q >= 3 ? 'smile' : opt.q === 2 ? 'neutral' : 'skeptical')}</span>
            <blockquote><p>“${v.line}”</p><footer><strong>${PP.people[v.who].name}</strong> · what the desk saw</footer></blockquote></section>` : ''}
        </div>
        <svg width="0" height="0" class="defs-only" aria-hidden="true">${PP.art.DEFS}</svg>
        <section class="life"><p class="eyebrow">The same decision, away from the screens</p><h3>${sc.life.title}</h3><p>${sc.life.text}</p></section>
        <dl class="analysis">${[['What game you were playing', sc.analysis.game], ['What was pulling at you', sc.analysis.incentives], ['What you controlled', sc.analysis.controlled], ['What you couldn\'t control', sc.analysis.couldnt]].map(([k, val]) => `<div class="arow"><dt>${k}</dt><dd>${val}</dd></div>`).join('')}</dl>`;
    } else {
      body = lensBody(sc, opt, move.opts);
    }
    return `<div class="result">
      ${tabBar}
      <div class="tabpanel" role="tabpanel" id="tp-${ui.tab}" aria-labelledby="tab-${ui.tab}">${body}</div>
      <div class="result-bar">
        <button class="btn btn-ghost" data-act="takeback">Replay with another strategy</button>
        <button class="btn btn-primary" data-act="${last ? 'market' : 'next'}">${last ? (out ? 'See what happened' : 'See your review') : 'Next challenge'}</button>
      </div>
    </div>`;
  }

  function panelResult(sc) {
    if (isMarket()) return panelResultMarket(sc);
    const idx = history.length - 1;
    const all = derive(history);
    const move = all.moves[idx];
    const before = derive(history.slice(0, idx));
    const { opt, outcome } = move;
    const st = staged(sc, opt);
    const g = grades[opt.q];
    const a = sc.analysis;
    const last = epEnd(idx);
    const ctxAfter = { rel: all.rel, flags: all.flags, type: move.type, clues: move.clues };
    const ratingDelta = move.ratingAfter - move.ratingBefore;
    const why = whyOf(opt, outcome) + fairNote(opt);

    const tabs = [['outcome', 'Outcome'], ['game', 'The game'], ['people', 'The people'], ['lens', 'The lens']];
    const tabBar = `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="tab" data-tab="${k}" aria-selected="${ui.tab === k}" id="tab-${k}" aria-controls="tp-${k}">${l}</button>`).join('')}</div>`;

    let body = '';
    if (ui.tab === 'outcome' && sc.play) {
      body = consequences(sc, move, all, ctxAfter, why);
    } else if (ui.tab === 'outcome') {
      const deltas = Object.entries(opt.s || {}).filter(([, v]) => v).sort((x, y) => y[1] - x[1])
        .map(([k, v]) => `<li class="delta ${v > 0 ? 'up' : 'down'}"><span>${v > 0 ? '+' : '−'}${Math.abs(v)}</span>${skills[k]}</li>`).join('')
        + (move.clues.length ? `<li class="delta up"><span>+${Math.min(move.clues.length, 2) * 0.5}</span>${skills.inf} (read the room)</li>` : '');
      const rels = Object.entries(opt.rel || {}).filter(([, v]) => v).map(([k, v]) => `<li class="relchip ${v > 0 ? 'up' : 'down'}">${PP.people[k].name} ${v > 0 ? 'trusts you more' : 'trusts you less'}</li>`).join('');
      body = `
        <div class="verdict">
          <div class="verdict-glyph g${opt.q}" aria-hidden="true">${g.glyph}</div>
          <div class="verdict-copy">
            <p class="eyebrow">You played ${opt.key}</p><h2>${g.name}</h2><p class="verdict-note">${g.note}</p>
            <div class="verdict-pills"><span class="pill">Decision: ${g.name}</span><span class="pill pill-${outcome.tone}">Result: ${toneLabel[outcome.tone]}</span><span class="pill pill-num">Rating ${move.ratingAfter} <small>${move.replay ? '(replay · your first try counts)' : `(${ratingDelta >= 0 ? '+' : '−'}${Math.abs(ratingDelta)})`}</small></span></div>
            <p class="verdict-why">${why}</p>
          </div>
        </div>
        <ol class="timeline">
          <li><span class="tl-k">Right now</span><p>${outcome.text}</p></li>
          <li><span class="tl-k">Later</span><p>${text(opt.later, ctxAfter)}</p>${rels ? `<ul class="relchips">${rels}</ul>` : ''}</li>
        </ol>
        ${theirSide(sc, opt, move.type)}
        <h3 class="block-h">How it shaped your profile</h3><ul class="deltas">${deltas}</ul>`;
    } else if (ui.tab === 'game') {
      body = `
        <h3 class="viz-h">Payoff matrix</h3>${PP.viz.matrix(sc.stage.matrix, st.row, sc.stage.matrix && sc.stage.matrix.byType ? sc.types.findIndex(t => t.id === move.type) : st.outcomes[move.outcomeIdx].col)}
        <h3 class="viz-h">Decision tree</h3>${PP.viz.tree({ ...sc, options: move.opts }, opt.key, move.outcomeIdx)}
        <h3 class="viz-h">What reading the room would have shown</h3>
        <ul class="clue-recap">${sc.clues.map((c, i) => `<li class="${move.clues.includes(i) ? 'is-seen' : ''}"><strong>${c.label}</strong> <span class="seen">${move.clues.includes(i) ? 'You looked' : 'You didn\'t look'}</span><p>${clueText(c, move.ctx)}</p></li>`).join('')}</ul>`;
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
      body = lensBody(sc, opt, move.opts);
    }

    return `<div class="result">
      ${tabBar}
      <div class="tabpanel" role="tabpanel" id="tp-${ui.tab}" aria-labelledby="tab-${ui.tab}">${body}</div>
      <div class="result-bar">
        <button class="btn btn-ghost" data-act="takeback">Replay with another strategy</button>
        ${last && LIST[idx + 1] ? `<button class="btn btn-ghost" data-act="profile">See your dance</button><button class="btn btn-primary" data-act="next">Start Episode ${LIST[idx + 1].ep.number}</button>`
          : `<button class="btn btn-primary" data-act="${last ? 'profile' : 'next'}">${last ? 'See your dance' : `Next scene`}</button>`}
      </div>
    </div>`;
  }

  // ───────────────────────── Consequences first (beat scenes)
  // What changed, measured against what you said you were protecting; what they now think of you;
  // who they really were. The verdict is still there, folded under "How you played it."
  const TRAIT = { easy: 'Easy to ask', firm: 'Holds their ground', fair: 'Trades favor for favor', sharp: 'Uses what they know', kind: 'Kind when it counts', careful: 'Checks before trusting', direct: 'Takes it to the source' };
  function stakeVerdict(stake, d) {
    if (!stake) return '';
    const name = METER_NAME[stake].toLowerCase();
    if (stake === 'time') return d < 0 ? `You were protecting your time. This cost you ${-d} ${-d === 1 ? 'hour' : 'hours'}.` : `You were protecting your time, and you kept all of it.`;
    return d > 0 ? `You were protecting your ${name}, and it grew.` : d < 0 ? `You were protecting your ${name}, and it took a hit.` : `You were protecting your ${name}. It held steady.`;
  }
  function consequences(sc, move, all, ctxAfter, why) {
    const { opt, outcome } = move;
    const g = grades[opt.q];
    const main = sc.stage.cast[0].id, name = PP.people[main].name;
    const stake = move.stake || all.flags.stake;
    const traits = Object.entries(move.rep || {}).filter(([, v]) => v > 0).map(([k]) => `<li>${TRAIT[k] || k}</li>`).join('');
    const rels = Object.entries(opt.rel || {}).filter(([, v]) => v).map(([k, v]) => `<li class="relchip ${v > 0 ? 'up' : 'down'}">${PP.people[k].name} ${v > 0 ? 'trusts you more' : 'trusts you less'}</li>`).join('');
    const deltas = Object.entries(opt.s || {}).filter(([, v]) => v).sort((x, y) => y[1] - x[1])
      .map(([k, v]) => `<li class="delta ${v > 0 ? 'up' : 'down'}"><span>${v > 0 ? '+' : '−'}${Math.abs(v)}</span>${skills[k]}</li>`).join('');
    const ratingDelta = move.ratingAfter - move.ratingBefore;
    const c = { ...move.ctx, clues: move.clues };
    const epi = sc.epilogue && val(sc.epilogue, c);
    const missed = sc.clues.map((k, i) => move.clues.includes(i) ? '' : `<li><strong>${k.label}.</strong> ${clueText(k, move.ctx)}</li>`).join('');
    return `
      <section class="cq">
        <p class="eyebrow">What changed</p>
        <div class="meters meters-result">${meterLine(all.flags.meters || START_METERS, move.fx, stake)}</div>
        ${stake ? `<p class="cq-stake">${stakeVerdict(stake, (move.fx || {})[stake] || 0)}</p>` : ''}
        ${move.push ? `<p class="cq-push">${{ hold: `${name} pushed back. You held your answer.`, give: `${name} pushed back, and you gave in.`, walk: `${name} pushed back, and you changed your answer.` }[move.push]}</p>` : ''}
      </section>
      <ol class="timeline">
        <li><span class="tl-k">Right now</span><p>${outcome.text}</p>${epi ? `<p class="cq-epi">${epi.caption}</p>` : ''}</li>
        <li><span class="tl-k">Later</span><p>${text(opt.later, ctxAfter)}</p>${rels ? `<ul class="relchips">${rels}</ul>` : ''}</li>
      </ol>
      ${missed ? `<section class="cq-missed"><p class="their-k">What you didn't check</p><ul>${missed}</ul></section>` : ''}
      ${traits ? `<section class="cq-read"><p class="their-k">What ${name} takes away about you</p><ul class="cq-traits">${traits}</ul>
        <p class="their-note">People talk. What you did here will reach the others in the office before long.</p></section>` : ''}
      ${theirSide(sc, opt, move.type)}
      <details class="cq-judge"><summary><span class="g${opt.q}">${g.glyph}</span> How you played it: ${g.name}</summary>
        <p class="verdict-note">${g.note} ${why}</p>
        <div class="verdict-pills"><span class="pill">Decision: ${g.name}</span><span class="pill pill-${outcome.tone}">Result: ${toneLabel[outcome.tone]}</span><span class="pill pill-num">Rating ${move.ratingAfter} <small>${move.replay ? '(replay · your first try counts)' : `(${ratingDelta >= 0 ? '+' : '−'}${Math.abs(ratingDelta)})`}</small></span></div>
        <h3 class="block-h">How it shaped your profile</h3><ul class="deltas">${deltas}</ul>
      </details>`;
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
      <section class="card dance-buys"><h3 class="block-h">What your choices were buying</h3>
          <ul class="buys">${buyBars}</ul>
          ${buys.length ? `<p class="buy-note">${I.buyNotes[buys[0][0]]}</p>` : ''}
          <aside class="mo-note" style="--tc:${thinkers.seykota.color}"><span class="mo-icon">${thinkers.seykota.icon}</span><p><strong>${thinkers.seykota.short}</strong> Everybody gets what they want. Your choices show what that was.</p></aside>
      </section>
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
              : `Built from your actual choices. It sharpens as you play the remaining ${LIST.length - n} scene${LIST.length - n === 1 ? '' : 's'}.`}</p>
          ${finished && !done ? `<button class="btn btn-primary profile-next" data-act="play">Start Episode ${at.ep.number} · ${at.ep.title}</button>` : ''}</div>
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

  // ───────────────────────── The Trader's Mind

  // Both parts share one hero. The tabs swap the page beneath it, not the address you came in on.
  function mkHero(inner, part = 'desk') {
    const env = part === 'call' ? 'desk-dusk' : 'trading';
    const tab = (v, n, t, d) => `<button type="button" class="mk-part ${part === v ? 'is-on' : ''}" data-act="mk-part" data-v="${v}" aria-pressed="${part === v}"><span class="mk-part-n">${n}</span><span class="mk-part-t">${t}</span><span class="mk-part-d">${d}</span></button>`;
    return `<section class="mk-hero">
      <div class="mk-art" aria-hidden="true"><img src="/img/env/${env}-bg.webp?v=${PP.assetV}" alt="" width="2400" height="1350"><img src="/img/env/${env}-fg.webp?v=${PP.assetV}" alt="" width="2400" height="1350"></div>
      <div class="mk-over"><div class="wrap">${inner}
        <div class="mk-parts">${tab('desk', 'Part I', 'The Desk', 'Five challenges')}${tab('call', 'Part II', 'The Call', 'Five phone calls')}</div></div></div>
    </section>`;
  }

  function viewCall() {
    const n = PP.callGame.count;
    return `${mkHero(`<p class="eyebrow eyebrow-on-dark">The Trader's Mind · Part II</p>
        <h1 class="mk-title">The Call</h1>
        <p class="mk-sub">Every call has two games in it. The one you think you're playing, and the one the caller is.</p>
        ${PP.callGame.ready ? `<div class="hero-actions"><button class="btn btn-primary" data-act="phone">${n ? `Continue · Call ${n + 1}` : 'Answer the phone'}</button></div>` : ''}`, 'call')}
      ${PP.callGame.overviewHTML()}`;
  }

  function viewMarket() {
    const C = capitals(), n = history.length;
    if (n && (n >= LIST.length || C.ruinedAt !== null)) return viewMarketReview(C);
    const list = LIST.map((sc, i) => {
      const m = C.steps[i];
      const asking = confirmScene === i;
      const inner = `<span class="mkc-n">${i + 1}</span><span class="mkc-body"><span class="mkc-t">${asking ? `Replay ${sc.title}?` : sc.title}</span><span class="mkc-q">${asking ? (i < n - 1 ? 'Tap again. Later challenges reset.' : 'Tap again to replay.') : sc.tests}</span><span class="mkc-life">Also: ${sc.life.title.charAt(0).toLowerCase() + sc.life.title.slice(1)}</span></span>`;
      if (i < n) return `<li><button type="button" class="mkc is-done ${asking ? 'is-asking' : ''}" data-act="scene" data-i="${i}">${inner}<span class="mkc-tag"><span class="g${m.opt.q}">${grades[m.opt.q].glyph}</span> Replay</span></button></li>`;
      if (i === n && rules) return `<li><button type="button" class="mkc is-next" data-act="trade">${inner}<span class="mkc-tag mkc-tag-next">Up next</span></button></li>`;
      return `<li><span class="mkc is-locked" aria-disabled="true">${inner}<span class="mkc-tag">${i === n ? 'Set your rules first' : 'Locked'}</span></span></li>`;
    }).join('');
    const ruleForm = `<form id="rules-form" class="rules">
      <div class="section-head"><p class="eyebrow">Before you sit down</p><h2>Write your rules.</h2>
        <p class="lede">Traders who last decide how they'll play before they have anything to defend. The game will hold you to what you write here.</p></div>
      ${['risk', 'edge'].map(k => `<fieldset class="rule-set"><legend>${MK.rules[k].q}</legend><div class="rule-opts">${MK.rules[k].options.map((o, i) => `<label class="rule-opt"><input type="radio" name="${k}" value="${o.v}" ${rules ? (rules[k] === o.v ? 'checked' : '') : i === (k === 'risk' ? 1 : 0) ? 'checked' : ''}><span class="rule-card"><strong>${o.label}</strong><span>${o.d}</span></span></label>`).join('')}</div></fieldset>`).join('')}
      <div class="page-actions"><button type="submit" class="btn btn-primary">Take your seat</button></div>
    </form>`;
    const rulesCard = rules ? `<section class="wrap mk-rules-card">
      <div><p class="eyebrow">Your rules</p><p class="mk-rule"><strong>${ruleOf('risk', rules.risk).label}</strong> risk on any one decision. Your edge: <strong>${ruleOf('edge', rules.edge).label.toLowerCase()}</strong>.</p></div>
      <div class="mk-rule-acts"><button class="btn btn-primary" data-act="trade">${n ? `Continue · Challenge ${n + 1}` : 'Take your seat'}</button>${n ? '' : `<button class="btn btn-ghost" data-act="rules-edit">Change my rules</button>`}</div>
    </section>` : '';
    return `${mkHero(`<p class="eyebrow eyebrow-on-dark">Inspired by Jack Schwager's Market Wizards</p>
        <h1 class="mk-title">The Trader's Mind</h1>
        <p class="mk-sub">Lessons from the people who learned to survive the market.</p>
        ${rules ? `<div class="hero-actions"><button class="btn btn-primary" data-act="trade">${n ? `Continue · Challenge ${n + 1}` : 'Take your seat'}</button></div>` : ''}`)}
      <section class="wrap mk-intro">
        <p class="hook-line">You don't need to know anything about markets.</p>
        <p class="hook-sub">This isn't a game about trading. It's about how exceptional performers think when nobody controls the outcome: how they size a risk, admit they're wrong, wait, adapt, and stay in the game. Five situations at one desk, with one account. The market won't care what you meant.</p>
        <p class="small">Every company, person and price in this section is fictional.</p>
      </section>
      ${rulesCard}
      <section class="wrap mk-caps">
        <div class="section-head"><p class="eyebrow">${n ? 'Your capital so far' : 'You start with five kinds of capital'}</p><h2>Money is only one of them.</h2>
          <p class="lede">You can win financially and lose your reputation, or protect your money and run out of time. Nadia's limits tighten as you lose: half size at −10%, small risk only at −15%, and at −20% the desk pulls your capital. That ends the section.</p></div>
        <div class="hud hud-lg">${hud(C.cap)}</div>
        <ul class="cap-notes">${MK.capitals.map(c => `<li><strong>${c.name}</strong> <span>${c.kind}.</span> ${c.note}</li>`).join('')}</ul>
      </section>
      <section class="wrap mk-list">
        <div class="section-head"><p class="eyebrow">Five challenges, seven decisions</p><h2>Each one asks a single question about you.</h2></div>
        <ol class="mkcs">${list}</ol>
      </section>
      ${rules ? '' : `<section class="wrap">${ruleForm}</section>`}`;
  }

  // The Mirror: the rules you set before the first trade, beside what you did under pressure.
  // Your principles: the rules you wrote this year, and whether you kept them when they were tested.
  function principlesHTML(C) {
    const J = MK.journal.valid(history, MK.journal.stored('thedance:call:v1')).filter(e => e.src === 'desk');
    if (!J.length) return '';
    const rows = J.map(e => {
      const later = C.steps.filter((x, i) => i > e.at);
      const tested = later.filter(x => x.sc.options.some(o => (val(o.defies, x.opt._c) || []).includes(e.rule)));
      const broke = later.filter(x => (val(x.opt.defies, x.opt._c) || []).includes(e.rule));
      return `<li class="pr-row ${broke.length ? 'is-broke' : ''}"><p class="pr-rule">“${MK.journalRules[e.rule].line}”</p>
        <p class="pr-meta">Written after ${MK.journal.from(e)} · ${!tested.length ? 'not tested again this year' : broke.length ? `broken ${broke.length === 1 ? 'once' : `${NUM[broke.length]} times`}, in ${broke.map(x => x.sc.title).join(' and ')}` : `kept ${tested.length === 1 ? 'the one time' : `all ${NUM[tested.length]} times`} it was tested`}</p></li>`;
    }).join('');
    return `<section class="wrap principles-own"><div class="section-head"><p class="eyebrow">Your principles</p><h2>The rules you wrote down, and what you did with them.</h2></div><ol class="pr-list">${rows}</ol>
      <p class="mind-p">Pain plus reflection is how a mistake becomes a principle. Keeping it the next time is how a principle becomes yours.</p></section>`;
  }

  function mirror(C, edgeSummary) {
    const rr = ruleOf('risk', rules.risk), ed = ruleOf('edge', rules.edge);
    const kept = C.steps.filter(x => !x.broke).length, n = C.steps.length;
    const verdict = rules.risk === 'open' ? `You never set a limit, so you never broke one. The right-hand column is the limit you actually played by.`
      : kept === n ? `Yes. Every decision fit the rules you set before the first trade.`
        : `Not quite. You kept your own rule in ${NUM[kept] || kept} of ${NUM[n] || n} decisions. Look at when you broke it: it's rarely the calm moments.`;
    const said = [rules.risk === 'open' ? `No fixed limit. Size by conviction.` : `Risk no more than ${rr.label} of the account on any one idea.`, `My edge is ${ed.label.toLowerCase()}. ${ed.d}`, `Stay in the game.`];
    const did = C.steps.map(x => `<li class="mirror-row ${x.broke ? 'is-broke' : ''}"><span class="mirror-opp">vs. ${x.sc.opponent || 'yourself'}</span><strong>${x.sc.title}</strong><span>${x.opt.did || fill(x.opt.text)}</span><em>${x.broke ? `Broke your ${rr.label} rule` : rules.risk === 'open' ? MK.exposureLabel[x.opt.exposure] : 'Kept your rule'}</em></li>`).join('');
    return `<section class="block mirror" aria-labelledby="mirror-h">
      <div class="section-head"><p class="eyebrow">The Mirror</p><h2 id="mirror-h">Did you play the game you said you would play?</h2></div>
      <div class="mirror-grid">
        <div class="mirror-col"><p class="mirror-k">What you said · before the first trade</p><ul class="mirror-said">${said.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="mirror-col"><p class="mirror-k">What you did · under pressure</p><ol class="mirror-did">${did}</ol></div>
      </div>
      <p class="mirror-verdict">${verdict}</p>
      ${edgeSummary ? `<p class="mind-p">${edgeSummary}</p>` : ''}
    </section>`;
  }

  function viewMarketReview(C) {
    const out = C.ruinedAt !== null;
    const played = C.steps.length;
    const fin = C.cap.fin;
    const quad = m => { const gd = m.opt.q >= 3, gr = m.oc.tone === 'good'; return gd ? (gr ? 'Earned' : 'Unlucky') : (gr ? 'Got lucky' : 'Lesson'); };
    const capRows = MK.capitals.map(c => {
      const a = c.start, b = C.cap[c.k], d = b - a;
      return `<li class="capr"><span class="capr-k">${c.name}<small>${c.kind}</small></span>
        <span class="capr-bar" aria-hidden="true"><span class="capr-start" style="left:${Math.min(100, a / c.max * 100)}%"></span><span class="capr-fill ${d < 0 ? 'down' : ''}" style="width:${Math.max(0, Math.min(100, b / c.max * 100))}%"></span></span>
        <span class="capr-v">${c.k === 'fin' ? `$${b}k` : b}<small class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d ? (c.k === 'fin' ? money(d) : (d > 0 ? '+' : '−') + Math.abs(d)) : 'no change'}</small></span></li>`;
    }).join('');
    const soft = MK.capitals.filter(c => c.k !== 'fin').map(c => ({ c, d: C.cap[c.k] - c.start })).sort((x, y) => y.d - x.d);
    const capLine = `${fin > 100 ? `You made money` : fin === 100 ? `You protected your money` : out ? (fin === 0 ? `You lost the whole account` : `You lost 20% of the account, and the desk's capital with it`) : `You lost some money`}${soft[0].d > 0 ? ` and built ${soft[0].c.name.toLowerCase()}` : ''}${soft[soft.length - 1].d < 0 ? `, and spent ${soft[soft.length - 1].c.name.toLowerCase()}` : ''}.`;

    const bk = C.steps.find(x => x.sc.id === 'the-book'), tn = C.steps.find(x => x.sc.id === 'the-turn');
    const edgeSummary = !bk ? '' : ((MK.books[bk.opt.flags && bk.opt.flags.book] || {}).summary || '') + (tn ? ` When the turn came in January, you ${tn.opt.did.charAt(0).toLowerCase() + tn.opt.did.slice(1)}` : '');

    const review = C.steps.map((x, i) => {
      return `<li class="dr">
        <span class="dr-n">${i + 1}</span>
        <div class="dr-main"><h4>${x.sc.title}</h4>
          <p class="dr-row"><span class="dr-k">You knew</span>${x.h.clues.length} of ${x.sc.clues.length} details in the room</p>
          <p class="dr-row"><span class="dr-k">You chose</span><span class="mo-key">${x.opt.key}</span> ${fill(x.opt.text)}${x.broke ? ' <em class="dr-broke">Broke your rule</em>' : ''}</p>
          <p class="dr-row"><span class="dr-k">What happened</span>${toneLabel[x.oc.tone]} · ${x.oc.ruin ? 'the account was wiped out' : `account ${money(x.oc.fin)}`}</p></div>
        <span class="dr-q q-${quad(x).toLowerCase().replace(' ', '-')}"><span class="g${x.opt.q}">${grades[x.opt.q].glyph}</span>${quad(x)}</span>
      </li>`;
    }).join('') + (out ? LIST.slice(played).map((sc, j) => `<li class="dr is-unplayed"><span class="dr-n">${played + j + 1}</span><div class="dr-main"><h4>${sc.title}</h4><p class="dr-row">Never played. You were out of the game.</p></div></li>`).join('') : '');


    // The R ledger: what each decision planned to risk, what it made or lost, in units of that plan.
    const R = C.steps.map(x => {
      const plan = val(x.opt.risk, {}) || MK.plannedRisk[x.opt.exposure] || 0;
      const fin = x.oc.ruin ? -x.before.fin : x.oc.fin;
      return { x, plan, fin, r: plan ? fin / plan : null };
    });
    const risked = R.filter(z => z.plan);
    const fmtR = r => `${r >= 0 ? '+' : '−'}${Math.abs(r).toFixed(1)}R`;
    const expect = risked.length ? risked.reduce((a, z) => a + z.r, 0) / risked.length : null;
    const beyond = risked.reduce((a, z) => a + (z.fin < -z.plan ? (-z.fin - z.plan) / z.plan : 0), 0);
    const brokeLoss = R.reduce((a, z) => a + (z.x.broke && z.fin < 0 ? -z.fin : 0), 0);
    const ledger = `<section class="block"><h2 class="block-h">The R ledger <span class="block-hint">what a desk reviews</span></h2>
        <p class="small">R is what a decision planned to risk. A trade that loses 1R lost exactly what you planned. One that loses 3R went wrong in a way your plan didn't cover.</p>
        <table class="rl"><thead><tr><th scope="col">Decision</th><th scope="col">Planned risk</th><th scope="col">Result</th><th scope="col">In R</th></tr></thead><tbody>
        ${R.map(z => `<tr class="${z.x.broke ? 'is-broke' : ''}"><th scope="row">${z.x.sc.title}</th><td>${z.plan ? `$${z.plan}k` : 'None'}</td><td>${money(Math.round(z.fin * 10) / 10)}</td><td>${z.r === null ? '—' : fmtR(z.r)}</td></tr>`).join('')}
        </tbody></table>
        <p class="rl-sum">${expect === null ? `You never put new money at risk.` : `Expectancy: <strong>${fmtR(expect)}</strong> per decision that risked anything.`} Lost beyond plan, to gaps and thin books: <strong>${beyond.toFixed(1)}R</strong>. Lost on decisions that broke your rule: <strong>${brokeLoss ? `$${Math.round(brokeLoss * 10) / 10}k` : 'nothing'}</strong>.</p>
      </section>`;

    const said = C.steps.filter(x => x.opt.verdict).map(x => `<li class="said"><span class="said-face">${portrait(x.opt.verdict.who, x.opt.q >= 3 ? 'smile' : x.opt.q === 2 ? 'neutral' : 'skeptical')}</span>
        <blockquote><p>“${x.opt.verdict.line}”</p><footer><strong>${PP.people[x.opt.verdict.who].name}</strong> · ${x.sc.title}</footer></blockquote></li>`).join('');

    return `${mkHero(`<p class="eyebrow eyebrow-on-dark">${out ? `Challenge ${C.ruinedAt + 1} · The desk pulled your capital` : `The Trader's Mind · Part I complete`}</p>
        <h1 class="mk-title">${out ? 'Out of the game.' : 'Still standing.'}</h1>
        <p class="mk-sub">${out ? `Your account fell 20% below where you started, and the desk took your capital back. Nothing teaches survival like losing the ability to continue.` : `The objective was never to win every round. It was to become the kind of player who could keep playing.`}</p>`)}
      <section class="wrap page mk-review">
        <div class="mk-final">
          <div class="rating-card"><span class="rating-label">Account</span><span class="rating-num">$${fin}k</span><span class="rating-sub">Started at $100k</span></div>
          <p class="lede">${capLine}</p>
        </div>
        <section class="block card"><h2 class="block-h">Five kinds of capital <span class="block-hint">the tick marks where you started</span></h2><ul class="caprs">${capRows}</ul></section>
        ${rules ? mirror(C, edgeSummary) : ''}
        ${principlesHTML(C)}
        <section class="block"><h2 class="block-h">Decision review</h2><p class="small">What you knew, what you chose, what happened, and whether the reasoning was sound. Annie Duke's distinction: a good decision can lose, and a bad one can win.</p><ol class="drs">${review}</ol></section>
        ${ledger}
        ${said ? `<section class="block"><h2 class="block-h">What the desk saw</h2><svg width="0" height="0" class="defs-only" aria-hidden="true">${PP.art.DEFS}</svg><ul class="said-list">${said}</ul></section>` : ''}
        <div class="carry"><p class="eyebrow">What Ed Seykota would leave you with</p><p class="carry-q">You don't have to predict the future. You have to develop the judgment, discipline and resilience to survive it.</p></div>
        <div class="page-actions">
          <button class="${confirmReset ? 'btn btn-ghost is-danger' : 'btn btn-primary'}" data-act="market-reset">${confirmReset ? 'Tap again to start over' : 'Play The Trader\'s Mind again'}</button>
          <button class="btn btn-ghost" data-nav="home">Back to The Dance</button>
        </div>
      </section>`;
  }

  // ───────────────────────── Render + events

  function render() {
    ui.view = routeOf(ui.view);
    useTrack(trackFor(ui.view));
    const settled = ui.phase !== 'result' && ui.phase !== 'react';
    if (ui.view === 'play' && history.length >= LIST.length && settled) ui.view = 'profile';
    if (ui.view === 'trade' && settled && (!rules || marketOver())) ui.view = 'market';
    if (ui.view === 'phone' && !PP.callGame.ready) ui.view = 'call';
    const views = { home: viewHome, bench: viewBench, episodes: viewEpisodes, play: viewPlay, trade: viewPlay, profile: viewProfile, market: viewMarket, call: viewCall, phone: PP.callGame.playHTML };
    try {
      app.innerHTML = views[ui.view]();
      if (ui.view === 'phone') PP.callGame.mount();
    } catch (err) {
      console.error(err);
      app.innerHTML = `<section class="wrap broken"><h1>Something in your saved progress couldn't be read.</h1>
        <p>This can happen after an update. Resetting clears the progress saved in this browser and starts you fresh.</p>
        <button type="button" class="btn btn-primary" data-act="repair">Reset saved progress</button></section>`;
      return;
    }
    document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === (NAV_OF[ui.view] || ui.view) ? 'page' : 'false'));
    // The home page opens on a dark image, so its nav bar and the phone's browser bar go dark to match.
    document.body.classList.toggle('on-home', ui.view === 'home');
    const light = document.querySelector('meta[name="theme-color"][media*="light"]');
    if (light) light.content = ui.view === 'home' ? '#0e1014' : '#f6f1e7';
    const playing = ui.view === 'play' || ui.view === 'trade';
    const sc = playing ? LIST[currentIndex()] : null;
    document.title = (sc ? `${sc.title} · ` : ui.view === 'phone' ? `${PP.callGame.title} · The Call · ` : ui.view === 'call' ? 'The Call · ' : ui.view === 'bench' ? 'The Bench · ' : ui.view === 'profile' ? 'Profile · ' : ui.view === 'market' ? 'The Trader\'s Mind · ' : '') + 'The Dance';

    if (playing) {
      if (ui.phase === 'result') { mountStage(LIST[history.length - 1], history.length - 1); settleResult(); renderPanel(); }
      else playIntro();
    }
  }

  function settleResult() {
    const idx = history.length - 1, sc = LIST[idx], h = history[idx];
    stage.settle([...sc.stage.intro, ...staged(sc, derive(history).moves[idx].opt).outcomes[h.outcome].beats]);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-act="repair"]')) {
      try { [TRACKS.main.key, TRACKS.market.key, RULES_KEY, FIRSTS_KEY, 'thedance:call:v1', 'thedance:call:rules', 'thedance:journal:v1'].forEach(k => localStorage.removeItem(k)); } catch (err) { /* storage unavailable */ }
      location.reload(); return;
    }
    const nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); go(nav.dataset.nav === 'play' ? 'episodes' : nav.dataset.nav); return; }

    const clue = e.target.closest('[data-clue]');
    if (clue) {
      const i = Number(clue.dataset.clue), sc = LIST[history.length];
      if (!draft.clues.includes(i) && (!sc || (readsLeft(sc) > 0 && readsOpen(sc)))) draft.clues.push(i);
      renderPanel(); return;
    }

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
    if (a !== 'reset' && a !== 'market-reset') confirmReset = false;
    if (a !== 'scene' && a !== 'pick') confirmScene = -1;
    switch (a) {
      case 'play': ui.phase = 'intro'; go('play'); break;
      case 'trade': ui.phase = 'intro'; go('trade'); break;
      case 'market': go('market'); break;
      case 'call': go('call'); break;
      case 'phone': PP.callGame.unlockAudio(); go('phone'); break;
      case 'mk-part': go(act.dataset.v === 'call' ? 'call' : 'market', true); break;
      case 'rules-edit': rules = null; saveRules(); render(); break;
      case 'market-reset':
        if (!confirmReset) { confirmReset = true; render(); app.querySelector('[data-act="market-reset"]').focus(); return; }
        confirmReset = false; history = []; save(); rules = null; saveRules(); MK.journal.clear('desk'); draft = fresh(); go('market');
        break;
      case 'bench': go('bench'); break;
      case 'episodes': go('episodes'); break;
      case 'pick': confirmScene = Number(act.dataset.i); go('episodes'); app.querySelector(`[data-act="scene"][data-i="${confirmScene}"]`)?.scrollIntoView({ block: 'center' }); break;
      case 'profile': go('profile'); break;
      case 'freeze': stage && stage.freeze(); break;
      case 'resume': stage && stage.resume(); break;
      case 'to-decision': toDecision(); break;
      case 'replay-intro': draft.selected = null; playIntro(); break;
      case 'next': draft = fresh(); ui.phase = 'intro'; render(); window.scrollTo({ top: 0 }); break;
      case 'stake': draft.stake = act.dataset.v; draft.step = 'read'; renderPanel(); break;
      case 'press': {
        const sc = LIST[history.length];
        draft.step = 'choose'; renderPanel();
        const p = sc.press && val(sc.press, ctxNow(sc));
        if (p && stage) stage.run([{ who: p.who, say: p.say, mood: p.mood }]);
        break;
      }
      case 'push': {
        const sc = LIST[history.length], c = ctxNow(sc);
        const p = val(optsNow(sc).find(o => o.key === draft.selected).push, c);
        const v = act.dataset.v, key = p[v].key || draft.selected;
        commitMove(sc, key, { push: v, said: p[v].line });
        break;
      }
      case 'rule': {
        const idx = history.length - 1;
        if (isMarket() && MK.journalRules[act.dataset.r]) MK.journal.add({ rule: act.dataset.r, id: LIST[idx].id, at: idx, src: 'desk' });
        renderPanel(); break;
      }
      case 'takeback': {
        const idx = history.length - 1;
        if (isMarket()) MK.journal.trim(idx);
        if (!isMarket() && firsts[LIST[idx].id] == null) { firsts[LIST[idx].id] = derive(history).moves[idx].opt.q; saveFirsts(); }
        const last = history.pop(); save();
        if (isMarket()) {
          draft = fresh(last.clues.slice(), last.type || null);
          if (LIST[history.length].play) { draft.stake = last.stake || null; draft.step = 'choose'; }
        } else draft = fresh(); // A fresh deal: the other person is drawn again, and the details are unread.
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
        if (i < history.length) { history = history.slice(0, i); save(); if (isMarket()) MK.journal.trim(i); }
        draft = fresh(); ui.phase = 'intro'; go(isMarket() ? 'trade' : 'play');
        break;
      }
      case 'reset':
        if (!confirmReset) { confirmReset = true; render(); app.querySelector('[data-act="reset"]').focus(); return; }
        confirmReset = false; history = []; draft = fresh(); save(); firsts = {}; saveFirsts(); ui.phase = 'intro'; go('play');
        break;
    }
  });

  document.addEventListener('keydown', e => {
    if ((ui.view !== 'play' && ui.view !== 'trade') || !stage) return;
    // Keys on links, form controls and buttons keep their normal meaning.
    if (e.target.closest('a, input, textarea, select, button, label, [role="button"]')) return;
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
    if (e.target.id === 'rules-form') {
      e.preventDefault();
      const f = new FormData(e.target);
      rules = { risk: f.get('risk'), edge: f.get('edge') };
      saveRules(); ui.phase = 'intro'; go('trade');
      return;
    }
    if (e.target.id !== 'decide-form') return;
    e.preventDefault();
    if (!draft.selected) return;
    if (stage && stage.paused) stage.resume();
    const sc = LIST[history.length];
    const opt = optsNow(sc).find(o => o.key === draft.selected);
    if (trustLocked(opt)) return;
    const p = sc.play && opt.push && val(opt.push, ctxNow(sc));
    if (p) {
      draft.step = 'push'; renderPanel();
      if (stage) stage.run([{ you: opt.line || staged(sc, opt).line }, { who: p.who, say: p.say, mood: p.mood }]);
      return;
    }
    commitMove(sc, opt.key);
  });

  // A move becomes final: record it, then let the room react.
  function commitMove(sc, key, extra = {}) {
    const opt = optsNow(sc).find(o => o.key === key);
    const replay = !isMarket() && firsts[sc.id] != null;
    history.push({ id: sc.id, key, outcome: pickOutcome(opt), clues: draft.clues.slice(), type: draft.type, ...(draft.stake ? { stake: draft.stake } : {}), ...(replay ? { replay } : {}), ...extra });
    save();
    if (!isMarket() && !replay) { firsts[sc.id] = opt.q; saveFirsts(); }
    draft = fresh();
    document.querySelector('.play-head').innerHTML = document.querySelector('.play-head').innerHTML.replace(/<ol class="file-strip"[\s\S]*?<\/ol>/, strip(history.length - 1, derive(history)));
    document.getElementById('stage-mount').scrollIntoView({ behavior: 'smooth', block: 'start' });
    playReaction();
  }

  document.addEventListener('close', e => {
    if (e.target.id === 'thinker-dialog' && e.target.returnTo) e.target.returnTo.focus();
  }, true);

  window.addEventListener('resize', () => { if (stage && stage.paused) stage.placePins(); });
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (['bench', 'profile', 'episodes', 'play', 'market', 'trade', 'call', 'phone'].includes(h) && h !== ui.view) { ui.phase = 'intro'; go(h); }
  });

  // The Debrief call reads the Desk's decisions, whichever track is open.
  const deskSteps = () => {
    try {
      const h = MK.journal.stored(TRACKS.market.key), bad = h.findIndex((x, i) => !x || !TRACKS.market.list[i] || TRACKS.market.list[i].id !== x.id);
      return capitals(bad < 0 ? h : h.slice(0, bad)).steps
        .map(x => ({ id: x.sc.id, title: x.sc.title, did: x.opt.did || x.opt.text, q: x.opt.q, fin: x.oc.ruin ? -x.before.fin : x.oc.fin, defies: val(x.opt.defies, x.opt._c) || [] }));
    } catch (e) { return []; }
  };
  PP.ui = { hud, marketRules: () => rules, deskSteps };
  PP.nav = go;

  history = playable(history);
  const initial = location.hash.replace('#', '');
  if (['bench', 'profile', 'episodes', 'play', 'market', 'trade', 'call', 'phone'].includes(initial)) ui.view = initial;
  render();
})();
