# The Dance

**The everyday game of human behavior, strategy & influence.**

> You don't have to be the most powerful person in the room. You have to understand the dynamics of the room well enough to make good decisions.

The Dance is a playable, animated game about deciding under uncertainty. You sit at a trading desk and take the calls that come with it, choose what to do, and watch the people around you react. Then the game shows what was happening underneath: who wanted what, what you could have known, what was priced in, and how much of the result was skill and how much was luck.

The aim is to see the game without becoming the game. Manipulation is never rewarded.

## The Trader's Mind

A separate section, inspired by Jack Schwager's *Market Wizards*: lessons from the people who learned to survive the market. It isn't about how to trade. It's about sizing a risk, admitting you're wrong, waiting, adapting and staying in the game.

- **One desk, five challenges**, each asking one question about you: *The Round Trip* (one position over three days: honor the stop, buy back higher, take an order you disagree with), *The Peg* (betting big when the downside is capped), *The Book* (telling five bets from one), *The Turn* (recognizing a turn in the cycle, with that same book on the line) and *The Last Player Standing* (protecting your ability to play again).
- **Your rules first.** Before you sit down you choose how much of the account you'll risk on one idea (1%, 2.5% or no limit) and what your edge is. Every option shows how much it puts at risk, and the game tracks when you break your own rule.
- **One world per play.** Each challenge rolls its event once (did the customer leave, did the peg break, is it a normal losing stretch or a new market), clues hint at which, and grades judge the decision against what you could know, not the roll.
- **Fictional tech companies.** Halcyon Homes, the Republic of Valdor and its crown, Valdor Rail, Brightwell Homes, Calder Regional Bank, Pinemoor REIT, Ostrander Auto Credit, Quillfeather Software, Tallis Gold Royalty, Ashcombe Pharma and Saros Robotics are invented, because the scenes invent news about them.
- **A journal of your own rules.** After a weak decision the desk asks you to write a rule. Every later decision is held to it: a move that breaks it is tagged before you choose, costs a grade, and the year ends with *Your principles*, each rule marked kept or broken. The Debrief call adds one more, and The Last Call checks it.
- **One portfolio across the year.** The book you build in June is the book January's shock hits: a balanced book can simply hold, while five names that were really one bet have to be cut or flipped.
- **Skill and luck on every result.** Each Desk result shows what every move was worth on average across the worlds you couldn't rule out, its worst case and its chance of ending your game, and how much of your result was luck.
- **Five kinds of capital that interact**: Account, Trust, Edge, Composure and Runway. Composure sets how many details you can check before deciding (rattled, one; calm, three), a sharp Edge buys one more look, and below 5 Trust Nadia won't sign anything above a normal-size risk. Runway is the season left: each challenge spends one. Nadia's limits tighten as you lose: a review at −5%, half size at −10%, small risk only at −15%, and at −20% the desk pulls your capital, which ends the section early. Locked options say why.
- **Five opponents**: your attachment, your timidity, your sense of being diversified, your assumptions, your desire for more. The market is almost incidental.
- **One campaign**: each challenge remembers the ones before it (Nadia initials a clean exit, she remembers the exception you asked for on Valdor, she won't hear an exception from someone she doesn't trust).
- **After each decision**: the risk chart (what every move could cost or earn), what Theo or Nadia saw, and the same decision in everyday life.
- **Second-level thinking**: every challenge has a "What's priced in?" read, and a cycle reading (cold to hot) that shows where the pendulum sits that season.
- **Markets that behave like markets**: positions are marked to the close, thin books cost you on the way out, inside information is frozen and clawed back at any size, and the final setup is a real edge (right four times in ten) with an earnings gap the exit can't cover.
- **The R ledger** in the review: what each decision planned to risk, what it made or lost in units of that plan, expectancy, and what was lost beyond plan or on broken rules.
- **The Mirror** ends the run: the rules you set before the first trade, beside what you actually did under pressure, challenge by challenge, and whether you played the game you said you would.

The desk sits in a private office that looks out on the ocean, rendered in Blender five ways (`desk-dusk`, `desk-morning`, `desk-noon`, `desk-rain`, `desk-night`): a sunset over the water, bright morning, flat midday, a grey sea in the rain and a moonlit night. The hour, the weather, the lamp, the coffee and the paper on the desk change with the season. The center and right monitors are drawn live in SVG on top of the render, and so are the things the desk remembers: your rules card, your journal of earlier decisions (broken rules crossed out), the phone, the clock and the calendar. The after-hours floor (`trading`) is still used for the home page and the section's landing page.

### Part II: The Call

Five phone calls, one account, the same five kinds of capital. Every call holds two games: the conversation you think you're having, and the one the caller may be playing. On the home page and the market page the two parts share one space, with tabs for Part I (The Desk) and Part II (The Call).

