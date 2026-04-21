import React, { useEffect, useState } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onChooseStage?: (stage: number) => void;
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

const isLocalStagePickerAllowed = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

const PauseScreen: React.FC<PauseScreenProps> = ({ onResume, onRestart, onChooseStage, onExit, containerRef }) => {
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const canChooseStage = Boolean(onChooseStage) && isLocalStagePickerAllowed();

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

  const chooseStage = (stage: number) => {
    if (!onChooseStage) return;
    const nextStage = Math.max(1, Math.floor(stage));
    onChooseStage(nextStage);
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

        {canChooseStage && (
          <div className="local-stage-picker">
            <button
              className="retro-button"
              type="button"
              onClick={() => setStagePickerOpen(open => !open)}
              style={{
                fontSize: '1.1rem',
                padding: '0.9rem 1.4rem',
                letterSpacing: '2px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              CHOOSE STAGE
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
