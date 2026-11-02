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
    david: { name: `David Mercer`, role: `Trader. Old colleague.`, voice: 'david', initials: 'DM' },
    sarah: { name: `Sarah Bennett`, role: `Portfolio manager, Coldwater Capital`, voice: 'sarah', initials: 'SB' },
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
          C: s => by(s, { honest: { fin: -5.5, tone: 'bad', text: `The block hits at 1:14. Your stop at $34.60 fills at $33.90.` }, book: { fin: -1.1, tone: 'good', text: `The selling stops by noon. Halden is $37.60 by Monday, and you're still in.` } }),
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
            : s.truth === 'early' ? { cap: { soc: -2 }, text: `Monday: compliance calls. Your Fenwick buy is on a list of trades made ahead of the announcement. You never asked where Richard heard it, which is what you tell them.` } : null
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

    // ───────────────────────────────────────── 3. The Silence
    {
      id: 'silence', title: `The Silence`, tests: `Can you wait for an edge?`, opponent: `your impatience`,
      caller: 'david', day: `Wednesday`, clock: `2:30 PM`, env: 'desk-noon',
      blurb: `A quiet market, and a friend who can't stand quiet.`,
      setup: [`Eight days without a trade.`, `Nothing has met your criteria.`, `Larkspur Energy broke $61 this morning · $62.30`],
      chart: 'flat',
      truths: [{ id: 'real', p: 0.45 }, { id: 'fake', p: 0.55 }],
      voicemail: [
        { t: `It's David. [[Larkspur's]] going. You're missing it. Call me.` },
        { who: 'n', t: `You let it go to voicemail and watch the screen.` }
      ],
      nodes: {
        open: { say: s => [
          { t: `You're alive! I was starting to think you'd retired.` },
          ...(m(s, 'tip').key === 'A' || m(s, 'tip').key === 'B' ? [{ t: `Heard you got into [[Richard Cole's]] Fenwick thing. Bold.`, note: `Everyone knows everything.`, sketch: 'arrow' }] : []),
          { t: `Have you seen [[Larkspur]]? It broke sixty-one this morning. Clean.`, sketch: 'up' },
          { t: `I'm in. I'm [[up four percent]] already.`, note: `He's selling me his own trade.` }
        ], to: 'm1' },
        m1: { moment: 'silence', prompt: `He waits for you to get excited.`, wait: 8, options: [
          { text: `"I've seen it."`, you: `I've seen it.`, to: 'arg1' },
          { text: `"Not my kind of setup."`, you: `It's not my kind of setup.`, set: 'namedEdge', to: 'argEdge' }
        ], silent: { set: 'silent1', to: 'quiet1' } },
        arg1: { say: [{ t: `So what are you waiting for? [[Everyone can see it.]]`, note: `If everyone sees it, where's my edge?`, sketch: 'q' }], to: 'm2' },
        argEdge: { say: [{ t: `Your setups don't come anymore. [[That's the point.]]`, note: `Maybe. Or maybe they're just rare.` }], to: 'm2' },
        quiet1: { say: [{ t: `...Okay, say something.` }, { t: `You've been flat [[eight days]]. You're getting rusty. That's how you lose your feel.`, note: `Is that true, or is it his fear?`, sketch: 'q' }], to: 'm2' },
        m2: { moment: 'silence', prompt: `He lets it hang there.`, wait: 9, options: [
          { text: `"Why do you need me in it?"`, you: `Why do you need me in it?`, set: 'askedWhy', to: 'why' },
          { text: `"Eight days flat isn't a problem."`, you: `Eight days flat isn't a problem.`, to: 'flat' },
          { text: `"How's the volume?"`, you: `How's the volume on the break?`, set: 'askedVolume', to: 'volume' }
        ], silent: { set: 'silent2', to: 'quiet2' } },
        why: { say: s => by(s, {
          real: [{ t: `I don't need you in it. I just [[hate watching people miss things]].`, note: `That's his problem, not mine.` }],
          fake: [{ t: `I don't need — (pause) Okay.` }, { t: `[[I've had a bad month.]] It'd be nice to be right with someone.`, note: `There it is.`, sketch: 'box', set: 'confessed' }]
        }), to: 'close' },
        flat: { say: [{ t: `It is when you're paid to trade.`, note: `He's paid to trade. I'm paid to be right.` }], to: 'close' },
        volume: { say: s => by(s, {
          real: [{ t: `[[Double the average]] on the break. That's real buying.`, note: `Evidence. Checkable.`, set: 'heardVolume' }],
          fake: [{ t: `(pause) It's the afternoon chop. [[Volume's always thin after two.]]`, note: `Thin volume on a breakout.`, sketch: 'q', set: 'heardThin' }]
        }), to: 'close' },
        quiet2: { say: s => by(s, {
          real: [{ t: `(sighs) Fine. Here's what nobody's saying: volume on the break was [[double the average]]. That's real buying.`, note: `He gave me the evidence because I didn't argue.`, set: 'heardVolume' }],
          fake: [{ t: `(quietly) I've had a terrible month. [[I need this one.]]`, note: `He's not recommending. He's hoping.`, sketch: 'box', set: 'confessed' }, { t: `Volume's thin, honestly. But it's the afternoon.`, set: 'heardThin' }]
        }), to: 'close' },
        close: { say: [{ t: `Anyway. It's not getting any cheaper.` }, { who: 'n', t: `Larkspur ticks to $62.40.` }], to: 'decide' }
      },
      decide: {
        prompt: `Larkspur is $62.40. Nothing on your own list. What do you do?`,
        note: s => s.cap.str >= 7 ? `Breakouts reward speed. Is that how you make money?` : null,
        options: [
          { key: 'A', text: `Join him: $25,000 of Larkspur at $62.40.`, did: `Chased a breakout because a friend was in it.`, exposure: 'large', q: 1, breaks: ['nochase'], cap: { psy: -1 } },
          { key: 'B', text: `A starter: $6,000 with a stop under $61. Risk about $150.`, did: `Took a small, defined starter.`, exposure: 'small', q: 3 },
          { key: 'C', text: `Wait. Buy only if it pulls back to $61 and holds.`, did: `Set a condition and waited for it.`, exposure: 'small', q: 3 },
          { key: 'D', text: `Pass. It isn't your setup.`, did: `Waited. Did nothing on purpose.`, exposure: 'none', q: 3 },
          { key: 'E', text: `Pass, and tell David to cut his size.`, did: `Passed, and told a friend the truth.`, exposure: 'none', q: s => (f(s, 'confessed') ? 4 : 3), cap: { soc: 1 }, set: 'warnedDavid' }
        ],
        out: {
          A: s => by(s, { real: { fin: 3.0, tone: 'good', text: `The breakout holds. Larkspur is $69.80 two weeks later.` }, fake: { fin: -2.1, tone: 'bad', text: `The breakout fails by Friday. Larkspur is back to $57.10.` } }),
          B: s => by(s, { real: { fin: 0.7, tone: 'good', text: `The breakout holds. Your starter is up 12%.` }, fake: { fin: -0.2, tone: 'good', text: `The breakout fails. Your stop takes you out for $150.` } }),
          C: s => s.truth === 'fake' ? { fin: 0, tone: 'good', text: `It falls through $61 and never holds. Your condition never triggers.` }
            : s.roll < 0.5 ? { fin: 0.8, tone: 'good', text: `Two days later it dips to $61.10 and holds. You buy there. It's $69.80 two weeks later.` }
              : { fin: 0, tone: 'mixed', cap: { time: -1 }, text: `It never comes back. Larkspur is $69.80 two weeks later, without you.` },
          D: s => by(s, { real: { fin: 0, tone: 'mixed', cap: { time: -1 }, text: `Larkspur is $69.80 two weeks later. Your account didn't move. Neither did your year.` }, fake: { fin: 0, tone: 'good', text: `The breakout fails. Larkspur is back to $57.10 by Friday.` } }),
          E: s => by(s, { real: { fin: 0, tone: 'mixed', cap: { time: -1 }, text: `David cuts half and grumbles. Larkspur runs to $69.80. He's still glad you said it.` }, fake: { fin: 0, tone: 'good', text: `David cuts half. The breakout fails on Friday. He sends you a bottle of something expensive.` } })
        }
      },
      unsaid: s => by(s, {
        real: {
          wanted: `Company. He wanted to be right with someone watching.`,
          knew: `The volume on the break was real. He only said so when you stopped arguing.`,
          didnt: `That his trade was good, rather than lucky. He couldn't tell either.`,
          incentive: `Nothing in money. A lot in feeling.`,
          fact: `Volume on the break was double the 20-day average. The breakout held.`,
          read: `Waiting wasn't wrong here, and joining wasn't wrong either. The question was whether it was your kind of trade.`,
          signals: [
            { t: `The volume was real.`, saw: s => f(s, 'heardVolume') },
            { t: `He didn't need you. He just hated missing things.`, saw: s => f(s, 'askedWhy') }
          ]
        },
        fake: {
          wanted: `A partner in a trade he was afraid of. He'd had a terrible month.`,
          knew: `That the volume was thin.`,
          didnt: `That he was looking for reassurance, not a second opinion.`,
          incentive: `To feel normal again. Being right with someone makes losing alone feel less likely.`,
          fact: `Volume on the break was below average. The breakout failed by Friday.`,
          read: `Most pressure to act comes from someone else's discomfort with waiting.`,
          signals: [
            { t: `"I've had a bad month."`, saw: s => f(s, 'confessed') },
            { t: `The volume was thin.`, saw: s => f(s, 'heardThin') },
            { t: `He argued from feeling, not evidence.`, saw: s => f(s, 'silent1') || f(s, 'namedEdge') }
          ]
        }
      })
    },

    // ───────────────────────────────────────── 4. The Changing Market
    {
      id: 'shift', title: `The Changing Market`, tests: `Can you abandon your assumptions?`, opponent: `your assumptions`,
      caller: 'sarah', day: `Thursday`, clock: `9:05 AM`, env: 'desk-rain',
      blurb: `A respected fund manager says your method has stopped working.`,
      setup: [`Your method: buy quality stocks after sharp dips.`, `It has worked for fourteen months.`, `Last three dips: −2%, −3%, +0.5%`],
      chart: 'turn',
      truths: [{ id: 'regime', p: 0.6 }, { id: 'blip', p: 0.4 }],
      voicemail: [
        { t: `Sarah Bennett, Coldwater Capital. I think [[dip-buying has stopped working]] in your sector. I'd like to be wrong. Call me.` },
        { who: 'n', t: `You don't. The rain keeps on.` }
      ],
      nodes: {
        open: { say: s => [
          { t: `Sarah Bennett. Sorry it's early.` },
          ...(m(s, 'silence').key === 'E' ? [{ t: `David Mercer says [[you talked him out of Larkspur]]. He's grateful, which is a first.`, note: `So that's how she knows me.` }] : []),
          ...(m(s, 'tip').key === 'E' ? [{ t: `And I hear you [[turned Richard Cole in]]. Good. He's been calling everyone.` }] : []),
          { t: `I've been looking at [[dip recoveries]] across the sector. I think something's changed, and I think it matters for how you trade.`, note: `She knows how I trade?`, sketch: 'q' },
          { t: `I'll tell you what I have. You tell me what you think.` }
        ], to: 'm1' },
        m1: { moment: 'sort', prompt: `Sort what she tells you.`, bins: [{ v: 'change', label: `Changes my view` }, { v: 'same', label: `Doesn't change it` }, { v: 'unsure', label: `Can't tell yet` }], items: [
          { id: 'recovery', t: `The last six sector dips took three times longer to recover than a year ago.`, against: true },
          { id: 'earnings', t: `Your three biggest holdings beat earnings last quarter.`, against: false },
          { id: 'flows', t: `Money has left the sector five weeks in a row, the longest run in four years.`, against: null },
          { id: 'calm', t: `Volatility is low. The market is calm.`, against: true }
        ], to: 'react' },
        react: { say: s => s.sortedAway >= 1
          ? [{ t: `You put [[the recovery data]] under "doesn't change it". Can I ask why?`, note: `Can she?`, sketch: 'q' }, { t: `I'm not saying you're wrong. I'm saying that's the one I'd lose sleep over.` }]
          : [{ t: `That's more honest than most people manage [[before nine]].`, note: `It doesn't feel honest. It feels expensive.` }], to: 'm2' },
        m2: { moment: 'choose', prompt: `What do you say?`, options: [
          { text: `"What are you positioned for, Sarah?"`, you: `What are you positioned for?`, set: 'askedBook', to: 'book' },
          { text: `"What would prove you wrong?"`, you: `What would prove you wrong?`, set: 'askedTest', to: 'test' },
          { text: `"My method has worked for fourteen months."`, you: `My method has worked for fourteen months.`, set: 'defended', to: 'defend' }
        ] },
        book: { say: [{ t: `Underweight the sector. I'll say it plainly: [[I'd like someone who trades it to tell me I'm wrong.]]`, note: `She's talking her book. Her data's still real.`, sketch: 'box' }, { t: `And the outflows? Record outflows end two ways. [[Which one is in the price?]]`, note: `Capitulation, or the start.`, sketch: 'q' }], to: 'm3' },
        test: { say: s => [{ t: `If the next dip recovers in under two weeks, I'm wrong. [[That's my test.]]`, note: `She has a test. Do I?`, sketch: 'box' }, ...(s.truth === 'blip' ? [{ t: `Honestly, it could be [[one bad quarter]].` }] : [])], to: 'm3' },
        defend: { say: [{ t: `It has. [[That's what worries me.]]`, note: `Loyal because it works, or because it's mine?`, sketch: 'q' }], to: 'm3' },
        m3: { moment: 'silence', prompt: `Rain on the window. She waits.`, wait: 8, options: [
          { text: `"Send me the data."`, you: `Send me the data.`, set: 'askedData', to: 'data' },
          { text: `"I'll think about it."`, you: `I'll think about it.`, to: 'bye' }
        ], silent: { set: 'silent', to: 'quiet' } },
        data: { say: [{ t: `It's in your inbox. Look at [[the flows chart]] first.` }], to: 'bye' },
        quiet: { say: [{ t: `(after a while) The worst thing that happened to me in 2019 was [[being right for three years first]].`, note: `Being right for a long time is its own risk.`, sketch: 'arrow' }], to: 'bye' },
        bye: { say: [{ t: `Good luck. I mean it.` }, { who: 'n', t: `She hangs up. The futures are down half a percent. Your next dip is forming.` }], to: 'decide' }
      },
      decide: {
        prompt: `A quality name is down 7% this morning. It's exactly the setup your method buys. What do you do?`,
        options: [
          { key: 'A', text: `Defend the method. Buy the dip at full size.`, did: `Defended the method at full size.`, exposure: 'large', q: s => (s.sortedAway >= 2 ? 0 : 1), breaks: ['evidence'] },
          { key: 'B', text: `Keep the method at half size until the next dip settles it.`, did: `Halved size until the evidence settled.`, exposure: 'normal', q: 4 },
          { key: 'C', text: `Stop for two weeks and study it.`, did: `Paused the method to investigate.`, exposure: 'none', q: 3, cap: { time: -1 } },
          { key: 'D', text: `Adapt: buy dips only where money is still flowing in.`, did: `Adapted the method to the new evidence.`, exposure: 'normal', q: 3, cap: { str: 1 } },
          { key: 'E', text: `Abandon the method. Sell everything.`, did: `Threw the method away overnight.`, exposure: 'none', q: 1, cap: { str: -2, psy: -1 } }
        ],
        out: {
          A: s => by(s, { regime: { fin: -6.2, tone: 'bad', text: `The dip keeps going, and so do the next two. Three full-size buys, three losses.` }, blip: { fin: 3.1, tone: 'good', text: `It recovers in nine days. So does the next one. The method was fine.` } }),
          B: s => by(s, { regime: { fin: -2.1, tone: 'mixed', text: `The dip keeps going. Half size meant half the damage, and the second dip told you the rest.` }, blip: { fin: 1.4, tone: 'good', text: `It recovers in nine days. Half size, half the gain, and now you know.` } }),
          C: s => by(s, { regime: { fin: 0, tone: 'good', text: `Two weeks of reading. The first two dips bounce while you watch, and you feel early and foolish. Then three fail. Being early looks exactly like being wrong, for a while. You come back with a new rule.` }, blip: { fin: 0, tone: 'mixed', text: `Two weeks of reading. The dips recover while you watch. Expensive homework, but homework.` } }),
          D: s => by(s, { regime: { fin: 0.8, tone: 'good', text: `Most dips fail. The two where money was still coming in don't.` }, blip: { fin: 0.9, tone: 'good', text: `Fewer trades, still working. The filter cost you a little and taught you a lot.` } }),
          E: s => by(s, { regime: { fin: 0, tone: 'mixed', text: `You're safe, and flat, and you've thrown away fourteen months of knowing how you make money.` }, blip: { fin: -1.8, tone: 'bad', text: `You sold at the bottom of a blip. Everything you sold recovers within two weeks.` } })
        }
      },
      unsaid: s => by(s, {
        regime: {
          wanted: `To test her view on someone who trades it, before her fund leaned harder against the sector.`,
          knew: `The flows and recovery data. Both real.`,
          didnt: `How long the change would last.`,
          incentive: `Her fund's underweight position. She'd profit from being right.`,
          fact: `The next three sector dips failed. Outflows ran another six weeks.`,
          read: `An incentive doesn't make evidence false. It just means you should check it.`,
          signals: [
            { t: `Dips were recovering three times slower.`, saw: s => s.sorted && s.sorted.recovery === 'change' },
            { t: `A calm market was the warning, not the comfort.`, saw: s => s.sorted && s.sorted.calm === 'change' },
            { t: `She had a test that could prove her wrong.`, saw: s => f(s, 'askedTest') }
          ]
        },
        blip: {
          wanted: `To test her view on someone who trades it, before her fund leaned harder against the sector.`,
          knew: `The flows and recovery data. Both real.`,
          didnt: `That it was one bad quarter, and the outflows were capitulation.`,
          incentive: `Her fund's underweight position.`,
          fact: `The next dip recovered in nine days. Sarah covered her underweight.`,
          read: `Being humble about a method isn't the same as abandoning it.`,
          signals: [
            { t: `She said it could be one bad quarter.`, saw: s => f(s, 'askedTest') },
            { t: `Your holdings were still beating earnings.`, saw: s => s.sorted && s.sorted.earnings !== 'change' },
            { t: `She was talking her book.`, saw: s => f(s, 'askedBook') }
          ]
        }
      })
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
    const w = m(s, 'warning'), t = m(s, 'tip'), d = m(s, 'silence'), sh = m(s, 'shift');
    if (w.flags && w.flags.revealedSize) out.push({ t: `Michael Reeves told me [[your Halden size]] before you'd put the phone down.`, note: `I told one person.`, sketch: 'arrow' });
    else if (w.key === 'F') out.push({ t: `Michael Reeves says you put him on hold to [[read the tape]]. He was annoyed. I was impressed.` });
    else if (w.key === 'D') out.push({ t: `You bought more Halden [[while a fund was selling]]. People noticed.` });
    if (t.key === 'E') out.push({ t: `You reported Richard Cole. [[Compliance people talk]], too.` });
    else if (t.key === 'A' || t.key === 'B') out.push({ t: `You bought [[Richard Cole's]] Fenwick story.`, note: `She knows that too.` });
    else if (t.flags && (t.flags.askedSource || t.flags.checkedOptions)) out.push({ t: `Richard says you [[made him wait]]. Richard hates waiting.` });
    if (d.key === 'E') out.push({ t: `David Mercer says you talked him out of a trade. [[He listened]], which is new.` });
    else if (d.key === 'A') out.push({ t: `You chased [[Larkspur]] with David Mercer.` });
    if (sh.flags && sh.flags.askedTest) out.push({ t: `Sarah Bennett says you asked what would [[prove her wrong]]. Nobody asks that.` });
    return out.slice(0, 3);
  }

  C.byId = Object.fromEntries(C.calls.map(c => [c.id, c]));
  PP.call = C;
})();
