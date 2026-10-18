// Usage: node scripts/test-interface.cjs /path/to/babel.min.js
// Exercise actual React handlers with a small hook runner; no browser dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const compiler = {};
vm.runInNewContext(fs.readFileSync(process.argv[2], 'utf8'), compiler);
const root = path.resolve(__dirname, '..');
const files = ['src/gameConfig.js', 'src/components/Artwork.jsx', 'src/components/IntroScreen.jsx', 'src/components/CatchingGame.jsx', 'src/components/GameOverModal.jsx', 'src/App.jsx'];
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
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    document: { title: '', body: {}, addEventListener() {}, removeEventListener() {} },
    ReactDOM: { createPortal: (child, container) => ({ type: 'portal', props: { container }, children: [child] }) },
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
assert.equal(track(app).props['data-state'], 'arriving');
  assert.equal(track(app).props.hidden, true);
  find(app, node => node.props.className === 'bouquet-layer bouquet-front').props.onAnimationEnd({ animationName: 'bouquet-arrive' }); app.render();
  assert.equal(track(app).props['data-state'], 'tucked');
  assert.equal(track(app).props.hidden, true);
  find(app, node => node.props.className === 'bouquet-trigger').props.onClick(); app.render();
assert.equal(track(app).props['data-state'], 'zooming');
  assert.equal(track(app).props.hidden, true);
  find(app, node => node.props.className === 'bouquet-layer bouquet-front').props.onAnimationEnd({ animationName: 'bouquet-zoom' }); app.render();
  assert.equal(track(app).props['data-state'], 'launching');
  assert.equal(track(app).props.hidden, false);
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
    app.fireTimers(); app.render(); // Arrival completes, including reduced motion.
    find(app, node => node.props.className === 'bouquet-trigger').props.onClick(); app.render();
    app.fireTimers(); app.render(); // Zoom completes before the envelope appears.
    assert.equal(track(app).props.hidden, false);
    app.fireTimers(); app.render(); // Launch completes before the letter can open.
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
test('paper is concealed and clipped while the envelope is closed', () => {
  const app = mount('IntroScreen');
  const css = vm.runInContext('introStyles', app.sandbox);
  const paper = css.match(/\.envelope-paper\{([^}]+)\}/)[1];
  assert.ok(paper.includes('visibility:hidden')); assert.ok(paper.includes('opacity:0'));
  assert.ok(paper.includes('scale(.85)'));
  assert.ok(css.includes('.soft-envelope{isolation:isolate;overflow:hidden}'));
  assert.ok(css.includes('.is-opening{overflow:visible}'));
  assert.ok(css.includes('.envelope-track[hidden]{display:none}')); app.cleanup();
});
test('both sprites have solid black hair, dark trousers/shoes, and distinct tops', () => {
  for (const girl of [false, true]) {
    const app = mount('Character', { girl });
    const hair = vm.runInContext('CHARACTER_HAIR', app.sandbox);
    const paths = nodes(app.tree).filter(node => node.type === 'path');
    const hairPaths = paths.filter(node => Object.values(hair).includes(node.props.d));
    assert.equal(hairPaths.length, girl ? 2 : 1);
    hairPaths.forEach(node => { assert.equal(node.props.fill, '#000000'); assert.equal(node.props.stroke, undefined); });
    const collar = paths.find(node => node.props.d === vm.runInContext('GIRL_COLLAR', app.sandbox));
    assert.equal(Boolean(collar), girl);
    if (girl) assert.equal(collar.props.fill, '#fffaf4');
    const rectangles = nodes(app.tree).filter(node => node.type === 'rect');
    assert.equal(rectangles.filter(node => node.props.fill === '#222229').length, 2);
    assert.equal(rectangles.filter(node => node.props.fill === '#111111').length, 2);
    assert.ok(rectangles.some(node => node.props.fill === (girl ? '#555661' : '#a6a9b1')));
    app.cleanup();
  }
});

test('health defeat and missed-catch defeat have separate headings and graphics', () => {
  const normal = mount('GameOverModal', { status: 'lose', level: 1, finalScore: 25, maxCombo: 1, stats: {} });
  const missed = mount('GameOverModal', { status: 'missed-catch', level: 2, finalScore: 650, maxCombo: 1, stats: {} });
  assert.equal(find(normal, node => node.props.id === 'result-title').children[0], 'Game Over');
  assert.equal(find(missed, node => node.props.id === 'result-title').children[0], 'bea fucking died lol');
  assert.notEqual(find(normal, node => node.props.className === 'result-art').props['aria-label'], find(missed, node => node.props.className === 'result-art').props['aria-label']);
  normal.cleanup(); missed.cleanup();
});
test('letter backdrop portals to body and covers the viewport without a transform animation', () => {
  const app = mount('OpenLetterModal', { onClose() {}, onStartGame() {} });
  assert.equal(app.tree.type, 'portal'); assert.equal(app.tree.props.container, app.sandbox.document.body);
  const css = vm.runInContext('introStyles', app.sandbox);
  const overlay = css.match(/\.letter-overlay\{([^}]+)\}/)[1];
  for (const rule of ['position:fixed', 'inset:0', 'width:100vw', 'height:100vh', 'height:100dvh', 'z-index:50']) assert.ok(overlay.includes(rule));
  assert.ok(overlay.includes('animation:backdrop-reveal')); assert.ok(!overlay.includes('transform:'));
  const backdropAnimation = css.match(/@keyframes backdrop-reveal\{(.*?)\}\}/s)[1];
  assert.ok(!backdropAnimation.includes('transform')); app.cleanup();
});

