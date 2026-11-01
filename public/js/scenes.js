// People, episodes, and staging for The Change Order and The Offer: who stands where,
// what happens on screen, and how people react. Substance lives in scenarios.js; the
// other scenes stage themselves in episode1.js, episode2.js and episode3.js.
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
  maya:   { name: `Maya`,   look: { skin: '#b07a55', hair: 'ponytail', hairColor: '#2a1b14', top: 'apron', shirt: '#e8e1d4', apron: '#2f6a52', pants: '#2d2f36', build: 0.92, h: 0.97, badge: 'MAYA' } },
  dev:    { name: `Dev`,    look: { skin: '#d9a982', hair: 'short', hairColor: '#4b3426', top: 'polo', topColor: '#2f6a52', pants: '#3a3f47', facial: 'stubble', lanyard: true } },
  sigh:   { name: `The man behind you`, short: `Man in line`, look: { skin: '#e3b896', hair: 'sidepart', hairColor: '#6b5b4b', top: 'blazer', topColor: '#5b6168', shirt: '#cfd8e3', pants: '#30343b', facial: 'beard', build: 1.08 } },
  dana:   { name: `Dana`,   look: { skin: '#c48b64', hair: 'curly', hairColor: '#2a1a12', top: 'cardigan', topColor: '#c49a3a', shirt: '#f1ece2', pants: '#3b3f4a', build: 0.95, h: 0.96, mug: '#d36f4f' } },
  ellen:  { name: `Ellen`,  look: { skin: '#f0cfb4', hair: 'bob', hairColor: '#a7a39e', iris: '#4a6b8a', top: 'blazer', topColor: '#2c3e5c', shirt: '#e9edf2', glasses: true, pants: '#2c3e5c' } },
  gary:   { name: `Gary`,   look: { skin: '#e2b48f', hair: 'buzz', hairColor: '#7a5b3e', facial: 'beard', top: 'flannel', topColor: '#8a3b32', check: '#2a2420', pants: '#4a5a6e', build: 1.12, h: 1.03 } },
  ruth:   { name: `Ruth`,   look: { skin: '#7a4b33', hair: 'bun', hairColor: '#d9d6d1', top: 'cardigan', topColor: '#7d6a9e', shirt: '#f2efe9', glasses: true, skirt: '#4a4458', h: 0.93 } },
  jordan: { name: `Jordan`, look: { skin: '#e9c3a0', hair: 'sidepart', hairColor: '#3b2a1e', iris: '#4f6b3a', top: 'blazer', topColor: '#3f4650', shirt: '#ffffff', pants: '#3f4650', h: 1.02 } },
  priya:  { name: `Priya`,  look: { skin: '#a8714f', hair: 'long', hairColor: '#140e0b', top: 'blazer', topColor: '#1f6f6a', shirt: '#f4efe7', pants: '#25282e', h: 0.97 } },
  marcus: { name: `Marcus`, look: { skin: '#5a3a28', hair: 'bald', hairColor: '#1a1210', facial: 'beard', top: 'sweater', topColor: '#2e3a55', shirt: '#e9edf2', pants: '#3a3530', build: 1.12, h: 1.04 } },
  luis:   { name: `Luis`,   look: { skin: '#b98a63', hair: 'short', hairColor: '#2a1d15', facial: 'stubble', top: 'tshirt', shirt: '#5b6b78', pants: '#4a5a6e', shoes: '#3a2e24', build: 1.1, h: 1.0 } },
  sam:    { name: `Sam`,    look: { skin: '#e8bfa0', hair: 'bob', hairColor: '#6b4a2e', top: 'blazer', topColor: '#3b4a5e', shirt: '#f2f2ee', pants: '#2a2f36', h: 0.97 } },
  alicia: { name: `Alicia`, look: { skin: '#8a5a3c', hair: 'long', hairColor: '#2a1c14', glasses: true, top: 'sweater', topColor: '#7a4f3c', shirt: '#ece5d9', pants: '#2f3338', h: 1.0 } },
  theo:   { name: `Theo`,   look: { skin: '#e0b896', hair: 'bald', hairColor: '#b9b4ab', facial: 'beard', top: 'sweater', topColor: '#4a4f45', shirt: '#d9d4c8', glasses: true, pants: '#2e3136', build: 1.06, h: 1.0 } },
  nadia:  { name: `Nadia`,  look: { skin: '#7a4f36', hair: 'bun', hairColor: '#17110d', top: 'blazer', topColor: '#2b2f36', shirt: '#e8e4dc', pants: '#2b2f36', h: 0.98 } },
  tom:    { name: `Tom`,    look: { skin: '#d8b08c', hair: 'short', hairColor: '#9a7b55', glasses: true, top: 'sweater', topColor: '#6b7a5a', pants: '#4a4a46', h: 0.98 } }
};

