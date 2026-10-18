import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/soundEngine';
import { Icon, CHARACTER_HAIR, CHARACTER_STYLE, GIRL_COLLAR } from './Artwork';
import { GAME_CONFIG, TEXT_CONTENT, formatText } from '../gameConfig';

const RULES = GAME_CONFIG.gameplay;
const WIN_SCORE_TARGET = RULES.roundTarget;
const FINALE_SECONDS = RULES.finaleSeconds;
const FINALE_PAUSE = RULES.finalePause;
const ITEM_TYPES = [
  { id: 'sunflower', points: 15, color: '#edc575', weight: 35 },
  { id: 'star', points: 20, color: '#eac77e', weight: 25 },
  { id: 'heart', points: 10, color: '#dfa0ab', weight: 25 },
  { id: 'sparkle', points: 25, color: '#b3a4cc', weight: 15 },
  { id: 'cloud', points: 0, color: '#aab9c9', weight: 12 },
  { id: 'sickness', points: 0, color: '#a6b991', weight: 8 },
  { id: 'thorn', points: 0, color: '#bc9ba8', weight: 8 },
];

// Audio is decorative: unsupported/blocked Web Audio must never interrupt
// collision handling or prevent a terminal state from reaching React.
function playGameSound(method, ...args) {
  try { sound[method](...args); }
  catch { /* Continue rendering the game/result even when audio is unavailable. */ }
}

// The sprite is drawn around its center, so reserve its half-width at BOTH
// edges. A stored uniform random fraction preserves the surprise on resize.
function finalDropX(width, fraction) {
  const padding = Math.min(width / 2, RULES.finalCharacterHalfWidth + RULES.finalDropEdgePadding);
  return padding + fraction * Math.max(0, width - padding * 2);
}

function readBestScore() {
  try { return Number(localStorage.getItem('smiley_highscore')) || 0; }
  catch { return 0; }
}

function fillRound(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function circle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-30, -6, -15, -27, 0, -13);
  ctx.bezierCurveTo(15, -27, 30, -6, 0, 12); ctx.fill(); ctx.restore();
}

