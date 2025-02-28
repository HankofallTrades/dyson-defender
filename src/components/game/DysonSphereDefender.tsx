import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GameState } from './types';
import { INITIAL_HEALTH, INITIAL_SHIELD } from './constants';
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
  playerPosition: new THREE.Vector3(0, 0, 10),
  playerRotation: new THREE.Euler(0, 0, 0, 'YXZ'),
  pointerLocked: false
};

const SHIELD_REGEN_DELAY = 3000;
const SHIELD_REGEN_RATE = 20;
const LEVEL_UP_NOTIFICATION_DURATION = 2000;

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
    if (gameState.level > prevLevel.current) {
      setShowLevelUp(true);
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, LEVEL_UP_NOTIFICATION_DURATION);

      prevLevel.current = gameState.level;
      return () => clearTimeout(timer);
    }
  }, [gameState.level]);

  const resetToNewGame = () => {
    // First stop the current game
    setGameState({
      ...initialGameState,
      started: false
    });

    // Then start a new game after a brief delay
    requestAnimationFrame(() => {
      setGameState({
        ...initialGameState,
        started: true
      });
    });

    setShowLevelUp(false);
    prevLevel.current = 1;
  };

  const startGame = () => {
    resetToNewGame();
  };

  const restartGame = () => {
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
