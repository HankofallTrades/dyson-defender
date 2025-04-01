import React, { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import Game from './core/Game'
import HUD from './ui/HUD'
import { World } from './core/World'
import { Camera } from 'three'
import { MobileControls } from './ui/MobileControls'
import { isMobileDevice } from './utils/deviceDetection'
import { SceneManager } from './rendering/SceneManager'
import { AudioManager } from './core/AudioManager'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const isMobile = isMobileDevice();

  // Create a single AudioManager instance that will be shared
  const audioManager = useMemo(() => new AudioManager(), []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Load sounds before initializing the game
    audioManager.loadSounds().then(() => {
      console.log('[App] Audio files loaded.');
      // Sounds are loaded, Game can now be initialized and potentially use them.
      // Note: Actual playback requiring user interaction is handled elsewhere (e.g., start button).
    }).catch(error => {
      console.error('[App] Error loading audio:', error);
    });

    try {
      // Initialize SceneManager
      const sceneManager = SceneManager.getInstance(containerRef.current);

      // Initialize Game with the shared AudioManager
      const game = new Game(containerRef.current, audioManager);
      gameRef.current = game;

      // Restore getting world and camera state
      const gameWorld = game.getWorld();
      if (gameWorld) {
        setWorld(gameWorld);
      }
      const gameCamera = game.getCamera();
      if (gameCamera) {
        setCamera(gameCamera);
      }

      return () => {
        console.log("[App] Cleanup: Disposing game.");
        if (gameRef.current) {
          gameRef.current.dispose();
          gameRef.current = null;
        }
        // SceneManager cleanup is handled by gameRef.current.dispose()
      };
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, [audioManager]); // Only depends on audioManager instance

  const handleStartGame = () => {
    if (gameRef.current) {
      // --- Attempt to start audio on Start Game click ---
      console.log('[App] Attempting to start soundtrack via Start Game button.');
      try {
        // Let AudioManager handle the context state and play if possible
        audioManager.playSoundtrack();
        console.log('[App] Soundtrack play requested via Start Game button.');
      } catch (error) {
         console.error('[App] Error starting soundtrack from Start Game button:', error);
      }
      // ------------------------------------------------------

      gameRef.current.startGame();
      gameRef.current.requestPointerLock(); // Request pointer lock *after* starting game
    }
  };

  const handleRestartGame = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      // Restore setting world state after restart
      const newWorld = gameRef.current.getWorld();
      if (newWorld) {
        setWorld(newWorld);
      }

      // Ensure audio is playing when game restarts
      console.log('[App] Attempting to ensure soundtrack is playing on restart.');
      audioManager.playSoundtrack(); // Let AudioManager handle state
    }
  };

  const handlePauseGame = () => {
    if (gameRef.current) {
      gameRef.current.pause();
      // No need to exit pointer lock here, Game.ts handles it based on state change
    }
  };

  const handleResumeGame = () => {
    if (gameRef.current) {
      gameRef.current.resumeGame();

      // Ensure audio is playing when game resumes
      console.log('[App] Attempting to ensure soundtrack is playing on resume.');
      audioManager.playSoundtrack(); // Let AudioManager handle state
    }
  };

  const handleExitGame = () => {
    if (gameRef.current) {
      // Reset the game to the initial state (not started)
      // This will reinitialize the world and set the game state to not_started
      gameRef.current.reset();
      
      // Make sure to update the world and camera references for the HUD
      const newWorld = gameRef.current.getWorld();
      if (newWorld) {
        setWorld(newWorld);
      }
      
      const newCamera = gameRef.current.getCamera();
      if (newCamera) {
        setCamera(newCamera);
      }
      
      // Ensure audio continues playing for menu
      audioManager.playSoundtrack();
    }
  };

  const handleRestartAtWave = (wave: number) => {
    if (gameRef.current) {
      gameRef.current.restartAtWave(wave);
      gameRef.current.requestPointerLock(); // Added pointer lock request
      // Restore setting world state after restart at wave
      const newWorld = gameRef.current.getWorld();
      if (newWorld) {
        setWorld(newWorld);
      }

      // Ensure audio is playing when game restarts at a specific wave
      console.log('[App] Attempting to ensure soundtrack is playing on restart at wave.');
      audioManager.playSoundtrack(); // Let AudioManager handle state
    }
  };

  return (
    <>
      <div className="app">
        <div id="game-container" className="game-container" ref={containerRef}></div>
        {world && gameRef.current && (
          <HUD
            world={world}
            gameStateManager={gameRef.current.getStateManager()}
            camera={camera as Camera | undefined}
            onStartGame={handleStartGame}
            onRestartGame={handleRestartGame}
            onResumeGame={handleResumeGame}
            onPauseGame={handlePauseGame}
            onRestartAtWave={handleRestartAtWave}
            onExitGame={handleExitGame}
          />
        )}
        {isMobile && <MobileControls />}
      </div>
    </>
  )
}

export default App
