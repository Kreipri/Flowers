import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Character, Heart, Flower, FallenGirl } from './Artwork';
import { TEXT_CONTENT, formatText } from '../gameConfig';

export default function GameOverModal({ status, level = 1, finalScore = 0, maxCombo = 1, stats = {}, isNewBest, onPlayAgain, onBackToIntro }) {
  const isWin = status === 'win';
  const isMissedCatch = status === 'missed-catch';
  const text = TEXT_CONTENT.result;
  const cardRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    cardRef.current?.focus();
    const keyDown = event => {
      if (event.key !== 'Tab' || !cardRef.current) return;
      const buttons = cardRef.current.querySelectorAll('button');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('keydown', keyDown); previousFocus?.focus(); };
  }, []);
  useEffect(() => {
    if (isWin && window.confetti && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.confetti({ particleCount: 70, spread: 75, origin: { y: .6 }, colors: ['#e4acb3', '#f1d195', '#b7cdb1', '#c1b2d4'], disableForReducedMotion: true });
    }
  }, [isWin]);
  // A body portal and fixed positioning put every result above the stopped
  // canvas, regardless of parent overflow or stacking contexts.
  return ReactDOM.createPortal(<main className="result-screen">
    <section ref={cardRef} tabIndex={-1} role="dialog" aria-modal="true" className="result-card" data-status={status} aria-labelledby="result-title">
      <p className="eyebrow">{isWin ? text.winEyebrow : isMissedCatch ? text.missedEyebrow : text.loseEyebrow}</p>
      <svg className="result-art" viewBox="0 0 280 200" role="img" aria-label={isWin ? text.winArt : isMissedCatch ? text.missedArt : text.loseArt}>
        <ellipse cx="140" cy="104" rx="91" ry="83" fill={isWin ? '#f6e4df' : '#e9e9e3'}/>
        {isWin ? <>
          <ellipse cx="140" cy="183" rx="72" ry="8" fill="#dec9c330"/>
          {/* Separate, upright silhouettes: two happy people celebrating together. */}
          <Character x={94} y={116} size={.95}/><Character girl x={186} y={116} size={.95}/>
          <g fill="#e2bd7c"><circle cx="56" cy="44" r="4"/><circle cx="226" cy="64" r="3"/></g>
          <path d="M77 32l4 9M214 35l-4 9" stroke="#b8c8a9" strokeWidth="4" strokeLinecap="round"/>
          <Heart x={140} y={41} size={1.2}/><Heart x={67} y={79} size={.35} color="#e6bac1"/><Heart x={214} y={115} size={.4} color="#e6bac1"/>
        </> : isMissedCatch ? <>
          <FallenGirl/>
        </> : <>
          <g fill="#b6c3cf"><rect x="83" y="65" width="114" height="45" rx="23"/><circle cx="111" cy="65" r="24"/><circle cx="151" cy="56" r="31"/></g>
          <path d="M113 88q5-6 10 0M154 88q5-6 10 0" stroke="#8393a4" fill="none" strokeWidth="3" strokeLinecap="round"/>
          <path d="M108 120l-4 10M140 119l-4 10M173 120l-4 10" stroke="#a8bfd0" strokeWidth="5" strokeLinecap="round"/>
          <path d="M140 184Q148 155 127 151" fill="none" stroke="#9fb293" strokeWidth="6" strokeLinecap="round"/><g transform="translate(124 157) rotate(145)"><Flower size={.45} rose/></g>
        </>}
      </svg>
      <h1 id="result-title" role="status">{isWin ? text.winTitle : isMissedCatch ? text.missedTitle : text.loseTitle}</h1>
      <p className="result-copy">{isWin ? text.winCopy : isMissedCatch ? text.missedCopy : text.loseCopy}</p>
      {isNewBest && <span className="best-badge">{text.best}</span>}
      <div className="result-score"><small>{text.total}</small><strong>{finalScore}</strong><small>{formatText(text.streak, { level, combo: maxCombo })}</small></div>
      <div className="result-stats"><span>{formatText(text.flowers, { count: stats.sunflowers || 0 })}</span><span>{formatText(text.stars, { count: stats.stars || 0 })}</span><span>{formatText(text.hearts, { count: stats.hearts || 0 })}</span><span>{formatText(text.sparkles, { count: stats.sparkles || 0 })}</span></div>
      <button className="primary-button" onClick={onPlayAgain}>{formatText(text.playAgain, { level: level + 1 })} <span aria-hidden="true">{TEXT_CONTENT.symbols.arrow}</span></button>
      <button className="secondary-button" onClick={onBackToIntro}>{text.back}</button>
    </section>
  </main>, document.body);
}
