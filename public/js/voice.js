// Spoken dialogue using the browser's built-in voices, plus a global pace setting.
// Each character prefers a list of voice names (whatever the device has wins) and a pitch/rate.
// Pace scales both speech and scene timing, so slowing down slows everything.
window.PP = window.PP || {};

PP.voice = (function () {
  const synth = window.speechSynthesis;
  const supported = !!synth && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  const PACES = [0.75, 1, 1.25, 1.5];
  let pace = Number(store.get('thedance:pace', '1'));
  if (!PACES.includes(pace)) pace = 1;
  let on = supported && store.get('thedance:voices', 'on') === 'on';

  // Preferred voices, first match wins. Names cover macOS/iOS, Windows, Chrome and Android.
  const CAST = {
    maya:     { names: ['Flo (English (United States))', 'Ava', 'Allison', 'Zira', 'Google US English', 'Samantha'], pitch: 1.12, rate: 1.05 },
    dev:      { names: ['Eddy (English (United States))', 'Aaron', 'Tom', 'Guy', 'Google UK English Male', 'David'], pitch: 0.96, rate: 1 },
    sigh:     { names: ['Grandpa (English (United States))', 'Reed', 'Mark', 'Google UK English Male', 'David'], pitch: 0.9, rate: 0.95 },
    dana:     { names: ['Karen', 'Shelley (English (United States))', 'Nicky', 'Google UK English Female', 'Samantha'], pitch: 1.06, rate: 1.05 },
    ellen:    { names: ['Moira', 'Kate', 'Serena', 'Hazel', 'Google UK English Female'], pitch: 0.97, rate: 0.95 },
    gary:     { names: ['Rocko (English (United States))', 'Evan', 'Aaron', 'Alex', 'David', 'Google US English'], pitch: 0.92, rate: 1 },
    ruth:     { names: ['Grandma (English (United States))', 'Victoria', 'Moira', 'Susan', 'Google UK English Female'], pitch: 1, rate: 0.92 },
    jordan:   { names: ['Daniel', 'Oliver', 'Arthur', 'George', 'Google UK English Male', 'Mark'], pitch: 1, rate: 1.06 },
    priya:    { names: ['Veena', 'Isha', 'Lekha', 'Tessa', 'Shelley (English (United Kingdom))', 'Google UK English Female'], pitch: 1.04, rate: 1.02 },
    marcus:   { names: ['Reed (English (United States))', 'Nathan', 'Evan', 'Guy', 'David', 'Alex'], pitch: 0.85, rate: 0.96 },
    tom:      { names: ['Eddy (English (United Kingdom))', 'Rishi', 'Tom', 'Rocko (English (United Kingdom))', 'Alex'], pitch: 1, rate: 1 },
    you:      { names: ['Ava', 'Allison', 'Jenny', 'Aria', 'Samantha', 'Google US English'], pitch: 1, rate: 1 },
    narrator: { names: ['Serena', 'Libby', 'Sandy (English (United Kingdom))', 'Google UK English Female', 'Shelley (English (United Kingdom))', 'Moira'], pitch: 1, rate: 0.95 }
  };

  let voices = [];
  // macOS also ships novelty and old robotic voices; never cast those.
  const SKIP = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|ralph|junior|kathy|deranged|hysterical|pipe organ)\b/i;
  function load() { voices = supported ? synth.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang) && !SKIP.test(v.name)) : []; }
  if (supported) {
    load();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
    else synth.onvoiceschanged = load;
  }

  const quality = v => (/(premium|enhanced|natural|neural)/i.test(v.name) ? 3 : 0) + (/google|microsoft/i.test(v.name) ? 1 : 0) + (v.localService ? 0.5 : 0);
  const chosen = {};
  function pick(id) {
    if (chosen[id] && voices.includes(chosen[id])) return chosen[id];
    const h = CAST[id] || CAST.narrator;
    for (const n of h.names) {
      const m = voices.filter(v => v.name.toLowerCase().includes(n.toLowerCase())).sort((a, b) => quality(b) - quality(a));
      if (m.length) return (chosen[id] = m[0]);
    }
    if (!voices.length) return null;
    // No named match: spread characters across the device's best voices so they still sound different.
    const best = [...voices].sort((a, b) => quality(b) - quality(a)).slice(0, 6);
    let hash = 0;
    for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    return (chosen[id] = best[hash % best.length]);
  }

  // Stage directions such as "(under his breath)" are for reading, not saying.
  const clean = t => t.replace(/\([^)]*\)\s*/g, '').replace(/<[^>]+>/g, '').trim();

  function speak(id, text, onend) {
    if (!on || !supported) return false;
    const say = clean(text);
    if (!say) return false;
    synth.cancel();
    const h = CAST[id] || CAST.narrator;
    const u = new SpeechSynthesisUtterance(say);
    const v = pick(id);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = Math.min(2, (h.rate || 1) * pace);
    u.pitch = h.pitch || 1;
    let done = false;
    u.onend = u.onerror = () => { if (!done) { done = true; onend && onend(); } };
    synth.speak(u);
    return true;
  }

  // iOS only allows speech that starts inside a tap; a silent first utterance unlocks it.
  function unlock() {
    if (!supported) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ }
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  return {
    supported,
    PACES,
    get on() { return on; },
    setOn(v) { on = !!v && supported; store.set('thedance:voices', on ? 'on' : 'off'); if (!on) this.stop(); },
    get pace() { return pace; },
    cyclePace() { pace = PACES[(PACES.indexOf(pace) + 1) % PACES.length]; store.set('thedance:pace', String(pace)); return pace; },
    speak,
    stop() { if (supported) synth.cancel(); },
    pause() { if (supported && synth.speaking) synth.pause(); },
    resume() { if (supported && synth.paused) synth.resume(); }
  };
})();
