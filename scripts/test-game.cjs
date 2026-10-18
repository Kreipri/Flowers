// Usage: node scripts/test-game.cjs /path/to/babel.min.js
// Uses the same Babel standalone compiler as index.html; no npm dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const compiler = {};
vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), compiler);
const root = path.resolve(__dirname, '..');
const source = ['src/gameConfig.js', 'src/components/Artwork.jsx', 'src/components/CatchingGame.jsx']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^import .*\n/gm, '').replace(/^export default /gm, '').replace(/^export /gm, '')).join('\n');
const gameCode = compiler.Babel.transform(source, { presets: [['react', { runtime: 'classic' }]] }).code;

function mount({ width = 800, height = 700, storageBlocked = false, level = 1, initialScore = 0, random = () => .5 } = {}) {
  let nextFrame, now = 0, cleanup, result, renders = [], refs = [], effects = [], refIndex = 0;
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
    sound: new Proxy({}, { get: () => () => {} }),
    localStorage: { getItem: () => { if (storageBlocked) throw Error('blocked'); return '0'; }, setItem: () => { if (storageBlocked) throw Error('blocked'); } },
    window: { devicePixelRatio: 2, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
    document: { hidden: false, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) },
    requestAnimationFrame: fn => { nextFrame = fn; return 1; }, cancelAnimationFrame: () => { nextFrame = null; },
  };
  vm.createContext(sandbox); vm.runInContext(gameCode, sandbox);
  const tree = sandbox.CatchingGame({ level, initialScore, onGameEnd: value => { result = value; }, onBackToIntro() {}, onToggleSound() {}, soundMuted: false });
  cleanup = effects[0]();
  const frame = dt => { now += dt * 1000; const fn = nextFrame; nextFrame = null; if (fn) fn(now); };
  frame(0);
  return { state: refs[1].current, frame, advance(seconds, hz = 60) { for (let i = 0; i < Math.ceil(seconds * hz); i++) frame(1 / hz); }, get result() { return result; }, tree, refs, renders, listeners, cleanup };
}

const tests = [];
function test(name, fn) { fn(); tests.push(name); }
function positive(state, points = 15) { return { id: 'sunflower', points, color: '#edc575', x: state.player.x, y: state.player.y + 15, speed: 0, phase: 0 }; }

test('30-second trigger clears all items and particles, waits, then drops from center', () => {
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
test('a missed final catch retries at center without losing a life', () => {
  const g = mount(); g.state.countdown = 0; g.state.finale = 'falling';
  g.state.items = [{ id: 'girl', x: 50, y: 800, speed: 100 }]; g.frame(.016);
  assert.equal(g.state.finale, 'waiting'); assert.equal(g.state.lives, 3); g.advance(1.3);
  assert.equal(g.state.items[0].x, 400); assert.equal(g.state.items.length, 1); g.cleanup();
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

test('first-level positive catches spawn configured bubbles that expire in 1.6 seconds', () => {
  const g = mount(); g.state.countdown = 0; g.state.spawnTimer = 100;
  g.state.items = [positive(g.state)]; g.frame(.016);
  assert.equal(g.state.bubbles.length, 1);
  assert.equal(g.state.bubbles[0].text, 'You caught a little joy!');
  g.advance(1); assert.equal(g.state.bubbles.length, 1);
  g.advance(.7); assert.equal(g.state.bubbles.length, 0); g.cleanup();
});
test('bubbles freeze on pause and never spawn on level 2 or later', () => {
  const first = mount(); first.state.countdown = 0; first.state.items = [positive(first.state)]; first.frame(.016);
  const age = first.state.bubbles[0].age; first.listeners.get('blur')(); first.advance(2);
  assert.equal(first.state.bubbles[0].age, age); first.cleanup();
  for (const level of [2, 3, 10]) {
    const g = mount({ level }); g.state.countdown = 0; g.state.items = [positive(g.state)]; g.frame(.016);
    assert.equal(g.state.bubbles.length, 0); assert.equal(g.state.score, 15); g.cleanup();
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
    const g = mount({ level }); g.state.countdown = 0; g.state.elapsed = 29.99; g.advance(1.4);
    const ordinaryMax = (100 + 50 + 30 * 1.5) * g.state.difficultyMultiplier;
    assert.ok(g.state.items[0].speed > ordinaryMax);
    assert.ok(Math.abs(g.state.items[0].speed / ordinaryMax - 1.18) < .001); g.cleanup();
  }
});
test('swept collision catches a fast item that crosses the entire basket in one frame', () => {
  const g = mount({ level: 8 }); g.state.countdown = 0;
  g.state.items = [{ ...positive(g.state), y: g.state.player.y - 100, speed: 6000 }];
  g.frame(.05); assert.equal(g.state.score, 15); assert.equal(g.state.items.length, 0); g.cleanup();
});

console.log(`${tests.length} game checks passed:\n${tests.map(name => `- ${name}`).join('\n')}`);
