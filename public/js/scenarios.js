// The Change Order and The Offer (Episode 2). Episodes 1, 2 and 3 add the rest from their own files.
//
// Option fields:
//   q        decision quality 0-4 (maps to PP.grades). Scored regardless of outcome.
//   s        skill deltas, keys from PP.skills
//   rel      relationship deltas for recurring characters
//   outcomes [{ p, tone: good|mixed|bad, text }]. Probabilities sum to 1.
//   later    long-term consequence; string or fn(ctx)
// Text fields can be functions of ctx = { rel, flags, type, clues } for the repeated game.
// A clue may carry cost: { note, rel, flags }, applied when it's read.
window.PP = window.PP || {};

const coTight = c => c.type === 'tight', coPad = c => c.type === 'padder';

PP.scenarios = [
  // ───────────────────────────────────────────── The Change Order
  {
    id: 'change-order',
    rank: 5,
    level: `Incomplete information`,
    arena: `Everyday transactions`,
    title: `The Change Order`,
    lens: ['schelling', 'duke'],
    setting: `Your bathroom · Wednesday, 7:40 am · Floor removed`,
    narrative: () => [
      `You agreed to a fixed bid of <strong>$14,000</strong> for a bathroom remodel. The job is halfway done. The old tile is gone.`,
      `Luis, the contractor, calls you in. "Found rot in the subfloor. It's another <strong>$2,600</strong>. I need to know today. If I can't start this, my crew moves to another job and we're back in three weeks."`,
      `Your bathroom has no floor.`
    ],
    cast: [
      { name: `Luis`, role: `Contractor`, archetype: `The Negotiator`, power: `Expertise and timing`, note: `Knows far more about subfloors than you. Also knows you can't use the bathroom.` },
      { name: `The crew`, role: `Two workers`, archetype: `—`, power: `Availability`, note: `Their schedule is Luis's constraint, and now yours.` }
    ],
    known: [`The bid was fixed at $14,000.`, `The floor is open.`, `Luis wants an answer today.`],
    unknown: [`How bad the rot really is.`, `Whether $2,600 is a fair price.`, `Whether the three-week delay is real.`],
    types: [
      { id: 'honest', p: 0.45, who: `Luis`, label: `Luis was honest`, tell: `The rot was real and the price was fair. The tell: he could break the $2,600 down line by line.` },
      { id: 'padder', p: 0.25, who: `Luis`, label: `Luis was padding the bill`, tell: `The rot was real but small. The tell: he wouldn't break down the $2,600, and "it probably runs under the tub" was doing a lot of work.` },
      { id: 'tight', p: 0.3, who: `Luis`, label: `Luis's deadline was real`, tell: `The rot and the price were real, and so was the clock: his crew was due on another job at 1 pm. The tell: he kept checking his phone, and Marco knew the exact time.` }
    ],
    reads: 2,
    clues: [
      { label: `Read your contract`, text: `Section 7: "Unforeseen conditions will be billed at documented cost plus 15%, with the owner's written approval of a change order." The bid was fixed, with a written exception for exactly this.` },
      { label: `Look at the floor yourself`, text: ctx => ctx.type === 'padder' ? `Near the toilet flange there's a soft patch, maybe two feet square. Luis says it "probably runs under the tub," but he hasn't opened that up.` : `Near the toilet flange, about a 3-by-4-foot area of plywood is dark and soft. It looks like a slow leak over many years. The rot appears real.` },
      { label: `Ask how he got to $2,600`, text: ctx => ctx.type === 'padder' ? `"That's just what these run," he says. He doesn't break it down, and changes the subject to the crew's schedule.` : `He doesn't hesitate: "Two sheets of plywood, a sister joist, a day and a half of labor, plus 15% like the contract says."` },
      { label: `Text Marco, the crew lead`, text: ctx => coTight(ctx) ? `"Luis has us on the Pruitt job at 1 unless he calls them by noon. They've waited a month already."` : `"We're here through Friday either way. If the floor's approved today, we start it tomorrow."` }
    ],
    question: `What do you say to Luis?`,
    options: [
      {
        key: 'A', text: `"I've seen the rot myself, and it's real. Go ahead, and keep the crew here."`,
        needs: [1], vague: { text: `"Go ahead. I trust you, and I need the crew here."` },
        their: ctx => ctx.type === 'padder' ? `Luis was padding. Approving on the spot meant he never had to justify the number.` : coTight(ctx) ? `The clock was real, and approving on the spot beat it. You just never saw what you paid for.` : `Luis is probably honest, but nothing you said made honesty his best move. Approving on the spot makes padding free.`,
        q: ctx => ctx.type === 'padder' && (ctx.clues.includes(1) || ctx.clues.includes(2)) ? 0 : coTight(ctx) ? 3 : 1, s: { coo: 1, jdg: -1, inf: -2, neg: -2 },
        outcomes: [
          { p: ctx => ctx.type === 'padder' ? 0.15 : coTight(ctx) ? 0.8 : 0.7, tone: 'mixed', text: `The work is done well. The final invoice shows $2,600 for materials and labor you never saw itemized. It was probably fair. You'll never know.` },
          { p: ctx => ctx.type === 'padder' ? 0.85 : coTight(ctx) ? 0.2 : 0.3, tone: 'bad', text: `The work is done. Later a friend in construction looks at the photos: "Documented, that's about $1,900." You paid $700 extra under a deadline you never tested.` }
        ],
        later: `Luis learned that urgency works on you.`
      },
      {
        key: 'B', text: `"The bid was fixed, so the rot is your cost, not mine."`,
        their: `Section 7 of your contract says otherwise, and Luis knows it. His best reply was to stop until you put it in writing, so he did.`,
        q: 1, s: { bnd: 2, inf: -2, inc: -1, coo: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Luis points to Section 7 of the contract. He's polite, but he pulls the crew. Your floor stays open for three weeks.` }],
        later: `You held a line your own contract didn't support. Being firm on a wrong premise is still a wrong premise.`
      },
      {
        key: 'C', text: `"Show me the damage and send a written change order, itemized. I can sign tonight."`,
        their: ctx => coTight(ctx) ? (ctx.clues.includes(3) ? `Marco told you the crew left at 1. "Tonight" was after the deadline you'd just confirmed was real.` : `A careful answer to the wrong deadline. Luis's crew was due elsewhere at 1, so "tonight" meant three weeks.`) : ctx.type === 'padder' ? `A written, itemized order is the one thing a padded bill can't survive. Luis's best reply was to price it honestly or lose your approval.` : `Asking to see it and get it in writing costs an honest contractor nothing and makes padding a losing move. You also met his deadline, so his best reply was to document it and keep the crew.`,
        needs: [0],
        vague: { s: { inf: 1, neg: 1, bnd: 1, com: 2, jdg: 1 }, later: `You met his deadline and asked to check. Section 7 already gave you exactly this process, and you didn't know to name it.`, text: `"Show me the damage, and send me the cost in writing. I'll decide tonight."`, q: ctx => coTight(ctx) ? (ctx.clues.includes(3) ? 1 : 2) : 3, pv: [ctx => coTight(ctx) ? 0.15 : 0.6, ctx => coTight(ctx) ? 0.85 : 0.4] },
        q: ctx => coTight(ctx) ? (ctx.clues.includes(3) ? 1 : 3) : 4, s: { inf: 2, neg: 2, bnd: 1, com: 2, jdg: 2, inc: 1 },
        outcomes: [
          { p: ctx => ctx.type === 'padder' ? 0.85 : coTight(ctx) ? 0.15 : 0.7, tone: 'good', text: `Luis walks you through it and sends a change order at 4 pm: $1,940 at documented cost plus 15%. You sign it at 6. The crew starts Thursday.` },
          { p: ctx => ctx.type === 'padder' ? 0.15 : coTight(ctx) ? 0.85 : 0.3, tone: ctx => coTight(ctx) ? 'bad' : 'mixed', text: ctx => coTight(ctx) ? `The change order arrives at 4 pm, and it's fair. You sign at 6. The crew left for the Pruitt job at 1. Your floor stays open for eleven days.` : ctx.type === 'padder' ? `The itemized order includes a $600 "contingency" line. You ask what it covers, and it disappears. Final: $1,950.` : `The itemized order comes in at $2,550. It's legitimate, just expensive. You approve it knowing exactly what you're paying for.` }
        ],
        later: `You met his deadline and kept your right to check. Luis now knows you read contracts, which shapes every future conversation about money.`
      },
      {
        key: 'D', text: `"I'd like a second opinion from another contractor before I approve anything extra."`,
        their: ctx => ctx.type === 'padder' ? `With a padded number, a second opinion was worth the wait: it gave you a price Luis had to match.` : `A second opinion is fair, but Luis's crew can't wait. His best reply was to move them to another job, so the check cost you time.`,
        q: ctx => ctx.type === 'padder' && (ctx.clues.includes(1) || ctx.clues.includes(2)) ? 3 : coTight(ctx) ? 1 : 2, s: { inf: 2, jdg: 0, coo: -1, lng: -1 },
        outcomes: [
          { p: ctx => ctx.type === 'padder' ? 0.15 : 0.8, tone: 'mixed', text: `The second contractor can come Monday and says the price is fair. The crew has left. You lose three weeks to save nothing.` },
          { p: ctx => ctx.type === 'padder' ? 0.85 : 0.2, tone: 'mixed', text: `The second opinion says $1,500 is reasonable. Luis comes down to $2,000 but the job slips nine days.` }
        ],
        later: `Information has a cost. Sometimes it's worth paying, but here a cheaper version of the same check was available on the spot.`
      },
      {
        key: 'E', text: `"Do it at the original price, or I'll have to leave an honest review about how this went."`,
        their: `A threat you'd be wrong to carry out gives Luis no reason to bend. His best reply was to do exactly what the contract says and nothing more.`,
        q: 0, s: { reg: -2, com: -2, coo: -2, lng: -2, neg: -1 },
        outcomes: [{ p: 1, tone: 'bad', text: `Luis's tone changes. "Then we'll finish the contracted work only." He tiles over a documented-and-declined rot repair, with your refusal in writing.` }],
        later: `A threat you'd be wrong to carry out is not leverage. Luis simply stopped trusting you.`
      },
      {
        key: 'F', text: `"Under Section 7, go ahead at documented cost plus 15%, not to exceed $2,600. Itemize it by Friday."`,
        needs: [0], vague: { text: `"Go ahead, up to $2,600. Send me the breakdown by Friday."`, q: ctx => coTight(ctx) ? 3 : coPad(ctx) ? 1 : 2, later: `You beat the clock and capped the risk. Without the contract, the cap was a number you made up.` },
        their: ctx => coTight(ctx) ? `The deadline was real and so was the price. A capped, written approval let Luis keep his crew and still owe you a breakdown.` : coPad(ctx) ? `A cap is a ceiling, and to a padder a ceiling looks like a target. "Documented" stretched until it reached $2,600.` : `Fair, fast and capped. But Luis had nothing to prove, and a cap gave every line a reason to be generous.`,
        q: ctx => coTight(ctx) ? 4 : coPad(ctx) ? 2 : 3, s: { inf: 1, neg: 2, bnd: 1, com: 2, jdg: 2 },
        outcomes: [
          { p: ctx => coTight(ctx) ? 0.85 : coPad(ctx) ? 0.1 : 0.6, tone: 'good', text: ctx => coTight(ctx) ? `Luis starts at 10 and still makes the Pruitt job at 1. Friday's itemized bill: $1,940, well under your cap.` : `Friday's itemized bill comes in at $2,050. Fair, documented, under your cap.` },
          { p: ctx => coTight(ctx) ? 0.15 : coPad(ctx) ? 0.9 : 0.4, tone: 'mixed', text: ctx => coPad(ctx) ? `Friday's bill is $2,600 exactly. Every line is "documented." Your cap became his price.` : `Friday's bill is $2,560: itemized, real, and right up against the cap you set.` }
        ],
        later: ctx => coTight(ctx) ? `You met the real deadline on your terms: approved, capped, and owed a breakdown.` : `A cap protects you from surprises, and tells the other side exactly how far they can go.`
      }
    ],
    analysis: {
      game: `A hold-up problem with information asymmetry. Luis knows more about the floor, and the open bathroom limits your alternatives. But the contract and your right to verify are leverage too.`,
      incentives: `Luis wants to keep his crew busy and be paid for real work. Most contractors aren't padding bills. Some are. Asking for documentation is how you tell the difference without insulting the honest ones.`,
      leverage: `Section 7 requires your written approval. Luis cannot proceed without you, which means his deadline is your deadline too.`,
      missing: `The real scope and cost. Both were cheap to discover: walk ten feet and ask for an itemized order.`,
      assumptions: `That "today" leaves no time to verify, and that a fixed bid means no changes, ever.`,
      controlled: `Whether you verified, and what you asked for in writing.`,
      couldnt: `The rot, the crew's schedule, and the price of plywood.`,
      concept: { term: `Hold-up problem`, name: `Deadlines and commitments shift who has leverage`, thinker: 'schelling', body: `Schelling showed that a deadline shifts bargaining power toward whoever sets it, as long as the other side believes it. The response isn't to ignore the deadline. It's to meet it on your terms: verify fast, approve in writing.` },
      second: { term: `Value of information`, name: `Check when checking is cheap`, thinker: 'duke', body: `Duke asks how much it would cost to know more. Looking at the floor took a minute. A second contractor took three weeks. Choose the cheapest check that resolves the uncertainty.` },
      better: `Check the deadline as well as the price. If the crew can wait until tonight, C: see it, get it itemized, sign. If the clock is real, F: approve now, capped, under Section 7.`,
      lesson: `Urgency is a negotiating position, and sometimes it's also true. Check which before you decide how to meet it.`
    }
  },

  // ───────────────────────────────────────────── The Offer
  {
    id: 'the-offer',
    rank: 8,
    level: `Complex negotiation`,
    arena: `The marketplace`,
    title: `The Offer`,
    lens: ['nash', 'schelling'],
    setting: `Phone call · Tuesday, 3:00 pm · Northfield Systems`,
    narrative: () => [
      `You've been offered an operations manager role at Northfield. Sam, the recruiter, is on the phone: "We're excited. The offer is <strong>$92,000</strong>. We'd love an answer by Friday."`,
      `You currently make $85,000. You have a second-round interview at another company next week, but no offer.`,
      `Alicia, who would be your manager, was warm and direct in every interview.`
    ],
    cast: [
      { name: `Sam`, role: `Recruiter`, archetype: `The Gatekeeper`, power: `Process`, note: `Measured on filling roles quickly within budget. Not the final decision-maker.` },
      { name: `Alicia`, role: `Hiring manager`, archetype: `The Straight Shooter`, power: `Formal authority`, note: `Wants the right person in the seat soon. Can push for budget.` }
    ],
    known: [`The offer is $92,000.`, `The deadline is Friday.`, `You have an interview elsewhere but no offer.`],
    unknown: [`How much room is in the budget.`, `How urgently they need someone.`, `Whether the posted range really applies to this role.`],
    types: [
      { id: 'room', p: 0.6, who: `Northfield`, label: `The range was real`, tell: `The role was posted at Level 3, the top of the range. Alicia had budget up to $104,000 for the right person.` },
      { id: 'banded', p: 0.4, who: `Northfield`, label: `The range covered two levels`, tell: `The posted $88,000–$110,000 spanned Level 2 and Level 3. This role was Level 2, which tops out at $96,000. Anything higher needed a VP.` }
    ],
    reads: 2,
    clues: [
      { label: `Re-read the job posting`, text: `Your state requires salary ranges in job postings. Northfield's lists $88,000–$110,000.` },
      { label: `Recall your last talk with Alicia`, text: `She mentioned twice that the team badly needs someone in place before the November launch. Their last hire fell through.` },
      { label: `Ask Alicia what level the role is`, text: c => c.type === 'banded' ? `"It's a Level 2. The posting covers Levels 2 and 3, so the range looks wider than it is. Level 2 tops out around ninety-six. Above that, a VP signs off."` : `"Level 3. We posted one range, and we hire into the whole of it for the right person."` }
    ],
    question: `What do you say to Sam?`,
    options: [
      {
        key: 'A', text: `"That sounds great. I'm happy to accept."`,
        their: `Sam's job is to fill the role within budget. You accepted the opening number, so Northfield's best reply was to say yes and move on.`,
        q: 1, s: { neg: -2, inf: -1, jdg: -1, coo: 1 },
        outcomes: [{ p: 1, tone: 'mixed', flags: { nf: 92 }, text: c => c.type === 'banded' ? `Sam is delighted. You start at $92,000. Six months later you learn that everyone else hired into Level 2 who asked got $96,000.` : `Sam is delighted. You start at $92,000. Six months later you learn a peer hired the same month started at $101,000.` }],
        later: `Fear of losing the offer answered for you. Asking would have cost a few awkward seconds. Not asking costs you every year, because each raise is a percentage of this number.`
      },
      {
        key: 'B', text: `"I have another offer at $105,000. Can you match it so I can say yes to you?"`,
        their: `Recruiters hear this a lot. Sam's best reply is to ask to see it, and you can't show what doesn't exist.`,
        q: 0, s: { com: -2, lng: -2, neg: -1, jdg: -2 },
        outcomes: [
          { p: c => c.type === 'banded' ? 0.8 : 0.5, tone: 'bad', flags: { nf: 92 }, text: `Sam asks, pleasantly, if you can share the offer in writing so they can "move quickly." You can't. The conversation gets a lot cooler, and $92,000 is still the number.` },
          { p: c => c.type === 'banded' ? 0.2 : 0.5, tone: 'good', flags: c => ({ nf: c.type === 'banded' ? 96 : 101 }), text: c => c.type === 'banded' ? `They come up to $96,000, the top of the level. You won a little. You also started a job with a lie that Alicia might someday discover.` : `They come up to $101,000. You won. You also started a job with a lie that Alicia might someday discover.` }
        ],
        later: `A fake offer is a false claim about your alternative. It only works until someone asks to see it, so its credibility was always borrowed. And when it works, it teaches you a habit that eventually fails publicly.`
      },
      {
        key: 'C', text: `"Your range goes to $110k and I can start before launch. Could we do $102k, decided by Tuesday?"`,
        their: c => c.type === 'banded' ? (c.clues.includes(2) ? `Alicia told you the role was Level 2 and topped out near ninety-six. Quoting the top of the posting asked Sam for a number that needed a VP, and Sam doesn't call VPs for this.` : `The posting looked like room, but it spanned two levels. $102,000 meant a VP's sign-off, so Sam's easy reply was the top of the level and a cooler tone.`) : `Alicia needs someone before November, and the posted range gave them room. You asked for something they could justify and offered what they needed, so meeting you partway was their best reply.`,
        needs: [0],
        vague: { s: { neg: 1, com: 2, jdg: 1 }, later: `You asked, which most people don't. Without their posted range, you asked for a favor rather than making a case.`, text: `"I'm excited about this. Is there any room on the number, something closer to $100k?"`, q: c => c.type === 'banded' && c.clues.includes(2) ? 2 : 3, their: `Sam needs a reason to take to Alicia. Asking for room without pointing to their posted range gave Sam little to argue with, so a small bump was the easy reply.`, outcomes: [
              { p: 0.45, tone: 'good', flags: { nf: 96 }, text: `Sam checks with Alicia and comes back at $96,000. Better than $92,000, though you never mentioned their posted range.` },
              { p: 0.55, tone: 'mixed', flags: { nf: 94 }, text: `Sam says there's a little room: $94,000. Without a reason Sam could take to Alicia, that was all there was.` }
            ] },
        q: c => c.type === 'banded' ? (c.clues.includes(2) ? 1 : 3) : 4, s: { neg: 2, inf: 2, com: 2, inc: 2, str: 2, jdg: 1 },
        outcomes: [
          { p: c => c.type === 'banded' ? 0.2 : 0.65, tone: 'good', flags: c => ({ nf: c.type === 'banded' ? 98 : 99 }), text: c => c.type === 'banded' ? `Alicia takes it to her VP, who signs off on $98,000. It took a favor, and Alicia mentions it once.` : `Sam checks with Alicia. They come back at $99,000 plus a $3,000 signing bonus, and the deadline moves to Tuesday.` },
          { p: c => c.type === 'banded' ? 0.8 : 0.35, tone: 'mixed', flags: c => ({ nf: c.type === 'banded' ? 94 : 96 }), text: c => c.type === 'banded' ? `Sam comes back at $94,000: "That's as high as this level goes without a VP." The call ends a little cooler than it started.` : `Sam says $96,000 is the ceiling this cycle, with a six-month review. Less than you asked, more than you had. You decide with full information.` }
        ],
        later: `You anchored with real data, told the truth about your alternatives, and offered something they valued: speed. That's a negotiation both sides can feel good about.`
      },
      {
        key: 'D', text: `"You need someone before launch, and I can start right away. To make the move I'd need $115,000."`,
        needs: [1], vague: { text: `"To make the move worthwhile I'd need $115,000. Otherwise I'm happy staying where I am."` },
        their: `That's above their posted ceiling of $110,000. Sam can't go there, so the best reply is to let you stay where you are, unless Alicia is desperate.`,
        q: 1, s: { neg: -1, coo: -2, reg: -1, bnd: 1 },
        outcomes: [
          { p: c => c.type === 'banded' ? 0.85 : 0.6, tone: 'bad', flags: { nf: 92, nfLapsed: true }, text: `It's above their posted range. Sam says they'll "keep you in mind for future roles." You're now negotiating with your current employer, who doesn't know you were looking.` },
          { p: c => c.type === 'banded' ? 0.15 : 0.4, tone: 'mixed', flags: c => ({ nf: c.type === 'banded' ? 96 : 105 }), text: c => c.type === 'banded' ? `Alicia calls you directly. "This level tops out at ninety-six, and the tone surprised me." You take $96,000 with an awkward start.` : `Alicia calls you directly. They can't go above $110,000 and are disappointed by the tone. You take $105,000 with a slightly awkward start.` }
        ],
        later: `You put a $7,000 raise on the table to chase a few thousand more. Even when it works, you took a large risk for a small gain. Never risk the whole deal for the last slice of it.`
      },
      {
        key: 'E', text: `"Thank you, this is exciting. Could I have until next Wednesday to think it through properly?"`,
        their: `A little more time is cheap for them to give. Without a reason to change the number, Sam gives you Monday and the same offer.`,
        q: 2, s: { reg: 1, jdg: 1, neg: -1, inf: 0 },
        outcomes: [{ p: 1, tone: 'mixed', flags: { nf: 92 }, text: `Sam agrees to Monday. You have more time but the same number. The other company doesn't make an offer.` }],
        later: `More time is useful only if you use it to change your alternatives or your information. Here, it changed neither.`
      },
      {
        key: 'F', text: `"If Level 2 tops out at ninety-six, could we do ninety-six now, with a written review for Level 3 at six months?"`,
        needs: c => c.type === 'banded' ? [2] : [-1],
        vague: {
          text: `"Could we do ninety-six, with a written review at six months?"`,
          q: c => c.type !== 'banded' ? (c.clues.includes(2) ? 1 : c.clues.includes(0) ? 2 : 3) : 3,
          their: c => c.type === 'banded' ? `You asked for the top of a band you didn't know existed. Lucky, and easy for Sam to say yes to.` : c.clues.includes(2) ? `Alicia told you the role was Level 3, the top of the posting. You asked for less than its own band anyway.` : `A modest, easy ask. Sam said yes fast, and that speed was information: there was more room.`,
          later: `A reasonable ask, made without knowing where the ceiling was.`
        },
        their: c => c.type === 'banded' ? `You asked for exactly what Sam could approve without a VP, plus a path past the ceiling. The easiest yes Sam gave all week.` : `The role was Level 3. You asked for less than the band it was posted in, and Sam said yes before you finished the sentence.`,
        q: c => c.type === 'banded' ? 4 : 2, s: { neg: 2, inf: 2, com: 2, inc: 2, lng: 2, jdg: 2 },
        outcomes: [
          { p: c => c.type === 'banded' ? 0.85 : 0, tone: 'good', flags: { nf: 96 }, text: `Sam says yes the same afternoon: $96,000, with the Level 3 review written into the offer letter. Alicia calls to say she's glad.` },
          { p: c => c.type === 'banded' ? 0.15 : 1, tone: 'mixed', flags: c => ({ nf: c.type === 'banded' ? 95 : 96 }), text: c => c.type === 'banded' ? `Sam gets you to $95,000 and the written review. Not quite the top, but the path is on paper.` : `Sam agrees almost before you finish: $96,000. The speed tells you the band went higher.` }
        ],
        later: c => c.type === 'banded' ? `You found the real ceiling, asked for it, and bought a path past it. That's negotiating the structure, not just the number.` : `Asking modestly is fine when the room is small. Here it wasn't, and the only way to know was to ask what level the role was.`
      }
    ],
    analysis: {
      game: `A bargaining game over a known range, with uncertainty about each side's alternatives. Most of the value is decided by the walk-away points, not the conversation.`,
      incentives: `Sam is measured on filling the role. Alicia needs someone before November. They want you, and they want you soon. That urgency was the most valuable thing you knew.`,
      leverage: `The posted range, their timeline, and your ability to start quickly. Not a fictional competing offer.`,
      missing: `Whether the posted range applied to this role at all. A posting can span two levels, and one question to Alicia would have told you.`,
      assumptions: `That the first number is final, or that a bigger threat gets a bigger number.`,
      controlled: `Your anchor, your honesty, and what you offered in return.`,
      couldnt: `Their budget, their other candidates, and whether the other company makes an offer.`,
      concept: { term: `Nash bargaining`, name: `Your walk-away options decide the split`, thinker: 'nash', body: `Nash's bargaining solution shows that how a deal is split depends on what each side gets if talks fail. Your real alternative was weak, staying at $85,000, but theirs was weak too: no hire before launch. Naming what you can offer them shifts the split honestly.` },
      second: { term: `Credible threats`, name: `A threat only works if they believe you'd carry it out`, thinker: 'schelling', body: `A threat only works if the other side believes you'd carry it out. Bluffs and ultimatums above the published range fail that test. Truthful information does not.` },
      better: `Ask what level the role is. If the range is real, C: anchor with their own range and offer what they value. If the role sits in a lower band, F: ask for its top and a written path past it.`,
      lesson: `Know both sides' alternatives, say true things about them, and never risk the whole offer to win the last few thousand.`
    }
  }
];
