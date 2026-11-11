// The Play track's scenes (none right now). An episode file adds them, with their staging, in this format.
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

PP.scenarios = [];
