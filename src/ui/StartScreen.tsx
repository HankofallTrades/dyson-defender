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
};

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <div style={{
      ...styles.overlay,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '4rem 0'
    }}>
      <h1 className="text-6xl font-black tracking-wider" style={{
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
        style={{ 
          marginBottom: '30px',
          marginTop: '20px',
          color: 'white'
        }}
      >
        Start Game
      </button>
      
      <div style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
        <h2 style={{
          fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
          color: '#ff00ff',
          fontSize: '1.5rem',
          marginBottom: '24px',
          textShadow: '0 0 8px #ff00ff'
        }}>
          Controls
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#00ffff',
          fontSize: '0.875rem',
          fontFamily: "'Press Start 2P', system-ui, -apple-system, sans-serif",
          textShadow: '0 0 5px #00ffff'
        }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyboardKey>W</KeyboardKey>
            <KeyboardKey>A</KeyboardKey>
            <KeyboardKey>S</KeyboardKey>
            <KeyboardKey>D</KeyboardKey>
            <span style={{ marginLeft: '8px' }}>or Arrow Keys to move</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyboardKey>Q</KeyboardKey>
            <KeyboardKey>E</KeyboardKey>
            <span style={{ marginLeft: '8px' }}>to move up/down</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyboardKey>Shift</KeyboardKey>
            <span style={{ marginLeft: '8px' }}>to boost</span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <KeyboardKey>Space</KeyboardKey>
            <span style={{ marginLeft: '8px' }}>to shoot</span>
          </p>
          <p style={{ marginTop: '16px' }}>Mouse to look around</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen; 