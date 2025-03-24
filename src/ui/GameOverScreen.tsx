import React, { useEffect } from 'react';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface GameOverScreenProps {
  stats: {
    finalScore: number;
    survivalTime: number;
    enemiesDefeated: number;
  };
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart }) => {
  // Format survival time into minutes and seconds
  const minutes = Math.floor(stats.survivalTime / 60);
  const seconds = Math.floor(stats.survivalTime % 60);
  const timeString = `${minutes}m ${seconds}s`;

  // Ensure pointer lock is released when this component mounts
  useEffect(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, []);

  return (
    <div className="retro-screen game-over-screen">
      <div className="retro-container">
        <h1 className="retro-title">Game Over</h1>
        <div className="retro-subtitle">The Dyson Sphere has fallen</div>
        
        <div className="retro-panel stats-panel">
          <h2>Your Stats:</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">Final Score:</span>
              <span className="stat-value">{stats.finalScore}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Survival Time:</span>
              <span className="stat-value">{timeString}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Enemies Defeated:</span>
              <span className="stat-value">{stats.enemiesDefeated}</span>
            </div>
          </div>
        </div>
        
        <button className="retro-button" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen; 