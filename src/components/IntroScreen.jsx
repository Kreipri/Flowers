import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { sound } from '../utils/soundEngine';
import { Bouquet, Flower, Heart, Icon } from './Artwork';
import { GAME_CONFIG, TEXT_CONTENT, formatText } from '../gameConfig';

export function OpenLetterModal({ onStartGame, onClose }) {
  const letterRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    letterRef.current?.focus();
    const handleKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      // Keep keyboard focus on the letter's two actions until it closes.
      const controls = letterRef.current.querySelectorAll('button');
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === letterRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [onClose]);
  const text = TEXT_CONTENT.letter;
  // Portal to body: fixed backdrop must never inherit the intro's overflow
  // clipping, isolation, or any animated bouquet transform.
  return ReactDOM.createPortal(<div className="letter-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={letterRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="letter-title" className="designed-letter custom-scrollbar">
      <button className="letter-close" onClick={onClose} aria-label={TEXT_CONTENT.controls.closeLetter}>{TEXT_CONTENT.symbols.close}</button>
      <svg className="letter-flower" viewBox="-50 -50 100 100" aria-hidden="true"><Flower size={.8}/></svg>
      <p className="eyebrow">{text.eyebrow}</p>
      <h2 id="letter-title">{text.greeting}</h2>
      {text.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <p className="letter-script">{text.verse}</p>
      <p>{text.invitation}</p>
      <div className="letter-mission">{formatText(text.mission, { points: GAME_CONFIG.gameplay.roundTarget, seconds: GAME_CONFIG.gameplay.finaleSeconds })}<br/><span>{text.surprise}</span></div>
      <button onClick={onStartGame} className="primary-button">{text.play}<span aria-hidden="true">{TEXT_CONTENT.symbols.arrow}</span></button>
      <p className="letter-controls">{text.controls}</p>
      <p className="letter-signoff">{text.signoff}</p>
    </section>
  </div>, document.body);
}

