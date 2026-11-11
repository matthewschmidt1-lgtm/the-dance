// The desk's people, and the Play track's episodes. The episode file (episode3.js) adds its
// own people, and stages its scenes: who stands where, what happens on screen, and how
// people react.
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

PP.episodes = [
  {
    id: 'ep3', number: 1, title: `The Circle`, forces: ['incentives', 'relationships'],
    blurb: `Friends, family and the group chat. The games you play with people you can't walk away from.`,
    scenes: ['the-rental', 'the-bill', 'the-date', 'the-loan', 'the-holidays', 'the-parents-house'],
    places: [
      { key: 'trip', name: `The Trip`, theme: `Splitting rooms, splitting bills, and the friend who orders the lobster.`, scenes: ['the-rental', 'the-bill'], preview: 'the-bill' },
      { key: 'chat', name: `The Group Chat`, theme: `Twelve people, one date, and a friend who needs a favor. Again.`, scenes: ['the-date', 'the-loan'], preview: 'the-loan' },
      { key: 'family', name: `The Family`, theme: `Siblings, holidays, and who looks after Mom and Dad.`, scenes: ['the-holidays', 'the-parents-house'], preview: 'the-holidays' }
    ]
  }
];

PP.scenes = {};
