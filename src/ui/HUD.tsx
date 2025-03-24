import React, { useEffect, useState, CSSProperties } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats } from '../core/components';
import { COLORS } from '../constants/colors';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import './styles/retro.css';

interface HUDProps {
  world: World;
  onStartGame: () => void;
  onRestartGame: () => void;
}

const HUD: React.FC<HUDProps> = ({ world, onStartGame, onRestartGame }) => {
  // State to hold UI data
  const [playerHealth, setPlayerHealth] = useState({ current: 100, max: 100 });
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [dysonHealth, setDysonHealth] = useState({ 
    shieldPercentage: 100, 
    healthPercentage: 100 
  });
  const [enemiesRemaining, setEnemiesRemaining] = useState({ current: 0, total: 0 });
  const [boostReady, setBoostReady] = useState(true);
  const [damageEffect, setDamageEffect] = useState({ active: false, intensity: 0 });
  const [gameState, setGameState] = useState<'not_started' | 'playing' | 'paused' | 'game_over'>('not_started');
  const [gameOverStats, setGameOverStats] = useState({ finalScore: 0, survivalTime: 0, enemiesDefeated: 0 });
  
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
        setDysonHealth({
          shieldPercentage: dysonStatus.shieldPercentage,
          healthPercentage: dysonStatus.healthPercentage
        });
      }
      
      // Update damage effect
      const damageEffectComp = world.getComponent<DamageEffect>(hudEntity, 'DamageEffect');
      if (damageEffectComp) {
        setDamageEffect({
          active: damageEffectComp.active,
          intensity: damageEffectComp.intensity
        });
      }
      
      // Update game state
      const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      if (gameStateDisplay) {
        setGameState(gameStateDisplay.currentState);
      }
      
      // Update game over stats if in game over state
      if (gameState === 'game_over') {
        const stats = world.getComponent<GameOverStats>(hudEntity, 'GameOverStats');
        if (stats) {
          setGameOverStats(stats);
        }
      }
      
      // Update enemy count
      setEnemiesRemaining({ current: 3, total: 8 }); // Placeholder
      
      // Request next frame update
      requestAnimationFrame(updateHUD);
    };
    
    // Start the update loop
    const animationId = requestAnimationFrame(updateHUD);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [world, gameState]);
  
  // Convert hex color to CSS color format
  const hexToCSS = (hexColor: number): string => {
    return `#${hexColor.toString(16).padStart(6, '0')}`;
  };
  
  // Calculate player health percentage
  const playerHealthPercentage = (playerHealth.current / playerHealth.max) * 100;
  
  // Determine hull status text and color based on health percentage
  const getHullStatus = () => {
    if (playerHealthPercentage > 75) {
      return { text: 'OPTIMAL', color: '#4CAF50' };
    } else if (playerHealthPercentage > 50) {
      return { text: 'FUNCTIONAL', color: '#FFC107' };
    } else if (playerHealthPercentage > 25) {
      return { text: 'WARNING', color: '#FF9800' };
    } else {
      return { text: 'CRITICAL', color: '#F44336' };
    }
  };
  
  const hullStatus = getHullStatus();

  // Generate random shake transform when damage effect is active
  const getShakeTransform = (): string => {
    if (damageEffect.active) {
      const intensity = damageEffect.intensity * 10;
      const xShake = (Math.random() - 0.5) * intensity;
      const yShake = (Math.random() - 0.5) * intensity;
      return `translate(${xShake}px, ${yShake}px)`;
    }
    return 'translate(0, 0)';
  };
  
  // Render appropriate screen based on game state
  if (gameState === 'not_started') {
    return <StartScreen onStartGame={onStartGame} />;
  }
  
  if (gameState === 'game_over') {
    return <GameOverScreen stats={gameOverStats} onRestart={onRestartGame} />;
  }
  
  // Main game HUD (only show when playing)
  return (
    <>
      {/* Damage effect overlay */}
      {damageEffect.active && (
        <div className="damage-effect" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          boxShadow: `inset 0 0 ${50 * damageEffect.intensity}px rgba(255, 0, 0, 0.8)`,
          zIndex: 100,
          pointerEvents: 'none',
          transform: getShakeTransform()
        }} />
      )}
      
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
        pointerEvents: 'none',
        transform: damageEffect.active ? getShakeTransform() : 'none'
      }}>
        <div style={{ color: '#00ffff' }}>Score: {score}</div>
        <div style={{ color: '#ffff00' }}>Shield: {Math.round(dysonHealth.shieldPercentage)}%</div>
        <div style={{ color: '#ff5722' }}>Health: {Math.round(dysonHealth.healthPercentage * 5)}</div>
        <div style={{ color: '#ff00ff' }}>Enemies: {enemiesRemaining.current}/{enemiesRemaining.total}</div>
      </div>
      
      {/* Player HUD - Bottom */}
      <div className="retro-text pulse-border" style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: `translateX(-50%) ${damageEffect.active ? getShakeTransform() : ''}`,
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
        {/* Pilot Health Section with Dynamic Color */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '5px',
          color: hullStatus.color
        }}>
          <span>HULL STATUS: <span>{hullStatus.text}</span></span>
        </div>
        {/* Health Bar with Gradient and Percentage */}
        <div style={{
          width: '100%',
          height: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid #555555',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.3), inset 0 0 5px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}>
          <div style={{ 
            width: `${playerHealthPercentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, 
              #F44336, 
              ${playerHealthPercentage > 60 ? '#4CAF50' : 
                playerHealthPercentage > 30 ? '#FFC107' : '#F44336'})`,
            transition: 'width 0.3s ease'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffffff',
            textShadow: '1px 1px 2px #000000',
            fontSize: '0.65rem',
            fontWeight: 'bold'
          }}>
            {Math.round(playerHealthPercentage)}%
          </div>
        </div>
        
        <div style={{ color: '#00ffff', textAlign: 'center', marginTop: '10px' }}>
          BOOST SYSTEM: {boostReady ? 'READY' : 'CHARGING'}
        </div>
        {/* Thicker Boost Bar */}
        <div style={{
          width: '100%',
          height: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid #555555',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.3), inset 0 0 5px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}>
          <div style={{ 
            width: boostReady ? '100%' : '60%',
            height: '100%',
            background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
            transition: 'width 0.3s ease'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffffff',
            textShadow: '1px 1px 2px #000000',
            fontSize: '0.65rem',
            fontWeight: 'bold'
          }}>
            {boostReady ? 'READY' : '60%'}
          </div>
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
          maxWidth: '250px',
          transform: damageEffect.active ? getShakeTransform() : 'none'
        }}>
          {message}
        </div>
      )}
    </>
  );
};

export default HUD;
