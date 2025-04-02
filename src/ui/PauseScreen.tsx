import React, { useEffect, useState } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
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

const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onRestart, onExit, containerRef }) => {
  const handleResumeClick = () => {
    onResume();
    
    // Directly request pointer lock on the container from the click handler
    if (containerRef.current) {
      try {
        containerRef.current.requestPointerLock();
      } catch (e) {
        console.error('[PauseScreen] Error requesting pointer lock:', e);
      }
    } else {
      console.warn('[PauseScreen] Container ref not available to request pointer lock.');
    }
  };

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
          onClick={handleResumeClick}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResumeClick();
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
          RESUME
        </button>

        <button 
          className="retro-button"
          onClick={onRestart}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
          RESTART
        </button>

        <button 
          className="retro-button"
          onClick={onExit}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExit();
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
          EXIT
        </button>
      </div>
    </div>
  );
};

export default PauseScreen; 