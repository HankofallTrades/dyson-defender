import React, { useEffect, useState } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface PauseScreenProps {
  onResume: () => void;
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

const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onRestart }) => {
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
    }} className="pause-screen gradient-bg">
      <h1 className="retro-header text-5xl" style={{
        position: 'relative',
        fontSize: '6rem',
        letterSpacing: '8px',
        color: '#ff00ff',
        marginBottom: '2rem',
        textShadow: `
          0 0 20px #ff00ff,
          0 0 40px #ff00ff,
          0 0 60px #ff00ff
        `
      }}>PAUSED</h1>
      
      <div className="retro-text" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        alignItems: 'center'
      }}>
        <button 
          className="retro-button"
          onClick={onResume}
          onTouchStart={(e) => {
            e.preventDefault();
            onResume();
          }}
          style={{
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            letterSpacing: '2px',
            color: 'white',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Resume Game
        </button>

        <button 
          className="retro-button"
          onClick={onRestart}
          onTouchStart={(e) => {
            e.preventDefault();
            onRestart();
          }}
          style={{
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            letterSpacing: '2px',
            color: 'white',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};

export default PauseScreen; 