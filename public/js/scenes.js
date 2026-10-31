// Episode 1 staging: who stands where, what happens on screen, and how people react.
// Scenario substance (options, grading, analysis) lives in scenarios.js; this file adds
// the performance layer on top, keyed by scenario id.
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
    id: 'ep1', number: 1, title: `Ordinary Life`,
    blurb: `Three places you already know. Six situations you've probably been in.`,
    scenes: ['wrong-price', 'just-this-once', 'the-spot', 'credit-taker', 'pick-a-side', 'the-fence'],
    places: [
      { key: 'grocery', name: `The Grocery Store`, theme: `Negotiation, customer service, pricing and everyday leverage.`, scenes: ['wrong-price'], preview: 'wrong-price' },
      { key: 'office', name: `The Office`, theme: `Coworkers, credit, competition and personalities.`, scenes: ['just-this-once', 'credit-taker', 'pick-a-side'], preview: 'credit-taker' },
      { key: 'neighborhood', name: `The Neighborhood`, theme: `Boundaries, favors, disagreements and social influence.`, scenes: ['the-spot', 'the-fence'], preview: 'the-spot' }
    ]
  },
  {
    id: 'ep2', number: 2, title: `The Deal`,
    blurb: `Six deals. In most, the other side knows more than you. In one, you're the one who knows.`,
    scenes: ['change-order', 'bidding-war', 'the-offer', 'the-counteroffer', 'used-car', 'trade-in'],
    places: [
      { key: 'home', name: `Your Home`, theme: `Contractors, bids, and the cost of not checking.`, scenes: ['change-order', 'bidding-war'], preview: 'change-order' },
      { key: 'offer', name: `The Offer`, theme: `Salary, deadlines, counteroffers, and what your word is worth.`, scenes: ['the-offer', 'the-counteroffer'], preview: 'the-offer' },
      { key: 'marketplace', name: `The Marketplace`, theme: `Buying and selling when one side knows more than the other.`, scenes: ['used-car', 'trade-in'], preview: 'trade-in' }
    ]
  },
  {
    id: 'ep3', number: 3, title: `The Circle`,
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
  // ───────────────────────────────────────── The Grocery Store
  'wrong-price': {
    env: 'checkout',
    cast: [
      { id: 'maya', spot: 'maya', mood: 'neutral', pose: 'down', wants: `A moving line, and no blame.` },
      { id: 'dev', spot: 'dev', layer: 'far', mood: 'neutral', pose: 'down', wants: `To finish restocking without a fuss.` },
      { id: 'sigh', spot: 'sigh', layer: 'front', mood: 'neutral', pose: 'phone', wants: `To get home. Right now.` }
    ],
    intro: [
      { cam: 'wide', caption: `Hillcrest Market. Tuesday, 5:48 pm. Lane 4.` },
      { cam: 'belt', caption: `The olive oil was $8.49 on the shelf. You're sure. Mostly.` },
      { who: 'maya', mood: 'neutral', say: `Okay… olive oil.` },
      { cam: 'register', caption: `Beep. $11.99.` },
      { who: 'sigh', mood: 'frustrated', act: 'sigh', cam: 'sigh', caption: `The man behind you sighs. It's a sigh with real craftsmanship.` },
      { who: 'maya', mood: 'nervous', act: 'glance', say: `Is… everything okay?` }
    ],
    options: {
      A: { line: `The shelf said $8.49, and I know you can override small amounts. Can you just ring it at that?`, vague: { line: `That's not right. The shelf said $8.49, so that's what I'll pay.` }, preview: `Clear and quick, if the tag was right. Public, and Maya may not be allowed to fix it.`, row: 1,
        outcomes: [
          { col: 0, beats: [
            { who: 'maya', mood: 'nervous', act: 'jump', say: `Oh! Um. Okay. I'll call Dev.` },
            { cam: 'sigh', caption: `Six minutes pass. The lane develops opinions.`, set: { sigh: { mood: 'frustrated', act: 'sigh' } } },
            { who: 'dev', move: { spot: 'dev_near' }, mood: 'neutral', cam: 'wide', caption: `Dev arrives from aisle 9.` },
            { who: 'dev', act: 'nod', say: `Tag's right. I'll override it.` },
            { cam: 'register', screen: '$8.49', caption: `$8.49. You won.`, set: { maya: { mood: 'awkward' } } },
            { who: 'maya', mood: 'awkward', caption: `Maya stares at the register like it betrayed her.` }
          ] },
          { col: 1, beats: [
            { who: 'maya', mood: 'nervous', act: 'jump', say: `Oh! Um. Okay. I'll call Dev.` },
            { cam: 'sigh', caption: `Six minutes pass. The lane develops opinions.`, set: { sigh: { mood: 'frustrated', act: 'sigh' } } },
            { who: 'dev', move: { spot: 'dev_near' }, mood: 'skeptical', cam: 'wide', caption: `Dev arrives from aisle 9, holding a shelf tag.` },
            { who: 'dev', mood: 'skeptical', say: `This tag's for the 500 ml, friend. That's the liter.` },
            { who: 'sigh', mood: 'confident', pose: 'pocket', say: `Called it.` },
            { cam: 'wide', caption: `You pay $11.99 with five people watching.`, set: { maya: { mood: 'awkward' } } }
          ] }
        ] },
      B: { caption: `You let it go and tap your card.`, preview: `No friction and no delay. You never find out who was right.`, row: null,
        outcomes: [
          { beats: [
            { cam: 'register', caption: `$11.99. Approved.` },
            { who: 'maya', mood: 'smile', act: 'nod', say: `Have a good night!` },
            { who: 'sigh', mood: 'neutral', say: `(under his breath) Finally.` }
          ] }
        ] },
      C: { line: `The tag might've been for the smaller bottle. Quick to check, or should I sort it out at the desk?`, vague: { line: `The shelf said $8.49. Is that quick to check, or should I sort it out at the desk?` }, preview: `Gives Maya an easy way to help. Takes a few seconds of the line's time.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'maya', mood: 'surprised', act: 'jump', say: `Oh! Honestly?` },
            { who: 'maya', mood: 'smile', say: `I'll ring it at the shelf price and flag it for Dev. If the tag's wrong, that's on us.` },
            { cam: 'register', screen: '$8.49', caption: `$8.49. Thirty seconds, start to finish.` },
            { who: 'sigh', mood: 'neutral', pose: 'pocket', caption: `Even the man behind you looks mildly impressed.` },
            { who: 'maya', mood: 'happy', say: `Have a good one!` }
          ] },
          { col: 1, beats: [
            { who: 'maya', mood: 'nervous', say: `I'd rather not override it without a check, but the service desk does it in, like, a minute.` },
            { who: 'maya', mood: 'smile', act: 'nod', say: `Sorry about that.` },
            { cam: 'wide', caption: `On the way out, you check the shelf. The $8.49 tag belongs to the 500 ml bottle.` },
            { caption: `You are very glad you asked nicely.` }
          ] }
        ] },
      D: { line: `Could you get a manager, please? I'd like this fixed properly rather than rushed.`, preview: `Brings in someone with authority. Slows everyone down and skips the person in front of you.`, row: 1,
        outcomes: [
          { col: 0, beats: [
            { who: 'maya', mood: 'nervous', act: 'glance', say: `Sure… Dev? Lane four?` },
            { cam: 'sigh', caption: `Four minutes.`, set: { sigh: { mood: 'frustrated', act: 'sigh' } } },
            { who: 'dev', move: { spot: 'dev_near' }, mood: 'frustrated', cam: 'wide', say: `What's going on?` },
            { who: 'dev', mood: 'neutral', say: `…Fine. Override.` },
            { cam: 'register', screen: '$8.49' },
            { who: 'maya', mood: 'sad', caption: `Maya looks like she failed a test nobody told her about.` }
          ] }
        ] },
      E: { caption: `You pay now so the line can move, and keep the receipt.`, preview: `Takes the pressure off the line. Costs you a few minutes later.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'maya', mood: 'smile', say: `Thanks for being patient!` },
            { cam: 'wide', caption: `On the way out, you check the shelf. The tag was right.` },
            { caption: `Customer service refunds the $3.50 in under a minute.` }
          ] },
          { col: 0, beats: [
            { who: 'maya', mood: 'smile', say: `Thanks for being patient!` },
            { cam: 'wide', caption: `On the way out, you check the shelf. The tag belongs to the 500 ml bottle.` },
            { caption: `No refund. Also, no scene.` }
          ] }
        ] }
    },
    matrix: {
      you: `You`, them: `Maya`,
      rows: [`Ask, and make helping easy`, `Push, in front of the line`],
      cols: [`Goes out of her way`, `Does the minimum`],
      cells: [[[3, 3], [1, 2]], [[2, 0], [0, 1]]],
      best: [0, 0],
      note: `Asking calmly makes going out of her way Maya's easiest move. Pushing makes every outcome cost her something, so she protects herself.`
    },
    leverage: {
      you: [`Store pricing policy`, `A calm, reasonable tone`, `Willingness to fix it at the desk`],
      them: [`Discretion over how hard to try`, `The override process`, `Line pressure (works on both of you)`],
      tilt: 5
    },
    links: [['maya', 'dev', 'reports to'], ['sigh', 'maya', 'pressures']]
  },

  // ───────────────────────────────────────── The Office
  'just-this-once': {
    env: 'desks',
    cast: [
      { id: 'dana', spot: 'dana_start', mood: 'smile', pose: 'mug', wants: `The report off her plate, with the least pain.` },
      { id: 'ellen', spot: 'ellen_office', layer: 'far', mood: 'neutral', pose: 'phone', wants: `Work done without having to referee it.` }
    ],
    intro: [
      { cam: 'wide', caption: `Brightline Logistics. Thursday, 4:12 pm.` },
      { cam: 'monitor', caption: `Your own deadline glows at you. The Henley summary, due tomorrow at noon.` },
      { who: 'dana', move: { spot: 'dana' }, cam: 'wide', caption: `Dana appears at your desk, holding a mug like a peace offering.` },
      { who: 'dana', mood: 'smile', say: `Hey! Quick question. Totally fine if not.` },
      { who: 'dana', mood: 'nervous', say: `Any chance you could take the vendor section of the Q3 report? It's due Monday. I'm drowning.` },
      { cam: 'wide', caption: `Third time this quarter. Once she thanked you in the team channel. Once she didn't mention it.` },
      { who: 'dana', mood: 'smile', act: 'lean', say: `You're just so good at the vendor stuff.` },
      { caption: `Maybe flattery. Maybe she means it.` }
    ],
    options: {
      A: { line: `Sure, send it over. I'll make it work.`, preview: `Instant goodwill. Costs you Thursday night, and maybe sets a pattern.`, row: 0,
        outcomes: [{ col: 1, beats: [
          { who: 'dana', mood: 'happy', act: 'jump', say: `You're a lifesaver!` },
          { who: 'dana', move: { spot: 'dana_start' }, cam: 'monitor', caption: `She's gone before you've finished nodding. You look at the Henley file.` },
          { caption: `It is going to be a long night.` }
        ] }] },
      B: { line: `I've covered for you twice this quarter, so I'm going to pass on this one.`, vague: { line: `I can't this time. I've got Henley due Friday.` }, preview: `Protects your deadline. You learn nothing about why she's asking.`, row: 2,
        outcomes: [{ col: 1, beats: [
          { who: 'dana', mood: 'awkward', act: 'glance', say: `Oh! No worries. Totally.` },
          { who: 'dana', move: { spot: 'dana_start' }, cam: 'wide', caption: `At Friday's standup, Dana is noticeably cooler.` }
        ] }] },
      C: { line: `What's involved, and when do you need it? I'm on Henley until Friday noon.`, preview: `Buys you information before you commit. She may hear it as a soft no.`, row: 1,
        outcomes: [
          { col: 0, beats: [
            { who: 'dana', mood: 'thinking', pose: 'thinking', say: `Honestly? The numbers exist. They just need formatting. Two hours, tops.` },
            { you: `Friday afternoon works.` },
            { who: 'dana', mood: 'happy', pose: 'mug', say: `Deal. And I'll cover your Monday standup notes.` },
            { cam: 'wide', caption: `A trade, not a favor. You both know exactly what was agreed.` }
          ] },
          { col: 1, beats: [
            { who: 'dana', mood: 'awkward', act: 'glance', say: `It's… kind of most of the report.` },
            { who: 'dana', mood: 'sad', say: `I'll figure it out.` },
            { cam: 'monitor', caption: `One question just saved your weekend.` }
          ] }
        ] },
      D: { line: `I can, if you ask Ellen to take something off my plate.`, preview: `A fair trade. It depends on Ellen, who avoids these conversations.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { who: 'dana', mood: 'nervous', say: `Ellen? Um. Okay.` },
            { who: 'ellen', mood: 'awkward', pose: 'shrug', cam: 'ellen', say: `You two work it out between you.` },
            { cam: 'monitor', caption: `You end up doing it anyway. A day late.` }
          ] },
          { col: 0, beats: [
            { who: 'dana', mood: 'nervous', say: `Ellen? Um. Okay.` },
            { who: 'ellen', mood: 'smile', cam: 'ellen', say: `Henley can slide to Monday. Fine.` },
            { who: 'dana', mood: 'happy', cam: 'wide', caption: `A fair trade, approved by the person who assigns the work.` }
          ] }
        ] },
      E: { line: `Ellen just gave you that onboarding, didn't she? Want to raise it with her together?`, vague: { line: `Sounds like you're swamped. Want to raise it with Ellen together?` }, preview: `Goes after the real cause. Puts Dana on the spot with her boss.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { who: 'dana', mood: 'nervous', act: 'shake', say: `Oh, no. I don't want Ellen thinking I can't handle it.` },
            { who: 'dana', mood: 'awkward', say: `It's fine! I'll manage.` },
            { cam: 'wide', caption: `She manages. Badly.` }
          ] },
          { col: 0, beats: [
            { who: 'dana', mood: 'thinking', say: `…Yeah. Okay. Maybe.` },
            { who: 'ellen', mood: 'surprised', cam: 'ellen', say: `Both of you? What's wrong?` },
            { cam: 'wide', caption: `Cornered by two people at once, Ellen actually moves the onboarding deadline.` }
          ] }
        ] }
    },
    matrix: {
      you: `You`, them: `Dana`,
      rows: [`Help, no questions`, `Help on clear terms`, `Refuse`],
      cols: [`Reciprocates`, `Takes it for granted`],
      cells: [[[2, 3], [0, 3]], [[3, 3], [2, 1]], [[1, 1], [1, 1]]],
      best: [1, 0],
      note: `Clear terms make reciprocating Dana's best reply. Free help makes taking you for granted cost her nothing, so over many rounds it's the likely outcome.`
    },
    leverage: {
      you: [`Your yes, which has value`, `Your skill with vendor data`, `A real deadline of your own`],
      them: [`Friendship and goodwill`, `Your track record of saying yes`, `A real overload, if it is one`],
      tilt: -4
    },
    links: [['dana', 'ellen', 'reports to']]
  },

  'credit-taker': {
    env: 'conference',
    cast: [
      { id: 'jordan', spot: 'jordan', flip: true, mood: 'confident', pose: 'point', wants: `To look strong before Thursday's review.` },
      { id: 'ellen', spot: 'ellen', mood: 'neutral', pose: 'down', wants: `Capable people and calm meetings.` },
      { id: 'dana', spot: 'dana', mood: 'neutral', pose: 'down', wants: `To stay out of it, unless you've earned her help.` }
    ],
    intro: [
      { cam: 'wide', caption: `Monday, 10:00 am. Conference room B.` },
      { cam: 'screen', caption: `Three days of your work, on the big screen.` },
      { cam: 'footer', caption: `"Prepared by J. Pike." Interesting.` },
      { who: 'jordan', mood: 'confident', say: `So when I modeled the regions, what jumped out was the Q2 freight spike.` },
      { who: 'jordan', mood: 'confident', say: `It really came together over the weekend.`, if: ctx => ctx.type === 'schemer' },
      { who: 'ellen', mood: 'happy', act: 'nod', say: `Really sharp thinking, Jordan.` },
      { who: 'jordan', mood: 'awkward', pose: 'clicker', act: 'glance', caption: `Jordan looks directly at you. He says nothing.` },
      { if: ctx => (ctx.rel.dana || 0) > 0, who: 'dana', mood: 'skeptical', caption: `Dana catches your eye. She knows those slides were yours.` }
    ],
    options: {
      A: { line: `Actually, I built 31 of those 38 slides. The version history shows it. Happy to walk through it.`, vague: { line: `Actually, I built most of that analysis. Happy to walk everyone through how it works.` }, preview: `Corrects the record now. Puts Ellen in an awkward spot and Jordan on the defensive.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { cam: 'wide', caption: `The room goes very quiet.`, set: { ellen: { mood: 'awkward' }, jordan: { mood: 'surprised', act: 'jump' }, dana: { mood: 'surprised' } } },
            { who: 'ellen', mood: 'awkward', say: `Let's… take that offline.` },
            { who: 'jordan', mood: 'frustrated', pose: 'crossed', caption: `Jordan doesn't look at you for the rest of the meeting.` }
          ] },
          { col: 0, beats: [
            { who: 'jordan', mood: 'confident', pose: 'gesture', say: `It was a team effort, obviously.` },
            { who: 'ellen', mood: 'awkward', say: `Right. Moving on.` },
            { cam: 'wide', caption: `You were right. You also looked like you cared more about credit than the work.` }
          ] }
        ] },
      B: { caption: `You say nothing. After the meeting, you catch Jordan in the hallway.`, preview: `Gives Jordan a private way to fix it. Nobody else saw your work today.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { cam: 'jordan', set: { ellen: { mood: 'neutral' } } },
            { who: 'jordan', mood: 'awkward', pose: 'down', act: 'shake', say: `I froze up. I'm sorry. I'll fix it.` },
            { cam: 'wide', caption: `That afternoon, Jordan emails the team crediting your analysis by name.` }
          ] },
          { col: 0, beats: [
            { who: 'jordan', mood: 'frustrated', pose: 'crossed', say: `We're a team. I didn't think it mattered.` },
            { cam: 'ellen', caption: `Nothing changes in Ellen's mind.` }
          ] }
        ] },
      C: { line: `Jordan, should we include the Q2 outliers I flagged when I built the regional model?`, preview: `Puts your work on the record without a fight. Easy to miss if nobody's listening closely.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { who: 'ellen', mood: 'surprised', act: 'jump', say: `You built the model?` },
            { you: `Most of it, yes.` },
            { who: 'ellen', mood: 'smile', say: `Walk us through slide twelve.` },
            { who: 'jordan', mood: 'awkward', pose: 'gesture', say: `…Here.` },
            { cam: 'wide', caption: `Jordan, to his credit, hands you the clicker.` }
          ] },
          { col: 0, beats: [
            { who: 'jordan', mood: 'confident', say: `Great question. We excluded them for consistency.` },
            { who: 'ellen', mood: 'thinking', caption: `The meeting moves on. Your claim is on the record, quietly.` }
          ] }
        ] },
      D: { caption: `You stay quiet, pull the version history, and book fifteen minutes with Ellen.`, vague: { caption: `You stay quiet and book fifteen minutes with Ellen.`, outcomes: [{ beats: [{ who: 'ellen', mood: 'neutral', say: `I'll keep an eye on it.` }, { cam: 'wide', caption: `Without anything to show her, it's your word against Jordan's.` }] }, { beats: [{ who: 'ellen', mood: 'awkward', say: `I'm sure it was a team effort.` }, { cam: 'wide', caption: `You had nothing to show her.` }] }] }, preview: `Slow, and depends on Ellen. Builds a record that outlasts the meeting.`, row: 1,
        outcomes: [
          { col: 1, beats: [
            { who: 'ellen', mood: 'thinking', say: `Thirty-one of thirty-eight slides.` },
            { who: 'ellen', mood: 'smile', say: `I'd assumed it was joint work. Thank you for telling me.` }
          ] },
          { col: 0, beats: [
            { who: 'ellen', mood: 'awkward', say: `I'm sure it was a team effort.` },
            { cam: 'wide', caption: `She changes the subject. You still have the record.` }
          ] }
        ] },
      E: { caption: `You let it go. From now on, your name goes on every slide.`, preview: `Protects next time. Today's credit stays with Jordan.`, row: null,
        outcomes: [{ beats: [
          { who: 'jordan', mood: 'confident', pose: 'point', say: `Next slide.` },
          { who: 'ellen', mood: 'happy', act: 'nod', caption: `Ellen's impression of who drove this project is now set.` }
        ] }] }
    },
    matrix: {
      you: `You`, them: `Jordan`,
      rows: [`Correct him in public`, `Make ownership visible`],
      cols: [`Defends himself`, `Concedes`],
      cells: [[[0, 1], [2, 0]], [[2, 1], [3, 2]]],
      best: [1, 1],
      note: `A public correction makes defending himself Jordan's best reply. Making ownership visible leaves him nothing to fight, so conceding costs him less.`
    },
    leverage: {
      you: [`Version history: 31 of 38 slides`, `You understand the analysis best`],
      them: [`He's holding the clicker`, `Ellen already praised him`, `His review is Thursday`],
      tilt: 5
    },
    links: [['jordan', 'ellen', 'reports to'], ['dana', 'ellen', 'reports to']]
  },

  'pick-a-side': {
    env: 'kitchen',
    cast: [
      { id: 'priya', spot: 'priya', mood: 'frustrated', pose: 'crossed', wants: `The technically right answer.` },
      { id: 'marcus', spot: 'marcus', mood: 'confident', pose: 'hips', wants: `Budget safety. And to win.` },
      { id: 'ellen', spot: 'ellen_office', layer: 'far', mood: 'neutral', pose: 'phone', wants: `A decision that won't hurt her in March.` },
      { id: 'tom', spot: 'tom', mood: 'neutral', pose: 'tablet', wants: `Nothing visible. He just notices.` }
    ],
    intro: [
      { cam: 'wide', caption: `Wednesday. Ellen decides on the scheduling tool Friday.` },
      { who: 'priya', mood: 'frustrated', say: `You see it, right? Patching that tool is throwing good money after bad.` },
      { who: 'marcus', mood: 'confident', say: `Ellen trusts you. A rebuild blows the budget. Back me on Friday.` },
      { cam: 'wide', caption: `They look at each other. Then at you. The coffee machine gurgles into the silence.`, set: { priya: { mood: 'skeptical' }, marcus: { mood: 'skeptical' } } },
      { who: 'ellen', move: { spot: 'ellen_out' }, pose: 'down', cam: 'wide', caption: `Ellen walks past on her way to a meeting.` },
      { who: 'ellen', mood: 'smile', say: `Oh, while I have you. What do you think?` },
      { if: ctx => ctx.flags.danaPattern === 'trade', caption: `Dana mentioned earlier: Ellen usually goes with whatever the room already agrees on.` },
      { if: ctx => (ctx.rel.jordan || 0) < 0, caption: `Jordan has already told Marcus he's on his side.` },
      { who: 'tom', act: 'glance', cam: 'tom', caption: `In the corner, Tom from operations is very busy not listening.` }
    ],
    options: {
      A: { line: `I'm with Priya. Patching it again just delays the rebuild we'll need anyway.`, preview: `Clear and loyal. Turns a technical question into a vote on people.`, row: 0,
        outcomes: [
          { col: 1, beats: [
            { who: 'priya', mood: 'happy', pose: 'down' },
            { who: 'marcus', mood: 'frustrated', act: 'shake', pose: 'crossed' },
            { who: 'ellen', mood: 'thinking', say: `Rebuild it is. Carefully.` }
          ] },
          { col: 1, beats: [
            { who: 'ellen', mood: 'thinking', say: `"Rebuild" sounds expensive.` },
            { who: 'marcus', mood: 'confident', act: 'nod' },
            { who: 'priya', mood: 'sad', cam: 'wide', caption: `Ellen sides with Marcus. You backed the losing side, and Marcus knows it.` }
          ] }
        ] },
      B: { line: `Ellen, the March budget review is what matters here. Patching is the safe call.`, vague: { line: `Marcus has seen more of these projects. I'd trust his call.` }, preview: `Safe with the senior person. Priya hears that facts lost to rank.`, row: 0,
        outcomes: [{ col: 1, beats: [
          { who: 'marcus', mood: 'happy', act: 'nod' },
          { who: 'priya', mood: 'frustrated', say: `Noted.` },
          { cam: 'wide', caption: `Ellen goes with the patch. Ticket volume barely changes.` }
        ] }] },
      C: { line: `They both make good points. I don't think it's my call.`, preview: `No enemies today. Ellen asked, and you didn't answer.`, row: 1,
        outcomes: [{ col: 1, beats: [
          { who: 'ellen', mood: 'sad', say: `Oh. Okay.` },
          { cam: 'wide', caption: `Friday is a stalemate. Ellen delays the decision a month.`, set: { priya: { mood: 'skeptical' }, marcus: { mood: 'skeptical' } } }
        ] }] },
      D: { line: `What if we rebuild the two modules behind most of the tickets now, and the rest after the March budget review?`, vague: { line: `Could we agree on what matters first, then decide? Maybe a partial rebuild.`, outcomes: [{ beats: [{ who: 'ellen', mood: 'thinking', say: `I like that. Come back with specifics.` }, { cam: 'wide', caption: `A week later, the team settles on a phased rebuild.` }] }, { beats: [{ who: 'marcus', mood: 'skeptical', say: `That's a rebuild with extra steps.` }, { who: 'ellen', mood: 'neutral', say: `Let's park it for now.` }] }] }, preview: `Gives both sides part of what they want. Someone may call it a compromise.`, row: 2,
        outcomes: [
          { col: 0, beats: [
            { who: 'ellen', mood: 'surprised', say: `That's… actually a decision I can make.` },
            { who: 'priya', mood: 'smile', pose: 'down', say: `Phased. I can live with that.` },
            { who: 'marcus', mood: 'thinking', pose: 'thinking', say: `And it protects March.` },
            { who: 'marcus', mood: 'smile', pose: 'down', say: `Fine.` },
            { cam: 'wide', caption: `Both of them think it was partly their idea.` }
          ] },
          { col: 1, beats: [
            { who: 'marcus', mood: 'frustrated', say: `That's still a rebuild with extra steps.` },
            { who: 'ellen', mood: 'thinking', say: `Let me sit with the criteria for a week.` },
            { cam: 'wide', caption: `Slower. But the argument is now about evidence, not egos.` }
          ] }
        ] },
      E: { caption: `Later, you give Ellen your view in private, with the full picture of where each of them stands.`, preview: `Ellen gets the full picture. People find out what you repeat.`, row: null,
        outcomes: [{ col: 1, beats: [
          { who: 'ellen', mood: 'smile', say: `That's very helpful to know.` },
          { who: 'marcus', mood: 'frustrated', act: 'glance', cam: 'marcus', caption: `A week later, Ellen repeats something Marcus told you. He figures out where she heard it.` }
        ] }] }
    },
    matrix: {
      you: `You`, them: `Priya & Marcus`,
      rows: [`Pick a person`, `Stay out of it`, `Change the question`],
      cols: [`Engage with the criteria`, `Dig in`],
      cells: [[[1, 0], [1, 1]], [[1, 0], [0, 1]], [[3, 3], [2, 1]]],
      best: [2, 0],
      note: `Picking a person makes digging in the losing side's best reply, so the fight continues. Shared criteria make engaging their best reply, because each of them gets most of what they care about. Priya's and Marcus's payoffs are combined.`
    },
    leverage: {
      you: [`Ellen asked you directly`, `The ticket data`, `Tom's read on March`],
      them: [`Priya: expertise`, `Marcus: seniority and Ellen's ear`],
      tilt: -2
    },
    links: [['priya', 'marcus', 'in conflict'], ['marcus', 'ellen', 'has the ear of'], ['tom', 'ellen', 'advises']]
  },

  // ───────────────────────────────────────── The Neighborhood
  'the-spot': {
    env: 'street',
    cast: [
      { id: 'gary', spot: 'gary', mood: 'smile', pose: 'mug', wants: `Somewhere to park, and to be liked by new neighbors.` },
      { id: 'ruth', spot: 'ruth', mood: 'neutral', pose: 'can', wants: `To know what's going on. Always.` }
    ],
    intro: [
      { cam: 'wide', caption: `Alder Street. Saturday, 8:30 am.` },
      { cam: 'truck', caption: `Four years, you've parked right here. For four days, so has this pickup.` },
      { caption: `You carried the groceries half a block. The eggs survived. Barely.` },
      { who: 'gary', mood: 'happy', pose: 'wave', say: `Morning, neighbor!` },
      { who: 'gary', mood: 'smile', pose: 'mug', say: `Beautiful day, huh?` },
      { who: 'ruth', mood: 'skeptical', act: 'glance', caption: `Across the street, Ruth is watering a plant that does not need watering.` }
    ],
    options: {
      A: { caption: `You tuck a polite note under his wiper, asking him to use his own driveway.`, preview: `Low effort, no confrontation. A note from a stranger can read as an accusation.`, row: 2,
        outcomes: [{ col: 1, beats: [
          { cam: 'truck', caption: `An hour later, the truck is gone.` },
          { who: 'gary', mood: 'skeptical', pose: 'crossed', cam: 'gary', say: `Got your note. Didn't realize you owned the street.` },
          { who: 'ruth', mood: 'surprised', pose: 'down', caption: `Ruth has stopped pretending to water anything.` }
        ] }] },
      B: { line: `Hey, I'm next door. I usually park out front there. Is the truck a temporary thing?`, preview: `Friendly and direct. Awkward if he doesn't take it well.`, row: 0,
        outcomes: [{ col: 0, beats: [
          { who: 'gary', mood: 'surprised', act: 'jump', say: `Oh no! Sorry! My driveway's being resealed. It's done Tuesday.` },
          { who: 'gary', mood: 'awkward', say: `I had no idea there was a system.` },
          { who: 'gary', mood: 'happy', pose: 'mug', say: `Want a coffee? I just made a pot.` },
          { who: 'ruth', mood: 'smile', act: 'nod', caption: `Ruth nods approvingly. This will be all over the street by lunch.` }
        ] }, { col: 0, beats: [
          { who: 'gary', mood: 'skeptical', pose: 'mug', say: `It's a public street, you know. But fine. Driveway's done Tuesday.` },
          { cam: 'wide', caption: `Not the warmest start. Still, you know the facts, and it cost you one minute.` }
        ] }] },
      C: { caption: `It's a public street. You park in front of Gary's house. Fair's fair.`, vague: { caption: `You park in front of Gary's house. That'll show him.` }, preview: `Makes the point without a word. Only works if he knows what the point is.`, row: 2,
        outcomes: [{ col: 1, beats: [
          { who: 'gary', mood: 'thinking', pose: 'thinking', say: `…Huh.` },
          { cam: 'wide', caption: `Gary doesn't get the point. He just thinks you're a bit strange.` },
          { who: 'ruth', mood: 'skeptical', caption: `Ruth saw everything. Ruth always sees everything.` }
        ] }] },
      D: { caption: `You say nothing. It's only a week, so you park down the block.`, vague: { caption: `You say nothing and park down the block.` }, preview: `No friction now. If it isn't temporary, the resentment builds quietly.`, row: 1,
        outcomes: [{ col: 0, beats: [
          { who: 'gary', mood: 'smile', pose: 'wave', say: `Have a good one!` },
          { cam: 'truck', caption: `On Wednesday, the truck moves back to Gary's driveway. Problem solved itself. This time.` }
        ] }] },
      E: { caption: `You ask on the neighborhood app who owns the white truck.`, preview: `Finds out who he is without a confrontation. It happens in public, before you've met.`, row: 2,
        outcomes: [{ col: 1, beats: [
          { cam: 'truck', caption: `Twenty-two replies. Someone posts a photo of the truck.` },
          { who: 'gary', mood: 'sad', pose: 'phone', cam: 'gary', say: `Saw the post.` },
          { who: 'gary', mood: 'frustrated', caption: `He's new to the street, and to the app. He saw it.` }
        ] }] }
    },
    matrix: {
      you: `You`, them: `Gary`,
      rows: [`Ask directly`, `Stay silent`, `Escalate (note, post, payback)`],
      cols: [`Cooperates`, `Gets defensive`],
      cells: [[[3, 3], [1, 1]], [[2, 3], [0, 2]], [[2, 0], [0, 1]]],
      best: [0, 0],
      note: `Asking makes cooperating Gary's easiest reply. Escalating makes him defensive even when he moves the truck, and you'll live next to that.`
    },
    leverage: {
      you: [`Four years on the block`, `Goodwill, if you use it`, `Ruth knows you`],
      them: [`A legal right to park on a public street`, `Being new earns sympathy`],
      tilt: 2
    },
    links: [['ruth', 'gary', 'watches']]
  },

  'the-fence': {
    env: 'yard',
    cast: [
      { id: 'gary', spot: 'gary', mood: 'neutral', pose: 'down', wants: `A fence his dog can't clear.` },
      { id: 'ruth', spot: 'ruth', mood: 'smile', pose: 'can', wants: `A peaceful street, and the full story.` }
    ],
    intro: [
      { cam: 'wide', caption: `Three months later. The side yard.` },
      { if: ctx => (ctx.rel.gary || 0) >= 1, who: 'gary', mood: 'happy', pose: 'plate', say: `Brought tamales. My sister's. Also, I have a favor to ask.` },
      { if: ctx => (ctx.rel.gary || 0) <= -1, caption: `An email arrives. Subject: "Regarding the Shared Boundary." Then Gary appears.`, set: { gary: { mood: 'skeptical', pose: 'crossed' } } },
      { if: ctx => (ctx.rel.gary || 0) <= -1, who: 'gary', say: `Did you get my email?` },
      { if: ctx => (ctx.rel.gary || 0) === 0, who: 'gary', mood: 'neutral', say: `Got a minute? It's about the fence.` },
      { cam: 'fence', caption: `The old fence leans like it has given up on life.` },
      { who: 'gary', act: 'lean', say: `Six-foot cedar. Forty-eight hundred. Split it fifty-fifty?` },
      { caption: `You'd have been fine with a $600 repair.` },
      { cam: 'dog', caption: `Behind the fence, a very large dog studies it with professional interest.` }
    ],
    options: {
      A: { line: `Sure, fifty-fifty sounds fair. Let's get it done.`, preview: `Keeps the peace and gets it done. You pay half of an upgrade you may not need.`, row: 0,
        outcomes: [{ col: 0, beats: [
          { who: 'gary', mood: 'happy', act: 'jump', say: `Great! I'll call the guy.` },
          { cam: 'dog', caption: `It's a very nice fence. It mostly solves Gary's dog problem.` }
        ] }] },
      B: { line: `County guidance says upgrades get negotiated separately. If you want six-foot cedar, it's on you.`, vague: { line: `The old fence works fine for me. If you want a new one, I'd expect you to cover it.` }, preview: `Might save you $2,400. Gary might wait you out.`, row: 1,
        outcomes: [
          { col: 0, beats: [
            { who: 'gary', mood: 'frustrated', pose: 'crossed', say: `Right. Okay.` },
            { cam: 'fence', caption: `Gary pays for all of it. Six feet, beautiful, free to you. Every time you see it, you'll both remember this.` }
          ] },
          { col: 1, beats: [
            { who: 'gary', mood: 'skeptical', pose: 'crossed', say: `Then I guess we both wait.` },
            { cam: 'fence', caption: `Nobody builds anything. In June, the old fence falls over.` },
            { cam: 'garden', caption: `The dog finds your garden.` }
          ] }
        ] },
      C: { line: `Let's split a basic four-foot fence. If you want six-foot cedar for the dog, you cover the rest.`, vague: { line: `Let's split a basic four-foot fence. If you want six-foot cedar, you cover the rest.`, outcomes: [{ beats: [{ who: 'gary', mood: 'thinking', say: `Pine's twenty-two hundred… fine.` }, { cam: 'wide', caption: `He agrees, though he thinks you're being a bit tight.` }] }, { beats: [{ who: 'gary', mood: 'frustrated', say: `It's not a luxury. It's for the dog.` }, { cam: 'wide', caption: `He pays the difference, but it leaves a mark.` }] }] }, preview: `Pays for what you both need, and no more. He may have expected an even split.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'gary', mood: 'thinking', pose: 'thinking', say: `Pine's twenty-two hundred…` },
            { who: 'gary', mood: 'happy', pose: 'down', say: `Yeah. The dog's my problem. That's fair.` },
            { cam: 'wide', caption: `You pay $1,100. Gary pays for the cedar he actually wants.` }
          ] },
          { col: 0, beats: [
            { who: 'gary', mood: 'surprised', say: `Oh. I thought we'd split it.` },
            { cam: 'dog', caption: `By the weekend, he comes around.` },
            { who: 'gary', mood: 'smile', say: `Honestly? That's fair.` }
          ] }
        ] },
      D: { caption: `"Let me think about it and get back to you." Then you never do.`, preview: `No awkward conversation today. Silence is still an answer.`, row: 1,
        outcomes: [{ col: 1, beats: [
          { caption: `Three weeks of silence.` },
          { who: 'gary', mood: 'sad', say: `Guess that's a no, then.` },
          { cam: 'garden', caption: `In June the old fence falls. The dog finds your garden.` }
        ] }] },
      E: { caption: `You ask Ruth to help you and Gary work it out.`, preview: `Brings in someone fair. Can feel like an ambush.`, row: 0,
        outcomes: [
          { col: 0, beats: [
            { who: 'ruth', mood: 'smile', say: `Last fence on this street cost twenty-one hundred. Each of you pays for what you want.` },
            { who: 'gary', mood: 'smile', act: 'nod', say: `Can't argue with Ruth.` }
          ] },
          { col: 0, beats: [
            { who: 'gary', mood: 'skeptical', pose: 'crossed', say: `I didn't think we needed a referee.` },
            { cam: 'fence', caption: `The deal gets done. Stiffly.` }
          ] }
        ] }
    },
    matrix: {
      you: `You`, them: `Gary`,
      rows: [`Chip in your share`, `Hold out, let Gary pay`],
      cols: [`Chips in`, `Holds out`],
      cells: [[[3, 3], [0, 4]], [[4, 0], [1, 1]]],
      best: [0, 0],
      eq: [1, 1],
      note: `Played once, holding out is each person's best move whatever the other does, so you both land in the stable cell: no fence, and a dog in your garden. Both chipping in is better for both. Only the years of being neighbors make it hold.`
    },
    leverage: {
      you: [`Shared responsibility for the boundary`, `You don't need six feet`, `Years of future favors`],
      them: [`A real need (the dog)`, `A quote in hand`, `Goodwill you've built, or haven't`],
      tilt: 0
    },
    links: [['ruth', 'gary', 'neighbors with']]
  },
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
