// The Trader's Mind: a section inspired by Jack Schwager's Market Wizards.
// Not a game about trading. A game about managing yourself where nobody controls the outcome.
// Five challenges share one desk, one account and five kinds of capital. Lose half the
// account and the desk pulls your capital: the section ends, and that is the lesson.
window.PP = window.PP || {};

(function () {
  const M = {};

  M.ep = {
    id: 'market', title: `The Trader's Mind`,
    places: [
      { key: 'night', name: `The desk, 8:47 pm`, scenes: ['losing-position'] },
      { key: 'april', name: `The desk, April`, scenes: ['winning-streak'] },
      { key: 'thursday', name: `The desk, a slow Thursday`, scenes: ['empty-hand'] },
      { key: 'january', name: `The desk, January`, scenes: ['changing-market'] },
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
  M.ruin = 50; // the desk's hard limit: lose half the account and your capital is pulled

  // The rules you set before you sit down. The game compares them with what you do.
  M.rules = {
    risk: {
      q: `How much will you risk on any one decision?`,
      options: [
        { v: 'tight', label: `Small`, d: `A small slice of the account. No single idea can hurt me badly.`, max: 1 },
        { v: 'measured', label: `Normal`, d: `A normal position. Big enough to matter, never big enough to end me.`, max: 2 },
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
  M.exposureVerb = { none: `risked nothing new`, small: `took a small risk`, normal: `took a normal-sized risk`, large: `took a large risk`, all: `put everything at risk` };
  M.exposureLabel = { none: `No new risk`, small: `Small risk`, normal: `Normal risk`, large: `Large risk`, all: `Everything at risk` };

  // The code is never shown up front. It's revealed at the end, scored from what you did.
  M.principles = [
    { k: 'downside', name: `Protect your downside`, line: `Never risk so much that one decision ends your ability to play.`, scenes: ['losing-position', 'final-bet'] },
    { k: 'edge', name: `Find your edge`, line: `Don't play because you want to win. Play because you have a reason to believe you can.`, scenes: ['empty-hand', 'winning-streak'] },
    { k: 'evidence', name: `Follow the evidence`, line: `Don't confuse your predictions, beliefs or ego with reality.`, scenes: ['changing-market', 'losing-position'] },
    { k: 'self', name: `Master yourself`, line: `Your impulses are often a more dangerous opponent than the person across from you.`, scenes: ['winning-streak', 'empty-hand'] },
    { k: 'stay', name: `Stay in the game`, line: `Preserve the resources, relationships and opportunities that let you keep playing.`, scenes: ['final-bet', 'changing-market'] }
  ];

  M.scenarios = [
    // ───────────────────────────────────────── 1
    {
      id: 'losing-position',
      facts: [
        `You <strong>bought</strong> 880 shares of Halcyon (HLX) at $52. You make money only if the price rises.`,
        `HLX is now $41.62, down 20%. Your loss so far is <strong>$9,140</strong>, nearly a tenth of your account.`,
        `Before buying, you wrote: sell if it falls below $47.80, an 8% loss. It passed that nine days ago.`,
        `Tonight's news: Halcyon's biggest customer may cancel its contract.`,
        `You can still sell tonight. Regular trading reopens at 9:30 tomorrow morning.`
      ],
      tests: `Can you accept being wrong?`,
      level: `Sunk cost`,
      title: `The Losing Position`,
      lens: ['seykota', 'duke'],
      setting: `The desk · 8:47 pm · Down $9,140`,
      cast: [
        { name: `Theo`, role: `Senior trader, 31 years on the desk`, archetype: `The Survivor`, power: `Experience`, note: `Has seen this exact night many times.` }
      ],
      known: [`You bought HLX at $52 on a thesis you wrote down.`, `It's at $41.62, 20% below your entry.`, `Your written exit was $47.80. You passed it nine days ago.`, `The position is nearly half your account.`],
      unknown: [`Whether Halcyon's biggest customer actually leaves.`, `Whether this is the bottom.`, `What the stock does at tomorrow's open.`],
      clues: [
        { label: `Read your own note`, text: `"Original thesis: strong fundamentals, temporary market weakness. Out if wrong." Tonight's headline isn't about the market. It's about Halcyon. The thesis was about something that is no longer the problem.` },
        { label: `The sticky note`, text: `"MAX LOSS −8%. OUT BELOW 47.80." You wrote it before you bought, when you had nothing to defend. You're down 20%.` },
        { label: `The order book`, text: `Sellers are stacked at every price above $41.70. For two weeks, every bounce has been sold.` }
      ],
      question: `Are you managing your position, or your ego?`,
      options: [
        {
          key: 'A', text: `Sell all 880 shares now. Take the $9,140 loss.`, exposure: 'none',
          q: 4, s: { jdg: 2, reg: 2, bnd: 1, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: -9, text: `You're out at $41.62. At 6:30 am Halcyon confirms the customer is leaving, and the stock opens at $33. Holding would have cost another $7,600.` },
            { p: 0.4, tone: 'mixed', fin: -9, text: `You're out at $41.62. A week later the customer renews and HLX bounces to $46. It stings. You still sold a broken thesis at a loss you could afford.` }
          ],
          later: `Your account is smaller, and all of it is still yours to use tomorrow.`,
          verdict: { who: 'theo', line: `Took the loss without a speech. That's rarer than a good call.` }
        },
        {
          key: 'B', text: `Keep all 880 shares. The company is still sound. It'll come back.`, exposure: 'large',
          q: 1, s: { jdg: -2, reg: -1, inf: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: 0.55, tone: 'bad', fin: -17, text: `The customer leaves. HLX opens at $33. Your loss is $16,700, and the decision you avoided tonight is waiting for you again, at a worse price.` },
            { p: 0.45, tone: 'good', fin: -5, text: `The customer renews. HLX climbs back to $46 over two weeks and your loss shrinks to $5,300. It worked. It also taught you that waiting fixes things.` }
          ],
          later: `Hope isn't a risk limit. Whether or not it worked, you held a position your own rule told you to leave.`,
          verdict: { who: 'theo', line: `Said it would come back. Some do. That's what makes the habit so expensive.` }
        },
        {
          key: 'C', text: `Buy 880 more at $41.62. It's a bargain, and it lowers your average cost per share.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, bnd: -2 }, cap: { psy: -2, soc: -1 },
          outcomes: [
            { p: 0.55, tone: 'bad', fin: -30, text: `You buy 880 more at $41.60. The customer leaves. HLX opens at $33 and slides to $30 by Friday, when you finally sell. The loss is $29,600, almost a third of your account.` },
            { p: 0.45, tone: 'good', fin: -1, text: `The customer renews and HLX climbs to $46. You're nearly back to even, down $1,400. It worked, and you'll remember that it worked.` }
          ],
          later: `You turned a mistake into a bigger bet on the same mistake. Averaging down feels like conviction. It's the ego, sizing up.`,
          verdict: { who: 'nadia', line: `Doubled a position that had already blown through its stop. I flagged the account that night.` }
        },
        {
          key: 'D', text: `Sell half (440 shares) now. For the rest, set an automatic sell order (a stop) at $40.50.`, exposure: 'small',
          q: 3, s: { jdg: 1, reg: 1, bnd: 1 }, cap: { psy: 1 },
          outcomes: [
            { p: 0.55, tone: 'mixed', fin: -13, text: `You sell 440 shares. The stop can't save the rest: HLX opens at $33, below your stop, and the order fills there. Total loss $12,900. Better than holding, worse than a clean exit.` },
            { p: 0.45, tone: 'good', fin: -7, text: `Half out at $41.62. The customer renews and the rest recovers to $46. Total loss $7,200.` }
          ],
          later: `You cut the risk in half and kept a written exit. A stop doesn't protect you from a gap, though. Only size does.`,
          verdict: { who: 'theo', line: `Cut it in half instead of all the way. Halfway honest. Still better than most.` }
        },
        {
          key: 'E', text: `Close the screens. Keep the shares overnight and decide in the morning with a clear head.`, exposure: 'large',
          q: 1, s: { reg: 1, jdg: -2 }, cap: {},
          outcomes: [
            { p: 0.6, tone: 'bad', fin: -17, text: `At 6:30 am the news is confirmed. HLX opens at $33. The clear head costs $7,600 more than the decision you could have made last night.` },
            { p: 0.4, tone: 'mixed', fin: -9, text: `Overnight, nothing changes. You sell at the open at $41.40. Same loss, one bad night of sleep.` }
          ],
          later: `Sleeping on it is wise when the problem is your mood. Here the problem was the position, and it stayed open all night.`,
          verdict: { who: 'nadia', line: `Left a broken position open overnight. Nothing personal. It's in the report.` }
        }
      ],
      analysis: {
        game: `A decision against an opponent with no feelings. The market doesn't know your entry price and doesn't care what you paid. The only question is whether you'd buy this position today, at this price, knowing what you know.`,
        incentives: `You want to be right. The account needs to survive. Tonight those point in opposite directions.`,
        leverage: `One real advantage: a rule you wrote before you had anything to defend.`,
        missing: `Whether the customer leaves. Nobody knew. That's why your size, not your forecast, decided how bad it could get.`,
        assumptions: `That a lower price makes it a better deal. That a stop protects you from a gap. That the original thesis still describes this company.`,
        controlled: `Size, and whether you kept your own rule.`,
        couldnt: `The customer, the gap, the open.`,
        concept: { thinker: 'seykota', name: `Cut your losses`, body: `Seykota's rules begin with the losing trade: get out when the reason you got in is gone, not when the pain becomes unbearable. You decide how big a loss gets. You don't get to decide whether you'll have one.` },
        second: { thinker: 'duke', name: `Sunk cost`, body: `What you paid is history. Annie Duke's test: if you didn't own this position, would you buy it right now? If not, holding it is buying it again, every minute.` },
        better: `A. Then write down why the thesis broke, so the next sticky note is easier to obey.`,
        lesson: `Bruce Kovner's rule fits on a sticky note: know where you'll get out before you get in. You did. Tonight was about keeping the promise.`
      },
      life: { title: `The partnership`, text: `Two years ago you went into business with a friend. The reasons were good. The last three quarters say they aren't anymore. You can leave now at a cost you can absorb, keep going and hope, or put in more money to save it. Same decision. Same ego.` }
    },

    // ───────────────────────────────────────── 2
    {
      id: 'winning-streak',
      facts: [
        `You've won seven trades in a row. Your trade sizes have doubled since January.`,
        `Marco's tip: <strong>buy</strong> Vellum Bio shares. You make money only if its drug is approved.`,
        `The FDA, the US drug regulator, decides at 7 am tomorrow. Nobody knows the answer.`,
        `The stock is expected to jump about 50% on approval, or fall about 50% on rejection.`,
        `A normal trade for you is about $10,000, so roughly +$5,000 or −$5,000. You also hold three other winning trades.`
      ],
      tests: `Can you avoid overconfidence?`,
      level: `Overconfidence`,
      title: `The Winning Streak`,
      lens: ['duke', 'seykota'],
      setting: `The desk · April · Seven winners in a row`,
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Doesn't care whether you're right. Cares whether you'll still be here.` }
      ],
      known: [`Seven straight winning trades.`, `Vellum Bio's FDA decision is tomorrow at 7 am.`, `A rejection would likely halve the stock. Approval might double it.`],
      unknown: [`The FDA's decision.`, `Whether Marco knows anything the market doesn't.`, `Whether your streak came from skill, the market, or luck.`],
      clues: [
        { label: `Your last seven trades`, text: `Five of the seven came in a market that rose almost every day. The two that didn't depend on that made the smallest gains.` },
        { label: `Marco's track record`, text: `He's sent four tips like this in two years. One worked.` },
        { label: `The options market`, text: `Option prices imply a move of about 45% either way. The crowd has no idea either. It's priced as a coin flip.` }
      ],
      question: `The streak is real. Is the edge?`,
      options: [
        {
          key: 'A', text: `Go big: buy Vellum at five times your usual size, about $50,000. You're seeing the market clearly right now.`, exposure: 'all',
          q: 0, s: { reg: -2, jdg: -3, bnd: -1 }, cap: { psy: -1, soc: -1 },
          outcomes: [
            { p: 0.45, tone: 'good', fin: 26, text: `Approved. Vellum opens up 52%. You make $26,000 in eight minutes, and you feel like you can't miss.` },
            { p: 0.55, tone: 'bad', fin: -24, text: `Rejected. Vellum opens down 48%. You lose $24,000 before your coffee cools. Seven wins, gone in one.` }
          ],
          later: `A streak changes how you feel, not what you know. Your size followed the feeling.`,
          verdict: { who: 'nadia', line: `Five times normal size on a coin flip. Win or lose, that's the trade I worry about.` }
        },
        {
          key: 'B', text: `Buy Vellum at your normal size, about $10,000. You've been right. Trust the process.`, exposure: 'normal',
          q: 2, s: { jdg: -1 }, cap: {},
          outcomes: [
            { p: 0.45, tone: 'good', fin: 5, text: `Approved. Up 52%. A solid $5,200 gain.` },
            { p: 0.55, tone: 'bad', fin: -5, text: `Rejected. Down 48%. A $4,800 loss. Painful, survivable.` }
          ],
          later: `Normal size was survivable. But your process is built for edges, and this was a coin flip with a story attached.`,
          verdict: { who: 'nadia', line: `Normal size. Fine. I just couldn't tell you what the edge was.` }
        },
        {
          key: 'C', text: `Don't buy Vellum. A coin flip isn't an edge, and a streak isn't information.`, exposure: 'none',
          q: 3, s: { jdg: 2, reg: 2, bnd: 1, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: 0.45, tone: 'mixed', fin: 0, text: `Approved. Vellum opens up 52%. Marco texts a rocket emoji. You made nothing, and you made the right call.` },
            { p: 0.55, tone: 'good', fin: 0, text: `Rejected. Vellum opens down 48%. Marco goes quiet. Your account doesn't notice.` }
          ],
          later: `Passing felt like losing when it was approved. That feeling is the price of discipline, and it's cheaper than the alternative.`,
          verdict: { who: 'theo', line: `Passed on a coin flip in the middle of a hot streak. That's the one I'd hire.` }
        },
        {
          key: 'D', text: `Don't buy Vellum, and shrink all your trades back to January's size for a while.`, exposure: 'none',
          q: 4, s: { jdg: 2, reg: 2, bnd: 2, lng: 1 }, cap: { psy: 1, soc: 1, str: 1 },
          outcomes: [
            { p: 0.45, tone: 'mixed', fin: 0, text: `Approved, up 52%, and you weren't in it. Two weeks later the market turns, and your smaller positions take the hit gently.` },
            { p: 0.55, tone: 'good', fin: 0, text: `Rejected, down 48%. Two weeks later the market turns, and your smaller positions keep the damage small.` }
          ],
          later: `You noticed the streak had changed your behavior, not just your results, and you reset before the market did it for you.`,
          verdict: { who: 'nadia', line: `Cut their own size before I had to ask. I trust that account more than its returns.` }
        },
        {
          key: 'E', text: `Sell everything you own and keep this year's gains. You've proven yourself.`, exposure: 'none',
          q: 1, s: { reg: -1, lng: -1, jdg: -1 }, cap: { time: -1 },
          outcomes: [
            { p: 0.6, tone: 'mixed', fin: 0, text: `You've sold everything by noon. Your three winning trades keep rising for another month, up 14%. You were safe, and you were out.` },
            { p: 0.4, tone: 'good', fin: 0, text: `You've sold everything by noon. A week later the market drops 6%. It looks like genius. It was a mood.` }
          ],
          later: `Cutting winners to feel safe is the mirror image of holding losers to avoid feeling wrong. Both let comfort run the account.`,
          verdict: { who: 'theo', line: `Sold everything to protect a good feeling. I've done it. It never lasts.` }
        }
      ],
      analysis: {
        game: `A one-shot bet on a binary event, offered at the moment you feel most certain. The FDA doesn't know about your streak.`,
        incentives: `Marco gains from being right in front of you and loses nothing if you lose. The streak makes you want to keep the feeling going.`,
        leverage: `Patience. Nothing forces you to have an opinion on Vellum.`,
        missing: `Any reason to think you know the outcome better than the options market, which priced it as a coin flip.`,
        assumptions: `That recent wins mean better judgment. That a tip from a friend is information.`,
        controlled: `Whether to play, and how big.`,
        couldnt: `The FDA.`,
        concept: { thinker: 'duke', name: `Resulting`, body: `Judging a decision by how it turned out. Seven good results can come from a rising market rather than good decisions. Duke would ask what you'd have concluded if the market had been flat.` },
        second: { thinker: 'seykota', name: `Let winners run`, body: `Seykota's other rule: let profits run. Cutting real winners to lock in the feeling of success is the twin of holding losers to avoid the feeling of failure.` },
        better: `D. The streak was the warning, and Nadia said it out loud. Cut your size back, pass on the coin flip, and let your real winners run.`,
        lesson: `Overconfidence rarely feels like arrogance. It feels like clarity.`
      },
      life: { title: `The promotion`, text: `You've just been promoted, and everything at work is going right. A friend shows you a house at the very top of your budget. Your recent success feels like proof you can handle it. The bank will say yes. Whether it should is a different question.` }
    },

    // ───────────────────────────────────────── 3
    {
      id: 'empty-hand',
      facts: [
        `You own nothing right now. A normal trade for you is about $10,000. Your edge: <strong>{edge}</strong>.`,
        `NOVA: everyone's buying before its earnings report, which could move it either way.`,
        `Keel Foods: being bought by another company for $30 a share once the deal closes. Today it's $28.60.`,
        `Arden Energy: just hit its highest price in two years, on unusually heavy trading.`,
        `Tessel: down 40% this morning after its auditor, the firm that checks its books, quit. Nobody knows why.`
      ],
      tests: `Can you wait for an edge?`,
      level: `Selective participation`,
      title: `The Empty Hand`,
      lens: ['seykota', 'schelling'],
      setting: `The desk · A slow Thursday · Four ideas before lunch`,
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Patience`, note: `Hasn't placed a trade in nine days.` }
      ],
      known: [`Four ideas have reached you before lunch.`, `You have no open positions.`, `Nothing requires you to trade today.`],
      unknown: [`Which ideas, if any, will work.`, `Whether the Keel merger closes.`, `Why Tessel fell.`],
      clues: [
        { label: `Your rules card`, text: `Each idea suits a different kind of trader. Only one fits the edge you wrote down this morning, and on some days none do.` },
        { label: `Theo's screen`, text: `Theo hasn't placed a trade in nine days. He's having his best year in a decade.` },
        { label: `Tessel's news`, text: `Tessel fell after its auditor resigned. Nobody knows what the auditor found. Neither do you.` }
      ],
      edgeNote: {
        research: `Your idea was Keel Foods. A merger spread where you've read every filing is exactly the trade a researcher should take.`,
        speed: `Your idea was Arden Energy. A clean breakout on heavy volume is what a trader who reads price is built for.`,
        patience: `Your honest answer was probably none. A patient trader waits for the rare, obvious setup, and a slow Thursday seldom brings one. Keel was the closest.`
      },
      question: `Four ideas. How many deserve your money?`,
      options: [
        {
          key: 'A', text: `Buy all four, at normal size. More shots, more chances.`, exposure: 'large',
          q: 0, s: { reg: -2, jdg: -2, inf: -1 }, cap: { psy: -1, str: -1 },
          outcomes: [
            { p: 0.6, tone: 'bad', fin: -7, text: `NOVA misses earnings, Tessel keeps falling, Arden reverses, and Keel barely moves. A busy day, $7,000 lighter.` },
            { p: 0.4, tone: 'mixed', fin: -2, text: `Two work, two don't. After costs you're down $2,000, and exhausted.` }
          ],
          later: `Activity felt like progress. Four positions you half understood cost more than they could earn.`,
          verdict: { who: 'theo', line: `Four trades before lunch. I remember being that busy. I don't remember it working.` }
        },
        {
          key: 'B', text: `Buy only the idea that fits your edge ({edge}), at normal size. Pass on the rest.`, exposure: 'normal',
          q: ctx => ctx.rules && ctx.rules.edge === 'patience' ? 3 : 4, s: { jdg: 2, inf: 2, bnd: 1, str: 1 }, cap: { str: 2, psy: 1 },
          outcomes: [
            { p: 0.65, tone: 'good', fin: 3, text: `Your one trade works the way your trades are supposed to. Up $3,000 over three weeks. The other three ideas do what coin flips do.` },
            { p: 0.35, tone: 'mixed', fin: -1, text: `Your automatic sell order takes you out for a $1,000 loss. It was a good trade that didn't work. You'd take it again.` }
          ],
          later: `You played the one game you're built for and declined the others.`,
          verdict: { who: 'theo', line: `Took one trade, the one that looked like them. I'd let them sit next to me.` }
        },
        {
          key: 'C', text: `Buy nothing today. None of it is good enough.`, exposure: 'none',
          // For a patient trader, a slow Thursday with no obvious setup is exactly when to wait.
          q: ctx => ctx.rules && ctx.rules.edge === 'patience' ? 4 : 3, s: { jdg: 1, reg: 2, bnd: 1 }, cap: { psy: 1, time: -1 },
          outcomes: [
            { p: 0.5, tone: 'good', fin: 0, text: `You don't trade. NOVA misses earnings and Tessel keeps falling. A quiet, profitable day of doing nothing.` },
            { p: 0.5, tone: 'mixed', fin: 0, text: `You don't trade. Keel's deal closes on schedule, and anyone who bought at $28.60 makes 5%. Waiting is right, until it becomes a habit.` }
          ],
          later: `Not playing is a position. Here one idea may really have been yours, and passing on it had a cost too.`,
          verdict: { who: 'theo', line: `Didn't trade. Good. Next time, notice when the one you've been waiting for walks in.` }
        },
        {
          key: 'D', text: `Buy Tessel at normal size. It fell 40% this morning, so it has to bounce.`, exposure: 'normal',
          q: 1, s: { jdg: -2, inf: -2 }, cap: { psy: -1 },
          outcomes: [
            { p: 0.6, tone: 'bad', fin: -3.5, text: `The auditor's letter comes out Friday. Tessel falls another 35%. You lose $3,500 on a company you hadn't heard of yesterday.` },
            { p: 0.4, tone: 'good', fin: 1.5, text: `Tessel bounces 15% by the close. You make $1,500 and can't explain why.` }
          ],
          later: `A falling price isn't a reason. It's a fact you don't understand yet.`,
          verdict: { who: 'nadia', line: `Bought a stock that was falling for reasons nobody knew. Nothing broke. That's the scary part.` }
        },
        {
          key: 'E', text: `Buy NOVA at normal size. Everyone's in it, and you don't want to miss out.`, exposure: 'normal',
          q: 1, s: { jdg: -1, reg: -1 }, cap: {},
          outcomes: [
            { p: 0.55, tone: 'bad', fin: -2, text: `NOVA misses earnings and drops 20%. The chat room goes silent. You lose $2,000.` },
            { p: 0.45, tone: 'good', fin: 2, text: `NOVA beats. You make $2,000 and feel like part of something.` }
          ],
          later: `Fear of missing out is an edge, for whoever is selling to you.`,
          verdict: { who: 'theo', line: `Bought the chat room's stock so they wouldn't miss it. The chat room never misses anything.` }
        }
      ],
      analysis: {
        game: `Not a game against one opponent but a stream of offers. Most are bets someone else wants you to take. The skill is in declining.`,
        incentives: `The chat room benefits from more buyers. A falling stock attracts people who confuse cheap with valuable. Only your own method gives you a reason to expect to win.`,
        leverage: `You can wait as long as you like. Every idea has to earn your money. You never have to spend it.`,
        missing: `Why Tessel fell. What NOVA will report. Only for one idea did you know more than the crowd.`,
        assumptions: `That a busy day is a productive one. That missing a winner is the same as losing.`,
        controlled: `Which games to enter.`,
        couldnt: `Which ideas happened to work today.`,
        concept: { thinker: 'seykota', name: `Trade your own edge`, body: `The traders in Market Wizards use methods that look nothing alike. What they share is that each one plays only the game they're built for. Copying a method doesn't copy the edge.` },
        second: { thinker: 'schelling', name: `Choosing not to play`, body: `Schelling showed that declining to engage is a move, and often a strong one. The trader who can say no to everything gets to choose the few things worth a yes.` },
        better: `B. If no idea fits your edge, C. Activity isn't the same as productivity.`,
        lesson: `Ten mediocre decisions can cost more than one good decision earns.`
      },
      life: { title: `The full calendar`, text: `Four invitations arrive in one week: a side project, a board seat, a speaking slot and a friend's startup. Saying yes to all of them feels like momentum. Only one of them uses what you're actually good at.` }
    },

    // ───────────────────────────────────────── 4
    {
      id: 'changing-market',
      facts: [
        `Your method for two years: buy strong stocks right after a short price drop (a dip). A normal trade is about $10,000.`,
        `It has lost money six weeks in a row. Interest rates rose sharply last autumn.`,
        `Overnight a bank failed. The market is expected to open about 3% lower.`,
        `Your account is 11% below its peak. At 15%, Nadia, who runs risk for the desk, halves how much you can trade.`,
        `The market opens this morning.`
      ],
      tests: `Can you abandon your assumptions?`,
      level: `Regime change`,
      title: `The Changing Market`,
      lens: ['nash', 'duke'],
      setting: `The desk · January · Six losing weeks`,
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Halves your limits at a 15% drawdown.` },
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `In since 5 am. Reading, not trading.` }
      ],
      known: [`For two years one method made your money: buy strong stocks when they dip.`, `It has lost money for six weeks running.`, `Interest rates rose sharply in the autumn.`, `A bank failed overnight. Everything is falling.`],
      unknown: [`Whether this is a drawdown or the end of the method.`, `How far the bank news spreads.`, `What works now.`],
      clues: [
        { label: `Your trade log`, text: `Your dips used to recover within four days. Since October they've kept falling for three weeks on average. The same signal now means something else.` },
        { label: `The rate chart`, text: `Both of your good years happened with interest rates near zero. Cheap money is what kept buying the dips.` },
        { label: `Theo's desk`, text: `Theo has been in since 5 am. He hasn't placed a trade. He's reading.` }
      ],
      edgeNote: {
        research: `Your edge travels better than most. Companies you know deeply are still worth knowing in a new rate world. Narrow to them while you relearn the rest.`,
        speed: `Reading price is the edge most exposed to a regime change. The patterns you trusted were partly made by cheap money. Test them again, small.`,
        patience: `A patient trader's edge is waiting, and this is when it pays. The rare, obvious setups usually come after the panic, not during it.`
      },
      question: `Your method stopped working. Does the method change, or do you?`,
      options: [
        {
          key: 'A', text: `Stay the course: keep buying the dips. Two good years don't disappear in six weeks.`, exposure: 'normal',
          q: 1, s: { jdg: -2, inf: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: 0.6, tone: 'bad', fin: -4, text: `You buy the dip at the open. It keeps dipping. Three more weeks cost you $4,000, and you're one bad day from Nadia's line.` },
            { p: 0.4, tone: 'good', fin: 4, text: `The bank scare fades within a week, and your dips bounce again for a while. Up $4,000, and none the wiser.` }
          ],
          later: `A strategy is a hypothesis. You kept defending it after the evidence turned.`,
          verdict: { who: 'nadia', line: `Kept buying dips in a market that had changed. I had to call them twice.` }
        },
        {
          key: 'B', text: `Double your trade sizes to win back the six weeks of losses.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, bnd: -2 }, cap: { psy: -2, soc: -1 },
          outcomes: [
            { p: 0.65, tone: 'bad', fin: -22, text: `The bank news spreads to two more lenders. Your doubled positions fall together. You lose $22,000 in four days, and the desk cuts your limits.` },
            { p: 0.35, tone: 'good', fin: 9, text: `The panic passes quickly and your doubled size catches the bounce. Up $9,000. It worked, which makes the next time more dangerous.` }
          ],
          later: `Revenge sizing turns a drawdown into a crisis. It's the losing position again, wearing a bigger coat.`,
          verdict: { who: 'nadia', line: `Doubled up to get even. That's when I stop watching the numbers and start watching the person.` }
        },
        {
          key: 'C', text: `Halve your trade sizes and test whether the method still works, with small trades you write down.`, exposure: 'small',
          q: 4, s: { jdg: 2, inf: 2, reg: 2, lng: 1 }, cap: { str: 2, psy: 1 },
          outcomes: [
            { p: 0.6, tone: 'mixed', fin: -2, text: `Your small test trades confirm it: dips don't bounce the way they did. You lose $2,000 learning something worth far more.` },
            { p: 0.4, tone: 'good', fin: 3, text: `Your tests show dips in the strongest few stocks still work. You narrow the method and make $3,000 with less risk.` }
          ],
          later: `You treated the method like a hypothesis and paid a small price to test it.`,
          verdict: { who: 'theo', line: `Cut size and started measuring again. From the outside, adapting looks boring. Good.` }
        },
        {
          key: 'D', text: `Switch to what's working now: bet that bank shares will fall (short them), like everyone else.`, exposure: 'normal',
          q: 1, s: { jdg: -1, inf: -1, reg: -1 }, cap: { str: -1 },
          outcomes: [
            { p: 0.55, tone: 'bad', fin: -6, text: `You bet against three banks the day the government steps in. They jump 20%. You lose $6,000 with a method you'd never used.` },
            { p: 0.45, tone: 'good', fin: 4, text: `Banks keep falling for a week. You make $4,000, with no idea when to get out.` }
          ],
          later: `Copying a strategy doesn't copy the edge. You left your own game for someone else's, at the worst moment.`,
          verdict: { who: 'theo', line: `Jumped to the hot trade with no map. I've seen people make money that way. Once.` }
        },
        {
          key: 'E', text: `Stop trading for a month. Study what changed before you risk anything.`, exposure: 'none',
          q: 3, s: { jdg: 1, reg: 2, inf: 2 }, cap: { str: 2, time: -2 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: 0, text: `You sit out the bank scare entirely. A month later you come back with a narrower method and a clearer head.` },
            { p: 0.4, tone: 'mixed', fin: 0, text: `You sit out the scare, and the sharp recovery after it. You come back wiser, and a month behind.` }
          ],
          later: `Stepping away protected your money and spent your time. Both are capital.`,
          verdict: { who: 'nadia', line: `Stood down for a month and came back with notes. Best thing I saw all quarter.` }
        }
      ],
      analysis: {
        game: `Your method was a best response to a market that no longer exists. When conditions change, a winning strategy can become a losing one without you doing anything differently.`,
        incentives: `You want the method to keep working, because it's part of how you see yourself. The market has no stake in your identity.`,
        leverage: `Your ability to shrink. Small positions buy time to find out what changed.`,
        missing: `Whether the old conditions come back. Nobody knew. The answer to not knowing is a smaller bet, not a bigger one.`,
        assumptions: `That six weeks is a blip because two years were good. That a bank failure was impossible because it hadn't happened yet.`,
        controlled: `Your size, and whether you kept measuring.`,
        couldnt: `Rates, the bank, the panic.`,
        concept: { thinker: 'nash', name: `A best response to a game that changed`, body: `Nash's equilibrium says a strategy is only good relative to the conditions it meets. Change the conditions and the best response changes. A strategy is a hypothesis, not an identity.` },
        second: { thinker: 'duke', name: `Beliefs are bets`, body: `Duke asks you to hold beliefs with a level of confidence, and to update it. "This method works" was a 90% belief two years ago. Six losing weeks in a new rate world should have moved that number.` },
        better: `C, or E if you can afford the time. Shrink, test, and let the evidence decide what you believe.`,
        lesson: `You don't have to predict the shock. You have to be small enough to survive it.`
      },
      life: { title: `The skill that built your career`, text: `For ten years one skill paid your bills. Now software does most of it. You can do it harder, jump to whatever's hot, or test what still works and retrain on purpose, before the market makes the choice for you.` }
    },

    // ───────────────────────────────────────── 5
    {
      id: 'final-bet',
      facts: [
        `Last trade of the year: Orda Systems (ORDA), the best setup you've seen in two years. It fits your edge, <strong>{edge}</strong>.`,
        `You'd be <strong>buying</strong>, so you make money if the price rises. If it works, it should rise about 30%. If it fails, it could fall 30%.`,
        `Your account: <strong>{account}</strong>, everything you've built this year. Your rule: {rule} risk on any one decision.`,
        `Nadia will allow leverage up to 4×: borrowed money that multiplies both gains and losses.`,
        `At 4×, a 30% fall wipes out the whole account.`
      ],
      tests: `Can you protect your ability to play again?`,
      level: `Survival`,
      title: `The Last Player Standing`,
      lens: ['aumann', 'seykota'],
      setting: `The desk · December · The last trade of the year`,
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Memory`, note: `Keeps a list of brilliant traders who aren't here anymore.` },
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Will approve the leverage. Won't recommend it.` }
      ],
      known: [`It's the best setup you've seen in two years, and it fits your edge.`, `Your account is everything you've built this year.`, `The desk will let you use leverage.`],
      unknown: [`Whether it works. Even a real edge loses often.`, `What January brings.`],
      clues: [
        { label: `Your trade log`, text: `Your best setups have worked about 60% of the time. Four in ten still lost.` },
        { label: `The fine print on leverage`, text: `At 4× leverage, a 30% drop wipes out the whole account. This kind of trade has done that twice in ten years.` },
        { label: `Theo's desk drawer`, text: `Theo keeps a list of traders he knew who were brilliant, until one trade. It's longer than you'd think.` }
      ],
      edgeNote: {
        research: `It's your kind of trade: a company you know cold, mispriced for reasons you understand. That's exactly when overconfidence is most persuasive.`,
        speed: `It's your kind of trade: the cleanest trend you've seen in two years. Clean trends still reverse four times in ten.`,
        patience: `This is the rare, obvious setup you wait all year for. Waiting earned you the right to play it, not the right to bet everything.`
      },
      question: `How much are you willing to risk to win?`,
      options: [
        {
          key: 'A', text: `Everything, plus borrowed money (leverage). This is the one.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, lng: -3, bnd: -2 }, cap: { psy: -2, soc: -2 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: 120, text: `It works. Your account more than doubles in six weeks. You're the best performer on the floor, and you'll spend years trying to feel this again.` },
            { p: 0.4, tone: 'bad', ruin: true, fin: -999, text: `A surprise announcement gaps the trade against you. With leverage, it's over by lunch. Your account is gone, and so is your seat.` }
          ],
          later: `Even a 60% edge loses four times in ten. Betting everything on one throw turned a good edge into a coin flip for your career.`,
          verdict: { who: 'nadia', line: `All in, with leverage, on a real edge. That's how good traders leave.` }
        },
        {
          key: 'B', text: `Put a quarter of your account into it, with no exit planned. Big enough to matter.`, exposure: 'large',
          q: 2, s: { jdg: -1, reg: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: 7.5, text: `It works. A $7,500 gain to close the year.` },
            { p: 0.4, tone: 'bad', fin: -7.5, text: `It fails, and with no exit planned you ride it all the way down. You lose $7,500 and spend January rebuilding.` }
          ],
          later: `Survivable, and painful. Sized for the story more than the odds.`,
          verdict: { who: 'theo', line: `A quarter of the account on one idea. Brave. I'd have slept worse than they did.` }
        },
        {
          key: 'C', text: `Your normal size, about $10,000, with the price where you'll sell written down before you buy.`, exposure: 'normal',
          q: 4, s: { jdg: 2, reg: 2, lng: 2, bnd: 1 }, cap: { psy: 1, soc: 1, str: 1 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: 3, text: `It works. You make $3,000 and close the year on your own terms.` },
            { p: 0.4, tone: 'mixed', fin: -1, text: `It fails. Your written exit takes you out for $1,000. You'll be here in January, with your edge intact.` }
          ],
          later: `You sized a real edge so that losing would cost a little and winning would still matter. That's the whole game.`,
          verdict: { who: 'theo', line: `Normal size, exit written down, on the best setup of the year. That's the trader who's still here in ten years.` }
        },
        {
          key: 'D', text: `Start with half your normal size, and buy more only as the price moves your way.`, exposure: 'small',
          q: 4, s: { jdg: 2, reg: 1, lng: 2, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: 0.6, tone: 'good', fin: 3, text: `It works, and you buy more twice as it does. Up $3,000, most of it on money the trade earned for you.` },
            { p: 0.4, tone: 'mixed', fin: -0.5, text: `It fails early, while you're still small. A $500 loss.` }
          ],
          later: `Letting the market confirm you before you commit more is how winners run and losers stay small.`,
          verdict: { who: 'nadia', line: `Scaled in as it proved itself. I barely had to look at that account.` }
        },
        {
          key: 'E', text: `Nothing. Protect what you have. The year is done.`, exposure: 'none',
          q: 2, s: { jdg: 0, reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: 0.6, tone: 'mixed', fin: 0, text: `The setup works. You watch it from the sidelines. Safe, and smaller than you could have been.` },
            { p: 0.4, tone: 'good', fin: 0, text: `The setup fails. You feel clever, briefly. But it was a real edge, and refusing every risk is its own slow way of losing.` }
          ],
          later: `Preservation matters. So does using your edge when it's real. Never playing isn't surviving. It's leaving slowly.`,
          verdict: { who: 'theo', line: `Sat out the best setup of the year. Safe. Not quite the point.` }
        }
      ],
      analysis: {
        game: `The last round of a game that never really ends. A single bet can't be repeated, but a career is nothing but repetition.`,
        incentives: `The leaderboard rewards whoever finishes highest this year. Your life rewards whoever is still playing in ten.`,
        leverage: `Time. A real edge played at a survivable size compounds every year you stay.`,
        missing: `The outcome. It always is. That's why size, not certainty, decides your fate.`,
        assumptions: `That a real edge means a sure thing. That being ahead of everyone is the goal.`,
        controlled: `How much of yourself to put on the table.`,
        couldnt: `The announcement, the gap, the four in ten.`,
        concept: { thinker: 'aumann', name: `Repeated games`, body: `Aumann won a Nobel Prize for showing how behavior changes when a game repeats. A move that's rational once can be ruinous when you'll play again and again. A career is a repeated game.` },
        second: { thinker: 'seykota', name: `Stay in the game`, body: `Seykota's rules end where they begin: protect your capital. You can't use an edge you no longer have the money to play.` },
        better: `C or D. A real edge, sized so the bad four in ten never ends your game.`,
        lesson: `The objective was never to win every round. It was to become the kind of player who could keep playing.`
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
  const riskLabel = ctx => ctx.rules ? M.rules.risk.options.find(o => o.v === ctx.rules.risk).label : `Normal`;

  const SCREENS = {
    'losing-position': {
      center: () => {
        const b = [36, 182, 640, 536], closes = path(54, [[0, 52], [0.4, 58.5], [0.52, 58], [1, 41.62]], 4), Y = scaler(b, 39, 60);
        return header('HLX', 'Halcyon Logistics', '41.62', '−3.8% today', C.red) + frame(b) + candles(b, closes, Y, 9) +
          dash(b, Y(52), C.dim, 'YOU BOUGHT AT 52.00') + dash(b, Y(47.8), C.amber, 'YOUR LINE 47.80') +
          panel(668, 182, 300, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['880 shares', { size: 28, sans: true, weight: 600 }], ['Bought at $52.00', { size: 18, fill: C.dim, gap: 30 }], ['Now $41.62', { size: 18, gap: 54 }], ['−$9,140', { size: 46, fill: C.red, sans: true, weight: 600, gap: 40 }], ['Open loss −20%', { size: 18, fill: C.red }]], '#3c2220');
      },
      right: () => feed('NEWS · HALCYON', [['20:41', `Halcyon's biggest customer may cancel contract`, C.amber], ['20:12', 'Freight volumes fall for a fourth month'], ['19:30', 'Analyst lowers Halcyon price target'], ['16:01', 'Close: transport stocks lead the decline'], ['14:22', 'Halcyon CFO to speak at conference Tuesday', C.dim]])
    },
    'winning-streak': {
      center: () => {
        const b = [36, 182, 600, 536], closes = path(46, [[0, 16.6], [0.5, 19.2], [1, 18.4]], 12, 0.35), Y = scaler(b, 14, 22);
        return header('VLM', 'Vellum Bio', '18.40', '+0.6% today', C.teal) + frame(b) + candles(b, closes, Y, 5) +
          `<line x1="620" y1="182" x2="620" y2="536" stroke="${C.amber}" stroke-width="2" stroke-dasharray="8 6"/>` + T(620, 176, 'FDA 7:00 AM', { size: 16, fill: C.amber, anchor: 'middle' }) +
          `<path d="M604 ${Y(18.4)} L640 ${b[1] + 14}" stroke="${C.teal}" stroke-width="2" stroke-dasharray="6 6" fill="none"/><path d="M604 ${Y(18.4)} L640 ${b[3] - 14}" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 6" fill="none"/>` +
          T(646, b[1] + 20, '+50%?', { size: 16, fill: C.teal }) + T(646, b[3] - 8, '−50%?', { size: 16, fill: C.red }) +
          panel(716, 182, 252, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['No Vellum', { size: 26, sans: true, weight: 600, gap: 54 }], ['TIP FROM MARCO', { size: 17, fill: C.amber }], ['Buy before 7 am', { size: 22, sans: true, gap: 54 }], ['NORMAL TRADE', { size: 17, fill: C.dim }], ['≈ $10,000', { size: 22, sans: true }]]);
      },
      right: () => feed('RECENT TRADES · SEVEN WINS IN A ROW', [['APR 02', 'ARDN  +$1,840', C.teal], ['APR 05', 'GRNT  +$1,210', C.teal], ['APR 09', 'LUMA  +$2,460', C.teal], ['APR 11', 'CELT  +$980', C.teal], ['APR 16', 'FOXR  +$3,120', C.teal], ['APR 19', 'JUNO  +$2,740', C.teal]]) + T(36, 560 - 24, 'Trade size vs January: 2×   ·   3 trades open, all up', { size: 20, fill: C.amber })
    },
    'empty-hand': {
      center: () => {
        const tile = (x, y, sym, line1, vals, col, extra = '', note = '') => {
          const b = [x + 16, y + 74, x + 448, y + 196], lo = Math.min(...vals), hi = Math.max(...vals), Y = scaler(b, lo - (hi - lo) * 0.15, hi + (hi - lo) * 0.15);
          return `<rect x="${x}" y="${y}" width="464" height="232" rx="10" fill="${C.panel}" stroke="${C.grid}" stroke-width="2"/>${T(x + 18, y + 40, sym, { size: 28, sans: true, weight: 600 })}${T(x + 110, y + 38, line1, { size: 18, fill: col })}${poly(b, vals, Y, col)}${extra ? extra(b, Y) : ''}${T(x + 18, y + 220, note, { size: 16, fill: C.dim })}`;
        };
        return T(36, 92, `FOUR IDEAS · YOU OWN NOTHING`, { size: 20, fill: C.dim }) +
          tile(24, 104, 'NOVA', 'Earnings report tomorrow', path(30, [[0, 40], [1, 62]], 3, 1.2), C.teal, null, 'Trading chat: everyone is buying') +
          tile(512, 104, 'KEEL', '$28.60 · being bought at $30', path(30, [[0, 21], [0.35, 21.5], [0.4, 28.4], [1, 28.6]], 8, 0.15), C.ink, (b, Y) => dash(b, Y(30), C.amber, '$30 when the deal closes'), 'Deal expected to close in two months') +
          tile(24, 330, 'ARDN', 'Highest price in two years', path(30, [[0, 30], [0.5, 33], [0.85, 33.5], [1, 37]], 5, 0.5), C.teal, (b, Y) => dash(b, Y(34), C.dim, 'old high', 'end'), 'Unusually heavy trading today') +
          tile(512, 330, 'TSL', '−40% today', path(30, [[0, 50], [0.8, 51], [0.86, 30], [1, 30.5]], 6, 0.6), C.red, null, 'Its auditor quit. Nobody knows why.');
      },
      right: () => feed('TRADING CHAT', [['09:41', '“NOVA is going to crush earnings”'], ['09:44', '“Loaded up on NOVA this morning”'], ['09:52', '“If you are not in NOVA, what are you doing”'], ['10:05', '“TSL at -40% has to bounce, right?”'], ['10:11', '“Bought more NOVA”', C.dim]])
    },
    'changing-market': {
      center: () => {
        const b = [36, 150, 964, 500], vals = path(60, [[0, 100], [0.86, 128], [1, 114]], 21, 1.1), Y = scaler(b, 98, 132);
        return T(36, 112, 'YOUR METHOD · BUY STRONG STOCKS ON A DIP', { size: 22, fill: C.dim }) + frame(b, 8, 4) + poly(b, vals, Y, C.teal) +
          dash(b, Y(128), C.dim, 'PEAK', 'end') + dash(b, Y(114), C.amber, '−11% FROM PEAK · NOW', 'end') + dash(b, Y(108.8), C.red, '−15% · NADIA HALVES YOUR LIMITS', 'end') +
          T(36, 530, '2 years ago', { size: 16, fill: C.dim }) + T(36 + (b[2] - b[0]) * 0.86, 530, '6 weeks ago', { size: 16, fill: C.dim, anchor: 'middle' }) + T(964, 530, 'today', { size: 16, fill: C.dim, anchor: 'end' });
      },
      right: () => feed('NEWS · 06:15', [['06:02', 'Regional bank fails overnight', C.amber], ['06:10', 'Market set to open about 3% lower', C.red], ['05:40', 'Rates: highest in fourteen years'], ['6 wks', 'Buying dips has lost money every week', C.dim]])
    },
    'final-bet': {
      center: ctx => {
        const b = [36, 182, 620, 536], closes = path(50, [[0, 60], [0.6, 74], [0.75, 71], [1, 80]], 33, 0.6), Y = scaler(b, 52, 108);
        return header('ORDA', 'Orda Systems', '80.00', 'the best setup in two years', C.amber) + frame(b) + candles(b, closes, Y, 2) +
          `<path d="M608 ${Y(80)} L640 ${Y(104)}" stroke="${C.teal}" stroke-width="2" stroke-dasharray="6 6" fill="none"/><path d="M608 ${Y(80)} L640 ${Y(56)}" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 6" fill="none"/>` +
          T(646, Y(104) + 6, '+30%', { size: 16, fill: C.teal }) + T(646, Y(56) + 6, '−30%', { size: 16, fill: C.red }) +
          panel(716, 182, 252, 354, [['YOUR ACCOUNT', { size: 17, fill: C.dim }], [ctx.account != null ? `$${ctx.account}k` : '—', { size: 40, sans: true, weight: 600, gap: 60 }], ['NORMAL TRADE', { size: 17, fill: C.dim }], ['≈ $10,000', { size: 22, sans: true, gap: 54 }], ['LEVERAGE', { size: 17, fill: C.amber }], ['up to 4×', { size: 22, sans: true }]]);
      },
      right: ctx => feed('RISK DESK · NADIA', [['Limit', 'Leverage approved up to 4×'], ['Means', 'Borrowed money: gains and losses × 4'], ['Danger', 'At 4×, a 30% fall wipes out the account', C.red], ['Rule', `Yours: ${riskLabel(ctx)} risk on any one decision`, C.amber]])
    }
  };

  // ───────────────────────────────────────── Staging
  // One desk for all five. The player is the trader, seen over the shoulder.
  const alert = t => ({ screen: t });
  M.scenes = {
    'losing-position': {
      env: 'trading',
      screens: SCREENS['losing-position'],
      cast: [{ id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `Nothing from you. He's watched this night happen to a lot of people.` }],
      intro: [
        { cam: 'wide', caption: `8:47 pm. The trading floor is nearly empty.` },
        { cam: 'screens', caption: `On the center screen: the Halcyon shares you bought at $52. They're at $41.62.` },
        { cam: 'note', caption: `Beside the keyboard, in your handwriting: "Original thesis: strong fundamentals. Temporary market weakness."` },
        { cam: 'screens', ...alert(`20:41 · Halcyon's largest customer said to review contract`), caption: `The news isn't about the market anymore. It's about Halcyon.` },
        { cam: 'sticky', caption: `On the edge of the screen, your own rule: max loss 8% per trade. For HLX, that meant selling below $47.80.` },
        { cam: 'wide', caption: `Theo, thirty-one years on this desk, is packing up to go home.` },
        { who: 'theo', mood: 'neutral', say: `Long night?` },
        { you: `(It'll come back. It always comes back.)` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `Nobody's watching, you know. It's just you and the number.` },
        { cam: 'screens', ...alert(`You can exit now. You can hold. Or you can double your position.`), caption: `Regular trading reopens at 9:30 tomorrow. Tonight, you can still sell.` }
      ],
      options: {
        A: { line: `(Sell. All of it.)`, preview: `Ends the damage. Admits you were wrong.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SOLD 880 HLX @ 41.62 · Loss −9,140`) }, { who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'wide', caption: `6:30 am: the customer is leaving. HLX opens at $33.` }] },
            { beats: [{ cam: 'screens', ...alert(`SOLD 880 HLX @ 41.62 · Loss −9,140`) }, { who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'wide', caption: `A week later the customer renews. HLX bounces to $46. You were wrong about the outcome and right about the decision.` }] }
          ] },
        B: { line: `(Hold. The fundamentals haven't changed that much.)`, preview: `Keeps the hope. Keeps the risk.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'skeptical', act: 'shake' }, { cam: 'screens', ...alert(`PRE-MARKET · HLX 33.10 · −20.5%`), caption: `The customer leaves. HLX opens at $33.` }] },
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`HLX 46.02 · customer renews contract`), caption: `It comes back. This time.` }] }
          ] },
        C: { line: `(Buy 880 more. At this price it's a bargain.)`, preview: `Doubles the bet on a thesis that's breaking.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`BOUGHT 880 HLX @ 41.60 · Position 1,760 sh`) }, { who: 'theo', mood: 'surprised', act: 'glance' }, { cam: 'screens', ...alert(`HLX 30.04 · Loss −29,600`), caption: `The customer leaves. By Friday you've lost almost a third of your account.` }] },
            { beats: [{ cam: 'screens', ...alert(`BOUGHT 880 HLX @ 41.60 · Position 1,760 sh`) }, { who: 'theo', mood: 'skeptical' }, { cam: 'screens', ...alert(`HLX 46.02 · customer renews contract`), caption: `It works, and you'll remember that it worked.` }] }
          ] },
        D: { line: `(Sell half. Put a hard stop under the rest.)`, preview: `Cuts the risk. Keeps a foot in.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SOLD 440 HLX @ 41.62 · STOP 40.50 set`) }, { cam: 'screens', ...alert(`HLX opens 33.10 · STOP filled @ 33.10`), caption: `The stock gaps below your stop. Stops don't protect you from gaps.` }] },
            { beats: [{ cam: 'screens', ...alert(`SOLD 440 HLX @ 41.62 · STOP 40.50 set`) }, { who: 'theo', mood: 'neutral', act: 'nod' }, { cam: 'wide', caption: `The customer renews. The half you kept recovers.` }] }
          ] },
        E: { line: `(Not tonight. I'll decide in the morning.)`, preview: `Rest for you. Not for the position.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`PRE-MARKET · HLX 33.10 · −20.5%`), caption: `6:30 am. The decision you postponed got more expensive overnight.` }] },
            { beats: [{ cam: 'wide', caption: `Nothing changes overnight. You sell at the open. Same loss, worse sleep.` }] }
          ] }
      },
      links: []
    },

    'winning-streak': {
      env: 'trading',
      screens: SCREENS['winning-streak'],
      cast: [{ id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `For you to still be trading next year.` }],
      intro: [
        { cam: 'wide', caption: `April. Seven winning trades in a row. The desk feels different when you're right.` },
        { cam: 'wide', caption: `Nadia runs risk for the desk. She sets how much each trader may bet.` },
        { who: 'nadia', mood: 'smile', say: `Good month.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Your limits are fine. Your sizes have doubled since January. Just so you know that I know.` },
        { cam: 'screens', ...alert(`Marco: Vellum Bio, FDA decision 7am. Hearing approval. Buy it.`) },
        { you: `(Marco's been wrong before. But I'm seeing things clearly right now.)` },
        { cam: 'screens', caption: `Tomorrow at 7 am, Vellum jumps about half or falls about half. Nobody knows which.` }
      ],
      options: {
        A: { line: `(Five times my usual size. This is my moment.)`, preview: `Sized for the feeling.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`VELLUM APPROVED · VLM +52%`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `You made $26,000 in eight minutes. Nadia makes a note.` }] },
            { beats: [{ cam: 'screens', ...alert(`VELLUM REJECTED · VLM −48%`) }, { who: 'nadia', mood: 'awkward', pose: 'tablet', caption: `Seven wins, gone in one.` }] }
          ] },
        B: { line: `(Normal size. I've earned the benefit of the doubt.)`, preview: `Survivable. But where's the edge?`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`VELLUM APPROVED · VLM +52%`), caption: `A solid gain on a coin flip.` }] },
            { beats: [{ cam: 'screens', ...alert(`VELLUM REJECTED · VLM −48%`), caption: `A survivable loss on a coin flip.` }] }
          ] },
        C: { line: `(Pass. That's a coin flip, not an edge.)`, preview: `No trade. No story.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`VELLUM APPROVED · VLM +52%`) }, { cam: 'screens', ...alert(`Marco: 🚀`), caption: `You made nothing, and you made the right call.` }] },
            { beats: [{ cam: 'screens', ...alert(`VELLUM REJECTED · VLM −48%`), caption: `Marco goes quiet. Your account doesn't notice.` }] }
          ] },
        D: { line: `Nadia, you're right. I'm cutting my size back to January levels.`, preview: `Fixes the thing the streak changed.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'surprised' }, { who: 'nadia', mood: 'smile', act: 'nod', say: `That's the most profitable thing you've said all month.` }, { cam: 'screens', ...alert(`VELLUM APPROVED · VLM +52%`), caption: `You weren't in it. Two weeks later the market turns, gently, for you.` }] },
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod', say: `That's the most profitable thing you've said all month.` }, { cam: 'screens', ...alert(`VELLUM REJECTED · VLM −48%`), caption: `Two weeks later the market turns. Your smaller sizes barely feel it.` }] }
          ] },
        E: { line: `(Close everything. Lock in the year.)`, preview: `Safe. And out.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'thinking', pose: 'tablet' }, { cam: 'screens', caption: `Your winners keep running for another month, without you.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral' }, { cam: 'screens', caption: `A week later the market drops 6%. It looks like genius. It was a mood.` }] }
          ] }
      },
      links: []
    },

    'empty-hand': {
      env: 'trading',
      screens: SCREENS['empty-hand'],
      cast: [{ id: 'theo', spot: 'theo', mood: 'neutral', pose: 'mug', wants: `To trade only when the trade is obvious.` }],
      intro: [
        { cam: 'wide', caption: `A slow Thursday. Four ideas cross your desk before lunch.` },
        { cam: 'screens', ...alert(`Trading chat: everyone loading up on NOVA before earnings`) },
        { cam: 'screens', ...alert(`Keel Foods: being bought for $30 a share · trades at $28.60`) },
        { cam: 'screens', ...alert(`Arden Energy: breaks two-year high on heavy volume`) },
        { cam: 'screens', ...alert(`Tessel −40% · its auditor quits`) },
        { who: 'theo', mood: 'smile', pose: 'mug', say: `Busy morning?` },
        { you: `(Four ideas. It feels wrong to do nothing.)` },
        { cam: 'wide', caption: `Theo hasn't placed a trade in nine days. He's having his best year in a decade.` }
      ],
      options: {
        A: { line: `(All four. More shots, more chances.)`, preview: `Busy. Is it good?`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`4 positions open · NOVA −20% · TSL −35% · ARDN reversal`) }, { who: 'theo', mood: 'neutral', act: 'sigh', caption: `A busy day. An expensive one.` }] },
            { beats: [{ cam: 'screens', ...alert(`4 positions · 2 up, 2 down · net −2,000`) }, { who: 'theo', mood: 'neutral', caption: `Two work, two don't. You're tired and slightly poorer.` }] }
          ] },
        B: { line: `(Just the one that fits how I trade. Normal size.)`, preview: `One trade, the one you understand.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `Three weeks later, your one trade has done what your trades are supposed to do.` }] },
            { beats: [{ who: 'theo', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`AUTO-SELL HIT · −1,000`), caption: `A good trade that didn't work. You'd take it again.` }] }
          ] },
        C: { line: `(Nothing today.)`, preview: `Patience, at the cost of maybe missing yours.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', pose: 'mug', act: 'nod' }, { cam: 'screens', ...alert(`NOVA −20% · TSL −35%`), caption: `A quiet, profitable day of doing nothing.` }] },
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'mug' }, { cam: 'screens', ...alert(`Keel merger closes · spread +5%`), caption: `Keel's deal closes. Waiting is right, until it becomes a habit.` }] }
          ] },
        D: { line: `(Tessel. Down 40%, it has to bounce.)`, preview: `Cheap isn't the same as good.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Tessel: auditor letter released · TSL −35%`) }, { who: 'theo', mood: 'skeptical', act: 'shake' }] },
            { beats: [{ cam: 'screens', ...alert(`TSL +15% into the close`), caption: `It bounced. You can't explain why.` }] }
          ] },
        E: { line: `(A little NOVA. Everyone's in it.)`, preview: `Small. Borrowed conviction.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`NOVA misses · −20%`), caption: `The chat room goes quiet.` }] },
            { beats: [{ cam: 'screens', ...alert(`NOVA beats · +20%`), caption: `You feel like part of something.` }] }
          ] }
      },
      links: []
    },

    'changing-market': {
      env: 'trading',
      screens: SCREENS['changing-market'],
      cast: [
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `To keep you inside the wall.` },
        { id: 'theo', spot: 'theo', mood: 'thinking', pose: 'thinking', wants: `To understand what changed before he risks anything.` }
      ],
      intro: [
        { cam: 'wide', caption: `January. For two years one method made your money: buy strong stocks when they dip.` },
        { cam: 'screens', caption: `For six weeks, it has lost.` },
        { cam: 'screens', ...alert(`06:02 · Regional bank fails · market set to open 3% lower`), caption: `Overnight, something nobody had in their forecast: a bank failed.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `You're eleven percent below your peak. At fifteen, I halve how much you can trade.` },
        { who: 'nadia', mood: 'thinking', say: `I'm not telling you what to do. I'm telling you where the wall is.` },
        { you: `(Every dip I've bought for two years has come back.)` },
        { who: 'theo', mood: 'thinking', pose: 'thinking', caption: `Theo has been in since five. He isn't trading. He's reading.` }
      ],
      options: {
        A: { line: `(Stay the course. It's a drawdown, not a verdict.)`, preview: `Loyal to the method. Is the method loyal to you?`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`3 weeks · dips keep dipping · −4,000`) }, { who: 'nadia', mood: 'skeptical', pose: 'tablet' }] },
            { beats: [{ cam: 'screens', ...alert(`Bank scare fades · dips bounce`), caption: `It works for a while. You learn nothing.` }] }
          ] },
        B: { line: `(Double my size. Win it back.)`, preview: `Revenge, with a spreadsheet.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Two more banks under pressure · market −4.4%`) }, { who: 'nadia', mood: 'frustrated', pose: 'crossed', say: `I'm cutting your limits. Today.` }] },
            { beats: [{ cam: 'screens', ...alert(`Panic passes · +9,000`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `It worked. That makes next time more dangerous.` }] }
          ] },
        C: { line: `I'm cutting size in half and testing whether this still works. Small trades, all written down.`, preview: `Treat the method as a hypothesis.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `The small tests say it plainly: the dips don't bounce like they used to.` }] },
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `Dips in the strongest few stocks still work. You narrow the method.` }] }
          ] },
        D: { line: `(Everyone's shorting banks. I'll do that.)`, preview: `Someone else's edge.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Government backstops lenders · banks +20%`) }, { who: 'theo', mood: 'neutral', act: 'shake' }] },
            { beats: [{ cam: 'screens', ...alert(`Banks −12% on the week`), caption: `It works, and you have no idea when to get out.` }] }
          ] },
        E: { line: `I'm standing down for a month. I want to understand what changed.`, preview: `Spends time to save capital.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'surprised' }, { who: 'theo', mood: 'smile', act: 'nod', caption: `You sit out the panic and come back with notes.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', caption: `You miss the panic, and the recovery. Wiser, and a month behind.` }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    },

    'final-bet': {
      env: 'trading',
      screens: SCREENS['final-bet'],
      cast: [
        { id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `To see you here next December.` },
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `To approve only what you can survive.` }
      ],
      intro: [
        { cam: 'window', caption: `December. A year of decisions at this desk. You've won some and lost some.` },
        { cam: 'screens', caption: `Tonight: the best setup you've seen in two years. It fits your edge. It's real.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Your limits allow leverage on this. I want you to know that's not the same as a recommendation.` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `I keep a list of traders who were brilliant until one afternoon. It's longer than you'd think.` },
        { you: `(One trade could put me ahead of everyone on this floor.)` },
        { cam: 'screens', ...alert(`How much are you willing to risk to win?`) }
      ],
      options: {
        A: { line: `Everything. With leverage.`, preview: `Ahead of everyone, or gone.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'awkward', pose: 'tablet' }, { cam: 'screens', ...alert(`+120,000 · best on the floor`), caption: `It works. You'll spend years trying to feel this again.` }] },
            { beats: [{ who: 'nadia', mood: 'surprised' }, { cam: 'screens', ...alert(`MARGIN CALL · ACCOUNT LIQUIDATED`) }, { who: 'theo', mood: 'neutral', act: 'sigh', caption: `It's over by lunch.` }] }
          ] },
        B: { line: `A quarter of the account.`, preview: `Big enough to matter. Big enough to hurt.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`+7,500`), caption: `It works.` }] },
            { beats: [{ cam: 'screens', ...alert(`−7,500`), caption: `It fails. January will be about rebuilding.` }] }
          ] },
        C: { line: `My normal size. The exit's written down before I enter.`, preview: `A real edge, sized to survive.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`+3,000`), caption: `You close the year on your own terms.` }] },
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · −1,000`), caption: `It fails, and you'll be here in January.` }] }
          ] },
        D: { line: `Small to start. I'll add only if it proves me right.`, preview: `Let the market confirm you first.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`Bought more twice · +3,000`), caption: `The winner ran. You let it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`−500 · position closed`), caption: `It failed while you were still small.` }] }
          ] },
        E: { line: `(Nothing. The year is done.)`, preview: `Safe. Is safe the same as surviving?`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', caption: `It works, without you.` }] },
            { beats: [{ cam: 'screens', caption: `It fails. You feel clever, briefly.` }] }
          ] }
      },
      links: [['nadia', 'theo', 'trusts']]
    }
  };

  // What the desk says about you plugs into the same system as the main game.
  M.scenarios.forEach(s => {
    PP.insight.scenes[s.id] = { options: Object.fromEntries(s.options.map(o => [o.key, { buys: [], verdict: o.verdict }])) };
  });

  PP.market = M;
})();
