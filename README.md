# The Dance

**The everyday game of human behavior, strategy & influence.**

> You don't have to be the most powerful person in the room. You have to understand the dynamics of the room well enough to make good decisions.

The Dance is a playable, animated episode of everyday situations. You watch a scene unfold in a grocery store, an office or your street, choose what to do, and watch the people in the room react. Then the game shows what was happening underneath: who wanted what, where the leverage was, what you couldn't know, and which idea from game theory was at work.

The aim is to see the game without becoming the game. Manipulation is never rewarded.

## Episode 1: Ordinary Life

Three places, six scenes. Characters remember you across scenes, and no single style of move wins every one: the best answer depends on who you're dealing with.

| # | Scene | Place | Main lens | Hidden type |
|---|---|---|---|---|
| 1 | The Wrong Price | The Grocery Store | Annie Duke | Maya rookie or veteran, and the tag right or wrong |
| 2 | Just This Once | The Office | Robert Axelrod | Dana: overloaded, offloading, or hiding a crisis |
| 3 | The Spot | The Neighborhood | Thomas Schelling | Gary: unaware, needs the spot, or leaving |
| 4 | The Credit Taker | The Office | John Nash | Jordan: scared, scheming, or presenting at Ellen's request |
| 5 | Pick a Side | The Office | Barry Nalebuff | The tool: phased fix works, needs a rebuild, or a patch is enough |
| 6 | The Fence | The Neighborhood | Robert Aumann | Gary (same draw as The Spot) |

Some clues cost something to read: asking Ruth, Priya or Tom gets back to the person you asked about, and checking the shelf holds up the line. The cost shows before you read the clue.

## Episode 2: The Deal

Six deals. In most, the other side knows more than you. In one, you're the one who knows.

