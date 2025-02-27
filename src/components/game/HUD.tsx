import React from 'react';
import { GameState } from './types';

interface HUDProps {
  gameState: GameState;
  showLevelUp: boolean;
  onStartGame: () => void;
  onRestartGame: () => void;
}

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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
      <div style={styles.overlay}>
        <h1 className="text-4xl font-bold mb-4">Dyson Sphere Defender</h1>
        <p className="text-xl mb-8">Protect the white dwarf star's Dyson sphere from alien attackers!</p>
        <button 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
          onClick={onStartGame}
        >
          Start Game
        </button>
        <div className="mt-8 text-center">
          <p className="mb-2">Controls:</p>
          <p>WASD or Arrow Keys to move</p>
          <p>Mouse to look around</p>
          <p>Q/E to move up/down</p>
          <p>Spacebar to shoot</p>
        </div>
        <div className="mt-4 text-center text-sm text-gray-300">
          <p>Game tips:</p>
          <p>- Aliens will stop at a distance and attack</p>
          <p>- Shield regenerates if not hit for 3 seconds</p>
          <p>- Score 100 points to reach the next level</p>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (over) {
    return (
      <div style={styles.overlay}>
        <h1 className="text-4xl font-bold mb-4">Game Over</h1>
        <p className="text-2xl mb-2">Final Score: {score}</p>
        <p className="text-xl mb-8">You reached level {level}</p>
        <button 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
          onClick={onRestartGame}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* In-game HUD */}
      <div style={styles.gameHUD}>
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>Shield: {Math.floor(dysonsphereShield)}/{dysonsphereMaxShield}</div>
        <div>Dyson Sphere Health: {dysonsphereHealth}</div>
        <div className="mt-4 text-xs">
          Next level at: {level * 100} points
        </div>
      </div>

      {/* Level up notification */}
      {showLevelUp && (
        <div style={styles.levelUp}>
          Level {level}!
        </div>
      )}
    </>
  );
};
