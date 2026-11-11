// The Trader's Mind: a section inspired by Jack Schwager's Market Wizards.
// Not a game about trading. A game about managing yourself where nobody controls the outcome.
// Five challenges share one desk, one account and five kinds of capital. Lose 20% of the
// account and the desk pulls your capital: the section ends, and that is the lesson.
//
// Every company, person and price here is fictional. Each challenge rolls its world once
// (types[]: did the customer leave, was the drug approved), clues hint at which world you're
// in, and grades judge the decision against what you could know, never against the roll.
window.PP = window.PP || {};

(function () {
  const M = {};
  const when = id => c => (c.type === id ? 1 : 0);
  // Nadia signs exceptions only for traders she trusts (Trust below 5 of 10 and she won't).
  const lowTrust = c => !!c.cap && c.cap.soc < 5;
  const refuses = c => lowTrust(c) || (!!c.cap && c.cap.fin <= 90);
  const saw = (c, i) => c.clues.includes(i);
  const edge = c => (c.rules && c.rules.edge) || 'research';
  const tightRule = c => !!c.rules && c.rules.risk === 'tight';

  M.ep = {
    id: 'market', title: `The Trader's Mind`,
    places: [
      { key: 'week', name: `The desk, one week in March`, scenes: ['round-trip-1', 'round-trip-2', 'round-trip-3'] },
      { key: 'april', name: `The desk, April`, scenes: ['the-peg'] },
      { key: 'june', name: `The desk, June`, scenes: ['the-book'] },
      { key: 'january', name: `The desk, January`, scenes: ['the-turn'] },
      { key: 'december', name: `The desk, December`, scenes: ['final-bet'] }
    ]
  };

  // Five kinds of capital. The account is in thousands of dollars; the rest run 0 to 10.
  M.capitals = [
    { k: 'fin', name: `Account`, kind: `Financial capital`, start: 100, max: 200, note: `Money and the means to act.` },
    { k: 'soc', name: `Trust`, kind: `Social capital`, start: 5, max: 10, note: `What the desk and your risk manager believe about you.` },
    { k: 'str', name: `Edge`, kind: `Strategic capital`, start: 5, max: 10, note: `What you know that the market doesn't, and how well you understand your own method.` },
    { k: 'psy', name: `Composure`, kind: `Psychological capital`, start: 5, max: 10, note: `Patience, confidence and the ability to sit still.` },
    { k: 'time', name: `Runway`, kind: `Time capital`, start: 10, max: 10, note: `Chances left to recover and compound. Every challenge spends one.` }
  ];
  M.ruin = 80; // the desk's hard limit: lose 20% of the account and your capital is pulled
  // Nadia's limit ladder. Each step down the account takes, the options shrink with it.
  M.ladder = [
    { at: 95, k: 'review', label: `−5% · Review`, note: `Nadia reviews every position with you.` },
    { at: 90, k: 'half', label: `−10% · Half size`, note: `Limits halved: nothing above a normal-size risk.` },
    { at: 85, k: 'small', label: `−15% · Small only`, note: `Small risk only until you're back above −15%.` },
    { at: 80, k: 'out', label: `−20% · Capital pulled`, note: `The desk takes your capital back.` }
  ];
  M.step = fin => [...M.ladder].reverse().find(l => fin <= l.at) || null;
  // Why Nadia won't sign an option, if she won't: the ladder first, then trust.
  M.lockReason = (cap, exposure, o = {}) => {
    const x = M.exposure[exposure], st = M.step(cap.fin);
    if (o.asks) return null; // asking her is allowed; she answers in the outcome
    if (st && st.k === 'small' && x >= 2) return `Account down 15%: small risk only`;
    if (st && (st.k === 'half' || st.k === 'small') && x >= 3) return `Account down 10%: limits halved`;
    if (cap.soc < 5 && x > 2) return `Trust ${cap.soc}: Nadia won't sign it`;
    return null;
  };
  // Planned risk per decision, in $k, for the R ledger: what the option's label says you could lose.
  M.plannedRisk = { none: 0, small: 1, normal: 2.5, large: 10, all: 25 };

  // Risk the way traders measure it: what you lose if you're wrong, as a share of the account.
  M.rules = {
    risk: {
      q: `How much of your account will you risk on any one idea?`,
      options: [
        { v: 'tight', label: `1%`, d: `About $1,000. If I'm wrong, I lose a little and live to try again.`, max: 1 },
        { v: 'measured', label: `2.5%`, d: `About $2,500. Enough to matter when I'm right, never enough to end me.`, max: 2 },
        { v: 'open', label: `No fixed limit`, d: `I'll size by conviction. The better the idea, the bigger the bet.`, max: 4 }
      ]
    },
    edge: {
      q: `What is your edge?`,
      options: [
        { v: 'research', label: `Research`, d: `I know a few companies better than almost anyone.` },
        { v: 'speed', label: `Reading price`, d: `I see trends and breakouts early and act fast.` },
        { v: 'patience', label: `Patience`, d: `I wait, sometimes for weeks, for a rare and obvious setup.` }
      ]
    }
  };
  M.exposure = { none: 0, small: 1, normal: 2, large: 3, all: 4 };
  M.exposureLabel = { none: `No new risk`, small: `Up to 1% at risk`, normal: `Up to 2.5% at risk`, large: `Up to 10% at risk`, all: `Over 10% at risk` };
  M.exposureVerb = { none: `risked nothing new`, small: `risked up to 1% of the account`, normal: `risked up to 2.5% of the account`, large: `risked up to 10% of the account`, all: `risked more than 10% of the account` };

  // The Book and The Turn share June's portfolio. How much of it the January shock takes depends on what you built.
  M.books = {
    oneBet: { name: `five rate-sensitive names, $12,000 each`, summary: `In June you built five positions that turned out to be one bet on falling rates.` },
    hedged: { name: `the same five names, with a $10,000 rate hedge`, summary: `In June you built five rate-sensitive names and hedged about half of what they shared.` },
    balanced: { name: `a book balanced by risk: three rate names, Tallis, Ashcombe and a rate hedge`, summary: `In June you balanced your book by risk, not by how many names it held.` },
    concentrated: { name: `$40,000 in Quillfeather Software`, summary: `In June you put most of the summer into one name.` },
    cash: { name: `cash`, summary: `In June you stayed in cash.` }
  };
  const bookOf = c => (c.flags && M.books[c.flags.book] ? c.flags.book : 'oneBet');
  const BOOK_LOSS = { oneBet: -14.8, concentrated: -12, hedged: -6, balanced: -2.4, cash: 0 }; // holding through a full turn
  const L = c => BOOK_LOSS[bookOf(c)], A = c => -L(c);
  const r1 = v => Math.round(v * 10) / 10;
  const k$ = v => `${v < 0 ? '−' : ''}$${Math.abs(Math.round(v * 1000)).toLocaleString('en-US')}`;
  const know = c => saw(c, 0); // the recovery data tells you which market you're in
  const delev = c => c.type === 'deleveraging';
  const bookRisk = {
    oneBet: `Everything you own is falling together. Correlation across your five names this week: 0.93. In a crisis, correlations go to one.`,
    hedged: `Your five names are falling together, and the rate hedge is up $3,100, covering about half the drop so far.`,
    balanced: `Your three rate names are down. Tallis is up 4%, Ashcombe is flat, the hedge is up. Net so far: −$800.`,
    concentrated: `One name, $40,000, moving with rates. Quillfeather is down 7% before the open.`,
    cash: `You own nothing. You're watching.`
  };

  // The Round Trip: one Halcyon position across three days. What you did on Monday decides Wednesday's choices.
  const rtGroup = c => (c.flags && c.flags.rt1) || 'out';
  const rtSizeOf = c => (c.flags && typeof c.flags.rtSize === 'number' ? c.flags.rtSize : 0);
  M.rtPosition = f => { const z = f && typeof f.rtSize === 'number' ? f.rtSize : null; return z === null ? `625 shares of Halcyon` : z === 0 ? `none. You're out of Halcyon` : `${Math.round(z / 25 * 625).toLocaleString('en-US')} shares of Halcyon, about $${z}k`; };
  const rtShort = ctx => { const z = rtSizeOf(ctx || {}); return z ? `${Math.round(z / 25 * 625).toLocaleString('en-US')} shares` : `Out`; };

  // Your journal: rules you write after a bad decision, in your own words, that later decisions are held to.
  // An option lists the rules it would break (defies). Breaking one you wrote costs a grade, and the desk says so.
  M.journalRules = {
    stops: { line: `My exits are orders, not intentions.` },
    size: { line: `No single idea above a quarter of the account.` },
    leverage: { line: `No borrowed money without a stop.` },
    together: { line: `I count bets by what moves them, not by their names.` },
    smaller: { line: `After a loss, my next bet gets smaller, not bigger.` }
  };
  const JKEY = 'thedance:journal:v1';
  M.journal = {
    load() {
      try { const j = JSON.parse(localStorage.getItem(JKEY) || '[]'); return Array.isArray(j) ? j.filter(e => e && M.journalRules[e.rule] && typeof e.id === 'string') : []; } catch (e) { return []; }
    },
    save(list) { try { localStorage.setItem(JKEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ } },
    add(entry) { this.save([...this.load().filter(e => !(e.src === entry.src && e.id === entry.id)), entry]); },
    // Drop Desk rules written at or after decision n (a replay rewrote that decision).
    trim(n) { this.save(this.load().filter(e => e.src !== 'desk' || e.at < n)); },
    clear(src) { this.save(this.load().filter(e => e.src !== src)); },
    stored(key) { try { const h = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(h) ? h : []; } catch (e) { return []; } },
    // Rules still backed by the decision they were written after.
    valid(deskHist, callHist) {
      return this.load().filter(e => e.src === 'call' ? callHist.some(h => h && h.id === e.id) : !!deskHist[e.at] && deskHist[e.at].id === e.id);
    },
    from(e) { return e.src === 'call' ? `The Debrief` : ((M.scenarios.find(x => x.id === e.id) || {}).title || `a decision`); }
  };

  // The code is never shown up front. It's revealed at the end, scored from what you did.
  M.principles = [
    { k: 'downside', name: `Protect your downside`, line: `Never risk so much that one decision ends your ability to play.`, scenes: ['round-trip-1', 'final-bet'] },
    { k: 'edge', name: `Find your edge`, line: `Don't play because you want to win. Play because you have a reason to believe you can.`, scenes: ['the-book', 'the-peg'] },
    { k: 'evidence', name: `Follow the evidence`, line: `Don't confuse your predictions, beliefs or ego with reality.`, scenes: ['the-turn', 'round-trip-2'] },
    { k: 'self', name: `Master yourself`, line: `Your impulses are often a more dangerous opponent than the person across from you.`, scenes: ['the-peg', 'round-trip-3'] },
    { k: 'stay', name: `Stay in the game`, line: `Preserve the resources, relationships and opportunities that let you keep playing.`, scenes: ['final-bet', 'the-turn'] }
  ];

  M.scenarios = [
    // ───────────────────────────────────────── 1–3. One position, three days
    {
      id: 'round-trip-1',
      share: 'halcyon',
      opponent: `your attachment`,
      tests: `Can you get out when you said you would?`,
      level: `Honoring the stop`,
      title: `The Round Trip · Monday`,
      lens: ['seykota', 'duke'],
      setting: `The desk · Monday · A hot jobs report`,
      cycle: { t: 3, read: `Middling. Everyone is waiting on the March rate decision, and every data release moves it.` },
      types: [
        { id: 'pivot', p: 0.55, who: `the central bank`, label: `The central bank cut in March`, tell: `Inflation kept cooling where the central bank was watching. It cut in March, and Halcyon ran to $50.` },
        { id: 'nopivot', p: 0.45, who: `the central bank`, label: `The central bank held in March`, tell: `The soft prints were energy prices. Core inflation didn't cool, the March cut never came, and Halcyon slid to $33.` }
      ],
      facts: [
        `You own <strong>625 shares of Halcyon Homes</strong> at $40: $25,000, a quarter of the account.`,
        `Your thesis: the central bank cuts rates in March and homebuilders rerate. Your written stop: <strong>$37</strong>.`,
        `8:30 am: the jobs report runs hot. Halcyon opens at <strong>$36.40</strong>, straight through your stop.`,
        `The book is deep: 2,000 shares bid at $36.40. You can sell all 625 at once.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `Has watched a lot of stops get "reconsidered".` },
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Reads every stop you write. Notices which ones you keep.` }
      ],
      known: [`You own 625 Halcyon at $40.`, `Your written stop was $37.`, `It opened at $36.40.`],
      unknown: [`Whether the March cut is still coming.`, `Where Halcyon will be on Wednesday.`],
      clues: [
        { label: `Your written plan`, text: `"Stop: $37. If the jobs data runs hot, the March cut is in doubt and so is the trade." You wrote it three weeks ago, calmly.` },
        { label: `Ask Theo`, text: `"A gap through your stop isn't a reason to ignore it. It's the stop working late. The question is never 'will it come back'. It's 'would I buy it here'."` },
        { label: `What's priced in?`, text: `Futures priced two rate cuts by March before the report. Now they price one. Halcyon still prices most of the second.` }
      ],
      edgeNote: {
        research: `You know Halcyon's order book better than anyone. The trade wasn't about Halcyon. It was about March, and that's what the report just changed.`,
        speed: `A gap through your level is exactly the signal your method says to respect. It's also exactly when respecting it hurts most.`,
        patience: `Patience is waiting for the setup. It isn't waiting for a broken one to fix itself.`
      },
      question: `It gapped through your stop. What do you do?`,
      options: [
        {
          key: 'A', text: `Sell all 625 at $36.40. The stop was the plan.`, did: `Sold at the stop, through the gap.`, exposure: 'none', flags: { rt1: 'out', rtSize: 0 },
          q: 4, s: { jdg: 2, reg: 2, bnd: 2 }, cap: { psy: 1, soc: 1 },
          outcomes: [{ p: 1, tone: 'mixed', fin: -2.3, text: `You sell all 625 at $36.40: −$2,250, a little worse than the stop you wrote. By Wednesday Halcyon is back to $39.50. It stings. It was still the right decision.` }],
          later: `You did what you said you'd do, at a worse price than you planned. That's what a stop is for. Wednesday's bounce is a new decision, not a verdict on Monday's.`,
          verdict: { who: 'nadia', line: `Gapped through the stop and sold anyway. I initialed it. "Clean."` }
        },
        {
          key: 'B', text: `Hold. One hot report. It'll come back.`, did: `Held through the stop.`, exposure: 'large', flags: { rt1: 'in', rtSize: 25 }, defies: ['stops'],
          q: 1, s: { jdg: -1, reg: -1, bnd: -2 }, cap: { soc: -1 },
          outcomes: [{ p: 1, tone: 'good', fin: -0.3, text: `By Wednesday Halcyon is back to $39.50, down only $300 on the position. It came back. That's the worst thing that could have taught you.` }],
          later: `It came back, which makes holding through the next stop feel smart. A stop you ignore when it's inconvenient isn't a stop.`,
          verdict: { who: 'theo', line: `Moved the stop to wherever the price was. Got away with it. That's how the habit starts.` }
        },
        {
          key: 'C', text: `Average down: buy 625 more at $36.40. Same thesis, better price.`, did: `Doubled down through the stop.`, exposure: 'all', flags: { rt1: 'in', rtSize: 50 }, defies: ['stops', 'size', 'smaller'],
          q: 0, s: { jdg: -3, reg: -2, bnd: -2 }, cap: { soc: -2, psy: -1 },
          outcomes: [{ p: 1, tone: 'good', fin: 1.6, text: `By Wednesday Halcyon is $39.50 and the doubled position is up $1,600. You feel brilliant. Half the account is now on one thesis about March.` }],
          later: `It worked, and now half the account depends on one rate decision. Doubling down through a broken stop is the losing position again, wearing a winning coat.`,
          verdict: { who: 'nadia', line: `Bought more through their own stop. It's up. I'm more worried than if it were down.` }
        },
        {
          key: 'D', text: `Sell half now, and keep a stop at $35 on the rest.`, did: `Sold half and reset the stop.`, exposure: 'normal', flags: { rt1: 'half', rtSize: 12.5 },
          q: 3, s: { jdg: 1, reg: 1, bnd: 1 }, cap: { psy: 1 },
          outcomes: [{ p: 1, tone: 'mixed', fin: -1.3, text: `Half out at $36.40. By Wednesday the rest is back to $39.50. −$1,300 so far: half the plan, half a hope.` }],
          later: `A compromise with your own rule. Better than ignoring it. Ask whether you'd have bought the half you kept.`,
          verdict: { who: 'nadia', line: `Kept half the promise. I'll take it. I'd rather have all of it.` }
        }
      ],
      analysis: {
        game: `A trade against your own written plan. The market didn't change your thesis; one report did, and your stop was the plan for exactly that report.`,
        incentives: `Selling makes the loss real. Holding keeps the hope, and the hope feels like information.`,
        leverage: `A deep book: you could sell all 625 at once. Liquidity meant the stop was always available.`,
        missing: `Whether March was still coming. Nobody knew on Monday.`,
        assumptions: `That a stop is a suggestion. That if it comes back, holding was right.`,
        controlled: `Whether you kept the promise you made three weeks ago.`,
        couldnt: `The jobs report, and Wednesday's bounce.`,
        concept: { thinker: 'seykota', term: `Honoring the stop`, name: `Know where you'll get out before you get in. Then get out there.`, body: `Seykota's rules are short because they're hard: cut losses, ride winners, keep bets small. A stop decided calmly is better information than a decision made at the open with the loss on the screen.` },
        second: { thinker: 'duke', term: `Resulting`, name: `Wednesday's price doesn't grade Monday's decision`, body: `Holding came back and selling cost money, this time. Duke's test: if you replayed Monday a hundred times, which choice leaves you better off across all of them?` },
        better: `A. Sell where you said you would, even through the gap. D if you can't: half out, a real stop on the rest.`,
        lesson: `A stop you only keep when it's convenient isn't a stop. It's a mood.`
      },
      life: { title: `The line you drew`, text: `You promised yourself you'd leave if the promotion didn't come by spring. Spring came and went. Staying is easier, and this week it even looks fine.` }
    },
    {
      id: 'round-trip-2',
      share: 'halcyon',
      freeTime: true,
      opponent: `your anchor`,
      tests: `Can you buy back higher than you sold?`,
      level: `Anchoring`,
      title: `The Round Trip · Wednesday`,
      lens: ['duke', 'seykota'],
      setting: `The desk · Wednesday · A soft inflation print`,
      cycle: { t: 3, read: `Middling. Monday's panic is gone. Nobody remembers it but the people who sold.` },
      types: [
        { id: 'pivot', p: 0.55, who: `the central bank`, label: `The central bank cut in March`, tell: `Core services inflation kept cooling. The central bank cut in March, and Halcyon ran to $50.` },
        { id: 'nopivot', p: 0.45, who: `the central bank`, label: `The central bank held in March`, tell: `The soft print was energy prices. Core inflation didn't cool, and the March cut never came.` }
      ],
      facts: [
        `This morning's inflation print came in soft. Halcyon is <strong>$39.50</strong>, back above Monday's stop.`,
        `Your position: <strong>{halcyon}</strong>.`,
        `Your thesis hasn't changed: a rate cut in March.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `Has bought back higher than he sold more times than he can count.` }
      ],
      known: [`Halcyon is $39.50.`, `The inflation print was soft.`, `You sold, held or halved on Monday.`],
      unknown: [`Whether the soft print is the kind the central bank cares about.`],
      clues: [
        { label: `Read the inflation details`, text: c => c.type === 'pivot' ? `Core services inflation cooled for a second month: the number the central bank says it watches.` : `The headline was soft because of energy prices. Core services inflation re-accelerated.` },
        { label: `What's priced in?`, text: `Futures price one cut by March. Your thesis says two or three. If you're right, most of the move is still ahead.` },
        { label: `Ask Theo`, text: `"Buying back higher than you sold feels like admitting the sale was wrong. It wasn't. That was Monday's decision. This is Wednesday's."` }
      ],
      question: `The price is back. What do you do now?`,
      options: [
        {
          key: 'A', when: c => rtGroup(c) === 'out', text: `Buy back in: $25,000, stop at $37.`, did: `Bought back in at the same size.`, exposure: 'normal', flags: { rtSize: 25 },
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 3 : 1) : 3, s: { jdg: 2, reg: 1 }, cap: { str: 1 },
          outcomes: [{ p: 1, tone: 'good', fin: 1.1, text: `Back in at $39.50 with a stop at $37. By Friday it's $41.20: +$1,100.` }],
          later: `You paid $3 more than you sold for, and it was the right price to pay if the thesis was alive.`,
          verdict: { who: 'theo', line: `Sold at the stop, bought back higher. That's not indecision. That's two good decisions.` }
        },
        {
          key: 'B', when: c => rtGroup(c) === 'out', text: `Buy back bigger: $50,000, stop at $37.80. Risk about $2,150.`, did: `Bought back bigger on new evidence.`, exposure: 'normal', flags: { rtSize: 50 },
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 4 : 0) : 2, s: { jdg: 2, str: 2 }, cap: { str: 2 },
          outcomes: [{ p: 1, tone: 'good', fin: 2.2, text: `Back in at twice the size with a tight stop. By Friday it's $41.20: +$2,150.` }],
          later: c => c.type === 'pivot' && saw(c, 0) ? `The evidence got better, so you got bigger, with a stop that kept the risk where it was. That's sizing to the evidence.` : `Bigger is only right when the evidence got better. Did you check?`,
          verdict: { who: 'nadia', line: `Came back in at twice the size, with a stop I could see. Fine by me, if they read the details.` }
        },
        {
          key: 'C', when: c => rtGroup(c) === 'out', text: `Not paying $3 more than you sold for. Stay out.`, did: `Refused to pay more than they sold for.`, exposure: 'none', flags: { rtSize: 0 },
          q: c => saw(c, 0) && c.type === 'nopivot' ? 3 : 1, s: { jdg: -1 }, cap: {},
          outcomes: [{ p: 1, tone: 'mixed', fin: 0, text: `Halcyon is $41.20 by Friday. You're out, waiting for a price that may not come.` }],
          later: c => saw(c, 0) && c.type === 'nopivot' ? `You read the details and the soft print wasn't the right kind. Staying out was evidence, not ego.` : `"I sold lower" is a fact about you, not about Halcyon. Anchoring on your own exit is the sunk cost fallacy in reverse.`,
          verdict: { who: 'theo', line: `Wouldn't pay more than they sold for. The market doesn't know what you sold for.` }
        },
        {
          key: 'D', when: c => rtGroup(c) === 'out', text: `Put in an order to buy back at $37.50, and wait.`, did: `Waited for a cheaper price.`, exposure: 'none', flags: { rtSize: 0 },
          q: 2, s: { reg: 1 }, cap: {},
          outcomes: [{ p: 1, tone: 'mixed', fin: 0, text: `Your order at $37.50 never fills. Halcyon is $41.20 by Friday.` }],
          later: `A limit order is a plan. Make sure it's a plan for the trade, not for the feeling of having sold too low.`,
          verdict: { who: 'theo', line: `Wanted it cheaper. Most people do.` }
        },
        {
          key: 'E', when: c => rtGroup(c) === 'half', text: `Add back to full size, stop at $37.`, did: `Added back to full size.`, exposure: 'normal', flags: { rtSize: 25 },
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 4 : 1) : 3, s: { jdg: 2 }, cap: { str: 1 },
          outcomes: [{ p: 1, tone: 'good', fin: 1.1, text: `Back to full size at $39.50. By Friday it's $41.20: +$1,100.` }],
          later: `You treated the half you sold as Monday's decision and sized Wednesday's on Wednesday's evidence.`,
          verdict: { who: 'theo', line: `Added back on new evidence. Good. That's how a position should grow.` }
        },
        {
          key: 'F', when: c => rtGroup(c) === 'half', text: `Keep the half you have.`, did: `Kept the half.`, exposure: 'small', flags: { rtSize: 12.5 },
          q: 3, s: { reg: 1 }, cap: {},
          outcomes: [{ p: 1, tone: 'mixed', fin: 0.5, text: `Half a position, up $500 by Friday.` }],
          later: `Steady. Neither more right nor more wrong than Monday.`,
          verdict: { who: 'nadia', line: `Kept the half. Nothing to see. I like nothing to see.` }
        },
        {
          key: 'G', when: c => rtGroup(c) === 'half', text: `Sell the rest at $39.50, glad to be out near break-even.`, did: `Sold the rest near break-even.`, exposure: 'none', flags: { rtSize: 0 },
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 1 : 4) : 2, s: { reg: 1 }, cap: {},
          outcomes: [{ p: 1, tone: 'mixed', fin: 0, text: `Out at $39.50. By Friday Halcyon is $41.20.` }],
          later: `Getting out "near break-even" is about your purchase price, not the trade. Sell because of the evidence, not the number.`,
          verdict: { who: 'theo', line: `Sold to get back to even. The market doesn't care about even.` }
        },
        {
          key: 'H', when: c => rtGroup(c) === 'in', text: `Put the stop back at $37 and keep holding.`, did: `Reset the stop and held.`, exposure: 'normal', flags: {},
          q: c => saw(c, 0) && c.type === 'nopivot' ? 2 : 3, s: { reg: 1, bnd: 1 }, cap: {},
          outcomes: [{ p: 1, tone: 'good', fin: c => r1(rtSizeOf(c) * 0.043), text: c => `You put the stop back. By Friday Halcyon is $41.20: ${k$(rtSizeOf(c) * 0.043)}.` }],
          later: `A stop again, at last. The question is whether you'd keep this one.`,
          verdict: { who: 'nadia', line: `Put the stop back. I'll believe it when I see it filled.` }
        },
        {
          key: 'I', when: c => rtGroup(c) === 'in', text: `Sell at $39.50, near break-even, and start clean.`, did: `Sold near break-even to start clean.`, exposure: 'none', flags: { rtSize: 0 },
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 2 : 4) : 3, s: { jdg: 1, reg: 1 }, cap: { psy: 1 },
          outcomes: [{ p: 1, tone: 'mixed', fin: 0, text: `Out at $39.50. Whatever happens Friday happens without the position you held through a stop.` }],
          later: `You got out of a position you shouldn't still have had. Whether to get back in is a new decision.`,
          verdict: { who: 'theo', line: `Took the bounce as a second chance to do Monday's job. Smart.` }
        },
        {
          key: 'J', when: c => rtGroup(c) === 'in', text: `Add $25,000 more. It's working.`, did: `Added more to a position held through its stop.`, exposure: 'all', flags: c => ({ rtSize: rtSizeOf(c) + 25 }), defies: ['size'],
          q: 0, s: { jdg: -2, reg: -2 }, cap: { soc: -1 },
          outcomes: [{ p: 1, tone: 'good', fin: c => r1((rtSizeOf(c) + 25) * 0.043), text: c => `By Friday Halcyon is $41.20: ${k$((rtSizeOf(c) + 25) * 0.043)}. Most of your account now rides on March.` }],
          later: `You were rewarded for breaking a rule, and responded by betting more. That's the pattern that ends careers.`,
          verdict: { who: 'nadia', line: `Held through the stop, then added. I've started a file.` }
        }
      ],
      analysis: {
        game: `The same position, two days later, with new evidence. The hardest part isn't the market. It's the price you sold at, sitting in your head.`,
        incentives: `Buying back higher feels like admitting Monday was wrong. Selling near even feels like escaping. Neither is about the trade.`,
        leverage: `The inflation details, which said whether the soft print was the kind the central bank watches.`,
        missing: `Whether this was the right kind of soft.`,
        assumptions: `That the price you sold at matters to the market. That a bounce proves holding was right.`,
        controlled: `Whether you judged Wednesday on Wednesday's evidence.`,
        couldnt: `The print, and March.`,
        concept: { thinker: 'duke', term: `Anchoring`, name: `The price you sold at is a fact about you, not about the market`, body: `Refusing to pay more than you sold for is the sunk cost fallacy run backwards. Duke's question is the same one as Monday's: if you'd never owned it, would you buy it here?` },
        second: { thinker: 'seykota', term: `No attachment`, name: `Get out without regret, get back in without shame`, body: `Getting out at the stop and back in higher are the same skill: acting on the evidence instead of on your history with the position.` },
        better: `Read the details. If core inflation is cooling, buy back in, bigger if the evidence got better, with a stop. If it's only energy, stay out or get out.`,
        lesson: `The market doesn't know what you sold for. Neither should your next decision.`
      },
      life: { title: `The apartment`, text: `You passed on an apartment at $2,400 a month. Two months later it's back on the market at $2,550, and it's still the best one you've seen. Paying more than you could have is not a reason to live somewhere worse.` }
    },
    {
      id: 'round-trip-3',
      share: 'halcyon',
      freeTime: true,
      opponent: `your pride`,
      tests: `Can you take an order you disagree with?`,
      level: `Authority`,
      title: `The Round Trip · Friday`,
      lens: ['aumann', 'seykota'],
      setting: `The desk · Friday · Victor's order`,
      cycle: { t: 3, read: `Middling, and nervous. Another desk's loss has everyone checking their own.` },
      types: [
        { id: 'pivot', p: 0.55, who: `the central bank`, label: `The central bank cut in March`, tell: `It cut in March. Halcyon ran to $50, and the March calls paid about four times.` },
        { id: 'nopivot', p: 0.45, who: `the central bank`, label: `The central bank held in March`, tell: `No cut in March. Halcyon slid to $33, and stops at $37 filled on the way down.` }
      ],
      facts: [
        `Halcyon is <strong>$41.20</strong>. Your position: <strong>{halcyon}</strong>.`,
        `Another desk lost $4 million overnight. Victor Ames, who runs the floor, orders every trader to <strong>halve their positions by the close</strong>.`,
        `March calls on Halcyon, which pay off above $45, cost about $600 for a meaningful amount.`
      ],
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Victor's order`, note: `Relays the order. Enforces it.` },
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `Has been ordered to cut his best trade before.` }
      ],
      known: [`Victor wants every position halved by the close.`, `Halcyon is $41.20.`, `March calls cost about $600.`],
      unknown: [`Whether March brings a cut.`],
      clues: [
        { label: `Futures this morning`, text: c => c.type === 'pivot' ? `Futures price two cuts by March again. The market is coming around to your thesis.` : `Futures now price no cuts by March. The market has given up on your thesis.` },
        { label: `Ask Nadia if the order applies to you`, text: `"It applies to everyone. Victor doesn't do exceptions on a Friday, and I don't argue his on his behalf."` },
        { label: `What's priced in?`, text: `March calls are cheap because the market thinks a cut is a coin flip. If you're right, they pay about four times. If you're wrong, you lose the $600.` }
      ],
      question: `Victor says halve it. Do you?`,
      options: [
        {
          key: 'A', when: c => rtSizeOf(c) > 0, text: `Cut half, as ordered.`, did: `Cut half, as ordered.`, exposure: 'small',
          q: 3, s: { coo: 2, bnd: 1 }, cap: { soc: 1 },
          outcomes: [
            { p: when('pivot'), tone: 'good', fin: c => r1(rtSizeOf(c) * 0.5 * 0.21), text: c => `The cut comes in March. Your remaining half runs to $50: ${k$(rtSizeOf(c) * 0.5 * 0.21)}.` },
            { p: when('nopivot'), tone: 'mixed', fin: c => r1(rtSizeOf(c) * 0.5 * -0.1), text: c => `No cut. Your stop catches the remaining half on the way down: ${k$(rtSizeOf(c) * 0.5 * -0.1)}.` }
          ],
          later: `You followed an order you disagreed with and kept half your thesis. That's how you stay on a desk long enough to be right big.`,
          verdict: { who: 'nadia', line: `Cut half when Victor asked. Didn't argue. That buys more trust than any P&L.` }
        },
        {
          key: 'B', when: c => rtSizeOf(c) > 0, text: `Refuse. You're right about March, and the order is for other desks' mistakes.`, did: `Refused the order.`, defies: ['size'], exposure: c => rtSizeOf(c) >= 50 ? 'large' : 'normal',
          q: 1, s: { coo: -2, bnd: 1, jdg: -1 }, cap: { soc: -2 },
          outcomes: [
            { p: when('pivot'), tone: 'good', fin: c => r1(rtSizeOf(c) * 0.21), text: c => `You were right about March: ${k$(rtSizeOf(c) * 0.21)}. Victor remembers the refusal longer than the profit.` },
            { p: when('nopivot'), tone: 'bad', fin: c => r1(rtSizeOf(c) * -0.1), text: c => `No cut. Your stop fills on the way down: ${k$(rtSizeOf(c) * -0.1)}, the full size Victor told you to halve.` }
          ],
          later: `Being right doesn't make refusing a risk order right. On a desk, your limits are borrowed trust.`,
          verdict: { who: 'nadia', line: `Refused a floor-wide order because they were sure. I don't care if they were right.` }
        },
        {
          key: 'C', when: c => rtSizeOf(c) > 0, text: `Cut half, and buy $600 of March calls to keep the upside.`, did: `Cut half and kept the upside with calls.`, exposure: 'small',
          q: 4, s: { coo: 2, jdg: 2, str: 2 }, cap: { soc: 1, str: 1 },
          outcomes: [
            { p: when('pivot'), tone: 'good', fin: c => r1(rtSizeOf(c) * 0.5 * 0.21 + 2.4), text: c => `The cut comes. Your half runs to $50 and the calls pay four times: ${k$(rtSizeOf(c) * 0.5 * 0.21 + 2.4)}.` },
            { p: when('nopivot'), tone: 'mixed', fin: c => r1(rtSizeOf(c) * 0.5 * -0.1 - 0.6), text: c => `No cut. Your stop catches the half and the calls expire: ${k$(rtSizeOf(c) * 0.5 * -0.1 - 0.6)}. A capped loss on a thesis you kept.` }
          ],
          later: `You obeyed the order and kept the bet, for a cost you could name in advance. Following the rules and staying aggressive aren't opposites.`,
          verdict: { who: 'nadia', line: `Halved the position and bought the upside back for six hundred dollars. That's what I'd want Victor to see.` }
        },
        {
          key: 'D', when: c => rtSizeOf(c) > 0, text: `Sell all of it. If the floor is nervous, so are you.`, did: `Sold all of it.`, exposure: 'none',
          q: c => saw(c, 0) ? (c.type === 'nopivot' ? 4 : 1) : 2, s: { reg: 1 }, cap: {},
          outcomes: [
            { p: when('pivot'), tone: 'mixed', fin: 0, text: `The cut comes in March and Halcyon runs to $50 without you.` },
            { p: when('nopivot'), tone: 'good', fin: 0, text: `No cut. Halcyon slides to $33. You're out.` }
          ],
          later: c => saw(c, 0) && c.type === 'nopivot' ? `The futures had given up on March. You sold because of that, not because of the floor's nerves.` : `Selling everything because others are scared is borrowing their fear. Was it your evidence?`,
          verdict: { who: 'theo', line: `Sold the lot. Sometimes that's wisdom. Sometimes it's the floor's nerves.` }
        },
        {
          key: 'E', when: c => rtSizeOf(c) === 0, text: `Nothing to cut. Stay out.`, did: `Stayed out.`, exposure: 'none',
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 2 : 4) : 3, s: { reg: 1 }, cap: {},
          outcomes: [
            { p: when('pivot'), tone: 'mixed', fin: 0, text: `The cut comes in March. Halcyon runs to $50 without you.` },
            { p: when('nopivot'), tone: 'good', fin: 0, text: `No cut. Halcyon slides to $33. You watched.` }
          ],
          later: `Nothing to cut, nothing to lose. Was it a decision, or Monday's sale still deciding for you?`,
          verdict: { who: 'theo', line: `Out since Monday. Fine, if it's the evidence talking.` }
        },
        {
          key: 'F', when: c => rtSizeOf(c) === 0, text: `Buy $600 of March calls: a small, capped way back into the thesis.`, did: `Bought a capped way back into the thesis.`, exposure: 'small',
          q: c => saw(c, 0) ? (c.type === 'pivot' ? 4 : 1) : 3, s: { jdg: 2, str: 1 }, cap: { str: 1 },
          outcomes: [
            { p: when('pivot'), tone: 'good', fin: 2.4, text: `The cut comes. Your calls pay about four times: +$2,400.` },
            { p: when('nopivot'), tone: 'mixed', fin: -0.6, text: `No cut. The calls expire: −$600, exactly what you could lose.` }
          ],
          later: `A small, capped bet on a thesis you still believed. You kept your exit discipline and your conviction.`,
          verdict: { who: 'nadia', line: `Six hundred dollars of upside, no position to cut. Tidy.` }
        }
      ],
      analysis: {
        game: `Your conviction against the desk's rules. Victor's order isn't about Halcyon. It's about a floor that just learned what one bad night costs.`,
        incentives: `You want to be right about March. Victor wants no more $4 million nights. Nadia wants both of you to still trust each other on Monday.`,
        leverage: `Options: a way to keep the upside for a cost you can name, while still cutting the risk you were told to cut.`,
        missing: `Whether March brings a cut. The futures were the best evidence.`,
        assumptions: `That obeying means giving up the thesis. That being right justifies refusing.`,
        controlled: `How you followed the order, not whether.`,
        couldnt: `Victor, and the central bank.`,
        concept: { thinker: 'aumann', term: `Repeated games`, name: `Your limits are borrowed trust`, body: `A desk is a repeated game. Refusing an order once, even when you're right, changes how much room you're given every day after. Aumann's insight: the shadow of the future changes the best move today.` },
        second: { thinker: 'seykota', term: `Risk, not conviction`, name: `Keep the bet, cap the cost`, body: `When you're told to cut risk but still believe, look for the version of the bet that risks less: smaller size, a defined-loss option, a later entry.` },
        better: `C. Cut half as ordered, and keep the upside for $600 of calls. If you were already out, F. If the futures had given up on March, D or E.`,
        lesson: `You can follow the rules and stay aggressive. The skill is finding the version of the bet that fits inside them.`
      },
      life: { title: `The reorg`, text: `Your manager tells the team to freeze hiring after another team blew its budget. You have the perfect candidate. You can argue, quietly hire anyway, or find a contractor who can start now and convert later.` }
    },

    // ───────────────────────────────────────── 2. A capped downside, and a large upside
    {
      id: 'the-peg',
      opponent: `your timidity`,
      tests: `Can you bet big when the downside is capped?`,
      level: `Asymmetry`,
      title: `The Peg`,
      lens: ['schelling', 'seykota'],
      setting: `The desk · April · The crown at the floor of its band`,
      cycle: { t: 2, read: `Cooling. Rates are rising into a slowdown, and currency markets are where the stress shows first. Theo: "Pegs don't break on the day you expect. They break on the day everyone stops expecting it."` },
      types: [
        { id: 'breaks', p: 0.55, who: `the peg`, label: `The peg broke`, tell: `Valdor's reserves were nearly gone, and the "forward commitments" in the footnote were promises to sell what was left. The crown fell 12% in a weekend.` },
        { id: 'holds', p: 0.45, who: `the peg`, label: `The peg held`, tell: `The Bloc had quietly opened a $30 billion swap line to Valdor. The crown bounced off the floor and squeezed anyone short.` }
      ],
      facts: [
        `The Republic of Valdor pegs its <strong>crown</strong> to the Bloc mark within ±1%. Today it sits at the <strong>floor</strong> of that band.`,
        `Last week Valdor's central bank raised rates by 2 points to defend it, into a recession with 11% unemployment.`,
        `If the peg breaks, the crown is expected to fall about <strong>12%</strong>. If it holds, it bounces toward the middle of the band, about 1% higher.`,
        `Crown forwards trade about $40 billion a day. Your size is a rounding error: you can get out at your stop. Nadia allows 2× leverage in liquid currencies.`,
        `Your account: <strong>{account}</strong>. Your rule: {rule} of the account at risk on any one idea.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `Was on a desk the weekend a peg broke. Doesn't talk about how much he made.` },
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Approves leverage by exception only.` }
      ],
      known: [`The crown is at the floor of its band.`, `A break means about −12%. Holding means about +1%.`, `You can always exit at your stop.`],
      unknown: [`How much Valdor has left to defend with.`, `Whether the Bloc will step in.`],
      clues: [
        { label: `Valdor's reserve report`, text: c => c.type === 'breaks' ? `Reserves are down 40% in six weeks. A footnote mentions "forward commitments" that aren't in the headline number. Promises to sell crowns' worth of reserves they no longer have.` : `Reserves are down 8%. And a line in the Bloc's weekly statement shows a $30 billion swap line to Valdor, opened quietly ten days ago.` },
        { label: `The Bloc's meeting minutes`, text: `"Support for partners within the system" appears once, in the last paragraph. No numbers, no names. Both sides of the trade are quoting it.` },
        { label: `Ask Theo about the rate hike`, text: `"Every hike deepens the recession that makes the peg less believable. Defending it is also attacking it. The price changes the thing it's pricing. That's what makes these trades big when they go."` },
        { label: `What's priced in?`, text: `Forwards imply about a 3% fall over three months: roughly a one-in-four chance of a 12% devaluation. If you think it's better than that, the market is paying you to be right, and your stop is only 1% away. Valdor Rail, which earns in marks and pays costs in crowns, is at a ten-year low: nobody has priced a cheaper crown into its profits.` }
      ],
      edgeNote: {
        research: `Currencies aren't companies, but reserves are a balance sheet. Read it like one: what's owed matters more than what's shown.`,
        speed: `The crown is sitting on the floor of its band. Floors break fast. Your edge is being positioned before the weekend, not reacting after it.`,
        patience: `This is the setup you wait all year for: a small, known loss if you're wrong and a large one-way move if you're right. Waiting earned you the right to size it.`
      },
      question: `The downside is capped. How big do you go?`,
      options: [
        {
          key: 'A', text: `Short $50,000 of crowns, stop at the middle of the band. Risk about $500.`, did: `Shorted the crown small, with a stop.`, exposure: 'small',
          q: c => saw(c, 0) ? (c.type === 'holds' ? 1 : tightRule(c) ? 4 : 2) : tightRule(c) ? 4 : 3, s: { jdg: 1, bnd: 1 }, cap: { psy: 1 },
          outcomes: [
            { p: when('breaks'), tone: 'mixed', fin: 6, text: `The peg breaks on Saturday. The crown opens Monday 12% lower. You make $6,000 on a trade that could have made four times that for the same planned loss.` },
            { p: when('holds'), tone: 'mixed', fin: -0.5, text: `The Bloc announces a swap line on Thursday. The crown jumps to the middle of its band and your stop takes you out: −$500, as planned.` }
          ],
          later: `Survivable in every world. But a capped downside is exactly when small size costs you the most.`,
          verdict: { who: 'theo', line: `Right idea, right stop, a quarter of the size. That's the trade I'd have wanted to see sized up.` }
        },
        {
          key: 'B', text: `Short $200,000 of crowns at 2× leverage, stop at the middle of the band. Risk about $2,000.`, did: `Sized up on a capped downside.`, exposure: 'normal',
          q: c => saw(c, 0) && c.type === 'holds' ? 1 : tightRule(c) ? 2 : 4, s: { jdg: 2, str: 2, bnd: 1 }, cap: { psy: 1, str: 2 },
          outcomes: [
            { p: when('breaks'), tone: 'good', fin: 24, text: `The peg breaks on Saturday. The crown opens Monday 12% lower. $24,000: the best trade of your year, for a planned loss of $2,000.` },
            { p: when('holds'), tone: 'mixed', fin: -2.1, text: `The Bloc announces a swap line on Thursday. The crown jumps and your stop fills a touch late: −$2,100, close to what you planned.` }
          ],
          later: `The position looked enormous. The risk was 2% of the account, because the exit was 1% away and the market could always take your size.`,
          verdict: { who: 'nadia', line: `Two hundred thousand of notional, two thousand of risk. That's the arithmetic I want everyone on this desk to understand.` }
        },
        {
          key: 'C', text: `Short $100,000 of crowns with a stop, and buy $25,000 of Valdor Rail, which earns in marks and pays in crowns.`, did: `Traded the peg and the stock it would move.`, exposure: 'normal',
          q: c => saw(c, 0) && c.type === 'holds' ? 1 : tightRule(c) ? 2 : saw(c, 3) ? 4 : 3, s: { jdg: 2, str: 2, inc: 1 }, cap: { str: 2 },
          outcomes: [
            { p: when('breaks'), tone: 'good', fin: 19.5, text: `The peg breaks. The crown short makes $12,000, and Valdor Rail rises 30% as a cheaper crown fattens its margins: another $7,500.` },
            { p: when('holds'), tone: 'mixed', fin: -3, text: `The peg holds. Your crown stop costs $1,000, and Valdor Rail drifts 8% lower with the rest of a recession: −$3,000 in all.` }
          ],
          later: `Policy moves the currency, and the currency moves the companies. You traded the second link in the chain, which almost nobody had priced.`,
          verdict: { who: 'theo', line: `Found the stock the devaluation would pay. Most people stop at the currency.` }
        },
        {
          key: 'D', text: `Buy $100,000 of crowns and collect the 9% interest rate while the peg holds.`, did: `Bought the crown for the interest.`, exposure: 'large',
          q: 0, s: { jdg: -2, inf: -1, reg: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: when('breaks'), tone: 'bad', fin: -12, text: `The peg breaks on Saturday. Your 9% a year earned you about $75 before the crown fell 12%. −$12,000.` },
            { p: when('holds'), tone: 'good', fin: 0.8, text: `The peg holds. You collect about $800 in interest over the month.` }
          ],
          later: `You picked up pennies in front of a train: a small, steady gain with a large loss waiting on the one day that mattered.`,
          verdict: { who: 'nadia', line: `Bought a currency for its interest rate, the week its central bank was running out of money. I'd like to talk about how that looked.` }
        },
        {
          key: 'E', text: `Ask Nadia for an exception: short $400,000 at 4×, no stop, and add on the next hike.`, did: `Asked for 4× with no stop.`, exposure: 'all', asks: true, defies: ['leverage', 'stops'],
          q: c => saw(c, 2) ? 0 : 1, s: { reg: -3, jdg: -3, lng: -2, bnd: -2 }, cap: { psy: -2, soc: -2 },
          outcomes: [
            { p: c => refuses(c) ? 0 : when('breaks')(c), tone: 'good', fin: 48, text: `The peg breaks. At 4×, a 12% fall is $48,000. You'll spend years trying to feel this again.` },
            { p: c => refuses(c) ? 0 : when('holds')(c), tone: 'bad', fin: -23, text: `The Bloc steps in. Valdor pushes overnight rates to 300% to burn the shorts, and with no stop you're squeezed out at the top of the band. −$23,000.` },
            { p: c => refuses(c) ? 1 : 0, tone: 'mixed', fin: 0, text: `Nadia reads it and slides it back. "Two times, with a stop, or nothing." You end up with nothing.` }
          ],
          later: `The highest average on the board, and the only move that could end your year. Never losing big beats winning big once.`,
          verdict: { who: 'nadia', line: `No stop, four times, in a market a central bank can squeeze on purpose. No.` }
        },
        {
          key: 'F', text: `Pass. Currencies aren't your game.`, did: `Passed on the peg.`, exposure: 'none',
          q: c => saw(c, 0) ? (c.type === 'holds' ? 4 : 1) : 2, s: { reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: when('breaks'), tone: 'mixed', fin: 0, text: `The peg breaks on Saturday. Theo doesn't say how much he made. He doesn't have to.` },
            { p: when('holds'), tone: 'good', fin: 0, text: `The Bloc steps in and the crown squeezes higher. You weren't in it.` }
          ],
          later: c => saw(c, 0) && c.type === 'holds' ? `You read the swap line and stepped aside. Knowing when a capped bet has lost its edge is part of the edge.` : `Passing is always allowed. On a capped downside with a 12% upside, it's usually the expensive choice.`,
          verdict: { who: 'theo', line: `Sat out the cleanest asymmetric trade of the year. Sometimes that's right. I'd want to know why.` }
        }
      ],
      analysis: {
        game: `A game against a central bank's promise. Valdor has committed to defend its peg; the market is deciding whether to believe it. Your loss if wrong is fixed by your stop; your gain if right is set by how far the promise has been holding the price up.`,
        incentives: `Valdor wants you to believe the peg is permanent. The Bloc wants stability without paying for it. The trade rewards whoever reads the reserves, not the speeches.`,
        leverage: `Liquidity, and a stop 1% away. In a market that trades $40 billion a day, you can always get out at your line.`,
        missing: `How much Valdor had left to defend with, and whether anyone would lend it more. The reserve report answered both.`,
        assumptions: `That a big position is a big risk. That a central bank's promise is a fact. That passing costs nothing.`,
        controlled: `Your size, your stop, and whether you looked at the reserves.`,
        couldnt: `What Valdor and the Bloc decided over the weekend.`,
        concept: { thinker: 'schelling', term: `Credible commitment`, name: `A promise is only as strong as the cost of keeping it`, body: `Schelling showed that a commitment works only while keeping it is cheaper than breaking it. Every rate hike raised Valdor's cost of keeping the peg, so every hike made the promise weaker, even as it looked stronger.` },
        second: { thinker: 'seykota', term: `Risk is the exit`, name: `What you can lose is set by where you get out, not by the size`, body: `A $200,000 position with a stop 1% away risks $2,000. A $25,000 stock with no stop can risk all of it. Size the loss, then let the position be as large as that loss allows.` },
        better: `B if your rule allows 2.5% of the account; A if your rule is 1%. C if you saw what was priced into Valdor Rail. If the reserve report showed the Bloc's swap line, F: the edge was gone.`,
        lesson: `Risk is what you lose at your exit, not how big the position looks. When the downside is capped and the upside isn't, timidity is the error.`
      },
      life: { title: `The raise`, text: `Your review is next week. Asking for a real raise costs, at worst, a few awkward seconds and a "not this year." Not asking costs a little every year for the rest of your career, because every future raise is a percentage of this number. The downside is capped. The upside compounds.` }
    },

    // ───────────────────────────────────────── 3. Five ideas, or one bet?
    {
      id: 'the-book',
      opponent: `your sense of being diversified`,
      tests: `Can you tell five bets from one?`,
      level: `Correlation`,
      title: `The Book`,
      lens: ['aumann', 'duke'],
      setting: `The desk · June · $60,000 to put to work`,
      cycle: { t: 5, read: `Hot. Futures price three rate cuts this year, homebuilders are at all-time highs, and the chat says rates only go one way from here. Theo: "When everyone's bet is the same bet, I count it once."` },
      types: [
        { id: 'melt', p: 0.6, who: `the summer`, label: `The rally kept going`, tell: `Rates drifted lower all summer, and everything that loves cheap money rose together. Your book's real test was still coming.` },
        { id: 'wobble', p: 0.4, who: `the summer`, label: `The rally wobbled`, tell: `A hot inflation print in August took one rate cut away. Everything that loves cheap money fell together, for a week.` }
      ],
      facts: [
        `You have <strong>$60,000</strong> of the account to put to work for the summer. Nadia wants your book by Friday.`,
        `Your five strongest ideas: <strong>Brightwell Homes</strong> (homebuilder), <strong>Calder Regional Bank</strong>, <strong>Pinemoor REIT</strong> (apartments), <strong>Ostrander Auto Credit</strong> and <strong>Quillfeather Software</strong>. Five sectors. Five good stories.`,
        `Two weaker ideas that move on their own news: <strong>Tallis Gold Royalty</strong> and <strong>Ashcombe Pharma</strong>, waiting on a trial readout.`,
        `You can also hold a rate hedge: a position that gains when interest rates rise.`,
        `Your account: <strong>{account}</strong>. Your rule: {rule} of the account at risk on any one idea.`
      ],
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Measures risk in what moves together, not in how many names you own.` },
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `Has watched a lot of "diversified" books fall on the same day.` }
      ],
      known: [`Five strong ideas in five sectors.`, `Two weaker ideas with their own drivers.`, `A rate hedge is available.`],
      unknown: [`Whether your five ideas are five bets or one.`, `What rates do next.`],
      clues: [
        { label: `Your spring trades`, text: `Five of your seven winners this spring came in a market that rose almost every day. The two that didn't depend on that made the smallest gains.` },
        { label: `Nadia's correlation sheet`, text: `Over 90 days, your five strong names move together: average correlation 0.78. All five fell on the same day in each of the last three rate scares. Tallis: −0.2. Ashcombe: +0.1. The rate hedge: −0.9.` },
        { label: `Run a stress test: rates up 0.75 points`, text: `Five strong names at $12,000 each: −$14,800. Add the rate hedge: −$6,000. Balance it by risk, with Tallis, Ashcombe and the hedge carrying a share: −$2,400.` },
        { label: `What's priced in?`, text: `Futures price three rate cuts this year, and homebuilders trade at all-time highs. One hot inflation print could take two of those cuts away. Your five ideas all need the cuts.` }
      ],
      edgeNote: {
        research: `You know these five companies cold. That's why it's hard to see that the market only sees one thing about them: what they'll be worth if rates fall.`,
        speed: `All five are in strong uptrends, which is exactly why they look like five signals. One trend, five tickers.`,
        patience: `Patience means waiting for the setup, and then sizing it. It doesn't mean putting all your summer into the same setup five times.`
      },
      question: `Five strong ideas. How many bets is that?`,
      options: [
        {
          key: 'A', text: `Your five best ideas, $12,000 each. Five sectors: you're diversified.`, did: `Built five positions on one bet.`, exposure: 'large', flags: { book: 'oneBet' }, defies: ['together'],
          q: c => saw(c, 1) || saw(c, 2) ? 0 : 1, s: { jdg: -1, inf: -1 }, cap: { psy: 1 },
          outcomes: [
            { p: when('melt'), tone: 'good', fin: 4.2, text: `Rates drift lower all summer and all five rise together. Up $4,200. It feels like five good decisions.` },
            { p: when('wobble'), tone: 'bad', fin: -2, text: `A hot inflation print in August. All five fall the same week. −$2,000, and you notice for the first time that they move as one.` }
          ],
          later: `Five sectors, one driver. Counting names isn't diversifying. You'll find out how much it's one bet when rates really move.`,
          verdict: { who: 'nadia', line: `Five names, one risk. I count it once, and so will the market.` }
        },
        {
          key: 'B', text: `The same five, plus a $10,000 rate hedge.`, did: `Built the five, with a rate hedge.`, exposure: 'normal', flags: { book: 'hedged' },
          q: 3, s: { jdg: 1, inf: 1, lng: 1 }, cap: { str: 1 },
          outcomes: [
            { p: when('melt'), tone: 'good', fin: 2.6, text: `Rates drift lower. The five rise and the hedge loses a little. Up $2,600.` },
            { p: when('wobble'), tone: 'mixed', fin: -0.6, text: `The August scare hits all five, and the hedge covers most of it. −$600.` }
          ],
          later: `You saw the shared risk and paid to cover half of it. The book is still mostly one bet, just a smaller one.`,
          verdict: { who: 'nadia', line: `Hedged the one thing all five had in common. Halfway there.` }
        },
        {
          key: 'C', text: `Balance by risk: $8,000 each in Brightwell, Calder and Quillfeather, $10,000 each in Tallis and Ashcombe, and a hedge sized so each group carries about the same risk.`, did: `Balanced the book by risk, not by count.`, exposure: 'normal', flags: { book: 'balanced' },
          q: c => saw(c, 1) || saw(c, 2) ? 4 : 3, s: { jdg: 2, inf: 2, lng: 2, inc: 1 }, cap: { str: 2, psy: 1 },
          outcomes: [
            { p: when('melt'), tone: 'mixed', fin: 2, text: `Rates drift lower. Your rate names rise, Tallis drifts, the hedge costs a little. Up $2,000: less than the room, and you'll hear about it.` },
            { p: when('wobble'), tone: 'good', fin: 0.2, text: `The August scare. Your rate names fall, Tallis and the hedge rise. Up $200 in the week everyone else lost money.` }
          ],
          later: `Several bets that each have a reason and don't move together. In the good summer it looks timid. Its job is the bad winter.`,
          verdict: { who: 'nadia', line: `Built a book I could explain on the worst day of the year. That's the whole job.` }
        },
        {
          key: 'D', text: `Put $40,000 into Quillfeather, your single best idea.`, did: `Concentrated the summer in one name.`, exposure: 'all', flags: { book: 'concentrated' }, defies: ['size'],
          q: 1, s: { jdg: -1, bnd: -1, reg: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: when('melt'), tone: 'good', fin: 5.5, text: `Quillfeather rises 14% with the market. Up $5,500, the best summer on the desk.` },
            { p: when('wobble'), tone: 'bad', fin: -4, text: `The August scare takes Quillfeather down 10% in a week. −$4,000.` }
          ],
          later: `At least it's honest: one bet, sized like one. It's also most of the summer on a single name that moves with rates.`,
          verdict: { who: 'theo', line: `Put the summer in one name. Brave. Ask me again in January.` }
        },
        {
          key: 'E', text: `Stay in cash until the summer settles.`, did: `Stayed in cash for the summer.`, exposure: 'none', flags: { book: 'cash' },
          q: 2, s: { reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: when('melt'), tone: 'mixed', fin: 0, text: `Everything rises all summer without you.` },
            { p: when('wobble'), tone: 'good', fin: 0, text: `The August scare comes and goes. You watched it.` }
          ],
          later: `Cash is a position too: it's the bet that nothing is worth owning. Sometimes right. Rarely all summer.`,
          verdict: { who: 'theo', line: `Sat out the summer. Safe. Not the same as having a plan.` }
        }
      ],
      analysis: {
        game: `A portfolio that looks diversified and isn't. Five names in five sectors can still be one bet if they all depend on the same thing, here falling interest rates.`,
        incentives: `Five good stories feel like five good reasons. The streak makes every story feel more certain.`,
        leverage: `Nadia's correlation sheet and a stress test. Both cost nothing and both told you the answer.`,
        missing: `How your positions behave on the same bad day. That's the only diversification that counts.`,
        assumptions: `That different sectors are different bets. That more names means less risk.`,
        controlled: `What you owned, how much of each, and whether anything in the book moved the other way.`,
        couldnt: `Rates, and when they'd move.`,
        concept: { thinker: 'aumann', term: `Correlated bets`, name: `Count your bets by what moves them, not by their names`, body: `Fifteen bets that don't move together cut your risk by about three quarters. Five that move together cut it by almost nothing. Ray Dalio calls the first the holy grail of investing. The second is one bet in five coats.` },
        second: { thinker: 'duke', term: `Stress testing`, name: `Decide on the bad day before it comes`, body: `Duke's pre-mortem: imagine it's January and the book lost money. Why? If one answer explains every position, you own one position.` },
        better: `C. Several bets that each have a reason and don't move together, sized so each carries a similar share of the risk. B if you want the five: hedge what they share.`,
        lesson: `Diversification is measured by what moves together on a bad day, not by how many names you own.`
      },
      life: { title: `The household`, text: `Two salaries from the same company, a house in the same town, savings in that company's stock. It looks like a household with several sources of security. It's one bet on one employer, and you'll find out on the day it has a bad year.` }
    },

    // ───────────────────────────────────────── 4. The shock lands on the book you built
    {
      id: 'the-turn',
      opponent: `your assumptions`,
      tests: `Can you tell a turn from a dip, with your own book on the line?`,
      level: `Regime change`,
      title: `The Turn`,
      lens: ['nash', 'duke'],
      setting: `The desk · January · The morning the cycle turned`,
      cycle: { t: 1, read: `Cold. Margin debt is falling 4% a month, futures took two rate cuts out of the year in an hour, and nobody picks up the phone. Theo: "When the borrowed money leaves, it leaves together."` },
      types: [
        { id: 'wobble', p: 0.45, who: `the market`, label: `It was a sharp dip`, tell: `The inflation print was one bad month. Within three weeks the dip-buyers were back and rate-sensitive stocks recovered most of the drop.` },
        { id: 'deleveraging', p: 0.55, who: `the market`, label: `The cycle had turned`, tell: `Rates had stopped falling for good. The dip-buyers had been buying with borrowed money, and as it was called in they sold together. Dips that used to recover in four days took weeks, or didn't.` }
      ],
      facts: [
        `Your book from June is still on: <strong>{book}</strong>.`,
        `This morning's inflation print came in hot. Futures took two rate cuts out of the year in an hour.`,
        `Rate-sensitive stocks are down hard before the open. Homebuilders −6%, regional banks −5%.`,
        `Your account: <strong>{account}</strong>. Nadia's limits step down as the account falls.`,
        `The market opens at 9:30.`
      ],
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Has your book on her screen before you do.` },
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `In since 5 am. Reading, not trading.` }
      ],
      known: [`A hot inflation print.`, `Two rate cuts gone from the year.`, `Rate-sensitive stocks down hard.`],
      unknown: [`Whether this is a sharp dip or a turn in the cycle.`, `How your book will behave if it's a turn.`],
      clues: [
        { label: `Check how fast dips are recovering`, text: c => c.type === 'deleveraging' ? `Dips used to recover in about four days. Since October, the last six took 19, 4, 22, 15, 6 and 21. Mostly much slower. Not every one.` : `Dips used to recover in about four days. Since October, the last six took 6, 11, 4, 9, 5 and 7. Slower, and noisier, but still recovering.` },
        { label: `Nadia's risk report on your book`, text: c => bookRisk[bookOf(c)] },
        { label: `Theo's desk`, text: `Theo has been in since 5 am. He hasn't placed a trade. He's reading the margin-debt numbers line by line.` },
        { label: `What's priced in?`, text: `Margin debt is falling 4% a month: the dip-buyers were borrowing to buy. Futures now price one rate cut, not three. Rate-sensitive stocks still price most of the cuts that just disappeared.` }
      ],
      edgeNote: {
        research: `You know these companies. The market isn't trading them this morning; it's trading rates. Your research is right and, today, beside the point.`,
        speed: `Reading price is the edge most exposed to a turn. The patterns you trusted were partly made by cheap money. Test them again, small.`,
        patience: `A patient trader's edge is waiting, and this is when it pays. The rare, obvious setups usually come after the forced selling, not during it.`
      },
      question: `The cycle may have turned, with your book in it. What do you do?`,
      options: [
        {
          key: 'A', text: c => bookOf(c) === 'cash' ? `Buy the dip: put $10,000 into the rate names that fell hardest.` : `Buy the dip: add $10,000 to the names that fell hardest.`, did: `Bought the dip.`, exposure: 'normal', defies: ['smaller'],
          q: c => know(c) ? (delev(c) ? 0 : (['balanced', 'cash'].includes(bookOf(c)) ? 4 : 3)) : 1, s: { reg: -1, jdg: -1 }, cap: {},
          outcomes: [
            { p: when('deleveraging'), tone: 'bad', fin: c => r1(L(c) - 3), text: c => `The borrowed money keeps leaving. Your book loses ${k$(-L(c))}, and the dip you bought loses $3,000 more.` },
            { p: when('wobble'), tone: 'good', fin: c => r1(0.3 * A(c) + 2), text: c => `The dip-buyers are back within three weeks. ${bookOf(c) === 'cash' ? '' : `Your book recovers ${k$(0.3 * A(c))}, and `}the dip you bought makes $2,000.` }
          ],
          later: c => delev(c) ? `Buying the dip is a bet that nothing has changed. Here something had.` : `Buying a sharp dip in a market that hadn't changed was the right read, and you had the evidence for it.`,
          verdict: { who: 'theo', line: `Bought the dip on the morning the borrowed money left. Or the morning it didn't. The recovery data would have told you which.` }
        },
        {
          key: 'B', text: `Halve everything.`, did: `Halved the whole book.`, exposure: 'small', when: c => bookOf(c) !== 'cash',
          q: c => bookOf(c) === 'balanced' ? 2 : know(c) && !delev(c) ? 2 : 3, s: { jdg: 1, reg: 1 }, cap: { psy: 1 },
          outcomes: [
            { p: when('deleveraging'), tone: 'mixed', fin: c => r1(L(c) / 2), text: c => `The selling goes on for weeks. Halving cut the damage to ${k$(-L(c) / 2)}.` },
            { p: when('wobble'), tone: 'mixed', fin: c => r1(0.15 * A(c)), text: c => `The dip recovers within three weeks, on half your size: ${k$(0.15 * A(c))}.` }
          ],
          later: `Halving everything is a sound reflex when you can't tell what's wrong. It cuts the good with the bad.`,
          verdict: { who: 'nadia', line: `Cut everything by half. Blunt, and better than nothing.` }
        },
        {
          key: 'C', text: c => bookOf(c) === 'concentrated' ? `Cut Quillfeather to $10,000. It's one name moving with rates.` : bookOf(c) === 'balanced' ? `Sell the three rate names. Keep Tallis, Ashcombe and the hedge.` : `Cut what moves together: sell the rate-sensitive names and keep what moves on its own.`, did: `Cut the positions that moved together.`, exposure: 'small', when: c => bookOf(c) !== 'cash',
          q: c => bookOf(c) === 'balanced' ? 2 : know(c) && !delev(c) ? 2 : saw(c, 1) || (know(c) && delev(c)) ? 4 : 3, s: { jdg: 2, inf: 2, lng: 1 }, cap: { str: 2 },
          outcomes: [
            { p: when('deleveraging'), tone: 'good', fin: c => r1(L(c) * 0.25), text: c => `You cut the cluster before the second leg down. The book loses ${k$(-L(c) * 0.25)} instead of ${k$(-L(c))}.` },
            { p: when('wobble'), tone: 'mixed', fin: c => r1(0.05 * A(c)), text: `The dip recovers within three weeks, mostly without the names you sold.` }
          ],
          later: `You cut the one risk your book really had, and kept the parts that didn't depend on it.`,
          verdict: { who: 'nadia', line: `Cut exactly what was moving together. That's reading the book, not the headlines.` }
        },
        {
          key: 'D', text: c => bookOf(c) === 'cash' ? `Borrow to buy big: $40,000 of the rate names, at 2×.` : `Lever up: borrow to buy more of everything, at 2×.`, did: `Levered up into the drop.`, exposure: 'all', defies: ['leverage', 'smaller'],
          q: 0, s: { reg: -3, jdg: -3, bnd: -2 }, cap: { psy: -2, soc: -1 },
          outcomes: [
            { p: when('deleveraging'), tone: 'bad', fin: c => r1(bookOf(c) === 'cash' ? -9 : 2 * L(c) - 3), text: `You borrowed into a market that was being forced to stop borrowing. The selling feeds on itself, and your leverage feeds it too.` },
            { p: when('wobble'), tone: 'good', fin: c => r1(bookOf(c) === 'cash' ? 6 : 0.6 * A(c) + 2), text: `The dip recovers. With leverage, it recovers twice as fast for you. It worked, which makes the next time more dangerous.` }
          ],
          later: `Borrowing more on the morning the cycle may have turned is the bet that ends careers when it's wrong.`,
          verdict: { who: 'nadia', line: `Borrowed into the selling. I stop watching the numbers and start watching the person.` }
        },
        {
          key: 'E', text: `Sell everything and wait.`, did: `Sold everything and waited.`, exposure: 'none', when: c => bookOf(c) !== 'cash',
          q: c => know(c) ? (delev(c) ? 3 : 1) : 2, s: { reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: when('deleveraging'), tone: 'good', fin: c => r1(L(c) * 0.15), text: c => `You sell at the open for ${k$(-L(c) * 0.15)}, and miss the weeks of selling that follow.` },
            { p: when('wobble'), tone: 'bad', fin: c => r1(-0.1 * A(c)), text: c => `You sell near the low. Three weeks later it has recovered without you: ${k$(-0.1 * A(c))}.` }
          ],
          later: `Selling everything protects you from the turn and from the recovery equally. It's a decision not to decide.`,
          verdict: { who: 'theo', line: `Sold the lot at the open. Sometimes that's wisdom. Sometimes it's fear with good timing.` }
        },
        {
          key: 'F', text: c => bookOf(c) === 'cash' ? `Flip: short a basket of rate-sensitive stocks at normal size, stop at today's high.` : `Sell the rate names and flip: short a basket of them at normal size, stop at today's high.`, did: `Flipped short when the evidence turned.`, exposure: 'normal',
          q: c => know(c) ? (delev(c) ? 4 : 0) : 1, s: { jdg: 2, reg: 1, inf: 1 }, cap: { str: 2 },
          outcomes: [
            { p: when('deleveraging'), tone: 'good', fin: c => r1((bookOf(c) === 'cash' ? 0 : L(c) * 0.15) + 6), text: `The forced selling runs for weeks. Your short makes $6,000, with a stop you never needed.` },
            { p: when('wobble'), tone: 'bad', fin: c => r1((bookOf(c) === 'cash' ? 0 : -0.1 * A(c)) - 2.5), text: `The dip recovers, and your short hits its stop: −$2,500. You turned around one bad print too early.` }
          ],
          later: c => delev(c) ? `You changed your mind as fast as the evidence did, and bet on the new market with a stop. That's what having no attachment looks like.` : `Flipping is right only if the market changed. The recovery data said whether it had.`,
          verdict: { who: 'theo', line: `Turned around in one morning. With the right evidence that's the best trade of the year. Without it, it's a guess.` }
        },
        {
          key: 'G', text: c => bookOf(c) === 'cash' ? `Stay in cash and watch.` : `Hold. The book was built to take a morning like this.`, did: c => bookOf(c) === 'cash' ? `Stayed in cash.` : `Held the book through it.`, defies: c => bookOf(c) === 'oneBet' ? ['together'] : [],
          exposure: c => ({ oneBet: 'large', concentrated: 'all', hedged: 'normal', balanced: 'normal', cash: 'none' })[bookOf(c)],
          q: c => ({
            balanced: 4,
            hedged: know(c) && delev(c) ? 2 : 3,
            oneBet: know(c) ? (delev(c) ? 0 : 3) : 1,
            concentrated: know(c) ? (delev(c) ? 0 : 3) : 1,
            cash: know(c) ? (delev(c) ? 4 : 2) : 3
          })[bookOf(c)], s: { reg: 1 }, cap: {},
          outcomes: [
            { p: when('deleveraging'), tone: c => L(c) <= -6 ? 'bad' : 'mixed', fin: c => r1(L(c)), text: c => bookOf(c) === 'cash' ? `The selling runs for weeks. You own nothing, and it costs you nothing.` : bookOf(c) === 'balanced' ? `The selling runs for weeks. Your rate names fall; Tallis and the hedge rise. The book loses ${k$(-L(c))} in the worst month of the year.` : `The selling runs for weeks and your book falls with it: ${k$(-L(c))}. ${bookOf(c) === 'oneBet' ? 'Five names, one bet, all at once.' : ''}` },
            { p: when('wobble'), tone: 'good', fin: c => r1(0.3 * A(c)), text: c => bookOf(c) === 'cash' ? `The dip recovers within three weeks. You watched.` : `The dip recovers within three weeks, and so does your book: ${k$(0.3 * A(c))}.` }
          ],
          later: c => bookOf(c) === 'balanced' ? `This is the morning June's book was built for. Holding wasn't hope; the book was designed for it.` : bookOf(c) === 'cash' ? `Cash made the morning easy. It also meant you had nothing to decide.` : `Holding a book that is one bet, on the morning that bet may have turned, is hope, not a plan.`,
          verdict: { who: 'nadia', line: `Held what they built in June. Whether that was a plan depends entirely on what they built.` }
        }
      ],
      analysis: {
        game: `A turn in the debt cycle, landing on a book you built in a different market. The question isn't whether to predict the turn. It's whether you can recognize one, and whether your book was ever as diversified as it looked.`,
        incentives: `You want June's book to have been right. The market only cares what it's worth this morning.`,
        leverage: `Two numbers: how fast dips are recovering, and how your positions move together on a bad day. Both were on your desk.`,
        missing: `Whether the borrowed money was leaving for good. The recovery data and the margin-debt numbers were the best evidence.`,
        assumptions: `That a dip is always a dip because it was for two years. That five names are five bets.`,
        controlled: `What you built in June, and what you cut this morning.`,
        couldnt: `Inflation, rates, and when other people's borrowing would be called in.`,
        concept: { thinker: 'nash', term: `Regime change`, name: `A best response to a game that changed`, body: `A strategy is a best response to the other players. When cheap money stops and borrowed money is called in, the other players change, and dip-buying stops being the best response. Ray Dalio describes this as the turn of the debt cycle: what worked on the way up works against you on the way down.` },
        second: { thinker: 'duke', term: `Bayesian updating`, name: `Move your confidence when the evidence moves`, body: `"Dips always come back" was a 90% belief for two years. The recovery data should move that number, up or down, and your size with it.` },
        better: `Check the recoveries. If they've broken, cut what moves together (C) or flip with a stop (F); with a balanced book, holding is fine. If they're only slow, buying the dip or holding is discipline, not denial.`,
        lesson: `You don't have to predict the turn. You have to know your book well enough to recognize one, and build it in June for a morning like this.`
      },
      life: { title: `The job market`, text: `For years, switching jobs every eighteen months got you a raise each time. This year the calls stopped. Is it a slow quarter or a changed market? The answer decides whether to wait for the next offer or learn the skill the new market is paying for.` }
    },

    // ───────────────────────────────────────── 5. Too timid, sized right, or too big
    {
      id: 'final-bet',
      opponent: `your desire for more`,
      tests: `Can you protect your ability to play again?`,
      level: `Survival`,
      title: `The Last Player Standing`,
      lens: ['aumann', 'seykota'],
      setting: `The desk · December · The last trade of the year`,
      cycle: { t: 4, read: `Warm. Year-end chase: funds behind their benchmark are buying anything that moves.` },
      types: [
        { id: 'works', p: 0.25, who: `the trade`, label: `The setup worked before earnings`, tell: `Saros ran to its $104 target before earnings. Your best setups work about four times in ten. That's what a real edge looks like: wrong more often than right, and paid for it.` },
        { id: 'stopped', p: 0.45, who: `the trade`, label: `The setup failed, gently`, tell: `Saros drifted down to your $72 exit and you were out. A normal loss on a good setup.` },
        { id: 'gapped', p: 0.15, who: `the trade`, label: `The setup failed at earnings`, tell: `Saros held until earnings, then opened 25% lower, straight through your exit. Lines don't stop gaps.` },
        { id: 'late', p: 0.15, who: `the trade`, label: `The setup worked at earnings`, tell: `Saros sat near $84 for three weeks, then gapped to $104 on earnings. The same gap that can hurt you can pay you, if you're still holding.` }
      ],
      facts: [
        `Saros Robotics, which builds warehouse robots, is breaking out at <strong>$80</strong> after a year going sideways. It fits your edge, <strong>{edge}</strong>.`,
        `You'd be <strong>buying</strong>. Target: $104 (+30%). Exit if wrong: $72 (−10%). Earnings are in three weeks.`,
        `Your account: <strong>{account}</strong>. Your rule: {rule} of the account at risk on any one idea.`,
        `Nadia approves up to 2× leverage, with at most 25% of the account in one stock. Anything more is an exception.`,
        `At 4× leverage, a 25% fall wipes out the whole account. The options market prices a 14% earnings move; your exit is 10% away.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Memory`, note: `Keeps a list of brilliant traders who aren't here anymore.` },
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Approves leverage by exception only.` }
      ],
      known: [`Target $104, exit $72.`, `Earnings in three weeks.`, `2× leverage approved; 4× needs an exception.`],
      unknown: [`Whether it works. Even a real edge loses often.`, `What earnings will do.`],
      clues: [
        { label: `Your trade log`, text: `Your best setups have worked about 40% of the time. Winners averaged +30%. Losers averaged −10%, except when earnings gapped them. Forty-one trades: a real edge, and a small sample.` },
        { label: `The earnings calendar`, text: `Saros reports in three weeks. Its last two reports moved the stock 18% and 24%. An exit line won't help if it opens below it.` },
        { label: `Theo's desk drawer`, text: `Theo keeps a list of traders he knew who were brilliant, until one trade. It's longer than you'd think.` },
        { label: `What's priced in?`, text: `Options price a 14% move on earnings. Your exit is 10% away. The gap is in the price; it isn't in your plan.` }
      ],
      edgeNote: {
        research: `It's your kind of trade: a company you know cold. That's exactly when overconfidence is most persuasive, and when sizing up is most justified. Both are true.`,
        speed: `It's your kind of trade: the cleanest breakout you've seen in two years. Clean breakouts still fail six times in ten. The winners pay for them.`,
        patience: `This is the rare, obvious setup you wait all year for. Waiting earned you the right to size up, not the right to bet everything.`
      },
      question: `How much are you willing to risk to win?`,
      options: [
        {
          key: 'A', text: `Ask Nadia for an exception: 4× leverage, the whole account. This is the one.`, did: `Asked for 4× on the whole account.`, exposure: 'all', asks: true, defies: ['leverage', 'size'],
          q: 0, s: { reg: -3, jdg: -3, lng: -3, bnd: -2 }, cap: { psy: -2, soc: -2 },
          outcomes: [
            { p: c => refuses(c) ? 0 : when('works')(c), tone: 'good', fin: 120, text: `It works. With 4× leverage, a 30% move more than doubles your account. You're the best performer on the floor, and you'll spend years trying to feel this again.` },
            { p: c => refuses(c) ? 0 : when('stopped')(c), tone: 'bad', fin: -44, text: `Saros slides to your $72 exit and the stop fills at $71.20. At 4×, an 11% drop is 44% of your account.` },
            { p: c => refuses(c) ? 0 : when('gapped')(c), tone: 'bad', ruin: true, fin: -999, text: `Saros opens 25% lower after earnings. At 4×, a 25% gap is the whole account. It's gone at the open, before your exit can do anything.` },
            { p: c => refuses(c) ? 1 : 0, tone: 'mixed', fin: 0, text: `Nadia reads the request and slides it back. "Not with this year's record. Two times, a quarter of the account, or nothing." You end the year without Saros, and without the exception.` },
            { p: c => refuses(c) ? 0 : when('late')(c), tone: 'good', fin: 120, text: `Saros sits near $84 for three weeks, then gaps to $104 on earnings. At 4×, the gap more than doubles your account. The same gap the other way would have ended it.` }
          ],
          later: `A real edge here loses six times in ten. Betting everything on one throw turned a good edge into a coin flip for your career.`,
          verdict: { who: 'nadia', line: `Asked me for an exception to bet the whole account. That's how good traders leave.` }
        },
        {
          key: 'B', text: `Buy $25,000 with no exit planned. You're sure about this one.`, did: `Bet big with no exit.`, exposure: 'large', defies: ['stops'],
          q: 1, s: { jdg: -1, reg: -1, bnd: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 7.5, text: `It works. A $7,500 gain to close the year.` },
            { p: when('stopped'), tone: 'bad', fin: -6.3, text: `It drifts down, and with no exit you ride it to −25% before you can't stand it anymore. A $6,300 loss.` },
            { p: when('gapped'), tone: 'bad', fin: -6.3, text: `It gaps down 25% on earnings. With no plan, you sell in a panic. A $6,300 loss.` },
            { p: when('late'), tone: 'good', fin: 7.5, text: `It sits near $84 until earnings, then gaps to $104. A $7,500 gain, with no plan for the version where it gapped the other way.` }
          ],
          later: `The right size with no exit is still a bet on hope. The size was fine. The missing plan wasn't.`,
          verdict: { who: 'theo', line: `Sized it like they meant it, then forgot to decide where they'd be wrong.` }
        },
        {
          key: 'C', text: `Your normal size, $10,000, out at $72. That risks $1,000, or $2,500 if earnings gap it.`, did: `Normal size, with an exit.`, exposure: 'normal',
          q: c => c.rules && c.rules.risk === 'tight' ? 4 : 3, s: { jdg: 2, reg: 2, lng: 2, bnd: 1 }, cap: { psy: 1, soc: 1 },
          outcomes: [
            { p: when('works'), tone: 'mixed', fin: 3, text: `It works. You make $3,000 on the best setup in two years. Safe, and you'll wonder what right-sized would have made.` },
            { p: when('stopped'), tone: 'mixed', fin: -1, text: `It drifts to $72 and your exit takes you out. A $1,000 loss. You'll be here in January.` },
            { p: when('gapped'), tone: 'mixed', fin: -2.5, text: `It gaps 25% lower on earnings, straight through your exit. A $2,500 loss: more than you planned, still survivable.` },
            { p: when('late'), tone: 'mixed', fin: 3, text: `It sits near $84 until earnings, then gaps to $104. You make $3,000 on the best setup in two years.` }
          ],
          later: `Survivable in every world. But on the best setup in two years, normal size left most of the edge on the table.`,
          verdict: { who: 'theo', line: `Normal size on the setup of the year. Safe. I'd have liked to see a little more conviction.` }
        },
        {
          key: 'D', text: `Start with $5,000. Add $5,000 at +8% and again at +16%, and raise your exit to break-even.`, did: `Started small, and added only as it worked.`, exposure: 'small',
          q: 4, s: { jdg: 2, reg: 1, lng: 2, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 3.1, text: `It works, and you add twice as it proves you right. Up $3,100, most of it on money the trade earned for you.` },
            { p: when('stopped'), tone: 'mixed', fin: -0.5, text: `It fails before your first add. You lose $500.` },
            { p: when('gapped'), tone: 'mixed', fin: -1.3, text: `It gaps down on earnings while you're still small. A $1,300 loss.` },
            { p: when('late'), tone: 'mixed', fin: 1.5, text: `It never reaches your first add before earnings, then gaps to $104. Your $5,000 starter makes $1,500. Waiting for confirmation cost you most of the move.` }
          ],
          later: `Adding only as the market confirms you is how winners run and losers stay small.`,
          verdict: { who: 'nadia', line: `Built the position as it proved itself. I barely had to look at that account.` }
        },
        {
          key: 'E', text: `Nothing. Protect what you have. The year is done.`, did: `Protected the year and stayed out.`, exposure: 'none',
          q: 2, s: { reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: when('works'), tone: 'mixed', fin: 0, text: `Saros runs to $104 without you. Safe, and smaller than you could have been.` },
            { p: when('stopped'), tone: 'good', fin: 0, text: `Saros fails. You feel clever, briefly. But it was a real edge, and refusing every risk is its own slow way of losing.` },
            { p: when('gapped'), tone: 'good', fin: 0, text: `Saros gaps down on earnings. You weren't in it. That was luck, not the plan.` },
            { p: when('late'), tone: 'mixed', fin: 0, text: `Saros gaps to $104 on earnings without you.` }
          ],
          later: `Preservation matters. So does using your edge when it's real. Never playing isn't surviving. It's leaving slowly.`,
          verdict: { who: 'theo', line: `Sat out the best setup of the year. Safe. Not quite the point.` }
        },
        {
          key: 'F', text: `Size up: $25,000, out at $72, and hold it through earnings. That risks $2,500, or $6,300 on a gap.`, did: `Sized up and held through earnings.`, exposure: 'large',
          q: c => !c.rules || c.rules.risk === 'open' ? 4 : c.rules.risk === 'tight' ? 2 : 3, s: { jdg: 2, reg: 1, lng: 2, str: 1 }, cap: { psy: 1, str: 2 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 7.5, text: `It works. $7,500 on the best setup in two years, with a planned loss you could always afford.` },
            { p: when('stopped'), tone: 'mixed', fin: -2.5, text: `It drifts to $72 and your exit takes you out. A $2,500 loss, exactly what you planned.` },
            { p: when('gapped'), tone: 'bad', fin: -6.3, text: `It gaps 25% lower on earnings, through your exit. A $6,300 loss: earnings risk you knew about and sized for only partly.` },
            { p: when('late'), tone: 'good', fin: 7.5, text: `It sits near $84 for three weeks, then gaps to $104 on earnings. You held the risk you'd sized for, and it paid: $7,500.` }
          ],
          later: `Druckenmiller's lesson: it isn't how often you're right, it's how much you make when you are. You sized up and knew where you'd be wrong, except at earnings, which you knew about too.`,
          verdict: { who: 'nadia', line: `Sized up on the best setup of the year with a hard exit. Then held full size into earnings. I'd have asked about that.` }
        },
        {
          key: 'G', text: `Size up: $25,000, out at $72, and cut to $10,000 the day before earnings.`, did: `Sized up, and cut size before earnings.`, exposure: 'normal',
          q: c => c.rules && c.rules.risk === 'tight' ? 3 : 4, s: { jdg: 2, reg: 2, lng: 2, str: 1 }, cap: { psy: 1, str: 2 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 7.5, text: `It runs to $104 before earnings. $7,500 on the best setup in two years, with a planned loss you could always afford.` },
            { p: when('stopped'), tone: 'mixed', fin: -2.5, text: `It drifts to $72 and your exit takes you out. A $2,500 loss, exactly what you planned.` },
            { p: when('gapped'), tone: 'mixed', fin: -2.5, text: `You cut to $10,000 the day before. It gaps 25% lower on earnings: a $2,500 loss instead of $6,300.` },
            { p: when('late'), tone: 'mixed', fin: 3.8, text: `You cut to $10,000 the day before. It gaps to $104 on earnings: $3,750 instead of $7,500. Cutting was the right call on what you knew, and here it cost you.` }
          ],
          later: `Big when the edge was working, small when the one risk your exit couldn't handle arrived. That's sizing to the bad case you could see.`,
          verdict: { who: 'nadia', line: `Sized up, then cut before the event the exit couldn't cover. That's the account I'd give more room.` }
        }
      ],
      analysis: {
        game: `The last round of a game that never really ends. A single bet can't be repeated, but a career is nothing but repetition.`,
        incentives: `The leaderboard rewards whoever finishes highest this year. Your life rewards whoever is still playing in ten.`,
        leverage: `Time, and knowing your edge's shape: right four times in ten, +30% when right, −10% when wrong, and worse at earnings.`,
        missing: `The outcome. It always is. That's why size, not certainty, decides your fate.`,
        assumptions: `That a real edge means a sure thing. That the safest size is always the best one.`,
        controlled: `How much of yourself to put on the table, and where you'd get out.`,
        couldnt: `The breakout, the earnings report, the gap.`,
        concept: { thinker: 'aumann', term: `Repeated games`, name: `A career is a repeated game. Don't bet it on one round`, body: `Aumann won a Nobel Prize for showing how behavior changes when a game repeats: a move that's rational once can be foolish when you'll play again and again. The math of ruin, from John Kelly and Ed Thorp, says the same thing in numbers: never bet so much that one round ends the game.` },
        second: { thinker: 'seykota', term: `Kelly-style sizing`, name: `Bet more when you're right, never everything`, body: `Kelly on your log says a big bet: your edge is real. That's exactly when to distrust the log. Forty-one trades is a small sample, and the most overconfident number you own is your own win rate. Pros bet a fraction of Kelly, and never through an event their exit can't handle.` },
        better: `G or F, sized to your rule; D if you'd rather the market confirm you first. Cutting before earnings (G) and holding through them (F) are worth about the same on average: G gives up some of the upside gap to avoid the downside one. What isn't close is A.`,
        lesson: `The objective was never to win every round. It was to become the kind of player who could keep playing, and play big when it counts.`
      },
      life: { title: `The leap`, text: `A once-in-a-decade chance: quit your job and put everything into a business with a real advantage. You can go all in, start it on the side and grow it as it proves itself, or pass. The size of the leap, not the idea, decides whether failure is a setback or the end.` }
    }
  ];

  // ───────────────────────────────────────── Screens
  // Each challenge draws its own center and right monitors, in a 1000 × 562 space.
  // The center screen keeps its top 60 units clear for the notification bar.
  const C = { grid: '#1c282b', ink: '#c4d0cc', dim: '#6e7e7c', teal: '#40b2a6', red: '#d65c4e', amber: '#d6a856', panel: '#111a1c' };
  const SANS = `'Archivo', 'Helvetica Neue', Arial, sans-serif`;
  const T = (x, y, txt, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 20}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'start'}" font-weight="${o.weight || 400}" font-family="${o.sans ? SANS : PP.art.MONO}">${PP.art.esc(txt)}</text>`;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // A price path through the given waypoints [t, value], with seeded noise.
  function path(n, pts, seed, noise = 0.35) {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const k = pts.findIndex(p => p[0] >= t);
      const [t0, v0] = pts[Math.max(0, k - 1)], [t1, v1] = pts[Math.max(0, k)];
      const v = t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
      return i === n - 1 ? pts[pts.length - 1][1] : v + (r() - 0.5) * 2 * noise;
    });
  }
  function frame(b, cols = 6, rows = 4) {
    let g = '';
    for (let i = 0; i <= cols; i++) { const x = b[0] + (b[2] - b[0]) * i / cols; g += `<line x1="${x}" y1="${b[1]}" x2="${x}" y2="${b[3]}" stroke="${C.grid}"/>`; }
    for (let j = 0; j <= rows; j++) { const y = b[1] + (b[3] - b[1]) * j / rows; g += `<line x1="${b[0]}" y1="${y}" x2="${b[2]}" y2="${y}" stroke="${C.grid}"/>`; }
    return g;
  }
  const scaler = (b, lo, hi) => v => b[3] - (v - lo) / (hi - lo) * (b[3] - b[1]);
  function candles(b, closes, Y, seed) {
    const r = rng(seed), w = (b[2] - b[0]) / closes.length;
    let prev = closes[0], g = '';
    closes.forEach((c, i) => {
      const o = prev, hi = Math.max(o, c) + r() * 0.5, lo = Math.min(o, c) - r() * 0.5, x = b[0] + w * (i + 0.5), col = c >= o ? C.teal : C.red;
      g += `<line x1="${x}" y1="${Y(hi)}" x2="${x}" y2="${Y(lo)}" stroke="${col}" stroke-width="1.5"/><rect x="${x - w * 0.32}" y="${Math.min(Y(o), Y(c))}" width="${w * 0.64}" height="${Math.max(1.5, Math.abs(Y(o) - Y(c)))}" fill="${col}"/>`;
      prev = c;
    });
    return g;
  }
  const poly = (b, vals, Y, col, wd = 3) => `<polyline fill="none" stroke="${col}" stroke-width="${wd}" stroke-linejoin="round" points="${vals.map((v, i) => `${(b[0] + (b[2] - b[0]) * i / (vals.length - 1)).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>`;
  const dash = (b, y, col, label, side = 'start') => `<line x1="${b[0]}" y1="${y}" x2="${b[2]}" y2="${y}" stroke="${col}" stroke-width="2" stroke-dasharray="10 8"/>${T(side === 'start' ? b[0] + 8 : b[2] - 8, y - 8, label, { size: 16, fill: col, anchor: side })}`;
  const panel = (x, y, w, h, rows, edge = C.grid) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.panel}" stroke="${edge}" stroke-width="2"/>` +
    rows.map(([t, o], i) => T(x + 20, y + 40 + rows.slice(0, i).reduce((a, r) => a + (r[1] && r[1].gap || 34), 0), t, o || {})).join('');
  const feed = (title, items) => T(36, 52, title, { size: 22, fill: C.dim }) + items.map(([t, h, col], i) =>
    `${T(36, 110 + i * 74, t, { size: 20, fill: C.dim })}${T(130, 110 + i * 74, h, { size: 25, fill: col || C.ink, sans: true })}<line x1="36" y1="${136 + i * 74}" x2="964" y2="${136 + i * 74}" stroke="${C.grid}"/>`).join('');
  const header = (sym, name, price, chg, col) => `${T(36, 112, sym, { size: 44, sans: true, weight: 600 })}${T(36 + sym.length * 30 + 22, 108, name, { size: 24, fill: C.dim, sans: true })}${T(36, 156, price, { size: 32, fill: col, sans: true })}${T(36 + price.length * 20 + 20, 154, chg, { size: 20, fill: col })}`;

  const riskLabel = ctx => ctx.rules ? M.rules.risk.options.find(o => o.v === ctx.rules.risk).label : `2.5%`;
  const tile = (x, y, name, line1, vals, col, winLose, extra = '', note = '') => {
    const b = [x + 16, y + 74, x + 448, y + 182], lo = Math.min(...vals), hi = Math.max(...vals), Y = scaler(b, lo - (hi - lo) * 0.15, hi + (hi - lo) * 0.15);
    return `<rect x="${x}" y="${y}" width="464" height="232" rx="10" fill="${C.panel}" stroke="${C.grid}" stroke-width="2"/>${T(x + 18, y + 40, name, { size: 26, sans: true, weight: 600 })}${T(x + 446, y + 38, line1, { size: 16, fill: col, anchor: 'end' })}${poly(b, vals, Y, col)}${extra ? extra(b, Y) : ''}${T(x + 18, y + 214, winLose, { size: 18, fill: C.amber })}${T(x + 446, y + 214, note, { size: 15, fill: C.dim, anchor: 'end' })}`;
  };

  const SCREENS = {
    'round-trip-1': {
      center: () => {
        const b = [36, 182, 640, 536], closes = path(40, [[0, 37.5], [0.5, 40.5], [0.95, 40.2], [1, 36.4]], 31, 0.35), Y = scaler(b, 34, 43);
        return header('HALCYON', 'Homebuilder', '36.40', 'gapped −9% on jobs', C.red) + frame(b) + candles(b, closes, Y, 7) +
          dash(b, Y(40), C.dim, 'YOU PAID 40.00') + dash(b, Y(37), C.amber, 'YOUR STOP 37.00') +
          panel(668, 182, 300, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['625 shares', { size: 28, sans: true, weight: 600 }], ['$25,000 at cost', { size: 18, fill: C.dim, gap: 54 }], ['THROUGH YOUR STOP', { size: 17, fill: C.amber }], ['−$2,250', { size: 40, fill: C.red, sans: true, weight: 600 }]], '#3c2220');
      },
      right: () => feed('NEWS · 08:30', [['08:30', 'Jobs report runs hot', C.amber], ['08:34', 'Futures now price one March cut, not two'], ['09:30', 'Halcyon opens 36.40 · 2,000 bid'], ['RISK', 'STOP 37.00 · gapped through', C.red]])
    },
    'round-trip-2': {
      center: ctx => {
        const b = [36, 182, 640, 536], closes = path(40, [[0, 40.2], [0.3, 36.4], [0.7, 38.2], [1, 39.5]], 32, 0.3), Y = scaler(b, 34, 43);
        return header('HALCYON', 'Homebuilder', '39.50', 'soft inflation print', C.teal) + frame(b) + candles(b, closes, Y, 8) +
          dash(b, Y(36.4), C.dim, 'MONDAY 36.40') + dash(b, Y(37), C.amber, 'OLD STOP 37.00') +
          panel(668, 182, 300, 354, [['YOUR POSITION', { size: 17, fill: C.dim }], [rtShort(ctx), { size: 26, sans: true, weight: 600, gap: 60 }], ['THESIS', { size: 17, fill: C.dim }], ['Cut in March', { size: 24, sans: true }]]);
      },
      right: () => feed('NEWS · WEDNESDAY', [['08:30', 'Inflation comes in soft', C.teal], ['08:40', 'Futures: one March cut'], ['09:30', 'Homebuilders lead the open'], ['DESK', 'Theo: "This is Wednesday\'s decision."', C.dim]])
    },
    'round-trip-3': {
      center: ctx => {
        const b = [36, 182, 640, 536], closes = path(40, [[0, 39.5], [0.5, 40.1], [1, 41.2]], 33, 0.3), Y = scaler(b, 34, 46);
        return header('HALCYON', 'Homebuilder', '41.20', 'Friday', C.teal) + frame(b) + candles(b, closes, Y, 9) +
          dash(b, Y(45), C.dim, 'MARCH CALLS PAY ABOVE 45') + dash(b, Y(37), C.amber, 'STOP 37.00') +
          panel(668, 182, 300, 354, [['YOUR POSITION', { size: 17, fill: C.dim }], [rtShort(ctx), { size: 26, sans: true, weight: 600, gap: 60 }], ['VICTOR AMES', { size: 17, fill: C.red }], ['Halve it by the close', { size: 22, sans: true }]], '#3c2220');
      },
      right: () => feed('FLOOR · FRIDAY', [['07:10', 'Another desk loses $4m overnight', C.red], ['07:45', 'Victor Ames: halve all positions by the close', C.amber], ['09:30', 'Halcyon 41.20'], ['OPTIONS', 'March calls · ~$600', C.dim]])
    },
    'the-peg': {
      center: () => {
        const b = [36, 182, 640, 536], closes = path(54, [[0, 1.004], [0.3, 0.999], [0.6, 0.993], [0.85, 0.9905], [1, 0.9902]], 21, 0.0012), Y = scaler(b, 0.985, 1.014);
        return header('CROWN', 'Valdor crown vs Bloc mark', '0.9902', 'floor of the band', C.red) + frame(b) + poly(b, closes, Y, C.ink) +
          dash(b, Y(1.01), C.dim, 'BAND TOP 1.0100') + dash(b, Y(1.0), C.dim, 'PEG 1.0000') + dash(b, Y(0.99), C.amber, 'BAND FLOOR 0.9900') +
          panel(668, 182, 300, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['No crowns', { size: 28, sans: true, weight: 600, gap: 54 }], ['IF IT BREAKS', { size: 17, fill: C.dim }], ['about −12%', { size: 26, sans: true, fill: C.teal, gap: 54 }], ['FORWARDS IMPLY', { size: 17, fill: C.amber }], ['about −3%', { size: 26, sans: true }]]);
      },
      right: () => feed('NEWS · VALDOR', [['MON', 'Valdor raises rates 2 points to defend the crown', C.amber], ['TUE', 'Unemployment hits 11%'], ['WED', 'Bloc minutes: "support for partners within the system"'], ['THU', 'Valdor Rail at a ten-year low'], ['FX', 'Crown forwards ~$40bn a day · 2× approved', C.dim]])
    },
    'the-book': {
      center: () => {
        const rows = [['BRIGHTWELL HOMES', 'Homebuilder', 'rates', C.amber], ['CALDER REGIONAL BANK', 'Bank', 'rates', C.amber], ['PINEMOOR REIT', 'Apartments', 'rates', C.amber], ['OSTRANDER AUTO CREDIT', 'Auto loans', 'rates', C.amber], ['QUILLFEATHER SOFTWARE', 'Software', 'rates', C.amber], ['TALLIS GOLD ROYALTY', 'Gold', 'its own', C.teal], ['ASHCOMBE PHARMA', 'Trial readout', 'its own', C.teal]];
        return T(36, 92, `$60,000 TO PUT TO WORK · SEVEN IDEAS`, { size: 20, fill: C.dim }) +
          rows.map(([n, sec, drv, col], i) => `${T(36, 150 + i * 52, n, { size: 24, sans: true, weight: 600 })}${T(520, 150 + i * 52, sec, { size: 20, fill: C.dim, sans: true })}${T(964, 150 + i * 52, `moves with ${drv}`, { size: 18, fill: col, anchor: 'end' })}<line x1="36" y1="${166 + i * 52}" x2="964" y2="${166 + i * 52}" stroke="${C.grid}"/>`).join('') +
          T(36, 534, `RATE HEDGE AVAILABLE · gains when rates rise`, { size: 18, fill: C.dim });
      },
      right: () => feed('NEWS · JUNE', [['09:30', 'Futures price three rate cuts this year', C.teal], ['10:05', 'Homebuilders hit all-time highs'], ['11:20', 'Chat: "rates only go one way from here"'], ['RISK', 'Nadia: book due Friday · show me what moves together', C.amber]])
    },
    'the-turn': {
      center: ctx => {
        const bk = bookOf(ctx || {}), loss = BOOK_LOSS[bk], b = [36, 150, 964, 500];
        const vals = path(60, [[0, 100], [0.8, 104], [0.9, 103], [1, 103 + loss * 0.4]], 21, 0.6), Y = scaler(b, 94, 108);
        return T(36, 112, `YOUR BOOK FROM JUNE · ${M.books[bk].name.toUpperCase()}`.slice(0, 70), { size: 20, fill: C.dim }) + frame(b, 8, 4) + poly(b, vals, Y, loss < -5 ? C.red : C.teal) +
          dash(b, Y(100), C.dim, 'JUNE', 'end') + T(36, 530, 'June', { size: 16, fill: C.dim }) + T(964, 530, 'pre-market today', { size: 16, fill: C.amber, anchor: 'end' });
      },
      right: () => feed('NEWS · 06:15', [['06:00', 'Inflation hot · futures drop two rate cuts', C.amber], ['06:05', 'Homebuilders −6% · regional banks −5% pre-market', C.red], ['05:40', 'Margin debt falling 4% a month'], ['DESK', 'Theo in since 5 am · no trades', C.dim]])
    },
    'final-bet': {
      center: ctx => {
        const b = [36, 182, 620, 536], closes = path(50, [[0, 70], [0.55, 74], [0.8, 72], [1, 80]], 33, 0.6), Y = scaler(b, 60, 108);
        return header('SAROS', 'Warehouse robotics', '80.00', 'breakout · best setup in 2 years', C.amber) + frame(b) + candles(b, closes, Y, 2) +
          dash(b, Y(104), C.teal, 'TARGET 104', 'end') + dash(b, Y(72), C.red, 'EXIT 72', 'end') +
          panel(716, 182, 252, 354, [['YOUR ACCOUNT', { size: 17, fill: C.dim }], [ctx.account != null ? `$${ctx.account}k` : '—', { size: 40, sans: true, weight: 600, gap: 60 }], ['YOUR RULE', { size: 17, fill: C.dim }], [`${riskLabel(ctx)} at risk`, { size: 22, sans: true, gap: 54 }], ['EARNINGS', { size: 17, fill: C.amber }], ['in 3 weeks', { size: 22, sans: true }]]);
      },
      right: () => feed('RISK DESK · NADIA', [['OK', '2× leverage · max 25% of account in one stock'], ['EXCEPT', '4× needs my sign-off', C.amber], ['RISK', 'At 4×, a 25% fall wipes out the account', C.red], ['NOTE', 'Earnings can gap through any exit line', C.dim]])
    }
  };

  // ───────────────────────────────────────── Staging
  // One desk, five hours of the season: dusk, a bright morning, a quiet afternoon, a rainy dawn,
  // and one lamp at night. The desk remembers: your rules stay pinned to the screen, your journal
  // fills with what you did, and the phone carries the rest of your life, and its consequences.
  const alert = t => ({ screen: t });
  const INK = '#2b2620', RED = '#a3382b', SERIF = 'Source Serif 4, Georgia, serif', MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
  const hand = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-family="${SERIF}" font-style="italic" font-size="${o.size || 40}" fill="${o.fill || INK}"${o.strike ? ' text-decoration="line-through"' : ''}${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''}>${String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
  const clip = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
  const DAYS = [
    { clock: '9:31 AM', month: 'MARCH', day: '3', wd: 'MONDAY', msg: ['Sam', 'Good luck today. Dinner at 7?'] },
    { clock: '8:42 AM', month: 'MARCH', day: '5', wd: 'WEDNESDAY', msg: ['Mom', 'Saw the markets are up! So proud of you.'] },
    { clock: '7:50 AM', month: 'MARCH', day: '7', wd: 'FRIDAY', msg: ['Sam', 'You were up at 4 again. Talk tonight?'] },
    { clock: '9:14 AM', month: 'APRIL', day: '22', wd: 'MONDAY', msg: ['Theo', 'Valdor is at the floor. Seen it?'] },
    { clock: '1:40 PM', month: 'JUNE', day: '12', wd: 'THURSDAY', msg: ['Sam', "Don't forget Mia's recital at 6."] },
    { clock: '6:15 AM', month: 'JANUARY', day: '14', wd: 'WEDNESDAY', msg: ['Sam', 'You were up at 4 again. Talk tonight?'] },
    { clock: '10:05 PM', month: 'DECEMBER', day: '18', wd: 'FRIDAY', msg: ['Mia', 'Are you coming to the party?'] }
  ];
  // What the phone shows: your life, unless the desk has something to say first.
  const phoneMsg = (i, ctx) => {
    const past = ctx.past || {}, steps = ctx.steps || [], cap = ctx.cap || {};
    if (i === 4 && past['the-peg'] === 'E') return ['Nadia', 'About Valdor. My office, 8:30.'];
    if (i === 5 && steps.filter(x => x.broke).length >= 2) return ['Nadia', "Let's talk about your sizing. 8:30?"];
    if (i === 6 && cap.soc < 5) return ['Nadia', "I've read your file. Don't ask for an exception."];
    return DAYS[i].msg;
  };
  const desk = i => ({
    clock: () => `<text x="500" y="410" font-family="${MONO}" font-size="300" fill="#e7b75a" text-anchor="middle">${DAYS[i].clock.replace(/ (AM|PM)/, '')}</text><text x="900" y="200" font-family="${MONO}" font-size="90" fill="#e7b75a" text-anchor="end">${DAYS[i].clock.slice(-2)}</text>`,
    calendar: () => `<rect width="1000" height="140" fill="${RED}"/><text x="500" y="105" font-family="${MONO}" font-size="84" fill="#f6efe2" text-anchor="middle" letter-spacing="10">${DAYS[i].month}</text>` +
      `<text x="500" y="420" font-family="${SERIF}" font-size="280" fill="${INK}" text-anchor="middle">${DAYS[i].day}</text><text x="500" y="520" font-family="${MONO}" font-size="60" fill="${INK}" text-anchor="middle" letter-spacing="8">${DAYS[i].wd}</text>`,
    rules: ctx => {
      const r = ctx.rules, steps = ctx.steps || [], broke = steps.filter(x => x.broke).length;
      if (!r) return hand(40, 120, 'My rules:', { size: 70, weight: 600 });
      const risk = M.rules.risk.options.find(o => o.v === r.risk), ed = M.rules.edge.options.find(o => o.v === r.edge);
      return hand(40, 110, 'My rules', { size: 80, weight: 600 }) +
        hand(40, 240, r.risk === 'open' ? 'Size by conviction' : `Risk ≤ ${risk.label} per idea`, { size: 72 }) +
        hand(40, 350, `Edge: ${ed.label.toLowerCase()}`, { size: 72 }) +
        hand(40, 460, 'Stay in the game.', { size: 72 }) +
        (broke ? hand(960, 520, `broken ×${broke}`, { size: 60, fill: RED, anchor: 'end' }) : '');
    },
    journal: ctx => {
      const steps = ctx.steps || [];
      const lines = i === 0 ? [{ t: 'Halcyon 625 @ 40.00.' }, { t: 'Thesis: a cut in March.' }, { t: 'Stop: 37.' }, { t: 'Hot jobs = thesis in doubt.' }]
        : steps.map(x => ({ t: `${x.title}: ${x.did}`, strike: x.broke }));
      const today = i === 0 ? [] : [{ t: `${DAYS[i].month.charAt(0) + DAYS[i].month.slice(1).toLowerCase()} ${DAYS[i].day}: ?`, today: true }];
      return hand(30, 60, 'Journal', { size: 44, weight: 600 }) + [...lines, ...today].slice(-6).map((l, k) =>
        hand(30, 130 + k * 72, clip(l.t, 44), { size: 36, strike: l.strike, fill: l.strike ? RED : l.today ? '#6a5f52' : INK })).join('');
    },
    phone: ctx => {
      const [who, what] = phoneMsg(i, ctx);
      // The phone is portrait: draw at its own width, then stretch to the screen's 1000-wide space.
      return `<g transform="scale(3.7,1)"><rect width="270" height="562" fill="#0d1114"/><rect x="14" y="150" width="242" height="220" rx="18" fill="#26303a"/>` +
        `<text x="28" y="196" font-family="${MONO}" font-size="20" fill="#9fc8d8">${who.toUpperCase()}</text>` +
        what.match(/.{1,22}(\s|$)/g).slice(0, 4).map((ln, k) => `<text x="28" y="${236 + k * 30}" font-family="system-ui, sans-serif" font-size="22" fill="#eef2f4">${ln.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('') +
        `<text x="135" y="90" font-family="system-ui, sans-serif" font-size="44" fill="#eef2f4" text-anchor="middle">${DAYS[i].clock.replace(/ (AM|PM)/, '')}</text></g>`;
    }
  });
  const ENV = { 'round-trip-1': 'desk-morning', 'round-trip-2': 'desk-noon', 'round-trip-3': 'desk-dusk', 'the-peg': 'desk-morning', 'the-book': 'desk-noon', 'the-turn': 'desk-rain', 'final-bet': 'desk-night' };
  const ORDER = ['round-trip-1', 'round-trip-2', 'round-trip-3', 'the-peg', 'the-book', 'the-turn', 'final-bet'];
  const screensFor = id => ({ ...SCREENS[id], ...desk(ORDER.indexOf(id)) });
  M.scenes = {
    'round-trip-1': {
      env: ENV['round-trip-1'],
      screens: screensFor('round-trip-1'),
      cast: [
        { id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see whether your stops are real.` },
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `For the stop you wrote to be the stop you keep.` }
      ],
      intro: [
        { cam: 'wide', caption: `Monday, 8:29. You own 625 Halcyon Homes at $40, on a bet that rates get cut in March.` },
        { cam: 'note', caption: `Beside the keyboard, in your handwriting: "Stop $37. Hot jobs data = thesis in doubt."` },
        { cam: 'screens', ...alert(`08:30 · Jobs report runs hot`), caption: `The number everyone was waiting for.` },
        { cam: 'screens', ...alert(`09:30 · HALCYON OPENS 36.40 · through your stop`) },
        { who: 'theo', mood: 'neutral', pose: 'pocket', say: `Gapped through your line?` },
        { you: `(It'll come back. One report.)` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Two thousand bid at thirty-six forty. You can be out in one print.` }
      ],
      options: {
        A: { line: `Sell all six twenty-five. That was the plan.`, preview: `Keeps the promise, at a worse price.`,
          outcomes: [{ beats: [{ cam: 'screens', ...alert(`SOLD 625 · 36.40 · −2,250`) }, { who: 'nadia', mood: 'smile', act: 'nod', caption: `She initials it. "Clean."` }, { cam: 'screens', ...alert(`WEDNESDAY · HALCYON 39.50`), caption: `It stings. It was still right.` }] }] },
        B: { line: `(Hold. One report.)`, preview: `Keeps the hope, and all the risk.`,
          outcomes: [{ beats: [{ who: 'theo', mood: 'skeptical', act: 'shake' }, { cam: 'screens', ...alert(`WEDNESDAY · HALCYON 39.50`), caption: `It came back. That's the worst thing that could have taught you.` }] }] },
        C: { line: `(Buy six twenty-five more. Better price.)`, preview: `Same thesis, twice the size, no stop.`,
          outcomes: [{ beats: [{ who: 'nadia', mood: 'surprised' }, { cam: 'screens', ...alert(`WEDNESDAY · HALCYON 39.50 · +1,600`), caption: `Half the account now rides on March.` }] }] },
        D: { line: `Selling half. New stop at thirty-five on the rest.`, preview: `Half the promise kept.`,
          outcomes: [{ beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`WEDNESDAY · HALCYON 39.50`) }] }] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },
    'round-trip-2': {
      env: ENV['round-trip-2'],
      screens: screensFor('round-trip-2'),
      cast: [{ id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see whether you can judge Wednesday on Wednesday.` }],
      intro: [
        { cam: 'wide', caption: `Wednesday. Halcyon is back to $39.50.` },
        { if: c => rtGroup(c) === 'out', cam: 'journal', caption: `Your journal: "Sold 625 at 36.40." It's three dollars lower than the screen.` },
        { if: c => rtGroup(c) === 'in', cam: 'journal', caption: `Your journal still says "Stop $37." The position is still on.` },
        { cam: 'screens', ...alert(`08:30 · Inflation comes in soft`) },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `Same stock, new information. What would you do if you'd never owned it?` }
      ],
      options: Object.fromEntries([
        ['A', `Buying back in. Twenty-five thousand, stop at thirty-seven.`, `Pays $3 more than you sold for.`],
        ['B', `Back in at fifty thousand, stop at thirty-seven eighty.`, `Bigger, with a tighter stop. Right only if the evidence got better.`],
        ['C', `(Not paying three dollars more than I sold for.)`, `Anchored to your own exit.`],
        ['D', `(Bid thirty-seven fifty and wait.)`, `Cheaper, if it ever comes back.`],
        ['E', `Adding back to full size, stop at thirty-seven.`, `Sizes Wednesday on Wednesday.`],
        ['F', `(Keep the half.)`, `Nothing new.`],
        ['G', `(Sell the rest. Glad to be even.)`, `Out at break-even, for break-even's sake.`],
        ['H', `Stop back at thirty-seven. Holding.`, `A stop again. Will you keep this one?`],
        ['I', `Selling at thirty-nine fifty. Starting clean.`, `Uses the bounce to do Monday's job.`],
        ['J', `(Add twenty-five thousand more. It's working.)`, `More size on a position held through its stop.`]
      ].map(([k, line, preview]) => [k, { line, preview, outcomes: [{ beats: [{ cam: 'screens', ...alert(`FRIDAY · HALCYON 41.20`) }, { who: 'theo', mood: 'neutral', act: 'nod' }] }] }])),
      links: []
    },
    'round-trip-3': {
      env: ENV['round-trip-3'],
      screens: screensFor('round-trip-3'),
      cast: [
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `For Victor's order to be followed, by everyone.` },
        { id: 'theo', spot: 'theo', mood: 'thinking', pose: 'thinking', wants: `To see whether you can follow an order and keep a bet.` }
      ],
      intro: [
        { cam: 'wide', caption: `Friday morning. The floor is quieter than usual.` },
        { cam: 'screens', ...alert(`07:10 · Another desk lost $4 million overnight`) },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Victor wants every position on the floor halved by the close. Every position.` },
        { if: c => rtSizeOf(c) > 0, you: `(But I'm right about March.)` },
        { if: c => rtSizeOf(c) === 0, you: `(I'm out. Should I be?)` },
        { who: 'theo', mood: 'thinking', pose: 'thinking', say: `I got that order once on the best trade I ever had. Following it was the second-best trade.` }
      ],
      options: {
        A: { line: `Cutting half, as ordered.`, preview: `Keeps half the thesis, and Victor's trust.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · HALCYON 50`) }, { who: 'nadia', mood: 'smile', act: 'nod' }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · STOP FILLED`) }, { who: 'nadia', mood: 'neutral', act: 'nod' }] }] },
        B: { line: `(No. I'm right about March.)`, preview: `Full size, and a refusal on your file.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · HALCYON 50`) }, { who: 'nadia', mood: 'skeptical', pose: 'crossed', caption: `Victor remembers the refusal longer than the profit.` }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · FULL SIZE STOPPED`) }, { who: 'nadia', mood: 'frustrated', pose: 'crossed' }] }] },
        C: { line: `Cutting half, and buying six hundred dollars of March calls.`, preview: `Obeys the order. Keeps the upside, for a cost you can name.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · HALCYON 50 · CALLS ×4`) }, { who: 'theo', mood: 'smile', act: 'nod' }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · CALLS EXPIRE · −600`) }, { who: 'nadia', mood: 'neutral', act: 'nod', caption: `A capped loss on a thesis you kept.` }] }] },
        D: { line: `(Sell it all.)`, preview: `Out, whatever March brings.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · HALCYON 50`), caption: `Without you.` }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · HALCYON 33`), caption: `You're out.` }] }] },
        E: { line: `(Nothing to cut. Stay out.)`, preview: `No position, no decision.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · HALCYON 50`), caption: `Without you.` }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · HALCYON 33`), caption: `You watched.` }] }] },
        F: { line: `Six hundred dollars of March calls.`, preview: `A small, capped way back in.`, outcomes: [{ beats: [{ cam: 'screens', ...alert(`MARCH · CUT · CALLS ×4 · +2,400`) }, { who: 'theo', mood: 'smile', act: 'nod' }] }, { beats: [{ cam: 'screens', ...alert(`MARCH · NO CUT · CALLS EXPIRE · −600`) }] }] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },

    'the-peg': {
      env: ENV['the-peg'],
      screens: screensFor('the-peg'),
      cast: [
        { id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see whether you understand the difference between a big position and a big risk.` },
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `For every position to have an exit she can see.` }
      ],
      intro: [
        { cam: 'wide', caption: `April. The equity screens are quiet. The currency screen isn't.` },
        { if: c => /^[AD]$/.test((c.past || {})['round-trip-1'] || ''), cam: 'rules', caption: `Nadia initialed your Halcyon exit back in March. "Clean," she wrote. It's still on your card.` },
        { if: c => /^[BC]$/.test((c.past || {})['round-trip-1'] || ''), cam: 'journal', caption: `Halcyon is still in your journal. So is the Monday you didn't sell.` },
        { cam: 'screens', caption: `The Valdor crown is pegged to the Bloc mark, inside a 1% band. This morning it's sitting on the floor.` },
        { cam: 'screens', ...alert(`VALDOR RAISES RATES 2 POINTS · unemployment 11%`) },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `I was on a desk the weekend one of these broke. Nobody believed it on Friday.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Two times leverage is approved in currencies this liquid. With a stop I can see.` },
        { you: `(If it breaks, it's twelve percent. If it holds, it bounces one. I can always get out at my stop.)` },
        { cam: 'screens', caption: `Forwards price about a 3% fall. Everyone can see the floor. Not everyone believes it will give.` }
      ],
      options: {
        A: { line: `Fifty thousand short, stop at the middle of the band.`, preview: `A small, defined bet on the break.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`PEG BROKEN · CROWN −12% · +6,000`) }, { who: 'theo', mood: 'neutral', act: 'nod', caption: `Right, and small.` }] },
            { beats: [{ cam: 'screens', ...alert(`BLOC SWAP LINE · CROWN TO MID-BAND · stop −500`) }, { who: 'nadia', mood: 'neutral', act: 'nod' }] }
          ] },
        B: { line: `Two hundred thousand short at two times, stop at the middle of the band.`, preview: `Looks huge. Risks about 2% of the account.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`PEG BROKEN · CROWN −12% · +24,000`) }, { who: 'nadia', mood: 'smile', act: 'nod', caption: `Big position. Small risk. Paid in full.` }] },
            { beats: [{ cam: 'screens', ...alert(`BLOC SWAP LINE · CROWN TO MID-BAND · stop −2,100`) }, { who: 'nadia', mood: 'neutral', act: 'nod', caption: `Exactly the loss you planned.` }] }
          ] },
        C: { line: `A hundred thousand short with a stop, and twenty-five thousand of Valdor Rail.`, preview: `The currency, and the company it would pay.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`PEG BROKEN · CROWN −12% · VALDOR RAIL +30% · +19,500`) }, { who: 'theo', mood: 'smile', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`PEG HOLDS · stop −1,000 · VALDOR RAIL −8% · −3,000`) }] }
          ] },
        D: { line: `(Buy the crown. Nine percent interest, and the peg is the law.)`, preview: `Steady income, unless the promise breaks.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`PEG BROKEN · CROWN −12% · −12,000`) }, { who: 'nadia', mood: 'frustrated', pose: 'crossed' }] },
            { beats: [{ cam: 'screens', ...alert(`PEG HOLDS · interest +800`) }, { who: 'theo', mood: 'skeptical', act: 'glance', caption: `Pennies, in front of a train that didn't come this time.` }] }
          ] },
        E: { line: `Nadia, I want an exception. Four hundred thousand short, four times, no stop.`, preview: `The biggest win on the board, or the end of your year.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'awkward', pose: 'tablet' }, { cam: 'screens', ...alert(`PEG BROKEN · CROWN −12% · +48,000`), caption: `You'll spend years trying to feel this again.` }] },
            { beats: [{ who: 'nadia', mood: 'surprised' }, { cam: 'screens', ...alert(`OVERNIGHT RATES 300% · SHORTS SQUEEZED · −23,000`) }, { who: 'theo', mood: 'neutral', act: 'sigh' }] },
            { beats: [{ who: 'nadia', mood: 'skeptical', pose: 'crossed', say: `Two times, with a stop, or nothing.` }] }
          ] },
        F: { line: `(Pass. Currencies aren't my game.)`, preview: `Nothing to lose. Nothing to win.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`PEG BROKEN · CROWN −12%`) }, { who: 'theo', mood: 'neutral', pose: 'pocket', caption: `Theo doesn't say how much he made.` }] },
            { beats: [{ cam: 'screens', ...alert(`BLOC SWAP LINE · CROWN TO MID-BAND`), caption: `You weren't in it.` }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },

    'the-book': {
      env: ENV['the-book'],
      screens: screensFor('the-book'),
      cast: [
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `A book she can explain on the worst day of the year.` },
        { id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see whether you count bets or names.` }
      ],
      intro: [
        { cam: 'wide', caption: `June. The market has gone up almost every day since April. So have you.` },
        { if: c => (c.past || {})['the-peg'] === 'E', cam: 'phone', caption: `Nadia still hasn't forgotten the exception you asked for on Valdor.` },
        { if: c => /^[BC]$/.test((c.past || {})['the-peg'] || ''), caption: `The Valdor trade is still on Theo's whiteboard: a very large number, next to a very small stop.` },
        { cam: 'screens', caption: `Seven ideas on the screen. Five of them are the best you've had all year.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Sixty thousand to put to work for the summer. I want your book by Friday.` },
        { who: 'nadia', mood: 'neutral', say: `And I'll be looking at what moves together, not how many names you own.` },
        { you: `(Five sectors. Homes, a bank, apartments, auto loans, software. That's diversified.)` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `What do all five need to happen?` }
      ],
      options: {
        A: { line: `(My five best ideas, twelve thousand each.)`, preview: `Five names. Possibly one bet.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`ALL FIVE UP · +4,200`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `It felt like five good decisions.` }] },
            { beats: [{ cam: 'screens', ...alert(`HOT INFLATION PRINT · ALL FIVE DOWN · −2,000`) }, { who: 'theo', mood: 'neutral', act: 'nod', caption: `Five names fell on the same day. Remember that.` }] }
          ] },
        B: { line: `The same five, with a ten-thousand-dollar rate hedge.`, preview: `Covers half of what the five share.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`FIVE UP · HEDGE DOWN · +2,600`) }, { who: 'nadia', mood: 'neutral', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`FIVE DOWN · HEDGE UP · −600`) }, { who: 'nadia', mood: 'smile', act: 'nod' }] }
          ] },
        C: { line: `Balanced by risk. Three rate names, Tallis, Ashcombe, and a hedge sized so each group carries the same risk.`, preview: `Looks timid in a good summer. Built for a bad winter.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`+2,000 · less than the room`) }, { who: 'theo', mood: 'smile', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`HOT PRINT · RATE NAMES DOWN · TALLIS AND HEDGE UP · +200`) }, { who: 'nadia', mood: 'smile', act: 'nod', caption: `Up in the week everyone else lost money.` }] }
          ] },
        D: { line: `(Forty thousand in Quillfeather. My best idea.)`, preview: `One bet, sized like one.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`QUILLFEATHER +14% · +5,500`) }, { who: 'theo', mood: 'neutral', act: 'nod', caption: `Ask him again in January.` }] },
            { beats: [{ cam: 'screens', ...alert(`QUILLFEATHER −10% · −4,000`) }, { who: 'nadia', mood: 'skeptical', pose: 'crossed' }] }
          ] },
        E: { line: `(Cash, until the summer settles.)`, preview: `No book. No risk. No plan either.`,
          outcomes: [
            { beats: [{ cam: 'screens', caption: `Everything rises all summer without you.` }] },
            { beats: [{ cam: 'screens', ...alert(`HOT INFLATION PRINT`), caption: `You watched it.` }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },

    'the-turn': {
      env: ENV['the-turn'],
      screens: screensFor('the-turn'),
      cast: [
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `To know what your book does if this is the turn.` },
        { id: 'theo', spot: 'theo', mood: 'thinking', pose: 'thinking', wants: `To understand what changed before he risks anything.` }
      ],
      intro: [
        { cam: 'window', caption: `January. Rain since midnight. The book you built in June is still on.` },
        { if: c => (c.cap || {}).psy <= 3, caption: `You haven't slept properly in weeks. It shows in how fast you want to act.` },
        { if: c => (c.flags || {}).book === 'balanced', cam: 'journal', caption: `Your June note: "Built for a bad winter." This might be it.` },
        { if: c => ['oneBet', 'concentrated'].includes((c.flags || {}).book), cam: 'journal', caption: `Your June note: "Five sectors. Diversified."` },
        { cam: 'screens', ...alert(`06:00 · Inflation hot · futures take two rate cuts out of the year`) },
        { cam: 'screens', ...alert(`Homebuilders −6% · regional banks −5% before the open`) },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Your book's on my screen. I'd like to know what it does if this is the turn.` },
        { you: `(Every dip I've seen for two years has come back.)` },
        { who: 'theo', mood: 'thinking', pose: 'thinking', caption: `Theo has been in since five. He isn't trading. He's reading the margin-debt numbers.` }
      ],
      options: {
        A: { line: `(Buy the dip. Ten thousand more.)`, preview: `Right if nothing changed. Expensive if something did.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SELLING CONTINUES · dip −3,000`) }, { who: 'nadia', mood: 'skeptical', pose: 'tablet' }] },
            { beats: [{ cam: 'screens', ...alert(`DIP RECOVERS IN THREE WEEKS · +2,000`) }, { who: 'theo', mood: 'neutral', act: 'nod' }] }
          ] },
        B: { line: `I'm halving everything.`, preview: `Blunt. Cuts the good with the bad.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', caption: `Half the damage of the weeks that follow.` }] },
            { beats: [{ cam: 'screens', caption: `The dip recovers, on half your size.` }] }
          ] },
        C: { line: `I'm cutting what moves together, and keeping what doesn't.`, preview: `Cuts the one risk the book really has.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `You cut the cluster before the second leg down.` }] },
            { beats: [{ cam: 'screens', caption: `The dip recovers, mostly without what you sold.` }] }
          ] },
        D: { line: `(Lever up. Borrow and buy more.)`, preview: `Twice the recovery, or twice the turn.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`FORCED SELLING · LEVERAGE CALLED`) }, { who: 'nadia', mood: 'frustrated', pose: 'crossed', say: `I'm halving your limits. Today.` }] },
            { beats: [{ cam: 'screens', ...alert(`DIP RECOVERS · LEVERED`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `It worked. That makes next time more dangerous.` }] }
          ] },
        E: { line: `I'm selling everything at the open.`, preview: `Safe from the turn, and from the recovery.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', act: 'nod' }, { cam: 'screens', caption: `You miss the weeks of selling that follow.` }] },
            { beats: [{ cam: 'screens', caption: `Three weeks later it has recovered without you.` }] }
          ] },
        F: { line: `I'm flipping: short the rate names, stop at today's high.`, preview: `The best trade of the year, if the market changed.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`FORCED SELLING FOR WEEKS · SHORT +6,000`) }, { who: 'theo', mood: 'smile', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`DIP RECOVERS · STOP HIT · −2,500`) }, { who: 'theo', mood: 'neutral', act: 'shake', caption: `One bad print too early.` }] }
          ] },
        G: { line: `(Hold. The book was built for this.)`, preview: `A plan, or a hope, depending on what you built.`,
          outcomes: [
            { beats: [{ cam: 'screens', caption: `The selling runs for weeks.` }, { who: 'nadia', mood: 'neutral', pose: 'tablet' }] },
            { beats: [{ cam: 'screens', caption: `The dip recovers within three weeks.` }, { who: 'theo', mood: 'neutral', act: 'nod' }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },

    'final-bet': {
      env: ENV['final-bet'],
      screens: screensFor('final-bet'),
      cast: [
        { id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see you here next December.` },
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `To approve only what you can survive.` }
      ],
      intro: [
        { cam: 'window', caption: `December. Ten at night, one lamp on. A year of decisions at this desk. You've won some and lost some.` },
        { cam: 'journal', caption: `Your journal is nearly full. Some lines are crossed out.` },
        { cam: 'screens', caption: `Tonight: Saros Robotics, breaking out after a year going sideways. The best setup you've seen in two years.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Two times leverage is approved, up to a quarter of your account in one name. Anything beyond that is an exception, and I'd have to sign it.` },
        { if: c => (c.cap || {}).soc < 5, who: 'nadia', mood: 'skeptical', pose: 'crossed', say: `I've read your file this year. You know what I'm going to say about exceptions.` },
        { if: c => (c.cap || {}).soc >= 7, who: 'nadia', mood: 'smile', say: `Your file's clean. That buys you a conversation, not a blank check.` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `I keep a list of traders who were brilliant until one afternoon. It's longer than you'd think.` },
        { you: `(One trade could put me ahead of everyone on this floor.)` },
        { cam: 'screens', ...alert(`Earnings in three weeks · How much are you willing to risk to win?`) }
      ],
      options: {
        A: { line: `Nadia, I want an exception. Four times, the whole account.`, preview: `Ahead of everyone, or gone.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'awkward', pose: 'tablet' }, { cam: 'screens', ...alert(`SAROS 104 · account more than doubles`), caption: `You'll spend years trying to feel this again.` }] },
            { beats: [{ who: 'nadia', mood: 'frustrated' }, { cam: 'screens', ...alert(`STOP FILLED · 71.20 · −44% of account`) }] },
            { beats: [{ who: 'nadia', mood: 'surprised' }, { cam: 'screens', ...alert(`SAROS OPENS −25% · ACCOUNT LIQUIDATED`) }, { who: 'theo', mood: 'neutral', act: 'sigh', caption: `It's over before the open finishes.` }] },
            { beats: [{ who: 'nadia', mood: 'skeptical', pose: 'crossed', say: `Not with this year's record. Two times, a quarter of the account, or nothing.` }] },
            { beats: [{ who: 'nadia', mood: 'awkward', pose: 'tablet' }, { cam: 'screens', ...alert(`SAROS GAPS TO 104 ON EARNINGS · account more than doubles`), caption: `The gap could have gone the other way.` }] }
          ] },
        B: { line: `(Twenty-five thousand. I don't need an exit. I'm sure.)`, preview: `The right size, with no plan for being wrong.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SAROS 104 · +7,500`), caption: `It works.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS 60 · −6,300`), caption: `With no exit, you rode it down.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · −6,300`), caption: `A panic sale after earnings.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS GAPS TO 104 · +7,500`), caption: `It worked. The plan for the other gap never existed.` }] }
          ] },
        C: { line: `My normal size. Ten thousand, out at seventy-two.`, preview: `Survivable in every world. Small when you're right.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS 104 · +3,000`), caption: `Right on the setup of the year, at normal size.` }] },
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · 72 · −1,000`) }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · through your exit · −2,500`) }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS GAPS TO 104 · +3,000`), caption: `Right on the setup of the year, at normal size.` }] }
          ] },
        D: { line: `Five thousand to start. I'll add as it proves itself, and raise my exit to break-even.`, preview: `Let the market confirm you before you commit more.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`Added twice · SAROS 104 · +3,100`), caption: `The winner ran, and you let it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`−500 · position closed`) }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · −1,300`), caption: `It failed while you were still small.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS GAPS TO 104 · +1,500`), caption: `Your adds never triggered. The gap paid your starter.` }] }
          ] },
        E: { line: `(Nothing. The year is done.)`, preview: `Safe. Is safe the same as surviving?`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`SAROS 104`), caption: `It works, without you.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS 72`), caption: `It fails. You feel clever, briefly.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25%`), caption: `You weren't in it. Luck, not a plan.` }] },
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`SAROS GAPS TO 104 ON EARNINGS`), caption: `It works, without you.` }] }
          ] },
        G: { line: `Twenty-five thousand, out at seventy-two. Back to ten the day before earnings.`, preview: `Big while the exit protects you. Small when it can't.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS 104 · +7,500`), caption: `Right, and sized like you meant it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · 72 · −2,500`), caption: `Exactly the loss you planned.` }] },
            { beats: [{ cam: 'screens', ...alert(`CUT TO 10,000 · SAROS OPENS −25% · −2,500`) }, { who: 'nadia', mood: 'smile', act: 'nod', caption: `The gap you saw coming cost what you planned for.` }] },
            { beats: [{ cam: 'screens', ...alert(`CUT TO 10,000 · SAROS GAPS TO 104 · +3,750`) }, { who: 'theo', mood: 'neutral', act: 'nod', caption: `The cut was right on what you knew. This time it cost you half the gap.` }] }
          ] },
        F: { line: `Twenty-five thousand, out at seventy-two. I'll hold it through earnings.`, preview: `Bigger when you're right. The exit can't cover a gap.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS 104 · +7,500`), caption: `Right, and sized like you meant it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · 72 · −2,500`), caption: `Exactly the loss you planned.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · through your exit · −6,300`) }, { who: 'theo', mood: 'neutral', act: 'sigh' }] },
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS GAPS TO 104 ON EARNINGS · +7,500`), caption: `You held the risk you sized for, and it paid.` }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    }
  };

  PP.market = M;
})();
