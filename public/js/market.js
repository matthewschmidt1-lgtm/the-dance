// The Trader's Mind: a section inspired by Jack Schwager's Market Wizards.
// Not a game about trading. A game about managing yourself where nobody controls the outcome.
// Five challenges share one desk, one account and five kinds of capital. Lose half the
// account and the desk pulls your capital: the section ends, and that is the lesson.
//
// Every company, person and price here is fictional. Each challenge rolls its world once
// (types[]: did the customer leave, was the drug approved), clues hint at which world you're
// in, and grades judge the decision against what you could know, never against the roll.
window.PP = window.PP || {};

(function () {
  const M = {};
  const when = id => c => (c.type === id ? 1 : 0);
  const saw = (c, i) => c.clues.includes(i);
  const edge = c => (c.rules && c.rules.edge) || 'research';

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

  // The code is never shown up front. It's revealed at the end, scored from what you did.
  M.principles = [
    { k: 'downside', name: `Protect your downside`, line: `Never risk so much that one decision ends your ability to play.`, scenes: ['losing-position', 'final-bet'] },
    { k: 'edge', name: `Find your edge`, line: `Don't play because you want to win. Play because you have a reason to believe you can.`, scenes: ['empty-hand', 'winning-streak'] },
    { k: 'evidence', name: `Follow the evidence`, line: `Don't confuse your predictions, beliefs or ego with reality.`, scenes: ['changing-market', 'losing-position'] },
    { k: 'self', name: `Master yourself`, line: `Your impulses are often a more dangerous opponent than the person across from you.`, scenes: ['winning-streak', 'empty-hand'] },
    { k: 'stay', name: `Stay in the game`, line: `Preserve the resources, relationships and opportunities that let you keep playing.`, scenes: ['final-bet', 'changing-market'] }
  ];

  M.scenarios = [
    // ───────────────────────────────────────── 1. A broken thesis, or noise?
    {
      id: 'losing-position',
      tests: `Can you accept being wrong?`,
      level: `Sunk cost`,
      title: `The Losing Position`,
      lens: ['seykota', 'duke'],
      setting: `The desk · 8:47 pm · Down $9,150`,
      types: [
        { id: 'broken', p: 0.6, who: `the news`, label: `The thesis was broken`, tell: `Halvorsen really was moving its workloads in-house. It had been hiring AI platform engineers for a month.` },
        { id: 'noise', p: 0.4, who: `the news`, label: `The news was noise`, tell: `Halvorsen denied the report the next morning. Its CEO had praised Corvane the week before.` }
      ],
      facts: [
        `You <strong>own</strong> 880 shares of Corvane Cloud. You bought in three steps: $56, $51 and $49. Average: <strong>$52.02</strong>.`,
        `That's about $46,000 at cost, nearly half your account. You make money only if the price rises.`,
        `It closed at $41.62: <strong>down $9,150</strong>. After hours it's quoted $38.90 to sell, $39.40 to buy, and few shares are trading.`,
        `Your written exit was $47.80, an 8% loss. You passed it nine days ago. Nadia's report flags it.`,
        `20:41 news: Corvane's biggest customer, Halvorsen Retail, may move its workloads to an in-house AI system.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader, 31 years on the desk`, archetype: `The Survivor`, power: `Experience`, note: `Has seen this exact night many times.` }
      ],
      known: [`You own 880 Corvane at an average of $52.02.`, `Your written exit was $47.80.`, `After hours, you can sell near $39.`],
      unknown: [`Whether Halvorsen is really leaving.`, `Where the stock opens tomorrow.`],
      clues: [
        { label: `Read your own note`, text: `"Thesis: retention is strong. The drop is market-wide, not Corvane." Tonight's headline is about Corvane's biggest customer. The thesis was about something that's no longer the problem.` },
        { label: `Read Nadia's risk report`, text: `"STOP BREACH 47.80 · 9 days · unacknowledged. Position size 46% of account. Added twice below entry." Seeing it in her words is worse.` },
        { label: `Look for anything that cuts the other way`, text: c => c.type === 'noise' ? `Last week, Halvorsen's CEO praised Corvane on an earnings call: "a partner for years to come." The report tonight cites one unnamed source.` : `Halvorsen has posted fourteen job listings for "in-house AI platform engineers" this month. The report cites three sources.` }
      ],
      question: `Are you managing your position, or your ego?`,
      options: [
        {
          key: 'A', text: `Sell all 880 shares now, after hours, at about $39. Take the $11,500 loss.`, exposure: 'none',
          q: 4, s: { jdg: 2, reg: 2, bnd: 1, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: when('broken'), tone: 'good', fin: -11.5, text: `Out at $39.00. At 6:30 am Halvorsen confirms the move, and Corvane opens at $33.10. Waiting would have cost another $5,200.` },
            { p: when('noise'), tone: 'mixed', fin: -11.5, text: `Out at $39.00. At 7 am Halvorsen denies the report, and Corvane opens at $44. It stings. You still sold a broken thesis at a loss you could afford.` }
          ],
          later: `Your account is smaller, and all of it is still yours to use tomorrow.`,
          verdict: { who: 'theo', line: `Took the loss without a speech. That's rarer than a good call.` }
        },
        {
          key: 'B', text: `Hold all 880. It's one unnamed report, and the company is still sound.`, exposure: 'all',
          q: c => saw(c, 2) ? (c.type === 'noise' ? 2 : 0) : 1, s: { jdg: -2, reg: -1, inf: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: when('broken'), tone: 'bad', fin: -19.5, text: `Halvorsen confirms. Corvane opens at $33.10 and slides to $29.90 by Friday, when you finally sell. The loss is $19,500.` },
            { p: when('noise'), tone: 'good', fin: -5.3, text: `Halvorsen denies it. Corvane climbs back to $46 over two weeks, and your loss shrinks to $5,300. It worked. It also taught you that waiting fixes things.` }
          ],
          later: `Hope isn't a risk limit. Whether or not it worked, you held a position your own rule told you to leave nine days ago.`,
          verdict: { who: 'theo', line: `Said it would come back. Some do. That's what makes the habit so expensive.` }
        },
        {
          key: 'C', text: `Buy 880 more at $39.40. It lowers your average to about $45.71.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, bnd: -2 }, cap: { psy: -2, soc: -1 },
          outcomes: [
            { p: when('broken'), tone: 'bad', fin: -27.8, text: `Halvorsen confirms. You sell all 1,760 shares at $29.90 on Friday. The loss is $27,800, more than a quarter of your account.` },
            { p: when('noise'), tone: 'good', fin: 0.5, text: `Halvorsen denies it and Corvane climbs to $46. You're back to even, up $500. It worked, and you'll remember that it worked.` }
          ],
          later: `You turned a mistake into a bigger bet on the same mistake. Averaging down feels like conviction. It's the ego, sizing up.`,
          verdict: { who: 'nadia', line: `Doubled a position that had blown through its stop nine days earlier. I flagged the account that night.` }
        },
        {
          key: 'D', text: `Sell 440 now at about $39. Sell the rest at the open if it's below $36.`, exposure: 'normal',
          q: 3, s: { jdg: 1, reg: 1, bnd: 1 }, cap: { psy: 1 },
          outcomes: [
            { p: when('broken'), tone: 'mixed', fin: -14.1, text: `Half out at $39. Corvane opens at $33.10, below your line, and the rest goes there. Total loss $14,100. A gap goes straight through any line you draw.` },
            { p: when('noise'), tone: 'good', fin: -8.4, text: `Half out at $39. Halvorsen denies it, and the half you kept recovers to $46. Total loss $8,400.` }
          ],
          later: `You cut the risk in half and set a line for the rest. Lines don't protect you from gaps. Only size does.`,
          verdict: { who: 'theo', line: `Cut it in half instead of all the way. Halfway honest. Still better than most.` }
        },
        {
          key: 'E', text: `Wait for the 9:30 open. Decide when there's real volume, not a thin after-hours quote.`, exposure: 'large',
          q: c => saw(c, 2) ? (c.type === 'noise' ? 3 : 1) : 2, s: { reg: 1, jdg: -1 }, cap: {},
          outcomes: [
            { p: when('broken'), tone: 'bad', fin: -16.7, text: `Halvorsen confirms at 6:30. Corvane opens at $33.10, and that's where you sell. The patient fill cost $5,200.` },
            { p: when('noise'), tone: 'good', fin: -7.1, text: `Halvorsen denies it at 7. Corvane opens at $44, and you sell into the bounce. Loss: $7,100.` }
          ],
          later: `Waiting for a fair price is sensible when the news is a rumor. When the news is real, the open is where the bill arrives.`,
          verdict: { who: 'nadia', line: `Left a broken position open overnight to get a better fill. Sometimes that works. It's still in the report.` }
        }
      ],
      analysis: {
        game: `A decision against an opponent with no feelings. The market doesn't know your entry price. The only question is whether you'd buy this position tonight, at this price, knowing what you know.`,
        incentives: `You want to be right. The account needs to survive. Tonight those point in opposite directions.`,
        leverage: `One real advantage: a rule you wrote before you had anything to defend, and broke nine days ago.`,
        missing: `Whether Halvorsen is really leaving. The third clue tilted it, but nobody knew for sure. That's why your size decided how bad it could get.`,
        assumptions: `That a lower price makes it a better deal. That a line on a chart protects you from a gap. That buying more on the way down was a plan.`,
        controlled: `Size, and whether you kept your own rule.`,
        couldnt: `Halvorsen, the gap, the open.`,
        concept: { thinker: 'seykota', name: `Cut your losses`, body: `Seykota's rules begin with the losing trade: get out when the reason you got in is gone, not when the pain becomes unbearable. The market doesn't know your position, and it won't help you get even.` },
        second: { thinker: 'duke', name: `Sunk cost`, body: `What you paid is history. Duke's test: if you didn't own this position, would you buy it right now? If not, holding it is buying it again, every minute.` },
        better: `A. Then write down why the thesis broke, so the next exit line is easier to obey.`,
        lesson: `Bruce Kovner's rule fits on a sticky note: know where you'll get out before you get in. Then get out there.`
      },
      life: { title: `The partnership`, text: `Two years ago you went into business with a friend. The reasons were good. The last three quarters say they aren't anymore. You can leave now at a cost you can absorb, keep going and hope, or put in more money to save it. Same decision. Same ego.` }
    },

    // ───────────────────────────────────────── 2. Sizing a coin flip after seven wins
    {
      id: 'winning-streak',
      tests: `Can you avoid overconfidence?`,
      level: `Overconfidence`,
      title: `The Winning Streak`,
      lens: ['duke', 'seykota'],
      setting: `The desk · April · Seven winners in a row`,
      types: [
        { id: 'approved', p: 0.62, who: `the FDA`, label: `The drug was approved`, tell: `The stock price had implied about a 62% chance. This time, the likelier outcome happened.` },
        { id: 'rejected', p: 0.38, who: `the FDA`, label: `The drug was rejected`, tell: `The stock price had implied about a 38% chance of this. Not likely, and nowhere near impossible.` }
      ],
      facts: [
        `You've won seven trades in a row. A normal trade for you was <strong>$10,000</strong> in January. It's <strong>$20,000</strong> now.`,
        `Marco's tip: <strong>buy</strong> Quorvia Bio before its FDA decision on its first AI-designed drug. The company announces this week.`,
        `On approval the stock should jump about 40%. On rejection it could fall about 65%.`,
        `At $18.40, the price already implies roughly a 62% chance of approval.`,
        `You also hold three other trades that are winning.`
      ],
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits, and compliance`, note: `Doesn't care whether you're right. Cares whether you'll still be here.` }
      ],
      known: [`Seven straight winning trades.`, `Your normal size has doubled since January.`, `Approval +40%, rejection −65%.`],
      unknown: [`The FDA's decision.`, `What Marco actually knows.`, `Whether your streak came from skill, the market, or luck.`],
      clues: [
        { label: `Your last seven trades`, text: `Five of the seven came in a market that rose almost every day. The two that didn't depend on that made the smallest gains.` },
        { label: `The options market`, text: `Options imply a move of about 48%, up or down. That tells you how big, not which way. The share price already prices in about a 62% chance of approval.` },
        { label: `Ask Marco where he heard it`, text: `"My contact at the lab running the trial says it's locked." If that's true, it's inside information, and you can't trade on it. If it isn't, it's just a rumor.` }
      ],
      question: `The streak is real. Is the edge?`,
      options: [
        {
          key: 'A', text: `Go big: buy $50,000 of Quorvia. You're seeing the market clearly right now.`, exposure: 'all',
          q: 0, s: { reg: -2, jdg: -3, bnd: -1 }, cap: { psy: -1, soc: -1 },
          outcomes: [
            { p: when('approved'), tone: 'good', fin: 20, text: `Approved. Quorvia opens up 40%. You make $20,000 in eight minutes, and you feel like you can't miss.` },
            { p: when('rejected'), tone: 'bad', fin: -32.5, text: `Rejected. Quorvia opens down 65%. You lose $32,500 before your coffee cools. Seven wins, gone in one.` }
          ],
          later: `A streak changes how you feel, not what you know. Your size followed the feeling.`,
          verdict: { who: 'nadia', line: `$50,000 on a binary event, on a tip from a trial lab. Win or lose, that's the trade I worry about.` }
        },
        {
          key: 'B', text: `Buy your current normal size, $20,000. You've been right. Trust the process.`, exposure: 'all',
          q: 1, s: { jdg: -1, bnd: -1 }, cap: {},
          outcomes: [
            { p: when('approved'), tone: 'good', fin: 8, text: `Approved. Up 40%. An $8,000 gain.` },
            { p: when('rejected'), tone: 'bad', fin: -13, text: `Rejected. Down 65%. A $13,000 loss: 13% of your account on one announcement.` }
          ],
          later: `"Normal size" had quietly doubled, and a binary event can lose most of it at once.`,
          verdict: { who: 'nadia', line: `Normal size, they said. Their normal had doubled since January.` }
        },
        {
          key: 'C', text: `Buy $2,300, sized so a rejection costs about $1,500, and trim your other trades back to January size.`, exposure: 'normal',
          q: c => saw(c, 2) ? 2 : 3, s: { jdg: 2, reg: 1, bnd: 2 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: when('approved'), tone: 'good', fin: 0.9, text: `Approved. Your small position makes $900, and your trimmed trades ride out the next dip comfortably.` },
            { p: when('rejected'), tone: 'mixed', fin: -1.5, text: `Rejected. You lose $1,500, exactly what you sized for. It barely registers.` }
          ],
          later: `You sized a binary bet so either answer was survivable. If Marco's source was the lab, though, you shouldn't have touched it.`,
          verdict: { who: 'nadia', line: `Sized a coin flip like a coin flip. I'd have asked about the tip first.` }
        },
        {
          key: 'D', text: `Don't buy Quorvia, and cut your trade sizes back to January's $10,000 for a while.`, exposure: 'none',
          q: 4, s: { jdg: 2, reg: 2, bnd: 2, lng: 1 }, cap: { psy: 1, soc: 1, str: 1 },
          outcomes: [
            { p: when('approved'), tone: 'mixed', fin: 0, text: `Approved, up 40%, and you weren't in it. Two weeks later the market turns, and your smaller positions take the hit gently.` },
            { p: when('rejected'), tone: 'good', fin: 0, text: `Rejected, down 65%. Marco goes quiet. Two weeks later the market turns, and your smaller positions barely feel it.` }
          ],
          later: `You noticed the streak had changed your behavior, not just your results, and reset before the market did it for you. Marty Schwartz cut his size after big wins, not just after losses.`,
          verdict: { who: 'nadia', line: `Cut their own size before I had to ask. I trust that account more than its returns.` }
        },
        {
          key: 'E', text: `Sell all your winning positions now and keep this year's gains. You've proven yourself.`, exposure: 'none',
          q: 1, s: { reg: -1, lng: -1, jdg: -1 }, cap: { time: -1 },
          outcomes: [
            { p: 0.6, tone: 'mixed', fin: 0, text: `You've sold everything by noon. Your three winners keep rising for another month, up 14%. You were safe, and you were out.` },
            { p: 0.4, tone: 'good', fin: 0, text: `You've sold everything by noon. A week later the market drops 6%. It looks like genius. It was a mood.` }
          ],
          later: `Cutting winners to feel safe is the mirror image of holding losers to avoid feeling wrong. Both let comfort run the account.`,
          verdict: { who: 'theo', line: `Sold everything to protect a good feeling. I've done it. It never lasts.` }
        }
      ],
      analysis: {
        game: `A bet on a binary event, offered at the moment you feel most certain. The FDA doesn't know about your streak, and the share price had already priced in the odds.`,
        incentives: `Marco gains from being right in front of you and loses nothing if you lose. The streak makes you want to keep the feeling going.`,
        leverage: `Patience, and the right to size small. Nothing forces you to have an opinion on Quorvia.`,
        missing: `Any reason to think you knew better than a 62% price. And whether Marco's "contact" made the tip something you couldn't legally use.`,
        assumptions: `That recent wins mean better judgment. That doubled sizes are still "normal". That a tip is information.`,
        controlled: `Whether to play, and how big.`,
        couldnt: `The FDA.`,
        concept: { thinker: 'duke', name: `Resulting`, body: `Judging a decision by how it turned out. Seven good results can come from a rising market rather than good decisions. Duke would ask what you'd have concluded if the market had been flat.` },
        second: { thinker: 'seykota', name: `Size is the decision`, body: `On a binary event, the question isn't whether to be bullish. It's how much you can lose if you're wrong. Size it so the bad answer is boring.` },
        better: `D. Cut your size back, and don't trade on a tip from inside a trial lab. If you trade it at all, C: small enough that rejection costs 1.5%.`,
        lesson: `Overconfidence rarely feels like arrogance. It feels like clarity.`
      },
      life: { title: `The promotion`, text: `You've just been promoted, and everything at work is going right. A friend shows you a house at the very top of your budget. Your recent success feels like proof you can handle it. The bank will say yes. Whether it should is a different question.` }
    },

    // ───────────────────────────────────────── 3. Four ideas, and the shape of each bet
    {
      id: 'empty-hand',
      tests: `Can you wait for an edge?`,
      level: `Selective participation`,
      title: `The Empty Hand`,
      lens: ['seykota', 'schelling'],
      setting: `The desk · A slow Thursday · Four ideas before lunch`,
      types: [
        { id: 'closes', p: 0.84, who: `the Ledgerline deal`, label: `The Ledgerline deal closed`, tell: `Financing was committed and the EU cleared it early. The $1.40 spread paid out, as it does most of the time.` },
        { id: 'breaks', p: 0.16, who: `the Ledgerline deal`, label: `The Ledgerline deal broke`, tell: `The EU extended its review, and Arcton walked away. Ledgerline fell back to where it was before the deal.` }
      ],
      facts: [
        `You own nothing right now. A normal trade is about $10,000. Your edge: <strong>{edge}</strong>.`,
        `<strong>Nimbic AI</strong> reports earnings tomorrow, and the trading chat is all in. It could move 20% either way.`,
        `<strong>Ledgerline</strong> is being bought by Arcton Software for $30 cash. It trades at $28.60. Before the deal it was $21.`,
        `<strong>Voltaic Cells</strong> just broke a two-year high on three times normal volume, after a supply deal with an automaker.`,
        `<strong>Hashgrid</strong>, a crypto miner, is down 40% this morning after its auditor quit. Nobody knows why.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Patience`, note: `Hasn't placed a trade in nine days.` }
      ],
      known: [`Four ideas, about $10,000 each.`, `You own nothing.`, `Nothing requires you to trade today.`],
      unknown: [`Which ideas will work.`, `Whether the Ledgerline deal closes.`, `Why Hashgrid's auditor quit.`],
      clues: [
        { label: `Work out each bet's shape`, text: `Ledgerline: make $490 if the deal closes, lose about $2,450 if it breaks. Voltaic: make about $2,100 if the breakout runs, lose $700 at a 7% stop. Nimbic: a coin flip, ±$2,000. Hashgrid: unknown.` },
        { label: `Theo's screen`, text: `Theo hasn't placed a trade in nine days. He's having his best year in a decade.` },
        { label: `Check the Ledgerline deal's progress`, text: c => c.type === 'breaks' ? `The EU just extended its review to a second phase. Arcton's CFO says they "remain committed." The spread hasn't moved yet.` : `Arcton's financing is fully committed, and the EU's first-phase review cleared a week early.` }
      ],
      edgeNote: {
        research: `Your idea was Ledgerline: a deal you'd read every filing on. But look at its shape. You risk $2,450 to make $490, and only the deal's progress tells you whether that's a good bet today.`,
        speed: `Your idea was Voltaic: a clean breakout on heavy volume, risking $700 to make about $2,100. That's the shape a trader who reads price is built for.`,
        patience: `Your honest answer was probably none. A patient trader waits for the rare, obvious setup, and a slow Thursday seldom brings one.`
      },
      question: `Four ideas. How many deserve your money?`,
      options: [
        {
          key: 'A', text: `Buy all four, about $10,000 each. More shots, more chances.`, exposure: 'large',
          q: 0, s: { reg: -2, jdg: -2, inf: -1 }, cap: { psy: -1, str: -1 },
          outcomes: [
            { p: when('closes'), tone: 'mixed', fin: -2.9, text: `Nimbic misses and drops 20%, Hashgrid keeps falling, Voltaic runs and Ledgerline closes. A busy month, $2,900 lighter.` },
            { p: when('breaks'), tone: 'bad', fin: -5.9, text: `Nimbic misses, Hashgrid keeps falling, and the Ledgerline deal breaks. Voltaic's gain barely dents it. You're down $5,900.` }
          ],
          later: `Activity felt like progress. Four positions you half understood cost more than they could earn.`,
          verdict: { who: 'theo', line: `Four trades before lunch. I remember being that busy. I don't remember it working.` }
        },
        {
          key: 'B', text: `Buy only the idea that fits your edge ({edge}), at normal size. Pass on the rest.`,
          exposure: c => edge(c) === 'speed' ? 'small' : 'normal',
          q: c => edge(c) === 'speed' ? 4 : edge(c) === 'patience' ? 3 : (saw(c, 2) && c.type === 'breaks' ? 1 : 4),
          s: { jdg: 2, inf: 2, bnd: 1, str: 1 }, cap: { str: 2, psy: 1 },
          outcomes: [
            { p: c => edge(c) === 'speed' ? 0.55 : when('closes')(c), tone: 'good', fin: c => edge(c) === 'speed' ? 2.1 : 0.5, text: c => edge(c) === 'speed' ? `Voltaic runs. You sell into strength three weeks later, up $2,100.` : `The Ledgerline deal closes on schedule. You collect $490 and your money back.` },
            { p: c => edge(c) === 'speed' ? 0.45 : when('breaks')(c), tone: c => edge(c) === 'speed' ? 'mixed' : 'bad', fin: c => edge(c) === 'speed' ? -0.7 : -2.5, text: c => edge(c) === 'speed' ? `Voltaic stalls and hits your 7% stop. A $700 loss on a good setup. You'd take it again.` : `Arcton walks away. Ledgerline falls to $21.60 and you lose $2,450: five months of spreads in one morning.` }
          ],
          later: `You played the one game you're built for, and looked at the shape of the bet before you placed it.`,
          verdict: { who: 'theo', line: `Took one trade, the one that looked like them. I'd let them sit next to me.` }
        },
        {
          key: 'C', text: `Buy nothing today. Nothing here is good enough.`, exposure: 'none',
          q: c => edge(c) === 'patience' || (edge(c) === 'research' && saw(c, 2) && c.type === 'breaks') ? 4 : 3,
          s: { jdg: 1, reg: 2, bnd: 1 }, cap: { psy: 1, time: -1 },
          outcomes: [
            { p: when('closes'), tone: 'mixed', fin: 0, text: `You don't trade. Nimbic misses and Hashgrid keeps falling. Voltaic runs, and Ledgerline closes. A quiet day, and one or two you'll think about.` },
            { p: when('breaks'), tone: 'good', fin: 0, text: `You don't trade. Nimbic misses, Hashgrid keeps falling, and the Ledgerline deal breaks. Doing nothing never looked so smart.` }
          ],
          later: `Not playing is a position. Sometimes it's the best one on the board.`,
          verdict: { who: 'theo', line: `Didn't trade. Good. Next time, notice when the one you've been waiting for walks in.` }
        },
        {
          key: 'D', text: `Buy Hashgrid at normal size. Down 40% in a morning, it has to bounce.`, exposure: 'large',
          q: 1, s: { jdg: -2, inf: -2 }, cap: { psy: -1 },
          outcomes: [
            { p: 0.6, tone: 'bad', fin: -3.5, text: `The auditor's letter comes out Friday. Hashgrid falls another 35%. You lose $3,500 on a company you hadn't heard of yesterday.` },
            { p: 0.4, tone: 'good', fin: 1.5, text: `Hashgrid bounces 15% by the close. You make $1,500 and can't explain why.` }
          ],
          later: `A falling price isn't a reason. It's a fact you don't understand yet.`,
          verdict: { who: 'nadia', line: `Bought a stock that was falling for reasons nobody knew. Nothing broke. That's the scary part.` }
        },
        {
          key: 'E', text: `Buy Nimbic at normal size before earnings. Everyone's in it, and you don't want to miss out.`, exposure: 'normal',
          q: 1, s: { jdg: -1, reg: -1 }, cap: {},
          outcomes: [
            { p: 0.55, tone: 'bad', fin: -2, text: `Nimbic misses and drops 20%. The chat room goes silent. You lose $2,000.` },
            { p: 0.45, tone: 'good', fin: 2, text: `Nimbic beats and jumps 20%. You make $2,000 and feel like part of something.` }
          ],
          later: `Fear of missing out is an edge, for whoever is selling to you.`,
          verdict: { who: 'theo', line: `Bought the chat room's stock so they wouldn't miss it. The chat room never misses anything.` }
        }
      ],
      analysis: {
        game: `Not a game against one opponent but a stream of offers. Most are bets someone else wants you to take. The skill is in declining, and in reading each bet's shape: how much you can make against how much you can lose.`,
        incentives: `The chat room benefits from more buyers. A falling stock attracts people who confuse cheap with valuable. A merger spread looks safe because it usually pays, a little.`,
        leverage: `You can wait as long as you like. Every idea has to earn your money. You never have to spend it.`,
        missing: `Whether the Ledgerline deal would close, and why Hashgrid's auditor quit. Only one of those was knowable.`,
        assumptions: `That a busy day is a productive one. That a bet that usually wins is a good bet.`,
        controlled: `Which games to enter, and at what shape of risk.`,
        couldnt: `Which ideas happened to work.`,
        concept: { thinker: 'seykota', name: `Trade your own edge`, body: `The traders in Market Wizards use methods that look nothing alike. What they share is that each plays only the game they're built for. Paul Tudor Jones wouldn't take a trade unless it could make five times what it risked.` },
        second: { thinker: 'schelling', name: `Choosing not to play`, body: `Schelling showed that declining to engage is a move, and often a strong one. The trader who can say no to everything gets to choose the few things worth a yes.` },
        better: `B, if your edge fits one idea and its shape is good. C if not. Ledgerline risks $2,450 to make $490: only take it when the deal's progress says it's safe.`,
        lesson: `Ten mediocre decisions can cost more than one good decision earns. Look at the shape before the story.`
      },
      life: { title: `The full calendar`, text: `Four invitations arrive in one week: a side project, a board seat, a speaking slot and a friend's startup. Saying yes to all of them feels like momentum. Only one of them uses what you're actually good at.` }
    },

    // ───────────────────────────────────────── 4. A normal losing stretch, or a new market?
    {
      id: 'changing-market',
      tests: `Can you abandon your assumptions?`,
      level: `Regime change`,
      title: `The Changing Market`,
      lens: ['nash', 'duke'],
      setting: `The desk · January · Six losing weeks`,
      types: [
        { id: 'drawdown', p: 0.45, who: `the market`, label: `It was a normal losing stretch`, tell: `Your method's recoveries had slowed from four days to six, not broken. Within weeks, the dips started bouncing again.` },
        { id: 'regime', p: 0.55, who: `the market`, label: `The market had changed`, tell: `Dips that used to recover in four days were taking nineteen. Cheaper money and booming AI spending had been doing the buying, and both had stopped.` }
      ],
      facts: [
        `For two years you've bought dips in AI-chip stocks while big cloud companies kept raising their data-center spending.`,
        `The method has lost money six weeks in a row. Interest rates are at a 14-year high.`,
        `Overnight, Cirrane Cloud cut its data-center spending by 30%. Tensora, an AI-chip designer, is <strong>down 14%</strong> before the open.`,
        `You're 11% below your account's peak. Nadia already cut your limits at 10%, and cuts them in half again at 15%.`,
        `A normal trade is about $10,000. The market opens at 9:30.`
      ],
      cast: [
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Limits step down as losses grow.` },
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Experience`, note: `In since 5 am. Reading, not trading.` }
      ],
      known: [`Six losing weeks.`, `Rates at a 14-year high.`, `Cirrane cut data-center spending 30% overnight.`],
      unknown: [`Whether this is a normal losing stretch or a new market.`, `Whether Cirrane's cut is the start of a trend.`],
      clues: [
        { label: `Check your method's backtest`, text: `The worst run in two years of testing was seven losing weeks. You're at six. Every method has losing stretches.` },
        { label: `Check how fast dips are recovering`, text: c => c.type === 'regime' ? `Dips used to recover in about four days. Since October, nineteen. The same signal now means something else.` : `Dips used to recover in about four days. Since October, about six. Slower, but still recovering.` },
        { label: `Theo's desk`, text: `Theo has been in since 5 am. He hasn't placed a trade. He's reading Cirrane's spending guidance line by line.` }
      ],
      edgeNote: {
        research: `Your edge travels better than most. Companies you know deeply are still worth knowing in a new market. Narrow to them while you relearn the rest.`,
        speed: `Reading price is the edge most exposed to a new market. The patterns you trusted were partly made by cheap money and booming spending. Test them again, small.`,
        patience: `A patient trader's edge is waiting, and this is when it pays. The rare, obvious setups usually come after the panic, not during it.`
      },
      question: `Your method stopped working. Does the method change, or do you?`,
      options: [
        {
          key: 'A', text: `Stay the course: keep buying the dips at normal size. Every method has losing stretches.`, exposure: 'normal',
          q: c => saw(c, 1) ? (c.type === 'regime' ? 1 : 3) : 2, s: { jdg: -1, reg: 1 }, cap: {},
          outcomes: [
            { p: when('drawdown'), tone: 'good', fin: 4, text: `The losing stretch ends in week seven, just as your backtest said it might. The dips bounce again. Up $4,000.` },
            { p: when('regime'), tone: 'bad', fin: -4, text: `You buy the dip at the open. It keeps dipping. Three more weeks cost you $4,000, and you're one bad day from Nadia's next cut.` }
          ],
          later: `Sticking with a method through a normal losing stretch is discipline. Sticking with it after the world changed is stubbornness. The evidence was there to tell them apart.`,
          verdict: { who: 'nadia', line: `Kept buying dips. Whether that was discipline or denial depended on a number they could have checked.` }
        },
        {
          key: 'B', text: `Use every bit of your remaining limit to win back the six weeks.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, bnd: -2 }, cap: { psy: -2, soc: -1 },
          outcomes: [
            { p: when('drawdown'), tone: 'good', fin: 7, text: `The bounce comes, and your full-size positions catch it. Up $7,000. It worked, which makes the next time more dangerous.` },
            { p: when('regime'), tone: 'bad', fin: -12, text: `Two more cloud companies trim spending. Your positions fall together. You lose $12,000 in four days, and Nadia halves your limits.` }
          ],
          later: `Revenge sizing turns a drawdown into a crisis. It's the losing position again, wearing a bigger coat.`,
          verdict: { who: 'nadia', line: `Maxed out their limit to get even. That's when I stop watching the numbers and start watching the person.` }
        },
        {
          key: 'C', text: `Halve your size and test whether the method still works, with small trades you write down.`, exposure: 'small',
          q: c => saw(c, 1) && c.type === 'regime' ? 4 : 3, s: { jdg: 2, inf: 2, reg: 2, lng: 1 }, cap: { str: 2, psy: 1 },
          outcomes: [
            { p: when('drawdown'), tone: 'mixed', fin: 1.5, text: `Your small tests work. The method was fine, and you made $1,500 instead of $4,000. You'll know faster next time.` },
            { p: when('regime'), tone: 'mixed', fin: -1.5, text: `Your small tests confirm it: dips don't bounce the way they did. You lose $1,500 learning something worth far more.` }
          ],
          later: `You treated the method like a hypothesis and paid a small price to test it.`,
          verdict: { who: 'theo', line: `Cut size and started measuring again. From the outside, adapting looks boring. Good.` }
        },
        {
          key: 'D', text: `Switch to what's working now: bet AI-chip stocks will fall (short them), like everyone else.`, exposure: 'normal',
          q: 1, s: { jdg: -1, inf: -1, reg: -1 }, cap: { str: -1 },
          outcomes: [
            { p: when('drawdown'), tone: 'bad', fin: -5.4, text: `A week later Cirrane says the cut was a one-time pause. Chip stocks jump 18%. You lose $5,400 with a method you'd never used.` },
            { p: when('regime'), tone: 'good', fin: 3, text: `Chip stocks keep sliding. You make $3,000, with no idea when to get out.` }
          ],
          later: `Copying a strategy doesn't copy the edge. You left your own game for someone else's, at the most crowded moment.`,
          verdict: { who: 'theo', line: `Jumped to the hot trade with no map. I've seen people make money that way. Once.` }
        },
        {
          key: 'E', text: `Stop trading for a month. Study what changed before you risk anything.`, exposure: 'none',
          q: c => saw(c, 1) ? (c.type === 'regime' ? 4 : 2) : 3, s: { jdg: 1, reg: 2, inf: 2 }, cap: { str: 2, time: -2 },
          outcomes: [
            { p: when('drawdown'), tone: 'mixed', fin: 0, text: `You sit out the month, and the method recovers without you. You come back wiser, and a month behind.` },
            { p: when('regime'), tone: 'good', fin: 0, text: `You sit out the slide entirely. A month later you come back with a narrower method and a clearer head.` }
          ],
          later: `Stepping away protected your money and spent your time. Both are capital.`,
          verdict: { who: 'nadia', line: `Stood down for a month and came back with notes. Best thing I saw all quarter.` }
        }
      ],
      analysis: {
        game: `Your method was a best response to a market that may no longer exist. The hard part is telling a normal losing stretch from a changed world while you're inside it.`,
        incentives: `You want the method to keep working, because it's part of how you see yourself. The market has no stake in your identity.`,
        leverage: `Two numbers: how long your method's worst losing run lasted in testing, and how fast dips are recovering now. Together they tell you which world you're in.`,
        missing: `Whether the conditions would come back. The recovery data was the best evidence available.`,
        assumptions: `That six weeks is a blip because two years were good. Or the opposite: that six weeks proves the method is dead.`,
        controlled: `Your size, and whether you checked the evidence before deciding.`,
        couldnt: `Rates, cloud spending, the crowd.`,
        concept: { thinker: 'nash', name: `A best response to a game that changed`, body: `Nash's equilibrium says a strategy is only good relative to the conditions it meets. Change the conditions and the best response changes. Linda Raschke knows her methods' normal drawdowns, so she can tell when one is abnormal.` },
        second: { thinker: 'duke', name: `Beliefs are bets`, body: `Duke asks you to hold beliefs with a level of confidence, and to update it. "This method works" was a 90% belief two years ago. The recovery data should move that number, up or down.` },
        better: `Check the recoveries first. If they've broken, C or E. If they've only slowed, A is discipline, not denial.`,
        lesson: `You don't have to predict the shock. You have to know your method well enough to recognize one.`
      },
      life: { title: `The skill that built your career`, text: `For ten years one skill paid your bills. Now software does most of it. You can do it harder, jump to whatever's hot, or test what still works and retrain on purpose, before the market makes the choice for you.` }
    },

    // ───────────────────────────────────────── 5. Too timid, sized right, or too big
    {
      id: 'final-bet',
      tests: `Can you protect your ability to play again?`,
      level: `Survival`,
      title: `The Last Player Standing`,
      lens: ['aumann', 'seykota'],
      setting: `The desk · December · The last trade of the year`,
      types: [
        { id: 'works', p: 0.6, who: `the trade`, label: `The setup worked`, tell: `Saros ran to its $104 target before earnings. Your best setups do this about six times in ten.` },
        { id: 'stopped', p: 0.25, who: `the trade`, label: `The setup failed, gently`, tell: `Saros drifted down to your $72 exit and you were out. A normal loss on a good setup.` },
        { id: 'gapped', p: 0.15, who: `the trade`, label: `The setup failed at earnings`, tell: `Saros held until earnings, then opened 25% lower, straight through your exit. Lines don't stop gaps.` }
      ],
      facts: [
        `Saros Robotics, which builds warehouse robots, is breaking out at <strong>$80</strong> after a year going sideways. It fits your edge, <strong>{edge}</strong>.`,
        `You'd be <strong>buying</strong>. Target: $104 (+30%). Exit if wrong: $72 (−10%). Earnings are in three weeks.`,
        `Your account: <strong>{account}</strong>. Your rule: {rule} of the account at risk on any one idea.`,
        `Nadia approves up to 2× leverage, with at most 25% of the account in one stock. Anything more is an exception.`,
        `At 4× leverage, a 25% fall wipes out the whole account.`
      ],
      cast: [
        { name: `Theo`, role: `Senior trader`, archetype: `The Survivor`, power: `Memory`, note: `Keeps a list of brilliant traders who aren't here anymore.` },
        { name: `Nadia`, role: `Head of risk`, archetype: `The Guardian`, power: `Your limits`, note: `Approves leverage by exception only.` }
      ],
      known: [`Target $104, exit $72.`, `Earnings in three weeks.`, `2× leverage approved; 4× needs an exception.`],
      unknown: [`Whether it works. Even a real edge loses often.`, `What earnings will do.`],
      clues: [
        { label: `Your trade log`, text: `Your best setups have worked about 60% of the time. Winners averaged +30%. Losers averaged −10%, except when earnings gapped them.` },
        { label: `The earnings calendar`, text: `Saros reports in three weeks. Its last two reports moved the stock 18% and 24%. An exit line won't help if it opens below it.` },
        { label: `Theo's desk drawer`, text: `Theo keeps a list of traders he knew who were brilliant, until one trade. It's longer than you'd think.` }
      ],
      edgeNote: {
        research: `It's your kind of trade: a company you know cold. That's exactly when overconfidence is most persuasive, and when sizing up is most justified. Both are true.`,
        speed: `It's your kind of trade: the cleanest breakout you've seen in two years. Clean breakouts still fail four times in ten.`,
        patience: `This is the rare, obvious setup you wait all year for. Waiting earned you the right to size up, not the right to bet everything.`
      },
      question: `How much are you willing to risk to win?`,
      options: [
        {
          key: 'A', text: `Ask Nadia for an exception: 4× leverage, the whole account. This is the one.`, exposure: 'all',
          q: 0, s: { reg: -3, jdg: -3, lng: -3, bnd: -2 }, cap: { psy: -2, soc: -2 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 120, text: `It works. With 4× leverage, a 30% move more than doubles your account. You're the best performer on the floor, and you'll spend years trying to feel this again.` },
            { p: when('stopped'), tone: 'bad', fin: -48, text: `Saros slips 12%. At 4×, that's nearly half your account, and the margin call sells you out before your exit is ever reached.` },
            { p: when('gapped'), tone: 'bad', ruin: true, fin: -999, text: `Saros opens 25% lower after earnings. At 4× leverage, your account is gone before you can do anything, and you owe the desk the difference.` }
          ],
          later: `Even a 60% edge loses four times in ten. Betting everything on one throw turned a good edge into a coin flip for your career.`,
          verdict: { who: 'nadia', line: `Asked me for an exception to bet the whole account. That's how good traders leave.` }
        },
        {
          key: 'B', text: `Buy $25,000 with no exit planned. You're sure about this one.`, exposure: 'large',
          q: 1, s: { jdg: -1, reg: -1, bnd: -1 }, cap: { psy: -1 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 7.5, text: `It works. A $7,500 gain to close the year.` },
            { p: when('stopped'), tone: 'bad', fin: -6.3, text: `It drifts down, and with no exit you ride it to −25% before you can't stand it anymore. A $6,300 loss.` },
            { p: when('gapped'), tone: 'bad', fin: -6.3, text: `It gaps down 25% on earnings. With no plan, you sell in a panic. A $6,300 loss.` }
          ],
          later: `The right size with no exit is still a bet on hope. The size was fine. The missing plan wasn't.`,
          verdict: { who: 'theo', line: `Sized it like they meant it, then forgot to decide where they'd be wrong.` }
        },
        {
          key: 'C', text: `Your normal size, $10,000, out at $72. That risks $1,000.`, exposure: 'small',
          q: 3, s: { jdg: 2, reg: 2, lng: 2, bnd: 1 }, cap: { psy: 1, soc: 1 },
          outcomes: [
            { p: when('works'), tone: 'mixed', fin: 3, text: `It works. You make $3,000 on the best setup in two years. Safe, and you'll wonder what right-sized would have made.` },
            { p: when('stopped'), tone: 'mixed', fin: -1, text: `It drifts to $72 and your exit takes you out. A $1,000 loss. You'll be here in January.` },
            { p: when('gapped'), tone: 'mixed', fin: -2.5, text: `It gaps 25% lower on earnings, straight through your exit. A $2,500 loss: more than you planned, still survivable.` }
          ],
          later: `Survivable in every world. But on the best setup in two years, normal size left most of the edge on the table.`,
          verdict: { who: 'theo', line: `Normal size on the setup of the year. Safe. I'd have liked to see a little more conviction.` }
        },
        {
          key: 'D', text: `Start with $5,000. Add $5,000 at +8% and again at +16%, and raise your exit to break-even.`, exposure: 'small',
          q: 4, s: { jdg: 2, reg: 1, lng: 2, inf: 1 }, cap: { psy: 1, str: 1 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 4.2, text: `It works, and you add twice as it proves you right. Up $4,200, most of it on money the trade earned for you.` },
            { p: when('stopped'), tone: 'mixed', fin: -0.5, text: `It fails before your first add. You lose $500.` },
            { p: when('gapped'), tone: 'mixed', fin: -1.3, text: `It gaps down on earnings while you're still small. A $1,300 loss.` }
          ],
          later: `Adding only as the market confirms you is how winners run and losers stay small.`,
          verdict: { who: 'nadia', line: `Built the position as it proved itself. I barely had to look at that account.` }
        },
        {
          key: 'E', text: `Nothing. Protect what you have. The year is done.`, exposure: 'none',
          q: 2, s: { reg: 1 }, cap: { time: -1 },
          outcomes: [
            { p: when('works'), tone: 'mixed', fin: 0, text: `Saros runs to $104 without you. Safe, and smaller than you could have been.` },
            { p: when('stopped'), tone: 'good', fin: 0, text: `Saros fails. You feel clever, briefly. But it was a real edge, and refusing every risk is its own slow way of losing.` },
            { p: when('gapped'), tone: 'good', fin: 0, text: `Saros gaps down on earnings. You weren't in it. That was luck, not the plan.` }
          ],
          later: `Preservation matters. So does using your edge when it's real. Never playing isn't surviving. It's leaving slowly.`,
          verdict: { who: 'theo', line: `Sat out the best setup of the year. Safe. Not quite the point.` }
        },
        {
          key: 'F', text: `Size up: $25,000, out at $72. That risks $2,500, and could make $7,500.`, exposure: 'normal',
          q: 4, s: { jdg: 2, reg: 1, lng: 2, str: 1 }, cap: { psy: 1, str: 2 },
          outcomes: [
            { p: when('works'), tone: 'good', fin: 7.5, text: `It works. $7,500 on the best setup in two years, with a planned loss you could always afford.` },
            { p: when('stopped'), tone: 'mixed', fin: -2.5, text: `It drifts to $72 and your exit takes you out. A $2,500 loss, exactly what you planned.` },
            { p: when('gapped'), tone: 'bad', fin: -6.3, text: `It gaps 25% lower on earnings, through your exit. A $6,300 loss: earnings risk you knew about and sized for only partly.` }
          ],
          later: `Druckenmiller's lesson: it isn't how often you're right, it's how much you make when you are. You sized up on your best idea and still knew exactly where you'd be wrong.`,
          verdict: { who: 'nadia', line: `Sized up on the best setup of the year and kept a hard exit. That's what the limit is for.` }
        }
      ],
      analysis: {
        game: `The last round of a game that never really ends. A single bet can't be repeated, but a career is nothing but repetition.`,
        incentives: `The leaderboard rewards whoever finishes highest this year. Your life rewards whoever is still playing in ten.`,
        leverage: `Time, and knowing your edge's shape: right six times in ten, +30% when right, −10% when wrong, and worse at earnings.`,
        missing: `The outcome. It always is. That's why size, not certainty, decides your fate.`,
        assumptions: `That a real edge means a sure thing. That the safest size is always the best one.`,
        controlled: `How much of yourself to put on the table, and where you'd get out.`,
        couldnt: `The breakout, the earnings report, the gap.`,
        concept: { thinker: 'aumann', name: `Repeated games`, body: `Aumann won a Nobel Prize for showing how behavior changes when a game repeats. A move that's rational once can be ruinous when you'll play again and again. A career is a repeated game.` },
        second: { thinker: 'seykota', name: `Bet more when you're right, never everything`, body: `Seykota's rules protect your capital, and Druckenmiller's add the other half: when the setup is exceptional, size up. The skill is doing both at once.` },
        better: `F or D. A real edge, sized so the bad four in ten never ends your game, and big enough that the good six matter.`,
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
    'losing-position': {
      center: () => {
        const b = [36, 182, 640, 536], closes = path(54, [[0, 55], [0.3, 58.5], [0.55, 50], [0.8, 46], [1, 41.62]], 4), Y = scaler(b, 37, 61);
        return header('CORVANE', 'Cloud data platform', '41.62', 'AH 38.90 / 39.40', C.red) + frame(b) + candles(b, closes, Y, 9) +
          dash(b, Y(52.02), C.dim, 'YOUR AVERAGE 52.02') + dash(b, Y(47.8), C.amber, 'YOUR LINE 47.80') +
          panel(668, 182, 300, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['880 shares', { size: 28, sans: true, weight: 600 }], ['Average $52.02', { size: 18, fill: C.dim, gap: 30 }], ['46% of account', { size: 18, fill: C.amber, gap: 54 }], ['−$9,150', { size: 46, fill: C.red, sans: true, weight: 600, gap: 40 }], ['at the close', { size: 18, fill: C.red }]], '#3c2220');
      },
      right: () => feed('NEWS · CORVANE', [['20:41', `Corvane's biggest customer may move to in-house AI`, C.amber], ['20:12', 'Cloud software stocks slip after hours'], ['19:30', 'Analyst trims Corvane target'], ['RISK', 'STOP BREACH 47.80 · 9 days · unacknowledged', C.red], ['AH', 'Corvane 38.90 / 39.40 · 4,200 shares traded', C.dim]])
    },
    'winning-streak': {
      center: () => {
        const b = [36, 182, 600, 536], closes = path(46, [[0, 16.6], [0.5, 19.2], [1, 18.4]], 12, 0.35), Y = scaler(b, 14, 22);
        return header('QUORVIA', 'AI drug discovery', '18.40', '+0.6% today', C.teal) + frame(b) + candles(b, closes, Y, 5) +
          `<line x1="620" y1="182" x2="620" y2="536" stroke="${C.amber}" stroke-width="2" stroke-dasharray="8 6"/>` + T(620, 176, 'FDA THIS WEEK', { size: 16, fill: C.amber, anchor: 'middle' }) +
          `<path d="M604 ${Y(18.4)} L640 ${b[1] + 14}" stroke="${C.teal}" stroke-width="2" stroke-dasharray="6 6" fill="none"/><path d="M604 ${Y(18.4)} L640 ${b[3] - 14}" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 6" fill="none"/>` +
          T(646, b[1] + 20, '+40%?', { size: 16, fill: C.teal }) + T(646, b[3] - 8, '−65%?', { size: 16, fill: C.red }) +
          panel(716, 182, 252, 354, [['YOU OWN', { size: 17, fill: C.dim }], ['No Quorvia', { size: 26, sans: true, weight: 600, gap: 54 }], ['PRICE IMPLIES', { size: 17, fill: C.dim }], ['~62% approval', { size: 22, sans: true, gap: 54 }], ['NORMAL SIZE', { size: 17, fill: C.amber }], ['$20k (Jan: $10k)', { size: 22, sans: true }]]);
      },
      right: () => feed('RECENT TRADES · SEVEN WINS IN A ROW', [['APR 02', 'Kestral  +$1,840', C.teal], ['APR 05', 'Wrenfold  +$1,210', C.teal], ['APR 09', 'Tensora  +$2,460', C.teal], ['APR 11', 'Arcton  +$980', C.teal], ['APR 16', 'Saros  +$3,120', C.teal], ['APR 19', 'Cirrane  +$2,740', C.teal]]) + T(36, 536, 'Normal size: $20k, up from $10k in January', { size: 20, fill: C.amber })
    },
    'empty-hand': {
      center: () => T(36, 92, `FOUR IDEAS · YOU OWN NOTHING · WHAT YOU COULD MAKE / LOSE`, { size: 18, fill: C.dim }) +
        tile(24, 104, 'Nimbic AI', 'Earnings tomorrow', path(30, [[0, 40], [1, 62]], 3, 1.2), C.teal, '+$2,000 / −$2,000', null, 'Chat: everyone is in') +
        tile(512, 104, 'Ledgerline', 'Bought at $30 · now $28.60', path(30, [[0, 21], [0.35, 21.5], [0.4, 28.4], [1, 28.6]], 8, 0.15), C.ink, '+$490 / −$2,450', (b, Y) => dash(b, Y(30), C.amber, '$30 if the deal closes'), 'Deal pending') +
        tile(24, 330, 'Voltaic Cells', '2-year high · 3× volume', path(30, [[0, 30], [0.5, 33], [0.85, 33.5], [1, 37]], 5, 0.5), C.teal, '+$2,100 / −$700', (b, Y) => dash(b, Y(34), C.dim, 'old high', 'end'), 'Exit 7% below') +
        tile(512, 330, 'Hashgrid', '−40% today', path(30, [[0, 50], [0.8, 51], [0.86, 30], [1, 30.5]], 6, 0.6), C.red, '? / ?', null, 'Auditor quit'),
      right: () => feed('TRADING CHAT', [['09:41', '“Nimbic is going to crush earnings”'], ['09:44', '“Loaded up on Nimbic this morning”'], ['09:52', '“If you are not in Nimbic, what are you doing”'], ['10:05', '“Hashgrid at -40% has to bounce, right?”'], ['10:11', '“Bought more Nimbic”', C.dim]])
    },
    'changing-market': {
      center: () => {
        const b = [36, 150, 964, 500], vals = path(60, [[0, 100], [0.86, 128], [1, 114]], 21, 1.1), Y = scaler(b, 98, 132);
        return T(36, 112, 'YOUR METHOD · BUY AI-CHIP DIPS', { size: 22, fill: C.dim }) + frame(b, 8, 4) + poly(b, vals, Y, C.teal) +
          dash(b, Y(128), C.dim, 'PEAK', 'end') + dash(b, Y(115.2), C.amber, '−10% · LIMITS ALREADY CUT', 'end') + dash(b, Y(108.8), C.red, '−15% · CUT IN HALF AGAIN', 'end') +
          T(36, 530, '2 years ago', { size: 16, fill: C.dim }) + T(36 + (b[2] - b[0]) * 0.86, 530, '6 weeks ago', { size: 16, fill: C.dim, anchor: 'middle' }) + T(964, 530, 'today · −11%', { size: 16, fill: C.amber, anchor: 'end' });
      },
      right: () => feed('NEWS · 06:15', [['06:02', 'Cirrane cuts data-center spending 30%', C.amber], ['06:10', 'Tensora −14% before the open', C.red], ['05:40', 'Rates: highest in fourteen years'], ['TEST', 'Backtest worst run: 7 losing weeks · you: 6', C.dim]])
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
  // One desk for all five. The player is the trader, seen over the shoulder.
  const alert = t => ({ screen: t });
  M.scenes = {
    'losing-position': {
      env: 'trading',
      screens: SCREENS['losing-position'],
      cast: [{ id: 'theo', spot: 'theo', mood: 'neutral', pose: 'pocket', wants: `Nothing from you. He's watched this night happen to a lot of people.` }],
      intro: [
        { cam: 'wide', caption: `8:47 pm. The trading floor is nearly empty.` },
        { cam: 'screens', caption: `On the center screen: the Corvane shares you bought at $56, then $51, then $49. They closed at $41.62.` },
        { cam: 'note', caption: `Beside the keyboard, in your handwriting: "Thesis: retention is strong. The drop is market-wide, not Corvane."` },
        { cam: 'screens', ...alert(`20:41 · Corvane's biggest customer may move to in-house AI`), caption: `The news isn't about the market anymore. It's about Corvane.` },
        { cam: 'screens', ...alert(`RISK · STOP BREACH 47.80 · 9 days · unacknowledged`) },
        { cam: 'wide', caption: `Theo, thirty-one years on this desk, is packing up to go home.` },
        { who: 'theo', mood: 'neutral', say: `Long night?` },
        { you: `(It'll come back. It always comes back.)` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `The market doesn't know what you paid, you know. It's just you and the number.` },
        { cam: 'screens', ...alert(`After hours: 38.90 to sell · 39.40 to buy · thin`), caption: `Regular trading opens at 9:30 tomorrow. Tonight, you can still sell, at a worse price.` }
      ],
      options: {
        A: { line: `(Sell all of it. Now.)`, preview: `Ends the damage at a bad price. Admits you were wrong.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SOLD 880 CORVANE @ 39.00 · Loss −11,450`) }, { who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`PRE-MARKET · CORVANE 33.10 · customer confirms move`) }] },
            { beats: [{ cam: 'screens', ...alert(`SOLD 880 CORVANE @ 39.00 · Loss −11,450`) }, { who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`PRE-MARKET · CORVANE 44.00 · customer denies report`), caption: `Wrong about the news. Right about the decision.` }] }
          ] },
        B: { line: `(Hold. One unnamed source. The company's still sound.)`, preview: `Keeps the hope, and all the risk.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'skeptical', act: 'shake' }, { cam: 'screens', ...alert(`PRE-MARKET · CORVANE 33.10 · customer confirms move`) }] },
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`PRE-MARKET · CORVANE 44.00 · customer denies report`), caption: `It comes back. This time.` }] }
          ] },
        C: { line: `(Buy 880 more. At this price it's a bargain.)`, preview: `Doubles the bet on a thesis that may be breaking.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`BOUGHT 880 CORVANE @ 39.40 · now 1,760 shares`) }, { who: 'theo', mood: 'surprised', act: 'glance' }, { cam: 'screens', ...alert(`CORVANE 29.90 · Loss −27,800`) }] },
            { beats: [{ cam: 'screens', ...alert(`BOUGHT 880 CORVANE @ 39.40 · now 1,760 shares`) }, { who: 'theo', mood: 'skeptical' }, { cam: 'screens', ...alert(`CORVANE 46.00 · customer denies report`), caption: `It works, and you'll remember that it worked.` }] }
          ] },
        D: { line: `(Sell half now. The rest goes at the open if it's under $36.)`, preview: `Cuts the risk. Keeps a foot in.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SOLD 440 CORVANE @ 39.00`) }, { cam: 'screens', ...alert(`OPEN 33.10 · rest sold below your line`), caption: `A gap goes straight through any line you draw.` }] },
            { beats: [{ cam: 'screens', ...alert(`SOLD 440 CORVANE @ 39.00`) }, { who: 'theo', mood: 'neutral', act: 'nod' }, { cam: 'wide', caption: `The customer denies it. The half you kept recovers.` }] }
          ] },
        E: { line: `(Not in a thin market. I'll decide at the open.)`, preview: `A fairer price, if the news turns out to be wrong.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`PRE-MARKET · CORVANE 33.10 · customer confirms move`), caption: `The fairer price got a lot worse overnight.` }] },
            { beats: [{ cam: 'screens', ...alert(`PRE-MARKET · CORVANE 44.00 · customer denies report`), caption: `You sell into the bounce.` }] }
          ] }
      },
      links: []
    },

    'winning-streak': {
      env: 'trading',
      screens: SCREENS['winning-streak'],
      cast: [{ id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `For you to still be trading next year, and to stay inside the rules.` }],
      intro: [
        { cam: 'wide', caption: `April. Seven winning trades in a row. The desk feels different when you're right.` },
        { cam: 'wide', caption: `Nadia runs risk for the desk. She sets how much each trader may bet.` },
        { who: 'nadia', mood: 'smile', say: `Good month.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Your normal size was ten thousand in January. It's twenty now. Just so you know that I know.` },
        { cam: 'screens', ...alert(`Marco: Quorvia FDA decision this week. My contact at the trial lab says it's locked. Buy.`) },
        { who: 'nadia', mood: 'skeptical', say: `If he actually knows, you can't trade it. If he doesn't, it isn't information.` },
        { you: `(Marco's been wrong before. But I'm seeing things clearly right now.)` },
        { cam: 'screens', caption: `Approval: about +40%. Rejection: about −65%. The price says roughly 62% approval.` }
      ],
      options: {
        A: { line: `(Fifty thousand. This is my moment.)`, preview: `Sized for the feeling.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`QUORVIA APPROVED · +40%`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `You made $20,000 in eight minutes. Nadia makes a note.` }] },
            { beats: [{ cam: 'screens', ...alert(`QUORVIA REJECTED · −65%`) }, { who: 'nadia', mood: 'awkward', pose: 'tablet', caption: `Seven wins, gone in one.` }] }
          ] },
        B: { line: `(My normal size. Twenty thousand.)`, preview: `Your new normal. On a binary event.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`QUORVIA APPROVED · +40%`), caption: `A solid gain on a coin flip.` }] },
            { beats: [{ cam: 'screens', ...alert(`QUORVIA REJECTED · −65%`), caption: `Thirteen percent of the account, on one announcement.` }] }
          ] },
        C: { line: `(Small enough that a rejection costs fifteen hundred. And trim everything else back.)`, preview: `Survivable either way. The tip still came from inside a lab.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`QUORVIA APPROVED · +40%`) }, { who: 'nadia', mood: 'neutral', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`QUORVIA REJECTED · −65%`), caption: `Exactly the loss you sized for.` }] }
          ] },
        D: { line: `Nadia, you're right. I'm cutting back to January size, and I'm not touching Marco's tip.`, preview: `Fixes the thing the streak changed.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'surprised' }, { who: 'nadia', mood: 'smile', act: 'nod', say: `That's the most profitable thing you've said all month.` }, { cam: 'screens', ...alert(`QUORVIA APPROVED · +40%`), caption: `You weren't in it. You'll survive that.` }] },
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod', say: `That's the most profitable thing you've said all month.` }, { cam: 'screens', ...alert(`QUORVIA REJECTED · −65%`) }] }
          ] },
        E: { line: `(Sell everything. Lock in the year.)`, preview: `Safe. And out.`,
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
        { cam: 'screens', ...alert(`Trading chat: everyone loading up on Nimbic AI before earnings`) },
        { cam: 'screens', ...alert(`Ledgerline: being bought for $30 · trades at $28.60`) },
        { cam: 'screens', ...alert(`Voltaic Cells: two-year high on 3× volume`) },
        { cam: 'screens', ...alert(`Hashgrid −40% · its auditor quits`) },
        { who: 'theo', mood: 'smile', pose: 'mug', say: `Busy morning?` },
        { you: `(Four ideas. It feels wrong to do nothing.)` },
        { cam: 'wide', caption: `Theo hasn't placed a trade in nine days. He's having his best year in a decade.` }
      ],
      options: {
        A: { line: `(All four. More shots, more chances.)`, preview: `Busy. Is it good?`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`4 positions · Nimbic −20% · Hashgrid −35% · Voltaic +21%`) }, { who: 'theo', mood: 'neutral', act: 'sigh', caption: `A busy month. An expensive one.` }] },
            { beats: [{ cam: 'screens', ...alert(`Ledgerline deal terminated · LDGL back to $21.60`) }, { who: 'theo', mood: 'neutral', act: 'sigh' }] }
          ] },
        B: { line: `(Just the one that fits how I trade.)`, preview: `One trade, the one you understand. Check its shape.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `Weeks later, your one trade has done what your trades are supposed to do.` }] },
            { beats: [{ who: 'theo', mood: 'neutral', act: 'nod' }, { cam: 'screens', caption: `It went against you. Was the shape worth it?` }] }
          ] },
        C: { line: `(Nothing today.)`, preview: `Patience, at the cost of maybe missing yours.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', pose: 'mug', act: 'nod' }, { cam: 'screens', caption: `A quiet day, and one or two you'll think about.` }] },
            { beats: [{ who: 'theo', mood: 'smile', pose: 'mug', act: 'nod' }, { cam: 'screens', ...alert(`Ledgerline deal terminated · LDGL back to $21.60`) }] }
          ] },
        D: { line: `(Hashgrid. Down 40%, it has to bounce.)`, preview: `Cheap isn't the same as good.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Hashgrid: auditor's letter released · −35%`) }, { who: 'theo', mood: 'skeptical', act: 'shake' }] },
            { beats: [{ cam: 'screens', ...alert(`Hashgrid +15% into the close`), caption: `It bounced. You can't explain why.` }] }
          ] },
        E: { line: `(Nimbic. Everyone's in it.)`, preview: `Borrowed conviction.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Nimbic misses · −20%`), caption: `The chat room goes quiet.` }] },
            { beats: [{ cam: 'screens', ...alert(`Nimbic beats · +20%`), caption: `You feel like part of something.` }] }
          ] }
      },
      links: []
    },

    'changing-market': {
      env: 'trading',
      screens: SCREENS['changing-market'],
      cast: [
        { id: 'nadia', spot: 'nadia', mood: 'neutral', pose: 'tablet', wants: `To keep you inside your limits.` },
        { id: 'theo', spot: 'theo', mood: 'thinking', pose: 'thinking', wants: `To understand what changed before he risks anything.` }
      ],
      intro: [
        { cam: 'wide', caption: `January. For two years one method made your money: buy AI-chip stocks when they dip.` },
        { cam: 'screens', caption: `For six weeks, it has lost.` },
        { cam: 'screens', ...alert(`06:02 · Cirrane Cloud cuts data-center spending 30%`), caption: `Overnight, the biggest buyer of AI chips pulled back.` },
        { cam: 'screens', ...alert(`Tensora −14% before the open`) },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `You're eleven percent off your peak. Your limits already stepped down at ten. At fifteen, they halve again.` },
        { you: `(Every dip I've bought for two years has come back.)` },
        { who: 'theo', mood: 'thinking', pose: 'thinking', caption: `Theo has been in since five. He isn't trading. He's reading.` }
      ],
      options: {
        A: { line: `(Stay the course. Every method has losing stretches.)`, preview: `Discipline, if this is a normal stretch. Denial, if it isn't.`,
          outcomes: [
            { beats: [{ cam: 'screens', caption: `Week seven. The dips start bouncing again.` }, { who: 'nadia', mood: 'neutral', act: 'nod' }] },
            { beats: [{ cam: 'screens', ...alert(`3 weeks · dips keep dipping · −4,000`) }, { who: 'nadia', mood: 'skeptical', pose: 'tablet' }] }
          ] },
        B: { line: `(Use everything I've got left. Win it back.)`, preview: `Revenge, with a spreadsheet.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Chips rebound · +7,000`) }, { who: 'nadia', mood: 'skeptical', act: 'glance', caption: `It worked. That makes next time more dangerous.` }] },
            { beats: [{ cam: 'screens', ...alert(`Two more cloud companies trim spending · chips −9%`) }, { who: 'nadia', mood: 'frustrated', pose: 'crossed', say: `I'm halving your limits. Today.` }] }
          ] },
        C: { line: `I'm halving my size and testing whether this still works. Small trades, all written down.`, preview: `Treat the method as a hypothesis.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `The tests work. The method was fine, and you know it faster.` }] },
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', caption: `The small tests say it plainly: the dips don't bounce like they used to.` }] }
          ] },
        D: { line: `(Everyone's shorting chips. I'll do that.)`, preview: `Someone else's edge.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`Cirrane: cut was "a one-time pause" · chips +18%`) }, { who: 'theo', mood: 'neutral', act: 'shake' }] },
            { beats: [{ cam: 'screens', ...alert(`Chips −10% on the week`), caption: `It works, and you have no idea when to get out.` }] }
          ] },
        E: { line: `I'm standing down for a month. I want to understand what changed.`, preview: `Spends time to save capital.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', caption: `The method recovers without you. Wiser, and a month behind.` }] },
            { beats: [{ who: 'nadia', mood: 'surprised' }, { who: 'theo', mood: 'smile', act: 'nod', caption: `You sit out the slide and come back with notes.` }] }
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
        { cam: 'screens', caption: `Tonight: Saros Robotics, breaking out after a year going sideways. The best setup you've seen in two years.` },
        { who: 'nadia', mood: 'neutral', pose: 'tablet', say: `Two times leverage is approved, up to a quarter of your account in one name. Anything beyond that is an exception, and I'd have to sign it.` },
        { who: 'theo', mood: 'thinking', pose: 'pocket', say: `I keep a list of traders who were brilliant until one afternoon. It's longer than you'd think.` },
        { you: `(One trade could put me ahead of everyone on this floor.)` },
        { cam: 'screens', ...alert(`Earnings in three weeks · How much are you willing to risk to win?`) }
      ],
      options: {
        A: { line: `Nadia, I want an exception. Four times, the whole account.`, preview: `Ahead of everyone, or gone.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'awkward', pose: 'tablet' }, { cam: 'screens', ...alert(`SAROS 104 · account more than doubles`), caption: `You'll spend years trying to feel this again.` }] },
            { beats: [{ who: 'nadia', mood: 'frustrated' }, { cam: 'screens', ...alert(`MARGIN CALL · position sold at −12%`) }] },
            { beats: [{ who: 'nadia', mood: 'surprised' }, { cam: 'screens', ...alert(`SAROS OPENS −25% · ACCOUNT LIQUIDATED`) }, { who: 'theo', mood: 'neutral', act: 'sigh', caption: `It's over before the open finishes.` }] }
          ] },
        B: { line: `(Twenty-five thousand. I don't need an exit. I'm sure.)`, preview: `The right size, with no plan for being wrong.`,
          outcomes: [
            { beats: [{ cam: 'screens', ...alert(`SAROS 104 · +7,500`), caption: `It works.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS 60 · −6,300`), caption: `With no exit, you rode it down.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · −6,300`), caption: `A panic sale after earnings.` }] }
          ] },
        C: { line: `My normal size. Ten thousand, out at seventy-two.`, preview: `Survivable in every world. Small when you're right.`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS 104 · +3,000`), caption: `Right on the setup of the year, at normal size.` }] },
            { beats: [{ who: 'theo', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · 72 · −1,000`) }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · through your exit · −2,500`) }] }
          ] },
        D: { line: `Five thousand to start. I'll add as it proves itself, and raise my exit to break-even.`, preview: `Let the market confirm you before you commit more.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`Added twice · SAROS 104 · +4,200`), caption: `The winner ran, and you let it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`−500 · position closed`) }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · −1,300`), caption: `It failed while you were still small.` }] }
          ] },
        E: { line: `(Nothing. The year is done.)`, preview: `Safe. Is safe the same as surviving?`,
          outcomes: [
            { beats: [{ who: 'theo', mood: 'neutral', pose: 'shrug' }, { cam: 'screens', ...alert(`SAROS 104`), caption: `It works, without you.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS 72`), caption: `It fails. You feel clever, briefly.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25%`), caption: `You weren't in it. Luck, not a plan.` }] }
          ] },
        F: { line: `Twenty-five thousand, out at seventy-two. Two and a half percent at risk.`, preview: `Bigger when you're right. Still a planned loss when you're not.`,
          outcomes: [
            { beats: [{ who: 'nadia', mood: 'smile', act: 'nod' }, { cam: 'screens', ...alert(`SAROS 104 · +7,500`), caption: `Right, and sized like you meant it.` }] },
            { beats: [{ who: 'nadia', mood: 'neutral', act: 'nod' }, { cam: 'screens', ...alert(`EXIT HIT · 72 · −2,500`), caption: `Exactly the loss you planned.` }] },
            { beats: [{ cam: 'screens', ...alert(`SAROS OPENS −25% · through your exit · −6,300`) }, { who: 'theo', mood: 'neutral', act: 'sigh' }] }
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
