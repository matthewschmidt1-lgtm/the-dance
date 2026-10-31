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
      { label: `Look at Maya's screen`, text: `A sticky note on the monitor reads "Price overrides → call Dev x204." There's a Price Check key. Maya can start the process but can't finish it alone.` },
      { label: `Look at the bottle`, text: `It's the 1-liter bottle. The 500 ml bottle sat right next to it on the shelf. You're now less sure which one the $8.49 tag belonged to.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `"That's wrong. The shelf says $8.49. I'm not paying that."`,
        q: 1, s: { reg: -2, com: -1, coo: -1, bnd: 1 },
        outcomes: [
          { p: 0.55, tone: 'mixed', text: `Maya flushes and calls Dev. Six minutes later he confirms the tag was right and overrides it. You saved $3.50, and the whole lane watched Maya get nervous.` },
          { p: 0.45, tone: 'bad', text: `Maya calls Dev. Six minutes later he walks back with the tag: it was for the 500 ml bottle. You pay $11.99 with five people watching.` }
        ],
        later: `Maya remembers you. Next time she'll be polite and careful, which is not the same as being on your side.`
      },
      {
        key: 'B', text: `Pay the $11.99 and let it go.`,
        q: 2, s: { jdg: 1, reg: 1, bnd: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `The line keeps moving. You're out $3.50, or possibly nothing, since you never found out if the tag was for this bottle.` }],
        later: `Fine as a conscious choice: your time has a price too. It only becomes a pattern problem if "let it go" is your default every time money is involved.`
      },
      {
        key: 'C', text: `"I think the tag said $8.49, though it might've been for the smaller bottle. Is that quick to check, or should I sort it out at the service desk so I don't hold up the line?"`,
        q: 4, s: { com: 2, inf: 2, reg: 1, inc: 2, jdg: 1, coo: 1 },
        outcomes: [
          { p: 0.7, tone: 'good', text: `Maya visibly relaxes. "I'll ring it at the shelf price and flag it for Dev. If it's wrong, that's on us." You're out the door in thirty seconds.` },
          { p: 0.3, tone: 'mixed', text: `Maya says she can't override it, but tells you the service desk handles it in a minute. You check on the way: the tag was for the 500 ml bottle. You're glad you didn't argue.` }
        ],
        later: `You named your uncertainty, gave Maya an easy path, and took the line's pressure off her. She had the discretion, and you made using it painless.`
      },
      {
        key: 'D', text: `"Can I speak to a manager, please?"`,
        q: 1, s: { inc: -1, coo: -1, str: -1, bnd: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Maya pages Dev. Four minutes pass. Dev overrides the price without checking anything, mostly to clear the lane. You got the price, and Maya looks like she failed at something.` }],
        later: `Escalating skipped the person who could have helped. Next time you're in Lane 4, you're "the manager customer."`
      },
      {
        key: 'E', text: `Pay now, then take the receipt to customer service on the way out.`,
        q: 3, s: { reg: 2, jdg: 1, inf: 1, coo: 1 },
        outcomes: [
          { p: 0.65, tone: 'good', text: `You check the shelf on the way out. The tag was right. Customer service refunds the $3.50 in under a minute.` },
          { p: 0.35, tone: 'mixed', text: `You check the shelf on the way out. The tag belonged to the 500 ml bottle. No refund, and no scene.` }
        ],
        later: `You separated the time pressure from the money question and checked your facts before pressing your case. That habit is worth far more than $3.50.`
      }
    ],
    analysis: {
      game: `A coordination problem with a clock running. Maya wants the line moving and no trouble. You want a fair price. The line wants speed. All three can win at once.`,
      incentives: `Maya's real incentive is to avoid a scene and avoid blame. Anything that makes helping you easy, quick and blame-free makes her likely to help.`,
      leverage: `Not the manager. The leverage was Maya's goodwill, because she decides how hard to try. Store policy was a backup, not the opening move.`,
      missing: `Which bottle the tag belonged to. You were acting on a memory, under time pressure.`,
      assumptions: `That the store was wrong, and that someone above Maya was needed to fix it.`,
      controlled: `Your tone, how certain you sounded, and when you raised it.`,
      couldnt: `Store policy, the line's patience, and what the tag actually said.`,
      concept: { name: `Decision quality is not outcome`, thinker: 'duke', body: `Duke calls the habit of judging a choice by how it turned out "resulting." Arguing loudly and being right is still a poor decision, because it risked a public loss on a fact you hadn't checked. Asking calmly and being wrong is still a good one.` },
      second: { name: `Discretion lives low in the org chart`, thinker: 'schelling', body: `Schelling noticed that the person who can actually act is often not the person with the title. Here it was a nineteen-year-old cashier.` },
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
    clues: [
      { label: `Check the project tracker`, text: `Dana has four open items. Two are overdue. One is a new client onboarding Ellen assigned her yesterday, with no deadline relief.` },
      { label: `Scroll back through the team channel`, text: `After the first time you helped: "Huge thanks for the vendor numbers, you saved me." After the second time: nothing.` }
    ],
    question: `How do you reply?`,
    options: [
      {
        key: 'A', text: `"Of course, I'll take care of it."`,
        q: 2, s: { coo: 2, bnd: -2, lng: -1, inf: -1 }, rel: { dana: 1 }, flags: { danaPattern: 'always-yes' },
        outcomes: [{ p: 1, tone: 'mixed', text: `Dana sends three hearts. You work until 9 pm on Thursday to fit it in, and your Henley summary goes in at 11:58 am Friday.` }],
        later: `Two weeks later Dana asks again. This time the message is shorter, and there's no "any chance." Unconditional cooperation teaches people what to expect from you.`
      },
      {
        key: 'B', text: `"Sorry, can't. I've got my own deadline."`,
        q: 2, s: { bnd: 2, coo: -1, com: -1, inf: -1 }, rel: { dana: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Dana replies "no worries!!" She's noticeably cooler at Friday's standup.` }],
        later: `Your time is protected. But you learned nothing about why Dana keeps asking, and you may have turned away someone who was genuinely stuck.`
      },
      {
        key: 'C', text: `"What does it involve, and when do you need it by? I'm on Henley until Friday noon."`,
        q: 4, s: { inf: 2, neg: 2, com: 2, bnd: 1, coo: 1 }, rel: { dana: 1 }, flags: { danaPattern: 'trade' },
        outcomes: [
          { p: 0.8, tone: 'good', text: `Dana explains: the numbers exist, they just need formatting, about two hours. You offer Friday afternoon. She offers to cover your Monday standup notes. Done.` },
          { p: 0.2, tone: 'mixed', text: `Dana goes quiet, then says she'll "figure it out." It turns out the section was most of the report. Asking saved you a weekend.` }
        ],
        later: `You helped on terms you could keep, and Dana learned that asking you works when she's specific. That's the start of a stable working relationship.`
      },
      {
        key: 'D', text: `"I can, if you ask Ellen to move something off my plate."`,
        q: 3, s: { neg: 1, bnd: 2, inc: 1, com: -1 },
        outcomes: [
          { p: 0.5, tone: 'mixed', text: `Dana asks Ellen. Ellen, an Avoider, says "work it out between you." You end up doing it anyway, a day late.` },
          { p: 0.5, tone: 'good', text: `Ellen pushes your Henley deadline to Monday. You do the vendor section Friday. Fair trade.` }
        ],
        later: `A legitimate condition, but routed through the person least likely to decide anything.`
      },
      {
        key: 'E', text: `"Sounds like you're overloaded. Want to go to Ellen together?"`,
        q: 2, s: { inc: 1, coo: 1, com: 1, neg: -1 }, rel: { dana: 0 },
        outcomes: [
          { p: 0.6, tone: 'mixed', text: `Dana hesitates. She doesn't want Ellen to think she's struggling. "It's fine, I'll manage." She manages, badly.` },
          { p: 0.4, tone: 'good', text: `Dana agrees. Ellen, cornered by two people at once, actually moves the onboarding deadline.` }
        ],
        later: `Kind instinct, wrong first step. You proposed a fix before you understood the problem.`
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
      concept: { name: `Reciprocity beats both extremes`, thinker: 'axelrod', body: `In Axelrod's tournaments, always-cooperate strategies got exploited and always-defect strategies got isolated. What worked: cooperate first, respond to what the other side actually does, and be clear enough that they can read you.` },
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
        key: 'A', text: `Leave a note on his windshield: "Please don't park in my spot."`,
        q: 1, s: { com: -2, reg: -1, inf: -1, lng: -1 }, rel: { gary: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Gary moves the truck. Then he knocks, note in hand: "Didn't realize you owned the street." It's polite. It's also cold.` }],
        later: `You claimed a right you don't have, in writing, to someone you'll live beside for years. Notes feel low-risk to send and land harder than you intend.`
      },
      {
        key: 'B', text: `Walk over, say hi, and mention you usually park there. Ask if it's a temporary thing.`,
        q: 4, s: { com: 2, inf: 2, reg: 1, coo: 2, lng: 2 }, rel: { gary: 2 },
        outcomes: [{ p: 1, tone: 'good', text: `"Oh no, sorry! My driveway's being resealed, it's done Tuesday. I had no idea there was a system." He moves the truck that afternoon and offers you a coffee.` }],
        later: `You learned the facts, taught the norm without accusing anyone, and made a first impression that will matter later.`
      },
      {
        key: 'C', text: `Park in front of his house to make a point.`,
        q: 0, s: { reg: -2, coo: -2, lng: -2, str: -1 }, rel: { gary: -3 },
        outcomes: [{ p: 1, tone: 'bad', text: `Gary doesn't get the point. He just thinks you're strange. Ruth saw the whole thing and mentions it at the block party.` }],
        later: `Retaliation only works as a signal if the other person understands what it's a reply to. Gary didn't.`
      },
      {
        key: 'D', text: `Say nothing. Park down the block until it sorts itself out.`,
        q: 2, s: { reg: 1, bnd: -1, inf: -1 }, rel: { gary: 0 },
        outcomes: [{ p: 1, tone: 'mixed', text: `On Wednesday the truck moves back to Gary's driveway. Problem solved by itself. You carried groceries half a block for a week.` }],
        later: `It worked, by luck. Had it not been temporary, you'd be three weeks into quiet resentment with someone who doesn't know anything is wrong.`
      },
      {
        key: 'E', text: `Post about it on the neighborhood app.`,
        q: 0, s: { com: -2, reg: -1, coo: -2, lng: -2 }, rel: { gary: -3 },
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
    clues: [
      { label: `Check the file's version history`, text: `The deck's history shows you as the author of 31 of its 38 slides. That record exists whatever anyone says in this room.` },
      { label: `Watch Jordan closely`, text: `His hand shakes slightly on the clicker. You heard last week that his performance review is on Thursday. He might be scared, not scheming. Or both.` }
    ],
    question: `What do you do?`,
    options: [
      {
        key: 'A', text: `Publicly point out that you developed the work.`,
        q: 1, s: { reg: -1, com: -1, bnd: 2, lng: -1, str: -1 }, rel: { jordan: -2 },
        outcomes: [
          { p: 0.5, tone: 'mixed', text: `"Actually, I built most of that." The room goes quiet. Ellen says "Let's take that offline." You're right, and you're now part of an awkward moment.` },
          { p: 0.5, tone: 'bad', text: `Jordan says "It was a team effort, obviously." Ellen moves on quickly. You look like you cared more about credit than the work.` }
        ],
        later: `Jordan is now an adversary, and Ellen filed the moment under "conflict" rather than "contribution."`
      },
      {
        key: 'B', text: `Say nothing in the meeting. Address it with Jordan privately afterward.`,
        q: 3, s: { reg: 2, com: 1, coo: 1, bnd: 1 }, rel: { jordan: 1 },
        outcomes: [
          { p: 0.6, tone: 'good', text: `Jordan is embarrassed. "I froze up. I'll fix it." He sends the team an email crediting your analysis by name.` },
          { p: 0.4, tone: 'mixed', text: `Jordan gets defensive. "We're a team, I didn't think it mattered." Nothing changes in Ellen's mind.` }
        ],
        later: `You gave Jordan a private way to correct course. Whether he takes it tells you a lot about him.`
      },
      {
        key: 'C', text: `Ask a question that naturally establishes your involvement: "Jordan, when I built the regional model I wondered about the Q2 outliers. Should we include them?"`,
        q: 4, s: { str: 2, com: 2, reg: 1, inc: 1, bnd: 1 }, rel: { jordan: 0 },
        outcomes: [
          { p: 0.75, tone: 'good', text: `Ellen looks at you. "You built the model?" "Most of it, yes." Ellen asks you to walk through slide 12. Jordan, to his credit, hands you the clicker.` },
          { p: 0.25, tone: 'mixed', text: `Jordan answers smoothly and the meeting moves on. Ellen may or may not have registered it. Your claim is on record, quietly.` }
        ],
        later: `You established ownership as a fact without accusing anyone. The tone mattered: asked with curiosity, it reads as collaboration. Asked with an edge, it reads as a jab.`
      },
      {
        key: 'D', text: `Document your contributions and talk to Ellen about ownership.`,
        q: 3, s: { inf: 2, bnd: 1, lng: 2, reg: 1, com: -1 },
        outcomes: [
          { p: 0.7, tone: 'good', text: `You bring Ellen the version history, framed around clarity: "I want to make sure my work is visible for review season." Ellen thanks you. She'd assumed it was joint work.` },
          { p: 0.3, tone: 'mixed', text: `Ellen, an Avoider, says "I'm sure it was a team effort" and changes the subject. The documentation is still yours to keep.` }
        ],
        later: `Slower and less satisfying than a public moment, but you built a record that lasts.`
      },
      {
        key: 'E', text: `Let it go this time, but change how you collaborate with Jordan.`,
        q: 2, s: { reg: 2, lng: 1, bnd: -1, com: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `You put your name on future slide footers and send recap emails after each working session. Today's credit is gone.` }],
        later: `Smart systems going forward. But Ellen's impression of who drove this project is now set, and impressions are hard to revise.`
      }
    ],
    analysis: {
      game: `A signaling game with an audience. The real question isn't how you feel about Jordan. It's what Ellen ends up believing about who does the work.`,
      incentives: `Jordan may be desperate before his review. Ellen wants smooth meetings and capable people. You want accurate credit and a working relationship that survives.`,
      leverage: `The version history and your knowledge of the work. Whoever understands the analysis best can show it without saying a word about credit.`,
      missing: `Jordan's intent, and what Ellen already believes.`,
      assumptions: `That Jordan is a villain, and that a moment of lost credit is permanent.`,
      controlled: `Your timing, your tone, and whether you correct the record publicly or privately.`,
      couldnt: `Jordan's motives, Ellen's style, and what was already said.`,
      concept: { name: `Best response`, thinker: 'nash', body: `Nash's insight is to evaluate each move by the other players' best reply. A public accusation invites Jordan to defend himself and Ellen to shut it down. A good question gives Ellen a reason to look at you, and gives Jordan nothing to fight.` },
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
    clues: [
      { label: `Read your contract`, text: `Section 7: "Unforeseen conditions will be billed at documented cost plus 15%, with the owner's written approval of a change order." The bid was fixed, with a written exception for exactly this.` },
      { label: `Look at the floor yourself`, text: `Near the toilet flange, about a 3-by-4-foot area of plywood is dark and soft. It looks like a slow leak over many years. The rot appears real.` }
    ],
    question: `What do you say to Luis?`,
    options: [
      {
        key: 'A', text: `"Okay, go ahead. Just keep the crew here."`,
        q: 2, s: { coo: 1, jdg: -1, inf: -2, neg: -2 },
        outcomes: [
          { p: 0.6, tone: 'mixed', text: `The work is done well. The final invoice shows $2,600 for materials and labor you never saw itemized. It was probably fair. You'll never know.` },
          { p: 0.4, tone: 'bad', text: `The work is done. Later a friend in construction looks at the photos: "That's a $1,200 repair." You agreed under a deadline you never tested.` }
        ],
        later: `Luis learned that urgency works on you.`
      },
      {
        key: 'B', text: `"No. The bid was fixed. That's your risk."`,
        q: 1, s: { bnd: 2, inf: -2, inc: -1, coo: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Luis points to Section 7 of the contract. He's polite, but he pulls the crew. Your floor stays open for three weeks.` }],
        later: `You held a line your own contract didn't support. Being firm on a wrong premise is still a wrong premise.`
      },
      {
        key: 'C', text: `"Show me the damage, then send a written change order with the itemized cost. I can approve it tonight."`,
        q: 4, s: { inf: 2, neg: 2, bnd: 1, com: 2, jdg: 2, inc: 1 },
        outcomes: [
          { p: 0.7, tone: 'good', text: `Luis walks you through it and sends a change order at 4 pm: $1,940 at documented cost plus 15%. You sign it at 6. The crew starts Thursday.` },
          { p: 0.3, tone: 'mixed', text: `The itemized order comes in at $2,550. It's legitimate, just expensive. You approve it knowing exactly what you're paying for.` }
        ],
        later: `You met his deadline and kept your right to check. Luis now knows you read contracts, which shapes every future conversation about money.`
      },
      {
        key: 'D', text: `"I want a second opinion before I approve anything."`,
        q: 2, s: { inf: 2, jdg: 0, coo: -1, lng: -1 },
        outcomes: [
          { p: 0.5, tone: 'mixed', text: `The second contractor can come Monday and says the price is fair. The crew has left. You lose three weeks to save nothing.` },
          { p: 0.5, tone: 'mixed', text: `The second opinion says $1,500 is reasonable. Luis comes down to $2,000 but the job slips nine days.` }
        ],
        later: `Information has a cost. Sometimes it's worth paying, but here a cheaper version of the same check was available on the spot.`
      },
      {
        key: 'E', text: `"Do it at the original price, or I'm leaving a one-star review."`,
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
      concept: { name: `Commitments and deadlines`, thinker: 'schelling', body: `Schelling showed how a deadline, real or not, shifts bargaining power toward the person who sets it. The response isn't to ignore the deadline. It's to meet it on your terms: verify fast, approve in writing.` },
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
        key: 'A', text: `"I'm with Priya. A rebuild is the right call."`,
        q: 2, s: { com: 1, coo: -1, inc: -1, str: -1 }, rel: { priya: 2, marcus: -2 },
        outcomes: [
          { p: 0.4, tone: 'good', text: `Ellen approves the rebuild. Priya is grateful. Marcus is not, and budgets get tight in March.` },
          { p: 0.6, tone: 'bad', text: `Ellen hears "rebuild" and thinks "budget." She sides with Marcus. You backed the losing side and Marcus knows it.` }
        ],
        later: `You picked a person, not a solution. Taking sides turned a technical question into a loyalty test.`
      },
      {
        key: 'B', text: `"Marcus has more experience. I'd go with him."`,
        q: 1, s: { inc: -1, str: -1, com: -1, jdg: -1 }, rel: { marcus: 1, priya: -2 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Ellen goes with the patch. Marcus nods at you. Priya stops asking for your input. Ticket volume barely changes.` }],
        later: `You deferred to seniority rather than evidence. Priya, who had the expertise, learned you won't stand with the facts.`
      },
      {
        key: 'C', text: `"Honestly, I'd rather stay out of it."`,
        q: 1, s: { reg: 1, coo: -1, str: -2, com: -1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Ellen looks mildly disappointed. Friday is a stalemate. She delays the decision a month, which is what Avoiders do when nobody gives them a path.` }],
        later: `Neutrality felt safe, but Ellen asked for your view. Declining cost you some of her trust.`
      },
      {
        key: 'D', text: `"What if we agree on what matters first: cost before March, ticket volume, risk. By that test, we could rebuild the two worst modules now and the rest after the budget review."`,
        q: 4, s: { str: 2, inc: 2, coo: 2, neg: 2, com: 1, lng: 1 }, rel: { priya: 1, marcus: 1 },
        outcomes: [
          { p: 0.75, tone: 'good', text: `Ellen lights up. A decision that doesn't feel like picking a winner. Priya gets her rebuild, phased. Marcus gets his budget. Both of them think it was partly their idea.` },
          { p: 0.25, tone: 'mixed', text: `Marcus pushes back hard on Friday. Ellen adopts your criteria but takes another week. Still, the argument is now about evidence, not egos.` }
        ],
        later: `You moved the fight from people to criteria. Both sides can say yes without losing, which is why the agreement will hold.`
      },
      {
        key: 'E', text: `Tell Ellen privately what each of them said to you.`,
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
      assumptions: `That the options were Priya's plan or Marcus's plan.`,
      controlled: `What criteria you proposed, and whether you represented anyone else's private views.`,
      couldnt: `Ellen's final call, the budget, and two weeks of history between Priya and Marcus.`,
      concept: { name: `Expand the pie before splitting it`, thinker: 'nalebuff', body: `Nalebuff's co-opetition asks whether competitors can create more value together before they fight over who gets what. A phased plan gives Priya most of what she wants and Marcus most of what he needs.` },
      second: { name: `An equilibrium everyone keeps`, thinker: 'nash', body: `Nash equilibrium is an arrangement where nobody gains by deviating on their own. A compromise both sides helped shape is far more stable than a win one side resents.` },
      better: `Option D, ideally floated to Tom or Ellen before Friday so the room arrives already half-agreed.`,
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
      p.push(`You'd have been fine with a $600 repair to the old one.`);
      return p;
    },
    cast: [
      { name: `Gary`, role: `Next-door neighbor`, archetype: `Depends on your history`, power: `Proximity`, note: `You'll be next to each other for years. How he approached you reflects how your first meeting went.` },
      { name: `Ruth`, role: `Neighbor across the street`, archetype: `The Connector`, power: `Social capital`, note: `Has seen three fences come and go on this block.` }
    ],
    known: [`The fence is on the shared property line.`, `Gary's quote is $4,800, so $2,400 each.`, `A repair would cost about $600.`],
    unknown: [`Why Gary wants six feet of cedar.`, `What local rules say about shared fences.`, `Whether Gary can afford it alone.`],
    clues: [
      { label: `Look up your county's guidance`, text: `Shared boundary fences are generally a joint responsibility when both owners benefit, but upgrades beyond what's needed are often negotiated separately. Disputes go to community mediation first. (Rules vary by place; check yours.)` },
      { label: `Ask Ruth`, text: `"Gary got a rescue dog, a big one. It jumped the old fence twice. That's why he wants six feet."` }
    ],
    question: `How do you respond?`,
    options: [
      {
        key: 'A', text: `"Sure, 50/50 sounds fair."`,
        q: 2, s: { coo: 2, neg: -2, bnd: -1, inf: -1 }, rel: { gary: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `You pay $2,400 for a fence that's mostly solving Gary's dog problem. It's a nice fence.` }],
        later: ctx => (ctx.rel.gary || 0) >= 1
          ? `Gary's grateful, and he'll remember it. Generosity inside a good relationship is rarely wasted. But you overpaid, and you didn't ask why.`
          : `It keeps the peace. But with a cool relationship, generosity is more likely to be read as a pushover than a gesture.`
      },
      {
        key: 'B', text: `"I didn't ask for a new fence. You can pay for it."`,
        q: 1, s: { bnd: 2, coo: -2, lng: -2, com: -1 }, rel: { gary: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Gary builds the fence himself. It's beautiful, six feet tall, and every time you see it, you remember the conversation. So does he.` }],
        later: `You protected $2,400 and spent goodwill you'll need the next time a tree falls, a pipe bursts, or a package goes missing.`
      },
      {
        key: 'C', text: `"I'm in for a new fence. Can we price a 4-foot pine option too? I'll split that 50/50, and if you want 6-foot cedar for the dog, you cover the difference."`,
        q: 4, s: { neg: 2, coo: 2, inc: 2, com: 2, lng: 2, bnd: 1 }, rel: { gary: 2 },
        outcomes: [
          { p: 0.8, tone: 'good', text: `Pine is $2,200. You pay $1,100, Gary pays $3,700 for the cedar he actually wants. He thinks it's completely fair. So do you.` },
          { p: 0.2, tone: 'mixed', text: `Gary's a bit stung at first. "I thought we'd split it." By the weekend he's come around: "Honestly, that's fair. The dog's my problem."` }
        ],
        later: `You found the arrangement neither of you would want to break: a fair base split, and each paying for what they value. That's what makes it last.`
      },
      {
        key: 'D', text: `"Let me think about it." Then don't bring it up again.`,
        q: 0, s: { com: -2, reg: 1, lng: -2, bnd: -1 }, rel: { gary: -2 },
        outcomes: [{ p: 1, tone: 'bad', text: `Three weeks of silence. Gary asks twice more, then stops asking. The dog gets out again and digs up your garden.` }],
        later: `Avoidance isn't a neutral move in a repeated game. Gary read silence as a no, delivered without the respect of saying it.`
      },
      {
        key: 'E', text: `Ask Ruth to help mediate.`,
        q: 2, s: { coo: 1, inf: 1, com: -1, bnd: 0 }, rel: { gary: -1 },
        outcomes: [
          { p: 0.5, tone: 'good', text: `Ruth knows exactly what the last fence cost and gently suggests each of you pay for what you want. It works.` },
          { p: 0.5, tone: 'mixed', text: `Gary feels ambushed. "I didn't think we needed a referee." The deal gets done, but stiffly.` }
        ],
        later: `Mediation is useful when direct conversation fails. Using it first can signal that you don't trust the other person.`
      }
    ],
    analysis: {
      game: `A repeated game between neighbors. You'll make dozens of decisions with Gary over the years. This fence is less about $2,400 than about what kind of neighbors you'll be.`,
      incentives: `Gary needs to contain his dog. You need a working fence at a fair price. Those overlap on the base fence and diverge on the upgrade.`,
      leverage: `Shared responsibility for the boundary, and the long future you share. Gary has every reason to keep you happy.`,
      missing: `Why Gary wanted six feet of cedar. Once you knew it was the dog, the fair split became obvious.`,
      assumptions: `That fair means 50/50, or that "I didn't ask for it" settles the matter.`,
      controlled: `Your counteroffer and whether you said it directly.`,
      couldnt: `Gary's dog, the cost of cedar, and how your first meeting went.`,
      concept: { name: `The shadow of the future`, thinker: 'aumann', body: `Aumann proved that when people interact indefinitely and care about the future, cooperation can sustain itself without any enforcer. Your history with Gary shaped how he approached you today. Today shapes the next ten years.` },
      second: { name: `Pay for what you value`, thinker: 'nalebuff', body: `Splitting what you both need and letting each person pay for their extras creates value instead of fighting over it. Neither of you is subsidizing the other's preferences.` },
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
        key: 'A', text: `"That's great, I accept!"`,
        q: 1, s: { neg: -2, inf: -1, jdg: -1, coo: 1 },
        outcomes: [{ p: 1, tone: 'mixed', text: `Sam is delighted. You start at $92,000. Six months later you learn a peer hired the same month started at $101,000.` }],
        later: `Starting salary compounds. Every raise is a percentage of this number.`
      },
      {
        key: 'B', text: `"I have another offer at $105,000. Can you match it?"`,
        q: 0, s: { com: -2, lng: -2, neg: -1, jdg: -2 },
        outcomes: [
          { p: 0.5, tone: 'bad', text: `Sam asks, pleasantly, if you can share the offer in writing so they can "move quickly." You can't. The conversation gets a lot cooler.` },
          { p: 0.5, tone: 'mixed', text: `They come up to $101,000. You won. You also started a job with a lie that Alicia might someday discover.` }
        ],
        later: `A bluff is a threat you can't carry out. Schelling would call it non-credible. And when it works, it teaches you a habit that eventually fails publicly.`
      },
      {
        key: 'C', text: `"I'm excited about this. The posted range goes to $110,000, and I can start before your November launch. Could we get to $102,000? I'm also interviewing elsewhere next week, so could we make the deadline Tuesday?"`,
        q: 4, s: { neg: 2, inf: 2, com: 2, inc: 2, str: 2, jdg: 1 },
        outcomes: [
          { p: 0.65, tone: 'good', text: `Sam checks with Alicia. They come back at $99,000 plus a $3,000 signing bonus, and the deadline moves to Tuesday.` },
          { p: 0.35, tone: 'mixed', text: `Sam says $96,000 is the ceiling this cycle, with a six-month review. Less than you asked, more than you had. You decide with full information.` }
        ],
        later: `You anchored with real data, told the truth about your alternatives, and offered something they valued: speed. That's a negotiation both sides can feel good about.`
      },
      {
        key: 'D', text: `"I need $115,000 or I'm walking."`,
        q: 1, s: { neg: -1, coo: -2, reg: -1, bnd: 1 },
        outcomes: [
          { p: 0.6, tone: 'bad', text: `It's above their posted range. Sam says they'll "keep you in mind for future roles." You're now negotiating with your current employer, who doesn't know you were looking.` },
          { p: 0.4, tone: 'mixed', text: `Alicia calls you directly. They can't go above $110,000 and are disappointed by the tone. You take $105,000 with a slightly awkward start.` }
        ],
        later: `An ultimatum above their published ceiling is a commitment you'd have to keep, and you probably don't want to.`
      },
      {
        key: 'E', text: `"Thank you. Could I have until next Wednesday to decide?"`,
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
      lesson: `The strongest negotiators aren't the toughest. They know both sides' alternatives and say true things about them.`
    }
  }
];
