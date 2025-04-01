import React, { useEffect, useRef } from 'react';
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
  onExit: () => void; // Add an exit callback
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

const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart, onExit }) => {
  // Create a ref for the restart button
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  
  // Ensure pointer lock is released when this component mounts
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Focus the restart button for better accessibility and mobile interactions
    if (restartButtonRef.current) {
      restartButtonRef.current.focus();
    }
  }, []);

  // Handle restart function that we'll use for both onClick and touch events
  const handleRestart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRestart();
  };

  // Handle exit function that we'll use for both onClick and touch events
  const handleExit = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onExit();
  };

  return (
    <div style={{
      ...styles.overlay,
      padding: window.innerWidth < 768 ? '2rem 0' : '4rem 0',
      gap: window.innerWidth < 768 ? '1rem' : '2rem'
    }} className="game-over-screen gradient-bg">
      <h1 className="retro-header text-5xl game-over-text" style={{
        position: 'relative',
        fontSize: window.innerWidth < 768 ? '3rem' : '6rem',
        letterSpacing: window.innerWidth < 768 ? '4px' : '8px',
        color: '#ff0066',
        marginBottom: window.innerWidth < 768 ? '1rem' : '2rem',
        textShadow: `
          0 0 20px #ff0066,
          0 0 40px #ff0066,
          0 0 60px #ff0066
        `,
        textAlign: 'center',
        width: '100%'
      }}>GAME OVER</h1>
      <div className="retro-text gradient-bg" style={{
        background: 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(83,0,130,0.8))',
        padding: window.innerWidth < 768 ? '1rem' : '2rem',
        marginBottom: window.innerWidth < 768 ? '1rem' : '2rem',
        borderRadius: '12px',
        border: '2px solid #ff00ff',
        boxShadow: `
          0 0 30px rgba(255, 0, 255, 0.3),
          inset 0 0 20px rgba(255, 0, 255, 0.2)
        `,
        fontSize: window.innerWidth < 768 ? '0.9em' : '1em'
      }}>
        <p className="text-2xl" style={{ 
          color: '#00ffff', 
          marginBottom: window.innerWidth < 768 ? '0.8rem' : '1.5rem',
          fontSize: window.innerWidth < 768 ? '1.2rem' : '1.5rem'
        }}>Final Score: {stats.finalScore}</p>
        <p className="text-xl" style={{ 
          color: '#ff00ff', 
          marginBottom: window.innerWidth < 768 ? '0.6rem' : '1rem',
          fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem'
        }}>Waves Completed: {stats.wavesCompleted}</p>
        <p className="text-xl" style={{ 
          color: '#ff00ff', 
          marginBottom: window.innerWidth < 768 ? '0.6rem' : '1rem',
          fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem'
        }}>Enemies Defeated: {stats.enemiesDefeated}</p>
        {stats.level && <p className="text-xl" style={{ 
          color: '#ff00ff',
          fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem'
        }}>You reached level {stats.level}</p>}
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: window.innerWidth < 768 ? '1rem' : '1.5rem'
      }}>
        <button 
          ref={restartButtonRef}
          className="retro-button"
          onClick={handleRestart}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            handleRestart(e);
          }}
          style={{
            fontSize: window.innerWidth < 768 ? '1.2rem' : '1.5rem',
            padding: window.innerWidth < 768 ? '1rem 2rem' : '1.5rem 3rem',
            letterSpacing: window.innerWidth < 768 ? '1px' : '2px',
            cursor: 'pointer', // Add cursor pointer for desktop
            touchAction: 'manipulation', // Optimize for touch
            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
            userSelect: 'none', // Prevent text selection
            WebkitUserSelect: 'none', // For iOS/Safari
            MozUserSelect: 'none', // For Firefox
            msUserSelect: 'none', // For IE/Edge
            outline: 'none', // Remove outline on focus
            border: window.innerWidth < 768 ? '2px solid #ff00ff' : '3px solid #ff00ff', // Thinner border on mobile
            backgroundColor: 'rgba(25, 0, 50, 0.8)', // More visible background
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)', // More pronounced shadow
            transition: 'all 0.2s ease'
          }}
        >
          Restart
        </button>
        
        <button 
          className="retro-button"
          onClick={handleExit}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchEnd={(e) => {
            handleExit(e);
          }}
          style={{
            fontSize: window.innerWidth < 768 ? '1.2rem' : '1.5rem',
            padding: window.innerWidth < 768 ? '1rem 2rem' : '1.5rem 3rem',
            letterSpacing: window.innerWidth < 768 ? '1px' : '2px',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            outline: 'none',
            border: window.innerWidth < 768 ? '2px solid #00ffff' : '3px solid #00ffff', // Different color for exit button
            backgroundColor: 'rgba(25, 0, 50, 0.8)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)', // Different glow color
            transition: 'all 0.2s ease'
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen; 