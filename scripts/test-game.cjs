// Usage: node scripts/test-game.cjs /path/to/babel.min.js
// Uses the same Babel standalone compiler as index.html; no npm dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const compiler = {};
vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), compiler);
const root = path.resolve(__dirname, '..');
const source = ['src/gameConfig.js', 'src/utils/soundEngine.js', 'src/components/Artwork.jsx', 'src/components/CatchingGame.jsx']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^import .*\n/gm, '').replace(/^export default /gm, '').replace(/^export /gm, '')).join('\n');
const gameCode = compiler.Babel.transform(source, { presets: [['react', { runtime: 'classic' }]] }).code;

function mount({ width = 800, height = 700, storageBlocked = false, level = 1, initialScore = 0, random = () => .5, audioBlocked = false } = {}) {
  let nextFrame, now = 0, cleanup, result, resultCount = 0, cancelledFrames = 0, renders = [], refs = [], effects = [], refIndex = 0;
  const listeners = new Map();
  const context = new Proxy({ measureText: text => ({ width: text.length * 6 }) }, { get: (target, key) => target[key] || (() => {}), set: (target, key, value) => { target[key] = value; return true; } });
  const canvas = { getContext: () => context, getBoundingClientRect: () => ({ width, height, left: 0 }) };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useRef: initial => { const ref = { current: refIndex++ === 0 ? canvas : initial }; refs.push(ref); return ref; },
    useState: initial => [initial, value => { renders.push(value); }],
    useEffect: effect => effects.push(effect),
  };
  const sandbox = {
    React: react, ...react, Math: Object.assign(Object.create(Math), { random }), Path2D: class { constructor(value) { this.path = value; } },
    localStorage: { getItem: () => { if (storageBlocked) throw Error('blocked'); return '0'; }, setItem: () => { if (storageBlocked) throw Error('blocked'); } },
    window: { AudioContext: audioBlocked ? class { constructor() { throw Error('Audio blocked'); } } : undefined, devicePixelRatio: 2, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
    document: { hidden: false, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
    requestAnimationFrame: fn => { nextFrame = fn; return 1; }, cancelAnimationFrame: () => { cancelledFrames++; nextFrame = null; },
  };
  vm.createContext(sandbox); vm.runInContext(gameCode, sandbox);
  const tree = sandbox.CatchingGame({ level, initialScore, onGameEnd: value => { result = value; resultCount++; }, onBackToIntro() {}, onToggleSound() {}, soundMuted: false });
  cleanup = effects[0]();
  const frame = dt => { now += dt * 1000; const fn = nextFrame; nextFrame = null; if (fn) fn(now); };
  frame(0);
  return { resize(newWidth, newHeight = height) { width = newWidth; height = newHeight; listeners.get('resize')(); }, state: refs[1].current, rules: vm.runInContext('RULES', sandbox), frame, advance(seconds, hz = 60) { for (let i = 0; i < Math.ceil(seconds * hz); i++) frame(1 / hz); }, get result() { return result; }, get resultCount() { return resultCount; }, get pendingFrame() { return Boolean(nextFrame); }, get cancelledFrames() { return cancelledFrames; }, tree, refs, renders, listeners, cleanup };
}

const tests = [];
function test(name, fn) { fn(); tests.push(name); }
function positive(state, points = 15) { return { id: 'sunflower', points, color: '#edc575', x: state.player.x, y: state.player.y + 15, speed: 0, phase: 0 }; }

test('30-second trigger clears all items and particles, waits, then spawns the final drop', () => {
  const g = mount(); g.state.countdown = 0; g.state.elapsed = 29.99;
  g.state.items = [positive(g.state)]; g.state.particles = [{ x: 1, y: 2, life: 1 }];
  g.frame(.02); assert.equal(g.state.finale, 'waiting'); assert.equal(g.state.items.length, 0); assert.equal(g.state.particles.length, 0);
  g.advance(1); assert.equal(g.state.items.length, 0);
  g.advance(.3); assert.equal(g.state.finale, 'falling'); assert.equal(g.state.items.length, 1); assert.equal(g.state.items[0].id, 'girl'); assert.equal(g.state.items[0].x, 400);
  g.cleanup();
});
test('500-point trigger clears the field before the final drop', () => {
  const g = mount(); g.state.countdown = 0; g.state.score = 490; g.state.items = [positive(g.state)];
  g.frame(.016); assert.equal(g.state.finale, 'waiting'); assert.equal(g.state.score, 505); assert.equal(g.state.items.length, 0); assert.equal(g.result, undefined); g.cleanup();
});
test('catching the girl wins immediately and only once, even with blocked storage', () => {
  const g = mount({ storageBlocked: true }); g.state.countdown = 0; g.state.finale = 'falling';
  g.state.items = [{ ...positive(g.state), id: 'girl' }];
  g.frame(.016); assert.equal(g.result.status, 'win'); assert.equal(g.state.active, false); assert.equal(g.state.items.length, 0); g.frame(.016); assert.equal(g.result.status, 'win'); g.cleanup();
});
test('a missed final catch is terminal at the canvas bottom and preserves hearts and score', () => {
  const g = mount({ initialScore: 650, level: 2 }); g.state.countdown = 0; g.state.finale = 'falling';
  g.state.items = [{ id: 'girl', x: 50, y: 700, speed: 0 }]; g.frame(.016);
  assert.equal(g.result, undefined); // Exactly at the boundary is not past it.
  g.state.items[0].y = 700.1; g.frame(.016);
  assert.equal(g.result.status, 'missed-catch'); assert.equal(g.result.finalScore, 650);
  assert.equal(g.state.lives, 3); assert.equal(g.state.active, false); assert.equal(g.state.items.length, 0);
  g.advance(2); assert.equal(g.result.status, 'missed-catch'); assert.equal(g.state.items.length, 0); g.cleanup();
});
test('three harmful catches end the game in defeat', () => {
  const g = mount(); g.state.countdown = 0;
  for (let i = 0; i < 3; i++) { g.state.items = [{ ...positive(g.state, 0), id: 'cloud' }]; g.frame(.016); }
  assert.equal(g.state.lives, 0); assert.equal(g.result.status, 'lose'); g.cleanup();
});
test('pause freezes countdown and finale; cleanup removes every listener and frame', () => {
  const g = mount(); g.listeners.get('blur')(); g.advance(2); assert.equal(g.state.countdown, 3);
  g.refs[3].current = false; g.state.countdown = 0; g.state.finale = 'waiting';
  g.listeners.get('blur')(); g.advance(2); assert.equal(g.state.finaleTimer, 0);
  g.cleanup(); assert.equal(g.listeners.size, 0); assert.equal(g.state.active, false);
});
test('final fall matches at 30, 60, and 120 fps', () => {
  const positions = [30, 60, 120].map(hz => {
    const g = mount({ width: 390, height: 844 }); g.state.countdown = 0; g.state.finale = 'falling';
    g.state.player.x = 50; g.state.player.targetX = 50;
    g.state.items = [{ id: 'girl', x: 195, y: -75, speed: 120 }];
    g.advance(2, hz); const y = g.state.items[0].y; g.cleanup(); return y;
  });
  positions.forEach(y => assert.ok(Math.abs(y - 165) < .001));
});
test('replay carries total points while resetting the round timer, lives, and finale', () => {
  const first = mount(); first.state.score = 600; first.cleanup();
  const next = mount({ level: 2, initialScore: first.state.score });
  assert.equal(next.state.score, 600); assert.equal(next.state.startingScore, 600);
  assert.equal(next.state.lives, 3); assert.equal(next.state.elapsed, 0); assert.equal(next.state.finale, null);
  next.state.countdown = 0; next.state.items = [positive(next.state)]; next.frame(.016);
  assert.equal(next.state.score, 615); assert.equal(next.state.finale, null);
  next.state.score = 1090; next.state.items = [positive(next.state)]; next.frame(.016);
  assert.equal(next.state.finale, 'waiting'); next.cleanup();
});
test('a complete timed finale reaches victory through normal animation frames', () => {
  const g = mount(); g.state.countdown = 0; g.state.elapsed = 29.99;
  g.advance(8); assert.equal(g.result.status, 'win'); assert.equal(g.state.lives, 3); assert.equal(g.state.items.length, 0); g.cleanup();
});
test('keyboard and pointer input move the catcher within the field', () => {
  const g = mount({ width: 390, height: 844 }); g.state.countdown = 0; g.state.finale = 'waiting';
  let prevented = false;
  g.listeners.get('keydown')({ key: 'ArrowLeft', preventDefault() { prevented = true; } });
  g.advance(.5); assert.equal(prevented, true); assert.ok(g.state.player.x < 80);
  g.listeners.get('keyup')({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(g.state.keys.left, false);
  g.tree.props.onPointerMove({ clientX: 900 }); g.advance(.7);
  assert.ok(g.state.player.x <= 352 && g.state.player.x > 340); g.cleanup();
});

test('first-level catches display a configured narrator note for 2.4 seconds', () => {
  const g = mount(); g.state.countdown = 0; g.state.spawnTimer = 100;
  g.state.items = [positive(g.state)]; g.frame(.016);
  assert.ok(g.state.narrator);
  assert.equal(g.state.narrator.text, 'You caught a little joy!');
  g.advance(2); assert.ok(g.state.narrator);
  g.advance(.5); assert.equal(g.state.narrator, null); g.cleanup();
});
test('narrator notes freeze on pause and never spawn on level 2 or later', () => {
  const first = mount(); first.state.countdown = 0; first.state.items = [positive(first.state)]; first.frame(.016);
  const age = first.state.narrator.age; first.listeners.get('blur')(); first.advance(2);
  assert.equal(first.state.narrator.age, age); first.cleanup();
  for (const level of [2, 3, 10]) {
    const g = mount({ level }); g.state.countdown = 0; g.state.items = [positive(g.state)]; g.frame(.016);
    assert.equal(g.state.narrator, null); assert.equal(g.state.score, 15); g.cleanup();
  }
});
test('later levels spawn items faster, increase speed, and increase hazard probability', () => {
  // Identical random samples choose a heart at level 1 and a hazard at level 4.
  const first = mount({ random: () => .7 }), later = mount({ level: 4, random: () => .7 });
  for (const g of [first, later]) { g.state.countdown = 0; g.state.spawnTimer = 0; g.frame(.016); }
  assert.ok(first.state.items[0].points > 0); assert.equal(later.state.items[0].points, 0);
  assert.ok(later.state.items[0].speed > first.state.items[0].speed);
  assert.ok(later.state.spawnTimer < first.state.spawnTimer);
  first.cleanup(); later.cleanup();
});
test('girl falls faster than the maximum ordinary item speed at every difficulty', () => {
  for (const level of [1, 2, 5]) {
    const g = mount({ level }); g.state.countdown = 0; g.state.elapsed = 29.99; g.frame(.02);
    g.state.finaleTimer = g.rules.finalePause; g.frame(.016);
    const ordinaryMax = (g.rules.baseSpeed + g.rules.speedVariation + g.rules.finaleSeconds * g.rules.speedPerSecond) * g.state.difficultyMultiplier;
    assert.ok(g.state.items[0].speed > ordinaryMax);
    assert.ok(Math.abs(g.state.items[0].speed / ordinaryMax - 1.18) < .001); g.cleanup();
  }
});
test('swept collision catches a fast item that crosses the entire basket in one frame', () => {
  const g = mount({ level: 8 }); g.state.countdown = 0; g.state.spawnTimer = 100;
  g.state.items = [{ ...positive(g.state), y: g.state.player.y - 100, speed: 6000 }];
  g.frame(.05); assert.equal(g.state.score, 15); assert.equal(g.state.items.length, 0); g.cleanup();
});

test('level 1 starts fast and each replay drastically tightens the pace', () => {
  const games = [1, 2, 3].map(level => mount({ level }));
  games.forEach(g => { g.state.countdown = 0; g.state.spawnTimer = 0; g.frame(.016); });
  assert.ok(games[0].state.items[0].speed >= 260);
  assert.ok(games[0].state.spawnTimer <= .5);
  for (let i = 1; i < games.length; i++) {
    assert.ok(games[i].state.items[0].speed / games[i - 1].state.items[0].speed >= 1.59);
    assert.ok(games[i].state.spawnTimer / games[i - 1].state.spawnTimer < .65);
  }
  games.forEach(g => g.cleanup());
});

test('both real-engine defeat paths cancel RAF and deliver exactly one result despite blocked audio', () => {
  for (const missed of [false, true]) {
    const g = mount({ audioBlocked: true }); g.state.countdown = 0; g.state.spawnTimer = 100;
    if (missed) { g.state.finale = 'falling'; g.state.items = [{ id: 'girl', x: 50, y: 701, speed: 0 }]; }
    else { g.state.lives = 1; g.state.items = [{ ...positive(g.state, 0), id: 'cloud' }]; }
    g.frame(.016);
    assert.equal(g.result.status, missed ? 'missed-catch' : 'lose');
    assert.equal(g.state.active, false); assert.equal(g.pendingFrame, false); assert.ok(g.cancelledFrames > 0);
    g.advance(3); assert.equal(g.resultCount, 1); assert.equal(g.pendingFrame, false); g.cleanup();
  }
});
test('zero and negative health terminate directly without needing another collision', () => {
  for (const health of [0, -1]) {
    const g = mount(); g.state.lives = health; g.frame(.016);
    assert.equal(g.result.status, 'lose'); assert.equal(g.pendingFrame, false); g.cleanup();
  }
});
test('rapid catches replace a single narrator note independently of player position', () => {
  const g = mount(); g.state.countdown = 0; g.state.spawnTimer = 100;
  g.state.player.x = 50; g.state.player.targetX = 50;
  g.state.items = [positive(g.state)]; g.frame(.016);
  const first = g.state.narrator; g.advance(.5);
  g.state.player.x = 750; g.state.player.targetX = 750;
  g.state.items = [positive(g.state)]; g.frame(.016);
  const next = g.state.narrator;
  assert.ok(next.id > first.id); assert.notEqual(next.text, first.text); assert.ok(next.age < .05);
  assert.equal(Object.hasOwn(next, 'x'), false); assert.equal(Object.hasOwn(next, 'y'), false);
  assert.equal(Array.isArray(next), false); // Exactly one card, never a stacking queue.
  g.advance(2); assert.ok(g.state.narrator); g.advance(.5); assert.equal(g.state.narrator, null); g.cleanup();
});
test('the real sound engine defines the defeat effect used by both lose paths', () => {
  const sandbox = { window: {} }; vm.createContext(sandbox); vm.runInContext(gameCode, sandbox);
  assert.equal(vm.runInContext('typeof sound.playDefeat', sandbox), 'function');
  assert.doesNotThrow(() => vm.runInContext('sound.playDefeat()', sandbox));
});

test('narrator notes clear before the finale and on terminal defeat', () => {
  const g = mount(); g.state.countdown = 0; g.state.spawnTimer = 100;
  g.state.items = [positive(g.state)]; g.frame(.016); assert.ok(g.state.narrator);
  g.state.elapsed = 29.99; g.frame(.02); assert.equal(g.state.narrator, null); g.cleanup();
  const defeat = mount(); defeat.state.countdown = 0; defeat.state.items = [positive(defeat.state)]; defeat.frame(.016);
  assert.ok(defeat.state.narrator); defeat.state.lives = 0; defeat.frame(.016);
  assert.equal(defeat.state.narrator, null); assert.equal(defeat.result.status, 'lose'); defeat.cleanup();
});

test('final-drop RNG covers both padded edges and the middle without cropping the sprite', () => {
  for (const width of [60, 100, 320, 800, 1440]) {
    const positions = [];
    for (const fraction of [0, .25, .5, .75, .999999]) {
      const g = mount({ width, random: () => fraction }); g.state.countdown = 0;
      g.state.finale = 'waiting'; g.state.finaleTimer = g.rules.finalePause; g.frame(.016);
      const girl = g.state.items[0];
      const halfWidth = g.rules.finalCharacterHalfWidth * girl.scale;
      assert.ok(girl.x - halfWidth >= 0); assert.ok(girl.x + halfWidth <= width);
      assert.equal(girl.dropFraction, fraction); positions.push(girl.x); g.cleanup();
    }
    if (width >= 320) { assert.ok(positions[0] < width / 2); assert.ok(positions[4] > width / 2); }
  }
});
test('resizing preserves the random drop fraction and keeps the final sprite within the new edges', () => {
  const g = mount({ width: 800, random: () => .2 }); g.state.countdown = 0;
  g.state.finale = 'waiting'; g.state.finaleTimer = g.rules.finalePause; g.frame(.016);
  for (const width of [390, 100, 60, 1200]) {
    g.resize(width); const girl = g.state.items[0];
    const padding = Math.min(width / 2, g.rules.finalCharacterHalfWidth + g.rules.finalDropEdgePadding);
    assert.ok(Math.abs(girl.x - (padding + .2 * Math.max(0, width - 2 * padding))) < .001);
    assert.ok(girl.x - g.rules.finalCharacterHalfWidth * girl.scale >= 0);
    assert.ok(girl.x + g.rules.finalCharacterHalfWidth * girl.scale <= width);
  }
  g.cleanup();
});

console.log(`${tests.length} game checks passed:\n${tests.map(name => `- ${name}`).join('\n')}`);