function drawCharacter(ctx, girl = false) {
  const top = girl ? CHARACTER_STYLE.girlTop : CHARACTER_STYLE.guyTop;
  ctx.save();
  // Use the exact SVG silhouettes, collar and palette from the result artwork.
  ctx.fillStyle = CHARACTER_STYLE.hair;
  if (girl) ctx.fill(new Path2D(CHARACTER_HAIR.girlBack));
  fillRound(ctx, -20, 40, 16, 25, 7, CHARACTER_STYLE.pants);
  fillRound(ctx, 4, 40, 16, 25, 7, CHARACTER_STYLE.pants);
  fillRound(ctx, -23, 59, 21, 10, 5, CHARACTER_STYLE.shoes);
  fillRound(ctx, 2, 59, 21, 10, 5, CHARACTER_STYLE.shoes);
  fillRound(ctx, -27, 9, 54, 42, 16, top);
  ctx.strokeStyle = top; ctx.lineWidth = 15; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-19, 22); ctx.lineTo(-30, 38); ctx.moveTo(19, 22); ctx.lineTo(30, 38); ctx.stroke();
  circle(ctx, 0, -14, 29, '#f2cfb8');
  ctx.fillStyle = CHARACTER_STYLE.hair;
  ctx.fill(new Path2D(girl ? CHARACTER_HAIR.girlFront : CHARACTER_HAIR.boy));
  ctx.fillStyle = CHARACTER_STYLE.blush;
  for (const x of [-17, 17]) { ctx.beginPath(); ctx.ellipse(x, -5, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#745c59'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-12, -9); ctx.quadraticCurveTo(-8, -15, -4, -9);
  ctx.moveTo(5, -9); ctx.quadraticCurveTo(9, -15, 13, -9);
  ctx.moveTo(-4, 0); ctx.quadraticCurveTo(0, 5, 4, 0); ctx.stroke();
  if (girl) { ctx.fillStyle = CHARACTER_STYLE.collar; ctx.fill(new Path2D(GIRL_COLLAR)); }
  ctx.restore();
}

function drawItem(ctx, item) {
  ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.angle || 0);
  const id = item.id;
  if (id === 'girl') { ctx.scale(item.scale ?? 1, item.scale ?? 1); drawCharacter(ctx, true); }
  else if (id === 'heart') drawHeart(ctx, 0, 3, .9, item.color);
  else if (id === 'sunflower') {
    for (let i = 0; i < 10; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 5); ctx.fillStyle = '#f5cb79';
      ctx.beginPath(); ctx.ellipse(0, -16, 6, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    circle(ctx, 0, 0, 13, '#b88761');
    circle(ctx, -4, -1, 1.5, '#745b50'); circle(ctx, 4, -1, 1.5, '#745b50');
    ctx.strokeStyle = '#745b50'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 2, 3, 0, Math.PI); ctx.stroke();
  } else if (id === 'star' || id === 'sparkle') {
    const count = id === 'star' ? 5 : 4;
    ctx.fillStyle = item.color; ctx.beginPath();
    for (let i = 0; i < count * 2; i++) {
      const a = i * Math.PI / count - Math.PI / 2, r = i % 2 ? 10 : 24;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'cloud') {
    fillRound(ctx, -25, -4, 50, 23, 12, item.color);
    circle(ctx, -11, -6, 12, item.color); circle(ctx, 6, -11, 16, item.color);
    circle(ctx, -7, 4, 1.8, '#788898'); circle(ctx, 8, 4, 1.8, '#788898');
    ctx.strokeStyle = '#91a9bf'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const x of [-12, 1, 14]) { ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x - 3, 30); ctx.stroke(); }
  } else if (id === 'sickness') {
    ctx.strokeStyle = item.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); ctx.stroke(); }
    circle(ctx, 0, 0, 17, item.color); circle(ctx, -5, -3, 3, '#cfdbb9'); circle(ctx, 6, 6, 4, '#cfdbb9');
  } else {
    ctx.strokeStyle = '#a1b29a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 23); ctx.quadraticCurveTo(15, 0, 0, -8); ctx.stroke();
    circle(ctx, -4, -10, 15, item.color); circle(ctx, 4, -8, 12, '#d3b3bd');
  }
  ctx.restore();
}

