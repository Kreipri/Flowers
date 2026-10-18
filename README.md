# Just because…

A small bouquet, a letter, and a little sunshine-catching game. Built with React, SVG, Canvas, and the Web Audio API in a warm, rounded flat-vector style.

## Run locally

With Node.js installed:

```sh
node server.js
open http://127.0.0.1:3456/
```

You can also open `index.html` directly. Internet access is required for React, Babel, fonts, and optional victory confetti. No package installation or build step is required.

## The experience

1. **A special delivery.** The flowers rise into view while the envelope stays completely hidden. Tap the bouquet to zoom it closer; only after that zoom finishes does the cream envelope appear and rise vertically out of the flowers. It turns horizontal in the air; click it again to lift the lid and slide the paper physically out of the envelope. The closed envelope clips a smaller, invisible sheet so no paper can peek out. During opening, the sheet rises first, then scales into the readable, scrollable letter. Reduced-motion preferences skip these animations.
2. **A little meadow.** Move the catcher with your mouse, touch drag, arrow keys, or A/D. He has solid black textured side-swept bangs, a plain grey long-sleeve top, black pants, and black shoes. Catch sunflowers (+15), stars (+20), hearts (+10), and sparkles (+25). Consecutive catches build a multiplier up to 8×. During level 1, positive catches trigger large narrator cards from Bea near the top-center of the viewport. Each labeled card pops in, floats gently, and fades over 2.4 seconds. A rapid catch replaces the current card and avoids repeating the last line, keeping only one message visible. Messages are independent of the boy’s position; level 2 and later have no narration. Pausing freezes both the card animation and its lifetime, and reduced-motion preferences show a static readable card until dismissal. Clouds, bugs, and wilted roses cost one of your three lives; missing a positive item resets the streak.
3. **One last catch.** Reach 500 points **or survive 30 seconds** to clear all ordinary items. After a 1.2-second pause, the girl with side-parted wavy black hair, a charcoal sweater over a white collared shirt, and dark pants and shoes drops from a random, safely padded position along the top at 18% above that level’s maximum ordinary item speed. Catch her to immediately reveal **You Won!**, the pair standing happily side-by-side, and a heart. Missing the girl ends the round as a distinct missed-catch defeat, showing “bea fucking died lol” with a cartoon fallen-girl illustration in a stylized deep red puddle. Losing all three lives before the finale shows the standard “Game Over” screen with a wilted flower. Both outcomes cancel the animation loop, preserve the accumulated score for replay, and display a fixed body-level modal above the stopped canvas. Optional audio cannot prevent the result from rendering.

Pause with P, Escape, or the pause button. Switching away from the window automatically pauses the game. Play Again carries your total score into the next level. Each new round (including one started again from the letter) advances the level. Level 1 starts at 260–350 pixels/second (plus 2.5 pixels/second per elapsed second) and spawns every 0.5 seconds. Each replay multiplies falling speed by 1.6 and spawn frequency by 1.55; hazard weights increase by a 70% step per level. Level 2 therefore spawns about every 0.323 seconds and starts at 416–560 pixels/second. Each round resets lives, timer, and streak, and requires 500 **new** points or 30 seconds for its finale. Returning to the letter mid-round also preserves earned points. Refreshing the page starts a new score/level session. Personal bests are saved locally when browser storage is available.

The page and main game viewport stay fixed with hidden overflow. Letters and result overlays scroll internally when needed. Screens and overlays fade in with CSS opacity animations; reduced-motion preferences skip the motion.

## Source organization

- `src/gameConfig.js`: all player-facing text, letter paragraphs, narrator messages, difficulty settings, and animation durations. This is the first module in the standalone script; edit copy here, then regenerate `index.html`.
- `src/App.jsx`: session score, level progression, view transitions, and sound controls.
- `src/components/Artwork.jsx`: shared flowers, leaves, chibi characters, hearts, and UI icons.
- `src/components/IntroScreen.jsx`: bouquet layering, envelope state machine, accessible letter, and application styles.
- `src/components/CatchingGame.jsx`: elapsed-time simulation, canvas artwork, controls, and finale.
- `src/components/GameOverModal.jsx`: victory and defeat screens.
- `src/utils/soundEngine.js`: synthesized audio; no audio files.
- `server.js`: local static server bound to `127.0.0.1:3456`.

`index.html` embeds the source modules for standalone use. After editing `src/`, regenerate it with:

```sh
ruby scripts/sync-standalone.rb
```

## Validation

The game regression harness uses the real sound engine, Node.js built-ins, and the same Babel compiler as the browser:

```sh
curl -L --fail https://unpkg.com/@babel/standalone@8.0.7/babel.min.js -o /tmp/smiley-babel.min.js
node scripts/test-game.cjs /tmp/smiley-babel.min.js
node scripts/test-interface.cjs /tmp/smiley-babel.min.js
```

The checks cover both finale triggers, clearing and delay, random edge-safe spawning and resize preservation, faster final drops, immediate victory, distinct health-loss and missed-catch defeats, swept collisions, defeat, pause, cleanup, frame-rate consistency, cumulative scores, level progression, hazard scaling, narrator expiry/suppression, viewport positioning, and rapid replacement, the envelope/zoom visibility gates, paper concealment, reduced motion, centralized copy, solid-black hairstyles and outfits, the side-by-side victory pose, the full-viewport letter portal, loss-modal stacking, frame cancellation, and blocked-audio handling. Also manually check the bouquet’s two-click sequence, letter scroll/focus behavior, mobile layouts, pointer/touch/keyboard input, mute, and reduced motion.
