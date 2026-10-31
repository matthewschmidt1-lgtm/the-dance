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

// Each thinker's accent colour and a line icon for their central idea.
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
Object.assign(PP.thinkers.schelling, { color: '#10b6a4', icon: ico('<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>') });
Object.assign(PP.thinkers.nash, { color: '#ff6e4e', icon: ico('<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7 2.5 13h5zM19 7l-2.5 6h5z"/><circle cx="12" cy="4" r="1"/>') });
Object.assign(PP.thinkers.aumann, { color: '#e9a21c', icon: ico('<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M6 21v-4h4"/>') });
Object.assign(PP.thinkers.axelrod, { color: '#4fa865', icon: ico('<path d="M4 8h15l-3.5-3.5"/><path d="M20 16H5l3.5 3.5"/>') });
Object.assign(PP.thinkers.nalebuff, { color: '#9b6bd1', icon: ico('<path d="M11 4a8 8 0 1 0 8 8h-8z"/><path d="M14.5 2.5a7 7 0 0 1 7 7h-7z"/>') });
Object.assign(PP.thinkers.duke, { color: '#2f95d6', icon: ico('<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/>') });

PP.uiIcons = {
  teaches: ico('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>'),
  ask: ico('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2.9-1.2 1.6v.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>'),
  scenes: ico('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7.5 6l2 4M12.5 6l2 4M17.5 6l2 4"/>')
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
