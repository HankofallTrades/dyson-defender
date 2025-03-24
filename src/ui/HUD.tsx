import React, { useEffect, useState, CSSProperties } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus } from '../core/components';
import { COLORS } from '../constants/colors';
import './styles/retro.css';

interface HUDProps {
  world: World;
}

const HUD: React.FC<HUDProps> = ({ world }) => {
  // State to hold UI data
  const [playerHealth, setPlayerHealth] = useState({ current: 0, max: 0 });
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [dysonHealth, setDysonHealth] = useState(100);
  const [enemiesRemaining, setEnemiesRemaining] = useState({ current: 0, total: 0 });
  const [boostReady, setBoostReady] = useState(true);
  
  // Update UI data from ECS world
  useEffect(() => {
    // This is our "render" function that runs on each animation frame
    const updateHUD = () => {
      const hudEntities = world.getEntitiesWith(['UIDisplay']);
      if (hudEntities.length === 0) return;
      
      const hudEntity = hudEntities[0];
      
      // Update health
      const healthDisplay = world.getComponent<HealthDisplay>(hudEntity, 'HealthDisplay');
      if (healthDisplay) {
        const targetHealth = world.getComponent<Health>(healthDisplay.entity, 'Health');
        if (targetHealth) {
          setPlayerHealth(targetHealth);
        }
      }
      
      // Update score
      const scoreDisplay = world.getComponent<ScoreDisplay>(hudEntity, 'ScoreDisplay');
      if (scoreDisplay) {
        setScore(scoreDisplay.score);
      }
      
      // Update message
      const messageDisplay = world.getComponent<MessageDisplay>(hudEntity, 'MessageDisplay');
      if (messageDisplay) {
        setMessage(messageDisplay.message);
      }
      
      // Update Dyson Sphere status
      const dysonStatus = world.getComponent<DysonSphereStatus>(hudEntity, 'DysonSphereStatus');
      if (dysonStatus) {
        setDysonHealth(dysonStatus.healthPercentage);
      }
      
      // Update enemy count - in a real implementation this would come from the wave system
      // This is just a placeholder
      setEnemiesRemaining({ current: 3, total: 8 });
      
      // Request next frame update
      requestAnimationFrame(updateHUD);
    };
    
    // Start the update loop
    const animationId = requestAnimationFrame(updateHUD);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [world]);
  
  // Convert hex color to CSS color format
  const hexToCSS = (hexColor: number): string => {
    return `#${hexColor.toString(16).padStart(6, '0')}`;
  };
  
  return (
    <>
      {/* Dyson Sphere HUD - Top Left */}
      <div className="retro-text pulse-border" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #ff00ff',
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
        minWidth: '250px',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '0.8rem',
        lineHeight: '1.8rem',
        textShadow: '2px 2px 0 #000, 0 0 10px #00ffff',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ color: '#00ffff' }}>Score: {score}</div>
        <div style={{ color: '#ffff00' }}>Shield: {Math.round(dysonHealth)}%</div>
        <div style={{ color: '#ff5722' }}>Health: {Math.round(dysonHealth * 5)}</div>
        <div style={{ color: '#ff00ff' }}>Enemies: {enemiesRemaining.current}/{enemiesRemaining.total}</div>
      </div>
      
      {/* Player HUD - Bottom */}
      <div className="retro-text pulse-border" style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #ff00ff',
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
        minWidth: '300px',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '0.8rem',
        lineHeight: '1.8rem',
        textShadow: '2px 2px 0 #000, 0 0 10px #00ffff',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ color: '#ff5722', textAlign: 'center' }}>
          HULL STATUS: {playerHealth.current < playerHealth.max * 0.2 ? 'CRITICAL' : 'NOMINAL'}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill player-health"
            style={{ 
              width: `${(playerHealth.current / playerHealth.max) * 100}%`,
            }}
          />
        </div>
        
        <div style={{ color: '#00ffff', textAlign: 'center', marginTop: '10px' }}>
          BOOST SYSTEM: {boostReady ? 'READY' : 'CHARGING'}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill boost"
            style={{ 
              width: boostReady ? '100%' : '60%',
            }}
          />
        </div>
      </div>
      
      {/* Smaller, less intrusive message display in top right */}
      {message && (
        <div className="retro-text" style={{ 
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 15px',
          borderRadius: '8px',
          border: '2px solid #ff00ff',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '0.7rem',
          textAlign: 'center',
          color: '#ffff00',
          zIndex: 10,
          pointerEvents: 'none',
          maxWidth: '250px'
        }}>
          {message}
        </div>
      )}
    </>
  );
};

export default HUD;
