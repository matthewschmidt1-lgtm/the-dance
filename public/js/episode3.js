// Episode 3, The Circle: friends, family and the group chat.
// Substance and staging live together here, in the format described in scenarios.js and scenes.js.
// Omar and Nate are each one hidden type for the whole episode (share: 'omar' / 'nate'),
// so what you notice about them in one scene is still true in the next.
window.PP = window.PP || {};

(function () {
  const has = (ctx, ...i) => i.every(k => ctx.clues.includes(k));
  const rel = (ctx, who) => (ctx.rel && ctx.rel[who]) || 0;

  // ─────────────────────────────────────────── People
  Object.assign(PP.people, {
    jess:  { name: `Jess`,  look: { skin: '#d9a982', hair: 'curly', hairColor: '#5a2e1c', top: 'sweater', topColor: '#b5523b', shirt: '#f1ece2', pants: '#2f3338', h: 0.97 } },
    omar:  { name: `Omar`,  look: { skin: '#a8714f', hair: 'short', hairColor: '#17110d', facial: 'beard', top: 'hoodie', topColor: '#2e4a62', pants: '#3a3f47', build: 1.04, h: 1.02 } },
    lena:  { name: `Lena`,  look: { skin: '#f0cfb4', hair: 'long', hairColor: '#c7a46a', top: 'cardigan', topColor: '#6b8a7a', shirt: '#ece5d9', pants: '#3b3f4a', h: 0.95 } },
    carol: { name: `Mom`,   look: { skin: '#e8bfa0', hair: 'bob', hairColor: '#c9c4bc', glasses: true, top: 'cardigan', topColor: '#8a5a6e', shirt: '#f2efe9', skirt: '#4a4458', h: 0.93 } },
    nate:  { name: `Nate`,  look: { skin: '#e2b48f', hair: 'sidepart', hairColor: '#6b4a2e', facial: 'stubble', top: 'flannel', topColor: '#3f5a46', check: '#1f2a22', pants: '#4a5a6e', build: 1.06, h: 1.03 } }
  });

  // ─────────────────────────────────────────── Scenarios
  const square = c => c.type !== 'taker';
  const stretched = c => c.type !== 'coasting';
  const clash = c => c.type === 'clash';

  const SCENARIOS = [
    // ───────────── The Rental: you set the rules for splitting a cabin
    {
      id: 'the-rental',
      share: 'omar',
      level: `Rules of the game`,
      arena: `Friends`,
      title: `The Rental`,
      lens: ['nalebuff', 'nash'],
      setting: `A lake cabin · Friday, 4:30 pm · You booked it on your card`,
      types: [
        { id: 'square', p: 0.55, who: `Omar`, label: `Omar was square`, tell: `He paid you back for last year's beach house the next morning, and quietly covered the grocery run.` },
        { id: 'taker', p: 0.45, who: `Omar`, label: `Omar takes what the rules allow`, tell: `Last year he paid his share three weeks late, after two reminders, and never chipped in for groceries.` }
      ],
      cast: [
        { name: `Omar`, role: `Old friend`, archetype: `The Charmer`, power: `Everyone likes him`, note: `The first to say yes to a trip. Not always the first to pay for it.` },
        { name: `Jess`, role: `Old friend`, archetype: `The Organizer`, power: `The group chat`, note: `Will remember how this was handled.` },
        { name: `Lena`, role: `Old friend`, archetype: `The Quiet One`, power: `Goodwill`, note: `Between jobs. Hasn't told everyone.` }
      ],
      known: [`The cabin is $2,400 for the weekend. You paid it on your card.`, `Six people: Omar and his girlfriend Talia, you and your partner, Jess and Lena.`, `There's a big suite with its own bath, a queen room, and a bunk room with no door.`, `An even split is $400 each.`],
      unknown: [`Whether Omar will pay you back, and when.`, `What the rooms are worth to each person.`, `Who will feel shortchanged, and whether they'll say so.`],
      clues: [
        { label: `Look at the listing's floor plan`, text: `The suite is almost half the bedroom space and has the only private bathroom. The bunk room is a hallway with a curtain. A fair price per room might be $960, $800 and $640.` },
        { label: `Scroll back through last year's trip in the group chat`, text: c => square(c) ? `"Sent!" Omar paid you back for the beach house the next morning, and covered the grocery run without being asked.` : `Two reminders in two weeks. Omar paid his share of the beach house three weeks late and never mentioned the groceries.` },
        { label: `Ask Lena what she'd pay`, text: `"Honestly? I'd take the bunk room for less. I'd sleep on the couch for $250 if that's an option." She laughs, but she means it.` }
      ],
      question: `How do you split the cost?`,
      options: [
        {
          key: 'A', text: `Price the rooms by what they offer: $960 for the suite, $800 for the queen, $640 for the bunks. Then everyone picks.`,
          needs: [0], vague: {
            text: `Charge a bit more for the big room and a bit less for the bunks. Then everyone picks.`, q: 3,
            their: c => has(c, 2) ? `Pricing the rooms before anyone picks is the right idea, and Lena's number gave the bunks a starting point. The floor plan would have given you all three.` : `Pricing the rooms before anyone picks is the right idea. Without real numbers, "a bit more" turned into a negotiation.`,
            later: `The right rule, without the numbers to make it stick.`,
            outcomes: [
              { p: c => (square(c) ? 0.75 : 0.45) + (has(c, 2) ? 0.15 : 0), tone: c => square(c) ? 'good' : 'mixed', text: c => square(c) ? `Omar offers fifty more for the suite. Everyone picks. It's fine.` : `Omar haggles "a bit more" down to almost nothing, and takes the suite.` },
              { p: c => (square(c) ? 0.25 : 0.55) - (has(c, 2) ? 0.15 : 0), tone: 'mixed', text: c => square(c) ? `It takes twenty messages to agree on what "a bit" means.` : `Omar takes the suite at "a bit more," then pays the even split anyway. "Didn't we land on four hundred?"` }
            ]
          },
          their: c => square(c) ? `When the price matches the room, nobody envies anyone else's room. Omar could take the suite or save money, and either one was fair.` : `Prices set before anyone picks leave nothing to game. Omar could still pay late, but he couldn't take the suite for the price of the bunks.`,
          q: c => has(c, 1) && !square(c) ? 3 : 4, s: { str: 2, jdg: 2, com: 1, coo: 1 }, rel: { omar: 1 },
          outcomes: [
            { p: c => square(c) ? 0.85 : 0.55, tone: 'good', text: c => square(c) ? `Omar takes the suite at $960 and pays that night. Jess and Lena take the bunks for $320 each and joke that they got the deal.` : `Omar takes the suite at $960. It takes one reminder, but he pays. Lena has the bunks for $320, and nobody envies anybody.` },
            { p: c => square(c) ? 0.15 : 0.45, tone: 'mixed', text: c => square(c) ? `Omar asks to swap to the queen to save money. You do, and it's fine.` : `Everyone picks without a fight. Omar's payment arrives three weeks late, but it's the right amount.` }
          ],
          later: `You designed the rules so no one would want someone else's room. That's most of the work.`
        },
        {
          key: 'B', text: `Let people bid for rooms: whoever offers the most for the suite gets it, and the rest split what's left.`,
          their: c => square(c) ? `An auction gets the suite to whoever values it most. It also turns a weekend with friends into a price war, and Lena can't play.` : `An auction works when everyone pays what they bid. Omar bid high and paid slow.`,
          q: c => has(c, 2) ? 1 : 2, s: { str: 1, neg: 1, coo: -1, com: -1 }, rel: { omar: 0 },
          outcomes: [
            { p: c => square(c) ? 0.6 : 0.3, tone: 'mixed', text: c => square(c) ? `Omar wins the suite at $1,100. Fair price. Lena feels like she was outbid at a party.` : `Omar wins the suite at $1,100. You're still waiting on most of it in three weeks.` },
            { p: c => square(c) ? 0.4 : 0.7, tone: 'mixed', text: c => square(c) ? `Jess and Omar bid each other up to $1,250 as a joke, and then it stops being a joke.` : `Omar bids $1,100, then asks if he can "sort it out after the trip." You've done this before.` }
          ],
          later: `An auction is efficient. It's also a strange thing to run on your friends.`
        },
        {
          key: 'C', text: `Keep it simple: split it evenly at $400 each, and rooms go first come, first served.`,
          their: c => square(c) ? `Omar thinks first come, first served is fine, and he's first. Nobody says anything, but Jess and Lena paid the same for a curtain as he did for a suite.` : `Rules that reward whoever moves first get gamed by whoever moves first. Omar took the suite and took his time paying.`,
          q: c => has(c, 0) || has(c, 2) ? 1 : 2, s: { coo: 1, com: -1, jdg: -1 }, rel: { omar: 0 },
          outcomes: [
            { p: c => square(c) ? 0.6 : 0.2, tone: 'mixed', text: c => square(c) ? `Omar claims the suite and pays you that night. Lena says nothing, but she sleeps behind a curtain for the same $400.` : `Omar claims the suite. He pays you two weeks later, after a reminder. Lena notices.` },
            { p: c => square(c) ? 0.4 : 0.8, tone: 'bad', text: c => square(c) ? `Jess jokes, "Must be nice," about the suite. By Saturday it isn't a joke.` : `Omar claims the suite and you're still chasing his $800 a month later. Lena quietly pays her full share.` }
          ],
          later: `Equal isn't the same as fair when the rooms aren't equal. Simple rules get gamed by whoever moves first.`
        },
        {
          key: 'D', text: `Last year took three weeks to collect. Even split, $400 each, and everyone pays before I confirm the booking.`,
          needs: c => square(c) ? [-1] : [1], vague: { text: `Even split, $400 each, and everyone pays before I confirm the booking. Simplest that way.` },
          their: c => square(c) ? `Paying up front is a good rule. Omar would have paid anyway, and the even split still put Lena behind a curtain at full price.` : `Paying first changes what Omar can get away with. The rule did the reminding for you.`,
          q: c => square(c) ? 2 : 3, s: { bnd: 2, jdg: 1, coo: -1 }, rel: { omar: 0 },
          outcomes: [
            { p: c => square(c) ? 0.8 : 0.7, tone: c => square(c) ? 'mixed' : 'good', text: c => square(c) ? `Everyone pays in a day. Omar takes the suite. Lena takes the curtain at the same price.` : `Omar pays within the hour. Then he takes the suite, at the same price as everyone else.` },
            { p: c => square(c) ? 0.2 : 0.3, tone: 'mixed', text: c => square(c) ? `Jess calls it "very corporate," but pays.` : `Omar pays on the last day, with a joke about your "terms of service."` }
          ],
          later: `You fixed when people pay. You didn't fix what they were paying for.`
        },
        {
          key: 'E', text: `Post in the group chat: "Some of us were three weeks late last year. Pay by Friday or lose your spot."`,
          needs: c => square(c) ? [-1] : [1], vague: { text: `Post in the group chat: "Pay by Friday or lose your spot. I'm not chasing anyone this year."` },
          their: c => square(c) ? `Omar paid on time last year, so the post landed on someone else, or on no one. Everyone read it as a dig.` : `The post was accurate, and everyone knew who it meant. Omar paid, and he remembers who embarrassed him in front of the group.`,
          q: c => has(c, 1) && !square(c) ? 1 : 0, s: { bnd: 1, com: -2, coo: -2, lng: -1 }, rel: { omar: -2 },
          outcomes: [
            { p: c => square(c) ? 0.3 : 0.7, tone: 'mixed', text: c => square(c) ? `Everyone pays by Friday. Jess messages you privately: "Who was that about?"` : `Omar pays by Friday. He doesn't speak to you on the drive up.` },
            { p: c => square(c) ? 0.7 : 0.3, tone: 'bad', text: c => square(c) ? `Omar replies, "Who's late?" Nobody was. The chat goes quiet for a day.` : `Omar pays, and replies with a thumbs-down. Talia unfollows you.` }
          ],
          later: `Being right about someone in public is expensive. The rule would have done the work quietly.`
        }
      ],
      analysis: {
        game: `Fair division with a mechanism: you set the rules, and everyone else plays by them. Whatever the rules reward, people will do.`,
        incentives: `Whoever picks first wants the best room. Whoever is short on money wants a cheaper option. Whoever pays late gains from rules that don't care when you pay.`,
        leverage: `You booked it, so you write the rules. That's real power, and it's easy to waste.`,
        missing: `What the rooms were worth, from the floor plan. Whether Omar pays on time, from last year's chat.`,
        assumptions: `That equal means fair. That the problem is Omar, rather than the rules.`,
        controlled: `The prices, the order of picking, and when people pay.`,
        couldnt: `What anyone thought of the split, unless they said so.`,
        concept: { thinker: 'nalebuff', term: `Mechanism design`, name: `Design the rules, not the people`, body: `You can't change who your friends are. You can change the rules so that their best move is also the fair one. Price the rooms, and nobody wants someone else's.` },
        second: { thinker: 'nash', term: `Envy-free division`, name: `A split nobody wants to swap`, body: `A division is envy-free when nobody would trade their share for anyone else's. With unequal rooms, that means unequal prices.` },
        better: `A, with the floor plan's numbers. If Omar has been slow before, add "pay before I book."`,
        lesson: `When you write the rules, you decide what people get rewarded for. Write them before anyone picks.`
      }
    },

    // ───────────── The Bill: one check, six people, and a bottle of champagne
    {
      id: 'the-bill',
      share: 'omar',
      level: `Free riders`,
      arena: `Friends`,
      title: `The Bill`,
      lens: ['nash', 'axelrod'],
      setting: `Harbor Street Bistro · Sunday, 10:40 pm · The last night of the trip`,
      types: [
        { id: 'square', p: 0.55, who: `Omar`, label: `Omar meant to cover the champagne`, tell: `He'd told Jess before dinner that the bottle was his treat. He just forgot to say so at the table.` },
        { id: 'taker', p: 0.45, who: `Omar`, label: `Omar orders big when the bill gets split`, tell: `It's a pattern. Last year it was the tasting menu, and the year before, the bar tab.` }
      ],
      cast: [
        { name: `Omar`, role: `Old friend`, archetype: `The Charmer`, power: `He ordered the champagne`, note: `Ordered "a bottle for the table." And the lobster.` },
        { name: `Lena`, role: `Old friend`, archetype: `The Quiet One`, power: `None she'd use`, note: `Had a salad and tap water.` },
        { name: `Jess`, role: `Old friend`, archetype: `The Organizer`, power: `Knows everyone's history`, note: `Watching to see who says what.` }
      ],
      known: [`The bill is $612 with tip. Split six ways, that's $102 each.`, `The server is waiting with the card machine.`, `Omar ordered a bottle of champagne "for the table," and the lobster.`],
      unknown: [`What everyone actually ordered.`, `Whether Omar planned to pay for the bottle.`, `Who can afford $102 tonight.`],
      clues: [
        { label: `Read the bill`, text: `Champagne, $120. Lobster, $68. Talia's steak, $44. Lena's salad, $19. Most of the table is somewhere between $35 and $50.` },
        { label: `Ask Jess quietly`, text: c => square(c) ? `"He told me before dinner the champagne was his treat. He's probably forgotten."` : `"He does this every time. Orders big when we split it. Last year it was the tasting menu."` },
        { label: `Watch Lena`, text: `She's checking her banking app under the table. She ordered the cheapest thing on the menu, and water.` }
      ],
      question: `What do you suggest?`,
      options: [
        {
          key: 'A', text: `"Easiest thing is to split it six ways. A hundred and two each, and we can all get going?"`,
          their: c => square(c) ? `Omar meant to cover the bottle, and an even split meant he didn't have to. Lena paid $102 for a $19 salad.` : `An even split is a free ride for whoever ordered the most. Omar orders the most because the split is even. That's the whole pattern.`,
          q: c => has(c, 2) ? 0 : 1, s: { coo: 1, com: -1, jdg: -2 }, rel: { omar: 0 },
          outcomes: [
            { p: 1, tone: c => square(c) ? 'mixed' : 'bad', text: c => square(c) ? `Everyone taps their card. Omar realizes in the car he meant to get the champagne, and sends everyone $20.` : `Everyone taps their card. Lena pays $102 for a salad. Omar suggests the same place next year.` }
          ],
          later: `When the bill is shared, everyone has a reason to order more. The person who orders least pays for it.`
        },
        {
          key: 'B', text: `"Let's each pay for exactly what we ordered. I'll read the bill out, line by line."`,
          their: c => square(c) ? `Fair to the dollar. Reading out a bill line by line at the end of a trip is also a small public audit, and Omar's lines are the longest.` : `Itemizing ends the free ride. It also makes the moment about the ledger.`,
          q: 3, s: { bnd: 1, jdg: 1, coo: -1, com: -1 }, rel: { omar: -1 },
          outcomes: [
            { p: c => square(c) ? 0.7 : 0.5, tone: 'good', text: c => square(c) ? `Omar laughs: "The champagne's mine anyway." It takes eight minutes, and everyone pays what they ate.` : `It takes ten minutes. Omar's share is $218. He pays it, without much grace.` },
            { p: c => square(c) ? 0.3 : 0.5, tone: 'mixed', text: c => square(c) ? `It takes fifteen minutes of "who had the fries?" The server sighs.` : `Omar says, "Wow, okay, we're doing this," and pays. The drive home is quiet.` }
          ],
          later: `Fair to the dollar, and a little expensive in goodwill.`
        },
        {
          key: 'C', text: `Quietly hand the server your card for Lena's share, then say "Split the rest five ways."`,
          needs: [2], vague: { text: `Quietly cover a bigger share yourself, so nobody has to have the awkward conversation.` },
          their: c => square(c) ? `Kind to Lena, and invisible. It also meant the bill never got fixed, and Omar never found out he'd forgotten the bottle.` : `Generous, and it protected Lena. It also meant you paid for Omar's lobster, and the pattern keeps going.`,
          q: c => has(c, 2) ? 3 : 2, s: { coo: 2, com: 1, bnd: -1 }, rel: { omar: 0 },
          outcomes: [
            { p: 0.8, tone: 'mixed', text: `Lena finds out on the drive home and hugs you. You're out about $120 more than you ate.` },
            { p: 0.2, tone: 'mixed', text: c => square(c) ? `Omar sees and covers the champagne himself. "You should've said."` : `Omar sees and says, "Nice, you're buying?" It isn't a joke.` }
          ],
          later: `A quiet kindness that cost you money and left the rule unchanged.`
        },
        {
          key: 'D', text: `"Split the food six ways, and the champagne goes on whoever ordered it. That's Omar's hundred and twenty, right?"`,
          needs: [0], vague: {
            text: `"Split the food six ways, and drinks go on whoever ordered them?"`, q: 3,
            their: `The right rule. Without the numbers, "drinks" turned into a debate about who had a glass.`,
            later: `A good rule that the table had to argue into shape.`,
            outcomes: [
              { p: c => square(c) ? 0.75 : 0.45, tone: c => square(c) ? 'good' : 'mixed', text: c => square(c) ? `"The champagne was mine anyway," Omar says. Done.` : `Omar argues everyone had some champagne. They split it six ways after all.` },
              { p: c => square(c) ? 0.25 : 0.55, tone: 'mixed', text: c => square(c) ? `Five minutes about who had a glass, then it's sorted.` : `It gets sorted, eventually, mostly in Omar's favor.` }
            ]
          },
          their: c => square(c) ? `Omar meant to cover it anyway. You gave him an easy way to do it without anyone keeping score.` : `Splitting what was shared and assigning what wasn't ends the free ride without a line-by-line audit. Omar couldn't argue with his own bottle.`,
          q: 4, s: { jdg: 2, str: 1, com: 2, coo: 1 }, rel: { omar: c => square(c) ? 1 : 0 },
          outcomes: [
            { p: c => square(c) ? 0.9 : 0.7, tone: 'good', text: c => square(c) ? `"Oh, it was always mine," Omar says, and taps first. Lena's share drops to $82.` : `Omar pauses, then shrugs. "Fair." Lena's share drops to $82, and she looks relieved.` },
            { p: c => square(c) ? 0.1 : 0.3, tone: 'mixed', text: c => square(c) ? `Omar insists on covering the lobster too. You let him.` : `Omar grumbles that it was "for the table," but pays. It's done in two minutes.` }
          ],
          later: `You split what was shared and assigned what wasn't. That's the whole fix, and it took one sentence.`
        },
        {
          key: 'E', text: `"Omar, a hundred and twenty for champagne and a sixty-eight dollar lobster. You're covering those, right?"`,
          needs: [0], vague: { text: `"Some of us ordered a lot more than others. Shouldn't that count?"` },
          their: c => square(c) ? `Omar was going to pay for the bottle. Being called out first, in front of everyone, made it look like he wasn't.` : `Correct, and in front of the whole table. Omar paid, and the price was paid in friendship.`,
          q: c => has(c, 1) && !square(c) ? 2 : 1, s: { bnd: 2, com: -2, coo: -2, lng: -1 }, rel: { omar: -2 },
          outcomes: [
            { p: c => square(c) ? 0.8 : 0.5, tone: 'mixed', text: c => square(c) ? `"I was always going to," Omar says, stung. He pays. The table goes quiet.` : `Omar pays for both. He doesn't say much for the rest of the night.` },
            { p: c => square(c) ? 0.2 : 0.5, tone: 'bad', text: c => square(c) ? `Talia snaps, "He literally told Jess it was his treat." Now you're the problem.` : `Omar says, "Didn't realize we were keeping score," and pays. Everyone else looks at their phones.` }
          ],
          later: `You were right about the numbers. Being right out loud cost more than the lobster.`
        }
      ],
      analysis: {
        game: `The diner's dilemma, a free-rider problem. When the bill is split evenly, each person pays only a sixth of what they add, so everyone has a reason to order more.`,
        incentives: `Whoever orders most gains from an even split. Whoever orders least pays for it. Nobody wants to be the one who brings up money.`,
        leverage: `Saying the rule out loud, in a way nobody has to defend against.`,
        missing: `What the bill actually said, and whether Lena could afford an even split.`,
        assumptions: `That even is fair. That bringing it up has to be a confrontation.`,
        controlled: `What you suggested, and how.`,
        couldnt: `What anyone ordered. That was decided two hours earlier.`,
        concept: { thinker: 'nash', term: `Free-rider problem`, name: `When costs are shared, everyone takes a little more`, body: `If everyone shares the cost of what each person takes, each person gets the full benefit and pays only a fraction. So everyone takes more, and the careful ones pay for it.` },
        second: { thinker: 'axelrod', term: `Diner's dilemma`, name: `Agree on the rule before you order`, body: `The cleanest fix is a rule agreed before anyone orders. At the end of the night, the next best thing is to split what was shared and assign what wasn't.` },
        better: `D with the bill's numbers. Next trip, agree on the rule before you order.`,
        lesson: `Split what was shared. Assign what wasn't. Say it as a rule, not an accusation.`
      }
    },

    // ───────────── The Date: twelve people, three weekends, one birthday
    {
      id: 'the-date',
      level: `Coordination`,
      arena: `The group chat`,
      title: `The Date`,
      lens: ['schelling', 'aumann'],
      setting: `The group chat · Wednesday, 9:10 pm · 61 unread messages`,
      types: [
        { id: 'clear', p: 0.55, who: `the group`, label: `The 14th was free for everyone`, tell: `Nobody had a conflict on Jess's actual birthday. Half the chat had already assumed it in passing.` },
        { id: 'clash', p: 0.45, who: `the group`, label: `The 14th had a clash`, tell: `Mina and Dev's wedding is on the 14th. Four of the twelve are going, and Jess would hate for them to miss it.` }
      ],
      cast: [
        { name: `Lena`, role: `Co-organizer`, archetype: `The Quiet One`, power: `Reads the room`, note: `Asked you to "just pick something."` },
        { name: `Jess`, role: `The birthday`, archetype: `The Organizer`, power: `It's her fortieth`, note: `Pretending not to read the chat.` }
      ],
      known: [`Jess turns forty on Saturday the 14th.`, `Three weekends have been floated: the 7th, the 14th and the 21st.`, `Twelve people are in the chat. Sixty-one messages, no date.`, `You and Lena are organizing.`],
      unknown: [`Which weekend most people can actually do.`, `What Jess really wants.`, `Whether anyone will commit until someone else does.`],
      clues: [
        { label: `Scroll back through the chat`, text: c => clash(c) ? `Buried in message 23: "Wait, isn't Mina and Dev's wedding the 14th?" Four people are going.` : `Six people have mentioned "the 14th, obviously" in passing. Nobody has mentioned a conflict.` },
        { label: `Text Jess's partner, Rafa`, text: `"Honestly? She'd hate anyone missing it more than she'd care about the date."` },
        { label: `Look at the poll`, text: `Five votes, split 3, 1 and 1. Seven people haven't voted. One wrote "whatever works!"` }
      ],
      question: `What do you post?`,
      options: [
        {
          key: 'A', text: `"New poll: the 7th, 14th or 21st. Everyone please vote by Friday so we can book something."`,
          their: `A second poll asks people to do the thing they didn't do the first time. Most of them are waiting to see what everyone else does.`,
          q: c => has(c, 2) ? 1 : 2, s: { coo: 1, jdg: -1, str: -1 }, rel: {},
          outcomes: [
            { p: 0.6, tone: 'mixed', text: `Seven votes by Friday, split 3, 2 and 2. Someone posts "whatever works!" again.` },
            { p: 0.4, tone: 'mixed', text: c => clash(c) ? `The 21st wins narrowly. Two people still say they "might" come.` : `The 14th wins narrowly. You book it four days later than you could have.` }
          ],
          later: `More voting rarely fixes a group that's waiting for someone to decide.`
        },
        {
          key: 'B', text: `"Six of you already said the 14th, her actual birthday. I'm booking it unless someone has a real conflict."`,
          needs: c => clash(c) ? [-1] : [0], vague: { text: `"Let's do the 14th, her actual birthday. I'm booking it unless someone has a real conflict."`, q: c => clash(c) ? (has(c, 0) ? 0 : 2) : 3 },
          their: c => clash(c) ? `The birthday is the obvious answer, which is why nobody checked it. Four people had a wedding.` : `Jess's birthday was the answer everyone expected everyone else to pick. Naming it gave them permission.`,
          q: c => clash(c) ? 1 : 4, s: { str: 2, com: 2, jdg: 1 }, rel: {},
          outcomes: [
            { p: c => clash(c) ? 0.2 : 0.9, tone: c => clash(c) ? 'mixed' : 'good', text: c => clash(c) ? `Nobody objects for a day. Then Mina replies: "That's our wedding." You move it, a week late.` : `Eleven thumbs-up in an hour. "Finally." You book the restaurant that night.` },
            { p: c => clash(c) ? 0.8 : 0.1, tone: c => clash(c) ? 'bad' : 'mixed', text: c => clash(c) ? `Four people reply that they're at Mina and Dev's wedding. Jess sees the thread and says, "Oh no, don't worry about me."` : `One person can't make it. Eleven can. Jess is thrilled.` }
          ],
          later: `People don't need the best date. They need one everybody expects everybody else to show up to.`
        },
        {
          key: 'C', text: `Call the five people who always come and lock a date with them first, then post it as done.`,
          their: `Starting with the core group works because everyone else follows them. It can also feel like a decision made in a back room.`,
          q: 3, s: { str: 2, inf: 1, coo: -1 }, rel: {},
          outcomes: [
            { p: c => clash(c) ? 0.6 : 0.7, tone: 'good', text: c => clash(c) ? `One of the five is going to the wedding, which is how you find out. You post the 21st as done, and the rest follow.` : `The five agree on the 14th in ten minutes. You post it, and the rest follow.` },
            { p: c => clash(c) ? 0.4 : 0.3, tone: 'mixed', text: `It works, but someone who wasn't called asks why they weren't. A small bruise.` }
          ],
          later: `You started with the people everyone follows. Fast, and a little exclusive.`
        },
        {
          key: 'D', text: `Message Jess privately: "It's your birthday. You pick, and I'll make it happen."`,
          their: `Jess wants everyone there. Asking her to choose puts her in the one spot she's trying to avoid: picking who misses her party.`,
          q: c => has(c, 1) ? 0 : 1, s: { coo: 2, jdg: -1, str: -1 }, rel: {},
          outcomes: [
            { p: 0.7, tone: 'mixed', text: `"Honestly, whatever works for everyone!" Jess says. You're back where you started, with a day gone.` },
            { p: 0.3, tone: c => clash(c) ? 'bad' : 'mixed', text: c => clash(c) ? `Jess picks the 14th, then finds out about the wedding and feels terrible.` : `Jess picks the 14th, a little embarrassed to have been asked.` }
          ],
          later: `You handed the hardest part of the job to the one person who shouldn't have to do it.`
        },
        {
          key: 'E', text: `"The 14th is Mina and Dev's wedding, and Jess wants everyone there. The 21st it is. Booking Friday."`,
          needs: c => clash(c) ? [0] : [-1], vague: { text: `"Let's do the 21st, so nobody's stuck choosing. Booking Friday unless someone objects."`, q: c => clash(c) ? 3 : (has(c, 0) ? 1 : 2) },
          their: c => clash(c) ? `You found the conflict nobody wanted to raise and named the next obvious date. Naming a reason made it easy to agree.` : `The 21st works, but nobody had a reason to prefer it. The birthday was sitting right there.`,
          q: 4, s: { str: 2, inf: 2, com: 2, jdg: 1 }, rel: {},
          outcomes: [
            { p: c => clash(c) ? 0.9 : 0.6, tone: c => clash(c) ? 'good' : 'mixed', text: c => clash(c) ? `Twelve yeses by morning. Mina sends a heart. Jess texts you: "You're the best."` : `Most people say yes. Two ask, "Why not her birthday?" and nobody has an answer.` },
            { p: c => clash(c) ? 0.1 : 0.4, tone: 'mixed', text: c => clash(c) ? `One person has a work trip on the 21st. Eleven out of twelve, and the right eleven.` : `It works, but someone had a conflict on the 21st that the 14th wouldn't have had.` }
          ],
          later: `You picked the date people could agree on, and gave them the reason in the same message.`
        }
      ],
      analysis: {
        game: `A coordination game. Everyone wants to be at the same party, and nobody minds much which weekend. The hard part isn't disagreement. It's that nobody wants to go first.`,
        incentives: `Each person waits to see what the others will do. Saying "whatever works" is safe for each person, and it's why the chat has 61 messages and no date.`,
        leverage: `Being the organizer. A clear, reasoned date from you is the signal everyone's waiting for.`,
        missing: `Whether the obvious date, her birthday, had a hidden clash. It was in the chat.`,
        assumptions: `That another vote would help. That the obvious date was safe without checking.`,
        controlled: `What you proposed, and the reason you gave for it.`,
        couldnt: `Other people's calendars.`,
        concept: { thinker: 'schelling', term: `Focal point`, name: `The answer everyone expects everyone to pick`, body: `When people need to coordinate and can't all talk at once, they converge on whatever stands out. Her birthday stands out. Your job is to check it works, then name it.` },
        second: { thinker: 'aumann', term: `Common knowledge`, name: `Everyone knowing that everyone knows`, body: `People may privately agree on a date and still wait, because nobody knows the others agree. A public, firm message turns private agreement into common knowledge.` },
        better: `Read the chat first. If the birthday is clear, name it. If not, name the next date and say why.`,
        lesson: `Groups don't stall because they disagree. They stall because nobody goes first. Go first, with a reason.`
      }
    },

    // ───────────── The Loan: Omar asks again
    {
      id: 'the-loan',
      share: 'omar',
      level: `Repeated games`,
      arena: `Friends`,
      title: `The Loan`,
      lens: ['axelrod', 'duke'],
      setting: `Your place · Thursday, 8:20 pm · Omar dropped by "to say hi"`,
      types: [
        { id: 'square', p: 0.55, who: `Omar`, label: `Omar was good for it`, tell: `His transmission really did die, and he really was embarrassed to ask. Last time, he paid back every dollar, if slowly.` },
        { id: 'taker', p: 0.45, who: `Omar`, label: `Omar was working his way down a list`, tell: `He'd already asked Jess for a thousand last month. He still owes you $300 from last time, and hasn't mentioned it.` }
      ],
      cast: [
        { name: `Omar`, role: `Old friend`, archetype: `The Charmer`, power: `Fifteen years of friendship`, note: `Needs $1,500 "just until the first."` }
      ],
      known: [`Omar wants to borrow $1,500 until "the first of the month."`, `Two years ago you lent him $800.`, `$1,500 is most of your vacation fund.`],
      unknown: [`Whether he'll pay it back, and when.`, `Whether he's asked anyone else.`, `What saying no would do to the friendship.`],
      clues: [
        { label: `Check your payment history with Omar`, text: c => square(c) ? `$800 out, two years ago. $800 back, in three payments. The last one was six weeks late, with an apology.` : `$800 out, two years ago. $500 back, in one payment. Nothing since, and nothing said.` },
        { label: `Ask Jess if he's mentioned money`, text: c => square(c) ? `"His transmission died. He's mortified. He didn't want to ask anyone."` : `"He asked me for a thousand last month. I said no. I assumed he'd ask you next."` },
        { label: `Look at your own budget`, text: `You could lose $500 without it hurting. Losing $1,500 would mean no trip this year.` }
      ],
      question: `What do you tell Omar?`,
      options: [
        {
          key: 'A', text: c => square(c) ? `"You paid me back last time, so yes. Let's do $500 on the first of each month."` : `"You still owe me $300 from last time. Pay that back first, then we'll talk about the rest."`,
          needs: [0], vague: {
            text: `"I can help, if we set up a plan to pay it back. Say $500 on the first of each month?"`, q: 3,
            their: c => square(c) ? `A repayment plan is reasonable. Omar would have paid anyway, and a plan made it easier.` : `A plan is better than no plan. You lent the full amount to someone who hadn't finished paying back the last loan.`,
            later: `A plan, without knowing what happened to the last one.`,
            outcomes: [
              { p: c => square(c) ? 0.85 : 0.35, tone: c => square(c) ? 'good' : 'mixed', text: c => square(c) ? `Three payments, on the first of three months. Like clockwork.` : `The first $500 arrives on time. The second is late. The third never comes.` },
              { p: c => square(c) ? 0.15 : 0.65, tone: c => square(c) ? 'mixed' : 'bad', text: c => square(c) ? `Two on time, one late, with an apology.` : `One payment, then silence. You're out $1,000.` }
            ]
          },
          their: c => square(c) ? `You did what he did last time: he kept his word, so you kept faith. A plan made it easy for him to keep it again.` : `You did what he did: he left $300 unpaid, so the next loan waited on that. It wasn't a punishment. It was a mirror.`,
          q: 4, s: { str: 2, bnd: 2, lng: 2, jdg: 1 }, rel: { omar: c => square(c) ? 1 : 0 },
          outcomes: [
            { p: c => square(c) ? 0.9 : 0.6, tone: 'good', text: c => square(c) ? `"Deal. Thank you. Really." Three payments, on the first of three months.` : `Omar is quiet for a moment. "Fair." The $300 arrives Friday. You lend him $500, and it comes back.` },
            { p: c => square(c) ? 0.1 : 0.4, tone: 'mixed', text: c => square(c) ? `Two payments on time, the third a week late, with an apology and a pizza.` : `Omar says he'll "sort out the three hundred." He doesn't, so neither do you.` }
          ],
          later: `You treated him the way he treated you last time. That's tit for tat, and it's kinder than it sounds.`
        },
        {
          key: 'B', text: `"I'm sorry, I can't lend money right now. I hope you understand."`,
          their: c => square(c) ? `Omar repaid you last time. Saying no to someone who keeps their end makes them wonder what the friendship was for.` : `A kind no protected your trip. It also didn't tell him why, so he'll ask again next year.`,
          q: c => has(c, 0) && !square(c) ? 3 : 2, s: { bnd: 2, coo: -1, lng: -1 }, rel: { omar: c => square(c) ? -1 : 0 },
          outcomes: [
            { p: c => square(c) ? 0.6 : 0.8, tone: 'mixed', text: c => square(c) ? `"Totally, no worries," Omar says, embarrassed. He's a little distant for a while.` : `Omar shrugs. "No worries." He asks someone else.` },
            { p: c => square(c) ? 0.4 : 0.2, tone: c => square(c) ? 'bad' : 'mixed', text: c => square(c) ? `Omar takes out a payday loan. You find out from Jess.` : `Omar brings it up again two weeks later, as if you hadn't answered.` }
          ],
          later: `You protected yourself. Whether that cost anything depended on what he'd done last time.`
        },
        {
          key: 'C', text: `"Of course. I'll send it tonight. Pay me back whenever you can."`,
          their: c => square(c) ? `Omar would have paid you back anyway. Generosity with someone who returns it builds the friendship.` : `Unconditional help is the easiest thing to keep asking for. "Whenever you can" turned out to be never.`,
          q: c => has(c, 0) && !square(c) ? 0 : (square(c) ? 3 : 1), s: { coo: 2, bnd: -2, jdg: -1 }, rel: { omar: 1 },
          outcomes: [
            { p: c => (square(c) ? 0.8 : 0.15) + (rel(c, 'omar') > 0 ? 0.1 : 0), tone: 'good', text: c => square(c) ? `Omar pays it back in three months, with a bottle of wine you'll actually drink.` : `To your surprise, Omar pays it all back by spring.` },
            { p: c => (square(c) ? 0.2 : 0.85) - (rel(c, 'omar') > 0 ? 0.1 : 0), tone: c => square(c) ? 'mixed' : 'bad', text: c => square(c) ? `He pays back $1,200, then goes quiet. You let it go.` : `$300 comes back. Then nothing. Your vacation fund is a memory.` }
          ],
          later: `Generous, and a good bet only if the last bet paid off. You didn't check.`
        },
        {
          key: 'D', text: `"I can't do $1,500. Here's $500, and you don't need to pay it back."`,
          needs: [2], vague: { text: `"I can't do the whole thing. Here's some, and don't worry about paying it back."`, q: 3 },
          their: c => square(c) ? `Omar needed the full amount and would have paid it back. Your gift helped, and he'll pay it back anyway.` : `Giving only what you can afford to lose turns a loan you'd chase into a gift you don't have to. With Omar, that was the realistic outcome anyway.`,
          q: c => square(c) ? 3 : 4, s: { bnd: 2, coo: 1, jdg: 2 }, rel: { omar: 1 },
          outcomes: [
            { p: c => square(c) ? 0.7 : 0.8, tone: 'good', text: c => square(c) ? `Omar finds the rest elsewhere. Three months later he sends you $500 anyway: "Not a gift. Thank you."` : `Omar takes it and thanks you. He doesn't pay it back, and you don't have to wonder.` },
            { p: c => square(c) ? 0.3 : 0.2, tone: 'mixed', text: c => square(c) ? `Omar is grateful and a little embarrassed. The car gets fixed a month late.` : `He takes it, and asks for "the other thousand" in a month.` }
          ],
          later: `You decided what you could afford to lose, and gave exactly that. Nothing to chase.`
        },
        {
          key: 'E', text: c => square(c) ? `"Before I answer: have you asked anyone else? Who else knows about this?"` : `"Jess says you asked her for a thousand last month. How many of us are you working through?"`,
          needs: c => square(c) ? [-1] : [1], vague: { text: `"Before I answer: have you asked anyone else? Who else knows about this?"` },
          their: c => square(c) ? `Omar was embarrassed to ask anyone. Being questioned about it made the embarrassment the point.` : `True, and it landed as an accusation. Omar now knows Jess talked, and you know what he's doing. Neither of you can unknow it.`,
          q: c => square(c) ? 1 : 2, s: { inf: 1, bnd: 1, com: -2, lng: -2 }, rel: { omar: -2 },
          outcomes: [
            { p: c => square(c) ? 0.7 : 0.6, tone: c => square(c) ? 'bad' : 'mixed', text: c => square(c) ? `"Nobody. That's why I asked you." Omar leaves early.` : `Omar goes red. "Wow. Okay." He leaves, and doesn't ask again.` },
            { p: c => square(c) ? 0.3 : 0.4, tone: 'bad', text: c => square(c) ? `Omar tells you about the transmission, quietly. You lend it. Things are a little stiff for a while.` : `Omar calls Jess that night. Now three friendships are strained instead of one.` }
          ],
          later: `You used what you'd heard as a weapon. It got you the truth and cost you the room.`
        }
      ],
      analysis: {
        game: `A repeated game. This isn't one loan. It's the next round of a friendship that's had loans before, and will again.`,
        incentives: `Omar wants the money with as few conditions as possible. You want to help without becoming a bank. Both of you want the friendship to survive this.`,
        leverage: `What happened last time. That's the most honest basis for what happens this time.`,
        missing: `Whether he paid back the last loan, and whether he'd asked anyone else. Both were one question away.`,
        assumptions: `That it's lend or refuse. That conditions are unkind.`,
        controlled: `How much, on what terms, and what you were willing to lose.`,
        couldnt: `Whether he'd pay you back. Only what you'd risk on it.`,
        concept: { thinker: 'axelrod', term: `Tit for tat`, name: `Start kind, then mirror`, body: `In repeated games, the strategy that does best starts by cooperating, then copies whatever the other side did last time. It rewards good faith, doesn't reward taking, and forgives as soon as they change.` },
        second: { thinker: 'duke', term: `Downside sizing`, name: `Lend only what you can afford to lose`, body: `Before any bet, decide what losing would cost you. If you'd resent losing it, either lend less or give it as a gift.` },
        better: `A, after checking your payment history. If you can't check, D: give what you can afford to lose.`,
        lesson: `Treat people the way they treated you last time. Start kind, mirror what they did, and forgive fast when they change.`
      }
    },

    // ───────────── The Holidays: you've hosted six in a row
    {
      id: 'the-holidays',
      share: 'nate',
      level: `Taking turns`,
      arena: `Family`,
      title: `The Holidays`,
      lens: ['aumann', 'schelling'],
      setting: `Mom's kitchen · Sunday, 2:00 pm · October`,
      types: [
        { id: 'stretched', p: 0.5, who: `Nate`, label: `Nate was stretched thin`, tell: `His wife Ana has back surgery in November, and he's barely holding it together. He hadn't told you because he didn't want to make it a thing.` },
        { id: 'coasting', p: 0.5, who: `Nate`, label: `Nate was coasting`, tell: `Nothing was stopping him. You'd always hosted, so he assumed you always would.` }
      ],
      cast: [
        { name: `Mom`, role: `Your mother`, archetype: `The Peacekeeper`, power: `Everyone listens to her`, note: `Wants everyone at one table, and nobody upset.` },
        { name: `Nate`, role: `Your brother`, archetype: `The Comfortable One`, power: `He lives twenty minutes away`, note: `Two kids, a house with a big dining room.` }
      ],
      known: [`Mom wants to know who's hosting Thanksgiving and Christmas.`, `You live two hours away. Nate lives twenty minutes from Mom.`, `Nate has a bigger house and two kids.`],
      unknown: [`How many years in a row you've hosted.`, `Why Nate always says "it's easier at yours."`, `What Mom thinks is fair.`],
      clues: [
        { label: `Look at the calendar on the fridge`, text: `Mom writes every holiday on it. Your name is on the last six in a row: three Thanksgivings, three Christmases.` },
        { label: `Ask Mom privately`, text: c => stretched(c) ? `"Ana's having back surgery in November. He hasn't told you because he didn't want you to worry."` : `"He says you like hosting. Do you?"` },
        { label: `Look at your own calendar`, text: `You fly out for work the Monday after Thanksgiving. Hosting means cleaning up until Sunday night, then packing.` }
      ],
      question: `What do you say?`,
      options: [
        {
          key: 'A', text: `"It's fine, I'll host both again this year. Honestly, it's easier than arguing about it."`,
          their: c => stretched(c) ? `Nate really couldn't this year. Hosting was kind. Saying nothing meant he never knew you'd noticed, or that it cost you.` : `When one person always says yes, nobody else ever has to. Nate wasn't avoiding it. He just never had to think about it.`,
          q: c => has(c, 0) || has(c, 2) ? 1 : 2, s: { coo: 2, bnd: -2, lng: -1 }, rel: { nate: 0 },
          outcomes: [
            { p: 1, tone: 'mixed', text: c => stretched(c) ? `You host both. Nate is grateful, and you're exhausted. He never knows you were close to saying no.` : `You host both. Nate brings a bag of rolls. Next year, nobody asks.` }
          ],
          later: `Peace this year, at the price of the same conversation next year.`
        },
        {
          key: 'B', text: `"I've hosted the last six. Let's take turns: I'll do Thanksgiving, you take Christmas, and we swap every year."`,
          needs: [0], vague: {
            text: `"I've done a lot of these. Could we start taking turns? I'll do Thanksgiving, you take Christmas."`, q: c => stretched(c) ? 2 : 3,
            their: c => stretched(c) ? `Taking turns is fair. This year, Nate couldn't take his turn, and couldn't say why in front of Mom.` : `Taking turns was right. "A lot" was easy for Nate to argue with: "It's not that many."`,
            later: `The right rule, without the number that would have made it stick.`,
            outcomes: [
              { p: c => stretched(c) ? 0.3 : 0.6, tone: c => stretched(c) ? 'mixed' : 'good', text: c => stretched(c) ? `Nate agrees, then calls in December: he can't. You host Christmas on a week's notice.` : `Nate says, "It's not that many," then agrees. He hosts Christmas.` },
              { p: c => stretched(c) ? 0.7 : 0.4, tone: 'mixed', text: c => stretched(c) ? `Nate goes quiet, then says he can't this year, and won't say why. Mom looks pained.` : `Nate says, "We'll see." You end up hosting both.` }
            ]
          },
          their: c => stretched(c) ? `A rotation is fair, and the number made it hard to argue with. But this year Nate couldn't take his turn, and he had to say so in front of Mom.` : `Six in a row, in Mom's handwriting, is hard to argue with. A rotation turned a favor into a rule.`,
          q: c => stretched(c) ? 3 : 4, s: { str: 2, bnd: 2, com: 1, lng: 2 }, rel: { nate: c => stretched(c) ? 0 : 1 },
          outcomes: [
            { p: c => stretched(c) ? 0.4 : 0.85, tone: c => stretched(c) ? 'mixed' : 'good', text: c => stretched(c) ? `Nate says, "Not this year," and tells you about Ana's surgery. You swap: you host both, he takes both next year. Mom writes it down.` : `Nate looks at the calendar. "Huh. Okay, yeah, that's fair." He hosts Christmas, and it's lovely.` },
            { p: c => stretched(c) ? 0.6 : 0.15, tone: 'mixed', text: c => stretched(c) ? `Nate agrees, then calls in December: he can't. You host Christmas on a week's notice.` : `Nate grumbles, then agrees. He hosts Christmas with a lot of store-bought sides.` }
          ],
          later: `You turned a favor into a rule. In a family that will do this every year, that's the move.`
        },
        {
          key: 'C', text: `"Six in a row, Nate. It's right there on the fridge. You're hosting both this year."`,
          needs: [0], vague: { text: `"I've done enough of these. You're hosting both this year."` },
          their: c => stretched(c) ? `You were right about the six. You didn't know about the surgery, and now Nate has to tell you in front of Mom, or say yes to something he can't do.` : `Correct, and an order. Nate hosted, and resented being told.`,
          q: c => stretched(c) ? 0 : 2, s: { bnd: 2, com: -2, coo: -2, lng: -1 }, rel: { nate: -2 },
          outcomes: [
            { p: c => stretched(c) ? 0.7 : 0.6, tone: c => stretched(c) ? 'bad' : 'mixed', text: c => stretched(c) ? `Nate snaps, "Ana's having surgery." Mom starts crying. You host both anyway, and feel terrible.` : `Nate hosts both, with a short temper. Mom spends Christmas smoothing things over.` },
            { p: c => stretched(c) ? 0.3 : 0.4, tone: 'mixed', text: c => stretched(c) ? `Nate says yes through his teeth. In December, Ana has to cook from bed.` : `Nate says, "Fine," and hosts. The two of you don't talk much until spring.` }
          ],
          later: `Right about the past and wrong about the moment. The calendar was evidence, not a weapon.`
        },
        {
          key: 'D', text: c => stretched(c) ? `"Mom told me about Ana's surgery. I'll host both this year, you take both next year, and Mom writes it down."` : `"I'll host both this year if you take both next year. Mom, can you write that on the calendar?"`,
          needs: c => stretched(c) ? [1] : [-1], vague: { text: `"I'll host both this year if you take both next year. Mom, can you write that on the calendar?"`, q: c => stretched(c) ? 4 : 3 },
          their: c => stretched(c) ? `You saw what Nate couldn't say, and gave him a turn he could actually take. Writing it down made it a promise, not a favor.` : `A deferred turn in writing is hard to wriggle out of. Next year, the calendar does the asking.`,
          q: 4, s: { str: 2, com: 2, lng: 2, coo: 1 }, rel: { nate: 1 },
          outcomes: [
            { p: c => stretched(c) ? 0.9 : 0.65, tone: 'good', text: c => stretched(c) ? `Nate exhales. "Thank you. Really." Mom writes NATE in December next year, and underlines it.` : `Nate agrees, a little surprised. Mom writes it down. Next year, he hosts both.` },
            { p: c => stretched(c) ? 0.1 : 0.35, tone: 'mixed', text: c => stretched(c) ? `Nate is grateful, and promises next year. It's a little vague, but it's on the calendar.` : `Next November, Nate "forgets." Mom points at the calendar. He hosts.` }
          ],
          later: `A turn deferred, in writing, in front of the person who'll remember.`
        },
        {
          key: 'E', text: `"I'm not hosting anything this year. Whoever wants Thanksgiving or Christmas can take it."`,
          their: `Stepping back forces someone else to step up. In this family, that someone was Mom.`,
          q: 1, s: { bnd: 2, coo: -2, lng: -1 }, rel: { nate: -1 },
          outcomes: [
            { p: 0.7, tone: 'bad', text: `Nobody volunteers. Mom hosts both at seventy-four, and her back hurts for a week.` },
            { p: 0.3, tone: 'mixed', text: c => stretched(c) ? `Nate tries, and it's chaos with Ana recovering. You end up helping anyway.` : `Nate hosts Christmas, grudgingly. Thanksgiving doesn't happen.` }
          ],
          later: `You stopped doing it. You didn't arrange for anyone else to.`
        }
      ],
      analysis: {
        game: `Repeated bargaining. This isn't about this year. It's about the rule you'll follow for the next twenty.`,
        incentives: `Whoever says yes every year sets the expectation. Mom wants everyone at one table. Nate wants the easiest path, and he may have a reason you don't know about.`,
        leverage: `The record, in Mom's handwriting, and Mom herself.`,
        missing: `How lopsided it had become, and whether Nate had a reason. Both were in Mom's kitchen.`,
        assumptions: `That fair means this year, rather than across years. That Nate's "it's easier" meant he didn't care.`,
        controlled: `Whether you made it a rule, a favor, or an order.`,
        couldnt: `What was happening in Nate's house.`,
        concept: { thinker: 'aumann', term: `Repeated bargaining`, name: `Fair across years, not just this one`, body: `When you'll deal with someone again and again, the best deals are fair across rounds: turns, swaps, a favor now for a favor later. One-sided rounds are fine, as long as they balance.` },
        second: { thinker: 'schelling', term: `Commitment device`, name: `Write down the next turn`, body: `A promise about next year is easy to forget. A promise on Mom's calendar is hard to. Make the future turn visible to someone who'll remember it.` },
        better: `D if you knew about the surgery, B if you didn't. Either way, put next year on the calendar.`,
        lesson: `In families, the deal isn't this year. It's the rule you set for every year after.`
      }
    },

    // ───────────── The Parents' House: Dad fell, and Mom can't do it alone
    {
      id: 'the-parents-house',
      share: 'nate',
      level: `Fair division`,
      arena: `Family`,
      title: `The Parents' House`,
      lens: ['nalebuff', 'nash'],
      setting: `Mom's kitchen · Saturday, 10:00 am · Three weeks after Dad's fall`,
      types: [
        { id: 'stretched', p: 0.5, who: `Nate`, label: `Nate was already doing a lot`, tell: `He'd been coming by three evenings a week since the fall, on top of everything at home. He hadn't said so because he didn't want it to sound like keeping score.` },
        { id: 'coasting', p: 0.5, who: `Nate`, label: `Nate was doing very little`, tell: `He'd come by twice since the fall. He means well. He just assumes someone else has it covered.` }
      ],
      cast: [
        { name: `Mom`, role: `Your mother`, archetype: `The Peacekeeper`, power: `It's her house`, note: `Exhausted, and won't say so.` },
        { name: `Nate`, role: `Your brother`, archetype: `The Comfortable One`, power: `Twenty minutes away`, note: `His name is on the calendar more, or less, than you think.` }
      ],
      known: [`Dad fell three weeks ago. He's home, but needs help most days.`, `A part-time aide costs $1,400 a month.`, `You live two hours away and earn more. Nate lives twenty minutes away.`, `Dad doesn't want to leave the house.`],
      unknown: [`How much Dad's pension covers.`, `What Nate has already been doing.`, `What a fair split would even look like.`],
      clues: [
        { label: `Read the papers on the table`, text: `Dad's pension covers $600 of the aide. The gap is $800 a month.` },
        { label: `Look at the calendar on the fridge`, text: c => stretched(c) ? `Since the fall, Mom has written NATE on twelve evenings. Your name is on two Saturdays.` : `Since the fall, NATE appears twice. Your name is on two Saturdays. Mom's handwriting is on everything else.` },
        { label: `Ask Dad what he wants`, text: `"Not to be a burden. And not to leave this house. In that order, most days."` }
      ],
      question: `What do you propose?`,
      options: [
        {
          key: 'A', text: `"Let's split everything fifty-fifty. We each pay half the aide, and we alternate weekends."`,
          their: c => stretched(c) ? `Fifty-fifty sounds fair. It ignored the twelve evenings Nate had already given, and the two hours you'd drive each weekend.` : `Equal split, unequal costs. Nate's weekends cost him twenty minutes. Yours cost you four hours of driving.`,
          q: c => has(c, 0, 1) ? 1 : 2, s: { coo: 1, jdg: -1, str: -1 }, rel: { nate: c => stretched(c) ? -1 : 0 },
          outcomes: [
            { p: c => stretched(c) ? 0.3 : 0.5, tone: 'mixed', text: c => stretched(c) ? `Nate agrees, tired. He keeps doing his three evenings too. By spring he's burned out.` : `It works, mostly. You drive four hours every other weekend. Nate drives forty minutes.` },
            { p: c => stretched(c) ? 0.7 : 0.5, tone: 'bad', text: c => stretched(c) ? `Nate says, quietly, "I'm already here three nights a week." Mom looks away. Nobody knew how to say it.` : `By month three, the weekends slip. Mom fills the gaps, and doesn't mention it.` }
          ],
          later: `Equal isn't fair when what each of you can give is so different.`
        },
        {
          key: 'B', text: `"Maybe it's time to look at assisted living near me. Then I could be there for him more."`,
          their: `Dad asked for two things: not to be a burden, and not to leave the house. This solved the first by ignoring the second.`,
          q: c => has(c, 2) ? 0 : 1, s: { str: 1, coo: -2, com: -1 }, rel: { nate: -1 },
          outcomes: [
            { p: 0.7, tone: 'bad', text: `Dad goes very quiet. "I'm not ready." Mom looks at you like you've taken a side.` },
            { p: 0.3, tone: 'mixed', text: `Mom says, "Let's keep it in mind." It hangs over every visit after that.` }
          ],
          later: `A solution that worked for everyone except the person it was for.`
        },
        {
          key: 'C', text: c => stretched(c) ? `"The calendar says you've been here twelve evenings. I'll cover the whole $800, and take every other Saturday."` : `"I'll cover the aide, and you handle the visits. Does that work?"`,
          needs: c => stretched(c) ? [1] : [-1], vague: { text: `"I'll cover the aide, and you handle the visits. Does that work?"`, q: c => stretched(c) ? 3 : 2 },
          their: c => stretched(c) ? `You saw what Nate had already given and matched it in the currency you have. Nobody had to keep score out loud.` : `A clean trade, if both sides keep it. Nate agreed to visits he wasn't making, and nothing would show if he stopped.`,
          q: 4, s: { coo: 2, com: 2, lng: 2, inf: 1 }, rel: { nate: 1 },
          outcomes: [
            { p: c => stretched(c) ? 0.9 : 0.35, tone: c => stretched(c) ? 'good' : 'mixed', text: c => stretched(c) ? `Nate is quiet for a moment. "You noticed." It works for a year, and it's the closest you've been in a while.` : `Nate agrees. He visits for a month, then less. Mom doesn't complain.` },
            { p: c => stretched(c) ? 0.1 : 0.65, tone: 'mixed', text: c => stretched(c) ? `It works. The Saturdays are hard on you, but you're glad you're there.` : `By spring Nate is "swamped," and Mom is doing most of it again, with an aide you pay for.` }
          ],
          later: `A trade that works only if both halves are kept. You can see one half on a bank statement. The other, only on Mom's calendar.`
        },
        {
          key: 'D', text: `"You've been here twice since the fall, Nate. You're twenty minutes away. You need to step up."`,
          needs: c => stretched(c) ? [-1] : [1], vague: { text: `"You're twenty minutes away, Nate. You need to be doing more of this."` },
          their: c => stretched(c) ? `Nate had been there twelve evenings. You didn't look, and the accusation landed on the person doing the most.` : `True. And now the conversation is about blame instead of a plan, in front of your parents.`,
          q: c => stretched(c) ? 0 : 2, s: { bnd: 2, com: -2, coo: -2, lng: -2 }, rel: { nate: -2 },
          outcomes: [
            { p: c => stretched(c) ? 0.8 : 0.5, tone: 'bad', text: c => stretched(c) ? `Nate stands up. "Twelve nights. Look at the calendar." Dad says, "Please don't fight over me."` : `Nate gets defensive, then quiet. He visits more for a few weeks, mostly to avoid you.` },
            { p: c => stretched(c) ? 0.2 : 0.5, tone: 'mixed', text: c => stretched(c) ? `Nate says nothing and leaves early. Mom calls you that night, upset.` : `Nate says, "Fine," and agrees to two nights a week. Dad looks at the table the whole time.` }
          ],
          later: `Blame gets a reaction. It rarely gets a plan.`
        },
        {
          key: 'E', text: `"The gap is $800 a month. I'll cover $600 of it, and you take the weekday check-ins, since you're twenty minutes away."`,
          needs: [0], vague: {
            text: `"I'll pay more of the aide, and you do more of the visits, since you're close. Can we work out the numbers?"`, q: 3,
            their: `The right trade: money from whoever has more of it, time from whoever is closer. Without the numbers, "more" stayed vague, and vague arrangements drift.`,
            later: `A good trade that needed numbers to hold.`,
            outcomes: [
              { p: c => stretched(c) ? 0.6 : 0.4, tone: c => stretched(c) ? 'good' : 'mixed', text: c => stretched(c) ? `Nate nods. "That's fair." The details take two weeks of texts, but they settle.` : `Nate agrees in principle. "More visits" turns out to mean one a week.` },
              { p: c => stretched(c) ? 0.4 : 0.6, tone: 'mixed', text: c => stretched(c) ? `It works, but nobody wrote down what "more" meant, and it shifts.` : `The money's clear. The visits aren't. Mom fills in.` }
            ]
          },
          their: c => stretched(c) ? `Money from the one who has more of it, time from the one who's close. Nate was already giving the time. Now it counted.` : `A clear trade, with numbers. Nate knew exactly what his side was, and that made it hard to drift.`,
          q: 4, s: { str: 2, jdg: 2, com: 2, lng: 2 }, rel: { nate: 1 },
          outcomes: [
            { p: c => stretched(c) ? 0.85 : 0.65, tone: 'good', text: c => stretched(c) ? `Nate's shoulders drop. "I've basically been doing that. It helps to hear it." Mom writes the plan on the fridge.` : `Nate takes Monday, Wednesday and Friday. It's on the fridge, and Mom checks it.` },
            { p: c => stretched(c) ? 0.15 : 0.35, tone: 'mixed', text: c => stretched(c) ? `Nate offers to cover $100 too. You let him. It works.` : `The visits slip by month two. You point at the fridge, gently, and they pick up again.` }
          ],
          later: `You split by what each of you could give, not by halves. That's fair division.`
        }
      ],
      analysis: {
        game: `Fair division of unequal resources. You have more money. Nate has more time and proximity. Dad has preferences. An equal split of unequal things isn't fair to anyone.`,
        incentives: `Each sibling wants to do their part without feeling taken advantage of. Mom wants nobody fighting. Dad wants to stay home and not be a burden.`,
        leverage: `Each of you has something the other doesn't. That's what makes a trade possible.`,
        missing: `The pension, the gap, and what Nate had already been doing. It was all in Mom's kitchen.`,
        assumptions: `That fair means half. That Nate wasn't doing much, or was.`,
        controlled: `What you offered, and whether it matched what each of you could actually give.`,
        couldnt: `How Dad's health goes from here.`,
        concept: { thinker: 'nalebuff', term: `Fair division`, name: `Divide by what each person can give`, body: `When people bring different things, money, time, closeness, a fair split trades them rather than halving each one. Each gives what costs them least.` },
        second: { thinker: 'nash', term: `Nash bargaining solution`, name: `Share the gains from cooperating`, body: `Nash showed that a fair bargain splits the gains from working together, measured against what each person would face alone. Without the trade, you both drive more, pay more, and fight more.` },
        better: `E with the numbers from the papers. If the calendar shows Nate already doing the evenings, C.`,
        lesson: `Fair isn't half. It's each person giving what costs them least, and everyone seeing it.`
      }
    }
  ];
  PP.scenarios.push(...SCENARIOS);

  // ─────────────────────────────────────────── Staging
  Object.assign(PP.scenes, {
    'the-rental': {
      env: 'cabin',
      cast: [
        { id: 'omar', spot: 'omar', mood: 'happy', pose: 'pocket', wants: `A great weekend, and the suite for him and Talia.` },
        { id: 'jess', spot: 'jess', mood: 'smile', pose: 'phone', wants: `Everyone happy, and nobody keeping score.` },
        { id: 'lena', spot: 'lena', mood: 'neutral', pose: 'mug', wants: `To come on the trip without anyone knowing money is tight.` }
      ],
      intro: [
        { cam: 'wide', caption: `The lake cabin. Six friends, three bedrooms, one long weekend. You booked it on your card: $2,400.` },
        { who: 'omar', mood: 'happy', act: 'jump', say: `This place is unreal. Talia and I will grab the big room, yeah?` },
        { who: 'jess', mood: 'smile', pose: 'phone', say: `So how are we splitting it? Just even?` },
        { cam: 'list', caption: `On the table: the listing, printed out. A suite, a queen room, and a bunk room with a curtain for a door.` },
        { who: 'lena', mood: 'awkward', pose: 'mug', caption: `Lena looks at the bunk room and says nothing.` },
        { you: `(It's my card. I get to set the rules. Which rules?)` }
      ],
      options: {
        A: { line: `Nine sixty for the suite, eight hundred for the queen, six forty for the bunks. Then everyone picks.`, vague: { line: `A bit more for the big room, a bit less for the bunks. Then everyone picks.` }, preview: `Prices match the rooms. Takes a minute of math, and someone may haggle.`, row: 0, outcomes: [{ beats: [{ who: 'omar', mood: 'smile', act: 'nod', say: `Fair. Suite's still ours.` }, { who: 'lena', mood: 'happy', say: `Bunks for three twenty? Sold.` }] }, { beats: [{ who: 'omar', mood: 'thinking', say: `Hm. Okay. That's fair.` }] }] },
        B: { line: `Let's bid for rooms. Highest offer gets the suite, and the rest of us split what's left.`, preview: `Rooms go to whoever values them most. Turns friends into bidders.`, row: 2, outcomes: [{ beats: [{ who: 'omar', mood: 'confident', say: `Eleven hundred for the suite.` }, { who: 'lena', mood: 'awkward', pose: 'mug' }] }, { beats: [{ who: 'jess', mood: 'happy', say: `Twelve hundred!` }, { who: 'omar', mood: 'skeptical', say: `Twelve fifty. Wait, are we serious?` }] }] },
        C: { line: `Keep it simple. Four hundred each, and rooms go first come, first served.`, preview: `Simple and quick. Whoever picks first gets the best room at the same price.`, row: 1, outcomes: [{ beats: [{ who: 'omar', mood: 'happy', act: 'nod', say: `Perfect. Suite's ours.` }, { who: 'lena', mood: 'awkward', act: 'glance' }] }, { beats: [{ who: 'omar', mood: 'happy', say: `Suite's ours!` }, { who: 'jess', mood: 'skeptical', act: 'glance', say: `Must be nice.` }] }] },
        D: { line: `Last year took three weeks to collect. Four hundred each, and everyone pays before I confirm.`, vague: { line: `Four hundred each, and everyone pays before I confirm. Simplest that way.` }, preview: `Nobody has to chase anyone. The rooms are still unequal.`, row: 1, outcomes: [{ beats: [{ who: 'omar', mood: 'neutral', pose: 'phone', say: `Sending now.` }] }, { beats: [{ who: 'jess', mood: 'skeptical', say: `Very corporate. Fine.` }] }] },
        E: { caption: `You post in the group chat: "Some of us were three weeks late last year. Pay by Friday or lose your spot."`, vague: { caption: `You post in the group chat: "Pay by Friday or lose your spot. I'm not chasing anyone this year."` }, preview: `Nobody will be late. Everyone will have read it.`, row: 2, outcomes: [{ beats: [{ who: 'omar', mood: 'frustrated', pose: 'phone' }, { who: 'jess', mood: 'surprised', act: 'glance' }] }, { beats: [{ who: 'omar', mood: 'skeptical', pose: 'phone', say: `Who's late?` }, { who: 'lena', mood: 'awkward', pose: 'mug' }] }] }
      },
      matrix: {
        you: `You`, them: `Omar`, byType: true,
        rows: [`Price the rooms first`, `Even split or first come`, `Auction or call-out`],
        cols: [`Square`, `Takes what the rules allow`],
        cells: [[[3, 3], [3, 2]], [[1, 3], [0, 4]], [[1, 2], [1, 1]]],
        best: [0, 0],
        note: `The first number is how the group comes out; the second is how Omar does. Pricing the rooms works whoever Omar is. An even split is fine with a square Omar and a gift to the other kind.`
      },
      leverage: { you: [`You booked it, so you set the rules`, `The floor plan`, `Last year's payment history`], them: [`Everyone likes Omar`, `Nobody wants to talk about money`, `"Just even" sounds fair`], tilt: -2 },
      links: [['omar', 'jess', 'old friends'], ['jess', 'lena', 'roommates once']]
    },

    'the-bill': {
      env: 'restaurant',
      cast: [
        { id: 'jess', spot: 'jess', mood: 'smile', pose: 'down', wants: `A nice last night, without anyone keeping score.` },
        { id: 'omar', spot: 'omar', mood: 'happy', pose: 'gesture', wants: `A great night out, and an easy split.` },
        { id: 'lena', spot: 'lena', mood: 'neutral', pose: 'phone', wants: `To pay for what she ate without anyone noticing.` }
      ],
      intro: [
        { cam: 'wide', caption: `Harbor Street Bistro. The last night of the trip. The bill arrives in a little leather folder.` },
        { who: 'omar', mood: 'happy', pose: 'gesture', say: `Best trip ever. Seriously.` },
        { cam: 'bill', caption: `Six hundred and twelve dollars, with tip. The server waits with the card machine.` },
        { who: 'omar', mood: 'smile', say: `Easiest thing is to just split it, right?`, if: c => c.type === 'taker' },
        { who: 'jess', mood: 'smile', say: `Should we just split it?`, if: c => c.type !== 'taker' },
        { cam: 'lobster', caption: `The lobster shell is still on Omar's plate. The champagne bottle is empty.` },
        { who: 'lena', mood: 'awkward', pose: 'phone', caption: `Lena is looking at her phone under the table.` }
      ],
      options: {
        A: { line: `Easiest thing is to split it six ways. A hundred and two each, and we can all get going?`, preview: `Quick and painless. Whoever ordered least pays for whoever ordered most.`, row: 1, outcomes: [{ beats: [{ who: 'omar', mood: 'happy', act: 'nod', say: `Perfect.` }, { who: 'lena', mood: 'sad', pose: 'phone' }] }] },
        B: { line: `Let's each pay for exactly what we ordered. I'll read the bill out, line by line.`, preview: `Exactly fair. Takes a while, and everyone's lines get read aloud.`, row: 0, outcomes: [{ beats: [{ who: 'omar', mood: 'smile', say: `Champagne's mine anyway.` }, { who: 'lena', mood: 'happy', act: 'nod' }] }, { beats: [{ who: 'omar', mood: 'skeptical', pose: 'crossed', say: `Wow, okay. We're doing this.` }] }] },
        C: { caption: `You catch the server's eye, hand over your card for Lena's share, then say: "Split the rest five ways."`, vague: { caption: `You quietly cover a bigger share yourself, so nobody has to have the awkward conversation.` }, preview: `Protects whoever's short, without a scene. Costs you, and the split stays the same.`, row: 1, outcomes: [{ beats: [{ who: 'lena', mood: 'surprised', act: 'glance' }, { who: 'omar', mood: 'happy', act: 'nod' }] }, { beats: [{ who: 'omar', mood: 'smile', say: `Oh, you're buying?` }] }] },
        D: { line: `Split the food six ways, and the champagne goes on whoever ordered it. That's Omar's one-twenty, right?`, vague: { line: `Split the food six ways, and drinks go on whoever ordered them?` }, preview: `Splits what was shared, assigns what wasn't. Someone may push back.`, row: 0, outcomes: [{ beats: [{ who: 'omar', mood: 'smile', act: 'nod', say: `Fair. It was always mine.` }, { who: 'lena', mood: 'happy' }] }, { beats: [{ who: 'omar', mood: 'thinking', say: `It was for the table, but sure.` }] }] },
        E: { line: `Omar, a hundred and twenty for champagne and a sixty-eight dollar lobster. You're covering those, right?`, vague: { line: `Some of us ordered a lot more than others. Shouldn't that count?` }, preview: `Gets Omar to pay. In front of everyone.`, row: 2, outcomes: [{ beats: [{ who: 'omar', mood: 'frustrated', say: `I was always going to.` }, { who: 'jess', mood: 'awkward', act: 'glance' }] }, { beats: [{ who: 'omar', mood: 'skeptical', pose: 'crossed', say: `Didn't realize we were keeping score.` }, { who: 'lena', mood: 'awkward', pose: 'phone' }] }] }
      },
      matrix: {
        you: `You`, them: `Omar`, byType: true,
        rows: [`Split shared, assign the rest`, `Even split or quiet subsidy`, `Call him out`],
        cols: [`Meant to pay`, `Free-rides when he can`],
        cells: [[[3, 3], [3, 2]], [[1, 3], [0, 4]], [[1, 1], [2, 0]]],
        best: [0, 0],
        note: `The first number is how the table comes out; the second is how Omar does. A rule that assigns the bottle works either way. An even split is harmless if Omar meant to pay, and pays him if he didn't.`
      },
      leverage: { you: [`The itemized bill`, `Saying a rule out loud`, `Jess, who knows the history`], them: [`Nobody wants to talk about money`, `"It was for the table"`, `The server is waiting`], tilt: -1 },
      links: [['omar', 'jess', 'old friends'], ['jess', 'lena', 'roommates once']]
    },

    'the-date': {
      env: 'openhouse',
      cast: [{ id: 'lena', spot: 'rosa', mood: 'neutral', pose: 'phone', wants: `For someone to just pick a date.` }],
      intro: [
        { cam: 'wide', caption: `Your new place, still half unpacked. Lena came over to help plan Jess's fortieth.` },
        { who: 'lena', mood: 'frustrated', pose: 'phone', say: `Sixty-one messages. No date. Someone just wrote "whatever works!" again.` },
        { who: 'lena', mood: 'neutral', say: `Her birthday's Saturday the fourteenth. People keep floating the seventh and the twenty-first too.` },
        { who: 'lena', mood: 'thinking', pose: 'phone', say: `I feel like someone said they were busy one of those weekends. I can't find it now.`, if: c => c.type === 'clash' },
        { you: `(Twelve people, three weekends, and nobody wants to go first.)` }
      ],
      options: {
        A: { line: `New poll: the seventh, fourteenth or twenty-first. Everyone please vote by Friday so we can book something.`, preview: `Everyone gets a say. Depends on people voting this time.`, row: 2, outcomes: [{ beats: [{ who: 'lena', mood: 'skeptical', pose: 'phone', say: `Seven votes. Three, two, two.` }] }, { beats: [{ who: 'lena', mood: 'neutral', act: 'nod', say: `Okay, that's something.` }] }] },
        B: { line: `Six of you already said the fourteenth, her actual birthday. I'm booking it unless someone has a real conflict.`, vague: { line: `Let's do the fourteenth, her actual birthday. I'm booking it unless someone has a real conflict.` }, preview: `Gives everyone the obvious answer. Only works if it actually works.`, row: 0, outcomes: [{ beats: [{ who: 'lena', mood: 'happy', pose: 'phone', say: `Thumbs up, thumbs up, thumbs up. Finally.` }] }, { beats: [{ who: 'lena', mood: 'awkward', pose: 'phone', say: `Oh no. Mina's wedding.` }] }] },
        C: { caption: `You call the five people who always come, agree on a date with them, then post it as done.`, preview: `Fast, because everyone follows the core group. Someone may feel left out.`, row: 0, outcomes: [{ beats: [{ who: 'lena', mood: 'happy', act: 'nod', say: `And everyone's following. Nice.` }] }, { beats: [{ who: 'lena', mood: 'awkward', say: `Tasha's asking why she didn't get a call.` }] }] },
        D: { caption: `You message Jess privately: "It's your birthday. You pick, and I'll make it happen."`, preview: `Gives the choice to the person it's for. Puts her on the spot.`, row: 1, outcomes: [{ beats: [{ who: 'lena', mood: 'skeptical', say: `Let me guess. "Whatever works."` }] }, { beats: [{ who: 'lena', mood: 'awkward', pose: 'phone' }] }] },
        E: { line: `The fourteenth is Mina and Dev's wedding, and Jess wants everyone there. The twenty-first it is. Booking Friday.`, vague: { line: `Let's do the twenty-first, so nobody's stuck choosing. Booking Friday unless someone objects.` }, preview: `A firm date with a reason. Skips the birthday itself.`, row: 0, outcomes: [{ beats: [{ who: 'lena', mood: 'happy', act: 'nod', say: `Twelve yeses. You're a genius.` }] }, { beats: [{ who: 'lena', mood: 'thinking', pose: 'phone', say: `A couple of people are asking why not her birthday.` }] }] }
      },
      matrix: {
        you: `You`, them: `The group`, byType: true,
        rows: [`Name a date, with a reason`, `Ask Jess to pick`, `Another poll`],
        cols: [`Birthday is clear`, `Birthday has a clash`],
        cells: [[[3, 3], [3, 3]], [[1, 1], [0, 1]], [[1, 2], [1, 2]]],
        best: [0, 0],
        note: `Both numbers are how the group comes out, then Jess. Naming a date with a reason works in either column, as long as you checked which column you were in. Polls and asking Jess just hand the waiting back to everyone.`
      },
      leverage: { you: [`You're the organizer`, `The chat history`, `A firm message`], them: [`Twelve calendars`, `"Whatever works"`, `Nobody wants to go first`], tilt: -2 },
      links: []
    },

    'the-loan': {
      env: 'openhouse',
      cast: [{ id: 'omar', spot: 'rosa', mood: 'awkward', pose: 'pocket', wants: `$1,500 until the first, and the friendship intact.` }],
      intro: [
        { cam: 'wide', caption: `Your place. Omar dropped by "to say hi." He's been here twenty minutes and hasn't sat down.` },
        { who: 'omar', mood: 'awkward', pose: 'pocket', say: `So. This is awkward. Could I borrow fifteen hundred? Just until the first.` },
        { who: 'omar', mood: 'nervous', say: `The car died. Transmission. I hate asking.`, if: c => c.type === 'square' },
        { who: 'omar', mood: 'smile', say: `You're the only one I'd ask, honestly.`, if: c => c.type === 'taker' },
        { you: `(Two years ago I lent him eight hundred. Did that ever come back?)` }
      ],
      options: {
        A: { line: c => c.type === 'taker' ? `You still owe me three hundred from last time. Pay that back first, then we'll talk about the rest.` : `You paid me back last time, so yes. Let's do five hundred on the first of each month.`, vague: { line: `I can help, if we set up a plan to pay it back. Five hundred on the first of each month?` }, preview: `Help with a structure. He may not like terms between friends.`, row: 0, outcomes: [{ beats: [{ who: 'omar', mood: 'smile', act: 'nod', say: `Deal. Thank you. Really.` }] }, { beats: [{ who: 'omar', mood: 'thinking', say: `Yeah. I'll sort it out.` }] }] },
        B: { line: `I'm sorry, I can't lend money right now. I hope you understand.`, preview: `Protects your money and your trip. He may just ask someone else.`, row: 2, outcomes: [{ beats: [{ who: 'omar', mood: 'awkward', act: 'nod', say: `Totally. No worries.` }] }, { beats: [{ who: 'omar', mood: 'sad', pose: 'pocket' }] }] },
        C: { line: `Of course. I'll send it tonight. Pay me back whenever you can.`, preview: `Generous and immediate. You may not see it again.`, row: 1, outcomes: [{ beats: [{ who: 'omar', mood: 'happy', act: 'nod', say: `You're a lifesaver.` }] }, { beats: [{ who: 'omar', mood: 'happy', say: `I owe you. Big time.` }] }] },
        D: { line: `I can't do fifteen hundred. Here's five hundred, and you don't need to pay it back.`, vague: { line: `I can't do the whole thing. Here's some, and don't worry about paying it back.` }, preview: `Helps without a debt. Less than he asked for.`, row: 0, outcomes: [{ beats: [{ who: 'omar', mood: 'surprised', say: `You don't have to do that.` }, { who: 'omar', mood: 'smile', act: 'nod', say: `Thank you.` }] }, { beats: [{ who: 'omar', mood: 'smile', act: 'nod', say: `Thanks. That helps.` }] }] },
        E: { line: c => c.type === 'taker' ? `Jess says you asked her for a thousand last month. How many of us are you working through?` : `Before I answer: have you asked anyone else? Who else knows about this?`, vague: { line: `Before I answer: have you asked anyone else? Who else knows about this?` }, preview: `Gets you the facts first. Can feel like an interrogation.`, row: 2, outcomes: [{ beats: [{ who: 'omar', mood: 'frustrated', pose: 'crossed', say: `Wow. Okay.` }] }, { beats: [{ who: 'omar', mood: 'sad', act: 'sigh' }] }] }
      },
      matrix: {
        you: `You`, them: `Omar`, byType: true,
        rows: [`Mirror his last move, or give what you can lose`, `Lend, no conditions`, `Refuse or interrogate`],
        cols: [`Good for it`, `Working down a list`],
        cells: [[[3, 3], [3, 1]], [[3, 3], [0, 3]], [[1, 1], [2, 0]]],
        best: [0, 0],
        note: `The first number is how you come out; the second is Omar. Mirroring what he did last time does well in both columns, and so does giving only what you can afford to lose. Lending freely is perfect with one Omar and expensive with the other.`
      },
      leverage: { you: [`Your payment history with him`, `Fifteen years of friendship`, `The amount you can afford to lose`], them: [`Fifteen years of friendship`, `"You're the only one I'd ask"`, `How awkward a no would be`], tilt: -2 },
      links: []
    },

    'the-holidays': {
      env: 'family',
      cast: [
        { id: 'carol', spot: 'carol', mood: 'smile', pose: 'mug', wants: `Everyone at one table, and nobody upset.` },
        { id: 'nate', spot: 'nate', mood: 'neutral', pose: 'pocket', wants: `The holidays to be easy. For whatever reason.` }
      ],
      intro: [
        { cam: 'wide', caption: `Mom's kitchen. October. Sunday lunch is over, and Mom has a question.` },
        { who: 'carol', mood: 'smile', pose: 'mug', say: `So. Who's doing Thanksgiving this year? And Christmas?` },
        { who: 'nate', mood: 'smile', say: `It's just easier at yours. You've got it down.` },
        { who: 'nate', mood: 'nervous', act: 'glance', caption: `Nate glances at Mom, then at the table.`, if: c => c.type === 'stretched' },
        { cam: 'calendar', caption: `On the fridge, Mom's calendar. She writes every holiday on it.` },
        { you: `(Again?)` }
      ],
      options: {
        A: { line: `It's fine, I'll host both again this year. Honestly, it's easier than arguing about it.`, preview: `Keeps the peace this year. Sets the same expectation next year.`, row: 1, outcomes: [{ beats: [{ who: 'carol', mood: 'happy', act: 'nod', say: `Wonderful.` }, { who: 'nate', mood: 'smile', act: 'nod' }] }] },
        B: { line: `I've hosted the last six. Let's take turns: I'll do Thanksgiving, you take Christmas, and we swap every year.`, vague: { line: `I've done a lot of these. Could we start taking turns? I'll do Thanksgiving, you take Christmas.` }, preview: `A fair rule for every year. He might not be able to take his turn now.`, row: 0, outcomes: [{ beats: [{ who: 'nate', mood: 'thinking', act: 'glance', say: `Huh. Six. Okay.` }, { who: 'carol', mood: 'smile', act: 'nod' }] }, { beats: [{ who: 'nate', mood: 'awkward', say: `Yeah. Let me see.` }] }] },
        C: { line: `Six in a row, Nate. It's right there on the fridge. You're hosting both this year.`, vague: { line: `I've done enough of these. You're hosting both this year.` }, preview: `Settles it today. As an order, in front of Mom.`, row: 2, outcomes: [{ beats: [{ who: 'nate', mood: 'frustrated', say: `You don't know what's going on with us.` }, { who: 'carol', mood: 'sad' }] }, { beats: [{ who: 'nate', mood: 'frustrated', pose: 'crossed', say: `Fine.` }] }] },
        D: { line: c => c.type === 'coasting' ? `I'll host both this year if you take both next year. Mom, can you write that on the calendar?` : `Mom told me about Ana's surgery. I'll host both this year, you take both next year, and Mom writes it down.`, vague: { line: `I'll host both this year if you take both next year. Mom, can you write that on the calendar?` }, preview: `You carry this year in exchange for next. Depends on next year happening.`, row: 0, outcomes: [{ beats: [{ who: 'nate', mood: 'happy', act: 'nod', say: `Deal. Thank you.` }, { who: 'carol', mood: 'happy', pose: 'mug' }] }, { beats: [{ who: 'nate', mood: 'smile', act: 'nod', say: `Next year. Promise.` }] }] },
        E: { line: `I'm not hosting anything this year. Whoever wants Thanksgiving or Christmas can take it.`, preview: `Ends the pattern. Doesn't say what replaces it.`, row: 2, outcomes: [{ beats: [{ who: 'carol', mood: 'sad', pose: 'mug' }, { who: 'nate', mood: 'awkward', act: 'glance' }] }, { beats: [{ who: 'nate', mood: 'thinking', say: `I guess I could do Christmas.` }] }] }
      },
      matrix: {
        you: `You`, them: `Nate`, byType: true,
        rows: [`Take turns, in writing`, `Host again`, `Order him or opt out`],
        cols: [`Stretched thin`, `Coasting`],
        cells: [[[3, 3], [3, 2]], [[1, 3], [0, 3]], [[0, 0], [2, 1]]],
        best: [0, 0],
        note: `The first number is how you come out; the second is Nate. A written turn-taking deal works whichever Nate you have. An order only works with the coasting one, and it's devastating with the other.`
      },
      leverage: { you: [`Mom's calendar`, `Six holidays in a row`, `Mom wants it fair`], them: [`"It's easier at yours"`, `Whatever he hasn't told you`, `Nobody wants a scene at Mom's`], tilt: 0 },
      links: [['carol', 'nate', 'worries about']]
    },

    'the-parents-house': {
      env: 'family',
      cast: [
        { id: 'carol', spot: 'carol', mood: 'sad', pose: 'mug', wants: `Help, without anyone fighting about it.` },
        { id: 'nate', spot: 'nate', mood: 'neutral', pose: 'crossed', wants: `To do his part, and have it count.` }
      ],
      intro: [
        { cam: 'wide', caption: `Mom's kitchen. Three weeks after Dad's fall. He's in the next room, watching the game with the volume up.` },
        { who: 'carol', mood: 'sad', pose: 'mug', say: `I can't do this by myself much longer. The aide is fourteen hundred a month.` },
        { who: 'nate', mood: 'neutral', say: `We'll figure it out. What are you thinking?` },
        { who: 'nate', mood: 'sad', act: 'sigh', caption: `Nate looks exhausted.`, if: c => c.type === 'stretched' },
        { cam: 'papers', caption: `On the table: Dad's pension statement, and the agency's quote.` },
        { you: `(I'm two hours away. He's twenty minutes. What's fair?)` }
      ],
      options: {
        A: { line: `Let's split everything fifty-fifty. We each pay half the aide, and we alternate weekends.`, preview: `Simple and even. Ignores who's closer and who earns more.`, row: 1, outcomes: [{ beats: [{ who: 'nate', mood: 'neutral', act: 'nod', say: `Okay.` }] }, { beats: [{ who: 'nate', mood: 'sad', say: `I'm already here three nights a week.` }, { who: 'carol', mood: 'awkward' }] }] },
        B: { line: `Maybe it's time to look at assisted living near me. Then I could be there for him more.`, preview: `Closer to you, and to round-the-clock care. A big change for Dad.`, row: 2, outcomes: [{ beats: [{ who: 'carol', mood: 'surprised' }, { who: 'nate', mood: 'skeptical', act: 'glance' }] }, { beats: [{ who: 'carol', mood: 'thinking', say: `Let's keep it in mind.` }] }] },
        C: { line: c => c.type === 'coasting' ? `I'll cover the aide, and you handle the visits. Does that work?` : `The calendar says you've been here twelve evenings. I'll cover the whole eight hundred, and take every other Saturday.`, vague: { line: `I'll cover the aide, and you handle the visits. Does that work?` }, preview: `A clean swap of money for time. Only one half is easy to check.`, row: 0, outcomes: [{ beats: [{ who: 'nate', mood: 'surprised', say: `You noticed.` }, { who: 'carol', mood: 'happy', act: 'nod' }] }, { beats: [{ who: 'nate', mood: 'smile', act: 'nod', say: `Yeah. I can do that.` }] }] },
        D: { line: `You've been here twice since the fall, Nate. You're twenty minutes away. You need to step up.`, vague: { line: `You're twenty minutes away, Nate. You need to be doing more of this.` }, preview: `Puts the imbalance on the table. Puts Nate on the spot.`, row: 2, outcomes: [{ beats: [{ who: 'nate', mood: 'frustrated', pose: 'crossed', say: `Look at the calendar.` }, { who: 'carol', mood: 'sad' }] }, { beats: [{ who: 'nate', mood: 'frustrated', say: `Fine.` }] }] },
        E: { line: `The gap is eight hundred a month. I'll cover six hundred, and you take the weekday check-ins, since you're close.`, vague: { line: `I'll pay more of the aide, and you do more of the visits, since you're close. Can we work out the numbers?` }, preview: `Plays to who has money and who has time. Needs both halves kept.`, row: 0, outcomes: [{ beats: [{ who: 'nate', mood: 'smile', act: 'nod', say: `That's fair. That works.` }, { who: 'carol', mood: 'smile', pose: 'mug' }] }, { beats: [{ who: 'nate', mood: 'thinking', say: `Let me look at my weeks.` }] }] }
      },
      matrix: {
        you: `You`, them: `Nate`, byType: true,
        rows: [`Trade money for time, with numbers`, `Split it fifty-fifty`, `Blame, or move Dad`],
        cols: [`Already doing a lot`, `Doing very little`],
        cells: [[[3, 3], [3, 2]], [[1, 0], [2, 2]], [[0, 0], [1, 1]]],
        best: [0, 0],
        note: `The first number is how your family comes out; the second is Nate. A trade with numbers works with either Nate. Fifty-fifty is tolerable with the coasting one and unfair to the one already carrying it.`
      },
      leverage: { you: [`You earn more`, `The pension statement`, `Mom's calendar`], them: [`He's twenty minutes away`, `What he's already done`, `Mom doesn't want a fight`], tilt: 0 },
      links: [['carol', 'nate', 'leans on']]
    }
  });

  // ─────────────────────────────────────────── What each move pursues, and what they'd say about you
  Object.assign(PP.insight.scenes, {
    'the-rental': { options: {
      A: { buys: ['fair', 'info', 'future'], verdict: { who: 'lena', line: `Priced the rooms before anyone picked. Nobody had to feel weird.` } },
      B: { buys: ['win', 'fair'], verdict: { who: 'lena', line: `Ran an auction on a friends' weekend. I just sat that part out.` } },
      C: { buys: ['calm', 'time'], verdict: { who: 'lena', line: `Kept it simple. I paid the same as Omar for a curtain.` } },
      D: { buys: ['fair', 'time'], verdict: { who: 'omar', line: `Made everyone pay first. Bit strict. Fair, I guess.` } },
      E: { buys: ['right', 'win'], verdict: { who: 'omar', line: `Called people out in the group chat. Everybody saw.` } }
    } },
    'the-bill': { options: {
      A: { buys: ['calm', 'time'], verdict: { who: 'lena', line: `Split it even. I paid a hundred and two for a salad.` } },
      B: { buys: ['fair', 'right'], verdict: { who: 'omar', line: `Read the whole bill out loud. Fair, but long.` } },
      C: { buys: ['liked', 'calm'], verdict: { who: 'lena', line: `Quietly covered me. I'll never forget it. Omar never noticed.` } },
      D: { buys: ['fair', 'future', 'calm'], verdict: { who: 'lena', line: `Fixed it in one sentence, and nobody got embarrassed.` } },
      E: { buys: ['right', 'win'], verdict: { who: 'omar', line: `Called me out in front of everyone over a bottle of champagne.` } }
    } },
    'the-date': { options: {
      A: { buys: ['fair', 'calm'], verdict: { who: 'lena', line: `Another poll. I love them, but we needed a date.` } },
      B: { buys: ['win', 'time'], verdict: { who: 'lena', line: `Just picked the obvious one and booked it.` } },
      C: { buys: ['win', 'time'], verdict: { who: 'lena', line: `Rounded up the core group first. Fast. A little cliquey.` } },
      D: { buys: ['liked', 'calm'], verdict: { who: 'lena', line: `Asked Jess to choose. She hated that.` } },
      E: { buys: ['info', 'fair', 'future'], verdict: { who: 'lena', line: `Found the clash, named a date, gave a reason. Done.` } }
    } },
    'the-loan': { options: {
      A: { buys: ['fair', 'future', 'info'], verdict: { who: 'omar', line: `Remembered exactly how the last one went, and was fair about it.` } },
      B: { buys: ['calm', 'time'], verdict: { who: 'omar', line: `Said no, nicely. I didn't ask why.` } },
      C: { buys: ['liked', 'calm'], verdict: { who: 'omar', line: `Said yes before I finished asking. Best friend I have.` } },
      D: { buys: ['fair', 'calm', 'future'], verdict: { who: 'omar', line: `Gave me what they could and told me not to pay it back. Classy.` } },
      E: { buys: ['info', 'right'], verdict: { who: 'omar', line: `Grilled me about who else I'd asked. Felt like a cross-examination.` } }
    } },
    'the-holidays': { options: {
      A: { buys: ['calm', 'liked'], verdict: { who: 'carol', line: `Always says yes. I worry about how tired they get.` } },
      B: { buys: ['fair', 'future', 'right'], verdict: { who: 'carol', line: `Pointed at my calendar and proposed turns. Fair enough.` } },
      C: { buys: ['right', 'win'], verdict: { who: 'carol', line: `Was right about the six. I wish they'd said it differently.` } },
      D: { buys: ['fair', 'future', 'info'], verdict: { who: 'carol', line: `Noticed what Nate couldn't say, and wrote down next year. That's my kid.` } },
      E: { buys: ['time', 'right'], verdict: { who: 'carol', line: `Stepped back. I hosted. My back still hurts.` } }
    } },
    'the-parents-house': { options: {
      A: { buys: ['fair', 'calm'], verdict: { who: 'carol', line: `Split it down the middle. It sounded fair.` } },
      B: { buys: ['time', 'win'], verdict: { who: 'carol', line: `Wanted to move Walt near them. He's not ready.` } },
      C: { buys: ['fair', 'future', 'liked'], verdict: { who: 'nate', line: `Saw what I'd been doing, and matched it. I didn't expect that.` } },
      D: { buys: ['right', 'win'], verdict: { who: 'nate', line: `Told me to step up, in front of Mom and Dad.` } },
      E: { buys: ['fair', 'info', 'future'], verdict: { who: 'carol', line: `Did the math, and asked each of them for what they could give. I can breathe again.` } }
    } }
  });
})();
