import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GameState } from './types';
import { INITIAL_HEALTH, INITIAL_SHIELD, ENEMIES_PER_WAVE_BASE } from './constants';
import { GameScene } from './GameScene';
import { HUD } from './HUD';

const initialGameState: GameState = {
  started: false,
  over: false,
  score: 0,
  dysonsphereHealth: INITIAL_HEALTH,
  dysonsphereShield: INITIAL_SHIELD,
  dysonsphereMaxShield: INITIAL_SHIELD,
  lastHitTime: 0,
  level: 1,
  playerPosition: new THREE.Vector3(0, 0, 25),
  playerRotation: new THREE.Euler(0, 0, 0, 'YXZ'),
  pointerLocked: false,
  boostActive: false,
  boostRemaining: 3.0, // 3 seconds of boost
  boostCooldown: 0,
  // Wave-based level system properties
  enemiesRemainingInWave: ENEMIES_PER_WAVE_BASE, // 5 enemies for level 1
  totalEnemiesInWave: ENEMIES_PER_WAVE_BASE, // 5 enemies for level 1
  waveActive: true,
  waveCooldown: false,
  waveCooldownTimer: 0
};

const SHIELD_REGEN_DELAY = 3000;
const SHIELD_REGEN_RATE = 20;
const LEVEL_UP_NOTIFICATION_DURATION = 3000;

export const DysonSphereDefender: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = useRef(gameState.level);

  useEffect(() => {
    if (!gameState.started || gameState.over) return;

    const shieldRegenInterval = setInterval(() => {
      const timeSinceLastHit = Date.now() - gameState.lastHitTime;
      
      if (timeSinceLastHit >= SHIELD_REGEN_DELAY && gameState.dysonsphereShield < gameState.dysonsphereMaxShield) {
        setGameState(prev => ({
          ...prev,
          dysonsphereShield: Math.min(
            prev.dysonsphereMaxShield,
            prev.dysonsphereShield + (SHIELD_REGEN_RATE / 10)
          )
        }));
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
    // Stop current game
    setGameState(prev => ({
      ...prev,
      started: false,
    }));
  
    // Hide level up notification
    setShowLevelUp(false);
    
    // Start new game after a brief delay
    requestAnimationFrame(() => {
      const freshState = { ...initialGameState };
      freshState.started = true;
      console.log("Starting new game with initial state:", freshState);
      setGameState(freshState);
      
      // Reset level display
      prevLevel.current = 1;
    });
  };

  const startGame = () => {
    // Request pointer lock before starting the game
    canvasContainerRef.current?.requestPointerLock();
    
    resetToNewGame();
  };

  const restartGame = () => {
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
            onStartGame={startGame}
            onRestartGame={restartGame}
          />
        </div>
      </div>
    </div>
  );
};
