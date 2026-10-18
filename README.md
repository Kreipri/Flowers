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

1. **A special delivery.** Click the bouquet to lift the cream envelope vertically out of the flowers. It turns horizontal in the air; click it again to lift the lid and slide the paper physically out of the envelope. The sheet rises first, then scales into the readable, scrollable letter. Reduced-motion preferences skip these animations.
2. **A little meadow.** Move the boy in the grey hoodie with your mouse, touch drag, arrow keys, or A/D. Catch sunflowers (+15), stars (+20), hearts (+10), and sparkles (+25). Consecutive catches build a multiplier up to 8×. During level 1, positive catches also create random sweet speech bubbles that float up and fade over 1.6 seconds; level 2 and later have no bubbles. Clouds, bugs, and wilted roses cost one of your three lives; missing a positive item resets the streak.
3. **One last catch.** Reach 500 points **or survive 30 seconds** to clear all ordinary items. After a 1.2-second pause, the girl in the dark red hoodie drops from the top center at 18% above that level’s maximum ordinary item speed. Catch her to immediately reveal **You Won!**, the pair standing happily side-by-side, and a heart. A missed final catch retries without costing a life. Losing all three lives before the finale shows a retry screen.

Pause with P, Escape, or the pause button. Switching away from the window automatically pauses the game. Play Again carries your total score into the next level. Each new round (including one started again from the letter) advances the level: falling speed and spawn frequency increase by an 18% step, and hazard weights increase by a 45% step per level. Each round resets lives, timer, and streak, and requires 500 **new** points or 30 seconds for its finale. Returning to the letter mid-round also preserves earned points. Refreshing the page starts a new score/level session. Personal bests are saved locally when browser storage is available.

## Source organization

- `src/gameConfig.js`: all player-facing text, letter paragraphs, speech messages, difficulty settings, and animation durations. This is the first module in the standalone script; edit copy here, then regenerate `index.html`.
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

The game regression harness uses Node.js built-ins and the same Babel compiler as the browser:

```sh
curl -L --fail https://unpkg.com/@babel/standalone@8.0.7/babel.min.js -o /tmp/smiley-babel.min.js
node scripts/test-game.cjs /tmp/smiley-babel.min.js
node scripts/test-interface.cjs /tmp/smiley-babel.min.js
```

The checks cover both finale triggers, clearing and delay, center spawning, faster final drops, immediate victory, missed-catch retries, swept collisions, defeat, pause, cleanup, frame-rate consistency, cumulative scores, level progression, hazard scaling, bubble expiry/suppression, the envelope state machine, reduced motion, centralized copy, and the side-by-side victory pose. Also manually check the bouquet’s two-click sequence, letter scroll/focus behavior, mobile layouts, pointer/touch/keyboard input, mute, and reduced motion.
