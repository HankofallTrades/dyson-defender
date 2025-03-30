import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import Game from './core/Game'
import HUD from './ui/HUD'
import { World } from './core/World'
import { Camera } from 'three'
import { MobileControls } from './ui/MobileControls'
import { isMobileDevice } from './utils/deviceDetection'
import styled from '@emotion/styled'
import { SceneManager } from './rendering/SceneManager'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const isMobile = isMobileDevice();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    try {
      // Initialize SceneManager
      const sceneManager = SceneManager.getInstance(containerRef.current);

      // Initialize Game
      const game = new Game(containerRef.current);
      gameRef.current = game;
      
      // Get access to the world for HUD rendering
      const gameWorld = game.getWorld();
      if (gameWorld) {
        setWorld(gameWorld);
      }
      
      // Get the camera
      const gameCamera = game.getCamera();
      if (gameCamera) {
        setCamera(gameCamera);
      }

      return () => {
        if (gameRef.current) {
          gameRef.current.dispose();
          gameRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  const handleStartGame = () => {
    if (gameRef.current) {
      gameRef.current.startGame();
    }
  };

  const handleRestartGame = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      gameRef.current.requestPointerLock();
      // Get the new world instance after restart and update the state
      const newWorld = gameRef.current.getWorld();
      if (newWorld) {
        setWorld(newWorld);
      }
    }
  };

  const handleResumeGame = () => {
    if (gameRef.current) {
      gameRef.current.resumeGame();
    }
  };

  const handleRestartAtWave = (wave: number) => {
    if (gameRef.current) {
      gameRef.current.restartAtWave(wave);
      // Get the new world instance after restart and update the state
      const newWorld = gameRef.current.getWorld();
      if (newWorld) {
        setWorld(newWorld);
      }
      // Optionally re-request pointer lock if needed after restart
      // gameRef.current.requestPointerLock(); 
    }
  };

  return (
    <>
      <div className="app">
        <div id="game-container" className="game-container" ref={containerRef}></div>
        {world && (
          <HUD 
            world={world} 
            camera={camera as Camera | undefined}
            onStartGame={handleStartGame}
            onRestartGame={handleRestartGame}
            onResumeGame={handleResumeGame}
            onRestartAtWave={handleRestartAtWave}
          />
        )}
        {isMobile && <MobileControls />}
      </div>
    </>
  )
}

export default App
