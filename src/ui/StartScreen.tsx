import React from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';
import KeyboardKey from './components/KeyboardKey';

interface StartScreenProps {
  onStartGame: () => void;
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
  vibeJamLink: {
    position: 'fixed' as const,
    bottom: '-1px',
    right: '-1px',
    padding: '7px',
    fontSize: '14px',
    fontWeight: 'bold',
    background: '#fff',
    color: '#000',
    textDecoration: 'none',
    zIndex: 10000,
    borderTopLeftRadius: '12px',
    border: '1px solid #fff',
    fontFamily: 'system-ui, sans-serif',
  }
};

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <>
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
            marginBottom: '30px',
            marginTop: '20px',
            color: 'white'
          }}
        >
          Start Game
        </button>
        
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
            <p className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div> {/* Wrap keys */} 
                <KeyboardKey>W</KeyboardKey>
                <KeyboardKey>A</KeyboardKey>
                <KeyboardKey>S</KeyboardKey>
                <KeyboardKey>D</KeyboardKey>
              </div>
              <span style={{ marginLeft: '8px' }}>or Arrow Keys to move</span>
            </p>
            <p className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <div> {/* Wrap keys */} 
                <KeyboardKey>Q</KeyboardKey>
                <KeyboardKey>E</KeyboardKey>
               </div>
              <span style={{ marginLeft: '8px' }}>to move up/down</span>
            </p>
            <p className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <div> {/* Wrap keys */} 
                 <KeyboardKey>Shift</KeyboardKey>
               </div>
              <span style={{ marginLeft: '8px' }}>to boost</span>
            </p>
            <p className="start-screen-control-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <div> {/* Wrap keys */} 
                 <KeyboardKey>Space</KeyboardKey>
               </div>
              <span style={{ marginLeft: '8px' }}>to shoot</span>
            </p>
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
      <a 
        href="https://jam.pieter.com" 
        target="_blank" 
        rel="noopener noreferrer"
        style={styles.vibeJamLink}
      >
        🕹️ Vibe Jam 2025
      </a>
    </>
  );
};

export default StartScreen; 