test('both losses commit their payload and mount a body-level modal over an inert canvas', () => {
  for (const status of ['lose', 'missed-catch']) {
    const app = mount('App'); component(app, 'IntroScreen').props.onStartGame(); app.render();
    component(app, 'CatchingGame').props.onGameEnd({ status, finalScore: 725 }); app.render();
    const modal = component(app, 'GameOverModal'); assert.ok(modal); assert.equal(modal.props.status, status);
    assert.equal(modal.props.finalScore, 725);
    assert.ok(find(app, node => node.props.inert === '' && node.props['aria-hidden'] === true));
    const rendered = mount('GameOverModal', modal.props);
    assert.equal(rendered.tree.type, 'portal'); assert.equal(rendered.tree.props.container, rendered.sandbox.document.body);
    assert.equal(find(rendered, node => node.props.role === 'dialog').props['aria-modal'], 'true');
    const css = vm.runInContext('introStyles', rendered.sandbox);
    const overlay = css.match(/\.result-screen\{([^}]+)\}/)[1];
    for (const rule of ['position:fixed', 'inset:0', 'z-index:100', 'width:100vw', 'height:100dvh']) assert.ok(overlay.includes(rule));
    rendered.cleanup(); app.cleanup();
  }
});
test('special loss artwork shows the fallen girl with her outfit in a deep red puddle', () => {
  const app = mount('FallenGirl');
  assert.ok(find(app, node => node.type === 'path' && node.props.fill === '#8b243b'));
  const character = component(app, 'Character'); assert.equal(character.props.girl, true); assert.equal(character.props.fallen, true);
  assert.ok(find(app, node => node.props.transform?.includes('rotate(-90)'))); app.cleanup();
});

test('narrator cards identify Bea and anchor to the viewport with readable responsive text', () => {
  const app = mount('NarratorMessage', { message: { id: 1, text: 'Picked just for you!' } });
  const speaker = find(app, node => node.props.className === 'narrator-speaker');
  assert.equal(speaker.children[1], 'A NOTE FROM BEA');
  const card = find(app, node => node.props.className === 'narrator-card');
  assert.equal(card.props.style.animationDuration, '2.4s');
  assert.equal(find(app, node => node.type === 'p').children[0], 'Picked just for you!');
  assert.equal(app.tree.props['aria-live'], 'polite');
  const css = vm.runInContext('introStyles', app.sandbox);
  const anchor = css.match(/\.narrator-anchor\{([^}]+)\}/)[1];
  for (const rule of ['position:fixed', 'left:50%', 'top:clamp(', 'pointer-events:none']) assert.ok(anchor.includes(rule));
  assert.ok(css.includes('clamp(24px,4.7vw,34px)')); assert.ok(css.includes('.narrator-card{animation:none!important;opacity:1;transform:none}'));
  app.cleanup();
  const paused = mount('NarratorMessage', { message: { id: 2, text: 'My favorite sunshine.' }, paused: true });
  assert.equal(find(paused, node => node.props.className === 'narrator-card').props.style.animationPlayState, 'paused');
  paused.cleanup();
  const absent = mount('NarratorMessage', { message: null }); assert.equal(absent.tree, null); absent.cleanup();
});

test('global viewport stays clipped while letter and result cards can scroll internally', () => {
  const app = mount('App'); const css = vm.runInContext('introStyles', app.sandbox);
  for (const selector of ['html,body,#root', '.app-shell', '.game-screen']) {
    const rule = css.slice(css.indexOf(selector + '{')).split('}')[0];
    assert.ok(rule.includes('overflow:hidden'), selector);
  }
  for (const selector of ['.designed-letter', '.result-screen']) {
    const rule = css.slice(css.indexOf(selector + '{')).split('}')[0];
    assert.ok(rule.includes('overflow-y:auto'), selector);
  }
  assert.ok(css.includes('.intro-scene,.game-screen{animation:scene-fade-in'));
  assert.ok(css.includes('.result-screen{animation:backdrop-reveal'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  app.cleanup();
});
test('application source has no debug logging, literal canvas text, or duplicate critical copy', () => {
  for (const file of files.filter(file => file !== 'src/gameConfig.js')) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/console\.(log|debug|info)\s*\(/.test(content), file);
    assert.ok(!/\.fillText\(\s*['"`]/.test(content), file);
    for (const text of ['Just because...', 'bea fucking died lol', 'Game Over']) assert.ok(!content.includes(text), `${file}: ${text}`);
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/)[1];
  assert.ok(script.indexOf('const GAME_CONFIG') < script.indexOf('function App'));
});

console.log(`${tests.length} interface checks passed:\n${tests.map(name => `- ${name}`).join('\n')}`);
