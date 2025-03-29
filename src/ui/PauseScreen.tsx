import React, { useEffect, useState } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  currentWave: number;
  onSelectWave: (wave: number) => void;
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

const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onRestart, currentWave, onSelectWave }) => {
  const [selectedWave, setSelectedWave] = useState(currentWave);
  const maxWaves = 10; // Set the maximum number of waves

  // Ensure pointer lock is released when this component mounts
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  const handleWaveSelect = (wave: number) => {
    onSelectWave(wave);
  };

  // Generate array of wave numbers
  const waveNumbers = Array.from({ length: maxWaves }, (_, i) => i + 1);

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

      <div className="retro-text gradient-bg" style={{
        background: 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(83,0,130,0.8))',
        padding: '2rem',
        marginTop: '1rem',
        borderRadius: '12px',
        border: '2px solid #ff00ff',
        boxShadow: `
          0 0 30px rgba(255, 0, 255, 0.3),
          inset 0 0 20px rgba(255, 0, 255, 0.2)
        `,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{
          color: '#00ffff',
          fontSize: '1.5rem',
          marginBottom: '1rem',
          textAlign: 'center',
          textShadow: '0 0 8px #00ffff'
        }}>
          Wave Select
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          width: '100%'
        }}>
          {waveNumbers.map(wave => (
            <button 
              key={wave}
              className="retro-button"
              onClick={() => handleWaveSelect(wave)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleWaveSelect(wave);
              }}
              style={{
                fontSize: '1rem',
                padding: '0.5rem 0.75rem',
                color: 'white',
                background: selectedWave === wave ? 'rgba(255, 0, 255, 0.5)' : 'transparent',
                minWidth: '40px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {wave}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PauseScreen; 