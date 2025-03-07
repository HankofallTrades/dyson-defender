import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GameState } from './types';
import { INITIAL_HEALTH, INITIAL_SHIELD, ENEMIES_PER_WAVE_BASE, INITIAL_PLAYER_HEALTH } from './constants';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import { unlockAudio, createSimpleSound } from './utils/soundEffects';

const initialGameState: GameState = {
  started: false,
  over: false,
  score: 0,
  dysonsphereHealth: INITIAL_HEALTH,
  dysonsphereShield: INITIAL_SHIELD,
  dysonsphereMaxShield: INITIAL_SHIELD,
  lastHitTime: 0,
  level: 1,
  playerHealth: INITIAL_PLAYER_HEALTH,
  playerPosition: new THREE.Vector3(0, 0, 25),
  playerRotation: new THREE.Euler(0, 0, 0, 'YXZ'),
  pointerLocked: false,
  boostActive: false,
  boostRemaining: 3.0, // 3 seconds of boost
  boostCooldown: 0,
  // Wave-based level system properties
  enemiesRemainingInWave: ENEMIES_PER_WAVE_BASE, // 5 enemies for level 1
  totalEnemiesInWave: ENEMIES_PER_WAVE_BASE, // 5 enemies for level 1
  currentWave: 1,
  waveCooldown: false,
  waveCooldownTimer: 0,
  waveActive: true
};

const SHIELD_REGEN_DELAY = 3000;
const SHIELD_REGEN_RATE = 20;
const LEVEL_UP_NOTIFICATION_DURATION = 3000;

export const DysonSphereDefender: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = useRef(gameState.level);

  // Unlock audio on mount
  useEffect(() => {
    unlockAudio();
  }, []);

  useEffect(() => {
    if (!gameState.started || gameState.over) return;

    const shieldRegenInterval = setInterval(() => {
      const timeSinceLastHit = Date.now() - gameState.lastHitTime;
      
      if (timeSinceLastHit >= SHIELD_REGEN_DELAY && gameState.dysonsphereShield < gameState.dysonsphereMaxShield) {
        setGameState(prev => {
          // Double check we're not in "game over" state before regenerating shield
          if (prev.over) return prev;
          
          return {
            ...prev,
            dysonsphereShield: Math.min(
              prev.dysonsphereMaxShield,
              prev.dysonsphereShield + (SHIELD_REGEN_RATE / 10)
            )
          };
        });
      }
    }, 100);

    return () => clearInterval(shieldRegenInterval);
  }, [gameState.started, gameState.over, gameState.lastHitTime]);

  useEffect(() => {
    if (showLevelUp) {
      console.log(`Level up notification displayed, will hide in ${LEVEL_UP_NOTIFICATION_DURATION/1000} seconds`);
      const timer = setTimeout(() => {
        setShowLevelUp(false);
        console.log('Level up notification hidden');
      }, LEVEL_UP_NOTIFICATION_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [showLevelUp]);

  // Handle pointer lock based on game state
  useEffect(() => {
    if (gameState.over) {
      document.exitPointerLock();
    }
  }, [gameState.over]);

  const resetToNewGame = () => {
    console.log("Resetting game state - clearing game over flag");
    
    // Stop current game
    setGameState(prev => ({
      ...prev,
      started: false,
      over: false
    }));
  
    // Hide level up notification
    setShowLevelUp(false);
    
    // Start new game after a brief delay
    requestAnimationFrame(() => {
      const freshState = { ...initialGameState };
      freshState.started = true;
      freshState.over = false;
      console.log("Starting new game with initial state:", freshState);
      setGameState(freshState);
      
      // Reset level display
      prevLevel.current = 1;
    });
  };

  // Handle click to start game
  const handleStartGame = () => {
    // Unlock audio when user clicks start
    unlockAudio();
    // Play a sound to confirm audio is working
    createSimpleSound('laser');
    
    // Request pointer lock before starting the game
    canvasContainerRef.current?.requestPointerLock();
    
    setGameState(prev => ({
      ...prev,
      started: true
    }));
  };

  const restartGame = () => {
    console.log("Restart game called by user pressing Play Again button");
    // Request pointer lock before restarting the game
    canvasContainerRef.current?.requestPointerLock();
    
    resetToNewGame();
  };

  const styles = {
    container: {
      width: '100%',
      height: '100vh',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    canvasContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
    },
    hudContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      pointerEvents: 'none' as const,
    },
    hudContent: {
      pointerEvents: 'auto' as const,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer} ref={canvasContainerRef}>
        <GameScene
          gameState={gameState}
          setGameState={setGameState}
          setShowLevelUp={setShowLevelUp}
          mountRef={canvasContainerRef}
        />
      </div>
      <div style={styles.hudContainer}>
        <div style={styles.hudContent}>
          <HUD
            gameState={gameState}
            showLevelUp={showLevelUp}
            onStartGame={handleStartGame}
            onRestartGame={restartGame}
          />
        </div>
      </div>
    </div>
  );
};
