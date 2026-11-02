// Episode 1, Ordinary Life: substance, staging and verdicts for each scene, together.
// Every scene has hidden types, so the best move depends on who you're dealing with.
// Some clues cost something to read (cost: { note, rel, flags }), and Gary is the same
// person in The Spot and The Fence (share: 'gary').
window.PP = window.PP || {};

(function () {
  const has = (ctx, ...i) => i.every(k => ctx.clues.includes(k));
  const any = (ctx, ...i) => i.some(k => ctx.clues.includes(k));
  const rel = (ctx, who) => (ctx.rel && ctx.rel[who]) || 0;
  const add = (scenario, stage, verdicts) => {
    PP.scenarios.push(scenario);
    PP.scenes[scenario.id] = stage;
    PP.insight.scenes[scenario.id] = { options: verdicts };
  };

  // ─────────────────────────────────────────── The Wrong Price
  // Maya is a rookie or a veteran, and the tag was right or wrong.
  const rookie = c => c.type.startsWith('rookie');
  const tagRight = c => c.type.endsWith('right');
  add({
    id: 'wrong-price',
    level: `Everyday decisions`,
    arena: `The marketplace`,
    title: `The Wrong Price`,
    lens: ['duke', 'schelling'],
    setting: `Hillcrest Market · Tuesday, 5:48 pm · Lane 4`,
    types: [
      { id: 'rookie-right', p: 0.33, who: `Maya`, label: `Maya was new, and the tag was right`, tell: `It was her ninth day. Every void she rings goes on her error report, and she's on a 30-day review. The $8.49 tag really was for the liter.` },
      { id: 'rookie-wrong', p: 0.22, who: `Maya`, label: `Maya was new, and the tag was wrong`, tell: `It was her ninth day, with every void on her error report. And the $8.49 tag was for the 500 ml bottle on the shelf below.` },
      { id: 'veteran-right', p: 0.27, who: `Maya`, label: `Maya was a veteran, and the tag was right`, tell: `Three years on the registers. She voids things all day without a second thought. The $8.49 tag really was for the liter.` },
      { id: 'veteran-wrong', p: 0.18, who: `Maya`, label: `Maya was a veteran, and the tag was wrong`, tell: `Three years on the registers. And the $8.49 tag was for the 500 ml bottle on the shelf below.` }
    ],
    cast: [
      { name: `Maya`, role: `Cashier`, archetype: `Unclear`, power: `Discretion`, note: `Can void items and apply store policy. Whether that costs her anything is another question.` },
      { name: `Dev`, role: `Shift lead`, archetype: `The Gatekeeper`, power: `Formal authority`, note: `Holds the override code. Restocking aisle 9.` },
      { name: `The man behind you`, role: `Shopper`, archetype: `The Competitor`, power: `Social pressure`, note: `No authority at all, but his impatience is already shaping the room.` }
    ],
    known: [`The register says $11.99.`, `You remember a shelf tag reading $8.49.`, `Five people are in line behind you.`],
    unknown: [`Whether the tag was for this exact bottle.`, `What fixing it would cost Maya.`, `What the store's own policy says.`],
    clues: [
      { label: `Read the sign taped to the register`, text: `"SCANNER PROMISE. If an item scans higher than the shelf price, the first one is free." If the tag was right, the bottle is free, not $3.50 off.` },
      { label: `Watch Maya with the customer ahead of you`, text: c => rookie(c) ? `She freezes over a coupon, calls Dev, and apologizes twice. A card taped by her drawer says "Day 9! You've got this!"` : `She voids a double scan without blinking and jokes with the customer about the weather. Her badge has three service stars.` },
      { label: `Walk back to aisle 6 and check the shelf`, cost: { note: `the line waits two minutes, and it will remember.` }, text: c => tagRight(c) ? `The $8.49 tag sits right under the 1-liter bottles. You were right.` : `The $8.49 tag is for the 500 ml bottles on the shelf below. The liter is $11.99. You were wrong.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `"The shelf said $8.49, so the Scanner Promise applies, right? It says the first one's free."`,
        needs: [0], vague: { text: `"The shelf said $8.49. Can you ring it at that?"`, q: c => has(c, 2) && !tagRight(c) ? 0 : 2,
          their: c => rookie(c) ? `Maya can't override a price without calling Dev, and on day nine she isn't going to try. You got a slow lane and a nervous cashier.` : `Maya can fix a price in two seconds, and she did, if the tag was right.`,
          outcomes: [
            { p: c => tagRight(c) ? (rookie(c) ? 0.6 : 0.9) : 0.1, tone: c => tagRight(c) ? (rookie(c) ? 'mixed' : 'good') : 'mixed', text: c => tagRight(c) ? (rookie(c) ? `Maya calls Dev. Five minutes later he confirms the tag and overrides it. You saved $3.50, and never heard about the promise.` : `Maya rings it at $8.49 without a fuss. You never asked about the sign, so you paid $8.49 for a free bottle.`) : `Maya overrides it without checking. You got the 500 ml price on a liter. Nobody noticed, this time.` },
            { p: c => tagRight(c) ? (rookie(c) ? 0.4 : 0.1) : 0.9, tone: 'bad', text: c => tagRight(c) ? `Maya calls Dev, who is "on his way" for nine minutes. You pay $11.99 to end it and sort it out later.` : `Dev arrives with the tag: it was for the 500 ml bottle. You pay $11.99, with five people watching.` }
          ] },
        their: c => tagRight(c) ? (rookie(c) ? `The policy was real and you were right. Applying it put a void on the error report of a cashier on her ninth day, with the line watching. She'll remember who did that.` : `Maya applies that policy every day. You were right, you knew the rule, and she didn't mind at all.`) : `You invoked a policy on a tag you hadn't checked. It was for the smaller bottle, so you were asking for a free bottle you weren't owed, in public.`,
        q: c => !tagRight(c) ? (has(c, 2) ? 0 : 1) : rookie(c) ? (has(c, 1) ? 1 : 3) : 4,
        s: { bnd: 2, inf: 1, com: -1 }, flags: c => ({ mayaRookie: rookie(c) }),
        outcomes: [
          { p: c => tagRight(c) ? (rookie(c) ? 0.85 : 0.95) : 0.1, tone: c => tagRight(c) ? (rookie(c) ? 'mixed' : 'good') : 'mixed', text: c => tagRight(c) ? (rookie(c) ? `Maya goes pale, then voids it. "Free. Sorry. Sorry." The bottle is free. On your way out, you see Dev write something on a clipboard next to her register.` : `"Yep, that's the rule." Maya voids it and hands you the bottle. Free. The man behind you looks almost impressed.`) : `Maya voids it, not wanting a fight. You leave with a free bottle you weren't owed, and Dev catches the tag error at close.` },
          { p: c => tagRight(c) ? (rookie(c) ? 0.15 : 0.05) : 0.9, tone: 'bad', text: c => tagRight(c) ? `Maya freezes and calls Dev. Seven minutes later he applies the promise. Free bottle, furious lane, and a cashier near tears.` : `Dev arrives with the tag: it was for the 500 ml bottle. "The promise covers shelf errors, not misreads." You pay $11.99 with five people watching.` }
        ],
        later: c => tagRight(c) ? `Knowing the rule turned $3.50 into $11.99. Who paid for it depended on who was behind the register.` : `You pressed a claim on a fact you hadn't checked. That's the expensive way to be wrong.`
      },
      {
        key: 'B', text: `Pay the $11.99, tap your card, and let the line move. It's one bottle of olive oil.`,
        their: c => tagRight(c) ? `Maya was spared any trouble, at your expense. You were owed at least $3.50, and possibly the whole bottle.` : `The tag was for the smaller bottle, so $11.99 was the right price. Paying it was correct, whether or not you knew.`,
        q: c => has(c, 2) ? (tagRight(c) ? 1 : 4) : 2, s: { jdg: 1, reg: 1, bnd: -1 },
        outcomes: [{ p: 1, tone: c => tagRight(c) ? 'mixed' : 'good', text: c => tagRight(c) ? `The line moves. On the way out you pass the shelf: the tag was right. You paid $11.99 for a bottle the store promised you for free.` : `The line moves. You paid the right price for the liter, and no one had to find that out in public.` }],
        later: c => has(c, 2) ? (tagRight(c) ? `You checked, found you were right, and paid anyway. That's being agreeable, not being careful.` : `You checked first, found you were wrong, and paid without a word. That's the cheapest way to be wrong.`) : `Fine as a conscious choice. You just never found out whether you had to.`
      },
      {
        key: 'C', text: `"Could've been the smaller bottle's tag. Is it quick for you to check, or should I just go to the desk?"`,
        their: c => rookie(c) ? `On day nine, "quick to check" means calling Dev. Your kindness still slowed the lane, and she was grateful anyway.` : `Maya had the discretion and you made using it painless. She'd have rung it at $8.49 for anyone this polite.`,
        q: c => has(c, 2) ? 2 : 3, s: { com: 2, reg: 1, coo: 1, inf: 1 },
        outcomes: [
          { p: c => rookie(c) ? 0.4 : 0.8, tone: c => tagRight(c) ? 'mixed' : 'good', text: c => rookie(c) ? (tagRight(c) ? `Maya calls Dev, who confirms the tag. $8.49, after four minutes. Nobody mentions the Scanner Promise.` : `Maya calls Dev, who checks: it's the 500 ml tag. You pay $11.99, glad you asked nicely.`) : (tagRight(c) ? `"Honestly? I'll just ring it at the shelf price." $8.49 in thirty seconds. The sign on her register would have made it free.` : `Maya glances at the shelf map. "That's the 500 ml tag, sorry." You pay $11.99, no scene.`) },
          { p: c => rookie(c) ? 0.6 : 0.2, tone: 'mixed', text: c => tagRight(c) ? `Maya sends you to the service desk, which refunds $3.50. Ten minutes, and you never knew it could have been free.` : `Maya sends you to the service desk. The tag was for the smaller bottle. No refund, and no scene.` }
        ],
        later: `You named your uncertainty and made helping you easy. You also left the store's own rule on the table.`
      },
      {
        key: 'D', text: `Pay now so the line can move, keep the receipt, and take the Scanner Promise to the service desk.`,
        needs: [0], vague: { text: `Pay now so the line can move, keep the receipt, and sort it out at the service desk on your way out.`, q: c => has(c, 2) && !tagRight(c) ? 2 : 3 },
        their: c => tagRight(c) ? (rookie(c) ? `The service desk applies the promise from its own budget, not Maya's error report. You got the free bottle and she never knew there was a problem.` : `Maya would have done it in two seconds. The desk took ten minutes to do the same thing.`) : `The desk checks the tag first, which is the step you'd skipped. It was for the smaller bottle, so no refund, and no scene.`,
        q: c => !tagRight(c) ? (has(c, 2) ? 2 : 3) : rookie(c) ? 4 : (has(c, 1) ? 2 : 3), s: { reg: 2, jdg: 2, inf: 1, coo: 1 },
        outcomes: [
          { p: c => tagRight(c) ? 0.9 : 0.1, tone: c => tagRight(c) ? 'good' : 'mixed', text: c => tagRight(c) ? `The desk checks the shelf, nods, and refunds the full $11.99. "First one's free." Ten minutes, start to finish.` : `The desk refunds it without checking. You leave with a free bottle you weren't owed, which is a strange kind of win.` },
          { p: c => tagRight(c) ? 0.1 : 0.9, tone: 'mixed', text: c => tagRight(c) ? `The desk is closed until six. You come back Thursday with the receipt, and they refund it then.` : `The desk checks: the tag was for the 500 ml bottle. No refund. Also, no scene.` }
        ],
        later: `You separated the time pressure from the money question, and moved the claim to the place built to handle it.`
      },
      {
        key: 'E', text: `Wave down Dev as he passes: "Can you check this price? The shelf said eight forty-nine."`,
        their: c => rookie(c) ? `Going over Maya's head took the decision off her error report, which helped her more than she'll ever know. It also told the lane she couldn't handle it.` : `Maya could have fixed it herself. Going past her to Dev told her, and the lane, that you didn't think she could.`,
        q: c => rookie(c) ? (has(c, 1) ? 3 : 2) : 1, s: { bnd: 1, str: 1, coo: -1 },
        outcomes: [
          { p: c => tagRight(c) ? 0.8 : 0.2, tone: 'mixed', text: c => tagRight(c) ? `Dev checks the tag and overrides it to $8.49. He doesn't mention the Scanner Promise, and neither do you.` : `Dev overrides it to $8.49 without checking, mostly to clear the lane. Maya looks at the floor.` },
          { p: c => tagRight(c) ? 0.2 : 0.8, tone: 'bad', text: c => tagRight(c) ? `Dev is "with a vendor." Six minutes later he confirms the tag. The man behind you has started narrating.` : `Dev walks back with the tag: it's the 500 ml. You pay $11.99, and you went over the cashier's head to be wrong.` }
        ],
        later: c => rookie(c) ? `Escalating protected a new cashier from her own error report, by accident. Next time, ask before you go around someone.` : `You skipped the person who could have helped. In Lane 4 you're now "the manager customer."`
      }
    ],
    analysis: {
      game: `A game of hidden information on both sides of the register. You don't know if the tag was right. You don't know what fixing it costs Maya. And the store has a rule that turns a $3.50 dispute into a free bottle.`,
      incentives: `Maya wants the line moving and her review clean. The store wants the promise honored, because it keeps the scanners honest. The line wants to go home.`,
      leverage: `The Scanner Promise, if you were right. Your leverage got bigger exactly when using it at the register got more expensive for someone else.`,
      missing: `Whether the tag was for this bottle, and whether Maya was new. The shelf would have told you one, at the line's expense. Watching her for thirty seconds told you the other, for free.`,
      assumptions: `That the store was wrong. That a polite question is always the best move. That a rule you're entitled to use is a rule you should use, here, now, on her.`,
      controlled: `Where you made the claim, and whether you checked first.`,
      couldnt: `The tag, Maya's experience, and the line's patience.`,
      concept: { term: `Resulting`, name: `Judge the decision, not how it turned out`, thinker: 'duke', body: `Duke calls the habit of judging a choice by its result "resulting." Claiming the free bottle and getting it is not proof you chose well, if a nineteen-year-old paid for it. Paying full price is not proof you chose badly, if the tag was for the smaller bottle.` },
      second: { term: `Where to press a claim`, name: `A strong claim still has a best place to make it`, thinker: 'schelling', body: `Schelling showed that how much a move costs the other side shapes what they do. The same claim costs a rookie cashier a mark on her review, and costs the service desk nothing. Choosing where to press it is part of the move.` },
      better: `Read the sign and watch Maya. With a veteran, claim the promise at the register. With a rookie, take it to the desk.`,
      lesson: `Having the right to something doesn't settle where, or on whom, to use it.`
    }
  }, {
    env: 'checkout',
    cast: [
      { id: 'maya', spot: 'maya', mood: 'neutral', pose: 'down', wants: `A moving line, and a clean review.` },
      { id: 'dev', spot: 'dev', layer: 'far', mood: 'neutral', pose: 'down', wants: `To finish restocking without a fuss.` },
      { id: 'sigh', spot: 'sigh', layer: 'front', mood: 'neutral', pose: 'phone', wants: `To get home. Right now.` }
    ],
    intro: [
      { cam: 'wide', caption: `Hillcrest Market. Tuesday, 5:48 pm. Lane 4.` },
      { cam: 'belt', caption: `The olive oil was $8.49 on the shelf. You're sure. Mostly.` },
      { who: 'maya', mood: 'neutral', say: `Okay… olive oil.` },
      { cam: 'register', caption: `Beep. $11.99. Next to the screen, a laminated sign you've never read.` },
      { who: 'maya', mood: 'nervous', act: 'glance', say: `Sorry, one sec, this thing is new to me.`, if: c => c.type.startsWith('rookie') },
      { who: 'maya', mood: 'smile', say: `Everything look right?`, if: c => c.type.startsWith('veteran') },
      { who: 'sigh', mood: 'frustrated', act: 'sigh', caption: `The man behind you sighs. It's a sigh with real craftsmanship.` }
    ],
    options: {
      A: { line: `The shelf said eight forty-nine, so the Scanner Promise applies, right? It says the first one's free.`, vague: { line: `The shelf said eight forty-nine. Can you ring it at that?` }, preview: `Claims what the store promises, if the tag was right. In public, at her register.`, row: 0,
        outcomes: [
          { beats: [
            { who: 'maya', mood: 'nervous', act: 'jump', say: `Oh. Um. Yes. Free. Sorry.`, if: c => c.type.startsWith('rookie') },
            { who: 'maya', mood: 'smile', act: 'nod', say: `Yep, that's the rule. Here you go.`, if: c => c.type.startsWith('veteran') },
            { who: 'dev', mood: 'skeptical', pose: 'tablet', caption: `Across the store, Dev writes something on a clipboard.`, if: c => c.type.startsWith('rookie') }
          ] },
          { beats: [
            { who: 'maya', mood: 'nervous', say: `I have to call Dev for that.` },
            { cam: 'wide', caption: `Minutes pass. The lane develops opinions.`, set: { sigh: { mood: 'frustrated', act: 'sigh' } } },
            { who: 'dev', move: { spot: 'dev_near' }, mood: 'skeptical', say: `Tag's for the 500 ml, friend.`, if: c => c.type.endsWith('wrong') }
          ] }
        ] },
      B: { caption: `You let it go and tap your card.`, preview: `No friction, no delay. You may be paying more than you owe.`, row: 2,
        outcomes: [{ beats: [
          { cam: 'register', caption: `$11.99. Approved.` },
          { who: 'maya', mood: 'smile', act: 'nod', say: `Have a good night!` },
          { who: 'sigh', mood: 'neutral', say: `(under his breath) Finally.` }
        ] }] },
      C: { line: `Could've been the smaller bottle's tag. Is it quick for you to check, or should I just go to the desk?`, preview: `Easy for her to help. Leaves the store's own policy unused.`, row: 2,
        outcomes: [
          { beats: [
            { who: 'maya', mood: 'smile', say: `Honestly? I'll just ring it at the shelf price.`, if: c => c.type.startsWith('veteran') },
            { who: 'maya', mood: 'nervous', say: `Let me get Dev, sorry.`, if: c => c.type.startsWith('rookie') }
          ] },
          { beats: [{ who: 'maya', mood: 'awkward', say: `The service desk can sort it out, if that's okay.` }] }
        ] },
      D: { caption: `You pay now so the line can move, keep the receipt, and head for the service desk.`, preview: `Moves the claim off her register. Costs you ten minutes.`, row: 1,
        outcomes: [
          { beats: [{ who: 'maya', mood: 'smile', say: `Thanks for being patient!` }, { cam: 'wide', caption: `The service desk takes it from there.` }] },
          { beats: [{ who: 'maya', mood: 'smile', say: `Thanks for being patient!` }, { cam: 'wide', caption: `The service desk takes it from there.` }] }
        ] },
      E: { line: `Dev? Can you check this price? The shelf said eight forty-nine.`, preview: `Brings in the person with the override code. Goes around the person in front of you.`, row: 1,
        outcomes: [
          { beats: [{ who: 'dev', move: { spot: 'dev_near' }, mood: 'neutral', say: `Let me look.` }, { who: 'maya', mood: 'sad', act: 'glance' }] },
          { beats: [{ cam: 'wide', caption: `Dev is "with a vendor." The lane waits.`, set: { sigh: { mood: 'frustrated', act: 'sigh' } } }] }
        ] }
    },
    matrix: {
      you: `You`, them: `Maya`, byType: true,
      rows: [`Claim the promise at her register`, `Take the claim to the desk`, `Pay, or just ask her to check`],
      cols: [`Rookie, tag right`, `Rookie, tag wrong`, `Veteran, tag right`, `Veteran, tag wrong`],
      cells: [[[3, 0], [0, 1], [3, 3], [0, 2]], [[3, 3], [2, 3], [2, 3], [2, 3]], [[1, 2], [3, 3], [1, 3], [3, 3]]],
      best: [1, 0],
      note: `The first number is how you come out; the second is Maya. Claiming at the register is perfect with a veteran and a right tag, and costs a rookie her review. The desk is never the best, and never bad, which is what you want when you can't tell which column you're in.`
    },
    leverage: { you: [`The Scanner Promise`, `Your receipt`, `The service desk`], them: [`Whether the tag was right`, `The line behind you`, `How much fixing it costs Maya`], tilt: -2 },
    links: [['maya', 'dev', 'reports to'], ['sigh', 'maya', 'pressures']]
  }, {
    A: { buys: ['win', 'right'], verdict: { who: 'maya', line: `Knew the rule and used it. Fair, I guess. It's on my report now.` } },
    B: { buys: ['calm', 'time'], verdict: { who: 'maya', line: `Nice customer. Didn't seem to care about the price.` } },
    C: { buys: ['liked', 'calm'], verdict: { who: 'maya', line: `Super polite. Made it easy for me.` } },
    D: { buys: ['fair', 'future', 'info'], verdict: { who: 'maya', line: `Paid and took it to the desk. I didn't even know there was a problem.` } },
    E: { buys: ['win', 'right'], verdict: { who: 'maya', line: `Went straight to Dev. I could have fixed it.` } }
  });

  // ─────────────────────────────────────────── Just This Once
  // Dana is overloaded, offloading, or hiding a family crisis. Asking Priya gets back to her.
  const offloader = c => c.type === 'offloader';
  const hiding = c => c.type === 'hiding';
  add({
    id: 'just-this-once',
    // A beat scene: you say what you're protecting, spend two reads, hear Dana's pitch,
    // answer, and sometimes have to hold your answer under pressure.
    play: true,
    reads: 2,
    readAsk: `Dana is waiting. What do you check before you answer?`,
    stakes: {
      ask: `Henley is due tomorrow at noon. What are you protecting this week?`,
      choices: [
        { id: 'standing', label: `Your standing`, note: `Henley on time, and Ellen seeing you as someone who delivers.` },
        { id: 'allies', label: `Your allies`, note: `People who'll back you when it counts.` },
        { id: 'time', label: `Your time`, note: `Your evenings, and the work that's actually yours.` }
      ]
    },
    // What she says once you stop looking: it depends on who she is, and on what she knows you checked.
    press: c => {
      const knows = has(c, 2);
      if (offloader(c)) return knows ? { who: 'dana', mood: 'frustrated', say: `Priya says you've been asking about me. If it's a problem, I'll find someone else.` }
        : { who: 'dana', mood: 'smile', say: `I'm drowning. It's two hours, tops, for you. You're so fast at the vendor stuff.` };
      if (hiding(c)) return knows ? { who: 'dana', mood: 'sad', say: `She told you, didn't she. Look, if you can't, that's okay.` }
        : { who: 'dana', mood: 'sad', say: `If you can't, that's okay. Really.` };
      return knows ? { who: 'dana', mood: 'awkward', say: `Priya said you asked. It's fine, I would too. I'm drowning, honestly.` }
        : { who: 'dana', mood: 'nervous', say: `I'm drowning. Ellen keeps piling things on.` };
    },
    pushFx: { hold: { rep: { firm: 1 } } },
    level: `Conflicting interests`,
    arena: `The workplace`,
    title: `Just This Once`,
    lens: ['axelrod', 'aumann'],
    setting: `Brightline Logistics · Thursday, 4:12 pm · Your desk`,
    types: [
      { id: 'overloaded', p: 0.45, who: `Dana`, label: `Dana was genuinely overloaded`, tell: `Ellen gave her the Arden onboarding the day before, with no deadline relief.` },
      { id: 'offloader', p: 0.3, who: `Dana`, label: `Dana was offloading`, tell: `Her own work was manageable. She'd asked three people for "quick" help that month, and thanked one.` },
      { id: 'hiding', p: 0.25, who: `Dana`, label: `Dana was hiding a family crisis`, tell: `Her mother was in the hospital. She hadn't told Ellen, because she was afraid of what it would mean for her review.` }
    ],
    cast: [
      { name: `Dana`, role: `Coworker`, archetype: `Unclear`, power: `Relationship`, note: `Third ask this quarter. You don't know why yet.` },
      { name: `Ellen`, role: `Your manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Assigns the work. Rarely checks who actually does it.` },
      { name: `Priya`, role: `Coworker`, archetype: `The Straight Shooter`, power: `She knows things`, note: `Sits next to Dana. Says what she thinks, to whoever's there.` }
    ],
    known: [`Dana has asked you three times this quarter.`, `You have the Henley summary due Friday at noon.`, `Her vendor section is due Monday.`],
    unknown: [`Why Dana keeps asking.`, `How big "the vendor section" is.`, `What helping, or not, will teach her.`],
    clues: [
      { label: `Check the project tracker`, text: c => c.type === 'overloaded' ? `Five open items, three overdue. One is the Arden onboarding, assigned by Ellen yesterday with no deadline relief.` : `Three open items, two overdue. Nothing new assigned this week.${hiding(c) ? ` Her status has shown "away" by 3 pm every day this week.` : ''}` },
      { label: `Scroll back through the team channel`, text: c => offloader(c) ? `She's asked three different people for "quick" help this month. She thanked one of them.` : `After you helped the first time: "Huge thanks, you saved me." She's asked one other person this month, and thanked them publicly.` },
      { label: `Ask Priya if Dana has asked her too`, cost: { note: `Priya will probably mention to Dana that you asked.`, rel: { dana: -1 }, flags: { danaKnows: true } }, text: c => offloader(c) ? `"Twice. I said no the second time. She just asked someone else."` : hiding(c) ? `Priya lowers her voice. "Don't push her on this. Her mom's in the hospital. She hasn't told Ellen."` : `"No. But Ellen dumped the Arden onboarding on her yesterday. She's underwater."` },
      { label: `Ask Dana what's going on this week`, cost: { note: `Dana will notice you're checking.`, rep: { careful: 1 } }, text: c => offloader(c) ? `"Oh, you know, slammed!" She doesn't name a single thing.` : hiding(c) ? `She hesitates. "It's… a lot right now. Personal stuff." Then she changes the subject.` : `"Ellen gave me the Arden onboarding yesterday, on top of everything." She sounds tired, not slick.` }
    ],
    question: `How do you reply?`,
    options: [
      {
        key: 'A', text: `"Sure, send it over. I'll make it work tonight."`,
        fx: c => ({ time: -4, standing: -1, allies: offloader(c) ? 0 : 1 }),
        rep: c => offloader(c) ? { easy: 1 } : { easy: 1, kind: 1 },
        their: c => hiding(c) ? `Dana was holding a crisis together with tape. A yes with no questions was exactly the help she couldn't ask for out loud.` : offloader(c) ? `Asking you was Dana's cheapest move, and it worked again. Help with no conditions teaches people where to bring their work.` : `Dana's problem was Ellen's assignment, not the vendor section. You absorbed it, so Ellen will never know it was a problem.`,
        q: c => hiding(c) ? (has(c, 2) ? 4 : 3) : offloader(c) ? (any(c, 1, 2, 3) ? 1 : 2) : 2,
        s: { coo: 2, bnd: -2, lng: -1 }, rel: { dana: 1 }, flags: c => ({ danaType: c.type, danaPattern: 'always-yes' }),
        outcomes: [{ p: 1, tone: c => hiding(c) ? 'good' : 'mixed', text: c => hiding(c) ? `You work until nine. On Monday Dana leaves a coffee on your desk, and a note: "You have no idea."` : `You work until nine on Thursday, and Henley goes in at 11:58 Friday. Dana sends three hearts.` }],
        later: c => offloader(c) ? `Two weeks later Dana asks again. The message is shorter, and there's no "any chance."` : `Kind, and expensive. Whether it was the right kind of kind depended on why she was asking.`
      },
      {
        key: 'B', text: `"I can't this time. I've got Henley due Friday, and I'm already behind."`,
        fx: c => offloader(c) && has(c, 2) ? { allies: -2, standing: -1 } : { allies: -1 },
        rep: c => offloader(c) && has(c, 2) ? { sharp: 1 } : { firm: 1 },
        push: c => hiding(c) || (offloader(c) && has(c, 2)) ? null : {
          who: 'dana', mood: offloader(c) ? 'smile' : 'sad',
          say: offloader(c) ? `Even an hour? You're so much faster at this than me.` : `Please. I'm going under here.`,
          hold: { label: `Hold the line`, line: `I can't this week. I'm sorry.` },
          give: { label: `Give in`, line: `Okay, fine. Send it over.`, key: 'A' },
          walk: { label: `Soften it`, line: `Not before Friday noon. After that, two hours.`, key: 'D' }
        },
        needs: c => offloader(c) ? [2] : [-1], vague: { text: `"I can't this time. I've got Henley due Friday, and I'm already behind."`, their: c => offloader(c) ? `A plain no ended the free ride. Dana found someone else.` : `A plain no protected your Friday. Dana still has to solve the problem, without you, and without knowing why you said no.` },
        text: `"Priya says you've asked her twice too. I'm passing, and Ellen should know where this work keeps landing."`,
        their: `True, and you said it with Ellen in earshot. Dana stops asking you, and starts telling people you're difficult.`,
        q: c => offloader(c) ? (has(c, 2) ? 2 : 3) : hiding(c) ? 1 : 2,
        s: { bnd: 2, coo: -1, com: -1 }, rel: { dana: c => offloader(c) && has(c, 2) ? -2 : -1 }, flags: c => ({ danaType: c.type }),
        outcomes: [
          { p: c => offloader(c) ? 0.7 : 0.4, tone: 'mixed', text: c => offloader(c) ? `"No worries!!" Dana asks someone else within the hour.` : `"No worries!!" Dana is quiet at Friday's standup, and stays late all weekend.` },
          { p: c => offloader(c) ? 0.3 : 0.6, tone: 'bad', text: c => hiding(c) ? `Dana's eyes fill. "Okay." On Monday, Ellen asks her why the report is late, and she finally tells her about her mother, in the worst possible way.` : `Dana goes cold. By Monday the team has heard a version of this where you're the problem.` }
        ],
        later: `A no is often right. Who hears it, and what you use to justify it, decides what it costs.`
      },
      {
        key: 'C', text: `"What's involved, and when do you need it? I'm on Henley until Friday noon."`,
        fx: c => ({ time: -2, allies: offloader(c) ? 0 : 1 }),
        rep: { careful: 1 },
        push: c => offloader(c) ? {
          who: 'dana', mood: 'smile', say: `It's honestly just formatting. Could you start tonight?`,
          hold: { label: `Set your terms`, line: `Friday afternoon, two hours. And you take my Monday notes.`, key: 'D' },
          give: { label: `Give in`, line: `Fine. Tonight.`, key: 'A' },
          walk: { label: `Back out`, line: `Actually, I can't take this on right now.`, key: 'B' }
        } : null,
        their: c => offloader(c) ? `Asking how big it is sounds like a maybe. Dana shrank it to "two hours," and once you'd asked, saying no felt worse than saying yes.` : `A question costs Dana nothing to answer, and she could shrink the ask to fit your schedule.`,
        q: c => offloader(c) ? (any(c, 1, 2, 3) ? 1 : 2) : 3,
        s: { inf: 2, neg: 1, com: 2, coo: 1 }, rel: { dana: 1 }, flags: c => ({ danaType: c.type, danaPattern: 'trade' }),
        outcomes: [
          { p: c => offloader(c) ? 0.3 : 0.75, tone: 'good', text: `"The numbers exist, they just need formatting. Two hours, tops." You do it Friday afternoon. She takes your Monday standup notes.` },
          { p: c => offloader(c) ? 0.7 : 0.25, tone: 'mixed', fx: c => offloader(c) ? { time: -5, standing: -1 } : {}, text: c => offloader(c) ? `"Two hours, tops." It's eleven. By the time you realize, you're too far in to stop.` : `"It's kind of most of the report." She'll figure it out. Asking saved your weekend.` }
        ],
        later: c => offloader(c) ? `Asking is usually wise. With someone who takes, it's also the first step of saying yes.` : `You found out what it was before you agreed to it.`
      },
      {
        key: 'D', text: `"Not before Friday noon. After that I'll give you two hours, and you take my Monday notes."`,
        fx: c => ({ time: -2, allies: offloader(c) ? 0 : 1 }),
        rep: { firm: 1, fair: 1 },
        push: c => offloader(c) ? {
          who: 'dana', mood: 'awkward', say: `Could you do tonight instead? Friday's too late for me.`,
          hold: { label: `Hold your terms`, line: `Friday afternoon, two hours. That's the offer.` },
          give: { label: `Give in`, line: `Okay. Tonight.`, key: 'A' },
          walk: { label: `Withdraw the offer`, line: `Then I'm out. Sorry.`, key: 'B' }
        } : null,
        their: c => offloader(c) ? `Help with a limit and a price makes you an expensive person to offload onto. Dana took the deal, or went elsewhere, and either was fine.` : c.type === 'overloaded' ? `A fair trade, but it treats the symptom. Ellen's new assignment is still on Dana's desk next week.` : `Two hours, on your terms. It helped, without anyone having to explain anything.`,
        q: c => offloader(c) ? 4 : hiding(c) ? 3 : 2,
        s: { bnd: 2, neg: 2, coo: 1, lng: 1 }, rel: { dana: c => offloader(c) ? 0 : 1 }, flags: c => ({ danaType: c.type, danaPattern: 'trade' }),
        outcomes: [
          { p: c => offloader(c) ? 0.5 : 0.8, tone: 'good', text: `"Deal." You give her two hours Friday afternoon. Your Monday notes are done before you arrive.` },
          { p: c => offloader(c) ? 0.5 : 0.2, tone: 'mixed', text: c => offloader(c) ? `"Oh, never mind, I'll figure it out." She asks someone else, and doesn't ask you again.` : `Two hours wasn't quite enough. She finishes it Sunday night.` }
        ],
        later: `You set a price on your help that a taker won't pay and a friend won't mind.`
      },
      {
        key: 'E', text: `"Ellen gave you Arden yesterday with no relief, didn't she? Let's take it to her together."`,
        fx: c => c.type === 'overloaded' ? { standing: 1, allies: 1, time: -1 } : hiding(c) ? { allies: -1, time: -1 } : { standing: -1, time: -1 },
        rep: { direct: 1 },
        // The tracker, Priya, or Dana herself can tell you about Arden.
        needs: c => c.type === 'overloaded' ? [[0, 2, 3].find(i => c.clues.includes(i)) ?? 0] : [-1], vague: { text: `"Sounds like you're swamped. Want to raise it with Ellen together?"`, q: c => hiding(c) ? (has(c, 2) ? 0 : 1) : 2 },
        their: c => c.type === 'overloaded' ? `The problem was Ellen's assignment. Going together gave Dana cover to say so, and gave Ellen a reason to act.` : hiding(c) ? `Dana was hiding something from Ellen on purpose. Offering to go to Ellen together was the one kind of help she couldn't accept.` : `Dana wasn't overloaded. Taking a habit to the manager as a workload problem embarrassed everyone.`,
        q: 4, s: { inc: 2, coo: 2, com: 1, inf: 1 }, rel: { dana: c => hiding(c) ? -1 : 1 }, flags: c => ({ danaType: c.type, danaPattern: 'trade' }),
        outcomes: [
          { p: c => c.type === 'overloaded' ? 0.7 : 0.1, tone: 'good', text: `Dana exhales. "Yeah. Okay." Cornered by two people at once, Ellen moves the Arden deadline.` },
          { p: c => c.type === 'overloaded' ? 0.3 : 0.9, tone: 'mixed', text: c => hiding(c) ? `"No. Please don't." Dana looks frightened. "I'll manage." She manages, badly.` : c.type === 'overloaded' ? `Dana hesitates. "Not yet. Let me try to catch up first." She doesn't catch up.` : `Dana hesitates. "It's fine, I'll manage." She manages, mostly by asking someone else.` }
        ],
        later: `When the problem is upstream, fix it upstream. If it isn't, going upstream makes it worse.`
      }
    ],
    analysis: {
      game: `A repeated favor game with three kinds of asker. What works depends on why she's asking, and the cheapest way to find out isn't free.`,
      incentives: `An offloader asks whoever says yes. An overloaded colleague needs the workload fixed. Someone hiding a crisis needs help without having to explain.`,
      leverage: `Your yes. Unconditional, it's free to take. With a limit and a price, it only gets taken by people who need it.`,
      missing: `Why Dana was behind. The tracker and the channel narrowed it down. Priya knew for sure, and would tell Dana you asked.`,
      assumptions: `That asking questions is always neutral. With a taker, asking how big the job is already sounds like yes.`,
      controlled: `The terms of your help, and who else got involved.`,
      couldnt: `Ellen's assignments, Dana's family, and what Priya says to whom.`,
      concept: { term: `Screening`, name: `Design an offer that sorts people by type`, thinker: 'aumann', body: `When you can't see someone's type, offer terms that different types answer differently. Help with a limit and a price costs a friend in trouble almost nothing and costs a taker a lot, so their answer tells you who they are.` },
      second: { term: `Tit for tat`, name: `Reciprocity beats both always-yes and always-no`, thinker: 'axelrod', body: `In Axelrod's tournaments, the winning strategy cooperated first, then mirrored. Help on terms, then watch what comes back. It protects you from takers and keeps you generous to everyone else.` },
      better: `Overloaded: take it to Ellen together. Offloading: help later, with a limit and a price. Hiding something: just help.`,
      lesson: `Find out why someone is asking before you decide how to say yes.`
    }
  }, {
    env: 'desks',
    cast: [
      { id: 'dana', spot: 'dana_start', mood: 'smile', pose: 'mug', wants: `The report off her plate. Possibly more than that.` },
      { id: 'ellen', spot: 'ellen_office', layer: 'far', mood: 'neutral', pose: 'phone', wants: `Work done without having to referee it.` },
      { id: 'priya', spot: 'priya', mood: 'neutral', pose: 'tablet', wants: `To get through her own week.` }
    ],
    intro: [
      { cam: 'wide', caption: `Brightline Logistics. Thursday, 4:12 pm.` },
      { cam: 'monitor', caption: `Your own deadline glows at you. The Henley summary, due tomorrow at noon.` },
      { who: 'dana', move: { spot: 'dana' }, cam: 'wide', caption: `Dana appears at your desk, holding a mug like a peace offering.` },
      { who: 'dana', mood: 'nervous', say: `Any chance you could take the vendor section of the Q3 report? It's due Monday. I'm drowning.` },
      { who: 'dana', mood: 'smile', act: 'lean', say: `You're just so good at the vendor stuff.`, if: c => c.type === 'offloader' },
      { who: 'dana', mood: 'sad', act: 'glance', caption: `She looks tired in a way that isn't about work.`, if: c => c.type === 'hiding' },
      { who: 'dana', mood: 'frustrated', act: 'glance', caption: `She glances toward Ellen's office.`, if: c => c.type === 'overloaded' },
      { cam: 'wide', caption: `Third time this quarter.` }
    ],
    options: {
      A: { line: `Sure, send it over. I'll make it work tonight.`, preview: `Help, right now, no questions. Costs your evening and may set a pattern.`, row: 1,
        outcomes: [{ beats: [{ who: 'dana', mood: 'happy', act: 'jump', say: `Thank you. Really.` }, { cam: 'monitor', caption: `It is going to be a long night.` }] }] },
      B: { line: `Priya says you've asked her twice too. I'm passing, and Ellen should know where this work keeps landing.`, vague: { line: `I can't this time. I've got Henley due Friday, and I'm already behind.` }, preview: `Protects your deadline. How it lands depends on what you say it with.`, row: 2,
        outcomes: [
          { beats: [{ who: 'dana', mood: 'awkward', act: 'glance', say: `Oh! No worries. Totally.` }, { who: 'dana', move: { spot: 'dana_start' } }] },
          { beats: [{ who: 'dana', mood: 'sad', say: `Okay.` }, { who: 'ellen', mood: 'skeptical', act: 'glance', cam: 'wide', caption: `Ellen has heard all of it.` }] }
        ] },
      C: { line: `What's involved, and when do you need it? I'm on Henley until Friday noon.`, preview: `Learn the size before you commit. Once you ask, no gets harder.`, row: 0,
        outcomes: [
          { beats: [{ who: 'dana', mood: 'thinking', pose: 'thinking', say: `The numbers exist. They just need formatting. Two hours, tops.` }] },
          { beats: [{ who: 'dana', mood: 'awkward', act: 'glance', say: `It's… honestly it's a lot.` }] }
        ] },
      D: { line: `Not before Friday noon. After that I'll give you two hours, and you take my Monday notes.`, preview: `Help with a limit and a price. Slower than she wanted.`, row: 0,
        outcomes: [
          { beats: [{ who: 'dana', mood: 'smile', act: 'nod', say: `Deal.` }] },
          { beats: [{ who: 'dana', mood: 'neutral', say: `Oh. I'll figure something out.` }] }
        ] },
      E: { line: `Ellen gave you Arden yesterday with no relief, didn't she? Let's take it to her together.`, vague: { line: `Sounds like you're swamped. Want to raise it with Ellen together?` }, preview: `Goes after the cause, if it's upstream. Puts Dana in front of her boss.`, row: 0,
        outcomes: [
          { beats: [{ who: 'dana', mood: 'thinking', say: `…Yeah. Okay.` }, { who: 'ellen', mood: 'surprised', cam: 'wide', say: `Both of you? What's wrong?` }] },
          { beats: [{ who: 'dana', mood: 'nervous', act: 'shake', say: `No. It's fine. I'll manage.` }] }
        ] }
    },
    matrix: {
      you: `You`, them: `Dana`, byType: true,
      rows: [`Help on terms, or fix it upstream`, `Help, no questions`, `Refuse`],
      cols: [`Overloaded`, `Offloading`, `Hiding a crisis`],
      cells: [[[3, 3], [3, 1], [2, 2]], [[1, 3], [0, 4], [2, 4]], [[2, 1], [3, 1], [1, 0]]],
      best: [0, 0],
      note: `The first number is how you come out; the second is Dana. Each column has a different best answer: fix it upstream, set a price, or just help. That's why finding out was worth something, even at a cost.`
    },
    leverage: { you: [`Your yes, which has value`, `Your skill with vendor data`, `A deadline of your own`], them: [`Friendship and goodwill`, `Your record of saying yes`, `Whatever she isn't saying`], tilt: -2 },
    links: [['ellen', 'dana', 'assigns to'], ['priya', 'dana', 'sits beside']]
  }, {
    A: { buys: ['liked', 'calm'], verdict: { who: 'dana', line: `Said yes before I'd finished asking.` } },
    B: { buys: ['time', 'right'], verdict: { who: 'dana', line: `Said no. How they said it is what I remember.` } },
    C: { buys: ['info', 'fair'], verdict: { who: 'dana', line: `Asked what was involved. Fair question.` } },
    D: { buys: ['fair', 'future', 'time'], verdict: { who: 'dana', line: `Helped on their own terms. Can't argue with that.` } },
    E: { buys: ['fair', 'future', 'info'], verdict: { who: 'dana', line: `Wanted to take it to Ellen. Brave. Maybe too brave.` } }
  });

  // ─────────────────────────────────────────── Gary: The Spot and The Fence
  // One Gary per playthrough: new and unaware, protecting a wife who uses a cane, or quietly moving.
  const unaware = c => c.type === 'unaware';
  const constrained = c => c.type === 'constrained';
  const leaving = c => c.type === 'leaving';
  add({
    id: 'the-spot',
    share: 'gary',
    level: `Conflicting interests`,
    arena: `The neighborhood`,
    title: `The Spot`,
    lens: ['schelling', 'axelrod'],
    setting: `Alder Street · Saturday, 8:30 am · Out front`,
    types: [
      { id: 'unaware', p: 0.4, who: `Gary`, label: `Gary just didn't know`, tell: `He came from an apartment downtown, where you park wherever there's a space. Nobody had told him how the block works.` },
      { id: 'constrained', p: 0.25, who: `Gary`, label: `Gary needed that spot`, tell: `His wife, Lou, uses a cane after a hip replacement. Your curb is the only level one near their steps; his own has a hydrant.` },
      { id: 'leaving', p: 0.35, who: `Gary`, label: `Gary was already on his way out`, tell: `They're listing the house in the fall. Block customs weren't his problem, and he didn't plan to make them his problem.` }
    ],
    cast: [
      { name: `Gary`, role: `New neighbor`, archetype: `Unclear`, power: `Proximity, and the law`, note: `Two vehicles, a one-car driveway, and three weeks on the block.` },
      { name: `Ruth`, role: `Neighbor across the street`, archetype: `The Connector`, power: `Social capital`, note: `Twenty-two years on Alder Street. Tells everyone everything.` }
    ],
    known: [`For four years, everyone has parked in front of their own house.`, `Gary has two vehicles and a one-car driveway.`, `His pickup has been in front of your house every day for three weeks.`, `The block is now one spot short.`],
    unknown: [`Whether this is permanent.`, `Whether Gary knows the habit, or cares.`, `Whether you have any right to the spot.`],
    clues: [
      { label: `Look at the curb`, text: `No signs, no permits, no markings. It's a public street. Gary has as much right to that spot as you do.` },
      { label: `Watch Gary's house on Monday morning`, text: c => unaware(c) ? `At 7:10 Gary backs the car out, parks the truck in front of your house, and pulls the car back in. He waves at the jogger. He looks like a man solving a puzzle.` : constrained(c) ? `At 7:40 Gary helps a woman with a cane down the steps and across to the truck at your curb. It's the closest level spot. His own curb has a hydrant.` : `Moving boxes stacked in the open garage. A realtor's lockbox hangs on the side door.` },
      { label: `Ask Ruth about Gary`, cost: { note: `Ruth will tell Gary you were asking about him.`, rel: { gary: -1 } }, text: c => unaware(c) ? `"Sweet man. Came from an apartment downtown. I don't think anyone's told him how we do things."` : constrained(c) ? `"His wife, Lou, had her hip replaced in August. Dialysis three mornings a week, too. He's very protective."` : `"Between us? I don't think they're staying. He asked me about school districts in Dayton."` }
    ],
    question: `What's your move?`,
    options: [
      {
        key: 'A', text: `Walk over, introduce yourself, and explain how the block has always handled parking.`,
        their: c => unaware(c) ? `Gary didn't know the custom. Hearing it from you, in person, made it easy to adopt, and made you the neighbor who explained instead of complained.` : constrained(c) ? `Gary needed your curb for Lou. You told him the custom, and he had to choose between it and his wife in front of you.` : `Gary is leaving. You told him what you wanted, and he had no reason to give it to you: it's a public street.`,
        q: c => unaware(c) ? 4 : constrained(c) ? (any(c, 1, 2) ? 1 : 3) : (any(c, 1, 2) ? 1 : 2),
        s: { com: 2, inf: 1, coo: 2, lng: 1 }, rel: { gary: c => unaware(c) ? 2 : constrained(c) ? 0 : -1 }, flags: c => ({ normContested: leaving(c) }),
        outcomes: [
          { p: c => unaware(c) ? 0.85 : constrained(c) ? 0.5 : 0.2, tone: c => unaware(c) ? 'good' : 'mixed', text: c => unaware(c) ? `"Oh no, I had no idea there was a system." He starts parking the truck in front of his own place, and brings you tomatoes in August.` : constrained(c) ? `Gary goes quiet, then explains about Lou. You work something out on the spot, a little awkwardly.` : `"Huh. Okay." He parks out front one day, then goes back to your curb.` },
          { p: c => unaware(c) ? 0.15 : constrained(c) ? 0.5 : 0.8, tone: 'mixed', text: c => unaware(c) ? `Gary's a little stiff: "It's a public street." But he moves it.` : constrained(c) ? `"My wife can't walk from the corner." Now you're the neighbor who made him say it.` : `"It's a public street, friend." Now the custom has been said out loud, and refused. Two other neighbors start parking wherever they like.` }
        ],
        later: c => leaving(c) ? `Saying a norm out loud gives people the chance to reject it. Unspoken, it was stronger.` : `You opened with a conversation. What it bought depended on why he was there.`
      },
      {
        key: 'B', text: `Get up earlier than Gary and park in the spot yourself before the truck goes there.`,
        their: c => leaving(c) ? `Gary didn't care where he parked, only that it was easy. Possession settled it without a conversation he'd have refused.` : constrained(c) ? `Gary needed that curb for Lou's mornings. He found out by watching her walk from the corner.` : `Gary parked further down without thinking about it. He never learned the custom, so the next spot problem will be someone else's.`,
        q: c => leaving(c) ? (has(c, 1) ? 4 : 3) : constrained(c) ? (any(c, 1, 2) ? 0 : 1) : 2,
        s: { str: 2, bnd: 1, com: -1 }, rel: { gary: c => constrained(c) ? -2 : 0 },
        outcomes: [
          { p: c => constrained(c) ? 0.2 : 0.85, tone: c => constrained(c) ? 'mixed' : 'good', text: c => leaving(c) ? `Gary shrugs and parks around the corner. Nothing was ever said, and nothing needed to be.` : constrained(c) ? `Gary parks down the block. That evening you watch Lou cross the street on her cane, slowly.` : `Gary parks further down and doesn't think twice. The spot is yours again.` },
          { p: c => constrained(c) ? 0.8 : 0.15, tone: 'bad', text: c => constrained(c) ? `On Wednesday Lou slips on the walk from the corner. Gary looks at your car for a long time.` : `Gary notices the pattern and starts getting up earlier. Now you're both parking at 6 am.` }
        ],
        later: `Possession works as a claim when nobody has a better one. It's worth knowing whether somebody does.`
      },
      {
        key: 'C', text: `Mention it to Ruth, and let the block's habit reach Gary through the usual channels.`,
        their: c => unaware(c) ? `The custom reached Gary, and so did the fact that the block had been discussing him.` : constrained(c) ? `Gary heard the block thought he was rude, and didn't feel he could explain about Lou to a street that talks.` : `Social pressure only works on people who plan to stay. Gary didn't.`,
        q: c => unaware(c) ? 2 : constrained(c) ? 1 : (has(c, 1) ? 1 : 2),
        s: { inf: 1, coo: -1, com: -1 }, rel: { gary: -1 },
        outcomes: [
          { p: c => unaware(c) ? 0.6 : 0.2, tone: 'mixed', text: `By Tuesday, the truck is gone from your curb. By Wednesday, Gary waves a little less.` },
          { p: c => unaware(c) ? 0.4 : 0.8, tone: 'bad', text: c => leaving(c) ? `Nothing changes. Gary hears the street has opinions and doesn't care.` : `Gary hears the street thinks he's rude. He stops waving.` }
        ],
        later: `Pressure from the group can teach a norm. It also teaches the newcomer the group talks about him.`
      },
      {
        key: 'D', text: `Offer a trade: "Take my spot on Lou's dialysis mornings, and I'll have it the rest of the week."`,
        needs: c => constrained(c) ? [2] : [-1], vague: { text: `Offer a trade: he takes the spot on the days it matters most to him, you have it the rest. Ask which days.`, q: c => constrained(c) ? (has(c, 1) ? 4 : 3) : unaware(c) ? 3 : 2 },
        their: c => constrained(c) ? `You saw what the spot was for, and offered it where it mattered. Gary gets Lou's mornings, you get the rest, and nobody had to explain anything painful.` : unaware(c) ? `A trade is generous, if a little more than he needed. He'd have moved for a friendly word.` : `Gary agreed to a schedule he had no reason to keep. He's not planning to be here long enough for your goodwill to matter.`,
        q: 4, s: { neg: 2, coo: 2, com: 1, lng: 2 }, rel: { gary: c => leaving(c) ? 0 : 2 },
        outcomes: [
          { p: c => leaving(c) ? 0.3 : 0.85, tone: 'good', text: c => constrained(c) ? `Gary's eyes go wet for a second. "Thank you." Lou waves from the truck on Monday.` : `"Deal." It works, and you've had a real conversation with your new neighbor.` },
          { p: c => leaving(c) ? 0.7 : 0.15, tone: 'mixed', text: c => leaving(c) ? `Gary agrees, then parks there whenever he likes. It's not malice. He's just not here for the long run.` : `It works most weeks. A couple of mornings you end up down the block.` }
        ],
        later: `You found out what the spot was worth to him before deciding what it was worth to you.`
      },
      {
        key: 'E', text: `Post on the neighborhood app: "Friendly reminder, we each park in front of our own house."`,
        needs: c => leaving(c) ? [2] : [-1],
        vague: { text: `Post on the neighborhood app: "Friendly reminder, we each park in front of our own house."` },
        their: c => leaving(c) ? `Ruth told you about Dayton in confidence. Now the block knows Gary's selling, before his realtor does.` : constrained(c) ? `Everyone knew who it was about. Gary read it at Lou's bedside.` : `Gary sees his truck discussed in public before he's met anyone. That first impression is the one he keeps.`,
        q: c => leaving(c) && has(c, 2) ? 0 : 1, s: { com: -2, coo: -2, lng: -2 }, rel: { gary: -3 },
        outcomes: [{ p: 1, tone: 'bad', text: c => leaving(c) && has(c, 2) ? `Your post says: "Some of us won't be here long anyway." Fourteen replies. Gary's listing goes up a month early, at a lower price.` : `Twenty-two replies. Someone posts a photo of the truck. Gary sees it.` }],
        later: `A public reminder is a private complaint with an audience.`
      }
    ],
    analysis: {
      game: `A coordination norm under strain. "Park in front of your own house" worked because nobody said it. Now the block is one spot short and the newcomer may not know, may not be able to, or may not care.`,
      incentives: `An unaware Gary wants to fit in. A constrained Gary needs the spot more than you do. A leaving Gary has no reason to invest in the block at all.`,
      leverage: `Legally, none. Socially, some, but only with someone who plans to stay.`,
      missing: `Why the truck was there. Monday morning would have shown you. Ruth would have told you, and told Gary you asked.`,
      assumptions: `That the spot is yours. That explaining a custom always helps.`,
      controlled: `Whether you spoke, to whom, and in public or private.`,
      couldnt: `Gary's driveway, Lou's hip, and his plans.`,
      concept: { term: `Focal point`, name: `Unspoken rules are stronger than spoken ones`, thinker: 'schelling', body: `Schelling showed that people coordinate on obvious answers nobody negotiated. Those focal points hold because nobody says them. Once said out loud, a norm can be refused, and refusing it in public weakens it for everyone.` },
      second: { term: `Shadow of the future`, name: `Cooperation needs a future`, thinker: 'axelrod', body: `Axelrod found that cooperation holds when people expect to keep dealing with each other. A neighbor who's leaving isn't playing the same game you are, and the moves that work on a lifer don't work on him.` },
      better: `Watch first. Unaware: explain. Needs it: trade. Leaving: just take the spot first.`,
      lesson: `Before you defend a custom, find out whether the other person can follow it, or will be around to.`
    }
  }, {
    env: 'street',
    cast: [
      { id: 'gary', spot: 'gary', mood: 'smile', pose: 'mug', wants: `Somewhere to park. Maybe more than that.` },
      { id: 'ruth', spot: 'ruth', mood: 'neutral', pose: 'can', wants: `To know what's going on. Always.` }
    ],
    intro: [
      { cam: 'wide', caption: `Alder Street. Saturday, 8:30 am.` },
      { cam: 'truck', caption: `Three weeks. Every day, his pickup, in front of your house.` },
      { caption: `You carried the groceries half a block. Again.` },
      { who: 'gary', mood: 'happy', pose: 'wave', say: `Morning, neighbor!` },
      { who: 'gary', mood: 'smile', pose: 'mug', say: `Two cars, one driveway. Don't ever do that to yourself.`, if: c => c.type === 'unaware' },
      { who: 'gary', mood: 'neutral', act: 'glance', caption: `He glances back at his front door before he waves.`, if: c => c.type === 'constrained' },
      { who: 'gary', mood: 'smile', pose: 'mug', say: `Nice street. Quiet.`, if: c => c.type === 'leaving' },
      { who: 'ruth', mood: 'skeptical', act: 'glance', caption: `Across the street, Ruth is watering a plant that does not need watering.` }
    ],
    options: {
      A: { caption: `You walk over, introduce yourself, and explain how the block has always handled parking.`, preview: `Teaches the custom face to face. Gives him the chance to refuse it.`, row: 0,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'surprised', say: `Oh! I had no idea.`, if: c => c.type === 'unaware' }, { who: 'gary', mood: 'sad', say: `It's for my wife. Her hip.`, if: c => c.type === 'constrained' }, { who: 'gary', mood: 'neutral', say: `Huh. Okay.`, if: c => c.type === 'leaving' }] },
          { beats: [{ who: 'gary', mood: 'skeptical', pose: 'crossed', say: `It's a public street, friend.` }, { who: 'ruth', mood: 'surprised', pose: 'down' }] }
        ] },
      B: { caption: `You set an alarm for 6:15 and park in the spot before the truck gets there.`, preview: `Claims it without a word. Leaves him to work out why.`, row: 1,
        outcomes: [
          { beats: [{ cam: 'truck', caption: `The truck parks down the block.` }, { who: 'gary', mood: 'neutral', act: 'glance' }] },
          { beats: [{ who: 'gary', mood: 'frustrated', pose: 'crossed', caption: `Gary looks at your car for a long time.` }] }
        ] },
      C: { caption: `You mention it to Ruth, and let the block's habit reach Gary through the usual channels.`, preview: `Lets the street do the asking. Gary will know the street talked.`, row: 2,
        outcomes: [
          { beats: [{ who: 'ruth', mood: 'happy', act: 'nod', caption: `Ruth has a word. Ruth always has a word.` }] },
          { beats: [{ who: 'gary', mood: 'skeptical', act: 'glance', caption: `Gary stops waving.` }] }
        ] },
      D: { line: `Take my spot on Lou's dialysis mornings, and I'll have it the rest of the week.`, vague: { line: `Want to trade? You take it the days it matters most, I'll have it the rest. Which days?` }, preview: `Splits it by need. Only works if he keeps his half.`, row: 0,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'happy', act: 'nod', say: `Deal. Thank you.` }] },
          { beats: [{ who: 'gary', mood: 'smile', say: `Sure, sure.` }, { cam: 'truck', caption: `The truck is there on Thursday anyway.` }] }
        ] },
      E: { caption: `You post on the neighborhood app: "Friendly reminder, we each park in front of our own house."`, preview: `Reaches everyone at once. Everyone knows who it's about.`, row: 2,
        outcomes: [{ beats: [{ cam: 'porch', caption: `Twenty-two replies.` }, { who: 'gary', mood: 'sad', pose: 'phone' }] }] }
    },
    matrix: {
      you: `You`, them: `Gary`, byType: true,
      rows: [`Talk, or trade`, `Take the spot first`, `Let the street, or the app, handle it`],
      cols: [`Didn't know`, `Needed it`, `Leaving`],
      cells: [[[3, 3], [3, 3], [1, 2]], [[2, 2], [1, 0], [3, 2]], [[1, 1], [0, 0], [1, 1]]],
      best: [0, 0],
      note: `The first number is how you come out; the second is Gary. Talking is best with a Gary who didn't know or needed it, and pointless with one who's leaving. Taking the spot first is the reverse.`
    },
    leverage: { you: [`Four years on the block`, `The block's custom`, `Ruth, if you use her`], them: [`It's a public street`, `Whatever he needs the spot for`, `He may not be staying`], tilt: 1 },
    links: [['ruth', 'gary', 'watching']]
  }, {
    A: { buys: ['fair', 'future', 'liked'], verdict: { who: 'gary', line: `Came over and told me how the street works. Depends how you hear it.` } },
    B: { buys: ['win', 'time'], verdict: { who: 'gary', line: `Started beating me to the spot. Never said a word.` } },
    C: { buys: ['calm', 'win'], verdict: { who: 'gary', line: `Heard from Ruth that the street had opinions about me.` } },
    D: { buys: ['fair', 'future', 'info'], verdict: { who: 'gary', line: `Offered to share the spot. Good neighbor.` } },
    E: { buys: ['right', 'win'], verdict: { who: 'gary', line: `Posted about me on the app. Hard to forget.` } }
  });

  add({
    id: 'the-fence',
    share: 'gary',
    level: `Repeated interactions`,
    arena: `The neighborhood`,
    title: `The Fence`,
    lens: ['aumann', 'nalebuff'],
    setting: `Alder Street · Three months later · Side yard`,
    types: [
      { id: 'unaware', p: 0.4, who: `Gary`, label: `Gary just wanted a fence the dog couldn't clear`, tell: `A big rescue dog, two escapes, and no other agenda. He'll be your neighbor for years.` },
      { id: 'constrained', p: 0.25, who: `Gary`, label: `Gary couldn't afford his half`, tell: `Lou's medical bills had eaten their savings. He proposed 50/50 because asking for anything else felt like begging.` },
      { id: 'leaving', p: 0.35, who: `Gary`, label: `Gary was selling the house`, tell: `They list in September. A new cedar fence adds to the sale price, and he won't be around for the next favor you'd ask.` }
    ],
    cast: [
      { name: `Gary`, role: `Next-door neighbor`, archetype: `Depends on what you know`, power: `Proximity`, note: `How he approaches you reflects how The Spot went.` },
      { name: `Ruth`, role: `Neighbor across the street`, archetype: `The Connector`, power: `Social capital`, note: `Has seen three fences come and go on this block.` }
    ],
    known: [`The fence is on the shared property line.`, `Gary's quote is $4,800 for 6-foot cedar: $2,400 each.`, `A basic 4-foot fence would cost about $2,200.`, `If nobody acts, the old fence falls by summer.`],
    unknown: [`Why Gary wants six feet of cedar.`, `Whether $2,400 is easy for him.`, `How long he'll be your neighbor.`],
    clues: [
      { label: `Look up your county's guidance`, text: `Shared boundary fences are a joint responsibility when both owners benefit. Upgrades beyond what's needed are usually negotiated separately. (Rules vary by place.)` },
      { label: `Look over the fence`, text: c => unaware(c) ? `A huge rescue dog, a chewed rope toy, and paw prints on the top rail.` : constrained(c) ? `A ramp over the back steps. A pharmacy bag on the patio table. The dog lies beside Lou's chair.` : `Staging boxes in the garage, fresh paint on the trim, and a realtor's lockbox on the side door.` },
      { label: `Ask Ruth what's going on with Gary`, cost: { note: `Gary will hear you were asking.`, rel: { gary: -1 } }, text: c => unaware(c) ? `"The dog's jumped it twice. That's why six feet."` : constrained(c) ? `"Lou's bills have been brutal. He'd never say so, but money is tight over there."` : `"They're listing in September. A new fence photographs well."` }
    ],
    question: `How do you respond?`,
    options: [
      {
        key: 'A', text: `"Let's split a basic four-foot fence. If you want six-foot cedar, you cover the difference."`,
        their: c => unaware(c) ? `Gary's reason for six feet was the dog. A fair base split, with the upgrade on him, was the deal he'd have proposed if he'd thought of it.` : constrained(c) ? `Fair on paper. Gary couldn't afford his half of the basic fence, let alone the difference, and couldn't say so.` : `You paid $1,100 toward a fence that helps Gary sell his house, and the goodwill you bought leaves in September.`,
        q: c => unaware(c) ? 4 : any(c, 1, 2) ? 2 : 3, s: { neg: 2, coo: 2, com: 1, lng: 1 }, rel: { gary: 1 },
        shaped: c => rel(c, 'gary') >= 2 ? `Gary liked you after The Spot, so he took the offer in good faith.` : rel(c, 'gary') <= -2 ? `Gary remembers The Spot, so he looked for the catch.` : null,
        outcomes: [
          { p: c => (unaware(c) ? 0.8 : constrained(c) ? 0.3 : 0.7) + (rel(c, 'gary') >= 2 ? 0.1 : rel(c, 'gary') <= -2 ? -0.2 : 0), tone: c => unaware(c) ? 'good' : 'mixed', text: c => unaware(c) ? `Gary pays the difference for cedar. The dog stays put. Next spring he trims the oak over your roof without being asked.` : constrained(c) ? `Gary agrees, then asks if he can pay his $1,100 "in a couple of months." It takes eight.` : `Gary agrees happily. In September the house sells, fence and all. The new owners are nice. They don't owe you anything.` },
          { p: c => (unaware(c) ? 0.2 : constrained(c) ? 0.7 : 0.3) - (rel(c, 'gary') >= 2 ? 0.1 : rel(c, 'gary') <= -2 ? -0.2 : 0), tone: 'mixed', text: c => constrained(c) ? `Gary goes quiet. "Let me think about it." He doesn't bring it up again, and the old fence falls in June.` : `Gary's a bit stung: "I thought we'd split it." He comes around by the weekend.` }
        ],
        later: c => leaving(c) ? `A fair split assumes you'll both be here to enjoy it, and to return the favor.` : `Each of you paid for what you valued. That's a deal both of you would choose again.`
      },
      {
        key: 'B', text: `"County guidance says upgrades are negotiated separately. If you want six-foot cedar, it's on you."`,
        needs: [0], vague: { text: `"The old fence works for me. If you want a new one, I'd expect you to cover it."`, q: c => leaving(c) && has(c, 1) ? 3 : 1 },
        their: c => leaving(c) ? `Gary was selling. The fence was for his buyers, not for you, and there was no next round for him to punish you in. Paying was his best move, and he knew it.` : constrained(c) ? `Gary couldn't afford it alone. "It's on you" told him you'd wait while his dog got out, and he'd already been through enough.` : `Gary needs it for the dog. Whether he pays alone or waits you out depends on goodwill, and you just spent some.`,
        q: c => leaving(c) ? 4 : constrained(c) ? (any(c, 1, 2) ? 0 : 1) : 2,
        s: { bnd: 2, str: 1, coo: -1 }, rel: { gary: c => leaving(c) ? 0 : -2 },
        outcomes: [
          { p: c => leaving(c) ? 0.85 : constrained(c) ? 0.05 : 0.45, tone: 'good', text: c => leaving(c) ? `Gary barely argues. "Fair enough." He pays for the cedar, lists in September, and it shows nicely in the photos.` : `Gary pays for the whole fence himself. It cost you nothing, and he remembers.` },
          { p: c => leaving(c) ? 0.15 : constrained(c) ? 0.95 : 0.55, tone: 'bad', text: c => constrained(c) ? `"Okay." Nothing gets built. In June the fence falls and the dog knocks Lou over in the yard. You hear about it from Ruth.` : `"Then I guess we both wait." In June the old fence falls, and the dog finds your garden.` }
        ],
        later: c => leaving(c) ? `In the last round of a game, the logic of reciprocity runs out. You noticed it was the last round.` : `Holding out pays once. Next spring, when the oak needs trimming, he remembers.`
      },
      {
        key: 'C', text: `"Sure, fifty-fifty sounds fair. Let's get it done before summer."`,
        their: c => unaware(c) ? `Gary gets cedar at half price, mostly for his dog. He's grateful, and you overpaid a little.` : constrained(c) ? `Gary agreed to $2,400 he didn't have, because you agreed so warmly. He put it on a credit card.` : `You paid half of a fence that raised Gary's sale price.`,
        q: c => unaware(c) ? 2 : any(c, 1, 2) ? 1 : 2, s: { coo: 2, neg: -2, bnd: -1 }, rel: { gary: 1 },
        outcomes: [
          { p: 0.8, tone: 'mixed', text: c => unaware(c) ? `You pay $2,400 for a fence that mostly solves Gary's dog problem. It's a nice fence.` : constrained(c) ? `The fence goes up. In October Gary admits he's still paying it off, and looks ashamed.` : `The fence goes up. In September the house sells, a little higher than it would have.` },
          { p: 0.2, tone: 'mixed', text: c => leaving(c) ? `The fence goes up. Gary's listing photos feature it prominently.` : `The fence goes up. Gary's grateful, and you never quite find out what it cost him.` }
        ],
        later: `Generous, and easy. Whether it was the right kind of generous depended on things you didn't ask about.`
      },
      {
        key: 'D', text: `"I'll front the cost of a basic fence now. Pay me back over the summer, and let's build it ourselves on Saturday."`,
        their: c => constrained(c) ? `You turned a bill Gary couldn't pay into one he could, without making him say so. The Saturday mattered as much as the money.` : unaware(c) ? `Generous and practical. Gary didn't need the loan, but he enjoyed the Saturday.` : `You lent money to someone moving in September. He meant to pay it back. Then he moved.`,
        q: c => constrained(c) ? 4 : unaware(c) ? 3 : (any(c, 1, 2) ? 0 : 2), s: { coo: 2, neg: 1, lng: 2, com: 1 }, rel: { gary: 2 },
        outcomes: [
          { p: c => constrained(c) ? 0.85 : unaware(c) ? 0.8 : 0.3, tone: 'good', text: c => constrained(c) ? `Gary is quiet for a moment. "You'd do that?" You build it in a day. He pays you back by October, a little at a time.` : `You build it together on Saturday. Gary pays you back in a month and throws in the cedar upgrade himself.` },
          { p: c => constrained(c) ? 0.15 : unaware(c) ? 0.2 : 0.7, tone: 'mixed', text: c => leaving(c) ? `The fence goes up. In September the house sells. You get $400 of your $1,100 back, and a Christmas card from Dayton.` : `Repayment takes until winter. It comes, slowly.` }
        ],
        later: `You fit the deal to what each of you could actually pay. Fair isn't always equal.`
      },
      {
        key: 'E', text: `"If that dog gets into my yard again, I'll have to call the county. Let's just get it done."`,
        needs: c => unaware(c) ? [2] : [-1], vague: { text: `"Something has to happen before summer, or I'll have to call the county about it."` },
        their: c => constrained(c) ? `A threat to a man who's already underwater. He agreed to things he couldn't pay for, and stopped speaking to you.` : `True, and a threat. Gary got the message, and so did your future relationship.`,
        text: `"Ruth says the dog's jumped twice. If it gets into my yard again, that's a liability issue. Let's get it done."`,
        q: c => constrained(c) ? 0 : 1, s: { bnd: 2, coo: -2, lng: -2 }, rel: { gary: -3 },
        outcomes: [
          { p: 0.6, tone: 'mixed', text: `Gary agrees to split it, coldly. The fence goes up. You don't talk over it much.` },
          { p: 0.4, tone: 'bad', text: `Gary's jaw tightens. "Call whoever you want." The fence falls in June.` }
        ],
        later: `Leverage you could use is leverage they'll remember you used.`
      }
    ],
    analysis: {
      game: `A repeated game, maybe. With a neighbor who's staying, cooperation pays because there's always a next favor. With one who's leaving, this is the last round, and the logic changes.`,
      incentives: `Gary needs to contain his dog. He may also need to protect his savings, or raise his sale price. You need a working fence at a fair price.`,
      leverage: `Shared responsibility for the boundary, and the future, if there is one.`,
      missing: `Whether Gary could pay, and whether he was staying. One look over the fence would have told you.`,
      assumptions: `That fair means 50/50. That there will always be a next time.`,
      controlled: `Your offer, and whether you shaped it to what Gary could actually do.`,
      couldnt: `Gary's money, his plans, or his dog.`,
      concept: { term: `Backward induction`, name: `In the last round, cooperation unravels`, thinker: 'aumann', body: `Reason back from the end. In the final round of a repeated game there's no future to protect, so the usual reasons to cooperate disappear. If Gary is leaving, the fence is a one-shot deal, and you should bargain like it.` },
      second: { term: `Fair division`, name: `Each side pays for what it values, and can afford`, thinker: 'nalebuff', body: `A good split gives each side what they value at a cost they can carry. Sometimes that's halves. Sometimes it's a loan, a Saturday, or letting the person who'll profit pay for it.` },
      better: `Staying and fine: split the basic fence. Struggling: front it and build it together. Leaving: let him pay for his upgrade.`,
      lesson: `Before you play the long game, check that there is one.`
    }
  }, {
    env: 'yard',
    cast: [
      { id: 'gary', spot: 'gary', mood: 'neutral', pose: 'down', wants: `A fence his dog can't clear. Maybe more than that.` },
      { id: 'ruth', spot: 'ruth', mood: 'smile', pose: 'can', wants: `A peaceful street, and the full story.` }
    ],
    intro: [
      { cam: 'wide', caption: `Three months later. The side yard.` },
      { if: c => (c.rel.gary || 0) >= 1, who: 'gary', mood: 'happy', pose: 'plate', say: `Brought tamales. My sister's. Also, I have a favor to ask.` },
      { if: c => (c.rel.gary || 0) <= -1, caption: `An email arrives. Subject: "Regarding the Shared Boundary." Then Gary appears.`, set: { gary: { mood: 'skeptical', pose: 'crossed' } } },
      { if: c => (c.rel.gary || 0) === 0, who: 'gary', mood: 'neutral', say: `Got a minute? It's about the fence.` },
      { cam: 'fence', caption: `The old fence leans like it has given up on life.` },
      { who: 'gary', act: 'lean', say: `Six-foot cedar. Forty-eight hundred. Split it fifty-fifty?` },
      { who: 'gary', mood: 'awkward', act: 'glance', caption: `He says the number quickly, like it hurts.`, if: c => c.type === 'constrained' },
      { who: 'gary', mood: 'smile', say: `Cedar looks great. Adds value, you know?`, if: c => c.type === 'leaving' },
      { cam: 'dog', caption: `Behind the fence, a very large dog studies it with professional interest.` }
    ],
    options: {
      A: { line: `Let's split a basic four-foot fence. If you want six-foot cedar, you cover the difference.`, preview: `Each pays for what they value. Assumes he can, and that he's staying.`, row: 0,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'smile', act: 'nod', say: `Yeah. That's fair.` }] },
          { beats: [{ who: 'gary', mood: 'awkward', say: `Let me think about it.` }] }
        ] },
      B: { line: `County guidance says upgrades are negotiated separately. If you want six-foot cedar, it's on you.`, vague: { line: `The old fence works for me. If you want a new one, I'd expect you to cover it.` }, preview: `Costs you nothing. Works only if he can, and will, pay alone.`, row: 1,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'neutral', act: 'nod', say: `Fair enough.` }] },
          { beats: [{ who: 'gary', mood: 'frustrated', pose: 'crossed', say: `Then I guess we both wait.` }, { cam: 'dog', caption: `The dog is patient. The fence is not.` }] }
        ] },
      C: { line: `Sure, fifty-fifty sounds fair. Let's get it done before summer.`, preview: `Quick and warm. You may be paying for things you didn't ask about.`, row: 2,
        outcomes: [{ beats: [{ who: 'gary', mood: 'happy', act: 'jump', say: `Great! I'll call the guy.` }] }, { beats: [{ who: 'gary', mood: 'smile', act: 'nod', say: `Perfect. Thank you.` }] }] },
      D: { line: `I'll front the cost of a basic fence now. Pay me back over the summer, and let's build it ourselves on Saturday.`, preview: `Makes it affordable now. You carry the risk of being paid back.`, row: 0,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'surprised', say: `You'd do that?` }, { who: 'gary', mood: 'happy', act: 'nod', say: `Saturday. I'll bring the coffee.` }] },
          { beats: [{ who: 'gary', mood: 'smile', act: 'nod', say: `Deal. I'll get you back.` }] }
        ] },
      E: { line: `Ruth says the dog's jumped twice. If it gets into my yard again, that's a liability issue. Let's get it done.`, vague: { line: `Something has to happen before summer, or I'll have to call the county about it.` }, preview: `Gets it moving. As a threat.`, row: 1,
        outcomes: [
          { beats: [{ who: 'gary', mood: 'skeptical', pose: 'crossed', say: `Fine.` }] },
          { beats: [{ who: 'gary', mood: 'frustrated', say: `Call whoever you want.` }, { who: 'ruth', mood: 'surprised', pose: 'down' }] }
        ] }
    },
    matrix: {
      you: `You`, them: `Gary`, byType: true,
      rows: [`Shape the deal to what he can pay`, `Make him pay, or threaten`, `Split it evenly`],
      cols: [`Staying, fine`, `Can't afford it`, `Leaving`],
      cells: [[[3, 3], [3, 3], [1, 3]], [[2, 1], [0, 0], [3, 2]], [[1, 3], [1, 1], [0, 3]]],
      best: [0, 0],
      note: `The first number is how you come out; the second is Gary. Shaping the deal to what he can pay is best with a Gary who's staying. With one who's leaving, it's a gift to his buyers, and holding out is finally the right move.`
    },
    leverage: { you: [`County guidance`, `What you saw over the fence`, `The future, if there is one`], them: [`The dog`, `Your shared boundary`, `How The Spot went`], tilt: 0 },
    links: [['ruth', 'gary', 'knows everything about']]
  }, {
    A: { buys: ['fair', 'future'], verdict: { who: 'gary', line: `Split the basic fence, I paid for the upgrade. Fair.` } },
    B: { buys: ['win', 'right'], verdict: { who: 'gary', line: `Told me the cedar was on me. Not wrong.` } },
    C: { buys: ['liked', 'calm'], verdict: { who: 'gary', line: `Said yes to fifty-fifty right away. Easy neighbor.` } },
    D: { buys: ['future', 'liked', 'fair'], verdict: { who: 'gary', line: `Fronted the money and built it with me. I won't forget it.` } },
    E: { buys: ['win', 'right'], verdict: { who: 'gary', line: `Threatened to call the county about my dog.` } }
  });

  // ─────────────────────────────────────────── The Credit Taker
  // Jordan is scared, scheming, or presenting your work because Ellen told him to.
  const schemer = c => c.type === 'schemer';
  const sanctioned = c => c.type === 'sanctioned';
  const danaBacks = c => rel(c, 'dana') > 0 && c.flags && c.flags.danaType !== 'offloader';
  add({
    id: 'credit-taker',
    level: `Subtle power dynamics`,
    arena: `The workplace`,
    title: `The Credit Taker`,
    lens: ['nash', 'duke'],
    setting: `Brightline Logistics · Monday, 10:00 am · Conference room B`,
    types: [
      { id: 'scared', p: 0.4, who: `Jordan`, label: `Jordan was scared, not scheming`, tell: `His review is Thursday. He froze, took the easy story, and hated himself for it by lunch.` },
      { id: 'schemer', p: 0.35, who: `Jordan`, label: `Jordan took the credit on purpose`, tell: `On Friday he deleted your name from the title slide. He'd rehearsed the walkthrough all weekend.` },
      { id: 'sanctioned', p: 0.25, who: `Jordan`, label: `Ellen told Jordan to present it`, tell: `Ellen asked him to present your analysis as a "growth opportunity" before his review. The slight came from your manager, not from Jordan.` }
    ],
    cast: [
      { name: `Jordan`, role: `Coworker`, archetype: `Unclear`, power: `Visibility`, note: `He's holding the clicker. In this room, that's power.` },
      { name: `Ellen`, role: `Manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Decides reviews and raises. Dislikes open conflict in meetings.` },
      { name: `Dana`, role: `Coworker`, archetype: `Witness`, power: `Relationship`, note: `Knows the slides were yours. Whether she'd say so depends on your history.` }
    ],
    known: [`You built most of the analysis.`, `Jordan is presenting it without mentioning you.`, `Ellen just praised Jordan in front of the team.`],
    unknown: [`Whether Jordan meant to.`, `Whether Ellen knows who did the work.`, `Who decided Jordan would present.`],
    clues: [
      { label: `Check the file's version history`, text: c => schemer(c) ? `You authored 31 of 38 slides. On Friday, Jordan deleted your name from the title slide. This morning the footer changed, along with every deck in the department, after a template update.` : `You authored 31 of 38 slides. This morning the footer changed to "Prepared by J. Pike," along with every deck in the department, after a template update. Nothing else.` },
      { label: `Open the meeting invite`, text: c => sanctioned(c) ? `From Ellen: "Jordan presents regional cost analysis (growth opp before review)."` : `From Ellen: "Regional cost analysis, Q3." No presenter named.` },
      { label: `Watch Jordan closely`, text: c => schemer(c) ? `Relaxed, rehearsed. He hasn't looked at his notes once.` : sanctioned(c) ? `He keeps glancing at Ellen, like someone following a script he didn't write.` : `His hand shakes on the clicker. His review is Thursday.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `"Quick note: I built 31 of these 38 slides. The version history shows it. Happy to walk through it."`,
        needs: [0], vague: { text: `"Actually, I built most of that analysis. Happy to walk everyone through how it works."` },
        their: c => sanctioned(c) ? `Ellen set this up. Correcting it in public corrected her, in front of her team.` : schemer(c) ? `Against someone doing it on purpose, the record is strong. In public, it also makes you the person who started a scene.` : `Jordan froze under pressure. Corrected in public, his best reply was to defend himself, and the room watched the two of you instead of the work.`,
        shaped: c => danaBacks(c) ? `Dana backed you after Just This Once, and nodded along. The room was more likely to believe you.` : null,
        q: c => sanctioned(c) ? (has(c, 1) ? 0 : 1) : schemer(c) ? (has(c, 0) ? 2 : 1) : 1,
        s: { bnd: 2, reg: -1, com: -1, lng: -1 }, rel: { jordan: -2 },
        outcomes: [
          { p: c => (schemer(c) ? 0.55 : 0.4) + (danaBacks(c) ? 0.2 : 0), tone: 'mixed', text: c => sanctioned(c) ? `The room goes quiet. Ellen says, "Jordan's presenting at my request." You were right, and you've just corrected your boss.` : `"Huh." Ellen looks at the screen, then at you. "Let's take that offline." You're right, and you're now part of an awkward moment.` },
          { p: c => (schemer(c) ? 0.45 : 0.6) - (danaBacks(c) ? 0.2 : 0), tone: 'bad', text: c => sanctioned(c) ? `Ellen's smile freezes. "We'll talk after." You do. It doesn't go well.` : `Jordan says, "It was a team effort, obviously." Ellen moves on. You look like you care more about credit than the work.` }
        ],
        later: `Being seen as right, right now, has a price. Who pays it depends on who set up the room.`
      },
      {
        key: 'B', text: `Stay quiet now, and catch Jordan privately right after the meeting.`,
        their: c => schemer(c) ? `Jordan meant it. In private, his best reply was to deny it, and now he knew you'd noticed.` : sanctioned(c) ? `Jordan was relieved you came to him first. He told you it was Ellen's idea, which you needed to know.` : `In private, a scared person can fix it without losing face. Jordan did.`,
        q: c => schemer(c) ? (any(c, 0, 2) ? 1 : 2) : sanctioned(c) ? 3 : 4,
        s: { reg: 2, com: 1, coo: 1 }, rel: { jordan: 1 },
        outcomes: [
          { p: c => schemer(c) ? 0.15 : 0.8, tone: 'good', text: c => sanctioned(c) ? `"Ellen asked me to. I assumed you knew." He sends the team a note crediting your model, and you learn whose idea this was.` : `Jordan is embarrassed. "I froze. I'll fix it." He emails the team crediting your analysis by name.` },
          { p: c => schemer(c) ? 0.85 : 0.2, tone: 'mixed', text: c => schemer(c) ? `Jordan smiles. "I think you're remembering it differently." By Thursday, his version is the official one.` : `Jordan gets defensive. "It's a team, I didn't think it mattered." Nothing changes in Ellen's mind.` }
        ],
        later: `A private word works on people who want to fix it. It warns people who don't.`
      },
      {
        key: 'C', text: `Ask Jordan, in the room, "Should we include the Q2 outliers I flagged?"`,
        their: c => schemer(c) ? `Jordan had rehearsed. "Good question. The outliers I found…" He used your question to claim more of the work.` : sanctioned(c) ? `A small, fair signal. Ellen noticed you knew the model, and Jordan was glad of the help.` : `Your question gave Jordan an easy way to credit you while answering. He took it.`,
        q: c => schemer(c) ? (any(c, 0, 2) ? 1 : 2) : 3,
        s: { str: 2, com: 2, reg: 1 }, rel: { jordan: 0 },
        outcomes: [
          { p: c => schemer(c) ? 0.2 : 0.7, tone: 'good', text: `Ellen looks at you. "You built the model?" "Most of it, yes." She asks you to walk through slide 12.` },
          { p: c => schemer(c) ? 0.8 : 0.3, tone: 'mixed', text: c => schemer(c) ? `"Great catch. When I was digging into the outliers, I found…" He answers with your work, and the room nods.` : `Jordan answers smoothly and the meeting moves on. Your claim is on record, quietly.` }
        ],
        later: `A good question is a small claim. Against someone who's ready for it, it's a gift.`
      },
      {
        key: 'D', text: `Take the version history to Ellen afterward: "He deleted my name Friday. I want it on record."`,
        needs: c => schemer(c) ? [0] : [-1], vague: { text: `Take the version history to Ellen afterward and ask how ownership should show for reviews.`, q: c => sanctioned(c) ? (has(c, 1) ? 1 : 2) : 3 },
        their: c => schemer(c) ? `Against someone doing it on purpose, a record is the only thing that works. Ellen couldn't wave away a Friday deletion.` : sanctioned(c) ? `Ellen arranged this. Bringing her evidence felt like you were building a case against her decision.` : `A record is hard to dismiss, and Ellen was glad to have it.`,
        q: 4, s: { inf: 2, bnd: 2, lng: 2, com: -1 }, rel: { jordan: c => schemer(c) ? -1 : 0 },
        outcomes: [
          { p: c => schemer(c) ? 0.8 : sanctioned(c) ? 0.3 : 0.7, tone: 'good', text: c => schemer(c) ? `Ellen looks at the Friday edit for a long time. "Thank you for telling me." Jordan's review goes differently than he planned.` : `Ellen thanks you. She'd assumed it was joint work, and corrects it.` },
          { p: c => schemer(c) ? 0.2 : sanctioned(c) ? 0.7 : 0.3, tone: 'mixed', text: c => sanctioned(c) ? `Ellen's face tightens. "I asked Jordan to present. Is there a problem with that?"` : `Ellen says, "I'm sure it was a team effort," and changes the subject. The record is still yours.` }
        ],
        later: `Documentation beats argument, when the problem is the other person. When it's your manager, it's an accusation.`
      },
      {
        key: 'E', text: `Ask Ellen afterward, without naming anyone: "How will this project show up in reviews for both of us?"`,
        their: c => sanctioned(c) ? `Ellen had given your work away as a favor to Jordan. A neutral question let her fix it without admitting it. She did.` : schemer(c) ? `A neutral question to Ellen was gentle where the situation wasn't. Jordan's version stood.` : `Ellen hadn't thought about it. Your question made her.`,
        q: c => sanctioned(c) ? (has(c, 1) ? 4 : 3) : schemer(c) ? 2 : 3,
        s: { str: 2, com: 2, lng: 2, reg: 1 }, rel: { jordan: 0 },
        outcomes: [
          { p: c => sanctioned(c) ? 0.85 : schemer(c) ? 0.3 : 0.65, tone: 'good', text: c => sanctioned(c) ? `Ellen pauses. "That's fair. Jordan presented as a development thing. It's your analysis, and I'll make sure that's clear."` : `Ellen thinks. "Good question. I'll note who built what." She does.` },
          { p: c => sanctioned(c) ? 0.15 : schemer(c) ? 0.7 : 0.35, tone: 'mixed', text: `Ellen says it'll "all be reflected." You're not sure it will.` }
        ],
        later: `A question with no accusation in it lets the person who caused a problem fix it quietly.`
      }
    ],
    analysis: {
      game: `A signaling game with an audience, and three possible authors of the slight. The right move depends on who did it, and the obvious suspect isn't always the one.`,
      incentives: `A scared Jordan wants to survive Thursday. A scheming Jordan wants your work on his record. An Ellen who set this up wants it to look like a kindness.`,
      leverage: `The version history, the invite, and your fluency with the model. Each one works on a different person.`,
      missing: `Who decided Jordan would present. The invite said so. The version history looked damning, and mostly showed a template update.`,
      assumptions: `That Jordan is the villain. That a question in the room is always safe.`,
      controlled: `Where, when and to whom you made your claim.`,
      couldnt: `Ellen's plan, Jordan's motives, and what was already said.`,
      concept: { term: `Best response`, name: `There's no single best move, only a best reply to each type`, thinker: 'nash', body: `Nash's insight is to judge a move by the other side's best reply. Against a scared Jordan, a private word. Against a schemer, the record. Against Ellen's plan, a neutral question to Ellen. The trick is working out which game you're in.` },
      second: { term: `Noisy evidence`, name: `A signal that looks damning may be noise`, thinker: 'duke', body: `The footer change looked like proof. It was a template update. Duke would ask how much a piece of evidence should move your belief, given how often it shows up when nothing is wrong.` },
      better: `Read the invite and the history. Scared: talk to Jordan. Schemer: take the record to Ellen. Ellen's idea: ask her, neutrally.`,
      lesson: `Before you correct the record, find out who wrote it.`
    }
  }, {
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
      { who: 'jordan', mood: 'confident', say: `It really came together over the weekend.`, if: c => c.type === 'schemer' },
      { who: 'jordan', mood: 'nervous', act: 'glance', caption: `Jordan glances at Ellen before every slide.`, if: c => c.type === 'sanctioned' },
      { who: 'ellen', mood: 'happy', act: 'nod', say: `Really sharp thinking, Jordan.` },
      // Word gets around: what you did with Dana reached the rest of the office.
      { if: c => (((c.flags || {}).rep) || {}).easy > 0, who: 'jordan', mood: 'confident', act: 'glance', caption: `Word gets around. Jordan has heard you're the one who says yes, and he looks at you like he's counting on it.` },
      { if: c => { const r = ((c.flags || {}).rep) || {}; return r.firm > 0 && !(r.easy > 0); }, who: 'jordan', mood: 'awkward', act: 'glance', caption: `Word gets around. Jordan has heard you hold your ground. He doesn't quite meet your eye.` },
      { if: c => (((c.flags || {}).rep) || {}).sharp > 0, who: 'dana', mood: 'skeptical', caption: `Dana hasn't forgotten what you said about her with Ellen in earshot. Neither has the room.` },
      { who: 'jordan', mood: 'awkward', pose: 'clicker', act: 'glance', caption: `Jordan looks directly at you. He says nothing.` },
      { if: c => (c.rel.dana || 0) > 0, who: 'dana', mood: 'skeptical', caption: `Dana catches your eye. She knows those slides were yours.` }
    ],
    options: {
      A: { line: `Quick note: I built thirty-one of these thirty-eight slides. The version history shows it. Happy to walk through it.`, vague: { line: `Actually, I built most of that analysis. Happy to walk everyone through how it works.` }, preview: `Sets the record straight, now. In front of everyone, including whoever arranged this.`, row: 2,
        outcomes: [
          { beats: [{ cam: 'wide', caption: `The room goes very quiet.`, set: { ellen: { mood: 'awkward' }, jordan: { mood: 'surprised', act: 'jump' } } }, { who: 'ellen', mood: 'awkward', say: `Let's take that offline.` }] },
          { beats: [{ who: 'jordan', mood: 'neutral', say: `It was a team effort, obviously.` }, { who: 'ellen', mood: 'skeptical', act: 'glance' }] }
        ] },
      B: { caption: `You stay quiet, and catch Jordan by the elevator after the meeting.`, preview: `Lets him fix it without losing face. Warns him, if he meant it.`, row: 0,
        outcomes: [
          { beats: [{ who: 'jordan', mood: 'sad', say: `I froze. I'll fix it.` }] },
          { beats: [{ who: 'jordan', mood: 'smile', say: `I think you're remembering it differently.` }] }
        ] },
      C: { line: `Should we include the Q2 outliers I flagged?`, preview: `A small claim, in the room. He might answer it with your work.`, row: 1,
        outcomes: [
          { beats: [{ who: 'ellen', mood: 'thinking', act: 'glance', say: `You built the model?` }] },
          { beats: [{ who: 'jordan', mood: 'confident', say: `Great catch. When I dug into the outliers…` }] }
        ] },
      D: { caption: `After the meeting, you take the version history to Ellen: "He deleted my name Friday. I want it on record."`, vague: { caption: `After the meeting, you take the version history to Ellen and ask how ownership should show for reviews.` }, preview: `Puts evidence in front of the decider. Reads as an accusation of someone.`, row: 0,
        outcomes: [
          { beats: [{ who: 'ellen', mood: 'thinking', say: `Thank you for telling me.` }] },
          { beats: [{ who: 'ellen', mood: 'skeptical', pose: 'crossed', say: `Is there a problem with how I ran that?` }] }
        ] },
      E: { caption: `Afterward you ask Ellen, without naming anyone: "How will this project show up in reviews for both of us?"`, preview: `Lets her fix it quietly. Might be too gentle to change anything.`, row: 1,
        outcomes: [
          { beats: [{ who: 'ellen', mood: 'thinking', act: 'nod', say: `That's fair. I'll make sure it's clear.` }] },
          { beats: [{ who: 'ellen', mood: 'neutral', say: `It'll all be reflected.` }] }
        ] }
    },
    matrix: {
      you: `You`, them: `Jordan`, byType: true,
      rows: [`Go to the person responsible, privately`, `Signal in the room, or ask Ellen neutrally`, `Correct it in public`],
      cols: [`Scared`, `Scheming`, `Ellen's idea`],
      cells: [[[3, 3], [3, 0], [2, 2]], [[2, 2], [1, 3], [3, 2]], [[1, 0], [2, 0], [0, 1]]],
      best: [0, 0],
      note: `The first number is how you come out; the second is Jordan. Going privately to whoever is responsible is best, but who that is changes by column. A public correction is never the best, and worst when it was Ellen's plan.`
    },
    leverage: { you: [`The version history`, `The meeting invite`, `You know the model cold`], them: [`He holds the clicker`, `Ellen already praised him`, `Whoever set this up`], tilt: 1 },
    links: [['ellen', 'jordan', 'manages'], ['dana', 'jordan', 'watching']]
  }, {
    A: { buys: ['right', 'win'], verdict: { who: 'ellen', line: `Corrected it in the middle of my meeting. They were right. It was still uncomfortable.` } },
    B: { buys: ['fair', 'future'], verdict: { who: 'jordan', line: `Came to me first, privately. I owe them for that.` } },
    C: { buys: ['info', 'win'], verdict: { who: 'ellen', line: `Asked a sharp question about the outliers. Knows that model.` } },
    D: { buys: ['fair', 'right', 'info'], verdict: { who: 'ellen', line: `Brought me the file history. Hard to argue with.` } },
    E: { buys: ['fair', 'future', 'calm'], verdict: { who: 'ellen', line: `Asked how it would show up in reviews. Fair question. I fixed it.` } }
  });

  // ─────────────────────────────────────────── Pick a Side
  // The technical truth is hidden: a phased fix works, the modules are coupled, or a patch is enough.
  const coupled = c => c.type === 'coupled';
  const patchOk = c => c.type === 'patch';
  const jordanTilt = c => rel(c, 'jordan') < 0 ? -0.15 : rel(c, 'jordan') > 0 ? 0.1 : 0;
  add({
    id: 'pick-a-side',
    level: `Multiple people, connected interests`,
    arena: `The workplace`,
    title: `Pick a Side`,
    lens: ['nash', 'nalebuff'],
    setting: `Brightline Logistics · Wednesday · Before Friday's decision`,
    types: [
      { id: 'phased', p: 0.45, who: `the scheduling tool`, label: `A phased fix would have worked`, tell: `The two worst modules were independent. Fixing them first would have cut most of the tickets for a fraction of the cost.` },
      { id: 'coupled', p: 0.35, who: `the scheduling tool`, label: `Priya was right: it needed a rebuild`, tell: `Both broken modules call the same scheduler core. Fix them one at a time and they break again.` },
      { id: 'patch', p: 0.2, who: `the scheduling tool`, label: `Marcus was right: a patch was enough`, tell: `Most of the tickets came from one bad configuration file. Priya knew, and was overstating it to get her rebuild.` }
    ],
    cast: [
      { name: `Priya`, role: `Senior analyst`, archetype: `The Straight Shooter`, power: `Expertise`, note: `Knows the system best. Also wants to rebuild it.` },
      { name: `Marcus`, role: `Team lead`, archetype: `The Competitor`, power: `Seniority`, note: `Has Ellen's ear and a budget to protect.` },
      { name: `Ellen`, role: `Manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Usually goes with whatever the room already agrees on.` },
      { name: `Tom`, role: `Ellen's operations coordinator`, archetype: `The Quiet Influencer`, power: `Access`, note: `Ellen asks his opinion afterward.` }
    ],
    known: [`Priya wants a $180,000 rebuild. Marcus wants a $12,000 patch.`, `On Monday, you nodded along when Priya made her case.`, `Ellen decides Friday, and just asked what you think.`],
    unknown: [`Which fix would actually work.`, `Whether Priya or Marcus is overstating their case.`, `What Ellen cares about most.`],
    clues: [
      { label: `Look at the support tickets`, text: `62% of last quarter's tickets trace back to two of the tool's seven modules.` },
      { label: `Ask Priya how the two modules connect`, text: c => coupled(c) ? `She pulls up a diagram. "Both of them call the scheduler core. Fix one without the other and it breaks again." It's specific, and it checks out.` : patchOk(c) ? `"The whole thing's rotten." Then, quieter: "Okay. Most of those tickets are one bad config file. But it'll rot again."` : `"Everything's tangled. You can't fix two modules on their own." She doesn't show you anything specific.` },
      { label: `Ask Tom what Ellen really cares about`, cost: { note: `Ellen will hear you've been lobbying her people.`, rel: { ellen: -1 } }, text: `"The March budget review. She'll approve anything under $40,000 before March without a fight. Above that, she needs the room to agree."` }
    ],
    question: `What do you tell Ellen?`,
    options: [
      {
        key: 'A', text: `"Rebuild it. Priya's shown me why patching the two worst modules won't hold."`,
        needs: c => coupled(c) ? [1] : [-1], vague: { text: `"Rebuild it. Priya knows that system better than anyone, and I trust her read."`, q: c => coupled(c) ? 3 : patchOk(c) && has(c, 1) ? 0 : 1 },
        their: c => coupled(c) ? `Priya was right, and you had the diagram to show it. Ellen could defend a rebuild with a technical reason, not a loyalty.` : `You backed the expert. The expert was overstating her case, and you took her word for it.`,
        shaped: c => rel(c, 'jordan') < 0 ? `Jordan is wary of you after The Credit Taker, and he's close to Marcus, so the room was harder to move.` : null,
        q: 4, s: { str: 1, inf: 2, com: 1 }, rel: { priya: 2, marcus: -2 },
        outcomes: [
          { p: c => (coupled(c) ? 0.6 : 0.3) + jordanTilt(c), tone: c => coupled(c) ? 'good' : 'mixed', text: c => coupled(c) ? `Ellen approves the rebuild. Six months later the ticket queue is nearly empty. Marcus admits it, once.` : `Ellen approves the rebuild. It runs over budget, and the tickets were mostly a config file.` },
          { p: c => (coupled(c) ? 0.4 : 0.7) - jordanTilt(c), tone: 'mixed', text: `Ellen hears "$180,000" and thinks "March." She goes with the patch. Marcus knows where you stood.` }
        ],
        later: c => coupled(c) ? `You backed the expert because she showed you why. That's different from backing a friend.` : `Experts have interests too. You took a strong opinion as evidence.`
      },
      {
        key: 'B', text: `"Have Priya and Marcus each write one page against the same three tests: cost before March, tickets cut, risk."`,
        their: `Ellen got a decision she didn't have to make on loyalty. It cost a week, and in that week the evidence did the arguing.`,
        q: 3, s: { str: 2, inc: 2, coo: 1, jdg: 2 }, rel: { priya: 0, marcus: 0 },
        outcomes: [
          { p: 0.7, tone: 'good', text: c => coupled(c) ? `Priya's page includes the diagram. Even Marcus can't argue with it. The rebuild is approved, a week late.` : patchOk(c) ? `Priya's page admits the config file. The patch is approved, a week late, and it works.` : `Both pages point at the same two modules. Ellen approves fixing them first.` },
          { p: 0.3, tone: 'mixed', text: `Marcus calls it "homework," and Ellen delays the decision a month. The tests are still the right ones.` }
        ],
        later: `When two advocates disagree, make them argue on the same scale.`
      },
      {
        key: 'C', text: `"Patch it for twelve thousand before March, and revisit the rebuild with real numbers after."`,
        needs: [2], vague: { text: `"Marcus has seen more of these projects than any of us. I'd go with his call."`, q: c => patchOk(c) && has(c, 1) ? 3 : patchOk(c) ? 2 : 1 },
        their: c => patchOk(c) ? `The patch was enough, and it fit under Ellen's March line. Priya lost, and it was the right call.` : coupled(c) ? `The patch fit Ellen's budget and didn't fix anything, because the modules were coupled. The tickets came back in a month.` : `A safe, cheap answer that left most of the tickets in place.`,
        q: c => patchOk(c) ? 4 : coupled(c) ? 1 : 2, s: { jdg: 1, str: 1, coo: -1 }, rel: { marcus: 2, priya: -2 },
        outcomes: [
          { p: c => patchOk(c) ? 0.85 : 0.15, tone: c => patchOk(c) ? 'good' : 'mixed', text: c => patchOk(c) ? `The patch goes in. Tickets drop by half. Priya grumbles, and quietly fixes the config file.` : `The patch goes in. Tickets dip for a few weeks, then climb back.` },
          { p: c => patchOk(c) ? 0.15 : 0.85, tone: 'mixed', text: c => patchOk(c) ? `The patch works, but Priya stops asking for your input. You switched sides from Monday.` : `By April the tool is failing again, and the rebuild costs more than it would have.` }
        ],
        later: `You went with the cheaper story. Sometimes the cheaper story is true.`
      },
      {
        key: 'D', text: `"Rebuild the two modules behind 62% of the tickets now, for under forty thousand, and the rest after March."`,
        needs: [0, 2], vague: { text: `"What about a middle path? Fix the worst parts now and the rest later."`, q: c => coupled(c) && has(c, 1) ? 0 : 2 },
        their: c => coupled(c) ? `A compromise that fails both sides. The modules were coupled, so fixing two broke them again, and both Priya and Marcus blamed you.` : patchOk(c) ? `Better than a full rebuild, but most of the problem was one file. You spent $40,000 to fix a $12,000 problem.` : `Ellen could approve it without a fight, Priya got her rebuild in phases, and Marcus kept his March budget. It worked because the modules were independent.`,
        q: c => coupled(c) ? (has(c, 1) ? 0 : 1) : patchOk(c) ? 2 : 4, s: { str: 2, inc: 2, coo: 2, neg: 2 }, rel: { priya: 1, marcus: 1 },
        shaped: c => rel(c, 'jordan') > 0 ? `Jordan owes you after The Credit Taker, and backed your plan in front of Marcus.` : null,
        outcomes: [
          { p: c => (coupled(c) ? 0.2 : 0.8) + jordanTilt(c), tone: c => coupled(c) ? 'mixed' : 'good', text: c => coupled(c) ? `Approved. Two modules rebuilt. Three weeks later, the scheduler core breaks them again.` : patchOk(c) ? `Approved. Tickets drop, mostly because the rebuild happened to replace the bad config file.` : `Approved without a fight. Tickets drop by 60% by March. Both Priya and Marcus think it was partly their idea.` },
          { p: c => (coupled(c) ? 0.8 : 0.2) - jordanTilt(c), tone: 'mixed', text: c => coupled(c) ? `The phased fix fails in April. Priya says she told everyone. She did.` : `Marcus calls it "a rebuild with extra steps," and Ellen takes another week.` }
        ],
        later: c => coupled(c) ? `Splitting the difference is only wise when the thing can be split.` : `You moved the fight from people to criteria, and the criteria had numbers.`
      },
      {
        key: 'E', text: `Tell Ellen privately what each of them has said to you about the other this week.`,
        their: `Ellen gets information, and learns you repeat private conversations. Priya and Marcus find out, as people always do.`,
        q: 0, s: { coo: -2, lng: -2, com: -1 }, rel: { priya: -1, marcus: -1 },
        outcomes: [{ p: 1, tone: 'bad', text: `Ellen appreciates the intel. A week later, she repeats something Marcus said to you. He works out where she heard it.` }],
        later: `You became the channel for private conversations. People will stop having them with you.`
      }
    ],
    analysis: {
      game: `Advice from biased experts. Priya and Marcus both know more than you, and both want something. The truth is technical, and each of them tells it in the way that helps their side.`,
      incentives: `Priya wants her rebuild. Marcus wants his budget. Ellen wants a decision she can defend before March, and usually follows the room.`,
      leverage: `Ellen's question, and your ability to ask Priya for specifics instead of opinions.`,
      missing: `Whether the two modules were coupled. Priya's answer told you, if you listened to whether she showed you anything.`,
      assumptions: `That the middle path is always wise. That the expert is neutral. That Monday's nod committed you.`,
      controlled: `Whose evidence you asked for, and what you asked them to show.`,
      couldnt: `How the code was written.`,
      concept: { term: `Cheap talk`, name: `Advice from someone who wants something`, thinker: 'nash', body: `When an advisor's interests differ from yours, their advice is "cheap talk": costless to give, and shaded toward what they want. The fix is to ask for things that are costly to fake, like a diagram, a ticket count, or a page judged on shared tests.` },
      second: { term: `Value creation`, name: `Expand the pie, if it can be split`, thinker: 'nalebuff', body: `Nalebuff's co-opetition asks whether rivals can both win. Sometimes a phased plan gives each side most of what they want. Sometimes the problem can't be divided, and a compromise fails both.` },
      better: `Ask Priya to show you. If she can, back the rebuild. If she admits the config file, patch it. If it's vague, phase it, or make both of them write it down.`,
      lesson: `When two experts disagree, ask each to show you, not tell you.`
    }
  }, {
    env: 'kitchen',
    cast: [
      { id: 'priya', spot: 'priya', mood: 'frustrated', pose: 'crossed', wants: `The rebuild. She's sure she's right.` },
      { id: 'marcus', spot: 'marcus', mood: 'confident', pose: 'hips', wants: `Budget safety. And to win.` },
      { id: 'ellen', spot: 'ellen_office', layer: 'far', mood: 'neutral', pose: 'phone', wants: `A decision that won't hurt her in March.` },
      { id: 'tom', spot: 'tom', mood: 'neutral', pose: 'tablet', wants: `Nothing visible. He just notices.` }
    ],
    intro: [
      { cam: 'wide', caption: `Wednesday. Ellen decides on the scheduling tool Friday.` },
      { who: 'priya', mood: 'frustrated', say: `You agreed with me Monday. Patching is throwing good money after bad.` },
      { who: 'marcus', mood: 'confident', say: `A hundred and eighty thousand. For a tool. Back me on Friday.` },
      { cam: 'wide', caption: `They look at each other. Then at you.`, set: { priya: { mood: 'skeptical' }, marcus: { mood: 'skeptical' } } },
      { who: 'ellen', move: { spot: 'ellen_out' }, pose: 'down', cam: 'wide', caption: `Ellen walks past on her way to a meeting.` },
      { who: 'ellen', mood: 'smile', say: `Oh, while I have you. What do you think?` },
      { if: c => (c.flags || {}).danaPattern === 'trade', caption: `Dana mentioned last week: Ellen usually goes with whatever the room already agrees on.` },
      { if: c => (c.rel.jordan || 0) < 0, caption: `Jordan has already told Marcus he's on his side.` },
      { who: 'tom', act: 'glance', cam: 'tom', caption: `In the corner, Tom from operations is very busy not listening.` }
    ],
    options: {
      A: { line: `Rebuild it. Priya's shown me why patching the two worst modules won't hold.`, vague: { line: `Rebuild it. Priya knows that system better than anyone, and I trust her read.` }, preview: `Backs the expert. Only as good as what she can show you.`, row: 1,
        outcomes: [
          { beats: [{ who: 'priya', mood: 'happy', act: 'nod' }, { who: 'marcus', mood: 'frustrated', pose: 'crossed' }] },
          { beats: [{ who: 'ellen', mood: 'thinking', say: `A hundred and eighty, though.` }] }
        ] },
      B: { line: `Have Priya and Marcus each write one page against the same three tests: cost before March, tickets cut, risk.`, preview: `Makes them argue on the same scale. Costs a week.`, row: 0,
        outcomes: [
          { beats: [{ who: 'ellen', mood: 'smile', act: 'nod', say: `I like that. Friday, one page each.` }] },
          { beats: [{ who: 'marcus', mood: 'skeptical', say: `Homework. Great.` }] }
        ] },
      C: { line: `Patch it for twelve thousand before March, and revisit the rebuild with real numbers after.`, vague: { line: `Marcus has seen more of these projects than any of us. I'd go with his call.` }, preview: `Cheap and safe for March. Wrong if the problem runs deeper.`, row: 2,
        outcomes: [
          { beats: [{ who: 'marcus', mood: 'happy', act: 'nod' }, { who: 'priya', mood: 'frustrated', act: 'glance' }] },
          { beats: [{ who: 'priya', mood: 'skeptical', pose: 'crossed', say: `Monday you said something different.` }] }
        ] },
      D: { line: `Rebuild the two modules behind sixty-two percent of the tickets now, for under forty thousand, and the rest after March.`, vague: { line: `What about a middle path? Fix the worst parts now and the rest later.` }, preview: `Something for everyone. Only works if the problem can be split.`, row: 0,
        outcomes: [
          { beats: [{ who: 'ellen', mood: 'happy', act: 'nod', say: `That I can approve.` }] },
          { beats: [{ who: 'marcus', mood: 'skeptical', say: `A rebuild with extra steps.` }] }
        ] },
      E: { caption: `You catch Ellen privately and tell her what each of them has said to you about the other this week.`, preview: `Gives Ellen the full picture. Spends trust you won't get back.`, row: 2,
        outcomes: [{ beats: [{ who: 'ellen', mood: 'thinking', act: 'nod', say: `That's useful. Thank you.` }, { who: 'marcus', mood: 'skeptical', act: 'glance', caption: `A week later, Marcus works out where she heard it.` }] }] }
    },
    matrix: {
      you: `You`, them: `The team`, byType: true,
      rows: [`Ask them to show you, then decide`, `Back one side on trust`, `Split the difference`],
      cols: [`Phased fix works`, `Needs a rebuild`, `Patch is enough`],
      cells: [[[3, 3], [3, 3], [3, 3]], [[1, 1], [2, 1], [2, 1]], [[3, 3], [0, 0], [1, 2]]],
      best: [0, 1],
      note: `The first number is how you come out; the second is the team. Splitting the difference is perfect when the problem can be split, and a disaster when it can't. Asking each side to show their evidence holds up in every column.`
    },
    leverage: { you: [`Ellen asked you`, `The ticket data`, `You can ask for specifics`], them: [`Priya's expertise`, `Marcus's seniority`, `Your nod on Monday`], tilt: 0 },
    links: [['priya', 'marcus', 'at odds with'], ['tom', 'ellen', 'advises']]
  }, {
    A: { buys: ['right', 'liked'], verdict: { who: 'priya', line: `Backed the rebuild. I hope I showed them enough.` } },
    B: { buys: ['info', 'fair', 'future'], verdict: { who: 'ellen', line: `Made them both write it down. That's how I like to decide.` } },
    C: { buys: ['calm', 'win'], verdict: { who: 'marcus', line: `Went with the patch. Smart. Priya won't forget it.` } },
    D: { buys: ['fair', 'future'], verdict: { who: 'ellen', line: `Proposed a middle path I could approve.` } },
    E: { buys: ['info', 'win'], verdict: { who: 'marcus', line: `Repeated what I said in private. I noticed.` } }
  });
})();
