import React, { useEffect, useState, CSSProperties, useRef } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats, Reticle, FloatingScore, Position, WaveInfo, Radar, ShieldBarComponent, ShieldComponent, HealthBarComponent } from '../core/components';
import { COLORS } from '../constants/colors';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import PauseScreen from './PauseScreen';
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

// Hook for responsive design
function useScreenSize() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
}

interface HUDProps {
  world: World;
  onStartGame: () => void;
  onRestartGame: () => void;
  onResumeGame: () => void;
  onRestartAtWave: (waveNumber: number) => void;
  camera?: Camera; // Add camera as an optional prop
}

const HUD: React.FC<HUDProps> = ({ world, onStartGame, onRestartGame, onResumeGame, onRestartAtWave, camera }) => {
  // Screen size for responsive layout
  const screen = useScreenSize();
  
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
  const [gameOverStats, setGameOverStats] = useState({ finalScore: 0, survivalTime: 0, enemiesDefeated: 0, wavesCompleted: 0 });
  const [waveCountdown, setWaveCountdown] = useState<number | null>(null);
  const [waveComplete, setWaveComplete] = useState(false);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [animatedMessages, setAnimatedMessages] = useState<Set<string>>(new Set());
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
  const [radarData, setRadarData] = useState<{
    active: boolean;
    trackedEntities: Array<{
      entityId: number;
      entityType: string;
      distance: number;
      direction: {
        x: number;
        y: number;
        z: number;
      };
      threatLevel: number;
    }>;
  }>({
    active: true,
    trackedEntities: []
  });
  
  // Add state for shield bars
  const [shieldBars, setShieldBars] = useState<Array<{
    id: number;
    position: { x: number, y: number };
    width: number;
    height: number;
    percent: number;
  }>>([]);
  
  // Add state for health bars
  const [healthBars, setHealthBars] = useState<Array<{
    id: number;
    position: { x: number, y: number };
    width: number;
    height: number;
    percent: number;
  }>>([]);
  
  // State for tracking brackets position with lag effect
  const [bracketsOffset, setBracketsOffset] = useState({ x: 0, y: 0 });
  const lastMouseMoveRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Use a ref to track processed messages so we have immediate access to the latest value
  const processedMessagesRef = useRef<Set<string>>(new Set());
  
  // Add this ref near the other refs (around line 95)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
        const newMessage = messageDisplay.message;
        
        // Only process if this is a new message that we haven't seen before
        if (newMessage && newMessage.trim() !== '' && 
            !processedMessagesRef.current.has(newMessage) && 
            !alertMessages.includes(newMessage) &&  
            !(newMessage === "OBJECTIVE: DEFEND THE DYSON SPHERE" && 
              alertMessages.includes("OBJECTIVE: DEFEND THE DYSON SPHERE"))) {
          
          // Add to processed messages ref immediately
          processedMessagesRef.current.add(newMessage);
          
          // Add to alert messages array - keep all messages, don't limit to 4
          setAlertMessages(prev => [...prev, newMessage]);
        }
        
        setMessage(newMessage);
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
      
      // Update wave information
      const waveEntities = world.getEntitiesWith(['WaveInfo']);
      if (waveEntities.length > 0) {
        const waveInfo = world.getComponent<WaveInfo>(waveEntities[0], 'WaveInfo');
        if (waveInfo) {
          setCurrentWave(waveInfo.currentWave);
          setEnemiesRemaining({
            current: waveInfo.enemiesRemaining,
            total: waveInfo.totalEnemies + waveInfo.enemiesRemaining
          });
          
          // Update wave countdown and completion state
          if (!waveInfo.isActive && waveInfo.nextWaveTimer > 0) {
            // Round to nearest integer for clean display
            setWaveCountdown(Math.ceil(waveInfo.nextWaveTimer));
            setWaveComplete(waveInfo.currentWave > 0);
          } else {
            setWaveCountdown(null);
            setWaveComplete(false);
          }
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
      
      // Update radar data
      const radarComponent = world.getComponent<Radar>(hudEntity, 'Radar');
      if (radarComponent) {
        setRadarData({
          active: radarComponent.active,
          trackedEntities: radarComponent.trackedEntities
        });
      }
      
      // Update shield bars if camera is available
      if (camera) {
        const shieldBarEntities = world.getEntitiesWith(['ShieldBarComponent', 'Position']);
        
        const newShieldBars = shieldBarEntities.map(entity => {
          const shieldBarComp = world.getComponent<ShieldBarComponent>(entity, 'ShieldBarComponent');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!shieldBarComp || !positionComp || !shieldBarComp.visible) return null;
          
          // Get the shield component to determine fill percentage
          const shieldComp = world.getComponent<ShieldComponent>(shieldBarComp.entity, 'ShieldComponent');
          if (!shieldComp) return null;
          
          // Convert world position to screen coordinates
          const basePos = worldToScreen({
            x: positionComp.x,
            y: positionComp.y + shieldBarComp.offsetY, // Apply vertical offset
            z: positionComp.z
          }, camera);
          
          if (!basePos) return null;
          
          const percent = (shieldComp.currentShield / shieldComp.maxShield) * 100;
          
          return {
            id: entity,
            position: basePos,
            width: shieldBarComp.width,
            height: shieldBarComp.height,
            percent
          };
        }).filter(bar => bar !== null) as Array<{
          id: number;
          position: { x: number, y: number };
          width: number;
          height: number;
          percent: number;
        }>;
        
        setShieldBars(newShieldBars);
        
        // Update health bars
        const healthBarEntities = world.getEntitiesWith(['HealthBarComponent', 'Position']);
        
        const newHealthBars = healthBarEntities.map(entity => {
          const healthBarComp = world.getComponent<HealthBarComponent>(entity, 'HealthBarComponent');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!healthBarComp || !positionComp || !healthBarComp.visible) return null;
          
          // Get the health component to determine fill percentage
          const healthComp = world.getComponent<Health>(healthBarComp.entity, 'Health');
          if (!healthComp) return null;
          
          // Convert world position to screen coordinates
          const basePos = worldToScreen({
            x: positionComp.x,
            y: positionComp.y + healthBarComp.offsetY, // Apply vertical offset
            z: positionComp.z
          }, camera);
          
          if (!basePos) return null;
          
          const percent = (healthComp.current / healthComp.max) * 100;
          
          return {
            id: entity,
            position: basePos,
            width: healthBarComp.width,
            height: healthBarComp.height,
            percent
          };
        }).filter(bar => bar !== null) as Array<{
          id: number;
          position: { x: number, y: number };
          width: number;
          height: number;
          percent: number;
        }>;
        
        setHealthBars(newHealthBars);
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
  
  // Effect to handle alert messages after wave countdown
  useEffect(() => {
    // When wave countdown ends (changes from a number to null), show only the objective alert
    if (waveCountdown === null && gameState === 'playing') {
      // Clear alerts immediately before setting new one to prevent flashing
      setAlertMessages([]);
      
      // Small delay to ensure full clear before showing objective
      setTimeout(() => {
        // Always show the objective message when wave countdown ends
        setAlertMessages(["OBJECTIVE: DEFEND THE DYSON SPHERE"]);
        // Reset animated messages so objective gets animated
        setAnimatedMessages(new Set());
      }, 200);
    }
  }, [waveCountdown, gameState]); // Remove alertMessages from dependencies
  
  // Reset processed messages when starting a new wave
  useEffect(() => {
    if (waveCountdown !== null) {
      // Reset the processed messages when a new wave is about to start
      processedMessagesRef.current = new Set();
      // Reset animated messages so new messages get animated
      setAnimatedMessages(new Set());
    }
  }, [waveCountdown]);
  
  // Add this effect to scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [alertMessages]);
  
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
  
  // Add handlers for pause functionality
  const handlePauseGame = () => {
    if (gameState === 'playing') {
      // Update world gameState
      const hudEntities = world.getEntitiesWith(['UIDisplay']);
      if (hudEntities.length > 0) {
        const hudEntity = hudEntities[0];
        const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
        
        if (gameStateDisplay) {
          // Remove the old component and add the updated one
          world.removeComponent(hudEntity, 'GameStateDisplay');
          world.addComponent(hudEntity, 'GameStateDisplay', {
            ...gameStateDisplay,
            currentState: 'paused'
          });
        }
      }
    }
  };
  
  const handleResumeGame = () => {
    // Call the prop function to handle resuming the game at the App level
    onResumeGame();
    
    // Update world gameState
    const hudEntities = world.getEntitiesWith(['UIDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // Remove the old component and add the updated one
        world.removeComponent(hudEntity, 'GameStateDisplay');
        world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    }
  };
  
  const handleSelectWave = (wave: number) => {
    // Call the App-level handler to fully restart the game at the selected wave
    onRestartAtWave(wave);
  };
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        handlePauseGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  // Add effect to handle mouse movement for reticle bracket lag
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Capture mouse movement - negate the values to make brackets move in opposite direction
      const now = performance.now();
      
      // Calculate magnitude of movement (speed)
      const movementMagnitude = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
      
      lastMouseMoveRef.current = { 
        x: -e.movementX, // Negate to make brackets move in opposite direction
        y: -e.movementY, // Negate to make brackets move in opposite direction
        time: now 
      };
    };

    // Animation frame to update bracket positions with smoother, springier motion
    const updateBracketPositions = () => {
      if (gameState === 'playing') {
        const now = performance.now();
        const timeSinceLastMove = now - lastMouseMoveRef.current.time;
        
        // Apply lag effect with springy motion
        const lagFactor = 0.15; // Reduced for smoother movement
        const springFactor = 0.08; // Reduced for smoother return
        const maxOffset = 60; // Maximum pixel offset in any direction
        
        // If there was recent mouse movement, update the offset
        if (timeSinceLastMove < 100) {
          // Add to the current offset
          setBracketsOffset(prev => {
            // Calculate new position with lag effect - simplified for smoother motion
            const targetX = lastMouseMoveRef.current.x;
            const targetY = lastMouseMoveRef.current.y;
            
            const newX = prev.x + (targetX - prev.x) * lagFactor;
            const newY = prev.y + (targetY - prev.y) * lagFactor;
            
            // Apply maximum limits
            return {
              x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
              y: Math.max(-maxOffset, Math.min(maxOffset, newY))
            };
          });
        } else {
          // No recent movement, smoothly return to center using the same factor
          setBracketsOffset(prev => ({
            x: prev.x * (1 - springFactor),
            y: prev.y * (1 - springFactor)
          }));
        }
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(updateBracketPositions);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    let animationFrameId = requestAnimationFrame(updateBracketPositions);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);
  
  // Render appropriate screen based on game state
  if (gameState === 'not_started') {
    return <StartScreen onStartGame={onStartGame} />;
  }
  
  if (gameState === 'game_over') {
    return <GameOverScreen stats={gameOverStats} onRestart={onRestartGame} />;
  }
  
  if (gameState === 'paused') {
    return (
      <PauseScreen 
        onResume={handleResumeGame} 
        onRestart={onRestartGame}
        currentWave={currentWave}
        onSelectWave={handleSelectWave}
      />
    );
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
      
      {/* Shield Bars */}
      {shieldBars.map(bar => (
        <div
          key={bar.id}
          style={{
            position: 'absolute',
            top: bar.position.y,
            left: bar.position.x - bar.width / 2, // Center on position
            width: `${bar.width}px`,
            height: `${bar.height}px`,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #21a9f3',
            borderRadius: '2px',
            overflow: 'hidden',
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(33, 169, 243, 0.6)'
          }}
        >
          <div style={{
            width: `${bar.percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #21a9f3, #64c6f7)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      ))}
      
      {/* Health Bars */}
      {healthBars.map(bar => (
        <div
          key={bar.id}
          style={{
            position: 'absolute',
            top: bar.position.y,
            left: bar.position.x - bar.width / 2, // Center on position
            width: `${bar.width}px`,
            height: `${bar.height}px`,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #ff5252',
            borderRadius: '2px',
            overflow: 'hidden',
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(255, 82, 82, 0.6)'
          }}
        >
          <div style={{
            width: `${bar.percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff5252, #ff8a80)',
            transition: 'width 0.2s ease'
          }} />
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
            opacity: 0.6
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
            opacity: 0.6
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
            opacity: 0.6
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
            opacity: 0.6
          }}></div>
          
          {/* Corner brackets with lag effect - create a container for all brackets */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            transform: `translate(${bracketsOffset.x}px, ${bracketsOffset.y}px)`,
            transition: 'none', // Removed transition for more direct control
            opacity: 0.4 // Added transparency to brackets
          }}>
            {/* Top-left brackets */}
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
            
            {/* Top-right brackets */}
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
            
            {/* Bottom-left brackets */}
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
            
            {/* Bottom-right brackets */}
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
        </div>
      )}
      
      {/* Top-Left Status Panel (Updated to match the console style) */}
      <div className="console-panel retro-text" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: screen.isMobile ? '180px' : '250px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderBottom: '2px solid #ff00ff',
        borderLeft: '2px solid #ff00ff',
        borderRight: '2px solid #ff00ff',
        borderBottomLeftRadius: '15px',
        borderBottomRightRadius: '15px',
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
        padding: '12px',
        zIndex: 10,
        pointerEvents: 'none',
        transform: damageEffect.active ? getShakeTransform() : 'none'
      }}>
        <div style={{
          borderBottom: '1px solid #ff00ff',
          paddingBottom: '8px',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#ff00ff', fontSize: '0.7rem' }}>STATUS</span>
          <span style={{ 
            color: '#00ffff', 
            fontSize: '0.6rem',
            animation: 'pulse-opacity 1s infinite alternate'
          }}>ACTIVE</span>
        </div>
        
        <div style={{ color: '#00ffff', fontSize: '0.7rem', marginBottom: '5px' }}>
          SCORE: <span style={{ color: '#ffff00' }}>{score}</span>
        </div>
        <div style={{ color: '#00ffff', fontSize: '0.7rem', marginBottom: '5px' }}>
          SHIELD: <span style={{ color: '#21a9f3' }}>{Math.round(dysonHealth.shieldPercentage)}%</span>
        </div>
        <div style={{ color: '#00ffff', fontSize: '0.7rem', marginBottom: '5px' }}>
          HEALTH: <span style={{ color: '#ff5722' }}>{Math.round(dysonHealth.healthPercentage * 5)}</span>
        </div>
        <div style={{ color: '#00ffff', fontSize: '0.7rem' }}>
          DYSON CORE: <span style={{ 
            color: dysonHealth.healthPercentage < 20 ? '#ff0000' : '#44ff44',
            animation: dysonHealth.healthPercentage < 20 ? 'alertBlink 0.5s infinite alternate' : 'none'
          }}>
            {dysonHealth.healthPercentage < 20 ? 'CRITICAL' : 'STABLE'}
          </span>
        </div>
      </div>
      
      {/* Player HUD - Bottom */}
      <div className="ship-console" style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: `translateX(-50%) ${damageEffect.active ? getShakeTransform() : ''}`,
        display: 'flex',
        width: '90%',
        maxWidth: '1200px',
        height: screen.isMobile ? '120px' : '180px',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        zIndex: 10,
        pointerEvents: 'none',
        flexDirection: screen.isMobile ? 'column' : 'row'
      }}>
        {/* Left Panel - Messages Console */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '32%',
          height: screen.isMobile ? '120px' : '100%',
          marginBottom: screen.isMobile ? '10px' : '0',
          display: screen.isMobile && !waveCountdown ? 'none' : 'flex', // Hide on mobile when no wave activity
          background: 'rgba(0, 0, 0, 0.7)',
          borderTop: '2px solid #ff00ff',
          borderLeft: '2px solid #ff00ff',
          borderRight: '2px solid #ff00ff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
          padding: '12px',
          overflow: 'hidden',
          flexDirection: 'column',
          minWidth: '350px'
        }}>
          <div style={{
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '8px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>
              {waveCountdown !== null ? 'ALERT' : 'COMMS'}
              {(alertMessages.length > 0 || waveCountdown !== null) && <span className="notification-indicator"></span>}
            </span>
            <span style={{ 
              color: waveCountdown !== null ? '#ff5555' : '#00ffff', 
              fontSize: '0.6rem',
              animation: waveCountdown !== null ? 'alert-text-blink 1s infinite' : 'pulse-opacity 1s infinite alternate'
            }}>
              {waveCountdown !== null ? 'WARNING' : 'ONLINE'}
            </span>
          </div>
          
          <div style={{ 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {waveCountdown && (
              <div 
                className="wave-alert-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '1rem',
                  zIndex: 2,
                  animation: waveComplete ? 'wave-alert-flicker 0.5s infinite' : 'none'
                }}
              >
                {waveComplete ? (
                  <div 
                    style={{
                      color: '#ff0000', 
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      textShadow: '0 0 10px #ff0000',
                      animation: 'alert-text-blink 1s infinite',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{letterSpacing: '0.2rem'}}>WAVE COMPLETE</div>
                    <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>
                      NEXT WAVE IN {waveCountdown}
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{
                      color: '#ff9900', 
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      textShadow: '0 0 10px #ff9900',
                      animation: 'alert-text-blink 1s infinite',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{letterSpacing: '0.2rem'}}>INCOMING WAVE</div>
                    <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>
                      {waveCountdown}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Normal console content when no wave notification */}
            {waveCountdown === null && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                padding: '5px 0',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
                maxHeight: '100%'
              }}>
                {/* Display messages with oldest at the top, newest at the bottom */}
                {alertMessages.map((alert, index) => {
                  // Only animate messages that haven't been animated yet
                  const shouldAnimate = !animatedMessages.has(alert);
                  
                  // When a message has been rendered with animation, add it to the set
                  if (shouldAnimate) {
                    // Use timeout to ensure message gets animated before adding to set
                    setTimeout(() => {
                      setAnimatedMessages(prev => new Set([...prev, alert]));
                    }, 2100); // Wait for animation to complete
                  }

                  // Split message into lines with max 25 characters per line
                  const words = alert.split(' ');
                  let lines: string[] = [];
                  let currentLine = '';

                  words.forEach(word => {
                    if (currentLine.length + word.length + 1 > 25) {
                      lines.push(currentLine.trim());
                      currentLine = word;
                    } else {
                      currentLine += (currentLine ? ' ' : '') + word;
                    }
                  });
                  if (currentLine) {
                    lines.push(currentLine.trim());
                  }
                  
                  return (
                    <div 
                      key={`alert-${index}-${alert}`}
                      style={{ 
                        color: alert.includes('OBJECTIVE') ? '#00ff00' : '#ff5555', 
                        fontSize: '0.7rem', 
                        marginBottom: '8px',
                        width: '100%',
                        lineHeight: '1.2'
                      }}
                    >
                      &gt; {lines.map((line, lineIndex) => (
                        <div 
                          key={`line-${lineIndex}`}
                          style={{
                            display: 'block',
                            marginLeft: lineIndex > 0 ? '12px' : '0'
                          }}
                        >
                          <span 
                            className={shouldAnimate ? `typing-animation line-${lineIndex}` : ""}
                            style={{
                              display: 'inline-block',
                              maxWidth: 'calc(100% - 15px)',
                              wordBreak: 'break-word',
                              '--delay': lineIndex * 1.2,
                              '--total-lines': lines.length,
                              '--line-index': lineIndex
                            } as React.CSSProperties}
                          >
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {alertMessages.length === 0 && (
                  <div style={{ color: '#666666', fontSize: '0.7rem', fontStyle: 'italic' }}>
                    &gt; No messages
                  </div>
                )}
                <div ref={messagesEndRef} /> {/* This element helps us scroll to the bottom */}
              </div>
            )}
          </div>
        </div>
        
        {/* Center Panel - Ship Status */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '32%',
          height: screen.isMobile ? '120px' : '100%',
          marginBottom: screen.isMobile ? '10px' : '0',
          background: 'rgba(0, 0, 0, 0.7)',
          borderTop: '2px solid #ff00ff',
          borderLeft: '2px solid #ff00ff',
          borderRight: '2px solid #ff00ff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '8px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem' }}>SYSTEMS</span>
            <span style={{ 
              color: hullStatus.color, 
              fontSize: '0.6rem',
              animation: hullStatus.text === 'CRITICAL' ? 'alertBlink 0.5s infinite alternate' : 'none'
            }}>{hullStatus.text}</span>
          </div>

          {/* Hull Status */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '5px',
              color: hullStatus.color,
              fontSize: '0.7rem'
            }}>
              <span>HULL INTEGRITY:</span>
            </div>
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
          </div>
          
          {/* Boost System */}
          <div>
            <div style={{
              color: '#00ffff', 
              marginBottom: '5px',
              fontSize: '0.7rem'
            }}>
              BOOST SYSTEM:
            </div>
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
                transitionProperty: 'box-shadow, background',
                transitionDuration: '0.2s',
                transform: 'translateZ(0)',
                willChange: 'width'
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
          
          {/* Ship information */}
          <div style={{
            marginTop: 'auto',
            borderTop: '1px solid #555555',
            paddingTop: '8px',
            color: '#bbbbbb',
            fontSize: '0.6rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>CLASS: DEFENDER</div>
            <div>ID: DSP-117</div>
          </div>
        </div>
        
        {/* Right Panel - Radar */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '32%',
          height: screen.isMobile ? '120px' : '100%',
          display: screen.isMobile ? 'none' : 'flex', // Hide radar on mobile
          background: 'rgba(0, 0, 0, 0.7)',
          borderTop: '2px solid #ff00ff',
          borderLeft: '2px solid #ff00ff',
          borderRight: '2px solid #ff00ff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
          padding: '12px',
          flexDirection: 'column'
        }}>
          <div style={{
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '8px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem' }}>RADAR</span>
            <span style={{ 
              color: radarData.trackedEntities.filter(entity => entity.entityType !== 'dysonSphere').length > 0 ? '#ff5555' : '#00ffff', 
              fontSize: '0.6rem',
              animation: 'pulse-opacity 1s infinite alternate'
            }}>
              {radarData.trackedEntities.filter(entity => entity.entityType !== 'dysonSphere').length > 0 ? 'THREATS DETECTED' : 'SCANNING'}
            </span>
          </div>
          
          {/* Radar Display */}
          <div style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Radar circle */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid #00ffff',
              boxShadow: 'inset 0 0 15px rgba(0, 255, 255, 0.3)',
              position: 'relative'
            }}>
              {/* Center dot */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00ffff',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 5px #00ffff',
              }}></div>
              
              {/* Direction indicator - points up to show player's forward direction */}
              <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: '0',
                height: '0',
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '10px solid #00ffff',
                transform: 'translateX(-50%)',
                opacity: 0.8,
              }}></div>
              
              {/* Radar grid lines */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '0',
                right: '0',
                height: '1px',
                background: 'rgba(0, 255, 255, 0.3)'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '0',
                bottom: '0',
                left: '50%',
                width: '1px',
                background: 'rgba(0, 255, 255, 0.3)'
              }}></div>
              
              {/* Radar concentric circles */}
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                right: '25%',
                bottom: '25%',
                borderRadius: '50%',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}></div>
              
              {/* Improved classic radar sweep line */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '0',
                height: '0',
                zIndex: 5,
                animation: 'radar-scan 2s linear infinite',
                transformOrigin: 'center center',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  width: '60px', // Radius length
                  height: '1.5px',
                  background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.6), rgba(0, 255, 255, 0.05))',
                  transform: 'rotate(90deg)',
                  transformOrigin: 'left center',
                  boxShadow: '0 0 3px rgba(0, 255, 255, 0.5)',
                }}></div>
              </div>
              
              {/* Enemy blips - use actual enemy positions from radar data */}
              {radarData.trackedEntities.map((entity, index) => {
                // Using fixed 250 unit radius for the radar
                const radarRadius = 250;
                
                // Calculate direction vector components
                let dirX = entity.direction.x;
                let dirZ = entity.direction.z;
                
                // Calculate actual distance in X-Z plane (ignoring Y/elevation)
                const xzDistance = Math.sqrt(
                  Math.pow(entity.direction.x * entity.distance, 2) + 
                  Math.pow(entity.direction.z * entity.distance, 2)
                );
                
                // Scale the direction by the distance - closer to max distance = closer to edge
                // This creates the correct relationship: further entities are toward the edge
                const distanceRatio = Math.min(xzDistance / radarRadius, 1);
                dirX *= distanceRatio;
                dirZ *= distanceRatio;
                
                // Map to radar display coordinates (55px is visual radar radius)
                const radarDisplayRadius = 55;
                const x = dirX * radarDisplayRadius;
                const y = -dirZ * radarDisplayRadius; // Negative because screen Y is inverted
                
                // Check vertical position (y-coordinate in 3D space)
                // If significantly above or below player, show triangle instead of dot
                const verticalThreshold = 10; // Units difference to show elevation indicator
                const isAbove = entity.direction.y > verticalThreshold;
                const isBelow = entity.direction.y < -verticalThreshold;
                
                // Special case for the Dyson Sphere
                if (entity.entityType === 'dysonSphere') {
                  // Dyson Sphere is displayed as a blue circle
                  return (
                    <div 
                      key={entity.entityId}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: '2px solid #00ff00',
                        background: 'rgba(0, 255, 0, 0.3)',
                        transform: `translate(${x}px, ${y}px)`,
                        boxShadow: '0 0 6px #00ff00',
                        zIndex: 10 // Keep Dyson Sphere on top
                      }}
                    ></div>
                  );
                }

                // Special case for asteroids
                if (entity.entityType === 'asteroid') {
                  const asteroidSize = Math.max(3, 6 - (xzDistance / 500)); // Adjusted scale for new radius
                  
                  // If asteroid is above or below, render triangle with asteroid color
                  if (isAbove || isBelow) {
                    return (
                      <div 
                        key={entity.entityId}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          width: '0',
                          height: '0',
                          borderLeft: `${asteroidSize}px solid transparent`,
                          borderRight: `${asteroidSize}px solid transparent`,
                          borderBottom: isAbove ? `${asteroidSize * 2}px solid #ff9900` : 'none',
                          borderTop: isBelow ? `${asteroidSize * 2}px solid #ff9900` : 'none',
                          transform: `translate(${x - asteroidSize}px, ${y - (isAbove ? asteroidSize : 0)}px)`,
                          boxShadow: '0 0 8px #ff9900',
                          animation: 'pulse-opacity 0.5s infinite alternate', // Faster pulsing
                          zIndex: 3 // Higher than regular enemies
                        }}
                      ></div>
                    );
                  }
                  
                  // At similar elevation, use diamond shape
                  return (
                    <div 
                      key={entity.entityId}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: `${asteroidSize}px`,
                        height: `${asteroidSize}px`,
                        background: '#ff9900', // Orange warning color
                        transform: `translate(${x}px, ${y}px) rotate(45deg)`, // Diamond shape
                        boxShadow: '0 0 8px #ff9900',
                        animation: 'pulse-opacity 0.5s infinite alternate', // Faster pulsing
                        zIndex: 3 // Higher than regular enemies
                      }}
                    ></div>
                  );
                }
                
                // Handle regular enemies
                // Fixed red color for other enemies
                const color = '#ff0000';
                
                // Size based on distance - closer = larger, with minimum size
                const size = Math.max(2, 4 - (xzDistance / 500)); // Adjusted scale for new radius
                
                // Fixed pulse speed
                const pulseSpeed = 0.8;
                
                // If above or below, render triangle, otherwise render dot
                if (isAbove || isBelow) {
                  return (
                    <div 
                      key={entity.entityId}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '0',
                        height: '0',
                        borderLeft: `${size}px solid transparent`,
                        borderRight: `${size}px solid transparent`,
                        borderBottom: isAbove ? `${size * 2}px solid ${color}` : 'none',
                        borderTop: isBelow ? `${size * 2}px solid ${color}` : 'none',
                        transform: `translate(${x - size}px, ${y - (isAbove ? size : 0)}px)`,
                        animation: `pulse-opacity ${pulseSpeed}s infinite alternate`
                      }}
                    ></div>
                  );
                } else {
                  // Standard dot for enemies at similar elevation
                  return (
                    <div 
                      key={entity.entityId}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        background: color,
                        transform: `translate(${x}px, ${y}px)`,
                        boxShadow: `0 0 3px ${color}`,
                        animation: `pulse-opacity ${pulseSpeed}s infinite alternate`
                      }}
                    ></div>
                  );
                }
              })}
            </div>
            
            {/* Enemy count */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '15px',
              fontSize: '0.6rem',
              color: radarData.trackedEntities.filter(entity => entity.entityType !== 'dysonSphere').length > 0 ? '#ff5555' : '#44ff44'
            }}>
              THREATS: {radarData.trackedEntities.filter(entity => entity.entityType !== 'dysonSphere').length}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '15px',
              fontSize: '0.6rem',
              color: '#00ffff'
            }}>
              WAVE: {currentWave}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HUD;
