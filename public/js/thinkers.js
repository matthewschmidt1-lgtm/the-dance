// The Bench: the six thinkers whose ideas frame every move in The Dance.
// Descriptions paraphrase their published ideas; nothing here is a direct quote.
window.PP = window.PP || {};

PP.thinkers = {
  schelling: {
    name: `Thomas Schelling`,
    short: `Schelling`,
    teaches: `to negotiate`,
    field: `Negotiation and leverage`,
    grandfather: true,
    idea: `Most of life is a mixed-motive game: people whose interests partly conflict and partly overlap, influencing each other anyway. Schelling showed how commitments, deadlines, focal points (answers that stand out to everyone without discussion) and credibility shape what each side can get.`,
    ask: `What does each person expect the other to do, and what would change that expectation?`
  },
  nash: {
    name: `John Nash`,
    short: `Nash`,
    teaches: `to anticipate`,
    field: `Strategic choices and equilibrium`,
    idea: `A good move accounts for everyone else's best response. An equilibrium is an outcome where no one can do better for themselves by changing only their own move, which is why it tends to hold. It is not always the outcome that is best for everyone. Nash also described how bargains split value based on each side's alternatives.`,
    ask: `If I make this move, what is each other person's best reply?`
  },
  aumann: {
    name: `Robert Aumann`,
    short: `Aumann`,
    teaches: `to think long-term`,
    field: `Repeated relationships`,
    idea: `When the same people meet again and again, cooperation can hold up on its own, because today's behavior is tomorrow's reputation. A one-time interaction and a repeated one are different games, even when they look identical.`,
    ask: `Is this a one-time game, or will I see this person again?`
  },
  axelrod: {
    name: `Robert Axelrod`,
    short: `Axelrod`,
    teaches: `when to cooperate`,
    field: `Cooperation and reciprocity`,
    idea: `In tournaments of repeated games, simple reciprocity did remarkably well: start cooperative, respond to what the other person actually does, forgive quickly, and be easy to read. He called the pull of future meetings the shadow of the future.`,
    ask: `Am I rewarding the behavior I want to see more of?`
  },
  nalebuff: {
    name: `Barry Nalebuff`,
    short: `Nalebuff`,
    teaches: `to find mutual advantage`,
    field: `Competition and collaboration`,
    idea: `People can compete over how a pie is divided and cooperate to make it bigger, at the same time. Nalebuff's work with Adam Brandenburger on co-opetition asks you to look for the version of the deal where both sides are better off before fighting over shares.`,
    ask: `Is there a version of this where we both come out ahead?`
  },
  duke: {
    name: `Annie Duke`,
    short: `Duke`,
    teaches: `to decide without knowing everything`,
    field: `Decisions under uncertainty`,
    idea: `Judge a decision by the information and reasoning behind it, not by how it turned out. Duke calls the habit of grading decisions by their results "resulting." Good decisions can lose and bad ones can win, especially in the short run.`,
    ask: `What would I need to know, and what would it cost to find out?`
  },
  // A practitioner rather than a theorist: the discipline of surviving uncertainty, from a life in markets.
  seykota: {
    name: `Ed Seykota`,
    short: `Seykota`,
    teaches: `to survive long enough to win`,
    field: `Discipline, risk and survival`,
    practitioner: true,
    idea: `Ed Seykota is a pioneering trend-following trader profiled in Jack Schwager's Market Wizards. He built his record on discipline rather than prediction: cut losses, let winners run, keep bets small, follow your rules. Out of the market, his lessons are about surviving uncertainty, reading what people's behavior really rewards, and managing the opponent inside your own head.`,
    ask: `If I'm wrong about this, can I still play tomorrow?`,
    quote: { text: `Win or lose, everybody gets what they want out of the market.`, source: `Ed Seykota, in Market Wizards` },
    steps: [`Find your edge`, `Commit on evidence`, `Cap the downside`, `Let good outcomes run`, `Survive and repeat`],
    // Nine lessons, in order: understand the game and whether to play (1–3), adapt and master
    // yourself (4–5), think past the immediate win (6–7), build lasting advantages and know your limits (8–9).
    lessons: [
      { tag: `01 · Revealed preferences`, name: `Everybody gets what they really want.`,
        body: [`People tell you what they want. Their behavior tells you what they value.`, `Someone may say they want peace but keep an argument alive. They may say they value fairness but take every advantage available. Sometimes the reward isn't money or agreement. It's control, recognition, or simply being right.`, `Watch what people repeatedly choose. That's where their real incentives live.`],
        ask: `What is this person getting from the way they're behaving?`,
        remember: `Don't listen only to what people say they want. Watch what their behavior keeps buying them.` },
      { tag: `02 · Risk of ruin`, name: `Survive first. Everything else comes second.`,
        body: [`You can recover from a bad decision. You can't always recover from a catastrophic one.`, `A deal isn't worth losing your reputation. An argument isn't worth destroying a relationship. A bet isn't worth putting yourself out of the game.`, `The smartest players don't just ask how much they can win. They ask how much they can afford to lose.`],
        ask: `If this goes badly, can I still play tomorrow?`,
        remember: `Never risk your future to improve your present.` },
      { tag: `03 · Selective play`, name: `You don't have to play every hand.`,
        body: [`The world constantly offers you games: arguments, opportunities, provocations, negotiations, competitions.`, `Most aren't worth playing.`, `A good poker player folds more hands than they play. Not because they're afraid, but because they understand that being selective is an advantage.`, `Sometimes the best move is to wait. Sometimes it's to walk away.`],
        ask: `Is this a game I can actually win, and is it worth winning?`,
        remember: `Every time you choose not to play a bad game, you preserve your chips for a better one.` },
      { tag: `04 · Adaptive opponents`, name: `Don't fall in love with your prediction.`,
        body: [`You make a plan. The world responds. Then the world changes again.`, `The mistake is defending your original thinking after the evidence has changed.`, `Seykota followed the market rather than insisting it follow his predictions. Do the same with people. Pay attention to what they actually do. Adjust when reality surprises you.`, `Changing your mind isn't weakness. Refusing to change it can be expensive.`],
        ask: `What has happened that should change my thinking?`,
        remember: `Be loyal to your objective, not to your original plan.` },
      { tag: `05 · Self-control`, name: `The hardest person to manage is yourself.`,
        body: [`You know when to stop. But you want one more chance.`, `You know when you're wrong. But you don't want to admit it.`, `You know the sensible move. But your pride wants something else.`, `Most strategies don't fail because they were poorly designed. They fail because, under pressure, we abandon them.`, `The opponent isn't always across the table. Sometimes it's the voice inside your head.`],
        ask: `Am I making this move because it's smart, or because I need to feel right?`,
        remember: `The person who controls your decisions controls your future. Make sure it's you.` },
      { tag: `06 · Repeated games`, name: `Play as if you'll meet again.`,
        body: [`Most people optimize for the encounter in front of them.`, `But relationships, reputations and opportunities don't reset after every interaction.`, `Today's opponent may be tomorrow's partner. Today's small favor may become tomorrow's opportunity. Today's victory may create tomorrow's enemy.`, `Think beyond the immediate exchange. Leave room for the next one.`],
        ask: `What will this move make possible the next time we meet?`,
        remember: `Don't just win the encounter. Protect the possibility of a better next one.` },
      { tag: `07 · Different scores`, name: `Being right and winning are different things.`,
        body: [`You can win the argument and lose the relationship.`, `You can prove your point and lose the opportunity.`, `You can get the last word and regret the outcome.`, `The world doesn't award points for how brilliantly you defended your position. It rewards what you actually accomplish.`, `Know which score matters before you start playing.`],
        ask: `Am I trying to prove I'm right, or am I trying to get somewhere worthwhile?`,
        remember: `Never sacrifice a meaningful outcome just to win an argument.` },
      { tag: `08 · Compounding`, name: `Small things become big things when repeated.`,
        body: [`Trust compounds. Knowledge compounds. Reputation compounds.`, `So do mistakes, resentment and broken promises.`, `The greatest advantages rarely come from one extraordinary move. They come from ordinary good decisions made consistently over time.`, `Keep your word. Learn something. Treat people well. Make decisions you won't have to undo.`, `What seems small today may become your greatest advantage tomorrow.`],
        ask: `What am I doing today that I would want repeated a thousand times?`,
        remember: `Time magnifies what you repeatedly do. Make sure you're compounding something worth having.` },
      { tag: `09 · Circle of competence`, name: `Know where your knowledge ends.`,
        body: [`Confidence is not competence. Having an opinion isn't having an edge.`, `The smartest players don't need to understand everything. They need to know what they understand well enough to act.`, `Buffett and Munger built an extraordinary advantage by recognizing the boundaries of their knowledge. They didn't try to play every game.`, `Neither should you.`, `Ask questions. Seek better information. Learn from people who know more. And recognize when the smartest move is to stay out.`],
        ask: `Do I actually understand this game, or do I just think I do?`,
        remember: `You don't have to play every game. You have to recognize the ones you have a chance of winning.` }
    ],
    // The philosophy behind all nine.
    takeaway: `The game is longer than you think.`,
    credo: [`Understand what people want.`, `Protect what you cannot afford to lose.`, `Choose your battles.`, `Follow the evidence.`, `Master yourself.`, `Leave room for tomorrow.`, `Know which score matters.`, `Let good decisions compound.`, `And never confuse confidence with understanding.`],
    closing: `The objective isn't to win every game. It's to build a life in which the odds keep working in your favor.`,
    related: `His ideas sit close to John von Neumann on strategy and probability, Nassim Nicholas Taleb on risk of ruin, and Charlie Munger on incentives and bias.`
  }
};

