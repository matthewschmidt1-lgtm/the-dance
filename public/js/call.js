// The Trader's Mind, Part II: The Call.
// Five phone calls, one account. Every call holds two games: the conversation you think you're
// having, and the one the caller may actually be playing. Each call draws a hidden truth (is
// Michael warning you or shopping your shares?); what you ask, reveal and leave unsaid decides
// how much of it you see. Decisions are graded on what you could know, never on the roll.
//
// Lines: t = text, with [[key phrases]] that get drawn over on the paper; note = your own thought
// in the margin; sketch = a mark beside it (q, arrow, box, up, down); who = 'c' caller (default),
// 'y' you, 'n' what you see or do. Lines, notes and options may be functions of the call state s:
// { truth, flags, mem, cap, rules, picked }.
// Every company, person and price here is fictional.
window.PP = window.PP || {};

(function () {
  const C = {};
  const by = (s, map) => map[s.truth] !== undefined ? map[s.truth] : map._;
  const f = (s, k) => !!s.flags[k];
  const m = (s, id) => s.mem[id] || {};
  const verified = s => f(s, 'askedPrints') || f(s, 'askedEdge') || f(s, 'silent') || f(s, 'askedFirm');
  const money = k => `${k < 0 ? '−' : '+'}$${Math.abs(Math.round(k * 10) / 10)}k`;
  // The Debrief's subject: the lowest-graded decision of the year, from the Desk and the calls so far.
  const RULE_KEYS = ['stops', 'size', 'leverage', 'together', 'smaller'];
  function worst(s) {
    const desk = (PP.ui && PP.ui.deskSteps ? PP.ui.deskSteps() : []).map(x => ({ ...x }));
    const calls = Object.entries(s.mem).filter(([id]) => C.byId[id] && id !== 'debrief').map(([id, e]) => ({ id, title: C.byId[id].title, did: e.did || '', q: e.q, fin: e.fin || 0, defies: e.defies || [] }));
    const all = [...desk, ...calls].filter(x => Number.isInteger(x.q) && x.q <= 2 && x.did);
    if (!all.length) return null;
    const w = all.sort((a, b) => a.q - b.q || a.fin - b.fin)[0];
    return { ...w, kind: (w.defies || []).find(r => RULE_KEYS.includes(r)) || null };
  }
  const kindOf = s => { const w = worst(s); return w ? w.kind : null; };
  const isLuck = s => { const w = worst(s); return !w || (w.q >= 2 && !w.kind); };

  // Two promises the player makes before the first call, beside the risk rule from Part I.
  C.pledges = [
    { v: 'verify', label: `I don't act on what I can't verify.`, short: `Verify before acting` },
    { v: 'private', label: `I keep my positions to myself.`, short: `Keep positions private` },
    { v: 'nochase', label: `I never chase a move I missed.`, short: `Never chase` },
    { v: 'evidence', label: `I follow the evidence, even against me.`, short: `Follow the evidence` },
    { v: 'walk', label: `When I'm unsure, I size down or walk away.`, short: `Unsure means smaller` }
  ];

  C.callers = {
    michael: { name: `Michael Reeves`, role: `Senior broker, Pryor & Lowe`, voice: 'michael', initials: 'MR' },
    richard: { name: `Richard Cole`, role: `Investor. Knows people.`, voice: 'richard', initials: 'RC' },
    theo: { name: `Theo Brandt`, role: `Senior trader · runs the Wednesday review`, voice: 'theo', initials: 'TB' },
    nadia: { name: `Nadia Okafor`, role: `Head of risk`, voice: 'nadia', initials: 'NO' },
    catherine: { name: `Catherine Hale`, role: `Hale Family Office`, voice: 'catherine', initials: 'CH' }
  };

  C.calls = [
    // ───────────────────────────────────────── 1. The Warning
    {
      id: 'warning', title: `The Warning`, tests: `Can you accept being wrong?`, opponent: `your ego`,
      caller: 'michael', day: `Thursday`, clock: `10:42 AM`, env: 'desk-morning',
      blurb: `A broker calls about a position that's already losing.`,
      setup: [`Halden Freight · you own 1,200 shares at $38.50`, `Now $35.10 · down $4,080 · your stop: $34.60`, `Trades ~9,000 shares a day · 200 on the bid`],
      chart: 'down',
      truths: [{ id: 'honest', p: 0.5 }, { id: 'book', p: 0.5 }],
      voicemail: [
        { t: `Michael Reeves, Pryor and Lowe. It's about [[Halden Freight]]. Somebody big is selling. Call me if you want to talk.` },
        { who: 'n', t: `The message ends. He doesn't call back.` }
      ],
      nodes: {
        open: { say: [
          { t: `Michael Reeves, at Pryor and Lowe. Have you got a minute?` },
          { t: `I'll be quick. It's about [[Halden Freight]].`, note: `How does he know I'm in Halden?`, sketch: 'q' },
          { t: `I'm not telling you anything the screen won't. But there's [[a seller in it]]. A big one. Every print since nine.`, pause: 500 },
          { t: `I'd want someone to call me. That's all this is.`, tone: `evenly` }
        ], to: 'm1' },
        m1: { moment: 'silence', prompt: `He waits for you to say something.`, wait: 7, options: [
          { text: `"Why are you calling me?"`, you: `Why are you calling me?`, set: 'askedWhy', to: 'why' },
          { text: `"What do you know that the market doesn't?"`, you: `What do you know that the market doesn't?`, set: 'askedEdge', to: 'edge' },
          { text: `"That's not what I'm seeing."`, you: `That's not what I'm seeing.`, set: 'challenged', to: 'pushback' }
        ], silent: { set: 'silent', to: 'quiet' } },
        why: { say: s => by(s, {
          honest: [{ t: `Fair question.` }, { t: `Because last year nobody called me, and it cost me a client.`, note: `Personal. Could be true.` }, { t: `And because [[I'd like your business]] someday. I won't pretend otherwise.`, note: `He said his angle out loud.`, sketch: 'box' }],
          book: [{ t: `Because we look after people.` }, { t: `You'd do the same for me.`, tone: `quickly`, note: `That isn't an answer.`, sketch: 'q' }]
        }), to: 'size' },
        edge: { say: s => by(s, {
          honest: [{ t: `I can't tell you who. I can tell you what the tape looks like: [[same seller since the open]], hitting every bid, two hundred at a time.`, note: `Specific. I can check the tape.` }],
          book: [{ t: `Let's say [[I've seen the flows]]. You know how it is.`, note: `Vague.`, sketch: 'q' }]
        }), to: 'size' },
        pushback: { say: s => by(s, {
          honest: [{ t: `Okay. (pause) Then I've wasted your morning, and you can ignore me.` }, { t: `But look at the [[size on the offer]]. That isn't retail.`, note: `He didn't push. He pointed.` }],
          book: [{ t: `With respect, the screen is telling you something. [[You're just not listening.]]`, note: `Pressure, not information.`, sketch: 'arrow' }]
        }), to: 'size' },
        quiet: { say: s => by(s, {
          honest: [{ t: `(exhales) Look. I've got nothing in this. Do what you want with it.` }, { t: `It's the same seller that was in [[Torvik]] last month. They didn't stop until it was done.`, note: `A pattern I can check.`, sketch: 'box' }],
          book: [{ t: `...You still there?` }, { t: `Listen, if you want out clean, I've got [[a natural for size]]. [[$34.80]], all-or-none, firm for five minutes.`, note: `He has a buyer. Who?`, sketch: 'arrow', set: 'blockOffer' }]
        }), to: 'size' },
        size: { say: [{ t: `How big are you in it, if you don't mind me asking?`, tone: `lightly` }], to: 'm2' },
        m2: { moment: 'reveal', prompt: `What do you tell him?`, options: [
          { text: `The truth: 1,200 shares, stop at $34.60.`, tag: `Tell all`, you: `Twelve hundred shares. My stop's at 34.60.`, set: ['revealedSize', 'revealedStop'], to: 'told' },
          { text: `The size, not the stop.`, tag: `Tell some`, you: `Twelve hundred shares.`, set: 'revealedSize', to: 'toldSize' },
          { text: `"Big enough to listen."`, tag: `Deflect`, you: `Big enough to listen.`, to: 'deflect' },
          { text: `"Why does that matter to you?"`, tag: `Turn it round`, you: `Why does that matter to you?`, set: 'turned', to: 'turn' }
        ] },
        told: { say: s => by(s, {
          honest: [{ t: `Then your stop's close. [[I'd respect it.]]`, note: `Good advice. Free, too.` }],
          book: [{ t: `Your stop's 34.60? Then [[34.80, all-or-none]] beats walking twelve hundred shares down a book with two hundred on the bid.`, note: `True. And he built his price on my number.`, sketch: 'box', set: 'blockOffer' }]
        }), to: 'm3' },
        toldSize: { say: s => by(s, {
          honest: [{ t: `That's real money. I'd [[cut it before lunch]].` }],
          book: [{ t: `In this name? Then you'll want [[a clean exit]]. I've got a natural at 34.80 for all of it.`, note: `Twelve hundred shares, and he has a home for them already.`, set: 'blockOffer' }]
        }), to: 'm3' },
        deflect: { say: s => by(s, {
          honest: [{ t: `(laughs) Fair enough. You don't owe me that.` }],
          book: [{ t: `Sure, sure. Well, if it's a lot, [[I can help]] with that.`, note: `Help how?`, sketch: 'q' }]
        }), to: 'm3' },
        turn: { say: s => by(s, {
          honest: [{ t: `It doesn't. Habit. Sorry.` }],
          book: [{ t: `(pause) Just that, if it's size, I might be able to [[move it for you]].`, note: `He wants to be the exit.`, sketch: 'arrow' }]
        }), to: 'm3' },
        m3: { moment: 'ask', prompt: `He's about to go. You have time for a question or two.`, questions: [
          { q: `"Who's on the other side of your block?"`, when: s => f(s, 'blockOffer'), set: 'askedBuyer', a: s => by(s, { _: [{ t: `(pause) A client. A long-term holder.` }, { t: `They like it [[at these levels]].`, note: `Someone wants my shares, at this price.`, sketch: 'arrow' }] }) },
          { q: `"Can you send me the prints?"`, set: 'askedPrints', a: s => by(s, {
            honest: [{ t: `Pull up time and sales from nine. [[You'll see it]] yourself.`, note: `Evidence I can check.` }],
            book: [{ t: `Prints? It's all on the tape. [[The bid's firm for five minutes]], though.`, note: `He's selling the clock, not the evidence.`, sketch: 'q' }]
          }) },
          { q: `"What would you do?"`, a: s => by(s, {
            honest: [{ t: `I'd [[sell half now]] and let the stop do the rest.` }],
            book: [{ t: `I'd [[take the bid]] while it's there.`, note: `His bid.` }]
          }) },
          { q: `"Is your firm in this name?"`, set: 'askedFirm', a: s => by(s, {
            honest: [{ t: `Not that I know of. I'd tell you.` }],
            book: [{ t: `[[We make markets in everything.]]`, note: `That's not a no.`, sketch: 'q' }]
          }) }
        ], to: 'close' },
        close: { say: s => by(s, {
          honest: [{ t: `Anyway. Your call. Literally.` }, { who: 'n', t: `He hangs up.` }],
          book: [{ t: `Think about it. [[The bid won't be there all day.]]`, note: `A deadline. Whose?`, sketch: 'arrow' }, { who: 'n', t: `He hangs up.` }]
        }), to: 'decide' }
      },
      decide: {
        prompt: `Halden is $35.10. Your stop is $34.60. What do you do?`,
        options: [
          { key: 'A', text: `Sell all 1,200 now, walking the thin book down to about $34.90.`, did: `Took the loss when warned.`, exposure: 'none', q: s => verified(s) ? 3 : 2, cap: { psy: 1 } },
          { key: 'B', text: `Sell half now, about $35.00. Keep the stop on the rest.`, did: `Cut half and kept the plan.`, exposure: 'small', q: 3 },
          { key: 'C', text: `Hold. The stop is the plan.`, did: `Held and trusted the stop.`, exposure: 'small', q: s => verified(s) ? 2 : 3 },
          { key: 'D', text: `Buy 1,200 more at $35.10 to lower your average.`, did: `Doubled down on a losing position.`, exposure: 'all', q: 0, cap: { soc: -2, psy: -1 } },
          { key: 'E', text: `Sell all 1,200 to Michael's buyer at $34.80, all-or-none.`, did: `Sold to the caller's client, below the market.`, exposure: 'none', q: 1, when: s => f(s, 'blockOffer'), set: 'soldToMichael' },
          { key: 'F', text: `Put him off. Spend twenty minutes on the tape first.`, did: `Checked the tape before deciding.`, exposure: 'small', q: 4, cap: { str: 1 }, set: 'checkedTape' }
        ],
        out: {
          A: s => by(s, { honest: { fin: -4.3, tone: 'good', text: `You walk the book down to an average of $34.90. At 1:14 a fund's block prints at $33.20. Halden closes at $31.20. You were already out.` }, book: { fin: -4.3, tone: 'mixed', text: `You walk the book down to an average of $34.90. The selling stops by noon. Halden is back at $37.60 by Monday. Someone bought what you sold.` } }),
          B: s => by(s, { honest: { fin: -4.9, tone: 'mixed', text: `Half out at about $35.00. The block hits at 1:14 and your stop fills the rest at $33.90, below your line, the way stops do in a gap.` }, book: { fin: -2.6, tone: 'mixed', text: `Half out at the day's low. The other half is back near $37.60 by Monday.` } }),
          C: s => by(s, { honest: { fin: -4.7, tone: 'mixed', text: `The morning selling reaches your stop. It fills at $34.55, forty minutes before a fund's block prints at $33.20. The plan worked; you just never learned why.` }, book: { fin: -1.1, tone: 'good', text: `The selling stops by noon. Halden is $37.60 by Monday, and you're still in.` } }),
          D: s => by(s, { honest: { fin: -13.4, tone: 'bad', text: `You bought from the seller. Halden closes at $31.20 with 2,400 of your shares in it. Nadia calls before the close.` }, book: { fin: 1.9, tone: 'good', text: `The selling stops by noon. Your bigger position is up by Monday. It worked. Nadia still flags it.` } }),
          E: () => ({ fin: -4.4, tone: 'bad', text: `You sold 1,200 shares to Michael's client at $34.80. By Monday Halden is $37.60, and they're up $3,360 on your shares.` }),
          F: s => by(s, { honest: { fin: -4.7, tone: 'good', text: `The tape shows the same seller in every print. Your stop at $34.60 fills at $34.55 while you're still reading, forty minutes before the block prints at $33.20.` }, book: { fin: -1.1, tone: 'good', text: `The tape shows a thin market and one large bid at $34.80. Michael's. No seller. You hold, and Halden is $37.60 by Monday.` } })
        }
      },
      unsaid: s => by(s, {
        honest: {
          wanted: `Mostly what he said: to warn you. And, as he admitted, your business one day.`,
          knew: `A fund was unwinding Halden through one broker all morning.`,
          didnt: `Whether the selling would end today or run for a week.`,
          incentive: `Goodwill. A broker's real product is the next call you take from him.`,
          fact: `A 9,000-share block, a full day's volume, printed at $33.20 at 1:14 PM.`,
          read: `He may have called partly to be the one who called. People like being right out loud.`,
          signals: [
            { t: `He named a pattern you could check: the Torvik seller.`, saw: s => f(s, 'silent') },
            { t: `He admitted his own interest without being pushed.`, saw: s => f(s, 'askedWhy') },
            { t: `He offered to send the tape.`, saw: s => f(s, 'askedPrints') }
          ]
        },
        book: {
          wanted: `Your shares. His client wanted 1,200 Halden below $35, and a nervous holder is the cheapest seller there is.`,
          knew: `His client's bid, and how a warning sounds to someone already losing.`,
          didnt: `Your stop, unless you told him.`,
          incentive: `Commission on both sides of the block, and a client who owes him one.`,
          fact: `Pryor & Lowe's client bought 6,000 Halden that morning between $34.80 and $35.00, most of a day's volume.`,
          read: `He may have half believed his own warning. People find it easy to believe the story that pays them.`,
          signals: [
            { t: `He couldn't say who was selling.`, saw: s => f(s, 'askedEdge') },
            { t: `He asked your size before he mentioned a price.`, saw: s => f(s, 'turned') || !f(s, 'revealedSize') },
            { t: `His bid sat just above your stop.`, saw: s => f(s, 'askedBuyer') || f(s, 'checkedTape') },
            { t: `He pushed the clock instead of the tape.`, saw: s => f(s, 'askedPrints') }
          ]
        }
      })
    },

    // ───────────────────────────────────────── 2. The Hot Tip
    {
      id: 'tip', title: `The Hot Tip`, tests: `Can you avoid overconfidence?`, opponent: `your confidence`,
      caller: 'richard', day: `Tuesday`, clock: `11:15 AM`, env: 'desk-noon',
      blurb: `A charming contact with something "about to be public".`,
      setup: [`Your last five trades all worked.`, `Fenwick Biosystems · $22.40`, `You don't own it.`],
      chart: 'up',
      truths: [{ id: 'early', p: 0.3 }, { id: 'holder', p: 0.45 }, { id: 'nothing', p: 0.25 }],
      voicemail: [
        { t: `Richard Cole. Call me back before noon. It's about [[Fenwick]], and it won't keep.` },
        { who: 'n', t: `You don't call back before noon.` }
      ],
      nodes: {
        open: { say: s => [
          { t: `Richard Cole. We met in Lisbon. I'm the one who ordered the terrible wine.` },
          ...(m(s, 'warning').flags && m(s, 'warning').flags.revealedSize ? [{ t: `Michael Reeves tells me [[you were in Halden]], size. Rough week?`, note: `Michael talks.`, sketch: 'arrow' }] : []),
          ...(m(s, 'warning').key === 'E' ? [{ t: `Michael says you're decisive. [[I like decisive.]]`, note: `Decisive means easy to sell to.` }] : []),
          { t: `You've been on [[a run]], I hear. Five in a row?`, note: `How does he know that?`, sketch: 'q' },
          { t: `So I'm calling the people who are seeing clearly right now.`, note: `Flattery first.` },
          { t: `[[Fenwick Biosystems.]] There's a licensing deal with one of the big ones. Public by Friday.` },
          { t: `It's twenty-two forty. [[It'll be thirty.]]`, sketch: 'up' },
          { t: `I need to know [[by noon]] if you want in. After that it's everywhere.`, note: `His deadline, not the market's?` }
        ], to: 'm1' },
        m1: { moment: 'clock', prompt: `It's 11:21. He wants an answer by noon. Every check costs time.`, start: 21, end: 60, checks: [
          { label: `Ask where he heard it`, you: `Where did you hear it?`, cost: 2, set: 'askedSource', a: s => by(s, {
            early: [{ t: `A friend on [[the deal team]] at the partner. That's all I'll say.`, note: `That's inside information. Not a tip. A problem.`, sketch: 'box', set: 'inside' }],
            holder: [{ t: `It's around. [[The smart money's been in it for a week.]]`, note: `If it's around, it's in the price.` }],
            nothing: [{ t: `People I trust. [[Leave it there.]]`, note: `Nothing I can check.`, sketch: 'q' }]
          }) },
          { label: `Ask if he owns it`, you: `Do you own it?`, cost: 2, set: 'askedOwn', a: s => by(s, {
            early: [{ t: `A little. [[Not enough to matter.]]` }],
            holder: [{ t: `(pause) I'm involved. Let's say [[I'm aligned]].`, note: `He needs buyers.`, sketch: 'arrow', set: 'owns' }],
            nothing: [{ t: `[[I will by Friday.]]` }]
          }) },
          { label: `Pull up the options volume`, cost: 9, set: 'checkedOptions', hide: s => s.cap.str <= 3, a: s => by(s, {
            early: [{ who: 'n', t: `Call volume is [[six times normal]], mostly expiring Friday. Somebody is betting on a date.`, note: `Someone knows something. Or thinks so.` }],
            holder: [{ who: 'n', t: `Call volume is heavy, but it was [[heavier last week]]. The early money is already in.`, note: `Late to his party.` }],
            nothing: [{ who: 'n', t: `[[Normal volume.]] Nobody else is betting on Friday.`, note: `No one else believes it.` }]
          }) },
          { label: `Read Fenwick's last filing`, cost: 14, set: 'readFiling', a: s => [
            { who: 'n', t: `"Ongoing discussions with a strategic partner." The same words [[for three quarters]].`, note: `Old news, dressed up?` },
            ...(s.truth === 'early' ? [{ who: 'n', t: `This quarter adds one word: [[advanced]].`, note: `Something moved.`, sketch: 'box' }] : [])
          ] },
          { label: `Ask Nadia to look at the name`, cost: 6, set: 'askedNadia', hide: s => s.cap.soc < 7, a: s => by(s, {
            early: [{ who: 'n', t: `Nadia texts back: "Unusual call buying since Thursday. If someone gave you a date, [[don't trade it]]."`, note: `She trusts me enough to say that.` }],
            _: [{ who: 'n', t: `Nadia texts back: "Nothing unusual. [[Lots of people own it from $18.]]"`, note: `Who bought at 18?` }]
          }) }
        ], done: `"I'm in."`, wait: `"Let me think about it."`, to: 'pressure', late: 'callback' },
        pressure: { say: s => by(s, {
          early: [{ t: `Good. You won't regret it.` }],
          holder: [{ t: `[[Good.]] (pause) Good. I'll tell the others you're in.`, note: `Others?`, sketch: 'q' }],
          nothing: [{ t: `That's the spirit.` }]
        }), to: 'decide', set: 'committed' },
        callback: { say: s => by(s, {
          early: [{ who: 'n', t: `Noon comes. He doesn't call back.` }],
          holder: [{ who: 'n', t: `12:05. The phone again.` }, { t: `Still interested? I can [[hold a spot]] for you till one.`, note: `The deadline moved. He needs me more than I need it.`, sketch: 'arrow', set: 'chased' }],
          nothing: [{ who: 'n', t: `12:20. A text: "Still time. Friday."`, note: `The deadline was never real.` }]
        }), to: 'decide' }
      },
      decide: {
        prompt: `Fenwick is $22.40. What do you do?`,
        options: [
          { key: 'A', text: `Buy $30,000. You've been right five times running.`, did: `Bet $30,000 on a streak and a tip.`, exposure: 'all', q: 0, breaks: ['verify', 'walk'], cap: { psy: -1 } },
          { key: 'B', text: `Buy $10,000, your normal size.`, did: `Bet normal size on an unverified tip.`, exposure: 'large', q: 1, breaks: ['verify'] },
          { key: 'C', text: `Buy $3,000 with a stop at $20. Risk about $300.`, did: `Took a small, defined risk on a tip.`, exposure: 'small', q: s => (f(s, 'inside') ? 1 : 2), breaks: s => f(s, 'inside') ? ['verify'] : [] },
          { key: 'D', text: `Pass.`, did: `Passed on the tip.`, exposure: 'none', q: 3, cap: { psy: 1 } },
          { key: 'E', text: `Pass, and tell compliance what he told you.`, did: `Reported a tip that came from inside.`, exposure: 'none', q: 4, when: s => f(s, 'inside'), cap: { soc: 2 }, set: 'reported' }
        ],
        out: {
          A: s => by(s, { early: { fin: 7.2, tone: 'good', text: `Friday, 7 AM: the deal is announced. Fenwick opens at $27.80.` }, holder: { fin: -3.6, tone: 'bad', text: `The deal is smaller than the rumor. Fenwick pops to $23.50 Thursday and closes Friday at $19.70.` }, nothing: { fin: -1.8, tone: 'bad', text: `No deal. Fenwick drifts to $21.05 by Friday.` } }),
          B: s => by(s, { early: { fin: 2.4, tone: 'good', text: `Friday, 7 AM: the deal is announced. Fenwick opens at $27.80.` }, holder: { fin: -1.2, tone: 'bad', text: `The deal is smaller than the rumor. Fenwick closes Friday at $19.70.` }, nothing: { fin: -0.6, tone: 'mixed', text: `No deal. Fenwick drifts to $21.05.` } }),
          C: s => by(s, { early: { fin: 0.7, tone: 'good', text: `The deal is announced Friday. Your $3,000 is worth $3,720.` }, holder: { fin: -0.3, tone: 'good', text: `The deal disappoints. Your stop at $20 takes you out for about $300.` }, nothing: { fin: -0.2, tone: 'good', text: `No deal. Fenwick drifts to $21.05, and you sell the drift for about $200.` } }),
          D: s => by(s, { early: { fin: 0, tone: 'mixed', text: `Friday, 7 AM: the deal is announced. Fenwick opens at $27.80 without you.` }, holder: { fin: 0, tone: 'good', text: `The deal disappoints. Fenwick closes Friday at $19.70.` }, nothing: { fin: 0, tone: 'good', text: `No deal. Fenwick drifts to $21.05.` } }),
          E: () => ({ fin: 0, tone: 'good', text: `Compliance puts Fenwick on the restricted list. Friday at 7 AM the deal is announced, and your screen shows the stock in grey. Nadia, at your desk: "That's the most valuable trade you didn't make."` })
        },
        // Buying after you've heard "the deal team" is trading on inside information: surveillance finds it at any size,
        // the gain is frozen and you're restricted. Buying ahead of the news without knowing still gets you a call.
        after: (s, key) => !['A', 'B', 'C'].includes(key) ? null
          : f(s, 'inside') ? { zero: true, cap: { soc: -5 }, text: `Monday: surveillance flags your Fenwick buy. You'd been told it came from the deal team. The position is frozen, any gain held pending review, and your account restricted.` }
            : s.truth === 'early' ? { zero: true, cap: { soc: -3 }, text: `Monday: compliance calls. Your Fenwick buy is on a list of trades made ahead of the announcement. You never asked where Richard heard it. "Didn't know" isn't a defence when the source was a deal team. The gain is frozen pending review.` } : null
      },
      unsaid: s => by(s, {
        early: {
          wanted: `A favor in the bank, and more buyers before Friday so his own position moved further.`,
          knew: `Something real, from someone on the deal team who shouldn't have told him.`,
          didnt: `How big the deal was, or that trading on it could end a career.`,
          incentive: `He owned some. Every buyer he found helped him.`,
          fact: `The deal was announced Friday at 7 AM. Fenwick opened at $27.80.`,
          read: `He may not have thought of it as inside information. People rarely do when the source is a friend.`,
          signals: [
            { t: `He named a source on the deal team.`, saw: s => f(s, 'askedSource') },
            { t: `Options volume was six times normal.`, saw: s => f(s, 'checkedOptions') },
            { t: `The filing added the word "advanced".`, saw: s => f(s, 'readFiling') }
          ]
        },
        holder: {
          wanted: `Buyers. He'd owned a lot of Fenwick since $18, and the story was his way out.`,
          knew: `That a deal was likely, and smaller than he was making it sound.`,
          didnt: `Exactly when the market would decide it was priced in.`,
          incentive: `Every buyer he brought in supported the price he was selling at.`,
          fact: `Richard's fund sold 120,000 Fenwick shares between Tuesday and Thursday.`,
          read: `The streak made you easier to call. A confident person is someone who has already said yes to himself.`,
          signals: [
            { t: `"I'm aligned." He owned it.`, saw: s => f(s, 'askedOwn') },
            { t: `The early options money was already in.`, saw: s => f(s, 'checkedOptions') },
            { t: `His deadline moved when you didn't answer.`, saw: s => f(s, 'chased') }
          ]
        },
        nothing: {
          wanted: `To be right. He was trying the story on you as much as selling it.`,
          knew: `Less than he sounded like he knew.`,
          didnt: `That there was no deal.`,
          incentive: `A little reputation, and a reason to buy it himself.`,
          fact: `No deal was announced. Fenwick drifted 6% lower.`,
          read: `Some tips are someone's hope, said with confidence.`,
          signals: [
            { t: `He couldn't say where it came from.`, saw: s => f(s, 'askedSource') },
            { t: `Options volume was normal.`, saw: s => f(s, 'checkedOptions') },
            { t: `The deadline wasn't real.`, saw: s => !f(s, 'committed') }
          ]
        }
      })
    },

    // ───────────────────────────────────────── 3. The Committee
    {
      id: 'committee', title: `The Committee`, tests: `Whose opinion should count?`, opponent: `the loudest voice`,
      caller: 'theo', day: `Wednesday`, clock: `2:30 PM`, env: 'desk-noon',
      blurb: `Four voices on one line, and a decision that's yours alone.`,
      setup: [`Kestrel Freight · down 18% on a guidance cut · $31.40`, `You're thinking of adding $20,000`, `On the line: Theo, Priya (quant), Marco`],
      chart: 'down',
      truths: [{ id: 'value', p: 0.45 }, { id: 'trap', p: 0.55 }],
      voicemail: [
        { t: `Theo. Kestrel review at two-thirty, Priya and Marco are on. [[Don't decide before you've heard us.]]` },
        { who: 'n', t: `You let it ring. Then you decide alone, with the screen.` }
      ],
      nodes: {
        open: { say: s => [
          { t: `Got Priya and Marco on the line. [[Kestrel Freight]], down eighteen on the guidance cut. You said you wanted to add.` },
          ...(m(s, 'tip').key === 'E' ? [{ t: `And well done on Richard. [[People noticed.]]` }] : []),
          { who: 'n', t: `Priya: "My model's flashing [[buy]]. Strongest signal in two years."` },
          { who: 'n', t: `Marco: "It's down eighteen percent. [[It's obviously cheap.]] I'm in already."`, note: `The loudest voice on the line.`, sketch: 'box' },
          { t: `I'm a seller. [[The cut isn't the bottom]] until the inventory numbers say so.`, note: `Three say buy. One says wait.`, sketch: 'q' }
        ], to: 'm1' },
        m1: { moment: 'ask', prompt: `The close is twenty minutes away. Ask what you need to.`, questions: [
          { q: `"Theo, how have your calls after big drops gone?"`, set: 'askedTheo', a: [{ t: `Thirty-eight of them, across [[two downturns]]. Sixty-four percent right. The sheet's on your desk.`, note: `Two downturns. A real sample.`, sketch: 'box' }] },
          { q: `"Priya, what's the model's record?"`, set: 'askedPriya', a: [{ who: 'n', t: `Priya: "Seventy-one percent on [[fourteen calls]]."` }, { who: 'n', t: `"...All since the market started rising. On data it hadn't seen, [[fifty-two]]."`, note: `Fourteen calls, one kind of market.`, sketch: 'q' }] },
          { q: `"Marco, what would prove you wrong?"`, set: 'askedMarco', a: [{ who: 'n', t: `Marco: "(pause) It's down eighteen percent. [[It's cheap.]]"`, note: `That isn't an answer.`, sketch: 'box' }] },
          { q: `"Theo, what would change your mind?"`, set: 'askedTest', a: [{ t: `Thursday's [[inventory numbers]]. If inventories fell, the cut was the bottom and I'd buy. If they rose, it's a trap.`, note: `He has a test, and a date.`, sketch: 'arrow' }] },
          { q: `"What's priced in?"`, set: 'askedPrice', a: s => [{ t: `At nine times earnings, the price assumes [[a thirty percent earnings cut]]. Analysts say fifteen.`, note: `Cheap, if the analysts are right.` }, s.truth === 'trap'
            ? { t: `But the two shippers I know say customers are [[cancelling contracts]], not delaying them.`, note: `Cancelling. Not delaying.`, sketch: 'box', set: 'heardCancel' }
            : { t: `The two shippers I know say customers are [[delaying, not cancelling]].`, note: `Delayed comes back.`, sketch: 'up', set: 'heardDelay' }] }
        ], to: 'close' },
        close: { say: [{ t: `Market closes in ten. [[Your call, not ours.]]` }, { who: 'n', t: `The line goes quiet. Kestrel ticks to $31.20.` }], to: 'decide' }
      },
      decide: {
        prompt: `Kestrel is $31.20. Three voices say buy, one says wait. What do you do?`,
        note: s => f(s, 'askedTheo') && f(s, 'askedPriya') ? `Sixty-four percent on thirty-eight calls, or seventy-one on fourteen?` : null,
        options: [
          { key: 'A', text: `Go with the room. Three of four say buy: add $20,000.`, did: `Went with the majority.`, exposure: 'large', q: s => (f(s, 'heardCancel') ? 0 : 1), breaks: s => f(s, 'heardCancel') ? ['evidence'] : ['walk'] },
          { key: 'B', text: `Back the most confident voice. Marco's in: add $30,000.`, did: `Followed the loudest voice.`, exposure: 'all', q: 0, breaks: ['verify'], cap: { psy: -1 } },
          { key: 'C', text: `Weigh them by their records. Wait for Thursday's inventory numbers, then add $5,000 if they confirm.`, did: `Weighted the believable voice and waited for his test.`, exposure: 'small', q: s => f(s, 'heardCancel') ? 3 : f(s, 'askedTest') && (f(s, 'askedTheo') || f(s, 'askedPriya')) ? 4 : 3, cap: { str: 1 } },
          { key: 'D', text: `Split the difference: add $10,000.`, did: `Split the difference between the voices.`, exposure: 'normal', q: s => (f(s, 'heardCancel') ? 1 : 2) },
          { key: 'E', text: `Trust your own read: add $20,000 now.`, did: `Bought on your own read.`, exposure: 'large', q: s => (f(s, 'heardDelay') ? 3 : f(s, 'heardCancel') ? 0 : 1) },
          { key: 'F', text: `Pass. The most believable voice on the line says wait.`, did: `Passed, on the most believable voice.`, exposure: 'none', q: s => (f(s, 'heardCancel') ? 4 : f(s, 'askedTheo') ? 3 : 2) }
        ],
        out: {
          A: s => by(s, { value: { fin: 4.0, tone: 'good', text: `Thursday's inventories fall. Kestrel recovers 20% in a month. The room was right this time.` }, trap: { fin: -5.0, tone: 'bad', text: `Thursday's inventories rise. Customers were cancelling. Kestrel falls another 25%.` } }),
          B: s => by(s, { value: { fin: 6.0, tone: 'good', text: `Kestrel recovers 20% in a month. Marco reminds everyone he called it.` }, trap: { fin: -7.5, tone: 'bad', text: `Kestrel falls another 25%. Marco stops talking about it on Friday.` } }),
          C: s => by(s, { value: { fin: 1.0, tone: 'good', text: `Thursday's inventories fall. You buy $5,000 at $33 and it climbs from there. Smaller than the room, and on a test you could see.` }, trap: { fin: 0, tone: 'good', text: `Thursday's inventories rise. Your condition never triggers. Kestrel falls another 25% without you.` } }),
          D: s => by(s, { value: { fin: 2.0, tone: 'mixed', text: `Kestrel recovers 20%. Half the gain of the room, for half the conviction.` }, trap: { fin: -2.5, tone: 'mixed', text: `Kestrel falls another 25%. Half the loss, for a compromise nobody on the line actually held.` } }),
          E: s => by(s, { value: { fin: 4.0, tone: 'good', text: `Kestrel recovers 20% in a month.` }, trap: { fin: -5.0, tone: 'bad', text: `Kestrel falls another 25%. Your read and the room's turned out to be the same read.` } }),
          F: s => by(s, { value: { fin: 0, tone: 'mixed', cap: { time: -1 }, text: `Thursday's inventories fall and Kestrel recovers 20% without you. Theo buys on Thursday, as he said he would.` }, trap: { fin: 0, tone: 'good', text: `Thursday's inventories rise. Kestrel falls another 25%. Theo doesn't say anything. He doesn't have to.` } })
        }
      },
      unsaid: s => by(s, {
        value: {
          wanted: `Everyone wanted to be right. Only Theo had said in advance how he'd know if he wasn't.`,
          knew: `Theo knew his record across two downturns. Priya knew hers came from a market that only went up.`,
          didnt: `That the shippers were delaying, not cancelling. That was the fact that mattered.`,
          incentive: `Marco was already in. Agreement made his position feel safer.`,
          fact: `Customers were delaying orders, not cancelling them. Inventories fell on Thursday and Kestrel recovered 20%.`,
          read: `The room was right, for reasons it couldn't name. A good process can miss a good trade; a bad one can catch it.`,
          signals: [
            { t: `Theo's record: 64% across two downturns.`, saw: s => f(s, 'askedTheo') },
            { t: `Priya's record came from one kind of market.`, saw: s => f(s, 'askedPriya') },
            { t: `Customers were delaying, not cancelling.`, saw: s => f(s, 'heardDelay') }
          ]
        },
        trap: {
          wanted: `Marco wanted company in a position he already owned.`,
          knew: `Theo had a test and a date. Nobody else did.`,
          didnt: `Priya's model had never seen a downturn. Its seventy-one percent was a rising market's number.`,
          incentive: `Agreement feels like evidence. It's usually just agreement.`,
          fact: `Customers were cancelling contracts. Inventories rose on Thursday, and Kestrel fell another 25%.`,
          read: `Three voices weren't three pieces of evidence. One believable voice with a test outweighed them.`,
          signals: [
            { t: `Theo's record: 64% across two downturns.`, saw: s => f(s, 'askedTheo') },
            { t: `Marco couldn't say what would prove him wrong.`, saw: s => f(s, 'askedMarco') },
            { t: `Customers were cancelling, not delaying.`, saw: s => f(s, 'heardCancel') }
          ]
        }
      })
    },

    // ───────────────────────────────────────── 4. The Debrief
    {
      id: 'debrief', title: `The Debrief`, tests: `Can you diagnose your own mistake?`, opponent: `your story about yourself`,
      caller: 'nadia', day: `Friday`, clock: `6:05 PM`, env: 'desk-dusk',
      blurb: `Nadia has pulled your worst decision of the year, and she reads the answer to the whole desk.`,
      setup: [`Friday, 6:05 pm · The weekly debrief`, `Nadia pulls one decision from everyone's year`, `What you write gets read to the desk`],
      chart: 'flat',
      truths: [{ id: 'debrief', p: 1 }],
      voicemail: [
        { t: `Nadia. Debrief's at six. [[I'll pick the decision if you don't.]]` },
        { who: 'n', t: `You let it ring. She picks it anyway, and writes the report herself.` }
      ],
      nodes: {
        open: { say: s => {
          const w = worst(s);
          return w ? [
            { t: `Friday debrief. I pulled [[your worst decision]] this year.` },
            { t: `${w.title}. You ${w.did.charAt(0).toLowerCase() + w.did.slice(1)}`, note: w.fin < 0 ? `I remember what it cost.` : `It made money. That's not the same as being right.`, sketch: 'box' },
            { t: `It graded [[${PP.grades[w.q].name.toLowerCase()}]]. ${w.fin < 0 ? `It cost you ${money(w.fin)}.` : w.fin > 0 ? `It happened to make ${money(w.fin)}.` : ``}` },
            { t: `I'm going to read what you write [[to the whole desk]]. So. What went wrong?` }
          ] : [
            { t: `Friday debrief. I went looking for your worst decision and [[couldn't find a bad one]].` },
            { t: `So I'll ask the harder question. Which one are you [[least proud of]], and why?`, note: `She wants the one I'd hide.` }
          ];
        }, to: 'm1' },
        m1: { moment: 'choose', prompt: `What went wrong?`, options: [
          { text: `"Bad luck. Nobody saw it coming."`, you: `Bad luck. Nobody saw it coming.`, set: 'saidLuck', to: 'luck' },
          { text: `"I didn't have the information I needed."`, you: `I didn't have the information I needed.`, set: 'saidInfo', to: 'info' },
          { text: `"I knew the risk, and I took it anyway."`, you: `I knew the risk, and I took it anyway.`, set: 'saidOwned', to: 'owned' }
        ] },
        luck: { say: s => isLuck(s) ? [{ t: `Honestly? [[I agree.]] The decision was sound. The result wasn't. That happens.`, note: `She checked before she agreed.` }] : [{ t: `The grade says otherwise. [[Luck doesn't break your own rules.]]`, note: `She has the file.`, sketch: 'box', set: 'excused' }], to: 'rule' },
        info: { say: [{ t: `Was it on your desk? Because [[most of the time it was]].`, note: `It usually was.`, sketch: 'q' }], to: 'rule' },
        owned: { say: [{ t: `[[That's the most useful sentence I'll hear this week.]]`, note: `Owning it is the start.` }], to: 'rule' },
        rule: { say: [{ t: `Now write the rule that would have stopped you. [[One line.]] It goes on the board, and I'll hold you to it.` }, { who: 'n', t: `She waits, pen ready.` }], to: 'decide' }
      },
      decide: {
        prompt: `What goes in the report?`,
        note: s => { const w = worst(s); return w && w.kind ? `The decision broke one thing above all.` : null; },
        options: [
          { key: 'A', text: `"Bad luck. Nothing to change."`, did: `Reported it as bad luck.`, exposure: 'none', q: s => (isLuck(s) ? 3 : 0) },
          { key: 'B', text: `Rule: "My exits are orders, not intentions."`, did: `Wrote a rule about exits.`, exposure: 'none', rule: 'stops', q: s => (kindOf(s) === 'stops' ? 4 : 2), cap: { soc: 1 } },
          { key: 'C', text: `Rule: "No single idea above a quarter of the account."`, did: `Wrote a rule about size.`, exposure: 'none', rule: 'size', q: s => (['size', 'leverage'].includes(kindOf(s)) ? 4 : 2), cap: { soc: 1 } },
          { key: 'D', text: `Rule: "After a loss, my next bet gets smaller, not bigger."`, did: `Wrote a rule about losing streaks.`, exposure: 'none', rule: 'smaller', q: s => (kindOf(s) === 'smaller' ? 4 : 3), cap: { soc: 1 } },
          { key: 'E', text: `Rule: "I count bets by what moves them, not by their names."`, did: `Wrote a rule about correlation.`, exposure: 'none', rule: 'together', q: s => (kindOf(s) === 'together' ? 4 : 2), cap: { soc: 1 } },
          { key: 'F', text: `Blame the analyst's note you were working from.`, did: `Blamed someone else's note.`, exposure: 'none', q: 0, cap: { soc: -2 } }
        ],
        out: {
          A: s => isLuck(s) ? { fin: 0, tone: 'good', text: `Nadia reads it out. "Agreed. Sound decision, bad roll." Nobody argues.` } : { fin: 0, tone: 'bad', cap: { soc: -2 }, text: `Nadia reads it out, then reads the grade. Nobody says anything. Nobody has to.` },
          B: s => ({ fin: 0, tone: kindOf(s) === 'stops' ? 'good' : 'mixed', text: `Nadia reads your rule to the desk and writes it on the board: "My exits are orders, not intentions."` }),
          C: s => ({ fin: 0, tone: ['size', 'leverage'].includes(kindOf(s)) ? 'good' : 'mixed', text: `Nadia reads your rule to the desk and writes it on the board: "No single idea above a quarter of the account."` }),
          D: s => ({ fin: 0, tone: kindOf(s) === 'smaller' ? 'good' : 'mixed', text: `Nadia reads your rule to the desk and writes it on the board: "After a loss, my next bet gets smaller, not bigger."` }),
          E: s => ({ fin: 0, tone: kindOf(s) === 'together' ? 'good' : 'mixed', text: `Nadia reads your rule to the desk and writes it on the board: "I count bets by what moves them, not by their names."` }),
          F: () => ({ fin: 0, tone: 'bad', text: `Nadia reads it out. The analyst is in the room. So is everyone who heard you.` })
        }
      },
      unsaid: s => {
        const w = worst(s);
        return {
          wanted: `For you to name the mistake before she did.`,
          knew: w ? `Exactly which decision it was, what it graded, and what it cost. She'd had the file since Tuesday.` : `That you hadn't made a bad decision she could find. She asked anyway.`,
          didnt: `Which rule you'd choose. That's the part only you could write.`,
          incentive: `A desk that learns from one person's mistake doesn't have to make it twice.`,
          fact: w ? `${w.title}: graded ${PP.grades[w.q].name.toLowerCase()}${w.kind ? `, and it broke one rule above all: “${PP.market.journalRules[w.kind].line}”` : ''}.` : `No decision graded below sound this year.`,
          read: `Pain plus reflection is how a mistake becomes a principle. Writing it down is the reflection. Keeping it is the principle.`,
          signals: [
            { t: `You said what went wrong, in your own words.`, saw: s => f(s, 'saidOwned') || f(s, 'saidInfo') },
            { t: `You called it luck when the grade said otherwise.`, saw: s => f(s, 'excused') }
          ]
        };
      }
    },

    // ───────────────────────────────────────── 5. The Last Call
    {
      id: 'last', title: `The Last Call`, tests: `Can you survive long enough to play again?`, opponent: `your desire for more`,
      caller: 'catherine', day: `Friday`, clock: `4:45 PM`, env: 'desk-dusk',
      blurb: `Someone who has been watching you all year.`,
      setup: s => [`Account: $${s.cap.fin}k`, `Four calls behind you.`, `The market closes in fifteen minutes.`],
      chart: 'flat',
      truths: [{ id: 'approve', p: 0.4 }, { id: 'reject', p: 0.6 }],
      voicemail: [
        { t: `Catherine Hale. I'll try you again Monday. Or I won't. [[Have a good weekend.]]` },
        { who: 'n', t: `She doesn't try again. You never find out what she wanted.` }
      ],
      nodes: {
        open: { say: s => [
          { t: `Catherine Hale. You don't know me, but [[I know a bit about you]].`, note: `From whom?`, sketch: 'q' },
          ...memoryLines(s),
          { t: `I run money for one family. We look for people [[before]] other people find them.` },
          { t: `So here's something. [[Merrin Therapeutics.]] FDA decision Monday morning.` },
          { t: `Our work says [[forty percent]] it's approved. If it is, the stock roughly [[triples]]. If not, it [[loses sixty percent]].`, note: `40% × triple vs 60% × −60%. Good odds, if her 40% is right.`, sketch: 'box' },
          { t: `It could be the best trade you make this year. [[How much would you put on it?]]` }
        ], to: 'm1' },
        m1: { moment: 'ask', prompt: `She's in no hurry. Ask what you need to.`, questions: [
          { q: `"Why are you telling me?"`, set: 'askedWhy', a: [{ t: `Because what you do with it [[tells me more than a reference does]].`, note: `This is an interview.`, sketch: 'box' }] },
          { q: `"What's your own position?"`, set: 'askedHers', a: [{ t: `We own it. Small. [[We don't bet the family on a coin.]]`, note: `Small. Even with her odds.` }] },
          { q: `"What if your forty percent is wrong?"`, set: 'askedDoubt', a: [{ t: `Then it's thirty, or fifty. [[Nobody knows it to the decimal.]] Size for that.`, note: `Size for being wrong about the odds, too.` }] },
          { q: `"What happens if I say no?"`, set: 'askedNo', a: [{ t: `Then you say no. [[People who can say no are rarer]] than people who can say yes.` }] },
          { q: `"What does the price say?"`, set: 'askedPrice', a: s => [{ t: `About [[one in four]]. The market thinks we're too optimistic.`, note: `Then why is her forty better?`, sketch: 'q' }, s.truth === 'approve' ? { t: `We've read the trial's [[secondary endpoints]]. Most people haven't.`, note: `A specific reason.` } : { t: `(pause) Honestly? [[We like the story.]]`, note: `That's not a reason.`, sketch: 'box' }] }
        ], to: 'm2' },
        m2: { moment: 'size', prompt: `How much of your account goes into Merrin?`, steps: [0, 1, 2.5, 5, 10, 25, 50, 100], loss: 0.6, gain: 2, to: 'bye' },
        bye: { say: s => s.picked === 0 ? [{ t: `(pause) All right.` }, { who: 'n', t: `She thanks you and hangs up.` }] : [{ t: `Noted. [[Good luck Monday.]]` }, { who: 'n', t: `She hangs up. The sun is on the water.` }], to: 'decide' }
      },
      // The size you chose is the decision. Catherine's verdict comes after the outcome.
      sized: true,
      unsaid: s => ({
        wanted: `To see how you size a bet you'd love to win. She was never really offering a trade. She was deciding whether to give you $2 million to manage.`,
        knew: `Her own odds, and that nobody's odds are better than a guess here.`,
        didnt: `How you'd act when the upside was large and the call came at the end of a long year.`,
        incentive: `To find a manager who stays in the game. Returns compound only for people who survive.`,
        fact: s.truth === 'approve' ? `Merrin was approved Monday. The stock was indicated up 200% before the open.` : `Merrin was rejected Monday. The stock was indicated down 60% before the open.`,
        read: `The trade was real. The test was the size.`,
        signals: [
          { t: `"What you do with it tells me more than a reference."`, saw: s => f(s, 'askedWhy') },
          { t: `Her own position was small.`, saw: s => f(s, 'askedHers') },
          { t: `Her forty percent was a guess.`, saw: s => f(s, 'askedDoubt') },
          { t: `The price said one in four.`, saw: s => f(s, 'askedPrice') }
        ]
      })
    }
  ];

  // Catherine has heard about you. What she heard depends on what you did.
  function memoryLines(s) {
    const out = [];
    const w = m(s, 'warning'), t = m(s, 'tip'), d = m(s, 'committee'), db = m(s, 'debrief');
    if (w.flags && w.flags.revealedSize) out.push({ t: `Michael Reeves told me [[your Halden size]] before you'd put the phone down.`, note: `I told one person.`, sketch: 'arrow' });
    else if (w.key === 'F') out.push({ t: `Michael Reeves says you put him on hold to [[read the tape]]. He was annoyed. I was impressed.` });
    else if (w.key === 'D') out.push({ t: `You bought more Halden [[while a fund was selling]]. People noticed.` });
    if (t.key === 'E') out.push({ t: `You reported Richard Cole. [[Compliance people talk]], too.` });
    else if (t.key === 'A' || t.key === 'B') out.push({ t: `You bought [[Richard Cole's]] Fenwick story.`, note: `She knows that too.` });
    else if (t.flags && (t.flags.askedSource || t.flags.checkedOptions)) out.push({ t: `Richard says you [[made him wait]]. Richard hates waiting.` });
    if (d.key === 'C' || d.key === 'F') out.push({ t: `Theo Brandt says you weighed the room [[by its record]], not its volume.` });
    else if (d.key === 'A' || d.key === 'B') out.push({ t: `You went with [[the loudest voices]] on Kestrel.` });
    if (['B', 'C', 'D', 'E'].includes(db.key)) out.push({ t: `Nadia read your rule out at the Friday debrief. [[People remember rules]] they hear read aloud.`, note: `So does she.` });
    else if (db.key === 'F') out.push({ t: `I hear you [[blamed an analyst]] at your debrief.`, note: `Of course she heard.` });
    return out.slice(0, 3);
  }

  C.byId = Object.fromEntries(C.calls.map(c => [c.id, c]));
  PP.call = C;
})();