function drawMeadow(ctx, width, height) {
  ctx.fillStyle = '#fbf3e7'; ctx.fillRect(0, 0, width, height);
  circle(ctx, width * .82, height * .21, 48, '#f5dfaa');
  circle(ctx, width * .82 - 10, height * .21 - 2, 2.5, '#bc9c74');
  circle(ctx, width * .82 + 10, height * .21 - 2, 2.5, '#bc9c74');
  ctx.strokeStyle = '#bc9c74'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(width * .82, height * .21 + 6, 6, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#e5ead4'; ctx.beginPath(); ctx.moveTo(0, height);
  ctx.lineTo(0, height - 140); ctx.quadraticCurveTo(width * .3, height - 260, width, height - 110); ctx.lineTo(width, height); ctx.fill();
  ctx.fillStyle = '#d5e2c8'; ctx.beginPath(); ctx.moveTo(0, height);
  ctx.lineTo(0, height - 90); ctx.quadraticCurveTo(width * .7, height - 200, width, height - 105); ctx.lineTo(width, height); ctx.fill();
  for (let i = 0; i < 14; i++) {
    const x = ((i * 173 + 45) % width), y = height - 18 - (i % 4) * 21;
    for (let j = 0; j < 5; j++) circle(ctx, x + Math.cos(j * Math.PI * .4) * 4, y + Math.sin(j * Math.PI * .4) * 4, 3.3, '#fff9e9');
    circle(ctx, x, y, 2.5, '#dec283');
  }
}

// Screen-level narrator UI: no player coordinates, canvas text metrics, or
// collision geometry are involved. One keyed card replaces the previous note.
export function NarratorMessage({ message, paused = false }) {
  if (!message) return null;
  return <aside className="narrator-anchor" aria-live="polite" aria-atomic="true" style={{ visibility: paused ? 'hidden' : undefined }}>
    <div key={message.id} className="narrator-card" style={{ animationDuration: `${RULES.narratorSeconds}s`, animationPlayState: paused ? 'paused' : 'running', '--narrator-rise': `${RULES.narratorRise}px` }}>
      <span className="narrator-speaker"><Icon name="heart" size={14}/>{TEXT_CONTENT.game.narratorLabel}</span>
      <p>{message.text}</p>
    </div>
  </aside>;
}

export default function CatchingGame({ level = 1, initialScore = 0, onGameEnd, onBackToIntro, soundMuted, onToggleSound }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const endRef = useRef(onGameEnd);
  endRef.current = onGameEnd;
  const [hud, setHud] = useState({ score: initialScore, roundScore: 0, lives: RULES.lives, combo: 1, remaining: FINALE_SECONDS, finale: null, countdown: RULES.countdown });
  const [narrator, setNarrator] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(false);
  const togglePause = () => { pausedRef.current = !pausedRef.current; setIsPaused(pausedRef.current); };

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    // Each remount starts a round, preserving only the parent's total and level.
    // Replay speed and spawn frequency compound independently: level 2 is
    // 1.6x as fast and spawns 1.55x as often; level 3 is 2.56x / 2.40x.
    // Hazard weights also rise, while the total score stays in the parent.
    const difficultyMultiplier = RULES.speedMultiplierPerLevel ** (level - 1);
    const spawnMultiplier = RULES.spawnMultiplierPerLevel ** (level - 1);
    const hazardMultiplier = 1 + (level - 1) * RULES.hazardStepPerLevel;
    const state = {
      width: 0, height: 0, elapsed: 0, countdown: RULES.countdown, spawnTimer: .3 / spawnMultiplier,
      score: initialScore, startingScore: initialScore, level, difficultyMultiplier, spawnMultiplier, hazardMultiplier, lives: RULES.lives, combo: 1, active: true, finale: null, finaleTimer: 0,
      items: [], particles: [], narrator: null, narratorId: 0, lastNarratorText: null, damage: 0, keys: { left: false, right: false },
      player: { x: 0, targetX: 0, y: 0 },
      stats: { sunflowers: 0, stars: 0, hearts: 0, sparkles: 0, maxCombo: 1 },
    };
    stateRef.current = state;
    const publish = () => setHud({ score: state.score, roundScore: state.score - state.startingScore, lives: state.lives, combo: state.combo, remaining: Math.max(0, Math.ceil(FINALE_SECONDS - state.elapsed)), finale: state.finale, countdown: Math.max(0, Math.ceil(state.countdown)) });
    const resize = () => {
      // Physics stays in CSS pixels; only the backing buffer scales for Retina.
      const { width, height } = canvas.getBoundingClientRect();
      const previousWidth = state.width || width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.player.x = state.width ? state.player.x / previousWidth * width : width / 2;
      state.player.targetX = state.player.x;
      state.width = width; state.height = height; state.player.y = height - 110;
      state.items.forEach(item => {
        if (item.id === 'girl') {
          item.x = finalDropX(width, item.dropFraction ?? item.x / previousWidth);
          item.scale = Math.min(1, width / (RULES.finalCharacterHalfWidth * 2));
        } else item.x = item.x / previousWidth * width;
      });
    };
    resize();
    const setKey = (e, pressed) => {
      if (!state.active) return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault(); state.keys[['ArrowLeft', 'a', 'A'].includes(e.key) ? 'left' : 'right'] = pressed;
      }
      if (pressed && !e.repeat && ['Escape', 'p', 'P'].includes(e.key)) togglePause();
    };
    const keyDown = e => setKey(e, true), keyUp = e => setKey(e, false);
    const blur = () => { state.keys.left = false; state.keys.right = false; if (state.active) { pausedRef.current = true; setIsPaused(true); } };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('resize', resize); window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    // Terminal transition: active -> win/lose/missed-catch. Mark inactive BEFORE notifying
    // React so no later frame can score, finish twice, or emit another bubble.
    let animationId = null;
    const finish = status => {
      if (!state.active) return;
      state.active = false;
      state.narrator = null; setNarrator(null);
      cancelAnimationFrame(animationId);
      animationId = null;
      state.keys.left = false; state.keys.right = false;
      const isNewBest = state.score > readBestScore();
      if (isNewBest) { try { localStorage.setItem('smiley_highscore', String(state.score)); } catch { /* Private browsing may disable storage. */ } }
      // Commit the result first; a failed sound must never leave a frozen canvas.
      endRef.current({ status, level, finalScore: state.score, roundScore: state.score - state.startingScore, maxCombo: state.stats.maxCombo, stats: { ...state.stats }, isNewBest });
      playGameSound('stopBgm');
      playGameSound(status === 'win' ? 'playVictory' : 'playDefeat');
    };
    // Round state machine: normal (null) -> waiting -> falling -> win.
    // Missing the girl ends the round as missed-catch; losing all lives in normal
    // ends it as lose. These are separate terminal outcomes, with separate UI.
    // Clear every normal item/effect atomically so hazards cannot hit in finale.
    const beginFinale = () => {
      if (state.finale) return;
      state.finale = 'waiting'; state.finaleTimer = 0;
      state.items = []; state.particles = []; state.narrator = null; setNarrator(null); state.damage = 0; publish();
    };
    const spawnGirl = () => {
      state.finale = 'falling';
      // Use the highest possible ordinary speed in this round, plus 18%. The
      // final drop is always faster, even on tall screens or an early score win.
      const dropFraction = Math.random();
      state.items = [{ id: 'girl', dropFraction, x: finalDropX(state.width, dropFraction), scale: Math.min(1, state.width / (RULES.finalCharacterHalfWidth * 2)), y: -75, angle: 0, speed: (RULES.baseSpeed + RULES.speedVariation + FINALE_SECONDS * RULES.speedPerSecond) * difficultyMultiplier * RULES.girlSpeedBoost }];
      publish();
    };
    const spawnItem = () => {
      // Positive weights stay fixed while hazards gain weight on every level.
      const itemWeight = item => item.weight * (item.points > 0 ? 1 : hazardMultiplier);
      let weight = Math.random() * ITEM_TYPES.reduce((sum, item) => sum + itemWeight(item), 0);
      const type = ITEM_TYPES.find(item => { weight -= itemWeight(item); return weight < 0; }) || ITEM_TYPES[0];
      state.items.push({ ...type, x: 35 + Math.random() * Math.max(1, state.width - 70), y: -35, speed: (RULES.baseSpeed + Math.random() * RULES.speedVariation + state.elapsed * RULES.speedPerSecond) * difficultyMultiplier, angle: 0, phase: Math.random() * Math.PI * 2 });
    };
    let lastTime = null, lastSecond = FINALE_SECONDS;
    const frame = now => {
      if (!state.active) return;
      // Seconds-based integration keeps spawn/narrator/fall timing consistent
      // across refresh rates. Cap large gaps so background throttling cannot
      // teleport items past the catcher on the next visible frame.
      const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, .05);
      lastTime = now;
      // Guard zero/negative health independently of the collision branch.
      if (state.lives <= 0) { finish('lose'); return; }
      if (!pausedRef.current) {
        if (state.countdown > 0) {
          const previous = Math.ceil(state.countdown); state.countdown = Math.max(0, state.countdown - dt);
          if (previous !== Math.ceil(state.countdown)) publish();
        } else {
          const player = state.player;
          state.elapsed += dt; state.damage = Math.max(0, state.damage - dt);
          if (!state.finale && state.elapsed >= FINALE_SECONDS) beginFinale();
          if (state.finale === 'waiting') { state.finaleTimer += dt; if (state.finaleTimer >= FINALE_PAUSE) spawnGirl(); }
          if (state.keys.left || state.keys.right) player.targetX += ((state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0)) * 460 * dt;
          player.targetX = Math.max(38, Math.min(state.width - 38, player.targetX));
          player.x += (player.targetX - player.x) * (1 - Math.exp(-16 * dt));
          if (!state.finale) { state.spawnTimer -= dt; if (state.spawnTimer <= 0) { spawnItem(); state.spawnTimer = RULES.spawnInterval / spawnMultiplier; } }
          for (let i = state.items.length - 1; i >= 0; i--) {
            const item = state.items[i], previousY = item.y;
            item.y += item.speed * dt;
            if (item.id !== 'girl') { item.x += Math.sin(state.elapsed * 2 + item.phase) * 16 * dt; item.angle = Math.sin(state.elapsed + item.phase) * .15; }
            // Swept vertical collision: test the segment from previousY to the
            // new Y against the basket band, not just the current point. This
            // catches fast items even if one frame crosses the entire band.
            // Horizontal tolerance is wider for the girl's larger silhouette.
            const catchY = player.y + 15;
            const inReach = Math.abs(item.x - player.x) < (item.id === 'girl' ? 54 : 43);
            if (inReach && item.y >= catchY - 25 && previousY <= catchY + 25) {
              if (item.id === 'girl') { state.items = []; finish('win'); return; }
              if (item.points > 0) {
                state.score += item.points * state.combo; state.combo = Math.min(8, state.combo + 1);
                state.stats.maxCombo = Math.max(state.stats.maxCombo, state.combo);
                state.stats[{ sunflower: 'sunflowers', star: 'stars', heart: 'hearts', sparkle: 'sparkles' }[item.id]]++;
                playGameSound('playCatch', state.combo);
                // Bea narrates only level 1. A new catch replaces the single
                // active card and restarts its pop/float/fade animation, so a
                // rapid streak never stacks competing text. Avoid repeating
                // the previous line when multiple configured choices exist.
                if (level === 1) {
                  const messages = TEXT_CONTENT.game.narratorMessages;
                  const alternatives = messages.filter(text => text !== state.lastNarratorText);
                  const choices = alternatives.length ? alternatives : messages;
                  if (choices.length) {
                    const text = choices[Math.floor(Math.random() * choices.length)];
                    state.lastNarratorText = text;
                    state.narrator = { id: ++state.narratorId, text, age: 0 };
                    setNarrator(state.narrator);
                  }
                }

                for (let j = 0; j < 9; j++) state.particles.push({ x: item.x, y: item.y, vx: (Math.random() - .5) * 120, vy: -30 - Math.random() * 90, life: .7, color: item.color });
                if (state.score - state.startingScore >= WIN_SCORE_TARGET) { beginFinale(); break; }
              } else {
                state.lives--; state.combo = 1; state.damage = .3; playGameSound('playHurt');
                if (state.lives <= 0) { finish('lose'); return; }
              }
              state.items.splice(i, 1); publish();
            } else if (item.id === 'girl' && item.y > state.height) {
              // A final miss is terminal the instant her origin crosses the
              // canvas bottom. Do not retry, deduct hearts, or reset the score.
              state.items = [];
              finish('missed-catch');
              return;
            } else if (item.y > state.height + 80) {
              if (item.points > 0 && state.combo > 1) { state.combo = 1; publish(); }
              state.items.splice(i, 1);
            }
          }
          // Expiry uses simulation seconds so pausing freezes the lifetime too.
          // React only updates on catch or dismissal, never once per frame.
          if (state.narrator) {
            state.narrator.age += dt;
            if (state.narrator.age >= RULES.narratorSeconds) {
              state.narrator = null;
              setNarrator(null);
            }
          }
          state.particles = state.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
          const second = Math.max(0, Math.ceil(FINALE_SECONDS - state.elapsed));
          if (second !== lastSecond) { lastSecond = second; publish(); }
        }
      }
      drawMeadow(ctx, state.width, state.height);
      state.items.forEach(item => drawItem(ctx, item));
      state.particles.forEach(p => { ctx.globalAlpha = p.life / .7; circle(ctx, p.x, p.y, 4, p.color); }); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(state.player.x, state.player.y);
      ctx.fillStyle = '#a0b18d35'; ctx.beginPath(); ctx.ellipse(0, 66, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
      drawCharacter(ctx);
      fillRound(ctx, -30, 27, 60, 24, 10, '#d2ae86');
      ctx.strokeStyle = '#e9c9a2'; ctx.lineWidth = 2;
      for (const y of [33, 41]) { ctx.beginPath(); ctx.moveTo(-25, y); ctx.lineTo(25, y); ctx.stroke(); }
      for (const x of [-18, -6, 6, 18]) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 47); ctx.stroke(); }
      ctx.restore();
      if (state.damage > 0) { ctx.fillStyle = `rgba(218,151,161,${state.damage * .6})`; ctx.fillRect(0, 0, state.width, state.height); }
      if (state.active) animationId = requestAnimationFrame(frame);
    };
    animationId = requestAnimationFrame(frame);
    return () => {
      // One effect owns all animation/listeners. Remounting for a harder round
      // disposes the previous loop before the new state starts.
      state.active = false; cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const move = e => {
    if (!stateRef.current || pausedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.player.targetX = e.clientX - rect.left;
  };
  const backToIntro = () => onBackToIntro({ score: stateRef.current?.score ?? initialScore });
  const text = TEXT_CONTENT.game;
  const controls = TEXT_CONTENT.controls;
  return <div className="game-screen" onPointerMove={move} onPointerDown={e => { if (e.target === canvasRef.current) { e.currentTarget.setPointerCapture(e.pointerId); move(e); } }}>
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} aria-label={text.canvasLabel}/>
    <div className="game-hud">
      <div className="hud-card"><div className="score-line" aria-label={formatText(text.totalScore, { score: hud.score })}><svg width="28" height="28" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="26" fill="#f5cb79"/><circle r="16" fill="#b88761"/></svg>{hud.score}<small>{formatText(text.levelProgress, { level, points: hud.roundScore, target: WIN_SCORE_TARGET })}<br/>{hud.finale ? text.lastCatch : formatText(text.remaining, { seconds: hud.remaining })}</small></div><div className="score-progress"><span style={{ width: `${Math.min(100, Math.max(hud.roundScore / WIN_SCORE_TARGET, (FINALE_SECONDS - hud.remaining) / FINALE_SECONDS) * 100)}%` }}/></div></div>
      <div className="hud-card hud-lives" aria-label={formatText(text.lives, { count: hud.lives })}>{Array.from({ length: RULES.lives }, (_, i) => <span key={i} style={{ opacity: i < hud.lives ? 1 : .2 }}><Icon name="heart"/></span>)}</div>
      <div className="game-actions"><button className="icon-button" onClick={togglePause} aria-label={isPaused ? controls.resume : controls.pause}><Icon name={isPaused ? 'play' : 'pause'}/></button><button className="icon-button" onClick={onToggleSound} aria-label={soundMuted ? controls.unmute : controls.mute}><Icon name={soundMuted ? 'muted' : 'sound'}/></button><button className="icon-button" onClick={backToIntro} aria-label={controls.returnToLetter}><Icon name="home"/></button></div>
    </div>
    <NarratorMessage message={narrator} paused={isPaused}/>
    {hud.finale && <div className="finale-message" role="status"><h2>{hud.finale === 'waiting' ? text.waitingTitle : text.fallingTitle}</h2><p>{hud.finale === 'waiting' ? text.waitingCopy : text.fallingCopy}</p></div>}
    <div className="game-guidance">{hud.combo > 1 && !hud.finale ? formatText(text.streak, { combo: hud.combo }) : ''}{text.controls}</div>
    {hud.countdown > 0 && !isPaused && <div className="game-overlay" role="status"><p className="eyebrow">{text.countdownTitle}</p><h2>{hud.countdown}</h2><p>{text.countdownCopy}</p></div>}
    {isPaused && <div className="game-overlay"><h2>{text.pauseTitle}</h2><p>{text.pauseCopy}</p><button className="primary-button" onClick={togglePause}>{text.resume}<Icon name="play" size={16}/></button><button className="secondary-button" onClick={backToIntro}>{text.back}</button></div>}
  </div>;
}