PP.thinkerOrder = ['schelling', 'nash', 'aumann', 'axelrod', 'nalebuff', 'duke', 'seykota'];

// Each thinker's colour comes from nature (lake water, sunset clay, oak, moss, dusk heather, open sky, stone),
// with a line icon for their central idea.
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
Object.assign(PP.thinkers.schelling, { color: '#3e7f86', icon: ico('<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>') });
Object.assign(PP.thinkers.nash, { color: '#c0643e', icon: ico('<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7 2.5 13h5zM19 7l-2.5 6h5z"/><circle cx="12" cy="4" r="1"/>') });
Object.assign(PP.thinkers.aumann, { color: '#96683c', icon: ico('<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M6 21v-4h4"/>') });
Object.assign(PP.thinkers.axelrod, { color: '#6a8550', icon: ico('<path d="M4 8h15l-3.5-3.5"/><path d="M20 16H5l3.5 3.5"/>') });
Object.assign(PP.thinkers.nalebuff, { color: '#86688a', icon: ico('<path d="M11 4a8 8 0 1 0 8 8h-8z"/><path d="M14.5 2.5a7 7 0 0 1 7 7h-7z"/>') });
Object.assign(PP.thinkers.seykota, { color: '#76736a', icon: ico('<path d="M3 18l5-5 4 3 8-9"/><path d="M15 7h5v5"/><path d="M3 21h18"/>') });
Object.assign(PP.thinkers.duke, { color: '#5a85a8', icon: ico('<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/>') });

PP.uiIcons = {
  teaches: ico('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>'),
  ask: ico('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2.9-1.2 1.6v.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>')
};

// The ten measures of strategic intelligence. Getting your way is not one of them.
PP.skills = {
  str: `Strategic thinking`,
  reg: `Emotional self-regulation`,
  inc: `Reading incentives`,
  neg: `Negotiation`,
  com: `Communication`,
  lng: `Long-term thinking`,
  coo: `Cooperation`,
  bnd: `Boundary setting`,
  inf: `Information gathering`,
  jdg: `Judgment under uncertainty`
};

// Chess annotation symbols grade the decision, never the result.
PP.grades = [
  { glyph: `?`,  name: `Mistake`,   note: `This made the position worse for reasons you could have seen.` },
  { glyph: `?!`, name: `Dubious`,   note: `Understandable, but it gave something away.` },
  { glyph: `!?`, name: `Playable`,  note: `A reasonable move with real trade-offs.` },
  { glyph: `!`,  name: `Strong`,    note: `Sound reasoning given what you knew.` },
  { glyph: `!!`, name: `Excellent`, note: `You saw the game beneath the conversation.` }
];
