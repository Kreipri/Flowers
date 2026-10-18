import React, { useState } from 'react';
import IntroScreen, { introStyles } from './components/IntroScreen';
import CatchingGame from './components/CatchingGame';
import GameOverModal from './components/GameOverModal';
import { sound } from './utils/soundEngine';
import { TEXT_CONTENT } from './gameConfig';

export default function App() {
  // App owns the session across canvas remounts. Only the round's temporary
  // state (lives, timer, items, streak) belongs inside CatchingGame.
  const [view, setView] = useState('intro');
  const [soundMuted, setSoundMuted] = useState(false);
  const [session, setSession] = useState({ score: 0, level: 0 });
  const [gameKey, setGameKey] = useState(0);
  const [gameOverData, setGameOverData] = useState(null);

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
    setView('game');
  };

  const handleGameEnd = data => {
    // Preserve accumulated points on BOTH victory and defeat. The next round
    // earns another 500 points toward its own climax, rather than reusing the
    // accumulated total as an immediately satisfied win condition.
    setSession(previous => ({ ...previous, score: data.finalScore }));
    setGameOverData(data);
    setView('end');
  };

  const handleBackToIntro = snapshot => {
    // Leaving an unfinished round carries its earned points too. Result-screen
    // buttons supply no snapshot because handleGameEnd already saved the total.
    if (typeof snapshot?.score === 'number') {
      setSession(previous => ({ ...previous, score: snapshot.score }));
    }
    setView('intro');
  };

  return <div className="app-shell">
    <style>{introStyles}</style>
    {view === 'intro' && <IntroScreen onStartGame={startRound} soundMuted={soundMuted} onToggleSound={handleToggleSound}/>}
    {view === 'game' && <CatchingGame key={gameKey} level={session.level} initialScore={session.score} onGameEnd={handleGameEnd} onBackToIntro={handleBackToIntro} soundMuted={soundMuted} onToggleSound={handleToggleSound}/>}
    {view === 'end' && <GameOverModal {...gameOverData} level={session.level} onPlayAgain={startRound} onBackToIntro={() => handleBackToIntro()}/>}
  </div>;
}
