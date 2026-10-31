// The stage: plays a scene's beats with a moving camera, typed dialogue, and character
// moods, poses and gestures. Supports freezing (Slow Motion Strategy), skipping, and
// fast-forwarding straight to a scene's resting state.
window.PP = window.PP || {};

PP.Stage = class {
  constructor(root, scene, opts = {}) {
    this.root = root;
    this.scene = scene;
    this.ctx = opts.ctx || { rel: {}, flags: {} };
    this.label = opts.label || '';
    this.onFreeze = opts.onFreeze || (() => {});
    this.onResume = opts.onResume || (() => {});
    this.ambient = !!opts.ambient;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused = false;
    this.fast = false;
    this.waiter = null;
    this.alive = true;
    this.actors = {};
    this.build();
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.tick(t));
  }

  build() {
    const sc = this.scene;
    const { svg, env } = PP.art.sceneSvg(sc, PP.people, {}, this.label);
    this.env = env;
    this.root.innerHTML = `
      <div class="stage ${this.ambient ? 'is-ambient' : ''}">
        ${svg}
        <div class="lb lb-top" aria-hidden="true"></div><div class="lb lb-bot" aria-hidden="true"></div>
        <p class="stage-caption" aria-live="polite"></p>
        <div class="stage-title" aria-hidden="true"></div>
        <div class="pins" aria-hidden="true"></div>
        <div class="freeze-badge" aria-hidden="true"><span class="freeze-dot"></span>Slow Motion Strategy</div>
        ${this.ambient ? '' : `<div class="stage-ctl">
          <button type="button" class="sbtn" data-st="freeze" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg><span>Slow-mo</span></button>
          <button type="button" class="sbtn" data-st="skip"><span>Skip</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l7 6-7 6zM8 2l7 6-7 6z"/></svg></button>
        </div>
        <div class="stage-ctl stage-ctl-left">
          ${PP.voice.supported ? `<button type="button" class="sbtn sbtn-icon" data-st="voice" aria-pressed="${PP.voice.on}" aria-label="Voices"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/><path class="sv-on" d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path class="sv-off" d="M11 5.5l4 5M15 5.5l-4 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>` : ''}
          <button type="button" class="sbtn sbtn-pace" data-st="pace" aria-label="Speed ${PP.voice.pace} times. Change speed">${PP.voice.pace}×</button>
        </div>`}
      </div>
      ${this.ambient ? '' : `<div class="dialogue" hidden>
        <span class="dlg-name"></span>
        <p class="dlg-text" aria-hidden="true"></p>
        <p class="sr dlg-live" aria-live="polite"></p>
        <span class="dlg-more" aria-hidden="true">Tap to continue</span>
      </div>`}`;
    this.stage = this.root.querySelector('.stage');
    this.world = this.root.querySelector('.world');
    this.caption = this.root.querySelector('.stage-caption');
    this.dialogue = this.root.querySelector('.dialogue');
    sc.cast.forEach(c => {
      const el = this.root.querySelector(`.actor[data-id="${c.id}"]`);
      this.actors[c.id] = { el, body: el.querySelector('.actor-body'), arms: el.querySelector('.arms'), pos: PP.art.place(sc.env, c), cast: c, mood: c.mood, pose: c.pose };
    });
    this.cam = { x: 800, y: 450, s: 1 };
    this.applyCam(this.cam, true);

    if (!this.ambient) {
      this.stage.addEventListener('click', e => {
        if (e.target.closest('.stage-ctl')) return;
        if (!this.paused) this.skip();
      });
      this.dialogue.addEventListener('click', () => { if (!this.paused) this.skip(); });
      this.root.querySelector('[data-st="freeze"]').addEventListener('click', () => this.paused ? this.resume() : this.freeze());
      this.root.querySelector('[data-st="skip"]').addEventListener('click', () => this.skipAll());
      this.root.querySelector('[data-st="voice"]')?.addEventListener('click', e => {
        PP.voice.setOn(!PP.voice.on);
        e.currentTarget.setAttribute('aria-pressed', String(PP.voice.on));
      });
      this.root.querySelector('[data-st="pace"]').addEventListener('click', e => {
        const p = PP.voice.cyclePace();
        e.currentTarget.textContent = `${p}×`;
        e.currentTarget.setAttribute('aria-label', `Speed ${p} times. Change speed`);
      });
    }
  }

  destroy() { this.alive = false; cancelAnimationFrame(this.raf); PP.voice.stop(); this.root.classList.remove('is-running'); if (this.waiter) this.waiter.res(); }

  // ───────── clock

  tick(t) {
    if (!this.alive) return;
    const dt = Math.min(t - this.last, 100);
    this.last = t;
    const w = this.waiter;
    if (w && !this.paused) {
      w.elapsed += dt;
      if (w.onTick) w.onTick(w.elapsed);
      const holding = w.hold && w.hold() && w.elapsed < w.ms + 20000;
      if (this.fast || (w.elapsed >= w.ms && !holding)) { this.waiter = null; w.res(); }
    }
    this.raf = requestAnimationFrame(tt => this.tick(tt));
  }

  wait(ms, onTick, typeMs = 0, hold = null) {
    if (this.fast) return Promise.resolve();
    return new Promise(res => { this.waiter = { ms, elapsed: 0, res, onTick, typeMs, hold }; });
  }

  // Scene timing follows the chosen speed.
  paced(ms) { return ms / PP.voice.pace; }

  // Speak a line if voices are on; returns a hold() that stays true until the voice finishes.
  voiceLine(id, text) {
    let endAt = 0;
    let speaking = PP.voice.speak(id, text, () => { speaking = false; endAt = performance.now(); });
    return () => speaking || (endAt && performance.now() - endAt < 250);
  }

  skip() {
    const w = this.waiter;
    if (!w) return;
    if (w.typeMs && w.elapsed < w.typeMs) { w.elapsed = w.typeMs; if (w.onTick) w.onTick(w.elapsed); }
    else { PP.voice.stop(); this.waiter = null; w.res(); }
  }

  skipAll() { this.fast = true; PP.voice.stop(); this.skip(); }

  // ───────── camera

  // The part of the 1600x900 world the stage shows at rest (phones crop the sides).
  visible() {
    const r = this.stage.getBoundingClientRect();
    const aspect = r.width && r.height ? r.width / r.height : 16 / 9;
    return { w: Math.min(1600, 900 * aspect), h: Math.min(900, 1600 / aspect) };
  }

  focusOf(target) {
    if (!target || target === 'wide') {
      const v = this.visible();
      if (v.w >= 1590) return { x: 800, y: 450, s: 1 };
      const xs = Object.values(this.actors).map(a => a.pos.x).filter(x => x > 0 && x < 1600);
      const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 800;
      return { x: cx, y: 450, s: 1 };
    }
    if (this.env.cams[target]) return this.env.cams[target];
    const a = this.actors[target];
    if (a) {
      const s = a.pos.s;
      const z = Math.max(1.35, Math.min(2.6, 1.6 / s));
      return { x: a.pos.x, y: a.pos.y - 420 * s * (PP.people[a.cast.look || a.cast.id].look.h || 1), s: z };
    }
    if (target === 'you') return { x: 360, y: 700, s: 1.3 };
    return { x: 800, y: 450, s: 1 };
  }

  applyCam(c, instant) {
    const s = c.s;
    const v = this.visible();
    let tx = 800 - c.x * s, ty = 450 - c.y * s;
    // Keep the scaled world covering the visible window, not the full frame.
    tx = Math.min((1600 - v.w) / 2, Math.max((1600 + v.w) / 2 - 1600 * s, tx));
    ty = Math.min((900 - v.h) / 2, Math.max((900 + v.h) / 2 - 900 * s, ty));
    if (instant || this.reduced || this.fast) this.world.style.transition = 'none';
    else this.world.style.transition = '';
    this.world.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    if (instant || this.fast) { void this.world.getBoundingClientRect(); this.world.style.transition = ''; }
  }

  camera(target) { this.cam = this.focusOf(target); this.camTarget = target; this.applyCam(this.cam); }

  // ───────── actors

  setMood(id, mood) {
    const a = this.actors[id]; if (!a || !mood) return;
    a.body.classList.remove(`mood-${a.mood}`);
    a.body.classList.add(`mood-${mood}`);
    a.mood = mood;
  }

  setPose(id, pose) {
    const a = this.actors[id]; if (!a || !pose || pose === a.pose) return;
    a.arms.innerHTML = PP.art.arms(PP.people[a.cast.look || id].look, pose);
    a.pose = pose;
    if (!this.fast && !this.reduced) { a.arms.classList.remove('pose-in'); void a.arms.getBBox; requestAnimationFrame(() => a.arms.classList.add('pose-in')); }
  }

  act(id, name) {
    const a = this.actors[id]; if (!a || !name || this.fast || this.reduced) return;
    const cls = `act-${name}`;
    a.body.classList.remove(cls); void a.body.getBoundingClientRect(); a.body.classList.add(cls);
    setTimeout(() => a.body.classList.remove(cls), 1200);
  }

  move(id, to) {
    const a = this.actors[id]; if (!a || !to) return;
    a.pos = to.spot ? PP.art.place(this.scene.env, to) : { ...a.pos, ...to };
    if (this.fast || this.reduced) a.el.style.transition = 'none';
    else { a.el.style.transition = ''; a.el.classList.add('walking'); setTimeout(() => a.el.classList.remove('walking'), 1700); }
    a.el.setAttribute('style', PP.art.actorTransform(a.pos) + (this.fast || this.reduced ? ';transition:none' : ''));
  }

  applyState(id, st) {
    if (!st) return;
    if (st.move) this.move(id, st.move);
    if (st.mood) this.setMood(id, st.mood);
    if (st.pose) this.setPose(id, st.pose);
    if (st.act) this.act(id, st.act);
  }

  // A set with a register shows the price on it; any other set gets a terminal-style alert.
  setScreen(text) {
    const el = this.root.querySelector('.reg-price');
    if (el) { el.textContent = text; return; }
    let a = this.root.querySelector('.stage-alert');
    if (!a) {
      a = document.createElement('p');
      a.className = 'stage-alert';
      a.setAttribute('aria-live', 'polite');
      this.stage.appendChild(a);
    }
    a.textContent = text;
    a.classList.remove('is-on');
    void a.offsetWidth;
    a.classList.add('is-on');
  }

  // ───────── text

  showCaption(text) {
    this.caption.textContent = text;
    this.caption.classList.add('is-on');
  }
  hideCaption() { this.caption.classList.remove('is-on'); }

  async speak(name, text, speakerId, isYou) {
    if (this.fast) return;
    const d = this.dialogue;
    d.hidden = false;
    d.classList.toggle('is-you', !!isYou);
    d.querySelector('.dlg-name').textContent = name;
    const out = d.querySelector('.dlg-text');
    d.querySelector('.dlg-live').textContent = `${name}: ${text}`;
    const a = speakerId && this.actors[speakerId];
    if (a) a.el.classList.add('speaking');
    const typeMs = this.reduced ? 0 : this.paced(Math.min(text.length * 24, 2600));
    const total = typeMs + this.paced(Math.max(1500, text.length * 42));
    out.textContent = this.reduced ? text : '';
    d.classList.remove('is-done');
    const talking = this.voiceLine(isYou ? 'you' : speakerId, text);
    await this.wait(total, el => {
      const n = typeMs ? Math.min(text.length, Math.ceil((el / typeMs) * text.length)) : text.length;
      if (out.textContent.length !== n) out.textContent = text.slice(0, n);
      // The mouth keeps moving while the voice is still speaking.
      if (n >= text.length) { d.classList.add('is-done'); if (a && !talking()) a.el.classList.remove('speaking'); }
    }, typeMs, talking);
    out.textContent = text;
    if (a) a.el.classList.remove('speaking');
  }

  // ───────── beats

  async beat(b) {
    if (b.if && !b.if(this.ctx)) return;
    if (b.set) Object.entries(b.set).forEach(([id, st]) => this.applyState(id, st));
    if (b.who) this.applyState(b.who, b);
    if (b.screen) this.setScreen(b.screen);
    const cam = b.cam || (b.who && (b.say || b.caption) ? b.who : null) || (b.you ? null : null);
    if (cam) this.camera(cam);
    if (b.say) {
      this.hideCaption();
      await this.speak(PP.people[b.who].name, b.say, b.who);
    } else if (b.you) {
      this.hideCaption();
      await this.speak('You', b.you, null, true);
    } else if (b.caption) {
      if (this.dialogue) this.dialogue.hidden = true;
      this.showCaption(b.caption);
      const narrating = this.fast ? null : this.voiceLine('narrator', b.caption);
      await this.wait(this.paced(Math.max(1900, b.caption.length * 48)), null, 0, narrating);
    } else {
      await this.wait(this.paced(b.wait || (b.move ? 1700 : 1100)));
    }
  }

  async run(beats, { title } = {}) {
    this.fast = false;
    this.stage.classList.add('is-playing');
    this.root.classList.add('is-running');
    if (title && !this.reduced) {
      const t = this.root.querySelector('.stage-title');
      t.innerHTML = title;
      t.classList.add('is-on');
      await this.wait(this.paced(1800));
      t.classList.remove('is-on');
    }
    for (const b of beats) {
      if (!this.alive) return;
      await this.beat(b);
    }
    this.fast = false;
    this.hideCaption();
    if (this.dialogue) this.dialogue.hidden = true;
    this.stage.classList.remove('is-playing');
    this.root.classList.remove('is-running');
  }

  // Apply every state change in a list of beats instantly (no camera, no text).
  settle(beats) {
    const wasFast = this.fast;
    this.fast = true;
    beats.forEach(b => {
      if (b.if && !b.if(this.ctx)) return;
      if (b.set) Object.entries(b.set).forEach(([id, st]) => this.applyState(id, st));
      if (b.who) this.applyState(b.who, b);
      if (b.screen) this.setScreen(b.screen);
    });
    this.fast = wasFast;
    this.camera('wide');
    this.hideCaption();
    if (this.dialogue) this.dialogue.hidden = true;
  }

  // ───────── Slow Motion Strategy

  freeze() {
    if (this.paused) return;
    this.paused = true;
    this.savedCam = this.cam;
    this.camera('wide');
    this.stage.classList.add('is-frozen');
    PP.voice.pause();
    this.root.querySelector('[data-st="freeze"]')?.setAttribute('aria-pressed', 'true');
    setTimeout(() => this.placePins(), this.reduced ? 0 : 1250);
    this.onFreeze();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.stage.classList.remove('is-frozen');
    PP.voice.resume();
    this.root.querySelector('[data-st="freeze"]')?.setAttribute('aria-pressed', 'false');
    this.root.querySelector('.pins').innerHTML = '';
    if (this.savedCam) { this.cam = this.savedCam; this.applyCam(this.cam); }
    this.onResume();
  }

  placePins() {
    if (!this.paused) return;
    const box = this.stage.getBoundingClientRect();
    const pins = this.scene.cast.map((c, i) => {
      const head = this.actors[c.id].el.querySelector('.head');
      const r = head.getBoundingClientRect();
      const x = ((r.left + r.width / 2 - box.left) / box.width) * 100;
      const y = ((r.top - box.top) / box.height) * 100;
      const edge = x < 4 ? ' pin-edge-l' : x > 96 ? ' pin-edge-r' : '';
      const cx = Math.min(95, Math.max(5, x));
      return `<span class="pin${edge}" style="left:${cx.toFixed(2)}%;top:${Math.min(88, Math.max(10, y - 3)).toFixed(2)}%">${i + 1}</span>`;
    }).join('');
    this.root.querySelector('.pins').innerHTML = pins;
  }
};
