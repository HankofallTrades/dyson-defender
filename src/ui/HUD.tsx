import React, { useEffect, useState, CSSProperties } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats, Reticle, FloatingScore, Position } from '../core/components';
import { COLORS } from '../constants/colors';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import './styles/retro.css';
import { Vector3, Camera } from 'three';

// Helper function to convert world position to screen coordinates
function worldToScreen(position: Position, camera: Camera): { x: number, y: number } | null {
  // Create a Three.js Vector3 from the position
  const vec = new Vector3(position.x, position.y, position.z);
  
  // Project the 3D point to 2D screen coordinates
  vec.project(camera);
  
  // Convert to screen coordinates
  return {
    x: (vec.x * 0.5 + 0.5) * window.innerWidth,
    y: (-vec.y * 0.5 + 0.5) * window.innerHeight
  };
}

interface HUDProps {
  world: World;
  onStartGame: () => void;
  onRestartGame: () => void;
  camera?: Camera; // Add camera as an optional prop
}

const HUD: React.FC<HUDProps> = ({ world, onStartGame, onRestartGame, camera }) => {
  // State to hold UI data
  const [playerHealth, setPlayerHealth] = useState<Health>({ current: 100, max: 100 });
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [dysonHealth, setDysonHealth] = useState({ 
    shieldPercentage: 100, 
    healthPercentage: 100 
  });
  const [enemiesRemaining, setEnemiesRemaining] = useState({ current: 0, total: 0 });
  const [currentWave, setCurrentWave] = useState(1);
  const [boostReady, setBoostReady] = useState(true);
  const [boostData, setBoostData] = useState({
    active: false,
    remaining: 1.0,
    cooldown: 0,
    maxTime: 1.0
  });
  const [damageEffect, setDamageEffect] = useState({ active: false, intensity: 0 });
  const [gameState, setGameState] = useState<'not_started' | 'playing' | 'paused' | 'game_over'>('not_started');
  const [gameOverStats, setGameOverStats] = useState({ finalScore: 0, survivalTime: 0, enemiesDefeated: 0 });
  const [reticle, setReticle] = useState<Reticle>({
    visible: true,
    style: 'default',
    size: 1,
    color: '#00ffff',
    pulsating: true
  });
  const [floatingScores, setFloatingScores] = useState<Array<{
    id: number;
    value: number;
    position: { x: number, y: number };
    color: string;
    opacity: number;
  }>>([]);
  
  // Update UI data from ECS world
  useEffect(() => {
    let lastRender = performance.now();
    
    // This is our "render" function that runs on each animation frame
    const updateHUD = (timestamp: number) => {
      // Calculate time since last update (for smooth animations)
      const deltaTime = timestamp - lastRender;
      lastRender = timestamp;
      
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
      
      // Update reticle
      const reticleComponent = world.getComponent<Reticle>(hudEntity, 'Reticle');
      if (reticleComponent) {
        setReticle(reticleComponent);
      }
      
      // Update boost state from game state - priority update for smoothness
      const gameState = world.getGameState();
      if (gameState) {
        // Boost is ready if cooldown is 0 and there's some boost remaining
        setBoostReady(gameState.boostCooldown <= 0 && gameState.boostRemaining > 0);
        
        // Update the boost data with exact values from game state
        setBoostData({
          active: gameState.boostActive,
          remaining: gameState.boostRemaining,
          cooldown: gameState.boostCooldown,
          maxTime: 1.0
        });
      }
      
      // Update game over stats if in game over state
      if (gameStateDisplay && gameStateDisplay.currentState === 'game_over') {
        const stats = world.getComponent<GameOverStats>(hudEntity, 'GameOverStats');
        if (stats) {
          setGameOverStats(stats);
        }
      }
      
      // Update enemy count from WaveInfo
      const waveEntities = world.getEntitiesWith(['WaveInfo']);
      if (waveEntities.length > 0) {
        const waveEntity = waveEntities[0];
        const waveInfo = world.getComponent<any>(waveEntity, 'WaveInfo');
        if (waveInfo) {
          setEnemiesRemaining({ 
            current: waveInfo.enemiesRemaining,
            total: waveInfo.enemiesRemaining + waveInfo.totalEnemies
          });
          setCurrentWave(waveInfo.currentWave);
        }
      }
      
      // Update floating scores if camera is available
      if (camera) {
        const scoreEntities = world.getEntitiesWith(['FloatingScore', 'Position']);
        const newFloatingScores = scoreEntities.map(entity => {
          const scoreComp = world.getComponent<FloatingScore>(entity, 'FloatingScore');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!scoreComp || !positionComp) return null;
          
          // Convert world position to screen coordinates
          const screenPos = worldToScreen(positionComp, camera);
          
          if (!screenPos) return null;
          
          return {
            id: entity,
            value: scoreComp.value,
            position: screenPos,
            color: scoreComp.color,
            opacity: scoreComp.opacity
          };
        }).filter(score => score !== null) as Array<{
          id: number;
          value: number;
          position: { x: number, y: number };
          color: string;
          opacity: number;
        }>;
        
        setFloatingScores(newFloatingScores);
      }
      
      // Request next frame update - use the timestamp
      requestAnimationFrame(updateHUD);
    };
    
    // Start the update loop
    const animationId = requestAnimationFrame(updateHUD);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [world, camera]);
  
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
      
      {/* Floating Score Indicators */}
      {floatingScores.map(score => (
        <div
          key={score.id}
          className="floating-score"
          style={{
            position: 'absolute',
            top: score.position.y,
            left: score.position.x,
            transform: 'translate(-50%, -50%)',
            color: score.color,
            opacity: score.opacity,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: `0 0 8px ${score.color}`,
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          +{score.value}
        </div>
      ))}
      
      {/* Retro Futuristic Reticle */}
      {reticle.visible && gameState === 'playing' && (
        <div
          className={`retro-reticle ${reticle.pulsating ? 'pulsating' : ''}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) ${damageEffect.active ? getShakeTransform() : ''}`,
            width: `${30 * reticle.size}px`,
            height: `${30 * reticle.size}px`,
            zIndex: 5,
            pointerEvents: 'none',
            opacity: reticle.pulsating ? 0.8 : 1
          }}
        >
          {/* Inner Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${4 * reticle.size}px`,
            height: `${4 * reticle.size}px`,
            borderRadius: '50%',
            border: `1px solid ${reticle.color}`,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.25
          }}></div>
          
          {/* Outer Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${20 * reticle.size}px`,
            height: `${20 * reticle.size}px`,
            borderRadius: '50%',
            border: `1px solid ${reticle.color}`,
            boxShadow: `0 0 8px ${reticle.color}`,
            opacity: 0.35
          }}></div>
          
          {/* Crosshair lines */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            transform: 'translateY(-50%)',
            width: '100%',
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.4
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            height: '100%',
            width: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.4
          }}></div>
          
          {/* Corner brackets */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${8 * reticle.size}px`,
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: `${1 * reticle.size}px`,
            height: `${8 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: `${8 * reticle.size}px`,
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: `${1 * reticle.size}px`,
            height: `${8 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: `${8 * reticle.size}px`,
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: `${1 * reticle.size}px`,
            height: `${8 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: `${8 * reticle.size}px`,
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: `${1 * reticle.size}px`,
            height: `${8 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
          }}></div>
        </div>
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
        <div style={{ color: '#44ff44' }}>Wave: {currentWave}</div>
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
        width: '350px', // Fixed width to prevent resizing
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
          marginBottom: '5px',
          color: hullStatus.color,
          whiteSpace: 'nowrap' // Prevent text wrapping
        }}>
          <span style={{ marginRight: '5px' }}>HULL STATUS:</span>
          <span>{hullStatus.text}</span>
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
          BOOST SYSTEM:
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
            width: boostData.cooldown > 0 
              ? `${(1 - boostData.cooldown / 3.0) * 100}%` 
              : `${Math.max(0, (boostData.remaining / boostData.maxTime) * 100)}%`,
            height: '100%',
            background: boostData.cooldown > 0
              ? 'linear-gradient(90deg, #330066, #660066)'
              : (boostData.active 
                  ? 'linear-gradient(90deg, #ff00ff, #00ffff)' 
                  : 'linear-gradient(90deg, #00ffff, #ff00ff)'),
            boxShadow: boostData.active 
              ? '0 0 10px #ff00ff, 0 0 20px #ff00ff' 
              : 'none',
            // Animation style based on state for smoother appearance
            transitionProperty: 'box-shadow, background',
            transitionDuration: '0.2s',
            // No transition for width - direct updates
            transform: 'translateZ(0)', // Hardware acceleration hint
            willChange: 'width' // Hint for browser optimization
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
            {boostData.cooldown > 0 
              ? "CHARGING" 
              : boostData.active 
                ? "ACTIVE" 
                : "READY"
            }
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
