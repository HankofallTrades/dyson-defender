import React, { useEffect } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface GameOverScreenProps {
  stats: {
    finalScore: number;
    survivalTime: number;
    enemiesDefeated: number;
    wavesCompleted: number;
    level?: number; // Optional level property
  };
  onRestart: () => void;
}

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
};

const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart }) => {
  // Ensure pointer lock is released when this component mounts
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

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
        <p className="text-2xl" style={{ color: '#00ffff', marginBottom: '1.5rem' }}>Final Score: {stats.finalScore}</p>
        <p className="text-xl" style={{ color: '#ff00ff', marginBottom: '1rem' }}>Waves Completed: {stats.wavesCompleted - 1}</p>
        <p className="text-xl" style={{ color: '#ff00ff', marginBottom: '1rem' }}>Enemies Defeated: {stats.enemiesDefeated}</p>
        {stats.level && <p className="text-xl" style={{ color: '#ff00ff' }}>You reached level {stats.level}</p>}
      </div>
      <button 
        className="retro-button"
        onClick={onRestart}
        onTouchStart={(e) => {
          e.preventDefault(); // Prevent double-firing with click event
          onRestart();
        }}
        style={{
          fontSize: '1.5rem',
          padding: '1.5rem 3rem',
          letterSpacing: '2px',
          cursor: 'pointer', // Add cursor pointer for desktop
          touchAction: 'manipulation', // Optimize for touch
          WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
        }}
      >
        Restart
      </button>
    </div>
  );
};

export default GameOverScreen; 