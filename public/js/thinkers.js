// The Bench: the six thinkers whose ideas frame every move in POWER PLAY.
// Descriptions paraphrase their published ideas; nothing here is a direct quote.
window.PP = window.PP || {};

PP.thinkers = {
  schelling: {
    name: `Thomas Schelling`,
    short: `Schelling`,
    teaches: `to negotiate`,
    field: `Negotiation and leverage`,
    grandfather: true,
    idea: `Most of life is a mixed-motive game: people whose interests partly conflict and partly overlap, influencing each other anyway. Schelling showed how commitments, deadlines, unspoken norms (focal points) and credibility shape what each side can get.`,
    ask: `What does each person expect the other to do, and what would change that expectation?`
  },
  nash: {
    name: `John Nash`,
    short: `Nash`,
    teaches: `to anticipate`,
    field: `Strategic choices and equilibrium`,
    idea: `A good move accounts for everyone else's best response. An equilibrium is an arrangement nobody can improve by changing only their own behavior, which is why it tends to last. Nash also described how bargains split value based on each side's alternatives.`,
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
    idea: `People can compete over how a pie is divided and cooperate to make it bigger, at the same time. Nalebuff's work on co-opetition asks you to look for the version of the deal where both sides are better off before fighting over shares.`,
    ask: `Is there a version of this where we both come out ahead?`
  },
  duke: {
    name: `Annie Duke`,
    short: `Duke`,
    teaches: `to decide without knowing everything`,
    field: `Decisions under uncertainty`,
    idea: `Judge a decision by the information and reasoning behind it, not by how it turned out. Duke calls the habit of grading decisions by their results "resulting." Good decisions can lose and bad ones can win, especially in the short run.`,
    ask: `What would I need to know, and what would it cost to find out?`
  }
};

PP.thinkerOrder = ['schelling', 'nash', 'aumann', 'axelrod', 'nalebuff', 'duke'];

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
