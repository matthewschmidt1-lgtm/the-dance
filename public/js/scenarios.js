// Eight scenarios, one per rank of the board. The player is a pawn walking up the file.
//
// Option fields:
//   q        decision quality 0-4 (maps to PP.grades). Scored regardless of outcome.
//   s        skill deltas, keys from PP.skills
//   rel      relationship deltas for recurring characters
//   outcomes [{ p, tone: good|mixed|bad, text }]. Probabilities sum to 1.
//   later    long-term consequence; string or fn(ctx)
// Narrative and later text can be functions of ctx = { rel, flags } for the repeated game.
window.PP = window.PP || {};

PP.scenarios = [
  // ───────────────────────────────────────────── Rank 1
  {
    id: 'wrong-price',
    rank: 1,
    level: `Everyday decisions`,
    arena: `The marketplace`,
    title: `The Wrong Price`,
    lens: ['duke', 'schelling'],
    setting: `Hillcrest Market · Tuesday, 5:48 pm · Lane 4`,
    narrative: () => [
      `It's the end of a long day. You grab a bottle of olive oil because the shelf tag said <strong>$8.49</strong>. At the register it rings up at <strong>$11.99</strong>.`,
      `The cashier, Maya, is maybe nineteen. There are five people behind you. The man directly behind you sighs loudly and checks his phone.`,
      `Maya glances at the screen, then at you. She hasn't said anything yet.`
    ],
    cast: [
      { name: `Maya`, role: `Cashier`, archetype: `The People Pleaser`, power: `Discretion`, note: `Can void items and call for a price check. Wants the line moving and no trouble.` },
      { name: `Dev`, role: `Shift lead`, archetype: `The Gatekeeper`, power: `Formal authority`, note: `Holds the override code. Currently restocking aisle 9.` },
      { name: `The man behind you`, role: `Shopper`, archetype: `The Competitor`, power: `Social pressure`, note: `No authority at all, but his impatience is already shaping the room.` }
    ],
    known: [`The register says $11.99.`, `You remember a shelf tag reading $8.49.`, `The difference is $3.50.`],
    unknown: [`Whether the tag was for this exact bottle.`, `Whether Maya can fix it herself.`, `How long a price check takes.`],
    clues: [
      { label: `Look at Maya's screen`, text: `A sticky note on the monitor reads "Overrides over $5 → call Dev x204." There's a Price Check key. A $3.50 fix may be Maya's call, if she's willing to make it.` },
      { label: `Look at the bottle`, text: `It's the 1-liter bottle. The 500 ml bottle sat right next to it on the shelf. You're now less sure which one the $8.49 tag belonged to.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `"The shelf said $8.49, and I know you can override small amounts. Can you just ring it at that?"`,
        needs: [0], vague: { q: 1, text: `"That's not right. The shelf said $8.49, so that's what I'll pay."` },
        their: `Maya can't override over $5 without calling Dev, and a line is watching her. A flat demand leaves her two moves: give in under pressure or call for backup. Neither is fast.`,
        q: 2, s: { reg: -2, com: -1, coo: -1, bnd: 1 },
        outcomes: [
          { p: 0.6, tone: 'good', text: `Maya flushes and calls Dev. Six minutes later he confirms the tag was right and overrides it. You saved $3.50. You were right this time, and the whole lane watched Maya get nervous.` },
          { p: 0.4, tone: 'bad', text: `Maya calls Dev. Six minutes later he walks back with the tag: it was for the 500 ml bottle. You pay $11.99 with five people watching.` }
        ],
        later: `Maya remembers you. Next time she'll be polite and careful, which is not the same as being on your side.`
      },
      {
        key: 'B', text: `Pay the $11.99. Three dollars isn't worth holding up the line.`,
        their: `Maya's real worries were the line and getting blamed. You solved both for her, at your own expense, without finding out whether you had to.`,
        q: 2, s: { jdg: 1, reg: 1, bnd: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `The line keeps moving. You're out $3.50, or possibly nothing, since you never found out if the tag was for this bottle.` }],
        later: `Fine as a conscious choice: your time has a price too. It only becomes a pattern problem if "let it go" is your default every time money is involved.`
      },
      {
        key: 'C', text: `"The tag might've been for the smaller bottle. Quick to check, or should I sort it out at the desk?"`,
        their: `You gave Maya two ways to help that cost her nothing: a fix she's allowed to make, or a clean handoff to the desk. Her best reply was whichever was easier, and both worked for you.`,
        needs: [1],
        vague: { s: { com: 2, reg: 1, inc: 1, jdg: 1, coo: 1 }, later: `You gave Maya an easy path and took the line's pressure off her. You never mentioned the bottle size, so you were still half sure you were right.`, text: `"The shelf said $8.49. Is that quick to check, or should I sort it out at the desk?"`, q: 3, pv: [0.6, 0.4] },
        q: 4, s: { com: 2, inf: 2, reg: 1, inc: 2, jdg: 1, coo: 1 },
        outcomes: [
          { p: 0.7, tone: 'good', text: `Maya visibly relaxes. "I'll ring it at the shelf price and flag it for Dev. If it's wrong, that's on us." You're out the door in thirty seconds.` },
          { p: 0.3, tone: 'mixed', text: `Maya would rather not override it without a check, and tells you the service desk handles it in a minute. You check on the way: the tag was for the 500 ml bottle. You're glad you didn't argue.` }
        ],
        later: `You named your uncertainty, gave Maya an easy path, and took the line's pressure off her. She had the discretion, and you made using it painless.`
      },
      {
        key: 'D', text: `"Could you get a manager, please? I'd like this fixed properly rather than rushed."`,
        their: `Asking for a manager over $3.50 tells Maya you don't think she can handle it, and it costs everyone behind you five minutes. She had no reason to go out of her way after that.`,
        q: 1, s: { inc: -1, coo: -1, str: -1, bnd: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Maya pages Dev. Four minutes pass. Dev overrides the price without checking anything, mostly to clear the lane. You got the price, and Maya looks like she failed at something.` }],
        later: `Escalating skipped the person who could have helped. Next time you're in Lane 4, you're "the manager customer."`
      },
      {
        key: 'E', text: `Pay now so the line can move, keep the receipt, and stop at customer service on the way out.`,
        their: `Maya stays out of it, and the service desk exists for exactly this. You traded a few minutes of your own time for no friction at all.`,
        q: 3, s: { reg: 2, jdg: 1, inf: 1, coo: 1 },
        outcomes: [
          { p: 0.6, tone: 'good', text: `You check the shelf on the way out. The tag was right. Customer service refunds the $3.50 in under a minute.` },
          { p: 0.4, tone: 'mixed', text: `You check the shelf on the way out. The tag belonged to the 500 ml bottle. No refund, and no scene.` }
        ],
        later: `You separated the time pressure from the money question and checked your facts before pressing your case. That habit is worth far more than $3.50.`
      }
    ],
    analysis: {
      game: `A common-interest game with a clock running. Maya wants the line moving and no trouble. You want a fair price. The line wants speed. All three can win at once.`,
      incentives: `Maya's real incentive is to avoid a scene and avoid blame. Anything that makes helping you easy, quick and blame-free makes her likely to help.`,
      leverage: `Not the manager. The leverage was Maya's goodwill, because she decides how hard to try. Store policy was a backup, not the opening move.`,
      missing: `Which bottle the tag belonged to. You were acting on a memory, under time pressure. Checking would have cost a minute. Being wrong cost a public scene.`,
      assumptions: `That the store was wrong, and that someone above Maya was needed to fix it.`,
      controlled: `Your tone, how certain you sounded, and when you raised it.`,
      couldnt: `Store policy, the line's patience, and what the tag actually said.`,
      concept: { name: `Decision quality is not outcome`, thinker: 'duke', body: `Duke calls the habit of judging a choice by how it turned out "resulting." Arguing loudly and being right is still a poor decision, because it risked a public loss on a fact you hadn't checked. Asking calmly and being wrong is still a good one.` },
      second: { name: `Make the cooperative move cheap`, thinker: 'schelling', body: `Schelling studied how you shape someone's choice by changing what each option costs them. Offering the service desk made helping you easy and saying no blame-free. Maya's best reply became the one you wanted.` },
      better: `Option C, or E if the line pressure felt heavy. Both keep the question small and keep your facts honest.`,
      lesson: `The person in front of you often has more discretion than the person above them. Make helping you easy.`
    }
  },

  // ───────────────────────────────────────────── Rank 2
  {
    id: 'just-this-once',
    rank: 2,
    level: `Conflicting interests`,
    arena: `The workplace`,
    title: `Just This Once`,
    lens: ['axelrod', 'aumann'],
    setting: `Brightline Logistics · Thursday, 4:12 pm · Direct message`,
    narrative: () => [
      `A message from Dana, who sits two desks over: <em>"Any chance you could take the vendor section of the Q3 report? It's due Monday. I'm drowning."</em>`,
      `You have your own deadline, the Henley account summary, due Friday at noon.`,
      `This is the third time Dana has asked for help this quarter. Once she thanked you in the team channel. Once she didn't mention it at all.`
    ],
    cast: [
      { name: `Dana`, role: `Coworker`, archetype: `Unclear`, power: `Relationship`, note: `Could be overwhelmed. Could be offloading. You don't know yet, and that's the point.` },
      { name: `Ellen`, role: `Your manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Assigns the work. Rarely checks who actually does it.` }
    ],
    known: [`Dana has asked three times this quarter.`, `You have a Friday noon deadline.`, `The report is due Monday.`],
    unknown: [`How big "the vendor section" is.`, `Why Dana is behind.`, `Whether your help will be acknowledged.`],
    types: [
      { id: 'overloaded', p: 0.6, who: `Dana`, label: `Dana was genuinely overloaded`, tell: `Ellen gave her a new client onboarding the day before, with no deadline relief.` },
      { id: 'offloader', p: 0.4, who: `Dana`, label: `Dana was offloading`, tell: `Her own work was on track, and she'd asked three other people for "quick" help that month.` }
    ],
    clues: [
      { label: `Check the project tracker`, text: ctx => ctx.type === 'offloader' ? `Dana has two open items, both on track. Nothing new was assigned to her this week.` : `Dana has four open items. Two are overdue. One is a new client onboarding Ellen assigned her yesterday, with no deadline relief.` },
      { label: `Scroll back through the team channel`, text: ctx => ctx.type === 'offloader' ? `She's asked three different people for "quick" help this month. She thanked one of them.` : `After the first time you helped: "Huge thanks for the vendor numbers, you saved me." After the second time: nothing.` }
    ],
    question: `How do you reply?`,
    options: [
      {
        key: 'A', text: `"Sure, send it over. I'll make it work."`,
        their: `Dana is overloaded, and you've said yes before. From her side, asking you again is the cheapest move she has, and today it worked again.`,
        q: ctx => ctx.type === 'offloader' && ctx.clues.length > 0 ? 1 : 2, s: { coo: 2, bnd: -2, lng: -1, inf: -1 }, rel: { dana: 1 }, flags: { danaPattern: 'always-yes' },
        outcomes: [{ p: 1, tone: 'mixed', text: `Dana sends three hearts. You work until 9 pm on Thursday to fit it in, and your Henley summary goes in at 11:58 am Friday.` }],
        later: `Two weeks later Dana asks again. This time the message is shorter, and there's no "any chance." Unconditional cooperation teaches people what to expect from you.`
      },
      {
        key: 'B', text: `"I've covered for you twice this quarter, so I'm going to pass on this one."`,
        needs: [1], vague: { q: ctx => ctx.type === 'offloader' && ctx.clues.length > 0 ? 3 : 2, text: `"I can't this time. I've got Henley due Friday."` },
        their: ctx => ctx.type === 'offloader' ? `Dana's own work was on track. A clear no, with the history behind it, was the reply that ended the pattern.` : `A flat no protects your Friday. Dana hears a door closing without knowing why, and she still has to solve her problem somewhere else.`,
        q: ctx => ctx.type === 'offloader' ? 4 : 2, s: { bnd: 2, coo: -1, com: -1, inf: -1 }, rel: { dana: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Dana replies "no worries!!" She's noticeably cooler at Friday's standup.` }],
        later: `Your time is protected. But you learned nothing about why Dana keeps asking, and you may have turned away someone who was genuinely stuck.`
      },
      {
        key: 'C', text: `"What's involved, and when do you need it? I'm on Henley until Friday noon."`,
        their: `A question costs Dana nothing to answer and shows you're open but not free. Her best reply was to shrink the ask to fit your schedule, which is what most people do when you ask.`,
        q: ctx => (ctx.type !== 'offloader' && ctx.clues.includes(0)) || (ctx.type === 'offloader' && ctx.clues.includes(1)) ? 3 : 4, s: { inf: 2, neg: 2, com: 2, bnd: 1, coo: 1 }, rel: { dana: 1 }, flags: { danaPattern: 'trade' },
        outcomes: [
          { p: 0.8, tone: 'good', text: `Dana explains: the numbers exist, they just need formatting, about two hours. You offer Friday afternoon. She offers to cover your Monday standup notes. Done.` },
          { p: 0.2, tone: 'mixed', text: `Dana goes quiet, then says she'll "figure it out." It turns out the section was most of the report. Asking saved you a weekend.` }
        ],
        later: `You helped on terms you could keep, and Dana learned that asking you works when she's specific. That's the start of a stable working relationship.`
      },
      {
        key: 'D', text: `"I can, if you ask Ellen to take something off my plate."`,
        their: `It's a fair trade, but it asks Dana to go to her manager about your workload. That's a cost she didn't plan on, so it often stalls.`,
        q: ctx => ctx.type === 'offloader' && ctx.clues.length > 0 ? 3 : 2, s: { neg: 1, bnd: 2, inc: 1, com: -1 },
        outcomes: [
          { p: 0.5, tone: 'mixed', text: `Dana asks Ellen. Ellen, an Avoider, says "work it out between you." You end up doing it anyway, a day late.` },
          { p: 0.5, tone: 'good', text: `Ellen pushes your Henley deadline to Monday. You do the vendor section Friday. Fair trade.` }
        ],
        later: `A legitimate condition, but routed through the person least likely to decide anything.`
      },
      {
        key: 'E', text: `"Ellen just gave you that onboarding, didn't she? Want to raise it with her together?"`,
        their: ctx => ctx.type === 'offloader' ? `Dana wasn't overloaded, so taking it to Ellen treated a habit as a workload problem.` : `Going to Ellen together fixes the real problem, Dana's load, but it puts her on the spot in front of her boss. Some people welcome that. Others hear it as being managed.`,
        // There's no new onboarding to point to if Dana is offloading, so this never sharpens then.
        needs: ctx => ctx.type === 'offloader' ? [-1] : [0],
        vague: { q: ctx => ctx.type === 'offloader' && ctx.clues.length > 0 ? 1 : 2, s: { coo: 1, com: 1, neg: -1 }, later: `Kind instinct, wrong first step. You proposed a fix before you knew what Dana was actually dealing with.`, text: `"Sounds like you're swamped. Want to raise it with Ellen together?"` },
        q: 4, s: { inc: 2, coo: 2, com: 1, inf: 1 }, rel: { dana: 0 },
        outcomes: [
          { p: ctx => ctx.type === 'offloader' ? 0.9 : 0.6, tone: 'mixed', text: `Dana hesitates. She doesn't want Ellen to think she's struggling. "It's fine, I'll manage." She manages, badly.` },
          { p: ctx => ctx.type === 'offloader' ? 0.1 : 0.4, tone: 'good', text: `Dana agrees. Ellen, cornered by two people at once, actually moves the onboarding deadline.` }
        ],
        later: `You found the real cause, Ellen's new assignment, and offered to take it to the source together. Whether Dana was ready for that was up to her. It was the right problem to solve.`
      }
    ],
    analysis: {
      game: `A repeated favor game. The question isn't just "help or not" today. It's what pattern you're setting for the next ten requests.`,
      incentives: `Dana wants the report done with the least pain. If help from you is free and unconditional, asking you is her cheapest option every time.`,
      leverage: `Your yes. It's worth more when it's specific and conditional than when it's automatic.`,
      missing: `The size of the task and whether Dana is overloaded or disorganized. One question would have answered both.`,
      assumptions: `That the choice was yes or no. Most requests have a "yes, if" or a "yes, when."`,
      controlled: `What you asked, what you offered, and on what terms.`,
      couldnt: `Dana's workload, Ellen's management style, and whether Dana says thanks.`,
      concept: { name: `Reciprocity beats both extremes`, thinker: 'axelrod', body: `In Axelrod's computer tournaments, Tit for Tat won: cooperate first, then do what the other side did last time. Strategies that never pushed back got exploited, and strategies that defected first got stuck in mutual defection. Asking what the task involves and trading help for help is the same idea: cooperative, conditional, and easy for Dana to read.` },
      second: { name: `This is a repeated game`, thinker: 'aumann', body: `Aumann showed that repeated interactions follow different logic than one-offs. Your answer to Dana is also your answer to her next five requests.` },
      better: `Option C. Gather information first, then say yes on terms you can keep.`,
      lesson: `Before you answer a request, find out what it actually is.`
    }
  },

  // ───────────────────────────────────────────── Rank 3
  {
    id: 'the-spot',
    rank: 3,
    level: `Conflicting interests`,
    arena: `The neighborhood`,
    title: `The Spot`,
    lens: ['schelling', 'axelrod'],
    setting: `Alder Street · Saturday, 8:30 am · Out front`,
    narrative: () => [
      `For four years you've parked on the street directly in front of your house. Everyone on the block does the same in front of theirs.`,
      `Gary moved in next door three weeks ago. For the past four days, his pickup has been in "your" spot. Today you had to park half a block away carrying groceries.`,
      `You see Gary on his porch with a coffee. He waves.`
    ],
    cast: [
      { name: `Gary`, role: `New neighbor`, archetype: `Unclear`, power: `Proximity`, note: `You'll live next to him for years. You know almost nothing about him yet.` },
      { name: `Ruth`, role: `Neighbor across the street`, archetype: `The Connector`, power: `Social capital`, note: `Has lived here 22 years. Knows everyone, and everything.` }
    ],
    known: [`Gary has parked there four days running.`, `Everyone on the block parks in front of their own house.`, `He waved at you.`],
    unknown: [`Whether this is temporary.`, `Whether Gary knows the block's habit.`, `Whether you have any actual right to that spot.`],
    clues: [
      { label: `Look at the curb`, text: `No signs, no permits, no markings. It's a public street. Legally, anyone can park there.` },
      { label: `Ask Ruth`, text: `"Oh, Gary's having his driveway resealed. The contractor told him it'd be a week. Nice man. Has a new dog."` }
    ],
    question: `What's your move?`,
    options: [
      {
        key: 'A', text: `Leave a polite note on his windshield asking him to use his own driveway.`,
        their: `Gary's driveway was being resealed, so he couldn't. A note from a stranger reads as an accusation, and there's no way to answer it except by feeling judged.`,
        q: 1, s: { com: -2, reg: -1, inf: -1, lng: -1 }, rel: { gary: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Gary moves the truck. Then he knocks, note in hand: "Didn't realize you owned the street." It's polite. It's also cold.` }],
        later: `You claimed a right you don't have, in writing, to someone you'll live beside for years. Notes feel low-risk to send and land harder than you intend.`
      },
      {
        key: 'B', text: `Walk over, introduce yourself, and ask about the truck.`,
        their: `Gary is new and had no idea the block has an unwritten system. A friendly question let him explain the reseal and offer to move, which cost him nothing and started you off as neighbors.`,
        q: 4, s: { com: 2, inf: 2, reg: 1, coo: 2, lng: 2 }, rel: { gary: 2 },
        outcomes: [
          { p: 0.8, tone: 'good', text: `"Oh no, sorry! My driveway's being resealed, it's done Tuesday. I had no idea there was a system." He moves the truck that afternoon and offers you a coffee.` },
          { p: 0.2, tone: 'mixed', text: `Gary's a little stiff. "It's a public street. But fine, the driveway's done Tuesday." He moves it Tuesday. You got the facts in one minute, and nothing was put in writing.` }
        ],
        later: `You learned the facts, taught the norm without accusing anyone, and made a first impression that will matter later.`
      },
      {
        key: 'C', text: `It's a public street, so park in front of his house for a few days. Fair's fair.`,
        needs: [0], vague: { text: `Park in front of his house for a few days so he gets the idea.` },
        their: `Gary didn't know there was a message to get. From his side, a stranger started a feud for no reason, and his best reply was to stop being friendly.`,
        q: 0, s: { reg: -2, coo: -2, lng: -2, str: -1 }, rel: { gary: -3 },
        outcomes: [{ p: 1, tone: 'bad', text: `Gary doesn't get the point. He just thinks you're strange. Ruth saw the whole thing and mentions it at the block party.` }],
        later: `That was the urge to get even, dressed up as a plan. Retaliation only works as a signal if the other person understands what it's a reply to. Gary didn't, so you paid for a move he never noticed.`
      },
      {
        key: 'D', text: `Say nothing. His driveway's only being resealed this week, so park down the block until it's done.`,
        needs: [1], vague: { text: `Say nothing, and park down the block until it sorts itself out.`, q: 2, s: { reg: 1, bnd: -1, inf: -1 }, later: `It worked, by luck. Had it not been temporary, you'd be three weeks into quiet resentment with someone who doesn't know anything is wrong.` },
        their: `Gary never learns anything was wrong. It does resolve itself when the reseal ends, but you gave up the chance to start the relationship on your terms.`,
        q: 3, s: { reg: 1, inf: 1, jdg: 1 }, rel: { gary: 0 },
        outcomes: [{ p: 1, tone: 'mixed', text: `On Wednesday the truck moves back to Gary's driveway. Problem solved by itself. You carried groceries half a block for a week.` }],
        later: `You knew it was only a week, so waiting cost you a short walk. It also cost you the chance to meet Gary on good terms, and you'll be dealing with him again.`
      },
      {
        key: 'E', text: `Ask on the neighborhood app whether anyone knows who owns the white truck.`,
        their: `Gary sees his truck discussed in public before he's met anyone. Even a mild post reads as a complaint, and that first impression is the one he keeps.`,
        q: 1, s: { com: -2, reg: -1, coo: -2, lng: -2 }, rel: { gary: -3 },
        outcomes: [{ p: 1, tone: 'bad', text: `Twenty-two replies. Someone posts a photo of the truck. Gary's new to the app and to the street. He sees it.` }],
        later: `You escalated a private, one-sentence conversation into a public referendum on a new neighbor.`
      }
    ],
    analysis: {
      game: `A coordination game around an unwritten norm. The block parks out front by habit, not by right. Gary hasn't been told the rules of a game he didn't know he was playing.`,
      incentives: `Gary wants somewhere to park while his driveway is unusable, and he wants to be liked by new neighbors. Those incentives point toward easy cooperation if you ask.`,
      leverage: `Almost none legally. Your real leverage was goodwill and the fact that Gary also wants to get along.`,
      missing: `Why he was parking there, and for how long. Ruth or Gary could have told you in one sentence.`,
      assumptions: `That the spot is yours, and that four days means forever.`,
      controlled: `Whether to ask, how to ask, and in public or in private.`,
      couldnt: `Gary's driveway schedule and what the law says about public parking.`,
      concept: { name: `Focal points`, thinker: 'schelling', body: `Schelling observed that people coordinate on obvious, unspoken solutions, like "park in front of your own house," without ever agreeing to them. These focal points are powerful, but they only work when everyone can see them. A newcomer can't.` },
      second: { name: `The first move sets the tone`, thinker: 'axelrod', body: `Axelrod found that strategies that opened by cooperating did best over time. With a new neighbor, your first move is most of what they'll know about you.` },
      better: `Option B. One friendly, curious conversation.`,
      lesson: `Before defending a right, check that it exists. Often what you have is a norm, and norms spread by explaining, not by enforcing.`
    }
  },

  // ───────────────────────────────────────────── Rank 4
  {
    id: 'credit-taker',
    rank: 4,
    level: `Subtle power dynamics`,
    arena: `The workplace`,
    title: `The Credit Taker`,
    lens: ['nash', 'duke'],
    setting: `Brightline Logistics · Monday, 10:00 am · Conference room B`,
    narrative: ctx => {
      const p = [
        `You spent three days building the regional cost analysis for today's department meeting.`,
        `Your coworker Jordan is presenting it. He walks through several of your key findings as though they were his own. He never mentions you.`,
        `Ellen, your manager, nods. "Really sharp thinking, Jordan."`,
        `Jordan looks directly at you, and says nothing.`
      ];
      if (ctx.rel.dana > 0) p.push(`Across the table, Dana catches your eye. She knows those slides were yours.`);
      return p;
    },
    cast: [
      { name: `Jordan`, role: `Coworker`, archetype: `The Competitor`, power: `Visibility`, note: `He's the one holding the clicker. In this room, that's power.` },
      { name: `Ellen`, role: `Manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Decides reviews and raises. Dislikes open conflict in meetings.` },
      { name: `Dana`, role: `Coworker`, archetype: `Witness`, power: `Relationship`, note: `Knows the truth. Whether she'd say so depends on your history.` }
    ],
    known: [`You built most of the analysis.`, `Jordan didn't credit you.`, `Ellen praised Jordan in front of the team.`],
    unknown: [`Whether Jordan did this deliberately.`, `What Ellen already knows about who did the work.`, `How Ellen reacts to public correction.`],
    types: [
      { id: 'scared', p: 0.6, who: `Jordan`, label: `Jordan was scared, not scheming`, tell: `His hand shook on the clicker, his review is Thursday, and the footer was changed in a hurry that morning.` },
      { id: 'schemer', p: 0.4, who: `Jordan`, label: `Jordan took the credit on purpose`, tell: `He was calm and rehearsed, and the version history shows he removed your name from the title slide on Friday, days before the meeting.` }
    ],
    clues: [
      { label: `Check the file's version history`, text: ctx => ctx.type === 'schemer' ? `The deck's history shows you as the author of 31 of its 38 slides. On Friday, Jordan removed your name from the title slide and changed the footer.` : `The deck's history shows you as the author of 31 of its 38 slides. That record exists whatever anyone says in this room. The footer was changed to his name this morning, at 9:52.` },
      { label: `Watch Jordan closely`, text: ctx => ctx.type === 'schemer' ? `He's relaxed, almost rehearsed, and hasn't looked at his notes once. His review is Thursday, but he doesn't look worried.` : `His hand shakes slightly on the clicker. You heard last week that his performance review is on Thursday. He might be scared, not scheming. Or both.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `"Actually, I built 31 of those 38 slides. The version history shows it. Happy to walk through it."`,
        needs: [0], vague: { text: `"Actually, I built most of that analysis. Happy to walk everyone through how it works."` },
        their: `Jordan's review is Thursday, and he can't afford to look like he took your work. Corrected in public, his best reply is to defend himself, and the room watches the two of you instead of the analysis.`,
        shaped: ctx => (ctx.rel.dana || 0) > 0 ? `Dana trusts you after Just This Once. Her nodding along made the room more likely to believe you: about 70% instead of 50%.` : (ctx.rel.dana || 0) < 0 ? `Dana is cool on you after Just This Once. Her silence made the room more likely to doubt you: about 65% instead of 50%.` : null,
        q: ctx => ctx.type === 'schemer' && ctx.clues.length > 0 ? 2 : 1, s: { reg: -1, com: -1, bnd: 2, lng: -1, str: -1 }, rel: { jordan: -2 },
        outcomes: [
          { p: ctx => (ctx.rel.dana || 0) > 0 ? 0.7 : (ctx.rel.dana || 0) < 0 ? 0.35 : 0.5, tone: 'mixed', text: `"Actually, I built most of that." The room goes quiet. Ellen says "Let's take that offline." You're right, and you're now part of an awkward moment.` },
          { p: ctx => (ctx.rel.dana || 0) > 0 ? 0.3 : (ctx.rel.dana || 0) < 0 ? 0.65 : 0.5, tone: 'bad', text: `Jordan says "It was a team effort, obviously." Ellen moves on quickly. You look like you cared more about credit than the work.` }
        ],
        later: `The need to be seen as right, right now, made this move. Jordan is now an adversary, and Ellen filed the moment under "conflict" rather than "contribution."`
      },
      {
        key: 'B', text: `Stay quiet now, and talk to Jordan privately right after the meeting.`,
        their: ctx => ctx.type === 'schemer' ? `Jordan took the credit on purpose. In private, his best reply was to deny it, and now he knew you'd noticed.` : `In private, Jordan can fix it without losing face, which is what a scared person most wants. It also means nobody else saw your work today.`,
        q: ctx => ctx.type === 'schemer' && ctx.clues.length > 0 ? 1 : 3, s: { reg: 2, com: 1, coo: 1, bnd: 1 }, rel: { jordan: 1 },
        outcomes: [
          { p: ctx => ctx.type === 'schemer' ? 0.15 : 0.8, tone: 'good', text: `Jordan is embarrassed. "I froze up. I'll fix it." He sends the team an email crediting your analysis by name.` },
          { p: ctx => ctx.type === 'schemer' ? 0.85 : 0.2, tone: 'mixed', text: ctx => ctx.type === 'schemer' ? `Jordan smiles. "I think you're remembering it differently." By Thursday, his version is the official one.` : `Jordan gets defensive. "We're a team, I didn't think it mattered." Nothing changes in Ellen's mind.` }
        ],
        later: `You gave Jordan a private way to correct course. Whether he takes it tells you a lot about him.`
      },
      {
        key: 'C', text: `Ask Jordan a question that shows you built it: "Should we include the Q2 outliers I flagged?"`,
        their: `Your question gave Jordan an easy, face-saving reply: credit you while answering. Refusing would have exposed him, so his best reply was to share the stage.`,
        q: ctx => ctx.type === 'schemer' && ctx.clues.includes(0) ? 3 : 4, s: { str: 2, com: 2, reg: 1, inc: 1, bnd: 1 }, rel: { jordan: 0 },
        outcomes: [
          { p: ctx => ctx.type === 'schemer' ? 0.55 : 0.75, tone: 'good', text: `Ellen looks at you. "You built the model?" "Most of it, yes." Ellen asks you to walk through slide 12. Jordan, to his credit, hands you the clicker.` },
          { p: ctx => ctx.type === 'schemer' ? 0.45 : 0.25, tone: 'mixed', text: `Jordan answers smoothly and the meeting moves on. Ellen may or may not have registered it. Your claim is on record, quietly.` }
        ],
        later: `You established ownership as a fact without accusing anyone. The tone mattered: asked with curiosity, it reads as collaboration. Asked with an edge, it reads as a jab.`
      },
      {
        key: 'D', text: `Bring the file's version history to Ellen after the meeting and ask how ownership should show.`,
        their: ctx => ctx.type === 'schemer' ? `Against someone doing it on purpose, a record is the only thing that works. The version history settled it without a debate.` : `Ellen avoids conflict, but a record is hard to wave away. The version history let her act without having to decide who was lying.`,
        needs: [0],
        vague: { s: { bnd: 1, reg: 1, com: -1 }, later: `You raised it the right way, but with nothing in hand. The version history was one click away.`, text: `Talk to Ellen afterward about who did most of the work.`, q: 2, their: `Ellen avoids conflict. Without evidence, her easiest reply was to call it a team effort and move on.`, outcomes: [
              { p: 0.35, tone: 'good', text: `Ellen listens and promises to keep an eye on it. Without anything to show her, it's your word against Jordan's.` },
              { p: 0.65, tone: 'mixed', text: `Ellen says "I'm sure it was a team effort" and changes the subject. You had nothing to show her.` }
            ] },
        q: ctx => ctx.type === 'schemer' ? 4 : 3, s: { inf: 2, bnd: 1, lng: 2, reg: 1, com: -1 },
        outcomes: [
          { p: ctx => ctx.type === 'schemer' ? 0.8 : 0.7, tone: 'good', text: `You bring Ellen the version history, framed around clarity: "I want to make sure my work is visible for review season." Ellen thanks you. She'd assumed it was joint work.` },
          { p: ctx => ctx.type === 'schemer' ? 0.2 : 0.3, tone: 'mixed', text: `Ellen, an Avoider, says "I'm sure it was a team effort" and changes the subject. The documentation is still yours to keep.` }
        ],
        later: `Slower and less satisfying than a public moment, but you built a record that lasts.`
      },
      {
        key: 'E', text: `Let it go this time, and put your name on every slide from now on.`,
        their: `Jordan learns that taking credit cost him nothing. You protect next time, but this time's work stays his in Ellen's mind.`,
        q: ctx => ctx.type === 'schemer' && ctx.clues.length > 0 ? 0 : 2, s: { reg: 2, lng: 1, bnd: -1, com: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `You put your name on future slide footers and send recap emails after each working session. Today's credit is gone.` }],
        later: `Smart systems going forward. But Ellen's impression of who drove this project is now set, and impressions are hard to revise.`
      }
    ],
    analysis: {
      game: `A signaling game with an audience. The real question isn't how you feel about Jordan. It's what Ellen ends up believing about who does the work.`,
      incentives: `Jordan may be desperate before his review. Ellen wants smooth meetings and capable people. You want accurate credit and a working relationship that survives.`,
      leverage: `The version history and your knowledge of the work. Anyone can claim credit, so a claim alone is cheap talk. A file history and fluent answers about the model are hard to fake, which is why they persuade where a claim can't.`,
      missing: `Jordan's intent, and what Ellen already believes. The "Prepared by J. Pike" footer is evidence he claimed the work. It is not evidence of why.`,
      assumptions: `That Jordan is a villain, and that a moment of lost credit is permanent.`,
      controlled: `Your timing, your tone, and whether you correct the record publicly or privately.`,
      couldnt: `Jordan's motives, Ellen's style, and what was already said.`,
      concept: { name: `Best response`, thinker: 'nash', body: `Nash's insight is to evaluate each move by the other players' best reply. A public correction invites Jordan to defend himself and Ellen to shut it down. A good question gives Ellen a reason to look at you, and gives Jordan nothing to fight.` },
      second: { name: `Intent is uncertain`, thinker: 'duke', body: `You can't know if Jordan meant it. Duke would ask: which response works reasonably well whether he's scheming or just scared? C and B both do.` },
      better: `C in the room, then B or D afterward. The strongest response here is a sequence, not a single move.`,
      lesson: `When you can't control the moment, control the record.`
    }
  },

  // ───────────────────────────────────────────── Rank 5
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
      { id: 'honest', p: 0.65, who: `Luis`, label: `Luis was honest`, tell: `The rot was real and the price was fair. The tell: he could break the $2,600 down line by line.` },
      { id: 'padder', p: 0.35, who: `Luis`, label: `Luis was padding the bill`, tell: `The rot was real but small. The tell: he wouldn't break down the $2,600, and "it probably runs under the tub" was doing a lot of work.` }
    ],
    clues: [
      { label: `Read your contract`, text: `Section 7: "Unforeseen conditions will be billed at documented cost plus 15%, with the owner's written approval of a change order." The bid was fixed, with a written exception for exactly this.` },
      { label: `Look at the floor yourself`, text: ctx => ctx.type === 'padder' ? `Near the toilet flange there's a soft patch, maybe two feet square. Luis says it "probably runs under the tub," but he hasn't opened that up.` : `Near the toilet flange, about a 3-by-4-foot area of plywood is dark and soft. It looks like a slow leak over many years. The rot appears real.` },
      { label: `Ask how he got to $2,600`, text: ctx => ctx.type === 'padder' ? `"That's just what these run," he says. He doesn't break it down, and changes the subject to the crew's schedule.` : `He doesn't hesitate: "Two sheets of plywood, a sister joist, a day and a half of labor, plus 15% like the contract says."` }
    ],
    question: `What do you say to Luis?`,
    options: [
      {
        key: 'A', text: `"I've seen the rot myself, and it's real. Go ahead, and keep the crew here."`,
        needs: [1], vague: { text: `"Go ahead. I trust you, and I need the crew here."` },
        their: ctx => ctx.type === 'padder' ? `Luis was padding. Approving on the spot meant he never had to justify the number.` : `Luis is probably honest, but nothing you said made honesty his best move. Approving on the spot makes padding free.`,
        q: ctx => ctx.type === 'padder' && (ctx.clues.includes(1) || ctx.clues.includes(2)) ? 0 : 1, s: { coo: 1, jdg: -1, inf: -2, neg: -2 },
        outcomes: [
          { p: ctx => ctx.type === 'padder' ? 0.15 : 0.7, tone: 'mixed', text: `The work is done well. The final invoice shows $2,600 for materials and labor you never saw itemized. It was probably fair. You'll never know.` },
          { p: ctx => ctx.type === 'padder' ? 0.85 : 0.3, tone: 'bad', text: `The work is done. Later a friend in construction looks at the photos: "Documented, that's about $1,900." You paid $700 extra under a deadline you never tested.` }
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
        their: ctx => ctx.type === 'padder' ? `A written, itemized order is the one thing a padded bill can't survive. Luis's best reply was to price it honestly or lose your approval.` : `Asking to see it and get it in writing costs an honest contractor nothing and makes padding a losing move. You also met his deadline, so his best reply was to document it and keep the crew.`,
        needs: [0],
        vague: { s: { inf: 1, neg: 1, bnd: 1, com: 2, jdg: 1 }, later: `You met his deadline and asked to check. Section 7 already gave you exactly this process, and you didn't know to name it.`, text: `"Show me the damage, and send me the cost in writing. I'll decide tonight."`, q: 3, pv: [0.6, 0.4] },
        q: 4, s: { inf: 2, neg: 2, bnd: 1, com: 2, jdg: 2, inc: 1 },
        outcomes: [
          { p: ctx => ctx.type === 'padder' ? 0.85 : 0.7, tone: 'good', text: `Luis walks you through it and sends a change order at 4 pm: $1,940 at documented cost plus 15%. You sign it at 6. The crew starts Thursday.` },
          { p: ctx => ctx.type === 'padder' ? 0.15 : 0.3, tone: 'mixed', text: ctx => ctx.type === 'padder' ? `The itemized order includes a $600 "contingency" line. You ask what it covers, and it disappears. Final: $1,950.` : `The itemized order comes in at $2,550. It's legitimate, just expensive. You approve it knowing exactly what you're paying for.` }
        ],
        later: `You met his deadline and kept your right to check. Luis now knows you read contracts, which shapes every future conversation about money.`
      },
      {
        key: 'D', text: `"I'd like a second opinion from another contractor before I approve anything extra."`,
        their: ctx => ctx.type === 'padder' ? `With a padded number, a second opinion was worth the wait: it gave you a price Luis had to match.` : `A second opinion is fair, but Luis's crew can't wait. His best reply was to move them to another job, so the check cost you time.`,
        q: ctx => ctx.type === 'padder' && (ctx.clues.includes(1) || ctx.clues.includes(2)) ? 3 : 2, s: { inf: 2, jdg: 0, coo: -1, lng: -1 },
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
      concept: { name: `Commitments and deadlines`, thinker: 'schelling', body: `Schelling showed that a deadline shifts bargaining power toward whoever sets it, as long as the other side believes it. The response isn't to ignore the deadline. It's to meet it on your terms: verify fast, approve in writing.` },
      second: { name: `What does information cost?`, thinker: 'duke', body: `Duke asks how much it would cost to know more. Looking at the floor took a minute. A second contractor took three weeks. Choose the cheapest check that resolves the uncertainty.` },
      better: `Option C. You kept the schedule and the right to verify.`,
      lesson: `Urgency is a negotiating position. Meet the deadline, but don't skip the check.`
    }
  },

  // ───────────────────────────────────────────── Rank 6
  {
    id: 'pick-a-side',
    rank: 6,
    level: `Multiple people, connected interests`,
    arena: `The workplace`,
    title: `Pick a Side`,
    lens: ['nalebuff', 'nash'],
    setting: `Brightline Logistics · Wednesday · Before Friday's decision`,
    narrative: ctx => {
      const p = [
        `The team's scheduling tool is failing. Priya wants to rebuild it from scratch. Marcus wants to patch the old one. They've been arguing for two weeks.`,
        `On Monday Priya caught you at the coffee machine: "You see it, right? Patching is just throwing good money after bad."`,
        `On Tuesday Marcus stopped by your desk: "Ellen trusts you. A rebuild will blow the budget. Back me on Friday."`,
        `Ellen will decide Friday. Today, in passing, she asked you: "What do you think?"`
      ];
      if (ctx.flags.danaPattern === 'trade') p.push(`Dana, who owes you one, mentions quietly: "Ellen usually goes with whatever the room already agrees on."`);
      if (ctx.rel.jordan < 0) p.push(`Jordan, still cool toward you since the meeting, has already told Marcus he's on his side.`);
      return p;
    },
    cast: [
      { name: `Priya`, role: `Senior analyst`, archetype: `The Straight Shooter`, power: `Expertise`, note: `Knows the system's flaws better than anyone. Says what she thinks.` },
      { name: `Marcus`, role: `Team lead`, archetype: `The Competitor`, power: `Seniority`, note: `Has Ellen's ear and a budget to protect.` },
      { name: `Ellen`, role: `Manager`, archetype: `The Avoider`, power: `Formal authority`, note: `Has to decide and would rather the decision feel obvious.` },
      { name: `Tom`, role: `Ellen's operations coordinator`, archetype: `The Quiet Influencer`, power: `Access`, note: `Rarely speaks in meetings. Ellen asks his opinion afterward.` }
    ],
    known: [`Both Priya and Marcus want your support.`, `Ellen asked for your view.`, `The decision is Friday.`],
    unknown: [`Which approach is actually better.`, `What Ellen cares about most.`, `What it costs you to back the losing side.`],
    clues: [
      { label: `Look at the support tickets`, text: `62% of last quarter's tickets trace back to just two of the tool's seven modules.` },
      { label: `Ask Tom`, text: `Tom shrugs. "Ellen's real worry is the budget review in March. She doesn't care how it's built. She cares about what it costs before March."` }
    ],
    question: `What do you tell Ellen?`,
    options: [
      {
        key: 'A', text: `"I'm with Priya. Patching it again just delays the rebuild we'll need anyway."`,
        their: `Ellen's real worry is spending before March. A rebuild sounds expensive, so unless she's offered a cheaper path, her best reply is to side with the budget.`,
        shaped: ctx => (ctx.rel.jordan || 0) < 0 ? `Jordan is wary of you after The Credit Taker, and he's close to Marcus. His backing Marcus made a rebuild less likely to win: about 25% instead of 40%.` : (ctx.rel.jordan || 0) > 0 ? `Jordan owes you after The Credit Taker. His good word for the rebuild raised its chances: about 50% instead of 40%.` : null,
        q: 2, s: { com: 1, coo: -1, inc: -1, str: -1 }, rel: { priya: 2, marcus: -2 },
        outcomes: [
          { p: ctx => (ctx.rel.jordan || 0) < 0 ? 0.25 : (ctx.rel.jordan || 0) > 0 ? 0.5 : 0.4, tone: 'good', text: `Ellen approves the rebuild. Priya is grateful. Marcus is not, and budgets get tight in March.` },
          { p: ctx => (ctx.rel.jordan || 0) < 0 ? 0.75 : (ctx.rel.jordan || 0) > 0 ? 0.5 : 0.6, tone: 'bad', text: `Ellen hears "rebuild" and thinks "budget." She sides with Marcus. You backed the losing side and Marcus knows it.` }
        ],
        later: `You picked a person, not a solution. Taking sides turned a technical question into a loyalty test.`
      },
      {
        key: 'B', text: `"Ellen, the March budget review is what matters here. Patching is the safe call."`,
        needs: [1], vague: { text: `"Marcus has seen more of these projects. I'd trust his call."` },
        their: `Marcus wins and Priya stops asking for your view. Ellen gets a decision, but not one tied to the March budget she's worried about.`,
        q: 1, s: { inc: -1, str: -1, com: -1, jdg: -1 }, rel: { marcus: 1, priya: -2 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Ellen goes with the patch. Marcus nods at you. Priya stops asking for your input. Ticket volume barely changes.` }],
        later: `You deferred to seniority rather than evidence. Priya, who had the expertise, learned you won't stand with the facts.`
      },
      {
        key: 'C', text: `"They both make good points. I don't think it's my call."`,
        their: `Ellen asked because she wanted help deciding. Staying out left her with the fight, and both sides with no reason to count on you.`,
        q: 1, s: { reg: 1, coo: -1, str: -2, com: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Ellen looks mildly disappointed. Friday is a stalemate. She delays the decision a month, which is what Avoiders do when nobody gives them a path.` }],
        later: `Neutrality felt safe, but Ellen asked for your view. Declining cost you some of her trust.`
      },
      {
        key: 'D', text: `"Rebuild the two modules behind most of the tickets now, and the rest after the March budget review."`,
        their: `Ellen needed something she could defend before March, and Priya and Marcus each needed not to lose. A phased plan tied to the tickets and the budget gave all three a reason to say yes.`,
        shaped: ctx => (ctx.rel.jordan || 0) < 0 ? `Jordan is wary of you after The Credit Taker, and he's close to Marcus, so your plan met more pushback: about 55% instead of 75% landed well.` : (ctx.rel.jordan || 0) > 0 ? `Jordan owes you after The Credit Taker. Backing your plan in front of Marcus raised its chances: about 85% instead of 75%.` : null,
        needs: [0, 1],
        vague: { s: { str: 1, coo: 2, neg: 1, com: 1 }, later: `You moved the fight from people to process. Without the ticket numbers and Ellen's March worry, the process had nothing to stand on yet.`, text: `"Could we agree on what matters first, then decide? Maybe a partial rebuild."`, q: 3, their: `Ellen needed something she could defend before March. A process with no numbers gave her nothing concrete to take upstairs.`, outcomes: [
              { p: 0.45, tone: 'good', text: `Ellen likes the idea of criteria and asks you to come back with specifics. A week later the team settles on a phased rebuild.` },
              { p: 0.55, tone: 'mixed', text: `Without numbers, it sounds like splitting the difference. Marcus calls it a rebuild with extra steps, and Ellen tables it.` }
            ] },
        q: 4, s: { str: 2, inc: 2, coo: 2, neg: 2, com: 1, lng: 1 }, rel: { priya: 1, marcus: 1 },
        outcomes: [
          { p: ctx => (ctx.rel.jordan || 0) < 0 ? 0.55 : (ctx.rel.jordan || 0) > 0 ? 0.85 : 0.75, tone: 'good', text: `Ellen lights up. A decision that doesn't feel like picking a winner. Priya gets her rebuild, phased. Marcus gets his budget. Both of them think it was partly their idea.` },
          { p: ctx => (ctx.rel.jordan || 0) < 0 ? 0.45 : (ctx.rel.jordan || 0) > 0 ? 0.15 : 0.25, tone: 'mixed', text: `Marcus pushes back hard on Friday. Ellen adopts your criteria but takes another week. Still, the argument is now about evidence, not egos.` }
        ],
        later: `You moved the fight from people to criteria. Phasing is also a small bet first: if fixing the two worst modules doesn't cut tickets, you learn that cheaply, before the whole budget is spent. Both sides can say yes without losing.`
      },
      {
        key: 'E', text: `Give Ellen your honest view in private afterward, with the full picture of where each of them stands.`,
        their: `Ellen gets information, but she also learns you repeat private conversations. Marcus and Priya find out, as people always do.`,
        q: 1, s: { coo: -2, lng: -2, com: -1, inc: 1 }, rel: { priya: -1, marcus: -1 },
        outcomes: [{ p: 1, tone: 'bad', text: `Ellen appreciates the intel. A week later, she repeats something Marcus said to you. He figures out where she heard it.` }],
        later: `You became the channel for private conversations. People will stop having them with you.`
      }
    ],
    analysis: {
      game: `Coalition formation with an undecided judge. Each side wants you as a vote. The more useful role is to change what the vote is about.`,
      incentives: `Priya wants the right technical answer. Marcus wants budget safety and influence. Ellen wants a decision that won't hurt her in March. Tom's clue showed you the incentive that mattered most.`,
      leverage: `Ellen's question. She handed you the agenda without realizing it.`,
      missing: `What Ellen actually cares about, and what the data says. Both were one conversation away.`,
      assumptions: `That the options were Priya's plan or Marcus's plan, and that money already spent on the old tool should decide anything. That money is gone either way. The only question is what the next dollar buys.`,
      controlled: `What criteria you proposed, and whether you represented anyone else's private views.`,
      couldnt: `Ellen's final call, the budget, and two weeks of history between Priya and Marcus.`,
      concept: { name: `Expand the pie before splitting it`, thinker: 'nalebuff', body: `Co-opetition, from Nalebuff and Brandenburger, asks whether rivals can create value together before they fight over shares. Priya cares most about the broken modules. Marcus cares most about spending before March. Fixing the two modules behind 62% of tickets now and the rest later gives each most of what they value at little cost to the other.` },
      second: { name: `An equilibrium everyone keeps`, thinker: 'nash', body: `A Nash equilibrium is an outcome where nobody gains by changing only their own move. After a win-lose call, the loser gains by reopening it at every budget meeting. Under the phased plan, Priya has her rebuild and Marcus has March protected, so neither gains by reopening it. That is why it holds.` },
      better: `Option D, ideally shared with Priya and Marcus before Friday so each can test the criteria and suggest changes.`,
      lesson: `When two people ask you to pick a side, see if you can change the question.`
    }
  },

  // ───────────────────────────────────────────── Rank 7
  {
    id: 'the-fence',
    rank: 7,
    level: `Repeated interactions`,
    arena: `The neighborhood`,
    title: `The Fence`,
    lens: ['aumann', 'nalebuff'],
    setting: `Alder Street · Three months later · Side yard`,
    narrative: ctx => {
      const g = ctx.rel.gary || 0;
      const p = [];
      if (g >= 1) p.push(`Gary comes over with a plate of tamales his sister made. "Got a favor to ask, neighbor."`);
      else if (g <= -1) p.push(`An email arrives from Gary. It's formal, starts with "Regarding the shared boundary," and attaches a contractor quote.`);
      else p.push(`Gary catches you at the mailbox. "Got a minute? It's about the fence."`);
      p.push(`The old wood fence between your yards is leaning. Gary wants a new 6-foot cedar fence, quoted at <strong>$4,800</strong>, and proposes splitting it 50/50.`);
      p.push(`You'd have been fine with a $600 repair to the old one. But the old fence won't last the summer, and whoever waits longest gets the other to pay.`);
      return p;
    },
    cast: [
      { name: `Gary`, role: `Next-door neighbor`, archetype: `Depends on your history`, power: `Proximity`, note: `You'll be next to each other for years. How he approached you reflects how your first meeting went.` },
      { name: `Ruth`, role: `Neighbor across the street`, archetype: `The Connector`, power: `Social capital`, note: `Has seen three fences come and go on this block.` }
    ],
    known: [`The fence is on the shared property line.`, `Gary's quote is $4,800, so $2,400 each.`, `A repair would cost about $600.`, `If nobody acts, the old fence falls and both yards are open.`],
    unknown: [`Why Gary wants six feet of cedar.`, `What local rules say about shared fences.`, `Whether Gary would pay alone, or wait you out.`],
    clues: [
      { label: `Look up your county's guidance`, text: `Shared boundary fences are generally a joint responsibility when both owners benefit, but upgrades beyond what's needed are often negotiated separately. Disputes go to community mediation first. (Rules vary by place; check yours.)` },
      { label: `Ask Ruth`, text: `"Gary got a rescue dog, a big one. It jumped the old fence twice. That's why he wants six feet."` }
    ],
    question: `How do you respond?`,
    options: [
      {
        key: 'A', text: `"Sure, 50/50 sounds fair. Let's get it done."`,
        their: `Gary gets the fence he wants at half price, mostly for his dog. His best reply was to say thanks, and he did.`,
        q: 2, s: { coo: 2, neg: -2, bnd: -1, inf: -1 }, rel: { gary: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `You pay $2,400 for a fence that's mostly solving Gary's dog problem. It's a nice fence.` }],
        later: ctx => ((ctx.rel.gary || 0) >= 1
          ? `Gary's grateful, and he'll remember it. But you overpaid, and you didn't ask why.`
          : `It keeps the peace. With a cool relationship, generosity can be read as a pushover rather than a gesture.`) +
          ` Next spring, the oak on Gary's side drops branches on your roof. He has the trimmer out before you ask. He's returning the move you made.`
      },
      {
        key: 'B', text: `"County guidance says upgrades get negotiated separately. If you want six-foot cedar, it's on you."`,
        needs: [0], vague: { q: 1, text: `"The old fence works fine for me. If you want a new one, I'd expect you to cover it."` },
        their: `Gary needs a taller fence for his dog either way. Whether he pays alone or waits you out depends mostly on how much goodwill there is between you.`,
        shaped: ctx => (ctx.rel.gary || 0) >= 2 ? `Gary liked you after The Spot, so he was far more willing to just pay for it himself: about 70% instead of 45%.` : (ctx.rel.gary || 0) <= -2 ? `Gary remembers how The Spot went. With no goodwill to spend, he was much more likely to dig in: about 85% instead of 55%.` : null,
        q: 2, s: { bnd: 2, coo: -2, lng: -2, com: -1 }, rel: { gary: -2 },
        outcomes: [
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.7 : (ctx.rel.gary || 0) <= -2 ? 0.15 : 0.45, tone: 'good', text: `Gary pays for the whole fence himself. It's beautiful, six feet tall, and it cost you nothing. Every time you see it, you remember the conversation. So does he.` },
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.3 : (ctx.rel.gary || 0) <= -2 ? 0.85 : 0.55, tone: 'bad', text: `Gary shrugs. "Then I guess we both wait." Nobody builds anything. In June the old fence falls over, and the dog finds your garden.` }
        ],
        later: `Holding out pays once. Next spring, the oak on Gary's side needs trimming over your roof. "Your roof, your problem," he says, and you pay the $900 alone. In a game that repeats, the other side answers the move you made last time.`
      },
      {
        key: 'C', text: `"Let's split a basic 4-foot fence. If you want 6-foot cedar for the dog, you cover the rest."`,
        their: `Gary's reason for six feet was his dog. Naming it showed you understood his side, so paying the difference felt fair to him rather than imposed.`,
        shaped: ctx => (ctx.rel.gary || 0) >= 2 ? `Gary liked you after The Spot, so he was more likely to take the offer in good faith: about 90% instead of 80%.` : (ctx.rel.gary || 0) <= -2 ? `Gary remembers how The Spot went, so he was more likely to look for the catch: about 60% instead of 80% went smoothly.` : null,
        needs: [1],
        vague: { s: { neg: 2, coo: 1, com: 1, lng: 1, bnd: 1 }, later: `A fair structure, offered without knowing why Gary wanted six feet. Fair and understood are not the same thing.`, text: `"Let's split a basic 4-foot fence. If you want 6-foot cedar, you cover the rest."`, q: 3, their: `Gary's reason for six feet was his dog. Without knowing that, your offer sounded like you didn't care why, so it landed as cheap rather than fair.`, outcomes: [
              { p: 0.55, tone: 'good', text: `Pine is $2,200. You split it, and Gary pays the difference for cedar. He agrees, though he clearly thinks you're being a bit tight.` },
              { p: 0.45, tone: 'mixed', text: `Gary bristles. "It's not a luxury, it's for the dog." He pays the difference, but the conversation leaves a mark.` }
            ] },
        q: 4, s: { neg: 2, coo: 2, inc: 2, com: 2, lng: 2, bnd: 1 }, rel: { gary: 2 },
        outcomes: [
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.9 : (ctx.rel.gary || 0) <= -2 ? 0.6 : 0.8, tone: 'good', text: `Pine is $2,200. You pay $1,100, Gary pays $3,700 for the cedar he actually wants. He thinks it's completely fair. So do you.` },
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.1 : (ctx.rel.gary || 0) <= -2 ? 0.4 : 0.2, tone: 'mixed', text: `Gary's a bit stung at first. "I thought we'd split it." By the weekend he's come around: "Honestly, that's fair. The dog's my problem."` }
        ],
        later: `You found the arrangement neither of you would want to break: a fair base split, and each paying for what they value. Next spring, when the oak needs trimming, Gary splits the cost without being asked. Cooperation that's returned keeps getting returned.`
      },
      {
        key: 'D', text: `"Let me think about it and get back to you."`,
        their: `Gary waits for an answer that never comes. To him, silence is a no without the courtesy of saying it.`,
        q: 0, s: { com: -2, reg: 1, lng: -2, bnd: -1 }, rel: { gary: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Three weeks of silence. Gary asks twice more, then stops asking. In June the old fence falls, and the dog digs up your garden.` }],
        later: `Stalling is holding out without saying so. Gary read silence as a no, and next spring he answers your texts about the oak just as slowly.`
      },
      {
        key: 'E', text: `Ask Ruth, who knows you both and the street, to help the two of you work out something fair.`,
        their: `Ruth is fair and knows the street. Whether Gary welcomes her or feels ambushed depends on whether he already trusts you.`,
        shaped: ctx => (ctx.rel.gary || 0) >= 2 ? `Gary trusted you after The Spot, so Ruth was more likely to feel like help than a referee: about 65% instead of 50%.` : (ctx.rel.gary || 0) <= -2 ? `After The Spot, Gary was more likely to read Ruth as backup you brought: about 65% instead of 50%.` : null,
        q: 2, s: { coo: 1, inf: 1, com: -1, bnd: 0 }, rel: { gary: -1 },
        outcomes: [
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.65 : (ctx.rel.gary || 0) <= -2 ? 0.35 : 0.5, tone: 'good', text: `Ruth knows exactly what the last fence cost and gently suggests each of you pay for what you want. It works.` },
          { p: ctx => (ctx.rel.gary || 0) >= 2 ? 0.35 : (ctx.rel.gary || 0) <= -2 ? 0.65 : 0.5, tone: 'mixed', text: `Gary feels ambushed. "I didn't think we needed a referee." The deal gets done, but stiffly.` }
        ],
        later: `Mediation is useful when direct conversation fails. Using it first can signal that you don't trust the other person.`
      }
    ],
    analysis: {
      game: `A prisoner's dilemma inside a repeated game. Played once, holding out pays for each of you, so nobody builds. Played over years of shared trees, pipes and packages, holding out costs more than it saves.`,
      incentives: `Gary needs to contain his dog. You need a working fence at a fair price. Those overlap on the base fence and diverge on the upgrade.`,
      leverage: `Shared responsibility for the boundary, and the long future you share. Gary has every reason to keep you happy.`,
      missing: `Why Gary wanted six feet of cedar. Once you knew it was the dog, the fair split became obvious.`,
      assumptions: `That fair means 50/50, that "I didn't ask for it" settles the matter, or that this is a one-time deal. It isn't. There will be a next time.`,
      controlled: `Your counteroffer and whether you said it directly.`,
      couldnt: `Gary's dog, the cost of cedar, and how your first meeting went.`,
      concept: { name: `A prisoner's dilemma, rescued by repetition`, thinker: 'aumann', body: `If you and Gary met only once, holding out would be each person's best move whatever the other did, so neither would pay and the fence would fall. That is a prisoner's dilemma: the stable outcome is worse for both. Aumann's work on repeated games showed that when people expect to keep meeting and care enough about the future, cooperation can hold up with no one enforcing it, because holding out today costs you every favor after. Axelrod later called this pull the shadow of the future.` },
      second: { name: `Pay for what you value`, thinker: 'nalebuff', body: `When each person pays for what they value, the deal can happen at all. Gary gets the six feet his dog needs, you pay only for a fence you'd choose anyway, and nobody has to win an argument about whose preferences count.` },
      better: `Option C. Agree on the shared need, separate the upgrade, say it directly.`,
      lesson: `In a relationship that repeats, the best deal is one both sides would choose again.`
    }
  },

  // ───────────────────────────────────────────── Rank 8
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
    unknown: [`How much room is in the budget.`, `How urgently they need someone.`, `How firm the Friday deadline is.`],
    clues: [
      { label: `Re-read the job posting`, text: `Your state requires salary ranges in job postings. Northfield's lists $88,000–$110,000.` },
      { label: `Recall your last talk with Alicia`, text: `She mentioned twice that the team badly needs someone in place before the November launch. Their last hire fell through.` }
    ],
    question: `What do you say to Sam?`,
    options: [
      {
        key: 'A', text: `"That sounds great. I'm happy to accept."`,
        their: `Sam's job is to fill the role within budget. You accepted the opening number, so Northfield's best reply was to say yes and move on.`,
        q: 1, s: { neg: -2, inf: -1, jdg: -1, coo: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Sam is delighted. You start at $92,000. Six months later you learn a peer hired the same month started at $101,000.` }],
        later: `Fear of losing the offer answered for you. Asking would have cost a few awkward seconds. Not asking costs you every year, because each raise is a percentage of this number.`
      },
      {
        key: 'B', text: `"I have another offer at $105,000. Can you match it so I can say yes to you?"`,
        their: `Recruiters hear this a lot. Sam's best reply is to ask to see it, and you can't show what doesn't exist.`,
        q: 0, s: { com: -2, lng: -2, neg: -1, jdg: -2 },
        outcomes: [
          { p: 0.5, tone: 'bad', text: `Sam asks, pleasantly, if you can share the offer in writing so they can "move quickly." You can't. The conversation gets a lot cooler.` },
          { p: 0.5, tone: 'good', text: `They come up to $101,000. You won. You also started a job with a lie that Alicia might someday discover.` }
        ],
        later: `A fake offer is a false claim about your alternative. It only works until someone asks to see it, so its credibility was always borrowed. And when it works, it teaches you a habit that eventually fails publicly.`
      },
      {
        key: 'C', text: `"Your range goes to $110k and I can start before launch. Could we do $102k, decided by Tuesday?"`,
        their: `Alicia needs someone before November, and the posted range gave them room. You asked for something they could justify and offered what they needed, so meeting you partway was their best reply.`,
        needs: [0],
        vague: { s: { neg: 1, com: 2, jdg: 1 }, later: `You asked, which most people don't. Without their posted range, you asked for a favor rather than making a case.`, text: `"I'm excited about this. Is there any room on the number, something closer to $100k?"`, q: 3, their: `Sam needs a reason to take to Alicia. Asking for room without pointing to their posted range gave Sam little to argue with, so a small bump was the easy reply.`, outcomes: [
              { p: 0.45, tone: 'good', text: `Sam checks with Alicia and comes back at $96,000. Better than $92,000, though you never mentioned their posted range.` },
              { p: 0.55, tone: 'mixed', text: `Sam says there's a little room: $94,000. Without a reason Sam could take to Alicia, that was all there was.` }
            ] },
        q: 4, s: { neg: 2, inf: 2, com: 2, inc: 2, str: 2, jdg: 1 },
        outcomes: [
          { p: 0.65, tone: 'good', text: `Sam checks with Alicia. They come back at $99,000 plus a $3,000 signing bonus, and the deadline moves to Tuesday.` },
          { p: 0.35, tone: 'mixed', text: `Sam says $96,000 is the ceiling this cycle, with a six-month review. Less than you asked, more than you had. You decide with full information.` }
        ],
        later: `You anchored with real data, told the truth about your alternatives, and offered something they valued: speed. That's a negotiation both sides can feel good about.`
      },
      {
        key: 'D', text: `"You need someone before launch, and I can start right away. To make the move I'd need $115,000."`,
        needs: [1], vague: { text: `"To make the move worthwhile I'd need $115,000. Otherwise I'm happy staying where I am."` },
        their: `That's above their posted ceiling of $110,000. Sam can't go there, so the best reply is to let you stay where you are, unless Alicia is desperate.`,
        q: 1, s: { neg: -1, coo: -2, reg: -1, bnd: 1 },
        outcomes: [
          { p: 0.6, tone: 'bad', text: `It's above their posted range. Sam says they'll "keep you in mind for future roles." You're now negotiating with your current employer, who doesn't know you were looking.` },
          { p: 0.4, tone: 'mixed', text: `Alicia calls you directly. They can't go above $110,000 and are disappointed by the tone. You take $105,000 with a slightly awkward start.` }
        ],
        later: `You put a $7,000 raise on the table to chase a few thousand more. Even when it works, you took a large risk for a small gain. Never risk the whole deal for the last slice of it.`
      },
      {
        key: 'E', text: `"Thank you, this is exciting. Could I have until next Wednesday to think it through properly?"`,
        their: `A little more time is cheap for them to give. Without a reason to change the number, Sam gives you Monday and the same offer.`,
        q: 2, s: { reg: 1, jdg: 1, neg: -1, inf: 0 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Sam agrees to Monday. You have more time but the same number. The other company doesn't make an offer.` }],
        later: `More time is useful only if you use it to change your alternatives or your information. Here, it changed neither.`
      }
    ],
    analysis: {
      game: `A bargaining game over a known range, with uncertainty about each side's alternatives. Most of the value is decided by the walk-away points, not the conversation.`,
      incentives: `Sam is measured on filling the role. Alicia needs someone before November. They want you, and they want you soon. That urgency was the most valuable thing you knew.`,
      leverage: `The posted range, their timeline, and your ability to start quickly. Not a fictional competing offer.`,
      missing: `How much budget sits between $92,000 and $110,000, and how firm Friday really is. Asking reveals both.`,
      assumptions: `That the first number is final, or that a bigger threat gets a bigger number.`,
      controlled: `Your anchor, your honesty, and what you offered in return.`,
      couldnt: `Their budget, their other candidates, and whether the other company makes an offer.`,
      concept: { name: `Bargaining depends on alternatives`, thinker: 'nash', body: `Nash's bargaining solution shows that how a deal is split depends on what each side gets if talks fail. Your real alternative was weak, staying at $85,000, but theirs was weak too: no hire before launch. Naming what you can offer them shifts the split honestly.` },
      second: { name: `Credible commitments`, thinker: 'schelling', body: `A threat only works if the other side believes you'd carry it out. Bluffs and ultimatums above the published range fail that test. Truthful information does not.` },
      better: `Option C. Anchor with their own range, offer what they value, ask for time honestly.`,
      lesson: `Know both sides' alternatives, say true things about them, and never risk the whole offer to win the last few thousand.`
    }
  }
];
