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

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: monospace;
`;

const DebugInfo = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  color: white;
  font-family: monospace;
  font-size: 12px;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
`;

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const isMobile = isMobileDevice();

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${info}`]);
  };

  useEffect(() => {
    if (!containerRef.current) {
      setError('Container not found');
      return;
    }

    try {
      addDebugInfo('Initializing game...');
      
      // Initialize SceneManager
      const sceneManager = SceneManager.getInstance(containerRef.current);
      addDebugInfo('SceneManager initialized');

      // Initialize Game
      const game = new Game(containerRef.current);
      gameRef.current = game;
      addDebugInfo('Game initialized');
      
      // Get access to the world for HUD rendering
      // Access the private field using bracket notation
      // This is a workaround to access private fields in TypeScript
      const gameWorld = game.getWorld();
      if (gameWorld) {
        setWorld(gameWorld);
      }
      
      // Get the camera
      const gameCamera = game.getCamera();
      if (gameCamera) {
        setCamera(gameCamera);
      }
      
      // Add loading state management
      const timeout = setTimeout(() => {
        setIsLoading(false);
        addDebugInfo('Loading complete');
      }, 2000);

      return () => {
        clearTimeout(timeout);
        if (gameRef.current) {
          gameRef.current.dispose();
          gameRef.current = null;
        }
        addDebugInfo('Game disposed');
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addDebugInfo(`Error: ${errorMessage}`);
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
      
      // Update the world reference after restart
      const gameWorld = gameRef.current.getWorld();
      if (gameWorld) {
        setWorld(gameWorld);
      }
      
      // Update the camera reference after restart
      const gameCamera = gameRef.current.getCamera();
      if (gameCamera) {
        setCamera(gameCamera);
      }
    }
  };

  const handleResumeGame = () => {
    if (gameRef.current) {
      gameRef.current.resumeGame();
    }
  };

  const handleRestartAtWave = (waveNumber: number) => {
    if (gameRef.current) {
      gameRef.current.restartAtWave(waveNumber);
      
      // Update the world reference after restart
      const gameWorld = gameRef.current.getWorld();
      if (gameWorld) {
        setWorld(gameWorld);
      }
      
      // Update the camera reference after restart
      const gameCamera = gameRef.current.getCamera();
      if (gameCamera) {
        setCamera(gameCamera);
      }
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
      
      {(isLoading || error) && (
        <LoadingOverlay>
          {isLoading ? (
            <>
              <div>Loading game...</div>
              <div style={{ fontSize: '12px', marginTop: '10px' }}>
                Screen: {window.innerWidth}x{window.innerHeight}
              </div>
              <div style={{ fontSize: '12px' }}>
                Device: {isMobile ? 'Mobile' : 'Desktop'}
              </div>
            </>
          ) : (
            <div style={{ color: 'red' }}>{error}</div>
          )}
        </LoadingOverlay>
      )}

      <DebugInfo>
        {debugInfo.map((info, index) => (
          <div key={index}>{info}</div>
        ))}
      </DebugInfo>
    </>
  )
}

export default App
