import React from 'react';
import { GameState } from './types';
import './retro.css';

interface HUDProps {
  gameState: GameState;
  showLevelUp: boolean;
  onStartGame: () => void;
  onRestartGame: () => void;
}

const KeyboardKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span 
    className="inline-block px-3 py-2 font-mono text-sm"
    style={{
      background: 'linear-gradient(45deg, #330066, #660066)',
      border: '2px solid #ff00ff',
      color: '#00ffff',
      boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
      textShadow: '0 0 5px #00ffff',
      borderRadius: '4px',
      minWidth: '2.5rem',
      textAlign: 'center'
    }}
  >
    {children}
  </span>
);

export const HUD: React.FC<HUDProps> = ({ 
  gameState, 
  showLevelUp, 
  onStartGame, 
  onRestartGame 
}) => {
  const { started, over, score, level, dysonsphereHealth, dysonsphereShield, dysonsphereMaxShield } = gameState;

  const styles = {
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(83,0,130,0.8) 100%)',
      color: 'white',
      pointerEvents: 'auto' as const,
    },
    gameHUD: {
      position: 'absolute' as const,
      top: '1rem',
      left: '1rem',
      padding: '1rem',
      color: 'white',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    },
    levelUp: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#ffd700',
      fontSize: '2rem',
      fontWeight: 'bold',
      textShadow: '0 0 10px #ff9900',
      pointerEvents: 'none' as const,
    }
  };

  // Start Screen
  if (!started) {
    return (
      <div style={{
        ...styles.overlay,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        minHeight: '100vh',
        padding: '4rem 0'
      }}>
        <h1 className="text-6xl font-black tracking-wider" style={{
          fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
          color: '#ff00ff',
          textShadow: `
            0 0 10px #ff00ff,
            0 0 20px #ff00ff,
            0 0 40px #ff00ff,
            0 2px 0 #000,
            0 4px 0 #000,
            0 6px 0 #000
          `,
          transform: 'perspective(500px) rotateX(10deg)',
          letterSpacing: '4px'
        }}>
          DYSON<br/>DEFENDER
        </h1>
        <p className="retro-text text-xl" style={{
          color: '#00ffff',
          maxWidth: '600px',
          textAlign: 'center',
          lineHeight: '1.8',
          padding: '0 20px',
          textShadow: '0 0 10px #00ffff'
        }}>
          Defend the Dyson sphere from waves of alien invaders!
        </p>
        <button 
          className="retro-button"
          onClick={onStartGame}
        >
          Start Game
        </button>
        
        <div className="text-center">
          <h2 className="retro-header text-2xl mb-6">Controls</h2>
          <div className="space-y-4 retro-text text-sm">
            <p className="flex items-center justify-center gap-2">
              <KeyboardKey>W</KeyboardKey>
              <KeyboardKey>A</KeyboardKey>
              <KeyboardKey>S</KeyboardKey>
              <KeyboardKey>D</KeyboardKey>
              <span className="ml-2">or Arrow Keys to move</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <KeyboardKey>Q</KeyboardKey>
              <KeyboardKey>E</KeyboardKey>
              <span className="ml-2">to move up/down</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <KeyboardKey>Space</KeyboardKey>
              <span className="ml-2">to shoot</span>
            </p>
            <p className="mt-4">Mouse to look around</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (over) {
    return (
      <div style={{
        ...styles.overlay,
        padding: '4rem 0',
        gap: '2rem'
      }} className="game-over-screen gradient-bg">
        <h1 className="retro-header text-5xl game-over-text" style={{
          position: 'relative',
          fontSize: '6rem',
          letterSpacing: '8px',
          color: '#ff0066',
          marginBottom: '2rem',
          textShadow: `
            0 0 20px #ff0066,
            0 0 40px #ff0066,
            0 0 60px #ff0066
          `
        }}>GAME OVER</h1>
        <div className="retro-text gradient-bg" style={{
          background: 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(83,0,130,0.8))',
          padding: '2rem',
          marginBottom: '2rem',
          borderRadius: '12px',
          border: '2px solid #ff00ff',
          boxShadow: `
            0 0 30px rgba(255, 0, 255, 0.3),
            inset 0 0 20px rgba(255, 0, 255, 0.2)
          `
        }}>
          <p className="text-2xl" style={{ color: '#00ffff', marginBottom: '1.5rem' }}>Final Score: {score}</p>
          <p className="text-xl" style={{ color: '#ff00ff' }}>You reached level {level}</p>
        </div>
        <button 
          className="retro-button"
          onClick={onRestartGame}
          style={{
            fontSize: '1.5rem',
            padding: '1.5rem 3rem',
            letterSpacing: '2px'
          }}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* In-game HUD */}
      <div style={{
        ...styles.gameHUD,
        fontFamily: "'Press Start 2P', system-ui",
        fontSize: '0.8rem',
        lineHeight: '1.8rem',
        textShadow: '2px 2px 0 #000, 0 0 10px #00ffff',
        background: 'linear-gradient(45deg, rgba(0,0,0,0.7), rgba(83,0,130,0.3))',
        borderRight: '2px solid #ff00ff',
        borderBottom: '2px solid #ff00ff',
        borderRadius: '0 0 8px 0',
        boxShadow: '0 0 20px rgba(255, 0, 255, 0.2)',
        padding: '1.5rem'
      }}>
        <div className="hud-value" style={{ 
          color: '#ff00ff',
          transition: 'all 0.3s ease'
        }}>
          Score: <span className="value-change">{score}</span>
        </div>
        <div className="hud-value" style={{ 
          color: '#00ffff',
          transition: 'all 0.3s ease'
        }}>
          Level: <span className="value-change">{level}</span>
        </div>
        <div className="hud-value" style={{ 
          color: '#ffff00',
          transition: 'all 0.3s ease'
        }}>
          Shield: <span className="value-change">{Math.floor(dysonsphereShield)}</span>/{dysonsphereMaxShield}
        </div>
        <div className="hud-value" style={{ 
          color: '#ff6600',
          transition: 'all 0.3s ease'
        }}>
          Health: <span className="value-change">{Math.floor(dysonsphereHealth)}</span>
        </div>
      </div>

      {/* Level up notification */}
      {showLevelUp && (
        <div className="retro-header" style={{
          ...styles.levelUp,
          animation: 'glow 2s ease-in-out infinite',
          fontSize: '4rem',
          background: 'linear-gradient(180deg, #ff00ff, #00ffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          padding: '2rem',
          border: '4px solid #ff00ff',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
          transform: 'perspective(500px) rotateX(10deg) translate(-50%, -50%)'
        }}>
          LEVEL {level}
        </div>
      )}


    </div>
  );
};
