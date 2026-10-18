import React, { useState } from 'react';
import IntroScreen, { introStyles } from './components/IntroScreen';
import CatchingGame from './components/CatchingGame';
import GameOverModal from './components/GameOverModal';
import { sound } from './utils/soundEngine';
import { TEXT_CONTENT } from './gameConfig';

export default function App() {
  // App owns the session across canvas remounts. Only the round's temporary
  // state (lives, timer, items, streak) belongs inside CatchingGame.
  // Store the view and its result payload together, so an end screen can
  // never render with a missing or stale result.
  const [screen, setScreen] = useState({ view: 'intro', result: null });
  const [soundMuted, setSoundMuted] = useState(false);
  const [session, setSession] = useState({ score: 0, level: 0 });
  const [gameKey, setGameKey] = useState(0);

  React.useEffect(() => { document.title = TEXT_CONTENT.appTitle; }, []);

  const handleToggleSound = () => {
    setSoundMuted(sound.toggleMute());
  };

  // Every new round advances the level, including a round started from the
  // letter after returning to the intro. Level 1 can therefore happen only once
  // in this session; refreshing the page begins a new session.
  const startRound = () => {
    sound.init();
    setSession(previous => ({ ...previous, level: previous.level + 1 }));
    setGameKey(key => key + 1);
    setScreen({ view: 'game', result: null });
  };

  const handleGameEnd = data => {
    // Preserve accumulated points on BOTH victory and defeat. The next round
    // earns another 500 points toward its own climax, rather than reusing the
    // accumulated total as an immediately satisfied win condition.
    setSession(previous => ({ ...previous, score: data.finalScore }));
    setScreen({ view: 'end', result: data });
  };

  const handleBackToIntro = snapshot => {
    // Leaving an unfinished round carries its earned points too. Result-screen
    // buttons supply no snapshot because handleGameEnd already saved the total.
    if (typeof snapshot?.score === 'number') {
      setSession(previous => ({ ...previous, score: snapshot.score }));
    }
    setScreen({ view: 'intro', result: null });
  };

  return <div className="app-shell">
    <style>{introStyles}</style>
    {screen.view === 'intro' && <IntroScreen onStartGame={startRound} soundMuted={soundMuted} onToggleSound={handleToggleSound}/>}
    {screen.view !== 'intro' && <div inert={screen.view === 'end' ? '' : undefined} aria-hidden={screen.view === 'end' ? true : undefined}><CatchingGame key={gameKey} level={session.level} initialScore={session.score} onGameEnd={handleGameEnd} onBackToIntro={handleBackToIntro} soundMuted={soundMuted} onToggleSound={handleToggleSound}/></div>}
    {screen.view === 'end' && <GameOverModal {...screen.result} level={session.level} onPlayAgain={startRound} onBackToIntro={() => handleBackToIntro()}/>}
  </div>;
}
