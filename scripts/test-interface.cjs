// Usage: node scripts/test-interface.cjs /path/to/babel.min.js
// Exercise actual React handlers with a small hook runner; no browser dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const compiler = {};
vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), compiler);
const root = path.resolve(__dirname, '..');
const files = ['src/gameConfig.js', 'src/components/Artwork.jsx', 'src/components/IntroScreen.jsx', 'src/components/GameOverModal.jsx', 'src/App.jsx'];
const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^import .*\n/gm, '').replace(/^export default /gm, '').replace(/^export /gm, '')).join('\n');
const compiled = compiler.Babel.transform(source, { presets: [['react', { runtime: 'classic' }]], ast: true });

function mount(name, props = {}, reducedMotion = false) {
  let cursor, tree, pendingEffects, timerId = 0;
  const slots = [], timers = new Map();
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: initial => {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useRef: initial => { const index = cursor++; return slots[index] ||= { current: initial }; },
    useCallback: fn => { const index = cursor++; slots[index] ||= { callback: fn }; return slots[index].callback; },
    useEffect: (effect, deps) => {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        pendingEffects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; });
      }
    },
  };
  const sandbox = {
    React: react, ...react, CatchingGame: function CatchingGame() {},
    sound: new Proxy({}, { get: () => () => {} }),
    window: { matchMedia: () => ({ matches: reducedMotion }) }, document: { title: '' },
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: id => timers.delete(id),
  };
  vm.createContext(sandbox); vm.runInContext(compiled.code, sandbox);
  const render = () => { cursor = 0; pendingEffects = []; tree = sandbox[name](props); pendingEffects.forEach(fn => fn()); return tree; };
  render();
  return { render, get tree() { return tree; }, timers, fireTimers() { const tasks = [...timers.values()]; timers.clear(); tasks.forEach(task => task.fn()); }, cleanup() { slots.forEach(slot => slot?.cleanup?.()); }, sandbox };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...(tree.children || []).flatMap(nodes)];
}
function find(app, predicate) { return nodes(app.tree).find(predicate); }
function component(app, name) { return find(app, node => node.type?.name === name); }
function track(app) { return find(app, node => node.props.className === 'envelope-track'); }
const tests = [];
function test(name, fn) { fn(); tests.push(name); }

test('actual App handlers preserve scores and advance levels through win, loss, and letter navigation', () => {
  const app = mount('App');
  component(app, 'IntroScreen').props.onStartGame(); app.render();
  let game = component(app, 'CatchingGame'); assert.equal(game.props.level, 1); assert.equal(game.props.initialScore, 0);
  game.props.onGameEnd({ status: 'win', finalScore: 650, maxCombo: 3, stats: {} }); app.render();
  component(app, 'GameOverModal').props.onPlayAgain(); app.render();
  game = component(app, 'CatchingGame'); assert.equal(game.props.level, 2); assert.equal(game.props.initialScore, 650);
  game.props.onGameEnd({ status: 'lose', finalScore: 735, maxCombo: 2, stats: {} }); app.render();
  component(app, 'GameOverModal').props.onPlayAgain(); app.render();
  game = component(app, 'CatchingGame'); assert.equal(game.props.level, 3); assert.equal(game.props.initialScore, 735);
  game.props.onBackToIntro({ score: 800 }); app.render();
  component(app, 'IntroScreen').props.onStartGame(); app.render();
  game = component(app, 'CatchingGame'); assert.equal(game.props.level, 4); assert.equal(game.props.initialScore, 800); app.cleanup();
});
test('letter waits for the paper slide and scale before revealing the readable modal', () => {
  const app = mount('IntroScreen');
  assert.equal(track(app).props['data-state'], 'tucked');
  find(app, node => node.props.className === 'bouquet-trigger').props.onClick(); app.render();
  assert.equal(track(app).props['data-state'], 'launching');
  track(app).props.onAnimationEnd({ animationName: 'envelope-emerge' }); app.render();
  find(app, node => node.props['aria-label'] === 'Open your letter').props.onClick(); app.render();
  assert.equal(track(app).props['data-state'], 'opening'); assert.equal(component(app, 'OpenLetterModal'), undefined);
  const envelope = find(app, node => node.props['aria-label'] === 'Open your letter');
  const layers = envelope.children.map(child => child.props.className);
  assert.deepEqual(layers.slice(0, 4), ['envelope-back', 'envelope-paper', 'envelope-front', 'envelope-lid']);
  track(app).props.onAnimationEnd({ animationName: 'lid-open' }); app.render();
  assert.equal(component(app, 'OpenLetterModal'), undefined);
  track(app).props.onAnimationEnd({ animationName: 'paper-reveal' }); app.render();
  assert.ok(component(app, 'OpenLetterModal')); assert.equal(app.timers.size, 0);
  component(app, 'OpenLetterModal').props.onClose(); app.render();
  assert.equal(track(app).props['data-state'], 'interactive'); app.cleanup();
});
test('reduced-motion and cancelled animations still complete the intro without stale timers', () => {
  for (const reduced of [false, true]) {
    const app = mount('IntroScreen', {}, reduced);
    find(app, node => node.props.className === 'bouquet-trigger').props.onClick(); app.render();
    if (!reduced) { app.fireTimers(); app.render(); }
    assert.equal(track(app).props['data-state'], 'interactive');
    find(app, node => node.props['aria-label'] === 'Open your letter').props.onClick(); app.render();
    assert.equal([...app.timers.values()][0].ms, reduced ? 0 : 1800);
    app.fireTimers(); app.render(); assert.ok(component(app, 'OpenLetterModal')); app.cleanup(); assert.equal(app.timers.size, 0);
  }
});
test('win artwork uses separate upright characters and labels the next level', () => {
  const app = mount('GameOverModal', { status: 'win', level: 2, finalScore: 800, maxCombo: 4, stats: {} });
  const characters = nodes(app.tree).filter(node => node.type?.name === 'Character');
  assert.equal(characters.length, 2); assert.equal(characters[0].props.y, characters[1].props.y);
  assert.ok(characters[1].props.x - characters[0].props.x > 80);
  const button = find(app, node => node.props.className === 'primary-button');
  assert.equal(button.children[0], 'Play Again · Level 3'); app.cleanup();
});
test('all visible JSX text and accessibility copy are centralized', () => {
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText') assert.equal(node.value.trim(), '', `Hard-coded UI text: ${node.value}`);
    if (node.type === 'JSXAttribute' && ['aria-label', 'title', 'placeholder', 'alt'].includes(node.name?.name)) {
      assert.notEqual(node.value?.type, 'StringLiteral', `Hard-coded accessible text: ${node.name.name}`);
    }
    Object.values(node).forEach(value => { if (Array.isArray(value)) value.forEach(visit); else if (typeof value === 'object') visit(value); });
  }
  visit(compiled.ast);
  const gameAst = compiler.Babel.transform(fs.readFileSync(path.join(root, 'src/components/CatchingGame.jsx'), 'utf8'), { presets: [['react', { runtime: 'classic' }]], ast: true }).ast;
  visit(gameAst);
});
console.log(`${tests.length} interface checks passed:\n${tests.map(name => `- ${name}`).join('\n')}`);