| # | Scene | Place | Lens | Hidden type |
|---|---|---|---|---|
| 1 | The Change Order | Your Home | Thomas Schelling | Luis: honest or padding |
| 2 | The Bidding War | Your Home (an open house) | John Nash | The market: crowded or quiet |
| 3 | The Offer | The Offer (Northfield's lobby) | John Nash | |
| 4 | The Counteroffer | The Offer (back at Brightline) | Thomas Schelling | Ellen: real counter or a stall |
| 5 | The Used Car | The Marketplace (Alder Street) | Robert Aumann | Kim: careful or trusting |
| 6 | The Trade-In | The Marketplace (a dealership) | Barry Nalebuff | Vince: four-square or straight |

## Episode 3: The Circle

Friends, family and the group chat. The games you play with people you can't walk away from.

| # | Scene | Place | Lens | Formal term | Hidden type |
|---|---|---|---|---|---|
| 1 | The Rental | The Trip (a lake cabin) | Barry Nalebuff | Mechanism design | Omar: square or a taker |
| 2 | The Bill | The Trip (the last dinner) | John Nash | Free-rider problem | Omar (same draw) |
| 3 | The Date | The Group Chat (your new place) | Thomas Schelling | Focal point | The group: birthday clear or a clash |
| 4 | The Loan | The Group Chat (your new place) | Robert Axelrod | Tit for tat | Omar (same draw) |
| 5 | The Holidays | The Family (Mom's kitchen) | Robert Aumann | Repeated bargaining | Nate: stretched thin or coasting |
| 6 | The Parents' House | The Family (Mom's kitchen) | Barry Nalebuff | Fair division | Nate (same draw) |

Omar and Nate are each drawn once and stay the same across their scenes (`share: 'omar'` / `share: 'nate'` in `episode3.js`), so what you learn about them early still holds later.

## The Trader's Mind

A separate section, inspired by Jack Schwager's *Market Wizards*: lessons from the people who learned to survive the market. It isn't about how to trade. It's about sizing a risk, admitting you're wrong, waiting, adapting and staying in the game.

- **One desk, five challenges**, each asking one question about you: *The Losing Position* (can you accept being wrong?), *The Winning Streak* (overconfidence), *The Empty Hand* (waiting for an edge), *The Changing Market* (abandoning assumptions) and *The Last Player Standing* (protecting your ability to play again).
- **Your rules first.** Before you sit down you choose how much of the account you'll risk on one idea (1%, 2.5% or no limit) and what your edge is. Every option shows how much it puts at risk, and the game tracks when you break your own rule.
- **One world per play.** Each challenge rolls its event once (did the customer leave, was the drug approved, is it a normal losing stretch or a new market), clues hint at which, and grades judge the decision against what you could know, not the roll.
- **Fictional tech companies.** Corvane Cloud, Quorvia Bio, Nimbic AI, Ledgerline, Voltaic Cells, Hashgrid, Tensora, Cirrane and Saros Robotics are invented, because the scenes invent news about them.
- **Five kinds of capital that interact**: Account, Trust, Edge, Composure and Runway. Composure sets how many details you can check before deciding (rattled, one; calm, three), a sharp Edge buys one more look, and below 5 Trust Nadia won't sign anything above a normal-size risk. Runway is the season left: each challenge spends one. Lose half the account and the desk pulls your capital, which ends the section early.
- **Five opponents**: your ego, your confidence, your impatience, your assumptions, your desire for more. The market is almost incidental.
- **One campaign**: each challenge remembers the ones before it (Nadia initials a clean exit, Compliance calls about the tip, she won't hear an exception from someone she doesn't trust).
- **After each decision**: the risk chart (what every move could cost or earn), what Theo or Nadia saw, and the same decision in everyday life.
- **The Mirror** ends the run: the rules you set before the first trade, beside what you actually did under pressure, challenge by challenge, and whether you played the game you said you would.

The desk sits in a private office that looks out on the ocean, rendered in Blender five ways (`desk-dusk`, `desk-morning`, `desk-noon`, `desk-rain`, `desk-night`): a sunset over the water, bright morning, flat midday, a grey sea in the rain and a moonlit night. The hour, the weather, the lamp, the coffee and the paper on the desk change with the season. The center and right monitors are drawn live in SVG on top of the render, and so are the things the desk remembers: your rules card, your journal of earlier decisions (broken rules crossed out), the phone, the clock and the calendar. The after-hours floor (`trading`) is still used for the home page and the section's landing page.

## How each scene plays

1. **Establishing shot** of a lit 3D set, with a title card.
2. **The situation plays out**: every line (narration, dialogue, your thoughts, and what a screen says) appears in one script box under the stage, typed out, camera push-ins on whoever is speaking, characters changing expression (11 moods), posture (15 poses) and gesturing (nod, head shake, flinch, sigh, lean, glance, walk).
3. **Voices and speed**: characters, your lines and a narrator are spoken with the device's built-in voices, each character cast to a distinct natural voice. The speaker button turns voices off; the speed button cycles 0.75× to 1.5× and paces speech, typing and timing together. Both are remembered.
4. **Slow Motion Strategy** (Slow-mo button, or press `P`): the scene freezes and desaturates over a strategy grid, numbered pins mark each person, and a panel shows what each wants, what you know, what's uncertain, details you can investigate, and where each option might lead. Resume, or replay from the start.
5. **You choose a move.** What you can say depends on what you found out: reading a clue sharpens some options (not always into the right one), and your history with people shifts how they respond. Gary pays for the fence alone far more often if The Spot went well.
   Some people are one of several hidden types, drawn fresh each play: Luis is honest or padding the bill, Jordan is scared or scheming, Dana is overloaded or offloading. Clues and small signals in the scene tell you which, the best move depends on who they are, and the result reveals who they were and what gave it away.
6. **The room reacts** in a short animated sequence. Results are partly random.
7. **Analysis in four tabs**: *Outcome* (decision grade vs. result, now vs. later, trust changes, and the other side: their reasoning, what earlier scenes changed, and what you knew), *The game* (payoff matrix with your cell highlighted, decision tree of every move's possible results, what reading the room would have shown), *The people* (relationship map, leverage scale, incentives), *The lens* (the thinkers' concepts, every move graded, the lesson).
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
  js/scenarios.js       substance for The Change Order and The Offer
  js/scenes.js          people, episodes, and staging for those two scenes
  js/insight.js         what each move pursues, what people say about you, closing questions
  js/episode1-3.js      each episode's other scenes: substance, staging and verdicts together
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

The home page header ("The Dance Floor") is its own scene: two pieces in overlapping spotlights with a shared teal ring (mixed motives, mutual gain), dance steps (reciprocity), receding doorways (repeated games, and the exit as walking away), dice (uncertainty), and beyond the floor a night sea with rolling swells under a low cream moon, the corridor carrying on as a pier. Render it with:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_hero.py -- "$PWD" --samples 160
```

For the game sets, add env names (`checkout desks kitchen conference street yard`) after `"$PWD"` to render only some. The script also rewrites `public/js/env-data.js`, projecting each character's standing spot through the real camera so feet land on the floor at the correct scale. If the renders are missing, the game falls back to hand-drawn SVG sets.

### Adding a scene

1. In the episode's file (for example `episode3.js`), add the substance (options, grades, outcomes, analysis), the staging (environment, cast spots, intro beats, reaction beats per outcome, matrix, leverage) and the verdicts. The comment at the top of `scenes.js` documents beat fields.
2. Give every option at least as many staged outcomes as scripted ones.
3. Add the id to an episode in `PP.episodes` in `scenes.js`.

### Beat scenes (Phase 1: Just This Once)

A scene with `play: true` is played in beats instead of one decision: `stakes` (what you're protecting: standing, allies or time), a budget of `reads` (the same budget Slow-mo uses), `press` (what the other person says once you stop looking, which depends on who they are and what you checked), your answer, and an optional `push` per option (they push back; you hold, give in or change your answer, and giving in changes what your move was). Options and outcomes can carry `fx` (changes to standing, allies and hours) and `rep` (what people now think of you: easy to ask, holds their ground, and so on). Reputation is kept in `flags.rep`, so later scenes can react to it: in The Credit Taker, Jordan has heard what kind of colleague you are. The results screen for these scenes leads with consequences; the grade sits under "How you played it." 

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