PP.episodes = [
  {
    id: 'ep1', number: 1, title: `Ordinary Life`, forces: ['power', 'relationships'],
    blurb: `Three places you already know. Six situations you've probably been in.`,
    scenes: ['wrong-price', 'just-this-once', 'the-spot', 'credit-taker', 'pick-a-side', 'the-fence'],
    places: [
      { key: 'grocery', name: `The Grocery Store`, theme: `Negotiation, customer service, pricing and everyday leverage.`, scenes: ['wrong-price'], preview: 'wrong-price' },
      { key: 'office', name: `The Office`, theme: `Coworkers, credit, competition and personalities.`, scenes: ['just-this-once', 'credit-taker', 'pick-a-side'], preview: 'credit-taker' },
      { key: 'neighborhood', name: `The Neighborhood`, theme: `Boundaries, favors, disagreements and social influence.`, scenes: ['the-spot', 'the-fence'], preview: 'the-spot' }
    ]
  },
  {
    id: 'ep2', number: 2, title: `The Deal`, forces: ['incentives', 'information'],
    blurb: `Six deals. In most, the other side knows more than you. In one, you're the one who knows.`,
    scenes: ['change-order', 'bidding-war', 'the-offer', 'the-counteroffer', 'used-car', 'trade-in'],
    places: [
      { key: 'home', name: `Your Home`, theme: `Contractors, bids, and the cost of not checking.`, scenes: ['change-order', 'bidding-war'], preview: 'change-order' },
      { key: 'offer', name: `The Offer`, theme: `Salary, deadlines, counteroffers, and what your word is worth.`, scenes: ['the-offer', 'the-counteroffer'], preview: 'the-offer' },
      { key: 'marketplace', name: `The Marketplace`, theme: `Buying and selling when one side knows more than the other.`, scenes: ['used-car', 'trade-in'], preview: 'trade-in' }
    ]
  },
  {
    id: 'ep3', number: 3, title: `The Circle`, forces: ['incentives', 'relationships'],
    blurb: `Friends, family and the group chat. The games you play with people you can't walk away from.`,
    scenes: ['the-rental', 'the-bill', 'the-date', 'the-loan', 'the-holidays', 'the-parents-house'],
    places: [
      { key: 'trip', name: `The Trip`, theme: `Splitting rooms, splitting bills, and the friend who orders the lobster.`, scenes: ['the-rental', 'the-bill'], preview: 'the-bill' },
      { key: 'chat', name: `The Group Chat`, theme: `Twelve people, one date, and a friend who needs a favor. Again.`, scenes: ['the-date', 'the-loan'], preview: 'the-loan' },
      { key: 'family', name: `The Family`, theme: `Siblings, holidays, and who looks after Mom and Dad.`, scenes: ['the-holidays', 'the-parents-house'], preview: 'the-holidays' }
    ]
  }
];