export const introStyles = `
*{box-sizing:border-box}
button{font:inherit}
button:focus-visible{outline:3px solid #a75468;outline-offset:5px}
button{touch-action:manipulation}
html,body,#root{width:100%;height:100%;overflow:hidden;overscroll-behavior:none}
body{margin:0;color:#6d5a60;font-family:Quicksand,sans-serif;background:#f8f1e9}
.eyebrow{font-size:10px;font-weight:700;letter-spacing:.22em;color:#9b7a78}
.intro-scene{position:relative;isolation:isolate;min-height:100svh;height:100dvh;overflow:hidden;display:grid;place-items:center;background:#f8f1e9;color:#6d5a60;font-family:Quicksand,sans-serif}
.intro-scene:before,.intro-scene:after{content:'';position:absolute;width:330px;height:330px;border-radius:50%;background:#efe5d9;opacity:.35;pointer-events:none}
.intro-scene:before{left:-180px;top:17%}
.intro-scene:after{right:-180px;bottom:8%}
.intro-heading{position:absolute;top:8%;text-align:center}
.intro-stack{position:relative;isolation:isolate;width:min(90vw,500px);height:min(98vw,548px);margin-top:60px}
.intro-title{position:absolute;z-index:0;left:50%;top:-14%;width:100vw;transform:translateX(-50%);margin:0;text-align:center;font:800 clamp(64px,13.5vw,190px)/1 Fredoka,Quicksand,sans-serif;letter-spacing:-.055em;color:#d8afa7;pointer-events:none;white-space:nowrap}
.bouquet-layer{position:absolute;inset:0;pointer-events:none}
.bouquet-layer svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 14px 12px #9d7d5e12)}
.bouquet-back{z-index:1}
.bouquet-front{z-index:3}
.envelope-track{opacity:0;visibility:hidden;position:absolute;z-index:2;left:calc(50% - 100px);top:0;width:200px;height:128px;transform:translateY(190px) rotate(-90deg)}
.envelope-track[data-state="launching"]{visibility:visible;opacity:1;animation:envelope-emerge 1.4s both cubic-bezier(.22,.61,.36,1)}
.envelope-track[data-state="interactive"],.envelope-track[data-state="opening"],.envelope-track[data-state="opened"]{visibility:visible;opacity:1;transform:translateY(0) rotate(0deg)}
@keyframes envelope-emerge{0%,8%{opacity:0;transform:translateY(190px) rotate(-90deg)}
55%{opacity:1;transform:translateY(-80px) rotate(-90deg)}
85%{opacity:1;transform:translateY(-32px) rotate(0deg)}
100%{opacity:1;transform:translateY(0) rotate(0deg)}
}
.soft-envelope{position:relative;display:block;width:200px;height:128px;padding:0;border:0;border-radius:18px;background:#fff3d9;box-shadow:0 12px 25px #9d7d5e22;cursor:pointer;perspective:600px}
.soft-envelope:disabled{cursor:default}
.soft-envelope svg{width:100%;height:100%;border-radius:18px;overflow:hidden}
.envelope-label{position:absolute;bottom:13px;right:16px;font-size:8px;font-weight:700;letter-spacing:.15em;color:#99776f}
.is-ready{animation:envelope-float 3s ease-in-out infinite}
@keyframes envelope-float{50%{transform:translateY(-6px)}
}
.bouquet-trigger{position:absolute;inset:20% 4% 10%;z-index:4;border:0;background:transparent;cursor:pointer;border-radius:45%;color:transparent}
.intro-sound{position:absolute;top:26px;right:28px;z-index:5}
.icon-button{display:grid;place-items:center;width:44px;height:44px;border:1px solid #eee0d6;border-radius:50%;color:#8a7177;background:#fffaf2;box-shadow:0 5px 14px #ac8e7610;cursor:pointer}
.icon-button:hover{background:#f5e6dd}
.intro-footer{position:absolute;bottom:35px;left:20px;right:20px;text-align:center;font-size:12px;color:#977e7d}
.intro-footer strong{display:block;font-weight:600;color:#8d6b70;margin-bottom:9px}
.intro-footer small{font-size:10px;letter-spacing:.1em}
.letter-overlay{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:50;overflow-y:auto;overscroll-behavior:contain;display:grid;place-items:center;padding:20px;background:#77676e50;backdrop-filter:blur(8px);animation:backdrop-reveal .3s ease-out}
.designed-letter{animation:letter-reveal .3s ease-out;position:relative;width:min(100%,530px);max-height:min(86dvh,800px);overflow-y:auto;word-break:break-word;overflow-wrap:anywhere;padding:40px clamp(24px,6vw,48px) 28px;border:1px solid #fffdf5;border-radius:30px;background:#fffbf3;box-shadow:0 25px 80px #80625d25;color:#79676a;line-height:1.85;user-select:text}
.letter-flower{display:block;width:65px;height:65px;margin:0 auto 18px}
.designed-letter .eyebrow{text-align:center;font-size:9px}
.designed-letter h2{font:600 38px/1.2 Caveat,cursive;color:#a65c70;margin:20px 0}
.designed-letter p{font-size:13px;margin:0 0 18px}
.designed-letter .letter-script{font:600 29px/1.25 Caveat,cursive;color:#ab6e7e;margin:24px 0}
.letter-close{position:absolute;right:16px;top:14px;width:34px;height:34px;border:0;border-radius:50%;background:#f6ebe2;color:#987880;font-size:24px;cursor:pointer}
.letter-mission{padding:16px;border-radius:18px;background:#f5eee1;font-size:12px;font-weight:700;text-align:center;margin:23px 0}
.letter-mission span{font-weight:500}
.primary-button{display:flex;justify-content:center;align-items:center;gap:18px;width:100%;padding:16px 20px;border:0;border-radius:24px;background:#b96e80;color:#fffaf4;font-size:13px;font-weight:700;box-shadow:0 8px 20px #b96e8025;cursor:pointer;transition:background .2s,transform .2s}
.primary-button:hover{background:#a75d71;transform:translateY(-2px)}
.designed-letter .letter-controls{font-size:10px;text-align:center;margin:14px 0}
.designed-letter .letter-signoff{font:24px Caveat,cursive;text-align:right;margin:25px 0 0;color:#ad8090}
.game-screen{position:relative;width:100%;height:100dvh;background:#fbf3e7;overflow:hidden;touch-action:none;user-select:none}
.game-hud{z-index:10;position:absolute;top:22px;left:24px;right:24px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;pointer-events:none}
.game-hud>*{pointer-events:auto}
.hud-card{padding:14px 18px;background:#fffcf5ed;border:1px solid #fffdf8;border-radius:24px;box-shadow:0 8px 24px #b2947512}
.score-line{display:flex;align-items:center;gap:9px;font-size:25px;font-weight:700;color:#95725b}
.score-line small{font-size:10px;color:#a68e80}
.score-progress{height:5px;background:#ece6d7;border-radius:10px;margin-top:9px;overflow:hidden}
.score-progress span{display:block;height:100%;background:#dfb36c;border-radius:10px;transition:width .3s}
.hud-lives{display:flex;gap:6px;color:#d893a0}
.game-actions{display:flex;gap:7px}
.game-guidance{position:absolute;bottom:20px;left:12px;right:12px;text-align:center;font-size:11px;color:#8b927d;pointer-events:none}
.finale-message{position:absolute;top:125px;left:20px;right:20px;text-align:center;pointer-events:none}
.finale-message h2{font:500 38px Fredoka,sans-serif;color:#ae7380;margin:0 0 8px}
.finale-message p{font-size:12px;color:#937b7d}
.game-overlay{position:absolute;inset:0;display:grid;place-content:center;gap:20px;text-align:center;background:#faf4e9a8;backdrop-filter:blur(4px);padding:24px}
.game-overlay h2{font:500 64px Fredoka,sans-serif;color:#b27687;margin:0}
.game-overlay p{font-size:13px;color:#977f81;margin:0}
.result-screen{position:fixed;inset:0;z-index:100;width:100vw;height:100vh;height:100dvh;overflow-y:auto;display:flex;align-items:safe center;justify-content:center;padding:24px;background:#6d5a608c;backdrop-filter:blur(8px)}
.result-card{width:min(100%,450px);padding:28px 30px;border-radius:36px;background:#fffbf4;box-shadow:0 20px 70px #a68a6f18;text-align:center}
.result-art{width:100%;max-width:280px;height:200px;margin:auto}
.result-card h1{overflow-wrap:anywhere;font:600 48px Fredoka,sans-serif;color:#ad6b7f;margin:6px 0 12px}
.result-copy{font:500 25px/1.25 Caveat,cursive;color:#aa8088}
.result-score{background:#f5edde;border-radius:24px;padding:18px;margin:24px 0}
.result-score strong{display:block;font:500 40px Fredoka,sans-serif;color:#b59361}
.result-score small{font-size:10px;letter-spacing:.1em;color:#9c8675}
.result-stats{flex-wrap:wrap;display:flex;justify-content:center;gap:18px;font-size:11px;color:#99847e;margin:16px 0 24px}
.secondary-button{border:0;background:transparent;color:#987980;cursor:pointer;padding:16px;font-size:12px}
.best-badge{display:inline-block;background:#f2e7ce;color:#aa8d55;border-radius:20px;padding:6px 12px;font-size:10px;margin:10px}
.custom-scrollbar{scrollbar-width:thin;scrollbar-color:#d9b5af transparent}
@media(max-width:540px){.intro-heading{top:9%;font-size:8px}
.intro-stack{margin-top:25px}
.intro-title{top:-12%;font-size:13.4vw}
.envelope-track{scale:.76;transform-origin:center 200px}
.intro-footer{bottom:32px;font-size:11px}
.game-hud{top:14px;left:12px;right:12px;gap:7px;flex-wrap:wrap}
.hud-card{padding:10px 13px}
.score-line{font-size:21px}
.game-actions .icon-button{width:36px;height:36px}
.hud-lives svg{width:17px}
.finale-message{top:140px}
.finale-message h2{font-size:29px}
.result-card{padding:24px}
.result-card h1{font-size:40px}
}
@media(max-height:650px){.intro-stack{width:min(72vw,54dvh,350px);height:min(80vw,59dvh,385px);margin-top:90px}
.intro-heading{top:4%}
.intro-title{top:-15%;font-size:min(12vw,12dvh,90px)}
.envelope-track{scale:.65;transform-origin:center 150px}
.intro-footer{bottom:12px}
.result-screen{align-items:flex-start}
}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
.is-ready{animation:none!important}
}

/* Envelope sandwich: back (0), actual moving paper (1), pocket (2), lid (3).
   The pocket masks the lowered sheet until it rises above the envelope opening. */
.envelope-track[data-state="opening"]{z-index:4}
.soft-envelope{isolation:isolate;overflow:hidden}
.is-opening{overflow:visible}
.envelope-back,.envelope-front,.envelope-lid{position:absolute;inset:0;pointer-events:none}
.envelope-back{z-index:0;background:#f0dabb;border-radius:18px}
.envelope-front{z-index:2}
.envelope-front svg{filter:drop-shadow(0 -2px 2px #b1906b10)}
.envelope-lid{z-index:3;transform-origin:center top}
.envelope-paper{visibility:hidden;opacity:0;position:absolute;z-index:1;left:28px;top:18px;width:144px;height:86px;padding:14px 12px;background:#fffbf3;border-radius:12px;box-shadow:0 4px 12px #ac8a6c20;transform:translateY(12px) scale(.85);clip-path:inset(0 0 16px 0);display:flex;flex-direction:column;justify-content:center;gap:8px;color:#aa6f7f;pointer-events:none}
.envelope-paper strong{font:600 18px Caveat,cursive}
.envelope-paper span{font:10px/1.5 Quicksand,sans-serif}
.envelope-label{z-index:3;pointer-events:none}
.is-opening .envelope-lid{animation:lid-open var(--paper-reveal) forwards}
.is-opening .envelope-paper{visibility:visible;animation:paper-reveal var(--paper-reveal) cubic-bezier(.22,.61,.36,1) forwards}
@keyframes lid-open{0%{transform:rotateX(0);opacity:1}18%,100%{transform:rotateX(180deg);opacity:0}}
@keyframes paper-reveal{0%,18%{opacity:0;transform:translateY(12px) scale(.85);clip-path:inset(0 0 16px 0)}30%{opacity:1;transform:translateY(-12px) scale(.85);clip-path:inset(0)}70%{opacity:1;transform:translateY(-112px) scale(1);clip-path:inset(0)}100%{opacity:1;transform:translateY(-142px) scale(1.5);clip-path:inset(0)}}
.designed-letter .letter-script,.result-copy{white-space:pre-line}
.designed-letter{transform-origin:center bottom}
@keyframes backdrop-reveal{from{opacity:0}to{opacity:1}}
@keyframes letter-reveal{from{opacity:.3;transform:translateY(24px) scale(.82)}to{opacity:1;transform:none}}
/* Make content editable even when a replacement message is longer than expected. */
.envelope-paper span,.envelope-paper strong{overflow-wrap:anywhere}
/* HTML hidden and CSS visibility both gate the envelope before the zoom ends.
   This remains correct even before animations initialize or fonts finish loading. */
.envelope-track[hidden]{display:none}
.bouquet-layer{transform-origin:50% 80%}
.intro-stack[data-state="arriving"] .bouquet-layer{animation:bouquet-arrive var(--bouquet-arrival) both cubic-bezier(.2,.7,.3,1)}
.intro-stack[data-state="zooming"] .bouquet-layer{animation:bouquet-zoom var(--bouquet-zoom) both cubic-bezier(.2,.7,.3,1)}
.intro-stack[data-state="launching"] .bouquet-layer,.intro-stack[data-state="interactive"] .bouquet-layer,.intro-stack[data-state="opening"] .bouquet-layer,.intro-stack[data-state="opened"] .bouquet-layer{transform:translateY(-18px) scale(1.08)}
@keyframes bouquet-arrive{from{opacity:0;transform:translateY(65px) scale(.78)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes bouquet-zoom{from{transform:translateY(0) scale(1)}to{transform:translateY(-18px) scale(1.08)}}
.result-card[data-status="missed-catch"] h1{font-size:clamp(28px,7vw,38px)}
/* A single off-screen narrator card, anchored to the viewport rather than the
   catcher. The lower clamp clears the mobile HUD even when its controls wrap. */
.narrator-anchor{position:fixed;z-index:5;top:clamp(142px,23dvh,210px);left:50%;transform:translateX(-50%);width:min(580px,calc(100vw - 32px));pointer-events:none;text-align:center}
.narrator-card{padding:20px 28px 24px;border:2px solid #f0d7d8;border-radius:28px;background:#fffbf3;box-shadow:0 12px 35px #9b6c7a20;animation:narrator-note 2.4s both cubic-bezier(.22,.61,.36,1)}
.narrator-speaker{display:flex;justify-content:center;align-items:center;gap:8px;color:#ad7182;font:700 10px/1.4 Quicksand,sans-serif;letter-spacing:.18em}
.narrator-card p{margin:10px 0 0;color:#955e73;font:500 clamp(24px,4.7vw,34px)/1.25 Fredoka,Quicksand,sans-serif;overflow-wrap:anywhere}
@keyframes narrator-note{0%{opacity:0;transform:translateY(10px) scale(.94)}10%,35%{opacity:1;transform:translateY(0) scale(1)}65%{opacity:1;transform:translateY(-5px) scale(1)}100%{opacity:0;transform:translateY(calc(-1 * var(--narrator-rise))) scale(1)}}
@media(max-width:540px){.narrator-card{padding:17px 20px 20px;border-radius:24px}.narrator-speaker{font-size:9px}}
@media(prefers-reduced-motion:reduce){.narrator-card{animation:none!important;opacity:1;transform:none}}
/* A stable viewport and opacity-only screen entrances prevent page reflow and
   avoid transformed ancestors that could trap fixed narrator/modal layers. */
.app-shell{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#f8f1e9}
.intro-scene,.game-screen{animation:scene-fade-in .3s ease-out both}
.result-screen{animation:backdrop-reveal .28s ease-out both}
.result-card{animation:result-reveal .32s ease-out both}
.game-overlay,.finale-message{animation:scene-fade-in .22s ease-out both}
@keyframes scene-fade-in{from{opacity:0}to{opacity:1}}
@keyframes result-reveal{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;

// Intro state machine: arriving -> tucked -> zooming -> launching -> interactive
// -> opening -> opened. The envelope is removed from layout (hidden) until
// the bouquet finishes its zoom, so no initial flash can expose it.
// Closing the modal returns to interactive, without replaying the bouquet launch.
export default function IntroScreen({ onStartGame, soundMuted, onToggleSound }) {
  const [envelopeState, setEnvelopeState] = useState('arriving');
  const envelopeRef = useRef(null);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (envelopeState === 'interactive') envelopeRef.current?.focus({ preventScroll: true });
    // animationend drives normal transitions. Timers also recover if a browser
    // cancels an animation or reduced-motion settings change while it is running.
    const transitions = {
      arriving: ['tucked', GAME_CONFIG.intro.bouquetArrivalMs],
      zooming: ['launching', GAME_CONFIG.intro.bouquetZoomMs],
      launching: ['interactive', GAME_CONFIG.intro.launchMs],
      opening: ['opened', GAME_CONFIG.intro.paperRevealMs],
    };
    if (!transitions[envelopeState]) return;
    const [next, duration] = transitions[envelopeState];

    const timer = setTimeout(() => setEnvelopeState(next), reducedMotion() ? 0 : duration + 100);
    return () => clearTimeout(timer);
  }, [envelopeState]);
  const closeLetter = React.useCallback(() => setEnvelopeState('interactive'), []);
  const footer = TEXT_CONTENT.intro.footer[envelopeState];
  return <div className="intro-scene">
    <p className="intro-heading eyebrow">{TEXT_CONTENT.intro.eyebrow}</p>
    <button className="intro-sound icon-button" onClick={onToggleSound} aria-label={soundMuted ? TEXT_CONTENT.controls.unmute : TEXT_CONTENT.controls.mute}><Icon name={soundMuted ? 'muted' : 'sound'}/></button>
    <div className="intro-stack" data-state={envelopeState} style={{ '--bouquet-arrival': `${GAME_CONFIG.intro.bouquetArrivalMs}ms`, '--bouquet-zoom': `${GAME_CONFIG.intro.bouquetZoomMs}ms` }}>
      <h1 className="intro-title">{TEXT_CONTENT.intro.title}</h1>
      <div className="bouquet-layer bouquet-back"><Bouquet/></div>
      <div className="envelope-track" data-state={envelopeState} hidden={!['launching', 'interactive', 'opening', 'opened'].includes(envelopeState)} style={{ '--paper-reveal': `${GAME_CONFIG.intro.paperRevealMs}ms`, animationDuration: envelopeState === 'launching' ? `${GAME_CONFIG.intro.launchMs}ms` : undefined }} onAnimationEnd={e => {
        if (envelopeState === 'launching' && e.animationName === 'envelope-emerge') setEnvelopeState('interactive');
        if (envelopeState === 'opening' && e.animationName === 'paper-reveal') setEnvelopeState('opened');
      }}>
        <button ref={envelopeRef} type="button" className={`soft-envelope ${envelopeState === 'interactive' ? 'is-ready' : ''} ${envelopeState === 'opening' ? 'is-opening' : ''}`} disabled={envelopeState !== 'interactive'} aria-label={TEXT_CONTENT.controls.openLetter} onClick={() => { sound.playEnvelopeOpen(); setEnvelopeState('opening'); }}>
          <span className="envelope-back" aria-hidden="true"/>
          <span className="envelope-paper" aria-hidden="true"><strong>{TEXT_CONTENT.intro.paperPreview}</strong><span>{TEXT_CONTENT.intro.paperNote}</span></span>
          <span className="envelope-front" aria-hidden="true"><svg viewBox="0 0 200 128"><path d="M0 12L87 74Q100 85 113 74L200 12V110Q200 128 182 128H18Q0 128 0 110Z" fill="#fff1d6"/><path d="M0 119L83 66Q100 54 117 66L200 119Q200 128 182 128H18Q0 128 0 119Z" fill="#f3dfbd"/></svg></span>
          <span className="envelope-lid" aria-hidden="true"><svg viewBox="0 0 200 128"><path d="M0 9Q0 0 18 0H182Q200 0 200 9L112 73Q100 82 88 73Z" fill="#fff7e5"/><circle cx="100" cy="74" r="17" fill="#dda0a5"/><Heart x={100} y={77} size={.48} color="#fff3e2"/></svg></span>
          <span className="envelope-label">{TEXT_CONTENT.intro.envelopeLabel}</span>
        </button>
      </div>
      <div className="bouquet-layer bouquet-front" onAnimationEnd={e => {
        // Only the front layer advances the state; the back plays in sync.
        if (envelopeState === 'arriving' && e.animationName === 'bouquet-arrive') setEnvelopeState('tucked');
        if (envelopeState === 'zooming' && e.animationName === 'bouquet-zoom') setEnvelopeState('launching');
      }}><Bouquet front/></div>
      {envelopeState === 'tucked' && <button className="bouquet-trigger" aria-label={TEXT_CONTENT.controls.liftLetter} onClick={() => { sound.init(); sound.playCatch(1); setEnvelopeState('zooming'); }}>{TEXT_CONTENT.controls.liftLetter}</button>}
    </div>
    <div className="intro-footer" aria-live="polite"><strong>{footer[0]}</strong><small>{footer[1]}</small></div>
    {envelopeState === 'opened' && <OpenLetterModal onStartGame={onStartGame} onClose={closeLetter}/>}
  </div>;
}
