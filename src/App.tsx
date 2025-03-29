import { useEffect, useRef, useState } from 'react'
import './App.css'
import Game from './core/Game'
import HUD from './ui/HUD'
import { World } from './core/World'
import { Camera } from 'three'
import { MobileControls } from './ui/MobileControls'
import { isMobileDevice } from './utils/deviceDetection'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const isMobile = isMobileDevice();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize game using Game class
    const game = new Game(containerRef.current);
    gameRef.current = game;
    
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
    
    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
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
  )
}

export default App
