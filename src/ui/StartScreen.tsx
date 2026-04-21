import React, { useEffect, useState } from 'react';
import './styles/retro.css';
import KeyboardKey from './components/KeyboardKey';
import { AudioManager } from '../core/AudioManager';
import { AudioToggle } from './components/AudioToggle';
import { isSafariBrowser } from '../utils/browserDetection';

interface StartScreenProps {
  onStartGame: () => void;
  onChooseStage?: (stage: number) => void;
  audioManager: AudioManager;
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

const isLocalStagePickerAllowed = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame, onChooseStage, audioManager }) => {
  const [isSafari, setIsSafari] = useState<boolean>(false);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const canChooseStage = Boolean(onChooseStage) && isLocalStagePickerAllowed();
  
  useEffect(() => {
    setIsSafari(isSafariBrowser());
  }, []);

  const chooseStage = (stage: number) => {
    if (!onChooseStage) return;
    const nextStage = Math.max(1, Math.floor(stage));
    onChooseStage(nextStage);
  };

  return (
    <div className="start-screen-overlay" style={{
      ...styles.overlay,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '4rem 0'
    }}>
      <h1 className="text-6xl font-black tracking-wider start-screen-title" style={{
        fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
        color: '#ff00ff',
        fontSize: '4rem',
        textShadow: `
          0 0 10px #ff00ff,
          0 0 20px #ff00ff,
          0 0 40px #ff00ff,
          0 2px 0 #000,
          0 4px 0 #000,
          0 6px 0 #000
        `,
        transform: 'perspective(500px) rotateX(10deg)',
        letterSpacing: '4px',
        textAlign: 'center'
      }}>
        DYSON<br/>DEFENDER
      </h1>
      <p className="retro-text text-xl start-screen-description" style={{
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
        className="retro-button start-screen-button"
        onClick={onStartGame}
        style={{ 
          marginBottom: '20px',
          marginTop: '20px',
          color: 'white'
        }}
      >
        Start Game
      </button>

      {canChooseStage && (
        <div className="local-stage-picker">
          <button
            className="retro-button start-screen-button"
            type="button"
            onClick={() => setStagePickerOpen(open => !open)}
            style={{
              color: 'white',
              fontSize: '0.85rem',
              padding: '0.8rem 1.2rem'
            }}
          >
            Choose Stage
          </button>

          {stagePickerOpen && (
            <div className="local-stage-picker-panel">
              <div className="local-stage-picker-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(stage => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => chooseStage(stage)}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!isSafari && (
        <div style={{ marginTop: '15px' }}>
          <AudioToggle audioManager={audioManager} />
        </div>
      )}
      
      {/* Controls Section - Hidden on mobile via CSS */}
      <div className="start-screen-controls" style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
        <h2 style={{
          fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
          color: '#ff00ff',
          fontSize: '1.5rem',
          marginBottom: '24px',
          textShadow: '0 0 8px #ff00ff'
        }}>
          Controls
        </h2>
        <div className="start-screen-controls-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#00ffff',
          fontSize: '0.875rem',
          fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
          textShadow: '0 0 5px #00ffff'
        }}>
          <div className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div> {/* Wrap keys */} 
              <KeyboardKey>W</KeyboardKey>
              <KeyboardKey>A</KeyboardKey>
              <KeyboardKey>S</KeyboardKey>
              <KeyboardKey>D</KeyboardKey>
            </div>
            <span style={{ marginLeft: '8px' }}>or Arrow Keys to move</span>
          </div>
          <div className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <div> {/* Wrap keys */} 
              <KeyboardKey>Q</KeyboardKey>
              <KeyboardKey>E</KeyboardKey>
             </div>
            <span style={{ marginLeft: '8px' }}>to move up/down</span>
          </div>
          <div className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <div> {/* Wrap keys */} 
               <KeyboardKey>Shift</KeyboardKey>
             </div>
            <span style={{ marginLeft: '8px' }}>to boost</span>
          </div>
          <div className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <div> {/* Wrap keys */} 
               <KeyboardKey>Space</KeyboardKey>
             </div>
            <span style={{ marginLeft: '8px' }}>to shoot</span>
          </div>
          <p style={{ marginTop: '16px' }}>Mouse to look around</p>
        </div>
      </div>
      
      <div className="start-screen-credits" style={{
        marginTop: '20px',
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <a 
          href="https://x.com/hankofalltrades" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            textDecoration: 'none',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#00ffff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
        >
          Created by @hankofalltrades on X
        </a>
        <div style={{ marginTop: '5px' }}>
          Music by REMNANT.EXE
        </div>
      </div>
    </div>
  );
};

export default StartScreen; 
