import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Type definitions
interface GameState {
  started: boolean;
  over: boolean;
  score: number;
  dysonsphereHealth: number;
  dysonsphereShield: number;
  dysonsphereMaxShield: number;
  lastHitTime: number;
  level: number;
}

interface Laser {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
}

interface Enemy extends THREE.Group {
  userData: {
    health: number;
    speed: number;
    fireTimer: number;
    pulseDirection: number;
    pulseValue: number;
    isFiringMode: boolean;
    attackDistance: number;
  };
}

interface KeyState {
  [key: string]: boolean;
}

export const DysonSphereDefender: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    started: false,
    over: false,
    score: 0,
    dysonsphereHealth: 500,
    dysonsphereShield: 200,
    dysonsphereMaxShield: 200,
    lastHitTime: 0,
    level: 1
  });
  
  // Level-up notification state
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (!gameState.started) return;
    
    // ... (rest of the game logic remains the same)
    
  }, [gameState.started, gameState.level]);
  
  const startGame = () => {
    setShowLevelUp(false);
    setGameState({
      started: true,
      over: false,
      score: 0,
      dysonsphereHealth: 500,
      dysonsphereShield: 200,
      dysonsphereMaxShield: 200,
      lastHitTime: 0,
      level: 1
    });
  };
  
  const restartGame = () => {
    setShowLevelUp(false);
    setGameState({
      started: true,
      over: false,
      score: 0,
      dysonsphereHealth: 500,
      dysonsphereShield: 200,
      dysonsphereMaxShield: 200,
      lastHitTime: 0,
      level: 1
    });
  };

  return (
    <div className="w-full h-screen relative">
      {/* Game canvas with z-index 0 */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Level up notification with highest z-index */}
      {showLevelUp && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-300 text-4xl font-bold z-50"
          style={{textShadow: '0 0 10px #ff9900'}}
        >
          Level {gameState.level}!
        </div>
      )}
      
      {/* Start screen overlay */}
      {!gameState.started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white z-20">
          <h1 className="text-4xl font-bold mb-4">Dyson Sphere Defender</h1>
          <p className="text-xl mb-8">Protect the white dwarf star's Dyson sphere from pulsating Cthulhu squid aliens!</p>
          <button 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
            onClick={startGame}
          >
            Start Game
          </button>
          <div className="mt-8 text-center">
            <p className="mb-2">Controls:</p>
            <p>WASD or Arrow Keys to move</p>
            <p>Mouse to look around (improved responsiveness)</p>
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
      )}
      
      {/* Game HUD */}
      {gameState.started && !gameState.over && (
        <div className="absolute top-0 left-0 p-4 text-white font-bold z-10">
          <div>Score: {gameState.score}</div>
          <div>Level: {gameState.level}</div>
          <div>Shield: {Math.floor(gameState.dysonsphereShield)}/{gameState.dysonsphereMaxShield}</div>
          <div>Dyson Sphere Health: {gameState.dysonsphereHealth}</div>
          <div className="mt-4 text-xs">
            Next level at: {gameState.level * 100} points
          </div>
        </div>
      )}
      
      {/* Game over screen */}
      {gameState.over && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white z-20">
          <h1 className="text-4xl font-bold mb-4">Game Over</h1>
          <p className="text-2xl mb-2">Final Score: {gameState.score}</p>
          <p className="text-xl mb-8">You reached level {gameState.level}</p>
          <button 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
            onClick={restartGame}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
