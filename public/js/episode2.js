// Episode 2, The Deal: the four scenes added to The Change Order and The Offer.
// Substance and staging live together here; the format matches scenarios.js and scenes.js.
// Each scene has hidden types (types[]), so the best move depends on who you're dealing with,
// and its payoff matrix shows each type as a column.
window.PP = window.PP || {};

(function () {
  const has = (ctx, ...i) => i.every(k => ctx.clues.includes(k));

  // ─────────────────────────────────────────── People
  Object.assign(PP.people, {
    rosa:  { name: `Rosa`,  look: { skin: '#c99a76', hair: 'bob', hairColor: '#3a261a', top: 'blazer', topColor: '#7a3b45', shirt: '#f1ece2', pants: '#2b2f36', glasses: true, h: 0.97 } },
    kim:   { name: `Kim`,   look: { skin: '#e3bc98', hair: 'ponytail', hairColor: '#1d1612', top: 'hoodie', topColor: '#4f6b5a', pants: '#3a4150', h: 0.95 } },
    vince: { name: `Vince`, look: { skin: '#d7a47c', hair: 'short', hairColor: '#3b2a1e', top: 'polo', topColor: '#1f3b57', pants: '#2b2f36', build: 1.08, h: 1.02, lanyard: true } }
  });

  // ─────────────────────────────────────────── Scenarios
  const hot = c => c.type !== 'soft';
  const genuine = c => c.type !== 'stalling';
  const careful = c => c.type !== 'trusting';
  const fourSquare = c => c.type !== 'straight';

  const SCENARIOS = [
    // ───────────── The Bidding War: a sealed-bid auction with a roof in the report
    {
      id: 'bidding-war',
      level: `Auctions`,
      arena: `Everyday transactions`,
      title: `The Bidding War`,
      lens: ['nash', 'duke'],
      setting: `An open house · Saturday, 2:15 pm · Offers due Monday`,
      types: [
        { id: 'hot', p: 0.55, who: `the competition`, label: `The competition was fierce`, tell: `Forty-one groups came through, eight disclosure packets were downloaded, and the listing agent stopped booking showings early.` },
        { id: 'soft', p: 0.45, who: `the competition`, label: `The competition was thinner than it looked`, tell: `It had been listed for 23 days with a price cut, and only two disclosure packets went out. "Multiple offers" meant one.` }
      ],
      cast: [
        { name: `Rosa`, role: `Your agent`, archetype: `The Pragmatist`, power: `Information`, note: `Paid when you buy. That isn't quite the same as when you buy well.` }
      ],
      known: [`The asking price is $485,000.`, `Offers are due Monday at noon.`, `Your comfortable limit is about $505,000.`, `The listing agent says she "expects multiple offers."`],
      unknown: [`How many other buyers will bid, and how high.`, `What the house will really cost you.`, `Whether "multiple offers" means two or twelve.`],
      clues: [
        { label: `Read the inspection report the sellers posted`, text: `A 2019 report flags the roof: "approximately five years of life remaining." A new one runs about $18,000.` },
        { label: `Ask Rosa what the listing agent told her`, text: c => hot(c) ? `"Forty-one groups through today, and eight people downloaded the disclosures. She stopped booking showings at noon." Rosa looks worried.` : `"Honestly? It's been on 23 days with one price cut. Two disclosure packets went out. 'Multiple offers' might mean us and one other."` },
        { label: `Check the comparable sales`, text: `Three similar houses on the street sold for $478,000, $492,000 and $501,000 in the last six months. None needed a roof.` }
      ],
      question: `What do you offer?`,
      options: [
        {
          key: 'A', text: `Offer the asking price, $485,000, with your inspection contingency.`,
          their: c => hot(c) ? `In a crowded field, an offer at asking with an inspection contingency is the easiest one to set aside.` : `With few buyers, a clean offer at asking gave the sellers a reason to deal with you.`,
          q: c => has(c, 1) && hot(c) ? 1 : 2, s: { bnd: 1, jdg: 1, inf: -1 },
          outcomes: [
            { p: c => hot(c) ? 0.1 : 0.6, tone: 'good', text: c => hot(c) ? `Somehow the sellers counter at $492,000, inspection intact. You take it.` : `The sellers counter at $488,000. You take it, inspection intact.` },
            { p: c => hot(c) ? 0.9 : 0.4, tone: 'mixed', text: c => hot(c) ? `Eight offers came in. Yours was near the bottom. Rosa sends you three new listings.` : `Another buyer offered $487,000 with no contingencies. You lose it by two thousand dollars.` }
          ],
          later: `A fair offer, made without knowing whether the market was crowded or quiet.`
        },
        {
          key: 'B', text: `Offer $500,000, keep the inspection, and write the sellers a personal letter.`,
          their: c => hot(c) ? `In a bidding war, sellers look at price and certainty. A letter is a tiebreaker at best.` : `With one other offer, $500,000 was more than they needed from you. Bidding against yourself is still bidding.`,
          q: c => has(c, 1) && !hot(c) ? 1 : 2, s: { com: 1, coo: 1, jdg: -1 },
          outcomes: [
            { p: c => hot(c) ? 0.4 : 0.9, tone: c => hot(c) ? 'good' : 'mixed', text: c => hot(c) ? `You win at $500,000. The letter may even have helped. The roof is still five years from done.` : `You win at $500,000, about $13,000 more than the only other offer. The letter was lovely.` },
            { p: c => hot(c) ? 0.6 : 0.1, tone: 'mixed', text: c => hot(c) ? `Three offers came in above $510,000. The letter didn't matter.` : `The sellers take a cash offer at $495,000.` }
          ],
          later: `You paid for certainty with money. Whether you needed to depended on how many buyers there really were.`
        },
        {
          key: 'C', text: `Offer $490,000 with an escalation clause: $2,000 over any other bid, capped at $499,000 because of the roof.`,
          needs: [0], vague: {
            text: `Offer $490,000 with an escalation clause: $2,000 over any other bid, up to $505,000.`, q: 3,
            s: { str: 1, jdg: 1, bnd: 1 }, later: `You set a ceiling before the excitement. You just left the $18,000 roof out of it.`,
            outcomes: [
              { p: c => hot(c) ? 0.7 : 0.85, tone: c => hot(c) ? 'mixed' : 'good', text: c => hot(c) ? `The clause carries you to $505,000. You win. Then the inspector looks up at the roof.` : `The only other offer was $478,000, so the clause never fires. You win at $490,000.` },
              { p: c => hot(c) ? 0.3 : 0.15, tone: 'mixed', text: c => hot(c) ? `Someone bid $512,000. You lose it at your cap.` : `The sellers counter at $488,000 and ask you to drop the clause. You do, and buy it.` }
            ]
          },
          their: `An escalation clause pays only what it takes to win, up to a limit you set before the excitement. The sellers see a firm number with a ceiling.`,
          q: 4, s: { str: 2, jdg: 2, inf: 2, bnd: 1 },
          outcomes: [
            { p: c => hot(c) ? 0.55 : 0.85, tone: 'good', text: c => hot(c) ? `The clause kicks in against a $495,000 bid. You win at $497,000, under your roof-adjusted cap.` : `The only other offer was $478,000, so the clause never fires. You win at $490,000, inspection intact.` },
            { p: c => hot(c) ? 0.45 : 0.15, tone: 'mixed', text: c => hot(c) ? `Someone bid $512,000. Your cap holds, and you lose the house with your roof budget intact.` : `The sellers counter at $488,000 and ask you to drop the clause. You do, and buy it.` }
          ],
          later: `You decided your walk-away number before the bidding, roof included, and let the clause do the rest.`
        },
        {
          key: 'D', text: `Forty-one groups came through. Offer $525,000, waive the inspection, and close in 21 days.`,
          needs: c => hot(c) ? [1] : [-1], vague: { text: `Offer $525,000, waive the inspection, and close in 21 days. Make it easy to say yes.` },
          their: `Waiving the inspection tells the sellers you'll pay anything. In an auction, the winner is usually whoever most overestimated the value. That's the winner's curse.`,
          q: 0, s: { reg: -2, jdg: -3, inf: -2 },
          outcomes: [
            { p: 1, tone: 'bad', text: c => hot(c) ? `You win at $525,000, $24,000 above the best comparable sale. Eighteen months later the roof leaks, and you waived your right to know.` : `You win at $525,000. The only other offer was $478,000. Then the roof.` }
          ],
          later: `The winner's curse: winning an auction often means you were the most optimistic person in the room.`
        },
        {
          key: 'E', text: `It's sat for 23 days with a price cut. Offer $470,000 with every contingency and let them come to you.`,
          needs: c => hot(c) ? [-1] : [1], vague: { text: `Offer $470,000 with every contingency, and see whether they come back to you.`, q: c => has(c, 1) && hot(c) ? 0 : 1, later: `A low offer without knowing the market is a guess.` },
          their: c => hot(c) ? `With eight offers, a low bid with every contingency isn't a negotiation. It's a pass.` : `A house that has sat for weeks has a seller who's starting to worry. A patient, low offer gave them a way out.`,
          q: 4, s: { neg: 2, reg: 2, inf: 2, jdg: 1 },
          outcomes: [
            { p: c => hot(c) ? 0.03 : 0.7, tone: 'good', text: c => hot(c) ? `Against the odds, every other buyer's financing falls through. The sellers call you.` : `After four quiet days, the sellers counter at $479,000. You buy it below asking, inspection intact.` },
            { p: c => hot(c) ? 0.97 : 0.3, tone: c => hot(c) ? 'bad' : 'mixed', text: c => hot(c) ? `Eight offers. Yours was last. The listing agent doesn't call back.` : `The sellers take the other offer at $482,000. You were close.` }
          ],
          later: `Low offers work when the seller is the one under pressure. Knowing which side that is decides everything.`
        }
      ],
      analysis: {
        game: `A sealed-bid auction with a twist: you don't know the other bids, and the house's real cost includes a roof everyone can read about in the report.`,
        incentives: `The sellers want the highest certain price. The listing agent wants urgency. Rosa is paid when you buy, which isn't the same as when you buy well.`,
        leverage: `Your own walk-away number, set before the excitement, plus what the report and the comps told you.`,
        missing: `How many bidders, and how high. Rosa could tell you how crowded it really was.`,
        assumptions: `That "multiple offers" means a war. That winning is the goal.`,
        controlled: `Your ceiling, your contingencies, and how much you found out first.`,
        couldnt: `The other buyers.`,
        concept: { thinker: 'nash', term: `Auction theory`, name: `Bid your value, not your hope`, body: `In an auction, your best bid depends on what you expect others to bid and what the house is really worth to you. Setting the ceiling first, roof included, is a best response to not knowing.` },
        second: { thinker: 'duke', term: `Winner's curse`, name: `Winning often means you overestimated most`, body: `When many people estimate a value, the winner is usually the one who overestimated most. Decide in advance what would make winning a loss.` },
        better: `C with the roof in the cap. If you learned the market was quiet, a patient low offer.`,
        lesson: `Decide what winning is worth before the bidding starts. The room will try to change your mind.`
      }
    },

    // ───────────── The Counteroffer: is Ellen's counter a commitment or a delay?
    {
      id: 'the-counteroffer',
      level: `Commitment`,
      arena: `The marketplace`,
      title: `The Counteroffer`,
      lens: ['schelling', 'aumann'],
      setting: `Brightline · Thursday, 9:15 am · The small conference room`,
      types: [
        { id: 'genuine', p: 0.5, who: `Ellen`, label: `Ellen's counter was real`, tell: `She'd already gotten budget approval for your raise in September, before you ever resigned.` },
        { id: 'stalling', p: 0.5, who: `Ellen`, label: `Ellen was buying time`, tell: `She asked twice when your last day would be, and HR had already posted a job that reads a lot like yours.` }
      ],
      cast: [
        { name: `Ellen`, role: `Your manager`, archetype: `The Avoider`, power: `Your raise, your title, your reference`, note: `Hates conflict. Hates losing people before a launch even more.` }
      ],
      known: [`Northfield's offer is signed. You've said yes, starting on the 14th.`, `You just told Ellen you're resigning.`, `You make $85,000 at Brightline.`],
      unknown: [`Whether Ellen's counter is a plan or a way to buy time.`, `What staying would mean for how you're seen.`, `How long Northfield will wait.`],
      clues: [
        { label: `Check Brightline's careers page`, text: c => genuine(c) ? `No new postings for your team. The last one closed in March.` : `A new posting went up Tuesday: "Senior Operations Analyst." It reads a lot like your job description.` },
        { label: `Ask Dana what happened to people who stayed`, text: c => genuine(c) ? `"Priya took a counter last year. She was promoted in the spring. Ellen meant it."` : `"Two people took counters last year. Both were gone within six months, after their replacements were trained."` },
        { label: `Re-read Northfield's offer letter`, text: `"We're excited to have you start on the 14th." It's signed. Alicia said she'd hold the start date for two weeks, not longer.` }
      ],
      question: `What do you tell Ellen?`,
      options: [
        {
          key: 'A', text: `"Priya's counter turned into a promotion. If yours will too, ninety-eight and the title works. I'll stay."`,
          needs: c => genuine(c) ? [1] : [-1],
          vague: {
            text: `"Ninety-eight and a senior title? Okay. I'll stay."`,
            q: c => (has(c, 0) || has(c, 1)) && !genuine(c) ? 0 : 1,
            their: c => genuine(c) ? `Ellen meant it, but you took it without checking, and you broke your word to Northfield to do it.` : `Ellen needed you through the launch, not after it. A counter was the cheapest way to buy time to replace you.`,
            later: `You took the first counter that sounded good. You'll find out what it meant over the next six months.`,
            outcomes: [
              { p: c => genuine(c) ? 0.7 : 0.15, tone: c => genuine(c) ? 'good' : 'mixed', text: c => genuine(c) ? `Ellen follows through. In April you're promoted, and it was real.` : `The raise comes through. Then a "restructuring" in the spring. You keep your job, barely.` },
              { p: c => genuine(c) ? 0.3 : 0.85, tone: c => genuine(c) ? 'mixed' : 'bad', text: c => genuine(c) ? `The raise is real. The title takes a year. Northfield won't call you again.` : `Five months later, after you've trained the new "senior analyst," your role is eliminated.` }
            ]
          },
          their: `Ellen had budget for your raise before you resigned. Her counter wasn't a reaction. It was a plan.`,
          q: 3, s: { inf: 2, jdg: 1, lng: 1, bnd: -1 },
          outcomes: [
            { p: 0.75, tone: 'good', text: `Ellen follows through. In April you're promoted, and it was real.` },
            { p: 0.25, tone: 'mixed', text: `The raise is real. The title takes a year. Northfield won't call you again.` }
          ],
          later: `You checked before you believed it, and you chose to stay for a reason, not a reflex. Calling Northfield was still hard.`
        },
        {
          key: 'B', text: `"I saw the senior analyst posting on Tuesday. Thank you, but I'm keeping my word to Northfield."`,
          needs: c => genuine(c) ? [-1] : [0],
          vague: { text: `"Thank you, truly. I've already said yes to Northfield, and I'm going to keep my word."` },
          their: c => genuine(c) ? `Ellen's counter was real, but so was your word to Northfield. Keeping it cost you a raise here and earned you a reputation everywhere.` : `Ellen was buying time. Keeping your word took the decision out of her hands.`,
          q: 4, s: { bnd: 2, lng: 2, com: 1, reg: 1 },
          outcomes: [
            { p: 1, tone: 'good', text: c => genuine(c) ? `Ellen nods slowly. "I'd have done the same." Her reference opens doors for years.` : `Ellen's smile tightens, then relaxes. "Fair enough." You leave on good terms, and the new posting fills in a month.` }
          ],
          later: `You kept a commitment when a better-sounding offer arrived. That's the only kind of commitment that counts.`
        },
        {
          key: 'C', text: `"I'd consider it if it's in writing today, with the title and a review date. Otherwise I'll go."`,
          their: c => genuine(c) ? `A real offer survives being written down. Ellen's did, which is how you knew.` : `A stalling counter rarely survives being put in writing. That was the test, and it worked.`,
          q: c => (has(c, 0) || has(c, 1)) ? (genuine(c) ? 4 : 2) : 3, s: { neg: 2, inf: 1, bnd: 2, jdg: 1 },
          outcomes: [
            { p: c => genuine(c) ? 0.8 : 0.15, tone: c => genuine(c) ? 'good' : 'mixed', text: c => genuine(c) ? `By 4 pm it's in writing: $98,000, a senior title, a review in six months. You call Alicia and apologize. She's gracious about it.` : `HR "needs a few weeks" to put anything in writing. You go to Northfield as planned, a little wiser.` },
            { p: c => genuine(c) ? 0.2 : 0.85, tone: 'mixed', text: c => genuine(c) ? `HR needs a week to write it up. Northfield's start date gets close, and you choose Northfield.` : `Ellen asks again when your last day is. Nothing arrives in writing. You go to Northfield.` }
          ],
          later: `Asking for it in writing tested whether the counter was a commitment. The answer decided for you.`
        },
        {
          key: 'D', text: `"Northfield is at $110,000. If you can match that, I'll stay."`,
          their: `Ellen doesn't know Northfield's number, but she knows you. A bluff to your own manager risks the one thing you were leaving with: a good reference.`,
          q: 0, s: { reg: -1, com: -2, lng: -2, neg: -1 },
          outcomes: [
            { p: 0.75, tone: 'bad', text: `Ellen doesn't match. "Then you should take it." You do, but the goodbye is cold, and so is the reference.` },
            { p: 0.25, tone: 'mixed', text: `Ellen gets to $104,000. You stay, having told your manager a number that wasn't true.` }
          ],
          later: `A lie to win a few thousand dollars, told to someone you'll need a reference from.`
        },
        {
          key: 'E', text: `"Can I have a few days? I want to think about both offers properly."`,
          their: c => genuine(c) ? `More time is fair, but Northfield's start date was real. Waiting moved the pressure onto you.` : `Ellen needed time to replace you. Asking for a few days gave it to her.`,
          q: c => (has(c, 0) || has(c, 1)) && !genuine(c) ? 1 : 2, s: { reg: 1, jdg: -1 },
          outcomes: [
            { p: c => genuine(c) ? 0.5 : 0.2, tone: 'mixed', text: c => genuine(c) ? `Ellen gives you until Monday. Northfield's patience runs short. You choose, a little rushed.` : `Ellen uses the days to line up interviews for your job. You go to Northfield.` },
            { p: c => genuine(c) ? 0.5 : 0.8, tone: 'mixed', text: c => genuine(c) ? `Alicia calls Friday: "We need an answer." You decide on the phone, which isn't how you wanted to.` : `By Monday, Ellen has stopped asking you to stay. Northfield is still waiting, thankfully.` }
          ],
          later: `Time is only useful if you use it to learn something.`
        }
      ],
      analysis: {
        game: `A commitment problem. You made a promise to Northfield. Ellen is offering a reason to break it, and you don't know whether her offer is a commitment or a delay.`,
        incentives: `Ellen needs you through the launch. Whether she needs you after it is the hidden question.`,
        leverage: `Northfield's signed offer, and your word. Both are only worth something if you treat them as real.`,
        missing: `Whether Ellen's counter was planned or improvised. The careers page and Dana could tell you.`,
        assumptions: `That a counter means you're valued. That your word to a new employer doesn't count yet.`,
        controlled: `Whether you kept your word, and what you asked to see in writing.`,
        couldnt: `Ellen's plans, and HR's.`,
        concept: { thinker: 'schelling', term: `Commitment device`, name: `A promise only counts if you won't back out of it`, body: `Schelling showed that a commitment's power comes from not being able to back out of it. A promise you'll break for a better offer isn't a commitment, and everyone you deal with afterward learns that.` },
        second: { thinker: 'aumann', term: `Reputation`, name: `How you leave travels ahead of you`, body: `A career is a long repeated game in a small world. How you leave a job is information about you, and it travels.` },
        better: `B. If Ellen's counter checks out and you'd truly rather stay, C: in writing, before you call Northfield.`,
        lesson: `Counteroffers are usually about the next three months, not the next three years. Check before you believe one.`
      }
    },

    // ───────────── The Used Car: you're the one who knows more
    {
      id: 'used-car',
      level: `Hidden information`,
      arena: `Everyday transactions`,
      title: `The Used Car`,
      lens: ['aumann', 'duke'],
      setting: `Alder Street · Saturday, 8:15 am · 38 degrees`,
      types: [
        { id: 'careful', p: 0.5, who: `Kim`, label: `Kim was a careful buyer`, tell: `She brought a code scanner, a flashlight and a notebook of questions. Her brother-in-law is a mechanic.` },
        { id: 'trusting', p: 0.5, who: `Kim`, label: `Kim was a trusting buyer`, tell: `She brought a coffee and a checkbook, and she needed a truck by Monday for a new job.` }
      ],
      cast: [
        { name: `Kim`, role: `Buyer`, archetype: `The Unknown`, power: `Her money, and her review`, note: `Found your listing on the neighborhood app.` },
        { name: `Ruth`, role: `Neighbor`, archetype: `The Witness`, power: `Knows everyone`, note: `Watering a plant that does not need watering.` }
      ],
      known: [`The transmission slips when it's cold. A shop quoted $1,800 to fix it.`, `Trucks like yours in good condition sell for about $11,000.`, `Kim is here to test-drive it this morning.`],
      unknown: [`Whether Kim will check.`, `Whether she'd still buy it if she knew.`],
      clues: [
        { label: `Check the temperature`, text: `It's 38 degrees. On cold mornings the transmission slips for the first ten minutes. This is a cold morning.` },
        { label: `Look at what Kim brought`, text: c => careful(c) ? `A code scanner, a flashlight and a notebook of questions. She mentions her brother-in-law is a mechanic.` : `A coffee and a checkbook. She mentions she needs a truck by Monday for a new job.` },
        { label: `Notice who's watching`, text: `Ruth is watering her plant across the street. Kim found your listing on the neighborhood app.` }
      ],
      question: `What do you tell Kim?`,
      options: [
        {
          key: 'A', text: `"Before you drive it: on cold mornings like this one, the transmission slips. It's $1,800 to fix, and I've priced that in."`,
          needs: [0], vague: { text: `"Before you drive it, there's something about the transmission you should know. I've priced it in."`, q: 3, later: `Honest, if a little vague. Saying exactly what's wrong is even easier to believe.` },
          their: `Kim can't see inside a transmission. Telling her made you the most believable seller she'd meet, and buyers pay for that.`,
          q: 4, s: { com: 2, lng: 2, inc: 1, bnd: 1 }, rel: { ruth: 1 },
          outcomes: [
            { p: 0.75, tone: 'good', text: c => careful(c) ? `Her brother-in-law confirms the quote. Kim buys it at $9,200 and posts that you were honest.` : `Kim thanks you, haggles a little, and buys it at $9,200. She posts that you were honest.` },
            { p: 0.25, tone: 'mixed', text: `Kim thanks you and keeps looking. Two weeks later you sell it for $9,000 to a friend of hers.` }
          ],
          later: `You sold a flawed truck honestly at a fair price. On a street where everyone talks, that's worth more than $1,800.`
        },
        {
          key: 'B', text: `She needs a truck by Monday and brought a checkbook. Warm it up first and don't mention the transmission.`,
          needs: c => careful(c) ? [-1] : [1], vague: { text: `Warm it up in the driveway before she arrives, and don't mention the transmission.` },
          their: c => careful(c) ? `Kim came ready to check. Hiding a known problem from someone with a scanner turns an $1,800 repair into a reputation.` : `Kim trusted you because she had no way to check. That's exactly when honesty is a choice, not a strategy.`,
          q: 0, s: { com: -2, lng: -3, inc: -1 }, rel: { ruth: -1 },
          outcomes: [
            { p: c => careful(c) ? 0.1 : 0.75, tone: c => careful(c) ? 'mixed' : 'good', text: c => careful(c) ? `The scanner shows nothing stored. Kim buys it at $11,000. On the first cold morning, she calls you.` : `Kim buys it for $11,000 and drives off happy. You never hear from her. You'll remember you didn't tell her.` },
            { p: c => careful(c) ? 0.9 : 0.25, tone: 'bad', text: c => careful(c) ? `The scanner shows a stored transmission code. Kim looks at you for a long moment and leaves. Ruth saw the whole thing.` : `On the first cold morning the transmission slips. Kim posts the listing, with your name, on the neighborhood app.` }
          ],
          later: `Whether or not anyone found out, you know what you did. And on this street, people usually find out.`
        },
        {
          key: 'C', text: `"It's been really reliable for me. Ask me anything you like."`,
          their: c => careful(c) ? `"Reliable" is technically true and practically misleading. A careful buyer hears the gap.` : `Kim heard "reliable" as "nothing wrong." You knew she would.`,
          q: 1, s: { com: -1, lng: -1 },
          outcomes: [
            { p: c => careful(c) ? 0.2 : 0.6, tone: c => careful(c) ? 'mixed' : 'good', text: c => careful(c) ? `Kim asks, "Any transmission issues?" You hesitate a beat too long. She offers $8,000.` : `Kim buys it at $10,800. "Reliable" was true, mostly.` },
            { p: c => careful(c) ? 0.8 : 0.4, tone: 'bad', text: c => careful(c) ? `The scanner finds a stored transmission code. "Reliable?" Kim asks, and leaves.` : `It slips on her drive home. She calls, and you refund $1,800 to keep it off the neighborhood app.` }
          ],
          later: `A half-truth protects you only until someone asks the right question.`
        },
        {
          key: 'D', text: `Tell her you need a week, get the transmission fixed, and then sell it at full price.`,
          their: `Fixing it first removes the information gap entirely. You traded a week and $1,800 for a clean sale.`,
          q: 3, s: { jdg: 2, lng: 1, com: 1 },
          outcomes: [
            { p: 0.8, tone: 'good', text: `$1,800 and a week later, you sell it for $11,000 to the first person who drives it.` },
            { p: 0.2, tone: 'mixed', text: `The repair runs $2,400. You sell at $11,000 and come out about where you would have anyway.` }
          ],
          later: `The cleanest kind of honesty: remove the problem before anyone has to trust you about it.`
        },
        {
          key: 'E', text: `Sell it to a dealer for $8,500 as-is instead, and skip the conversation entirely.`,
          their: `The dealer prices in what neither of you knows. You paid about $700 to avoid one honest sentence.`,
          q: 2, s: { reg: 1, com: -1, jdg: 0 },
          outcomes: [
            { p: 1, tone: 'mixed', text: `The dealer pays $8,500 and resells it with a 30-day warranty. You skipped the conversation, and it cost you about $700.` }
          ],
          later: `You avoided the information problem by paying someone else to own it.`
        }
      ],
      analysis: {
        game: `A market for lemons, from the side that knows. You have private information about quality, and Kim can only guess. Markets like this break down unless sellers find a way to be believed.`,
        incentives: `You want the most money. Kim wants not to be fooled. On a street with a neighborhood app, your reputation is part of the price.`,
        leverage: `Your honesty, if you can make it credible: a specific defect and a specific price.`,
        missing: `Whether Kim would check. You couldn't know until she arrived, and it shouldn't have mattered.`,
        assumptions: `That a one-time sale has no future. That what Kim doesn't ask about doesn't count.`,
        controlled: `What you told her.`,
        couldnt: `The weather, and what she brought.`,
        concept: { thinker: 'aumann', term: `Market for lemons`, name: `When one side knows more, honesty has to be believable`, body: `Even a one-time sale sits inside a repeated game: the street, the app, Ruth. Honesty is rational when your reputation is part of what you're selling.` },
        second: { thinker: 'duke', term: `Resulting`, name: `A good outcome doesn't make a decision good`, body: `If hiding it worked, it still wasn't a good decision. If disclosing cost you the sale, it still was.` },
        better: `A, said specifically. Or D, if you can spare the week.`,
        lesson: `When you're the one who knows more, make the truth easy to believe. It's also the strategic move.`
      }
    },

    // ───────────── The Trade-In: four numbers in one box
    {
      id: 'trade-in',
      level: `Bundled negotiation`,
      arena: `The marketplace`,
      title: `The Trade-In`,
      lens: ['nalebuff', 'schelling'],
      setting: `Westgate Motors · Tuesday, 6:40 pm · The sales desk`,
      types: [
        { id: 'foursquare', p: 0.6, who: `Vince`, label: `Vince was working the four-square`, tell: `A second window sticker added a $1,895 "protection package," and he steered every number toward the monthly payment.` },
        { id: 'straight', p: 0.4, who: `Vince`, label: `Vince was a straight dealer`, tell: `Just the factory sticker, no add-ons, and he wrote the price down before he asked about payments.` }
      ],
      cast: [
        { name: `Vince`, role: `Salesperson`, archetype: `The Closer`, power: `The worksheet`, note: `Paid on the total profit of the deal, not on any one number.` }
      ],
      known: [`The sticker price is $32,400.`, `You're trading in your SUV.`, `Vince opened with: "What monthly payment are you comfortable with?"`],
      unknown: [`What your SUV is really worth to them.`, `Whether their financing is competitive.`, `What's built into the price.`],
      clues: [
        { label: `Check your credit union app`, text: `You were pre-approved yesterday: 5.9% for 60 months.` },
        { label: `Pull up an online offer for your SUV`, text: `An instant offer for your SUV: $9,200, good for seven days.` },
        { label: `Read the window sticker closely`, text: c => fourSquare(c) ? `A second sticker next to the factory one adds a $1,895 "protection package": nitrogen in the tires and paint sealant.` : `Just the factory sticker. No add-ons, no second sticker.` }
      ],
      question: `What do you say to Vince?`,
      options: [
        {
          key: 'A', text: `"I'm pre-approved at 5.9%, so about $500 a month works if you can match that."`,
          needs: [0], vague: { text: `"About $500 a month would work for me."` },
          their: c => fourSquare(c) ? `Once Vince knows your monthly number, he can move the price, trade-in, term and add-ons around it. You hit your payment and lose money everywhere else.` : `Vince was straight with you, but a monthly number still hides the price.`,
          q: c => fourSquare(c) && has(c, 2) ? 0 : 1, s: { neg: -2, inf: -1 },
          outcomes: [
            { p: c => fourSquare(c) ? 0.1 : 0.5, tone: 'mixed', text: c => fourSquare(c) ? `Vince hits $498 a month at 84 months, with the protection package. You'll pay about $4,700 more than you think.` : `Vince matches $500 a month at 60 months. Fair, though you never saw the price.` },
            { p: c => fourSquare(c) ? 0.9 : 0.5, tone: c => fourSquare(c) ? 'bad' : 'mixed', text: c => fourSquare(c) ? `$499 a month for 84 months, $7,000 for your SUV, and the $1,895 package. Every square moved. You only watched one.` : `$500 a month works, but the trade-in comes in at $7,800. You'd have gotten $9,200 online.` }
          ],
          later: `The monthly payment is the one number that hides all the others.`
        },
        {
          key: 'B', text: `"Price first, then trade-in, then financing. I have a $9,200 offer and a 5.9% pre-approval to compare."`,
          needs: [0, 1], vague: {
            text: `"Let's agree on the car's price first. Then the trade-in, then financing, one at a time."`, q: 3,
            their: c => fourSquare(c) ? `Separating the issues was right, but without outside numbers, Vince could still lowball the trade-in and the rate.` : `A straight dealer gave you fair numbers, but you had nothing to compare them with.`,
            later: `You split the deal into pieces. Without outside numbers, you couldn't tell whether each piece was good.`,
            outcomes: [
              { p: c => fourSquare(c) ? 0.4 : 0.8, tone: c => fourSquare(c) ? 'mixed' : 'good', text: c => fourSquare(c) ? `You get the price down to $30,900. Then the trade-in comes in low at $7,600, and you have nothing to compare it with.` : `$30,400 for the car and a fair $8,900 for the trade-in. You can't be sure it was the best, but it was clean.` },
              { p: c => fourSquare(c) ? 0.6 : 0.2, tone: 'mixed', text: `The price is fair, but the financing comes in at 7.9%. Without a pre-approval, you have nothing to push back with.` }
            ]
          },
          their: `Separating the issues takes away the four-square's power. With outside numbers for the trade-in and the loan, each piece has to be competitive on its own.`,
          q: 4, s: { neg: 2, str: 2, inf: 2, bnd: 1 },
          outcomes: [
            { p: c => fourSquare(c) ? 0.7 : 0.9, tone: 'good', text: c => fourSquare(c) ? `The car comes to $30,100 without the package. The trade-in matches $9,200. Financing beats your 5.9%. Every number is visible.` : `$30,400 for the car, $9,200 for the trade-in, 5.4% financing. Clean, quick and fair.` },
            { p: c => fourSquare(c) ? 0.3 : 0.1, tone: 'mixed', text: `Vince won't match $9,200, so you sell the SUV online and buy the car on its own. An extra afternoon, about $1,400 saved.` }
          ],
          later: `You turned one confusing negotiation into three simple ones, each with an alternative you could walk to.`
        },
        {
          key: 'C', text: `"What's the best total you can do, including my trade-in?"`,
          their: c => fourSquare(c) ? `"Best total" is the four-square's favorite question. It lets the dealer move money between boxes where you can't see it.` : `A fair dealer gave a fair total, but you had no way to check it.`,
          q: c => fourSquare(c) && has(c, 2) ? 1 : 2, s: { neg: -1, inf: -1 },
          outcomes: [
            { p: c => fourSquare(c) ? 0.2 : 0.6, tone: c => fourSquare(c) ? 'mixed' : 'good', text: c => fourSquare(c) ? `Vince quotes a total that sounds good. Inside it: $7,000 for your trade-in and the $1,895 package.` : `Vince gives you a fair total. You're not sure how it breaks down, but it's close to right.` },
            { p: c => fourSquare(c) ? 0.8 : 0.4, tone: c => fourSquare(c) ? 'bad' : 'mixed', text: c => fourSquare(c) ? `The total hides $2,200 under your trade-in and $1,895 in add-ons. One number, four places to lose money.` : `The total is fine, but the trade-in inside it is $1,000 under what you could get online.` }
          ],
          later: `A single total is simple to read and impossible to check.`
        },
        {
          key: 'D', text: `"I'll take your number if you throw in floor mats and the first service."`,
          their: `Small extras feel like winning. They're the cheapest thing a dealer can give you.`,
          q: 1, s: { neg: -1, coo: 1 },
          outcomes: [
            { p: 1, tone: 'mixed', text: c => fourSquare(c) ? `Floor mats and an oil change, worth about $250, on a deal that's $3,000 high.` : `Floor mats and an oil change. A small win on a fair deal.` }
          ],
          later: `You won the small thing and didn't look at the big one.`
        },
        {
          key: 'E', text: `"I'm not paying $1,895 for nitrogen in the tires. If that comes off, I'll be back tomorrow."`,
          needs: c => fourSquare(c) ? [2] : [-1],
          vague: {
            text: `"I need to think about it. I'll come back tomorrow."`, q: 2,
            their: c => fourSquare(c) ? `Walking away is leverage only if you know what you're walking away from.` : `Vince was already fair. Walking away cost you a day.`,
            later: `Leaving can be powerful. Leaving without a reason is just leaving.`,
            outcomes: [
              { p: c => fourSquare(c) ? 0.5 : 0.3, tone: 'mixed', text: c => fourSquare(c) ? `Vince calls the next day with "a special," package still included. You go back and forth all week.` : `You come back tomorrow, and the deal's the same. A day's delay for nothing.` },
              { p: c => fourSquare(c) ? 0.5 : 0.7, tone: 'mixed', text: c => fourSquare(c) ? `Another dealer quotes $1,400 less. You buy there.` : `Vince holds the price. You buy it, a day later.` }
            ]
          },
          their: `The add-on was pure margin. Naming it, and being ready to leave, made it cheaper to remove than to defend.`,
          q: 3, s: { neg: 2, bnd: 2, inf: 1 },
          outcomes: [
            { p: 0.75, tone: 'good', text: `The protection package comes off. Vince calls you the next morning with a better price.` },
            { p: 0.25, tone: 'mixed', text: `Vince won't remove it. You buy the same car across town, without it, for $1,600 less.` }
          ],
          later: `You named the padding and showed you'd leave over it.`
        }
      ],
      analysis: {
        game: `A negotiation over four linked numbers. The dealer's worksheet bundles them, so a concession on one can be taken back on another.`,
        incentives: `Vince is paid on the deal's total profit, not on any one number. You want the lowest total cost, which you can only see one piece at a time.`,
        leverage: `Outside offers: the pre-approval and the instant trade-in quote. They turn each piece into something you can compare.`,
        missing: `Whether this was a straight dealer or a four-square shop. The window sticker told you.`,
        assumptions: `That the monthly payment is the number that matters. That a bundle is simpler.`,
        controlled: `Which number you negotiated first, and what you compared it with.`,
        couldnt: `The dealer's margins, and his manager.`,
        concept: { thinker: 'nalebuff', term: `Unbundling`, name: `Split one bundled deal into separate ones`, body: `Nalebuff and Brandenburger's advice: don't just play the game you're handed. Splitting one bundled negotiation into separate ones, each with an outside alternative, changes the game in your favor.` },
        second: { thinker: 'schelling', term: `BATNA`, name: `Your best alternative if the deal fails is your real power`, body: `Your power in a negotiation is what you can do if it fails. A pre-approval and a trade-in quote are walk-aways you can show.` },
        better: `B, with the pre-approval and the instant offer in hand.`,
        lesson: `Never negotiate the monthly payment. Negotiate each number against an alternative you can walk to.`
      }
    }
  ];
  PP.scenarios.push(...SCENARIOS);

  // ─────────────────────────────────────────── Staging
  Object.assign(PP.scenes, {
    'bidding-war': {
      env: 'openhouse',
      cast: [{ id: 'rosa', spot: 'rosa', mood: 'smile', pose: 'tablet', wants: `To get you a house. Ideally this one, ideally soon.` }],
      intro: [
        { cam: 'wide', caption: `Spring. The new bathroom helped: your place sold in a week. Now you need somewhere to live.` },
        { who: 'rosa', mood: 'happy', say: `Isn't it lovely? Original floors, south light.` },
        { who: 'rosa', mood: 'neutral', pose: 'tablet', say: `Asking is four eighty-five. Offers are due Monday at noon. The listing agent says she expects multiple offers.` },
        { cam: 'flyers', caption: `A stack of disclosure packets sits on the sign-in table.` },
        { who: 'rosa', mood: 'skeptical', act: 'glance', say: `It's very busy today.`, if: c => c.type !== 'soft' },
        { cam: 'stain', caption: `Above the fireplace, a faint ring on the ceiling.` },
        { you: `(I love it. I could go to five-oh-five. Maybe more.)` }
      ],
      options: {
        A: { line: `Let's offer asking, with the inspection.`, preview: `Fair and protected. Easy to set aside if the field is crowded.`, row: 0, outcomes: [{ beats: [{ who: 'rosa', mood: 'smile', act: 'nod' }] }, { beats: [{ who: 'rosa', mood: 'awkward', pose: 'tablet' }] }] },
        B: { line: `Five hundred, keep the inspection, and I'll write them a letter.`, preview: `A strong number with a personal touch. Possibly more than needed.`, row: 1, outcomes: [{ beats: [{ who: 'rosa', mood: 'happy', act: 'nod' }] }, { beats: [{ who: 'rosa', mood: 'awkward' }] }] },
        C: { line: `Four ninety with an escalation clause: two thousand over any bid, capped at four ninety-nine for the roof.`, vague: { line: `Four ninety with an escalation clause: two thousand over any bid, up to five-oh-five.` }, preview: `Pays only what it takes, up to your limit. You might lose at the cap.`, row: 0, outcomes: [{ beats: [{ who: 'rosa', mood: 'thinking', act: 'nod', say: `Smart. I'll write it up.` }] }, { beats: [{ who: 'rosa', mood: 'neutral', pose: 'tablet' }] }] },
        D: { line: `Forty-one groups. Five twenty-five, no inspection, close in three weeks.`, vague: { line: `Five twenty-five, no inspection, close in three weeks. Make it easy.` }, preview: `Almost certain to win. The question is what you'd be winning.`, row: 1, outcomes: [{ beats: [{ who: 'rosa', mood: 'surprised', act: 'glance', say: `That's… very strong.` }] }] },
        E: { line: `It's sat for three weeks. Four seventy with every contingency. Let them come to us.`, vague: { line: `Four seventy with every contingency. Let's see if they come back.` }, preview: `Cheap if the seller is worried. Hopeless if the field is crowded.`, row: 2, outcomes: [{ beats: [{ who: 'rosa', mood: 'skeptical', say: `Bold. Okay.` }] }, { beats: [{ who: 'rosa', mood: 'awkward', pose: 'tablet' }] }] }
      },
      matrix: {
        you: `You`, them: `The market`, byType: true,
        rows: [`Bid with a ceiling you set first`, `Bid big, waive protections`, `Bid low, keep everything`],
        cols: [`Crowded`, `Quiet`],
        cells: [[[3, 2], [3, 1]], [[1, 3], [0, 3]], [[0, 1], [3, 2]]],
        best: [0, 0],
        note: `The first number is how you come out; the second is how the sellers do. A ceiling set in advance does well whoever else shows up. Bidding big only "wins" in the crowded case, and even then the roof is waiting.`
      },
      leverage: { you: [`Your own ceiling`, `The inspection report`, `The comparable sales`], them: [`An offer deadline`, `"Multiple offers"`, `How much you love it`], tilt: -1 },
      links: []
    },

    'the-counteroffer': {
      env: 'conference',
      cast: [{ id: 'ellen', spot: 'ellen', mood: 'neutral', pose: 'down', wants: `To keep the team together through the launch.` }],
      intro: [
        { cam: 'wide', caption: `Brightline. The morning after you signed with Northfield. You've just told Ellen.` },
        { who: 'ellen', mood: 'surprised', say: `Oh. I… wasn't expecting that.` },
        { who: 'ellen', mood: 'thinking', pose: 'thinking', say: `Before you go anywhere: what would it take to keep you? I can do ninety-eight, and a senior title.` },
        { who: 'ellen', mood: 'neutral', say: `When were you thinking your last day would be, exactly?`, if: c => c.type === 'stalling' },
        { you: `(Ninety-eight. More than I make now. Almost what Northfield offered.)` }
      ],
      options: {
        A: { line: `Priya's counter turned into a promotion. If yours will too, ninety-eight and the title works. I'll stay.`, vague: { line: `Ninety-eight and a senior title? Okay. I'll stay.` }, preview: `Keeps what you know. Breaks your word to Northfield.`, row: 0, outcomes: [{ beats: [{ who: 'ellen', mood: 'happy', act: 'nod', say: `Wonderful. Thank you.` }] }, { beats: [{ who: 'ellen', mood: 'smile', act: 'nod' }] }] },
        B: { line: `I saw the senior analyst posting on Tuesday. Thank you, but I'm keeping my word to Northfield.`, vague: { line: `Thank you, truly. I've already said yes to Northfield, and I'm going to keep my word.` }, preview: `Keeps your word. Walks away from a raise.`, row: 1, outcomes: [{ beats: [{ who: 'ellen', mood: 'neutral', act: 'nod', say: `Fair enough. I understand.` }] }] },
        C: { line: `I'd consider it if it's in writing today, with the title and a review date. Otherwise I'll go.`, preview: `Tests whether the counter is real. Puts Ellen on a clock.`, row: 0, outcomes: [{ beats: [{ who: 'ellen', mood: 'thinking', say: `Let me talk to HR.` }] }, { beats: [{ who: 'ellen', mood: 'awkward', say: `These things take a little time.` }] }] },
        D: { line: `Northfield is at a hundred and ten. If you can match that, I'll stay.`, preview: `Could raise the number. Only if she doesn't check.`, row: 2, outcomes: [{ beats: [{ who: 'ellen', mood: 'skeptical', pose: 'crossed', say: `Then you should take it.` }] }, { beats: [{ who: 'ellen', mood: 'frustrated', say: `I can get you to a hundred and four.` }] }] },
        E: { line: `Can I have a few days? I want to think about both offers properly.`, preview: `Room to think. Time helps whoever uses it.`, row: 0, outcomes: [{ beats: [{ who: 'ellen', mood: 'neutral', act: 'nod', say: `Of course. Take until Monday.` }] }, { beats: [{ who: 'ellen', mood: 'neutral', say: `Take the time you need.` }] }] }
      },
      matrix: {
        you: `You`, them: `Ellen`, byType: true,
        rows: [`Stay on her word`, `Keep your word and go`, `Bluff for more`],
        cols: [`Counter was real`, `Counter was a stall`],
        cells: [[[3, 3], [0, 3]], [[2, 1], [3, 1]], [[1, 1], [0, 2]]],
        best: [1, 1],
        note: `Staying pays only if the counter was real, and you can't see that from the number. Keeping your word does well either way, and asking for it in writing tells you which column you're in.`
      },
      leverage: { you: [`A signed offer from Northfield`, `The launch needs you`, `Your word, if you keep it`], them: [`Your raise and title`, `Your reference`, `What you'd lose by leaving`], tilt: 1 },
      links: []
    },

    'used-car': {
      env: 'street',
      cast: [
        { id: 'kim', x: 480, y: 772, s: 0.6, mood: 'smile', pose: 'phone', wants: `A reliable truck at a fair price, without being fooled.` },
        { id: 'ruth', spot: 'ruth', mood: 'neutral', pose: 'can', wants: `To know what's going on. Always.` }
      ],
      intro: [
        { cam: 'wide', caption: `Alder Street. 8:15 on a cold Saturday. You're selling your old pickup.` },
        { who: 'kim', mood: 'happy', say: `Hi! I'm Kim, from the app. Is it okay if I take it around the block?` },
        { who: 'kim', mood: 'neutral', pose: 'phone', say: `My brother-in-law's a mechanic. Mind if I plug in his scanner first?`, if: c => c.type === 'careful' },
        { who: 'kim', mood: 'smile', say: `I really need something by Monday. New job.`, if: c => c.type === 'trusting' },
        { cam: 'truck', caption: `On cold mornings, the transmission slips for the first ten minutes. You know. She doesn't.` },
        { who: 'ruth', mood: 'neutral', pose: 'can', caption: `Across the street, Ruth waters a plant that does not need watering.` }
      ],
      options: {
        A: { line: `Before you drive it: on cold mornings like this one, the transmission slips. It's eighteen hundred to fix, and I've priced that in.`, vague: { line: `Before you drive it, there's something about the transmission you should know. I've priced it in.` }, preview: `Honest and specific. You might lose the sale.`, row: 0, outcomes: [{ beats: [{ who: 'kim', mood: 'surprised', say: `Huh. Thanks for telling me.` }, { who: 'ruth', mood: 'smile', act: 'nod' }] }, { beats: [{ who: 'kim', mood: 'thinking', say: `I appreciate that. Let me think about it.` }] }] },
        B: { caption: `She needs it by Monday. You warm it up in the driveway and say nothing about the transmission.`, vague: { caption: `You warm it up in the driveway before she arrives, and say nothing about the transmission.` }, preview: `Full price, if no one finds out.`, row: 1, outcomes: [{ beats: [{ who: 'kim', mood: 'happy', act: 'nod', say: `I'll take it.` }] }, { beats: [{ who: 'kim', mood: 'frustrated', pose: 'crossed' }, { who: 'ruth', mood: 'surprised', act: 'glance' }] }] },
        C: { line: `It's been really reliable for me. Ask me anything you like.`, preview: `True, as far as it goes. Depends on what she asks.`, row: 1, outcomes: [{ beats: [{ who: 'kim', mood: 'smile', act: 'nod' }] }, { beats: [{ who: 'kim', mood: 'skeptical', say: `Reliable?` }] }] },
        D: { line: `Actually, give me a week. I'm going to get the transmission fixed first.`, preview: `A clean sale. Costs you a week and the repair.`, row: 0, outcomes: [{ beats: [{ who: 'kim', mood: 'smile', act: 'nod', say: `Sure. Text me.` }] }, { beats: [{ who: 'kim', mood: 'neutral', act: 'nod' }] }] },
        E: { caption: `You apologize to Kim and sell it to a dealer that afternoon, as-is.`, preview: `No awkward conversation. Less money.`, row: 2, outcomes: [{ beats: [{ who: 'kim', mood: 'awkward', act: 'nod', say: `Oh. Okay.` }] }] }
      },
      matrix: {
        you: `You`, them: `Kim`, byType: true,
        rows: [`Tell her, or fix it first`, `Hide it or shade it`, `Sell to a dealer`],
        cols: [`Careful buyer`, `Trusting buyer`],
        cells: [[[3, 3], [3, 3]], [[0, 1], [3, 0]], [[2, 2], [2, 2]]],
        best: [0, 0],
        note: `Honesty pays the same whoever shows up. Hiding it only "pays" against a trusting buyer, and that's the payoff that should bother you.`
      },
      leverage: { you: [`What you know about the truck`, `Your price`, `Your reputation on the street`], them: [`Her money`, `Her scanner, maybe`, `The neighborhood app`], tilt: 1 },
      links: [['ruth', 'kim', 'watching']]
    },

    'trade-in': {
      env: 'dealer',
      cast: [{ id: 'vince', spot: 'vince', mood: 'smile', pose: 'gesture', wants: `To make the most on the whole deal, and to make you feel good about it.` }],
      intro: [
        { cam: 'wide', caption: `Westgate Motors. You're trading in your SUV for something with better mileage.` },
        { who: 'vince', mood: 'happy', say: `Great choice. Now, what monthly payment are you comfortable with?` },
        { cam: 'worksheet', caption: `He draws a box divided into four squares: price, trade-in, down payment, monthly payment.` },
        { who: 'vince', mood: 'smile', say: `Let me just run that by my manager real quick.`, if: c => c.type === 'foursquare' },
        { cam: 'sticker', caption: `On the car you want, a window sticker. Maybe two.` },
        { you: `(I just want this to be simple.)` }
      ],
      options: {
        A: { line: `I'm pre-approved at five point nine, so about five hundred a month works if you can match that.`, vague: { line: `About five hundred a month would work for me.` }, preview: `Gets you the payment you want. Hides everything else.`, row: 2, outcomes: [{ beats: [{ who: 'vince', mood: 'happy', act: 'nod', say: `I think we can make that work.` }] }, { beats: [{ who: 'vince', mood: 'smile', say: `Done. Five hundred.` }] }] },
        B: { line: `Price first, then trade-in, then financing. I have a ninety-two hundred offer and a five point nine pre-approval to compare.`, vague: { line: `Let's agree on the car's price first. Then the trade-in, then financing, one at a time.` }, preview: `Every number in the open. Takes longer.`, row: 0, outcomes: [{ beats: [{ who: 'vince', mood: 'neutral', act: 'nod', say: `Okay. Let's do it your way.` }] }, { beats: [{ who: 'vince', mood: 'awkward', say: `I can't do ninety-two on the trade.` }] }] },
        C: { line: `What's the best total you can do, including my trade-in?`, preview: `One simple number. Hard to check.`, row: 2, outcomes: [{ beats: [{ who: 'vince', mood: 'happy', say: `Let me work some magic.` }] }, { beats: [{ who: 'vince', mood: 'smile', act: 'nod' }] }] },
        D: { line: `I'll take your number if you throw in floor mats and the first service.`, preview: `A small win you can see. A bigger number you might not.`, row: 2, outcomes: [{ beats: [{ who: 'vince', mood: 'happy', act: 'nod', say: `You drive a hard bargain.` }] }] },
        E: { line: `I'm not paying eighteen ninety-five for nitrogen in the tires. If that comes off, I'll be back tomorrow.`, vague: { line: `I need to think about it. I'll come back tomorrow.` }, preview: `Shows you'll leave. Only useful if you know why.`, row: 1, outcomes: [{ beats: [{ who: 'vince', mood: 'awkward', say: `Let me see what I can do.` }] }, { beats: [{ who: 'vince', mood: 'neutral', pose: 'crossed', say: `That's company policy, I'm afraid.` }] }] }
      },
      matrix: {
        you: `You`, them: `Vince`, byType: true,
        rows: [`One number at a time, with alternatives`, `Walk away over the padding`, `Negotiate the bundle or payment`],
        cols: [`Four-square shop`, `Straight dealer`],
        cells: [[[3, 2], [3, 3]], [[3, 1], [1, 2]], [[0, 4], [2, 3]]],
        best: [0, 1],
        note: `Splitting the deal does well against either kind of dealer. Negotiating the bundle or the payment is fine with a straight dealer and expensive with a four-square shop, and you can't tell which from the payment.`
      },
      leverage: { you: [`A 5.9% pre-approval`, `A $9,200 trade-in offer`, `Other dealers`], them: [`The worksheet`, `"Let me ask my manager"`, `Your wish for it to be simple`], tilt: -1 },
      links: []
    }
  });

  // ─────────────────────────────────────────── What each move pursues, and what they'd say about you
  Object.assign(PP.insight.scenes, {
    'bidding-war': { options: {
      A: { buys: ['fair', 'calm'], verdict: { who: 'rosa', line: `Offered fair and protected themselves. Didn't read the room first.` } },
      B: { buys: ['win', 'liked'], verdict: { who: 'rosa', line: `Paid up and wrote a lovely letter. Wanted it badly.` } },
      C: { buys: ['info', 'fair', 'future'], verdict: { who: 'rosa', line: `Knew their number before the bidding started. Easiest client I've had.` } },
      D: { buys: ['win'], verdict: { who: 'rosa', line: `Waived everything to win. I hope the roof holds.` } },
      E: { buys: ['info', 'time'], verdict: { who: 'rosa', line: `Read the market and waited. Gutsy.` } }
    } },
    'the-counteroffer': { options: {
      A: { buys: ['calm', 'liked'], verdict: { who: 'ellen', line: `Stayed when I asked. I'll remember that, one way or another.` } },
      B: { buys: ['fair', 'future', 'right'], verdict: { who: 'ellen', line: `Kept their word to someone else, even with a raise on the table. I'd hire them again.` } },
      C: { buys: ['info', 'fair'], verdict: { who: 'ellen', line: `Wanted it in writing. Fair. It told us both something.` } },
      D: { buys: ['win'], verdict: { who: 'ellen', line: `Quoted me a number I don't think was real.` } },
      E: { buys: ['time', 'calm'], verdict: { who: 'ellen', line: `Asked for time. Didn't do much with it.` } }
    } },
    'used-car': { options: {
      A: { buys: ['fair', 'future', 'right'], verdict: { who: 'kim', line: `Told me what was wrong before I asked. I'd buy from them again.` } },
      B: { buys: ['win'], verdict: { who: 'kim', line: `Sold me a truck they knew was broken.` } },
      C: { buys: ['win', 'calm'], verdict: { who: 'kim', line: `"Reliable." I should have asked better questions.` } },
      D: { buys: ['fair', 'future'], verdict: { who: 'kim', line: `Fixed it before selling it. Who does that?` } },
      E: { buys: ['calm', 'time'], verdict: { who: 'kim', line: `Changed their mind and sold it to a dealer. Odd, but fine.` } }
    } },
    'trade-in': { options: {
      A: { buys: ['calm', 'time'], verdict: { who: 'vince', line: `Told me their payment in the first minute. Easy afternoon.` } },
      B: { buys: ['info', 'fair'], verdict: { who: 'vince', line: `Came in with their own numbers. Hardest deal of the week, and fair.` } },
      C: { buys: ['calm', 'time'], verdict: { who: 'vince', line: `Asked for my best total. Everyone does.` } },
      D: { buys: ['win', 'liked'], verdict: { who: 'vince', line: `Happy with floor mats. Nice person.` } },
      E: { buys: ['right', 'info'], verdict: { who: 'vince', line: `Spotted the package and was ready to walk. Respect.` } }
    } }
  });
})();
