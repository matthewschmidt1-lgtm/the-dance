// The desk's people, and the Play track's episodes (none right now: the site is The Trader's Mind).
// An episode file adds its own people and stages its scenes: who stands where, what happens on
// screen, and how people react.
//
// Beat fields (all optional):
//   caption   on-screen narration         cam      'wide' | actor id | env camera name
//   who/say   a line of dialogue          you      a line spoken by the player
//   mood, pose, act, move                 applied to `who`
//   set       { id: { mood, pose, act, move } } for anyone else
//   screen    new text for the register display
//   if        fn(ctx) → boolean; beat is skipped when false
window.PP = window.PP || {};

PP.people = {
  theo:   { name: `Theo`,   look: { skin: '#e0b896', hair: 'bald', hairColor: '#b9b4ab', facial: 'beard', top: 'sweater', topColor: '#4a4f45', shirt: '#d9d4c8', glasses: true, pants: '#2e3136', build: 1.06, h: 1.0 } },
  nadia:  { name: `Nadia`,  look: { skin: '#7a4f36', hair: 'bun', hairColor: '#17110d', top: 'blazer', topColor: '#2b2f36', shirt: '#e8e4dc', pants: '#2b2f36', h: 0.98 } }
};

PP.episodes = [];

PP.scenes = {};
