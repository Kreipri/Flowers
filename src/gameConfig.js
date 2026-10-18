// Edit all player-facing copy here. Templates use {name}; letter paragraphs can
// contain newlines. This module is placed FIRST in the generated index.html script.
export const GAME_CONFIG = {
  text: {
    appTitle: 'Just because… | A little sunshine',
    symbols: { close: '×', arrow: '↗' },
    controls: {
      mute: 'Mute sound', unmute: 'Unmute sound', pause: 'Pause game',
      resume: 'Resume game', returnToLetter: 'Return to letter', closeLetter: 'Close letter',
      openLetter: 'Open your letter', liftLetter: 'Lift the letter out of the bouquet',
    },
    intro: {
      eyebrow: 'A LITTLE SUNSHINE, WRAPPED IN LOVE', title: 'Just because...',
      envelopeLabel: 'JUST FOR YOU', paperPreview: 'Dearest lovely you,',
      paperNote: 'A little sunshine, just for you. ♡',
      footer: {
        arriving: ['A little sunshine is growing…', 'A SPECIAL DELIVERY'],
        zooming: ['A little love, coming closer.', 'YOUR LETTER IS ON ITS WAY'],
        tucked: ['A little something to make you smile.', 'TAP THE BOUQUET TO FIND YOUR LETTER'],
        launching: ['A special delivery…', 'WITH A LITTLE LOVE'],
        interactive: ['Some words, picked just for you.', 'TAP THE ENVELOPE TO OPEN'],
        opening: ['A little love, unfolding.', 'YOUR LETTER IS ON ITS WAY'],
        opened: ['Some words, picked just for you.', 'WITH A LITTLE LOVE'],
      },
    },
    letter: {
      eyebrow: 'A LITTLE NOTE, JUST FOR YOU', greeting: 'Dearest lovely you,',
      paragraphs: [
        'Some days call for a little extra sunshine. So I picked a handful, wrapped it up, and saved it just for you.',
        'Take a breath. Let your shoulders soften. You deserve all the small, sweet things life has to offer.',
      ],
      verse: 'Every flower blooms at its own pace.\nAnd so do you.',
      invitation: 'There’s a tiny meadow waiting for you. Gather the good things, dodge the little rain clouds, and keep your arms open for one last surprise.',
      mission: '{points} sunshine points or {seconds} seconds.',
      surprise: 'Then, catch someone very special.',
      play: 'Let’s catch some sunshine', controls: 'Move your mouse, drag, or use ← → / A D',
      signoff: 'with a little love, always ♡',
    },
    game: {
      canvasLabel: 'Catch sunshine with the boy in a plain grey top. Move with arrow keys, A and D, a mouse, or touch.',
      levelProgress: 'Level {level} · {points} / {target}',
      totalScore: 'Total sunshine: {score}', remaining: '{seconds}s to surprise',
      lastCatch: 'one last catch', lives: '{count} lives remaining',
      waitingTitle: 'A little surprise is on its way…', waitingCopy: 'Take a breath. Keep your arms open.',
      fallingTitle: 'One last catch. It’s me!', fallingCopy: 'Move beneath her and catch her in your arms.',
      streak: '{combo}× sunshine streak · ', controls: 'Move with your mouse, drag, or use ← → / A D',
      countdownTitle: 'YOUR LITTLE MEADOW AWAITS', countdownCopy: 'Catch the sunshine. Leave the rain.',
      pauseTitle: 'A little breather.', pauseCopy: 'Your meadow will be right here.',
      resume: 'Keep catching', back: 'Back to your letter',
      sweetMessages: ['You make me bloom!', 'My favorite sunshine. ♡', 'Picked just for you!', 'You caught a little joy!', 'Life is sweeter with you.', 'A little love, always.'],
    },
    result: {
      winEyebrow: 'RIGHT WHERE YOU BELONG', loseEyebrow: 'EVEN FLOWERS NEED A LITTLE RAIN',
      winArt: 'A boy with solid black side-swept bangs in a grey top and a girl with wavy black hair in a charcoal sweater and white collar standing side-by-side beneath a heart',
      loseArt: 'A gentle rain cloud watering a little flower',
      winTitle: 'You Won!', loseTitle: 'A fresh start?',
      winCopy: 'I was falling in love…\nand you were there to catch me.',
      loseCopy: 'A little rain, a little rest.\nLet’s find the sunshine again.',
      best: 'YOUR NEW SUNSHINE BEST', total: 'TOTAL SUNSHINE GATHERED',
      streak: 'LEVEL {level} · SWEETEST STREAK {combo}×',
      flowers: '{count} flowers', stars: '{count} stars', hearts: '{count} hearts', sparkles: '{count} sparkles',
      playAgain: 'Play Again · Level {level}', back: 'Read my letter again',
    },
  },
  gameplay: {
    roundTarget: 500, finaleSeconds: 30, finalePause: 1.2, countdown: 3, lives: 3,
    baseSpeed: 260, speedVariation: 90, speedPerSecond: 2.5,
    speedMultiplierPerLevel: 1.6, spawnMultiplierPerLevel: 1.55, hazardStepPerLevel: .7, spawnInterval: .5,
    girlSpeedBoost: 1.18, bubbleSeconds: 1.6, bubbleRise: 38, maxBubbles: 3,
  },
  intro: { bouquetArrivalMs: 900, bouquetZoomMs: 650, launchMs: 1400, paperRevealMs: 1700 },
};

export const TEXT_CONTENT = GAME_CONFIG.text;

// Keep formatting independent of React so the canvas HUD and DOM share copy.
export function formatText(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}