- **Five callers, five hidden truths.** Michael Reeves (a warning, or shopping your shares to his client?), Richard Cole (a tip from the deal team, an exit for his own position, or nothing at all), Theo Brandt's committee (four voices on Kestrel Freight: a real bottom, or a value trap; whose record should count?), Nadia's Friday debrief (your worst decision of the year, read to the whole desk) and Catherine Hale (who has been watching all year). Each call draws its truth once; what you ask, reveal and leave unsaid decides how much of it you see.
- **Different ways to act inside a call**: choose what to say, decide how much to reveal, stay silent and let the caller fill the gap, ask a limited number of questions (Composure sets how many), spend minutes checking a tip against a deadline that isn't yours, sort evidence by whether it changes your view, and size a bet on a slider that shows your rule and the ruin line. You can let it ring or hang up at any point.
- **The paper.** Beside the phone, the conversation is written down as it's spoken. Key phrases are circled, boxed or underlined in ink, and your own thoughts appear in pencil in the margin, with arrows and question marks. Tap the paper to write faster. The office behind it is the same ocean-view render, at the hour and in the weather of each call.
- **What wasn't said** follows every call: what the caller wanted, knew and didn't know, the incentive, one established fact kept apart from a plausible reading, what you gave away, and which signals you noticed or missed.
- **The campaign remembers behavior.** Tell Michael your size and Richard knows it the next week; weigh Theo's committee by its record and Catherine hears about it; by Friday Catherine has heard all of it. Low Trust locks big positions, low Composure means you can't sit in a silence, a sharp Edge points at the question that matters.
- **The Mirror** sets your risk rule and two promises (verify, keep positions private, never chase, follow the evidence, size down when unsure) beside what you did, then describes how you played (consistency, adaptability, risk management, information gathering, discipline) and what your calls say about you, without winner or loser labels.

Content lives in `js/call.js`; the engine, the paper and the screens in `js/callplay.js`. Ring and line sounds are made with Web Audio and follow the voices setting.

## How each challenge plays

1. **Establishing shot** of a lit 3D set, with a title card.
2. **The situation plays out**: every line (narration, dialogue, your thoughts, and what a screen says) appears in one script box under the stage, typed out, camera push-ins on whoever is speaking, characters changing expression (11 moods), posture (15 poses) and gesturing (nod, head shake, flinch, sigh, lean, glance, walk).
3. **Voices and speed**: characters, your lines and a narrator are spoken with the device's built-in voices, each character cast to a distinct natural voice. The speaker button turns voices off; the speed button cycles 0.75× to 1.5× and paces speech, typing and timing together. Both are remembered.
4. **Slow Motion Strategy** (Slow-mo button, or press `P`): the scene freezes and desaturates over a strategy grid, numbered pins mark each person, and a panel shows what each wants, what you know, what's uncertain, details you can investigate, and where each option might lead. Resume, or replay from the start.
5. **You choose a move.** What you can say depends on what you found out: reading a clue sharpens some options (not always into the right one), and your history with people shifts how they respond. Gary pays for the fence alone far more often if The Spot went well.
   Each challenge and call draws one hidden world (did the peg break, was the caller warning you or shopping your shares), and clues hint at which one you're in.
6. **The room reacts** in a short animated sequence. Results are partly random.
7. **Analysis in four tabs**: *Outcome* (decision grade vs. result, skill and luck, your capital, your rules and your journal), *The decision* (what every move could cost or earn, a decision tree of every move's possible results, what reading the room would have shown), *The mind* (your rules against this move, what Nadia or Theo saw, the same decision away from the screens), *The lens* (the thinkers' concepts, every move graded, the lesson).
8. **Replay with another strategy**, or move on.

Moves are graded with chess annotations (`!!` `!` `!?` `?!` `?`) on decision quality, never on outcome.

## What's animated, honestly

- **Environments** are real 3D scenes modeled and lit in Blender (Cycles), rendered to layered images. They are not real-time 3D: the camera moves within a high-resolution render (pan and zoom), with characters composited at the correct depth and scale.
- **Characters** are 2D vector illustrations with volumetric shading. Their faces, poses and gestures are animated live in the browser (SVG + CSS), including blinking, breathing, talking and walking. They are not 3D models.
- **Diagrams** (the risk chart and the decision tree) animate on reveal.

## Design principles (Mike Markkula)

- **Empathy.** Start where people already are: one position, one phone call, one decision. No lecture before the first move. Characters show as "Unclear" when you genuinely can't know their intent.
- **Focus.** One scene and one decision at a time. Deep analysis sits behind tabs, so the default view stays simple. No accounts, no settings.
- **Impute.** People judge by presentation. Lit sets, cinematic framing and restrained typography make the ideas feel as serious as they are.

## Project layout

```
public/
  index.html            app shell
  css/styles.css        all styles, light + dark, stage and character animation
  img/env/*.webp        rendered sets: the trading floor and five desk times of day, as -bg / -fg layers
  img/hero-dance-floor.webp   the home page header
  js/thinkers.js        the bench and the decision grades
  js/people.js          how Theo and Nadia look on stage
  js/market.js          The Desk: challenges, staging, capital, rules, the journal and principles
  js/call.js            The Call: five callers, their hidden truths, moments and reveals
  js/callplay.js        The Call: engine, the phone, the paper and The Mirror
  js/env-data.js        generated: where people stand in each render, camera targets, screen corners
  js/art.js             character renderer (moods, poses) and set layering
  js/stage.js           playback engine: camera, dialogue, freeze, skip
  js/viz.js             the decision tree
  js/game.js            the Desk's flow, views, grading and review; the home and bench pages
tools/blender/render_envs.py   builds and renders the trading floor and the desk sets
tools/blender/render_hero.py   renders the home page header
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

To render only some sets, add their names (`trading desk-dusk desk-morning desk-noon desk-rain desk-night`) after `"$PWD"`. The script also rewrites `public/js/env-data.js`, projecting each character's standing spot through the real camera so feet land on the floor at the correct scale. If the renders are missing, the game falls back to hand-drawn SVG sets.

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