PP.scenes = {
  // ───────────────────────────────────────── Episode 2: The Deal
  'change-order': {
    env: 'bathroom',
    cast: [
      { id: 'luis', spot: 'luis', mood: 'neutral', pose: 'hips', wants: `To keep his crew busy and get paid for real work.` }
    ],
    intro: [
      { cam: 'wide', caption: `Your bathroom. Wednesday, 7:40 am. There is no floor.` },
      { who: 'luis', mood: 'neutral', say: `Morning. Got some news, and you're not going to love it.` },
      { cam: 'rot', caption: `Under the old tile, a dark, soft patch of plywood spreads out from the toilet flange.` },
      { who: 'luis', mood: 'confident', pose: 'gesture', say: `Rot in the subfloor. It's another twenty-six hundred.` },
      { who: 'luis', mood: 'confident', say: `Could be more once we open it up. Hard to say.`, if: ctx => ctx.type === 'padder' },
      { who: 'luis', mood: 'neutral', pose: 'hips', say: `I need to know today. If I can't start this, my crew moves to another job and we're back in three weeks.` },
      { cam: 'wide', caption: `Your bid was a fixed $14,000. Your bathroom has no floor.` }
    ],
    options: {
      A: { line: `I've seen the rot myself, and it's real. Go ahead, and keep the crew here.`, vague: { line: `Go ahead. I trust you, and I need the crew here.` }, preview: `Keeps the schedule. You never see what you're paying for.`, row: 1,
        outcomes: [
          { col: 0, beats: [
            { who: 'luis', mood: 'smile', act: 'nod', say: `You got it.` },
            { cam: 'wide', caption: `The work is done well. The invoice says $2,600, itemized nowhere. It was probably fair. You'll never know.` }
          ] },
          { col: 1, beats: [
            { who: 'luis', mood: 'smile', act: 'nod', say: `Appreciate it.` },
            { cam: 'rot', caption: `Weeks later, a friend in construction looks at your photos: "Documented, that's about $1,900."` }
          ] }
        ] },
      B: { line: `The bid was fixed, so the rot is your cost, not mine.`, preview: `Holds the line on price. Only as strong as your contract.`, row: 2,
        outcomes: [
          { col: 0, beats: [
            { who: 'luis', mood: 'skeptical', pose: 'crossed', say: `Section seven of the contract says otherwise.` },
            { who: 'luis', mood: 'frustrated', say: `Then we'll be back in three weeks.` },
            { cam: 'wide', caption: `Your bathroom stays open for three weeks.` }
          ] }
        ] },
      C: { line: `Show me the damage and send a written change order, itemized. I can sign tonight.`, vague: { line: `Show me the damage, and send me the cost in writing. I'll decide tonight.` }, preview: `Meets his deadline and keeps your right to check. Costs you an evening.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'luis', mood: 'surprised', say: `Fair. Come take a look.` },
            { who: 'luis', pose: 'gesture', mood: 'neutral', cam: 'rot', caption: `He shows you the soft boards and how far the damage runs.` },
            { cam: 'wide', caption: `At 4 pm the change order arrives: $1,940, at cost plus 15%. You sign it at 6.` }
          ] },
          { col: 0, beats: [
            { who: 'luis', mood: 'smile', act: 'nod', say: `Fair enough.` },
            { cam: 'wide', caption: `The itemized order comes in at $2,550. Expensive, but real. You approve it knowing exactly what you're paying for.` }
          ] }
        ] },
      D: { line: `I'd like a second opinion from another contractor before I approve anything extra.`, preview: `Real information. It may cost you the crew and weeks.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'luis', mood: 'neutral', pose: 'shrug', say: `Your call. My crew's gone tomorrow.` },
            { cam: 'wide', caption: `The second contractor comes Monday and says the price is fair. You lost three weeks to save nothing.` }
          ] },
          { col: 1, beats: [
            { who: 'luis', mood: 'frustrated', pose: 'crossed', say: `…Fine. Two thousand.` },
            { cam: 'wide', caption: `The second opinion said $1,500 was reasonable. Luis comes down to $2,000, and the job slips nine days.` }
          ] }
        ] },
      E: { line: `Do it at the original price, or I'll have to leave an honest review about how this went.`, preview: `Pressure on price. Only works if he believes you'd follow through.`, row: 2,
        outcomes: [
          { col: 0, beats: [
            { who: 'luis', mood: 'frustrated', pose: 'crossed', act: 'shake', say: `Then we'll finish the contracted work only.` },
            { cam: 'rot', caption: `He tiles over the documented rot, with your refusal in writing.` }
          ] }
        ] }
    },
    matrix: {
      you: `You`, them: `Luis`,
      rows: [`Verify, then approve in writing`, `Approve on the spot`, `Refuse or threaten`],
      cols: [`Documents honestly`, `Pads the bill`],
      cells: [[[3, 3], [2, 0]], [[2, 3], [0, 4]], [[1, 1], [0, 0]]],
      best: [0, 0],
      note: `Checking costs you a few minutes and makes padding a losing move for Luis, so honest documentation becomes his best reply. Approving on the spot makes padding pay.`
    },
    leverage: {
      you: [`Section 7: nothing proceeds without your written approval`, `You can see the floor yourself`, `A contract that spells out the process`],
      them: [`He knows subfloors and you don't`, `Your bathroom has no floor`, `A crew deadline you can't verify`],
      tilt: 3
    },
    links: []
  },

  'the-offer': {
    env: 'lobby',
    cast: [
      { id: 'sam', spot: 'sam', mood: 'smile', pose: 'tablet', wants: `To fill the role quickly, within budget.` },
      { id: 'alicia', spot: 'alicia', mood: 'neutral', pose: 'down', wants: `The right person in the seat before November.` }
    ],
    intro: [
      { cam: 'wide', caption: `Northfield Systems. Tuesday, 3:00 pm. The lobby.` },
      { who: 'sam', mood: 'happy', say: `We're excited about you. The offer is ninety-two thousand.` },
      { who: 'sam', mood: 'smile', say: `We'd love an answer by Friday.` },
      { who: 'alicia', mood: 'smile', act: 'nod', say: `Honestly, we need someone in place before the November launch.` },
      { cam: 'wide', caption: `You make $85,000 now. You have a second interview elsewhere next week, but no offer.` }
    ],
    options: {
      A: { line: `That sounds great. I'm happy to accept.`, preview: `Certain and friendly. Leaves whatever room there was on the table.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { who: 'sam', mood: 'happy', act: 'jump', say: `Wonderful. Welcome aboard!` },
            { who: 'alicia', mood: 'smile', act: 'nod' },
            { cam: 'wide', caption: `You start at $92,000. Six months later you learn a peer hired the same month started at $101,000.` }
          ] }
        ] },
      B: { line: `I have another offer at $105,000. Can you match it so I can say yes to you?`, preview: `Strong pressure on the number. Only as good as your ability to back it up.`, row: 2,
        outcomes: [
          { col: 1, beats: [
            { who: 'sam', mood: 'skeptical', say: `Could you share that offer in writing? So we can move quickly.` },
            { who: 'alicia', mood: 'skeptical', act: 'glance', cam: 'wide', caption: `You can't. The conversation gets a lot cooler.` }
          ] },
          { col: 0, beats: [
            { who: 'sam', mood: 'thinking', pose: 'thinking', say: `Let me check.` },
            { who: 'alicia', mood: 'neutral', say: `We can do a hundred and one.` },
            { cam: 'wide', caption: `You won. You also started a job with a story you'll have to keep straight.` }
          ] }
        ] },
      C: { line: `I'm excited about this. Your posted range goes to 110, and I can start before your launch. Could we do 102, and decide by Tuesday?`, vague: { line: `I'm excited about this. Is there any room on the number, something closer to a hundred?`, outcomes: [{ beats: [{ who: 'sam', mood: 'thinking', say: `Let me see what I can do.` }, { who: 'sam', mood: 'smile', say: `Ninety-six.` }, { cam: 'wide', caption: `Better than ninety-two. You never mentioned their posted range.` }] }, { beats: [{ who: 'sam', mood: 'neutral', say: `I can get you to ninety-four.` }, { cam: 'wide', caption: `Without a reason Sam could take to Alicia, that was all there was.` }] }] }, preview: `Asks for more without a fight. They might hold firm.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'sam', mood: 'thinking', say: `Let me talk to Alicia.` },
            { who: 'alicia', mood: 'smile', say: `Ninety-nine, plus a three-thousand signing bonus. And Tuesday's fine.` },
            { cam: 'wide', caption: `Real numbers, a real alternative, and something they needed. Everyone leaves happy.` }
          ] },
          { col: 1, beats: [
            { who: 'sam', mood: 'neutral', say: `Ninety-six is our ceiling this cycle, with a review at six months.` },
            { cam: 'wide', caption: `Less than you asked for, more than you had. You decide with full information.` }
          ] }
        ] },
      D: { line: `You need someone before launch, and I can start right away. To make the move I'd need $115,000.`, vague: { line: `To make the move worthwhile I'd need $115,000. Otherwise I'm happy staying where I am.` }, preview: `A clear number. You have to be ready to walk away.`, row: 2,
        outcomes: [
          { col: 1, beats: [
            { who: 'sam', mood: 'awkward', say: `That's above our posted range. We'll keep you in mind for future roles.` },
            { who: 'alicia', mood: 'surprised', cam: 'wide', caption: `The offer is gone. Your current employer doesn't know you were looking. Yet.` }
          ] },
          { col: 0, beats: [
            { who: 'alicia', mood: 'skeptical', say: `We can't go above 110. A hundred and five. I'll be honest, the tone surprised me.` },
            { cam: 'wide', caption: `You got more money and a slightly awkward start.` }
          ] }
        ] },
      E: { line: `Thank you, this is exciting. Could I have until next Wednesday to think it through properly?`, preview: `More time. Only useful if it changes what you know or what you can choose.`, row: null,
        outcomes: [
          { beats: [
            { who: 'sam', mood: 'neutral', say: `We can do Monday.` },
            { cam: 'wide', caption: `More time, same number. The other company doesn't make an offer.` }
          ] }
        ] }
    },
    matrix: {
      you: `You`, them: `Northfield`,
      rows: [`Ask, with real data`, `Accept as is`, `Bluff or ultimatum`],
      cols: [`Negotiates in good faith`, `Holds firm`],
      cells: [[[3, 3], [2, 2]], [[1, 3], [1, 3]], [[2, 1], [0, 0]]],
      best: [0, 0],
      note: `Asking with their own range and their own deadline makes good-faith negotiating their best reply. A bluff or ultimatum gives them every reason to hold firm or walk.`
    },
    leverage: {
      you: [`Their posted range: $88,000 to $110,000`, `They need someone before November`, `You can start quickly`],
      them: [`They set the deadline`, `Your alternative isn't an offer yet`, `They may have other candidates`],
      tilt: 1
    },
    links: [['sam', 'alicia', 'recruits for']]
  }
};
