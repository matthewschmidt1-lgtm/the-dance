# The Dance

**The everyday game of human behavior, strategy & influence.**

> You don't have to be the most powerful person in the room. You have to understand the dynamics of the room well enough to make good decisions.

The Dance is a playable, animated episode of everyday situations. You watch a scene unfold in a grocery store, an office or your street, choose what to do, and watch the people in the room react. Then the game shows what was happening underneath: who wanted what, where the leverage was, what you couldn't know, and which idea from game theory was at work.

The aim is to see the game without becoming the game. Manipulation is never rewarded.

## Episode 1: Ordinary Life

Three places, six scenes. Characters remember you across scenes.

| # | Scene | Place | Main lens |
|---|---|---|---|
| 1 | The Wrong Price | The Grocery Store | Annie Duke |
| 2 | Just This Once | The Office | Robert Axelrod |
| 3 | The Spot | The Neighborhood | Thomas Schelling |
| 4 | The Credit Taker | The Office | John Nash |
| 5 | Pick a Side | The Office | Barry Nalebuff |
| 6 | The Fence | The Neighborhood | Robert Aumann |

## Episode 2: The Deal

Two deals where the other side knows more than you, and the clock is theirs.

| # | Scene | Place | Lens |
|---|---|---|---|
| 1 | The Change Order | Your Home (a bathroom with no floor) | Thomas Schelling |
| 2 | The Offer | The Offer (Northfield's lobby) | John Nash |

Episode 3 (*The Circle*: friends, family and the group chat) is shown as "in development".

## The Trader's Mind

A separate section, inspired by Jack Schwager's *Market Wizards*: lessons from the people who learned to survive the market. It isn't about how to trade. It's about sizing a risk, admitting you're wrong, waiting, adapting and staying in the game.

- **One desk, five challenges**, each asking one question about you: *The Losing Position* (can you accept being wrong?), *The Winning Streak* (overconfidence), *The Empty Hand* (waiting for an edge), *The Changing Market* (abandoning assumptions) and *The Last Player Standing* (protecting your ability to play again).
- **Your rules first.** Before you sit down you choose how much you'll risk on one decision and what your edge is. Every option shows its risk, and the game tracks when you break your own rule.
- **Five kinds of capital**: Account, Trust, Edge, Composure and Runway. Lose half the account and the desk pulls your capital, which ends the section early.
- **After each decision**: the risk chart (what every move could cost or earn), what Theo or Nadia saw, and the same decision in everyday life.
- **The review** reveals the five principles underneath (protect your downside, find your edge, follow the evidence, master yourself, stay in the game), scored from what you actually did.

The after-hours trading floor is rendered in Blender. `tools/make_trading_textures.py` draws its screens and handwritten notes first.

## How each scene plays

1. **Establishing shot** of a lit 3D set, with a title card.
2. **The situation plays out**: typed dialogue, camera push-ins on whoever is speaking, characters changing expression (11 moods), posture (15 poses) and gesturing (nod, head shake, flinch, sigh, lean, glance, walk).
3. **Voices and speed**: characters, your lines and a narrator are spoken with the device's built-in voices, each character cast to a distinct natural voice. The speaker button turns voices off; the speed button cycles 0.75× to 1.5× and paces speech, typing and timing together. Both are remembered.
4. **Slow Motion Strategy** (Slow-mo button, or press `P`): the scene freezes and desaturates over a strategy grid, numbered pins mark each person, and a panel shows what each wants, what you know, what's uncertain, details you can investigate, and where each option might lead. Resume, or replay from the start.
5. **You choose a move.**
6. **The room reacts** in a short animated sequence. Results are partly random.
7. **Analysis in four tabs**: *Outcome* (decision grade vs. result, now vs. later, trust changes), *The game* (payoff matrix with your cell highlighted, decision tree of every move's possible results, what reading the room would have shown), *The people* (relationship map, leverage scale, incentives), *The lens* (the thinkers' concepts, every move graded, the lesson).
8. **Replay with another strategy**, or move on.

Moves are graded with chess annotations (`!!` `!` `!?` `?!` `?`) on decision quality, never on outcome. The profile tracks ten measures, a strategic rating, your relationship network, and Annie Duke's decision-vs-result grid.

## Your Dance

After Episode 1, the profile opens with a mirror rather than a lesson:

- **What the room saw.** Each person you met says, in one line, how they'd describe you after your choice.
- **What your choices were buying.** Every move pursues something: knowing more, a fair deal, the long game, being right, winning the round, being liked, avoiding friction, or protecting your time. Ed Seykota's line applies: everybody gets what they want.
- **Three moments**, your best call, where luck covered for you (or let you down), and what someone will remember, each with a one-line margin note from Nash, Duke or Schelling.
- **One question to take with you**, chosen from your weakest measure.

## What's animated, honestly

- **Environments** are real 3D scenes modeled and lit in Blender (Cycles), rendered to layered images. They are not real-time 3D: the camera moves within a high-resolution render (pan and zoom), with characters composited at the correct depth and scale.
- **Characters** are 2D vector illustrations with volumetric shading. Their faces, poses and gestures are animated live in the browser (SVG + CSS), including blinking, breathing, talking and walking. They are not 3D models.
- **Diagrams** (matrix, tree, relationship map, leverage scale) animate on reveal.

## Design principles (Mike Markkula)

- **Empathy.** Start where people already live: a checkout lane, not a boardroom. No lecture before the first move. Characters show as "Unclear" when you genuinely can't know their intent.
- **Focus.** One scene and one decision at a time. Deep analysis sits behind tabs, so the default view stays simple. No accounts, no settings.
- **Impute.** People judge by presentation. Lit sets, cinematic framing and restrained typography make the ideas feel as serious as they are.

## Project layout

```
public/
  index.html            app shell
  css/styles.css        all styles, light + dark, stage and character animation
  img/env/*.webp        rendered sets: <env>-bg / -mid / -fg layers
  js/thinkers.js        the bench, skills, grades
  js/scenarios.js       scenario substance: options, grading, analysis
  js/scenes.js          staging: people, places, beats, reactions, matrices, leverage
  js/insight.js         what each move pursues, what people say about you, closing questions
  js/market.js          The Trader's Mind: challenges, staging, capital, rules and principles
  js/env-data.js        generated: where people stand in each render, camera targets
  js/art.js             character renderer (moods, poses) and environment layering
  js/stage.js           playback engine: camera, dialogue, freeze, skip
  js/viz.js             payoff matrix, decision tree, relationship map, leverage scale
  js/game.js            flow, views, scoring, profile
tools/blender/render_envs.py   builds and renders every set
server.js               zero-dependency static server
```

Progress is stored in the browser's `localStorage`. There's no backend database.

### Re-rendering the sets

Needs Blender 4.2+ (built and tested with 5.2):

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_envs.py -- "$PWD" --samples 128
```

The home page header ("The Dance Floor") is its own scene: two pieces in overlapping spotlights with a shared teal ring (mixed motives, mutual gain), dance steps (reciprocity), receding doorways (repeated games, and the exit as walking away) and dice (uncertainty). Render it with:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_hero.py -- "$PWD" --samples 160
```

For the game sets, add env names (`checkout desks kitchen conference street yard`) after `"$PWD"` to render only some. The script also rewrites `public/js/env-data.js`, projecting each character's standing spot through the real camera so feet land on the floor at the correct scale. If the renders are missing, the game falls back to hand-drawn SVG sets.

### Adding a scene

1. Add the substance to `PP.scenarios` in `scenarios.js` (options, grades, outcomes, analysis).
2. Add the staging to `PP.scenes` in `scenes.js` (environment, cast spots, intro beats, reaction beats per outcome, matrix, leverage). The comment at the top of that file documents beat fields.
3. Add the id to an episode in `PP.episodes`.

## Run locally

Requires Node 18+.

```bash
npm start
```

Then open http://localhost:3000.

## Deploy on Railway

1. Push this folder to a GitHub repository.
2. In Railway: **New Project → Deploy from GitHub repo** and pick it.
3. Railway detects Node and runs `npm start`. The server reads `PORT` from the environment.
4. Under **Settings → Networking**, generate a domain. Optional health check path: `/healthz`.

The rendered images are committed (about 1 MB total), so Railway doesn't need Blender.
