import React, { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import Game from './core/Game'
import HUD from './ui/HUD'
import { World } from './core/World'
import { Camera } from 'three'
import { MobileControls } from './ui/MobileControls'
import { isMobileDevice } from './utils/deviceDetection'
import styled from '@emotion/styled'
import { SceneManager } from './rendering/SceneManager'
import { AudioManager } from './core/AudioManager'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const isMobile = isMobileDevice();
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Create a single AudioManager instance that will be shared
  const audioManager = useMemo(() => new AudioManager(), []);

  // Load sounds and set up audio initialization based on user interaction
  useEffect(() => {
    const loadAudio = async () => {
      try {
        await audioManager.loadSounds();
        console.log('[App] Audio files loaded, waiting for user interaction.');

        // DO NOT try to play sound here initially due to autoplay policies.

        // Set up interaction handler ONLY if not already initialized
        if (!audioInitialized) {
          const handleUserInteraction = () => {
            // Attempt to resume context (best handled inside AudioManager)
            // audioManager.resumeContextIfNeeded(); // Let's add this later in AudioManager

            console.log('[App] User interaction detected, attempting to play soundtrack');
            try {
               audioManager.playSoundtrack(); // Play the sound
               setAudioInitialized(true); // Mark as initialized
               console.log('[App] Soundtrack started after interaction.');
               // No need to manually remove listeners here if using { once: true }
            } catch (error) {
               console.error('[App] Error playing soundtrack after interaction:', error);
            }
          };

          console.log('[App] Adding interaction listeners for audio.');
          document.addEventListener('click', handleUserInteraction, { once: true });
          document.addEventListener('keydown', handleUserInteraction, { once: true });
          document.addEventListener('touchstart', handleUserInteraction, { once: true });

          // Return a cleanup function for when the component unmounts or dependencies change
          // This cleanup is primarily for unmounting, as { once: true } handles removal after interaction.
          return () => {
              console.log('[App] Cleanup: Removing interaction listeners.');
              // Remove listeners by the *same* function reference
              document.removeEventListener('click', handleUserInteraction);
              document.removeEventListener('keydown', handleUserInteraction);
              document.removeEventListener('touchstart', handleUserInteraction);
          };
        } else {
           console.log('[App] Audio already initialized, skipping interaction listener setup.');
        }
      } catch (error) {
        console.error('[App] Error loading audio:', error);
      }
    };

    loadAudio();

    // Dependency array includes audioInitialized now.
    // The cleanup function returned above handles removal.
  }, [audioManager, audioInitialized]); // Add audioInitialized as a dependency

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    try {
      // Initialize SceneManager
      const sceneManager = SceneManager.getInstance(containerRef.current);

      // Initialize Game with the shared AudioManager
      const game = new Game(containerRef.current, audioManager);
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
  }, [audioManager]);

  const handleStartGame = () => {
    if (gameRef.current) {
      // --- Ensure audio is initialized on Start Game click ---
      if (!audioInitialized) {
        console.log('[App] Starting soundtrack via Start Game button.');
        try {
          // Attempt to resume context (best handled inside AudioManager)
          // audioManager.resumeContextIfNeeded(); // Let's add this later in AudioManager
          audioManager.playSoundtrack();
          setAudioInitialized(true); // Mark as initialized
          // Listeners should be removed by {once: true} or the interaction handler itself.
          console.log('[App] Soundtrack started via Start Game button.');
        } catch (error) {
           console.error('[App] Error starting soundtrack from Start Game button:', error);
        }
      }
      // ------------------------------------------------------

      gameRef.current.startGame();
      gameRef.current.requestPointerLock(); // Request pointer lock *after* starting game
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
      
      // Ensure audio is playing when game restarts
      if (!audioInitialized) {
        audioManager.playSoundtrack();
        setAudioInitialized(true);
      }
    }
  };

  const handleResumeGame = () => {
    if (gameRef.current) {
      gameRef.current.resumeGame();
      
      // Ensure audio is playing when game resumes
      if (!audioInitialized) {
        audioManager.playSoundtrack();
        setAudioInitialized(true);
      }
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
      
      // Ensure audio is playing when game restarts at a specific wave
      if (!audioInitialized) {
        audioManager.playSoundtrack();
        setAudioInitialized(true);
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
    </>
  )
}

export default App
