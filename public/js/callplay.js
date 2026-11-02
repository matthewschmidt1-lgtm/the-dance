// The Call: engine and screens. The phone sits in front of the office; beside it, paper that
// writes the conversation down as it's spoken. Key phrases get drawn over in ink, and your own
// thoughts appear in pencil in the margin. Progress lives in `hist`, one entry per finished call,
// each carrying the capital it spent or earned, so the campaign can always be replayed from it.
window.PP = window.PP || {};

PP.callGame = (function () {
  const C = PP.call, MK = PP.market;
  const KEY = 'thedance:call:v1', RULES_KEY = 'thedance:call:rules';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  let hist = (store.get(KEY) || []).filter((h, i) => C.calls[i] && C.calls[i].id === h.id);
  let rules = store.get(RULES_KEY);
  if (!rules || !rules.risk || !Array.isArray(rules.pledges)) rules = null;
  const save = () => store.set(KEY, hist);
  let confirmReset = false;

  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const val = (v, s) => typeof v === 'function' ? v(s) : v;
  const ruleOf = v => MK.rules.risk.options.find(o => o.v === v);
  const pledge = v => C.pledges.find(p => p.v === v);
  const money = k => { const a = Math.abs(Math.round(k * 10) / 10); return k === 0 ? `$0` : `${k > 0 ? '+' : '−'}$${a}k`; };
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five'];

  // ───────────────────────── Capital

  function capitals(h = hist) {
    const cap = Object.fromEntries(MK.capitals.map(c => [c.k, c.start]));
    let ruinedAt = null;
    const steps = h.map((e, i) => {
      const before = { ...cap };
      Object.entries(e.delta).forEach(([k, v]) => { cap[k] = (cap[k] || 0) + v; });
      cap.fin = Math.round(cap.fin * 10) / 10;
      MK.capitals.forEach(c => { if (c.k !== 'fin') cap[c.k] = Math.max(0, Math.min(c.max, cap[c.k])); });
      if (ruinedAt === null && (cap.fin <= MK.ruin || cap.time <= 0)) ruinedAt = i;
      return { e, call: C.calls[i], before, after: { ...cap } };
    });
    return { cap, steps, ruinedAt };
  }
  const over = () => { const K = capitals(); return hist.length >= C.calls.length || K.ruinedAt !== null; };
  const memory = (h = hist) => Object.fromEntries(h.map(e => [e.id, { key: e.key, flags: e.flags, truth: e.truth, picked: e.picked }]));
  const readsFor = psy => psy >= 7 ? 3 : psy >= 4 ? 2 : 1;
  const ruleMax = () => rules ? ruleOf(rules.risk).max : 4;
  const breaksRisk = exposure => MK.exposure[exposure] > ruleMax();
  const lockReason = (cap, o) => MK.lockReason(cap, o.exposure, o);

  function hud(cap, prev) { return PP.ui.hud(cap, prev); }

  // ───────────────────────── Sound: the ring, the line, the click. Off when voices are off.

  let actx = null, hiss = null, ringTimer = null;
  function audio() {
    if (!PP.voice.on) return null;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freqs, t0, dur, gain) {
    const a = audio(); if (!a) return;
    const g = a.createGain(); g.connect(a.destination);
    g.gain.setValueAtTime(0, a.currentTime + t0);
    g.gain.linearRampToValueAtTime(gain, a.currentTime + t0 + 0.02);
    g.gain.setValueAtTime(gain, a.currentTime + t0 + dur - 0.03);
    g.gain.linearRampToValueAtTime(0, a.currentTime + t0 + dur);
    freqs.forEach(fq => { const o = a.createOscillator(); o.frequency.value = fq; o.connect(g); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05); });
  }
  // A British double ring: brrr-brrr, pause.
  function ring() {
    stopRing();
    const once = () => { tone([400, 450], 0, 0.4, 0.05); tone([400, 450], 0.6, 0.4, 0.05); };
    once(); ringTimer = setInterval(once, 3000);
  }
  function stopRing() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } }
  function click() { tone([1200], 0, 0.03, 0.04); }
  function line(on) {
    const a = audio();
    if (!on || !a) { if (hiss) { try { hiss.stop(); } catch (e) { /* stopped */ } hiss = null; } return; }
    if (hiss) return;
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
    const g = a.createGain(); g.gain.value = 0.006;
    src.connect(bp); bp.connect(g); g.connect(a.destination); src.start(); hiss = src;
  }
  function hangupTone() { tone([425], 0.1, 0.25, 0.04); tone([425], 0.5, 0.25, 0.04); tone([425], 0.9, 0.25, 0.04); }

  // ───────────────────────── A call in progress

  let s = null;          // the call state
  let run = 0;           // bumps on teardown so old timers and awaits stop
  let skipNow = null;    // resolves the current wait early (tap the paper, or Space)
  let marks = [];        // ink marks to redraw on resize
  let started = 0;       // call start time, for the phone's timer
  let timerId = null;

  const draw = arr => { let r = Math.random(); for (const t of arr) { r -= t.p; if (r <= 0) return t.id; } return arr[arr.length - 1].id; };

  function fresh(i) {
    const call = C.calls[i], K = capitals();
    return { i, call, truth: draw(call.truths), roll: Math.random(), flags: {}, mem: memory(), cap: { ...K.cap }, rules, picked: null, sorted: null, sortedAway: 0, asked: 0, used: 0, declined: false, hungUp: false, phase: 'ring' };
  }
  const set = v => { if (!v) return; (Array.isArray(v) ? v : [v]).forEach(k => { s.flags[k] = true; }); };

  function wait(ms) {
    const my = run;
    return new Promise(res => {
      const t = setTimeout(() => { skipNow = null; res(my === run); }, ms);
      skipNow = () => { clearTimeout(t); skipNow = null; res(my === run); };
    });
  }

  const $ = sel => document.querySelector(sel);

  // Words written one at a time; [[key phrases]] wrapped for ink; (stage directions) set apart.
  function lineHTML(t) {
    let k = 0;
    return t.split(/(\[\[[^\]]+\]\]|\([^)]*\))/).filter(Boolean).map(part => {
      const key = part.startsWith('[[');
      const dir = !key && /^\(.*\)$/.test(part);
      const words = (key ? part.slice(2, -2) : part).split(/(\s+)/).map(w => /^\s+$/.test(w) || !w ? w : `<span class="w" style="--i:${k++}">${esc(w)}</span>`).join('');
      return key ? `<span class="cl-key">${words}</span>` : dir ? `<span class="cl-dir">${words}</span>` : words;
    }).join('');
  }
  const plain = t => t.replace(/\[\[|\]\]/g, '');

  async function write(L) {
    const log = $('.cl-log'); if (!log) return false;
    const who = L.who || 'c';
    const p = document.createElement('p');
    p.className = `cl-l cl-${who}`;
    const text = val(L.t, s);
    p.innerHTML = `${L.tone ? `<span class="cl-tone">${esc(L.tone)}</span>` : ''}${who === 'y' ? '<span class="cl-you">You</span>' : ''}${lineHTML(text)}`;
    log.appendChild(p);
    const words = p.querySelectorAll('.w').length;
    const pace = PP.voice.pace || 1;
    const per = (who === 'n' ? 150 : 230) / pace;
    p.style.setProperty('--per', `${per}ms`);
    requestAnimationFrame(() => p.classList.add('is-on'));
    scrollLog();
    setTalking(who === 'c');
    let spoke = null;
    if (who === 'c') spoke = new Promise(res => { if (!PP.voice.speak(C.callers[s.call.caller].voice, plain(text), () => res())) res(); });
    const okA = await wait(words * per + 260);
    if (!okA) return false;
    p.classList.add('is-done');
    if (spoke) await Promise.race([spoke, wait(9000)]);
    setTalking(false);
    if (L.set) set(L.set);
    // Ink: underline or circle each key phrase, then the margin thought and its sketch.
    p.querySelectorAll('.cl-key').forEach((el, j) => addMark({ el, kind: L.sketch === 'box' && j === 0 ? 'box' : el.textContent.length <= 16 ? 'circle' : 'under' }));
    const note = val(L.note, s);
    if (note) {
      const n = document.createElement('span');
      n.className = 'cl-note';
      n.textContent = note;
      p.appendChild(n);
      p.classList.add('has-note');
      requestAnimationFrame(() => n.classList.add('is-on'));
      // Arrows only make sense when the thought sits in the margin; on a phone it sits under the line.
      const inMargin = getComputedStyle(n).position === 'absolute';
      if (L.sketch && L.sketch !== 'box' && (L.sketch !== 'arrow' || inMargin)) addMark({ el: n, kind: L.sketch, to: p.querySelector('.cl-key') });
      scrollLog();
      if (!await wait(900)) return false;
    } else if (L.sketch && L.sketch !== 'box') addMark({ el: p.querySelector('.cl-key') || p, kind: L.sketch });
    return wait(L.pause || 380);
  }

  async function writeAll(lines) {
    for (const L of lines || []) { if (!await write(L)) return false; }
    return true;
  }

  function scrollLog() { const box = $('.cl-paper-scroll'); if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }); }

  // ───────────────────────── Ink

  const jit = (n = 1.6) => (Math.random() - 0.5) * n;
  function addMark(mk) { marks.push(mk); paint(mk, true); }
  function paint(mk, anim) {
    const svg = $('.cl-ink'), log = $('.cl-log');
    if (!svg || !log || !mk.el.isConnected) return;
    const base = log.getBoundingClientRect();
    svg.setAttribute('width', log.scrollWidth); svg.setAttribute('height', log.scrollHeight);
    svg.style.height = log.scrollHeight + 'px';
    const rects = [...mk.el.getClientRects()].map(r => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }));
    if (!rects.length) return;
    let d = '';
    const r0 = rects[0];
    // A phrase that wraps can't be circled; underline each line of it instead.
    if ((mk.kind === 'circle' || mk.kind === 'box') && rects.length > 1) mk.kind = 'under';
    if (mk.kind === 'under') d = rects.map(r => `M${r.x - 2},${r.y + r.h + 1 + jit()} Q${r.x + r.w / 2},${r.y + r.h + 4 + jit(3)} ${r.x + r.w + 3},${r.y + r.h + jit()}`).join(' ');
    else if (mk.kind === 'circle') { const cx = r0.x + r0.w / 2, cy = r0.y + r0.h / 2, rx = r0.w / 2 + 9, ry = r0.h / 2 + 4; d = `M${cx - rx},${cy + jit()} C${cx - rx},${cy - ry * 1.3} ${cx + rx},${cy - ry * 1.3} ${cx + rx + 2},${cy} C${cx + rx},${cy + ry * 1.35} ${cx - rx * 0.9},${cy + ry * 1.3} ${cx - rx + 6},${cy - ry * 0.5}`; }
    else if (mk.kind === 'box') { const x0 = r0.x - 5, y0 = r0.y - 2, x1 = r0.x + r0.w + 5, y1 = r0.y + r0.h + 3; d = `M${x0 + jit()},${y0} L${x1},${y0 + jit()} L${x1 + jit()},${y1} L${x0},${y1 + jit()} Z`; }
    else if (mk.kind === 'arrow' && mk.to && mk.to.isConnected && getComputedStyle(mk.el).position === 'absolute') {
      const t = mk.to.getBoundingClientRect(), tx = t.right - base.left + 4, ty = t.top - base.top + t.height / 2;
      const sx = r0.x - 6, sy = r0.y + r0.h / 2;
      d = `M${sx},${sy} Q${(sx + tx) / 2},${Math.min(sy, ty) - 22} ${tx},${ty} M${tx + 7},${ty - 7} L${tx},${ty} L${tx + 9},${ty + 3}`;
    } else if (mk.kind === 'q') { const x = r0.x - 18, y = r0.y + 2; d = `M${x},${y + 5} C${x},${y - 3} ${x + 11},${y - 3} ${x + 10},${y + 5} C${x + 9},${y + 10} ${x + 4},${y + 9} ${x + 5},${y + 15} M${x + 5},${y + 20} l0.5,1.5`; }
    else if (mk.kind === 'up' || mk.kind === 'down') { const last = rects[rects.length - 1], x = last.x + last.w + 10, y = last.y + last.h / 2, sg = mk.kind === 'up' ? -1 : 1; d = `M${x},${y - sg * 7} l7,${sg * 3} l6,${-sg * 4} l7,${sg * 8} M${x + 15},${y + sg * 7} l5,0 l0,${-sg * 5}`; }
    if (!d) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', `ink ink-${mk.kind}`);
    svg.appendChild(path);
    mk.path = path;
    if (anim) {
      const len = path.getTotalLength ? path.getTotalLength() : 200;
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }));
    }
  }
  function repaint() { const svg = $('.cl-ink'); if (!svg) return; svg.innerHTML = ''; marks.forEach(mk => paint(mk, false)); }

  // ───────────────────────── The phone

  function setTalking(on) { const ph = $('.cl-phone'); if (ph) ph.classList.toggle('is-talking', on); }
  function phoneState(state) {
    const ph = $('.cl-phone'); if (!ph) return;
    ph.dataset.state = state;
    const st = ph.querySelector('.ph-status');
    if (st) st.textContent = state === 'ring' ? 'Incoming call' : state === 'live' ? '00:00' : state === 'ended' ? `Call ended · ${clock()}` : 'Voicemail';
    if (state === 'live') {
      started = Date.now();
      clearInterval(timerId);
      timerId = setInterval(() => { const el = $('.ph-status'); if (el && $('.cl-phone')?.dataset.state === 'live') el.textContent = clock(); }, 1000);
    } else clearInterval(timerId);
  }
  const clock = () => { const t = Math.floor((Date.now() - started) / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

  function chartSketch(kind) {
    const pts = { down: '4,8 22,10 34,7 48,18 62,16 78,30 96,34', up: '4,32 20,28 34,30 50,20 64,22 80,12 96,6', flat: '4,20 20,18 34,22 50,19 64,21 80,18 96,20', turn: '4,30 18,22 32,24 46,12 60,16 74,24 88,22 96,30' }[kind] || '';
    return `<svg class="cl-chart" viewBox="0 0 100 40" aria-hidden="true"><polyline points="${pts}"/></svg>`;
  }

  // ───────────────────────── Views

  function playHTML() {
    const i = hist.length, call = C.calls[i];
    if (!call || over() || !rules) return '';
    s = fresh(i);
    const who = C.callers[call.caller];
    const K = capitals();
    const setup = val(call.setup, s);
    return `<section class="wrap play-head cl-head">
        <p class="play-meta">The Trader's Mind · The Call · Call ${i + 1} of ${C.calls.length} · The opponent: ${call.opponent}</p>
        <div class="hud" id="cl-hud">${hud(K.cap)}</div>
      </section>
      <section class="cl" aria-label="${esc(call.title)}">
        <div class="cl-scene">
          <div class="cl-art" aria-hidden="true"><img src="/img/env/${call.env}-bg.webp?v=${PP.assetV}" alt=""><img src="/img/env/${call.env}-fg.webp?v=${PP.assetV}" alt=""></div>
          <div class="cl-phone" data-state="ring">
            <p class="ph-time">${call.day} · ${call.clock}</p>
            <div class="ph-face"><span class="ph-ring"></span><span class="ph-ring r2"></span><span class="ph-av">${who.initials}</span></div>
            <p class="ph-name">${who.name}</p>
            <p class="ph-role">${who.role}</p>
            <p class="ph-intent">Unknown intentions.</p>
            <p class="ph-status" aria-live="polite">Incoming call</p>
            <div class="ph-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="ph-btns">
              <button type="button" class="ph-btn ph-no" data-cact="decline" aria-label="Decline the call"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14c5-4 13-4 18 0l-2 3-4-1v-3c-2-.6-4-.6-6 0v3l-4 1z"/></svg></button>
              <button type="button" class="ph-btn ph-yes" data-cact="answer" aria-label="Answer the call"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3l3 4-2 2c1 3 4 6 7 7l2-2 4 3-2 4C10 21 3 14 3 5z"/></svg></button>
            </div>
            <button type="button" class="ph-hang" data-cact="hangup">End call</button>
          </div>
          <div class="cl-paper" data-cact="skip">
            <div class="cl-paper-scroll">
              <header class="cl-sheet-head">
                <p class="cl-date">${call.day} · ${call.clock}</p>
                <div class="cl-setup">${chartSketch(call.chart)}<ul>${setup.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
              </header>
              <div class="cl-log"><svg class="cl-ink" aria-hidden="true"></svg></div>
            </div>
            <p class="cl-tap" aria-hidden="true">Tap the paper to write faster</p>
            <div class="cl-act" id="cl-act" aria-live="polite">
              <p class="cl-prompt">${who.name} is calling.</p>
              <div class="cl-row"><button type="button" class="btn btn-primary cl-answer" data-cact="answer">Answer the phone</button><button type="button" class="btn btn-ghost" data-cact="decline">Let it ring</button></div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function mount() {
    if (!s) return;
    marks = [];
    phoneState('ring');
    ring();
  }

  function stop() {
    run++; stopRing(); line(false); clearInterval(timerId); PP.voice.stop();
    if (skipNow) skipNow();
  }

  // New choices push the paper up, so keep the latest line in view.
  const act = html => { const a = $('#cl-act'); if (a) { a.innerHTML = html; requestAnimationFrame(scrollLog); } };
  const hangLink = `<button type="button" class="cl-hang" data-cact="hangup">Hang up</button>`;

  async function answer() {
    stopRing(); click(); line(true);
    s.phase = 'talk';
    phoneState('live');
    act(`<p class="cl-prompt cl-listening">Listening…</p>`);
    $('.cl-scene')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await node('open');
  }
  async function decline() {
    stopRing();
    s.declined = true; s.phase = 'talk';
    phoneState('voicemail');
    act(`<p class="cl-prompt cl-listening">Voicemail…</p>`);
    if (!await writeAll(s.call.voicemail)) return;
    decide();
  }
  async function hangup() {
    if (s.phase !== 'talk' && s.phase !== 'moment') return;
    PP.voice.stop();
    const my = ++run;
    s.hungUp = true; s.phase = 'talk';
    if (skipNow) skipNow();
    act('');
    await new Promise(r => setTimeout(r, 30));
    if (my !== run) return;
    await write({ who: 'y', t: `I have to go.` });
    await write({ who: 'n', t: `You hang up before ${C.callers[s.call.caller].name.split(' ')[0]} can finish.` });
    endLine();
    decide();
  }
  function endLine() { line(false); click(); setTalking(false); phoneState('ended'); }

  async function node(id) {
    if (id === 'decide') { endLine(); return decide(); }
    const n = s.call.nodes[id];
    if (!n) return;
    if (n.set) set(n.set);
    s.phase = 'talk';
    act(`<p class="cl-prompt cl-listening">Listening…</p>${hangLink}`);
    if (!await writeAll(val(n.say, s))) return;
    if (n.moment) return moment(n);
    return node(n.to);
  }

  // ───────────────────────── Moments: the different ways you can act inside a call

  let silenceTimer = null;
  function moment(n) {
    s.phase = 'moment'; s.at = n;
    const k = n.moment;
    if (k === 'choose' || k === 'reveal' || k === 'silence') {
      const opts = n.options.filter(o => !o.when || o.when(s));
      const canWait = k === 'silence' && s.cap.psy > 3;
      act(`<p class="cl-prompt">${esc(n.prompt)}</p>
        <div class="cl-cards ${k === 'reveal' ? 'is-reveal' : ''}">${opts.map((o, j) => `<button type="button" class="cl-opt" data-cact="opt" data-j="${n.options.indexOf(o)}">${o.tag ? `<span class="cl-opt-tag">${esc(o.tag)}</span>` : ''}<span>${esc(o.text)}</span></button>`).join('')}
        ${k === 'silence' ? (canWait ? `<button type="button" class="cl-opt cl-quiet" data-cact="silent"><span class="cl-opt-tag">Say nothing</span><span>Let the silence work.</span><i class="cl-drain" style="--t:${n.wait}s"></i></button>`
          : `<span class="cl-opt cl-quiet is-locked"><span class="cl-opt-tag">Say nothing</span><span>You can't sit in a silence today. Composure ${s.cap.psy}.</span></span>`) : ''}</div>${hangLink}`);
      clearTimeout(silenceTimer);
      if (canWait) { const my = run; silenceTimer = setTimeout(() => { if (my === run && s.at === n) pickSilent(); }, n.wait * 1000); }
      return;
    }
    if (k === 'ask') return askMoment(n);
    if (k === 'clock') { s.minute = n.start; return clockMoment(n); }
    if (k === 'sort') { s.sorted = {}; return sortMoment(n); }
    if (k === 'size') { s.size = 0; s.spec = n; return sizeMoment(n); }
  }

  async function pickOpt(j) {
    const n = s.at, o = n.options[j];
    clearTimeout(silenceTimer); s.at = null; s.used++;
    act(''); set(o.set);
    if (o.you && !await write({ who: 'y', t: o.you })) return;
    node(o.to);
  }
  async function pickSilent() {
    const n = s.at; if (!n) return;
    clearTimeout(silenceTimer); s.at = null; s.used++;
    act('');
    set(n.silent.set);
    if (!await write({ who: 'n', t: `You say nothing.` })) return;
    node(n.silent.to);
  }

  function askMoment(n) {
    const qs = n.questions.filter(q => !q.when || q.when(s));
    s.askLeft = s.askLeft === undefined ? readsFor(s.cap.psy) : s.askLeft;
    s.askedSet = s.askedSet || [];
    const hint = { warning: s.flags.blockOffer ? 0 : 1, last: 2 }[s.call.id];
    const sharp = s.cap.str >= 7;
    act(`<p class="cl-prompt">${esc(n.prompt)} <span class="cl-left">${s.askLeft} ${s.askLeft === 1 ? 'question' : 'questions'} left · Composure ${s.cap.psy}</span></p>
      <div class="cl-cards">${qs.map(q => { const j = n.questions.indexOf(q), done = s.askedSet.includes(j); return `<button type="button" class="cl-opt ${done ? 'is-asked' : ''}" data-cact="ask" data-j="${j}" ${done || !s.askLeft ? 'disabled' : ''}>${sharp && j === hint ? '<span class="cl-opt-tag cl-sharp">Your edge says: this one</span>' : ''}<span>${esc(q.q)}</span></button>`; }).join('')}</div>
      <div class="cl-row"><button type="button" class="btn btn-ghost" data-cact="ask-done">${s.askLeft ? 'That\'s enough' : 'Let him go'}</button>${hangLink}</div>`);
  }
  async function ask(j) {
    const n = s.at, q = n.questions[j];
    s.askLeft--; s.askedSet.push(j); s.asked++; s.used++;
    act(''); set(q.set);
    if (!await write({ who: 'y', t: q.q.replace(/^"|"$/g, '') })) return;
    if (!await writeAll(val(q.a, s))) return;
    s.at = n; s.phase = 'moment';
    if (!s.askLeft || n.questions.filter(x => !x.when || x.when(s)).every((x) => s.askedSet.includes(n.questions.indexOf(x)))) return askDone();
    askMoment(n);
  }
  function askDone() { const n = s.at; s.at = null; s.askLeft = undefined; s.askedSet = []; node(n.to); }

  const hhmm = mm => { const h = 11 + Math.floor(mm / 60), r = mm % 60; return `${h > 12 ? h - 12 : h}:${String(r).padStart(2, '0')}`; };
  function clockMoment(n) {
    const left = n.end - s.minute;
    const checks = n.checks.filter(c => !c.hide || !c.hide(s));
    const hidden = n.checks.length - checks.length;
    act(`<div class="cl-clock"><span class="cl-clock-face" style="--p:${(s.minute - n.start) / (n.end - n.start)}"></span><span><strong>${hhmm(s.minute)}</strong> · ${left} minutes until his noon deadline</span></div>
      <p class="cl-prompt">${esc(n.prompt)}</p>
      <div class="cl-cards">${checks.map(c => { const j = n.checks.indexOf(c), done = s.flags[c.set]; return `<button type="button" class="cl-opt ${done ? 'is-asked' : ''}" data-cact="check" data-j="${j}" ${done || c.cost > left ? 'disabled' : ''}><span class="cl-opt-tag">${c.cost} min</span><span>${esc(c.label)}</span></button>`; }).join('')}</div>
      ${hidden && s.cap.str <= 3 ? `<p class="cl-small">Your Edge is ${s.cap.str}: you're not sure what else to check.</p>` : ''}
      <div class="cl-row"><button type="button" class="btn btn-primary" data-cact="clock-in">${esc(n.done)}</button><button type="button" class="btn btn-ghost" data-cact="clock-wait">${esc(n.wait)}</button></div>`);
  }
  async function check(j) {
    const n = s.at, c = n.checks[j];
    s.minute += c.cost; s.used++;
    act(''); set(c.set);
    if (c.you && !await write({ who: 'y', t: c.you })) return;
    if (!await writeAll(val(c.a, s))) return;
    s.at = n; s.phase = 'moment';
    if (s.minute >= n.end) { s.at = null; return node(n.late); }
    clockMoment(n);
  }

  function sortMoment(n) {
    const done = n.items.every(it => s.sorted[it.id]);
    act(`<p class="cl-prompt">${esc(n.prompt)}</p>
      <ol class="cl-sort">${n.items.map(it => `<li><p>${esc(it.t)}</p><div class="cl-bins" role="group" aria-label="${esc(it.t)}">${n.bins.map(b => `<button type="button" class="cl-bin ${s.sorted[it.id] === b.v ? 'is-on' : ''}" aria-pressed="${s.sorted[it.id] === b.v}" data-cact="bin" data-it="${it.id}" data-v="${b.v}">${esc(b.label)}</button>`).join('')}</div></li>`).join('')}</ol>
      <div class="cl-row"><button type="button" class="btn btn-primary" data-cact="sort-done" ${done ? '' : 'disabled'}>Tell her</button>${hangLink}</div>`);
  }
  function sortDone() {
    const n = s.at; s.at = null;
    s.sortedAway = n.items.filter(it => it.against && s.sorted[it.id] === 'same').length;
    if (s.sortedAway) s.flags.dismissed = true;
    node(n.to);
  }

  function sizeRow(pct) {
    const fin = s.cap.fin, inv = Math.round(fin * pct / 100 * 10) / 10;
    const n = s.spec, risk = pct * n.loss;
    const max = rules.risk === 'open' ? null : ruleOf(rules.risk).max === 1 ? 1 : 2.5;
    return { inv, win: Math.round(inv * n.gain * 10) / 10, lose: Math.round(inv * n.loss * 10) / 10, risk, inRule: max === null ? pct <= 10 : risk <= max + 1e-9, ruin: fin - inv * n.loss <= MK.ruin };
  }
  // Kelly at 25% instead of her 40%: 0.25 / 0.6 − 0.75 / 2 ≈ 4% of the account.
  const SAFE = 4.2;
  function sizeMoment(n) {
    const steps = n.steps, cap10 = s.cap.soc < 5 || s.cap.fin <= 90;
    const j = steps.indexOf(s.size), r = sizeRow(s.size);
    const max = rules.risk === 'open' ? null : ruleOf(rules.risk).label;
    act(`<p class="cl-prompt">${esc(n.prompt)}</p>
      <div class="cl-size">
        <input type="range" min="0" max="${steps.length - 1}" step="1" value="${j}" id="cl-size-in" aria-label="Share of your account" aria-valuetext="${s.size}% of your account">
        <ol class="cl-size-ticks" aria-hidden="true">${steps.map(p => `<li class="${cap10 && p > 10 ? 'is-locked' : ''} ${sizeRow(p).inRule && p ? 'is-rule' : ''} ${p && p <= SAFE ? 'is-safe' : ''}">${p}%</li>`).join('')}</ol>
        <p class="cl-size-band">Underlined: still a good bet even if her 40% is really 25%. Green: inside your rule.</p>
        <dl class="cl-size-out">
          <div><dt>You put in</dt><dd>$${r.inv}k</dd></div>
          <div><dt>If approved</dt><dd class="up">+$${r.win}k</dd></div>
          <div><dt>If rejected</dt><dd class="down">−$${r.lose}k</dd></div>
          <div><dt>Account if wrong</dt><dd class="${r.ruin ? 'down' : ''}">$${Math.round((s.cap.fin - r.lose) * 10) / 10}k</dd></div>
        </dl>
        <p class="cl-size-note">${s.size === 0 ? 'Nothing. You say no.' : r.ruin ? 'If she\'s wrong, the desk pulls your capital.' : r.inRule ? (max ? `Inside your ${max} rule.` : 'Within what you could survive being wrong about.') : (max ? `Breaks your ${max} rule: ${Math.round(r.risk * 10) / 10}% of the account at risk.` : `${Math.round(r.risk * 10) / 10}% of the account at risk.`)}${cap10 ? (s.cap.soc < 5 ? ` Trust is ${s.cap.soc}: Nadia caps new positions at 10%.` : ` You're down 10%: Nadia caps new positions at 10%.`) : ''}</p>
      </div>
      <div class="cl-row"><button type="button" class="btn btn-primary" data-cact="size-done">${s.size ? `Tell her: ${s.size}%` : 'Tell her no'}</button>${hangLink}</div>`);
    const inp = $('#cl-size-in');
    if (inp) inp.addEventListener('input', () => {
      let p = steps[Number(inp.value)];
      if (cap10 && p > 10) { p = 10; inp.value = steps.indexOf(10); }
      s.size = p; const at = inp.value; sizeMoment(n); const again = $('#cl-size-in'); if (again) { again.value = at; again.focus(); }
    });
  }
  async function sizeDone() {
    const n = s.at; s.at = null; s.picked = s.size;
    act('');
    if (!await write({ who: 'y', t: s.picked ? `${s.picked} percent of the account.` : `No. Not this one.` })) return;
    node(n.to);
  }

  // ───────────────────────── Decision, aftermath, and what wasn't said

  function options() {
    const d = s.call.decide;
    return d.options.filter(o => !o.when || o.when(s)).map(o => ({ ...o, q: val(o.q, s), locked: lockReason(s.cap, o) }));
  }

  function decide() {
    s.phase = 'decide';
    if (s.call.sized) return commit(null);
    const d = s.call.decide, note = val(d.note, s);
    act(`<p class="cl-prompt cl-decide-h">${esc(d.prompt)}</p>
      ${note ? `<p class="cl-margin">${esc(note)}</p>` : ''}
      <div class="cl-cards cl-decs">${options().map(o => `<button type="button" class="cl-opt cl-dec ${o.locked ? 'is-locked' : ''}" data-cact="decide" data-k="${o.key}" ${o.locked ? 'disabled' : ''}><span class="cl-opt-tag">${o.key}${breaksRisk(o.exposure) ? ' · breaks your risk rule' : ''}${o.locked ? ` · ${o.locked}` : ''}</span><span>${esc(o.text)}</span></button>`).join('')}</div>`);
    $('#cl-act')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Catherine's call is decided by the size you named. Her verdict is the real result.
  function sizedResult() {
    const r = sizeRow(s.picked), a = s.truth === 'approve';
    const passes = hist.filter(e => ['D', 'E'].includes(e.key) || e.key === 'A' && e.id === 'warning').length;
    const exposure = s.picked === 0 ? 'none' : r.risk <= 1 ? 'small' : r.risk <= 2.5 ? 'normal' : r.risk <= 10 ? 'large' : 'all';
    const asked = s.flags.askedPrice || s.flags.askedDoubt ? ' And you asked the question most people skip.' : '';
    const verdict = s.picked === 0
      ? (passes >= 3 ? { q: 2, cap: { soc: 1 }, line: `You've said no a lot this year. Sometimes that's discipline. Sometimes it's being afraid to be wrong in public. Call me when you know which.` } : { q: 3, cap: { soc: 1 }, line: `Fair. I'd rather back someone who can say no than someone who can't.` })
      : r.ruin || s.picked >= 50 ? { q: 0, cap: { soc: -2 }, line: `You'd have bet the account on someone else's forty percent. I can't give you ours.` }
        : s.picked >= 25 ? { q: 1, cap: { soc: -1 }, line: `You'd make money Monday or you wouldn't. Either way, that size tells me what I needed to know.` }
          : s.picked >= 10 ? { q: 3, cap: { soc: 1, time: 1 }, line: `A little rich for a number nobody knows to the decimal. But you'd survive being wrong about me. Let's talk in January.${asked}` }
            : { q: 4, cap: { soc: 2, time: 3 }, set: 'allocation', line: `That's the answer I was hoping for. Big enough to matter, small enough to survive my being wrong. Monday, win or lose, I'd like to talk about you managing some of our money.${asked}` };
    return {
      opt: { key: `${s.picked}%`, text: s.picked ? `Put ${s.picked}% of the account into Merrin.` : `Said no to Merrin.`, did: s.picked ? (r.inRule ? `Sized the big idea inside the rule: ${s.picked}%.` : `Bet ${s.picked}% of the account on one Monday.`) : `Walked away from the biggest idea of the year.`, exposure, q: verdict.q, breaks: !r.inRule && s.picked ? ['walk'] : [], cap: verdict.cap, set: verdict.set },
      out: { fin: s.picked ? (a ? r.win : -r.lose) : 0, tone: s.picked ? (a ? 'good' : r.inRule ? 'mixed' : 'bad') : (a ? 'mixed' : 'good'), text: a ? `Monday, 7:02 AM: Merrin is approved. The stock is indicated up 200% before the open.` : `Monday, 7:02 AM: Merrin is rejected. The stock is indicated down 60% before the open.` },
      verdict: verdict.line
    };
  }

  async function commit(key) {
    s.phase = 'after';
    let opt, out, verdict = null, after = null;
    if (s.call.sized) ({ opt, out, verdict } = sizedResult());
    else {
      opt = options().find(o => o.key === key);
      if (!opt || opt.locked) return;
      out = s.call.decide.out[key](s);
      after = s.call.decide.after ? s.call.decide.after(s, key) : null;
      // A frozen position keeps its losses and none of its gains.
      if (after && after.zero) out = { ...out, fin: Math.min(0, out.fin) };
    }
    set(opt.set);
    const breaks = [...(val(opt.breaks, s) || [])];
    if (s.flags.revealedSize) breaks.push('private');
    if (s.call.id === 'shift' && s.sortedAway && key === 'A') breaks.push('evidence');
    const delta = { fin: out.fin, time: -1 };
    [opt.cap, out.cap, after && after.cap].forEach(c => Object.entries(c || {}).forEach(([k, v]) => { delta[k] = (delta[k] || 0) + v; }));
    const before = capitals().cap;
    hist.push({ id: s.call.id, truth: s.truth, key: opt.key, picked: s.picked, flags: { ...s.flags }, sorted: s.sorted, sortedAway: s.sortedAway, asked: s.asked, used: s.used, declined: s.declined, hungUp: s.hungUp, q: opt.q, exposure: opt.exposure, did: opt.did, text: opt.text, riskBroke: breaksRisk(opt.exposure), breaks: [...new Set(breaks)], out, after: after && after.text, verdict, delta });
    save();
    act('');
    if (!s.call.sized && !await write({ who: 'y', t: opt.text })) return;
    $('#cl-hud').innerHTML = hud(capitals().cap, before);
    if (!await write({ who: 'n', t: out.text })) return;
    if (after && !await write({ who: 'n', t: after.text })) return;
    if (verdict && !await write({ who: 'c', t: verdict })) return;
    const end = over();
    act(`<p class="cl-prompt">${out.tone === 'good' ? 'It went your way.' : out.tone === 'bad' ? 'It went against you.' : 'It went both ways.'} ${money(out.fin)} on the account.</p>
      <div class="cl-row"><button type="button" class="btn btn-primary" data-cact="unsaid">What wasn't said</button></div>`);
    s.end = end;
  }

  function unsaidHTML() {
    const e = hist[hist.length - 1], call = C.byId[e.id];
    const st = { ...s, flags: e.flags, sorted: e.sorted, sortedAway: e.sortedAway, truth: e.truth };
    const u = call.unsaid(st);
    const told = [e.flags.revealedSize && `Your size`, e.flags.revealedStop && `Your stop price`, e.flags.committed && `That you'd say yes before checking`, e.flags.confessed && null, e.flags.dismissed && `That you'd set aside evidence against your method`, e.picked ? `How much you'd bet when excited: ${e.picked}%` : null, e.declined && `That you let calls ring`, e.hungUp && `That you end conversations when they get uncomfortable`].filter(Boolean);
    const caller = C.callers[call.caller];
    const sig = u.signals.map(x => `<li class="${x.saw(st) ? 'is-seen' : ''}"><span>${x.saw(st) ? 'You noticed' : 'You missed'}</span>${esc(x.t)}</li>`).join('');
    const K = capitals(), next = C.calls[hist.length];
    return `<section class="cl-unsaid" aria-labelledby="unsaid-h">
      <div class="wrap">
        <p class="cl-u-k">${esc(call.title)} · ${esc(caller.name)}</p>
        <h2 id="unsaid-h">What wasn't said</h2>
        <div class="cl-u-grid">
          <div class="cl-u-main">
            <p class="cl-u-big">${esc(u.wanted)}</p>
            <dl class="cl-u-dl">
              <div><dt>What ${esc(caller.name.split(' ')[0])} knew</dt><dd>${esc(u.knew)}</dd></div>
              <div><dt>What ${esc(caller.name.split(' ')[0])} didn't know</dt><dd>${esc(u.didnt)}</dd></div>
              <div><dt>The incentive</dt><dd>${esc(u.incentive)}</dd></div>
            </dl>
          </div>
          <div class="cl-u-side">
            <p class="cl-u-lab">Established</p><p class="cl-u-fact">${esc(u.fact)}</p>
            <p class="cl-u-lab">Plausible, not proven</p><p class="cl-u-read">${esc(u.read)}</p>
            <p class="cl-u-lab">What you gave away</p><p class="cl-u-told">${told.length ? told.map(esc).join('. ') + '.' : 'Nothing you can point to.'}</p>
          </div>
        </div>
        <p class="cl-u-lab">Signals</p><ul class="cl-u-sig">${sig}</ul>
        <div class="cl-row">${s && s.end ? `<button type="button" class="btn btn-primary" data-cact="mirror">${K.ruinedAt !== null ? 'See where it ended' : 'The Mirror'}</button>` : `<button type="button" class="btn btn-primary" data-cact="next">The phone rings again · ${esc(C.callers[next.caller].name)}</button><button type="button" class="btn btn-ghost" data-nav="call">Back to The Call</button>`}</div>
      </div>
    </section>`;
  }

  // ───────────────────────── Overview, rules and The Mirror (shown on the market page)

  function overviewHTML() {
    const K = capitals(), n = hist.length;
    if (n && over()) return reviewHTML(K);
    const next = C.calls[n], who = C.callers[next.caller];
    const pre = PP.ui.marketRules();
    const form = `<form id="call-rules" class="rules cl-rules">
        <div class="section-head"><p class="eyebrow">Before the phone rings</p><h2>Write your rules.</h2><p class="lede">The game will hold you to them at the end.</p></div>
        <fieldset class="rule-set"><legend>${MK.rules.risk.q}</legend><div class="rule-opts">${MK.rules.risk.options.map(o => `<label class="rule-opt"><input type="radio" name="risk" value="${o.v}" ${(pre ? pre.risk === o.v : o.v === 'measured') ? 'checked' : ''}><span class="rule-card"><strong>${o.label}</strong><span>${o.d}</span></span></label>`).join('')}</div></fieldset>
        <fieldset class="rule-set"><legend>Pick two promises you'll keep on the phone.</legend><div class="rule-opts cl-pledges">${C.pledges.map(p => `<label class="rule-opt"><input type="checkbox" name="pledge" value="${p.v}"><span class="rule-card"><strong>${esc(p.short)}</strong><span>${esc(p.label)}</span></span></label>`).join('')}</div><p class="cl-small" id="pledge-note">Choose two.</p></fieldset>
        <div class="page-actions"><button type="submit" class="btn btn-primary" id="pledge-go" disabled>Keep these rules</button></div>
      </form>`;
    const list = C.calls.map((c, i) => {
      const e = hist[i], w = C.callers[c.caller];
      const tag = e ? `<span class="mkc-tag"><span class="g${e.q}">${PP.grades[e.q].glyph}</span> ${money(e.out.fin)}</span>` : i === n ? `<span class="mkc-tag mkc-tag-next">${rules ? 'Next' : 'Rules first'}</span>` : `<span class="mkc-tag">Locked</span>`;
      return `<li><span class="mkc ${e ? 'is-done' : i === n ? 'is-next' : 'is-locked'}"><span class="mkc-n">${i + 1}</span><span class="mkc-body"><span class="mkc-t">${c.title}</span><span class="mkc-q">${c.tests}</span><span class="mkc-life">${c.day}, ${c.clock} · ${e ? w.name : 'Caller unknown'}</span></span>${tag}</span></li>`;
    }).join('');
    return `<section class="wrap cl-open">
        <p class="cl-open-k">The Trader's Mind · Special challenge</p>
        <p class="cl-open-lede">Some of the most expensive decisions begin with a phone call.</p>
        <ul class="cl-open-unknowns"><li>You don't know who's calling.</li><li>You don't know what they want.</li><li>You don't know what they know.</li></ul>
        <p class="cl-open-sub">You have one account, one reputation, and a decision to make.</p>
        <div class="hud hud-lg">${hud(K.cap)}</div>
      </section>
      ${rules ? `<section class="wrap cl-incoming-wrap">
        <div class="cl-incoming">
          <div class="ph-face is-small"><span class="ph-ring"></span><span class="ph-ring r2"></span><span class="ph-av">${n ? who.initials : '?'}</span></div>
          <div class="cl-in-txt"><p class="cl-in-k">${n ? `Call ${n + 1} of 5 · ${next.day}, ${next.clock}` : 'An incoming call'}</p><p class="cl-in-name">${esc(who.name)}</p><p class="cl-in-role">${esc(who.role.split(',')[0])}. Unknown intentions.</p><p class="cl-in-ring">The phone rings.</p></div>
          <button type="button" class="btn btn-primary cl-in-go" data-act="phone">Answer the phone</button>
        </div>
        <p class="cl-rules-line">Your rules: risk <strong>${ruleOf(rules.risk).label}</strong> · ${rules.pledges.map(p => esc(pledge(p).short)).join(' · ')} ${n ? '' : `<button type="button" class="btn btn-link" data-cact="rules-edit">Change</button>`}</p>
      </section>` : `<section class="wrap">${form}</section>`}
      <section class="wrap mk-list">
        <div class="section-head"><p class="eyebrow">Five calls · One campaign</p><h2>Every call has two games in it.</h2><p class="lede">The conversation you think you're having, and the one the caller may be playing.</p></div>
        <ol class="mkcs">${list}</ol>
        ${n ? `<div class="page-actions"><button type="button" class="${confirmReset ? 'btn btn-ghost is-danger' : 'btn btn-ghost'}" data-cact="reset">${confirmReset ? 'Tap again to erase The Call' : 'Start The Call over'}</button></div>` : ''}
      </section>`;
  }

  // Five ways to describe how someone plays, without calling them a winner or a loser.
  function tendencies(K) {
    const H = K.steps.map(x => x.e);
    const kept = H.filter(e => !e.riskBroke && !e.breaks.some(b => rules.pledges.includes(b))).length;
    const listened = H.reduce((a, e) => a + (e.flags.silent || e.flags.silent1 || e.flags.silent2 ? 1 : 0), 0);
    const gathered = H.reduce((a, e) => a + e.asked + Object.keys(e.flags).filter(k => /^(asked|checked|read)/.test(k)).length, 0);
    const passes = H.filter(e => e.exposure === 'none').length;
    const big = H.filter(e => MK.exposure[e.exposure] >= 3).length;
    const sh = H.find(e => e.id === 'shift');
    const dim = (k, lvl, t) => ({ k, lvl, t });
    return {
      kept, listened, passes, big,
      dims: [
        dim(`Consistency`, kept >= H.length - 1 ? 3 : kept >= H.length / 2 ? 2 : 1, `You kept your rules in ${NUM[kept] || kept} of ${NUM[H.length] || H.length} calls.`),
        dim(`Adaptability`, !sh ? 1 : ['B', 'D'].includes(sh.key) ? 3 : sh.key === 'C' ? 2 : 1, !sh ? `You never reached the call that tested it.` : sh.key === 'A' ? `When the evidence turned, you defended the method${sh.sortedAway ? ', and filed the hardest evidence under "doesn\'t change it"' : ''}.` : sh.key === 'E' ? `When the evidence turned, you threw everything out at once. Changing your mind and abandoning your method aren't the same thing.` : `When the evidence turned, you changed how much you bet before you changed what you believe.`),
        dim(`Risk management`, big === 0 ? 3 : big === 1 ? 2 : 1, big === 0 ? `You never put more at risk than you could afford to be wrong about.` : `${big === 1 ? 'Once' : `${NUM[big].charAt(0).toUpperCase() + NUM[big].slice(1)} times`}, you took a position big enough to change your year.`),
        dim(`Information gathering`, gathered >= 8 ? 3 : gathered >= 4 ? 2 : 1, `You asked, checked or tested ${gathered} times before deciding.${listened ? ` You let the silence work ${listened === 1 ? 'once' : NUM[listened] + ' times'}.` : ''}`),
        dim(`Psychological discipline`, K.cap.psy >= 6 && !H.some(e => e.hungUp) ? 3 : K.cap.psy >= 4 ? 2 : 1, `You finished with Composure ${K.cap.psy}.${H.some(e => e.id === 'silence' && e.key === 'A') ? ' You chased a move because a friend was in it.' : ''}${H.some(e => e.hungUp) ? ' You hung up when a call got uncomfortable.' : ''}`)
      ]
    };
  }

  function reflection(K, T) {
    const H = K.steps.map(x => x.e), out = [];
    if (H.some(e => e.flags.revealedSize)) out.push(`You tell people more than you need to. Michael Reeves learned your size in one question, and by Friday Catherine Hale knew it too. Information you give away keeps working, for someone else.`);
    if (T.listened >= 2) out.push(`You're comfortable in silence. Twice or more, saying nothing got a caller to tell you what they'd meant to keep.`);
    if (T.passes >= 3) out.push(`You pass often. Some of those were patience. Look at the ones where the evidence was good and you passed anyway: that's the version of caution that costs money slowly.`);
    if (T.big >= 2) out.push(`When an idea excites you, your size grows with your excitement rather than your evidence.`);
    if (H.some(e => e.id === 'tip' && e.flags.committed)) out.push(`You said yes to Richard before you'd checked anything. A deadline you didn't set made the decision for you.`);
    if (H.some(e => e.id === 'shift' && ['B', 'D'].includes(e.key))) out.push(`When your method stopped working, you made the next bet smaller before deciding what to believe. That's what intellectual humility looks like with money on it.`);
    if (!out.length) out.push(`You played an even game: no habit that cost you badly, none that carried you. The calls you'll learn most from are the ones where you were certain.`);
    return out.slice(0, 3);
  }

  function reviewHTML(K) {
    const out = K.ruinedAt !== null, T = tendencies(K), H = K.steps;
    const quad = e => { const gd = e.q >= 3, gr = e.out.tone === 'good'; return gd ? (gr ? 'Earned' : 'Unlucky') : (gr ? 'Got lucky' : 'Lesson'); };
    const said = [rules.risk === 'open' ? `No fixed limit. Size by conviction.` : `Risk no more than ${ruleOf(rules.risk).label} of the account on any one idea.`, ...rules.pledges.map(p => pledge(p).label)];
    const did = H.map(x => { const br = [x.e.riskBroke && `your ${ruleOf(rules.risk).label} rule`, ...x.e.breaks.filter(b => rules.pledges.includes(b)).map(b => `"${pledge(b).short}"`)].filter(Boolean); return `<li class="mirror-row ${br.length ? 'is-broke' : ''}"><span class="mirror-opp">vs. ${x.call.opponent}</span><strong>${x.call.title}</strong><span>${esc(x.e.did)}</span><em>${br.length ? `Broke ${br.join(' and ')}` : 'Kept your rules'}</em></li>`; }).join('');
    const capRows = MK.capitals.map(c => { const a = c.start, b = K.cap[c.k], d = Math.round((b - a) * 10) / 10; return `<li class="capr"><span class="capr-k">${c.name}<small>${c.kind}</small></span><span class="capr-bar" aria-hidden="true"><span class="capr-start" style="left:${Math.min(100, a / c.max * 100)}%"></span><span class="capr-fill ${d < 0 ? 'down' : ''}" style="width:${Math.max(0, Math.min(100, b / c.max * 100))}%"></span></span><span class="capr-v">${c.k === 'fin' ? `$${b}k` : b}<small class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d ? (c.k === 'fin' ? money(d) : (d > 0 ? '+' : '−') + Math.abs(d)) : 'no change'}</small></span></li>`; }).join('');
    const review = H.map((x, i) => `<li class="dr"><span class="dr-n">${i + 1}</span><div class="dr-main"><h4>${x.call.title} · ${C.callers[x.call.caller].name}</h4><p class="dr-row"><span class="dr-k">You chose</span>${esc(x.e.text)}</p><p class="dr-row"><span class="dr-k">What happened</span>${esc(x.e.out.text)} ${money(x.e.out.fin)}</p></div><span class="dr-q q-${quad(x.e).toLowerCase().replace(' ', '-')}"><span class="g${x.e.q}">${PP.grades[x.e.q].glyph}</span>${quad(x.e)}</span></li>`).join('');
    const verdict = T.kept === H.length ? `Yes. Every call fit the rules you wrote before the phone rang.` : `Not quite. You kept your rules in ${NUM[T.kept] || T.kept} of ${NUM[H.length] || H.length} calls. Look at which calls broke them. It's rarely the calm ones.`;
    return `<section class="wrap page mk-review cl-review">
        <div class="mk-final"><div class="rating-card"><span class="rating-label">${out ? 'Disconnected' : 'Still on the line'}</span><span class="rating-num">$${K.cap.fin}k</span><span class="rating-sub">Started at $100k</span></div>
          <p class="lede">${out ? `The desk pulled your capital after ${C.calls[K.ruinedAt].title}. Nothing teaches survival like losing the ability to continue.` : `Five calls. Five people with their own reasons for calling.`}</p></div>
        <section class="block mirror" aria-labelledby="cl-mirror-h">
          <div class="section-head"><p class="eyebrow">The Mirror</p><h2 id="cl-mirror-h">Did you play the game you said you would play?</h2></div>
          <div class="mirror-grid">
            <div class="mirror-col"><p class="mirror-k">Your original rules</p><ul class="mirror-said">${said.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <div class="mirror-col"><p class="mirror-k">What you actually did</p><ol class="mirror-did">${did}</ol></div>
          </div>
          <p class="mirror-verdict">${verdict}</p>
        </section>
        <section class="block card"><h2 class="block-h">Five kinds of capital <span class="block-hint">the tick marks where you started</span></h2><ul class="caprs">${capRows}</ul></section>
        <section class="block"><h2 class="block-h">How you played</h2><ul class="cl-dims">${T.dims.map(d => `<li><span class="cl-dim-k">${d.k}</span><span class="cl-dots" aria-label="${d.lvl} of 3">${[1, 2, 3].map(j => `<i class="${j <= d.lvl ? 'on' : ''}"></i>`).join('')}</span><span>${esc(d.t)}</span></li>`).join('')}</ul></section>
        <section class="block cl-reflect"><h2 class="block-h">What your calls say about you</h2>${reflection(K, T).map(t => `<p>${esc(t)}</p>`).join('')}</section>
        <section class="block"><h2 class="block-h">Decision review</h2><p class="small">A good decision can lose, and a bad one can win. This grades what you could know.</p><ol class="drs">${review}</ol></section>
        <div class="carry"><p class="eyebrow">The last thing</p><p class="carry-q">The market is uncertain. The other players have their own agendas. And your greatest opponent may be yourself.</p></div>
        <div class="page-actions"><button type="button" class="${confirmReset ? 'btn btn-ghost is-danger' : 'btn btn-primary'}" data-cact="reset">${confirmReset ? 'Tap again to start over' : 'Play The Call again'}</button><button type="button" class="btn btn-ghost" data-nav="home">Back to The Dance</button></div>
      </section>`;
  }

  // ───────────────────────── Events

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cact]');
    if (!b) return;
    const a = b.dataset.cact;
    if (a !== 'reset') confirmReset = false;
    switch (a) {
      case 'answer': if (s && s.phase === 'ring') answer(); break;
      case 'decline': if (s && s.phase === 'ring') decline(); break;
      case 'hangup': hangup(); break;
      case 'skip': if (skipNow && !e.target.closest('.cl-act')) skipNow(); break;
      case 'opt': if (s && s.at) pickOpt(Number(b.dataset.j)); break;
      case 'silent': if (s && s.at) pickSilent(); break;
      case 'ask': if (s && s.at) ask(Number(b.dataset.j)); break;
      case 'ask-done': if (s && s.at) askDone(); break;
      case 'check': if (s && s.at) check(Number(b.dataset.j)); break;
      case 'clock-in': if (s && s.at) { const n = s.at; s.at = null; act(''); write({ who: 'y', t: n.done.replace(/"/g, '') }).then(ok => ok && node(n.to)); } break;
      case 'clock-wait': if (s && s.at) { const n = s.at; s.at = null; act(''); write({ who: 'y', t: n.wait.replace(/"/g, '') }).then(ok => ok && node(n.late)); } break;
      case 'bin': if (s && s.at) { s.sorted[b.dataset.it] = b.dataset.v; sortMoment(s.at); } break;
      case 'sort-done': if (s && s.at) sortDone(); break;
      case 'size-done': if (s && s.at) sizeDone(); break;
      case 'decide': if (s && s.phase === 'decide') commit(b.dataset.k); break;
      case 'unsaid': {
        const host = $('.cl'); if (!host) break;
        host.insertAdjacentHTML('afterend', unsaidHTML());
        act('');
        document.querySelector('.cl-unsaid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'next': PP.nav('phone'); break;
      case 'mirror': PP.nav('call'); break;
      case 'rules-edit': rules = null; store.set(RULES_KEY, null); PP.nav('call'); break;
      case 'reset':
        if (!confirmReset) { confirmReset = true; PP.nav('call', true); document.querySelector('[data-cact="reset"]')?.focus(); return; }
        confirmReset = false; hist = []; save(); rules = null; store.set(RULES_KEY, null); PP.nav('call');
        break;
    }
  });
  document.addEventListener('change', e => {
    if (e.target.name !== 'pledge') return;
    const boxes = [...document.querySelectorAll('input[name="pledge"]')], on = boxes.filter(x => x.checked);
    boxes.forEach(x => { x.disabled = !x.checked && on.length >= 2; });
    const go = document.getElementById('pledge-go'), note = document.getElementById('pledge-note');
    if (go) go.disabled = on.length !== 2;
    if (note) note.textContent = on.length === 2 ? 'Two promises. The game will remember them.' : `Choose ${on.length ? 'one more' : 'two'}.`;
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'call-rules') return;
    e.preventDefault();
    const fd = new FormData(e.target), pledges = fd.getAll('pledge');
    if (pledges.length !== 2) return;
    rules = { risk: fd.get('risk'), pledges };
    store.set(RULES_KEY, rules);
    PP.nav('call');
    document.querySelector('.cl-incoming')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.addEventListener('keydown', e => {
    if (!s || !document.querySelector('.cl') || e.target.closest('input, textarea, button')) return;
    if (e.key === ' ' && skipNow) { e.preventDefault(); skipNow(); }
  });
  let rz = null;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (document.querySelector('.cl-ink')) repaint(); }, 150); });

  return {
    playHTML, mount, stop, overviewHTML,
    get ready() { return !!rules && !over(); },
    get title() { const c = C.calls[hist.length]; return c ? c.title : 'The Call'; },
    get count() { return hist.length; },
    unlockAudio() { audio(); }
  };
})();
