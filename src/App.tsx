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

  // Load sounds and set up audio initialization
  useEffect(() => {
    const loadAudio = async () => {
      try {
        await audioManager.loadSounds();
        console.log('[App] Audio files loaded, waiting for user interaction to play');
        
        // Try to play soundtrack immediately (will likely be blocked by browser)
        try {
          audioManager.playSoundtrack();
        } catch (error) {
          console.warn('[App] Autoplay was prevented by the browser. Click to play audio.');
        }
        
        // Set up a one-time click handler on the document to enable audio
        if (!audioInitialized) {
          const handleUserInteraction = () => {
            console.log('[App] User interaction detected, playing soundtrack');
            audioManager.playSoundtrack();
            setAudioInitialized(true);
            
            // Remove the event listeners after successful playback
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('keydown', handleUserInteraction);
          document.addEventListener('touchstart', handleUserInteraction);
        }
      } catch (error) {
        console.error('[App] Error loading audio:', error);
      }
    };
    
    loadAudio();
    
    // Clean up event listeners when component unmounts
    return () => {
      document.removeEventListener('click', () => {});
      document.removeEventListener('keydown', () => {});
      document.removeEventListener('touchstart', () => {});
    };
  }, [audioManager, audioInitialized]);

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
      gameRef.current.startGame();
      
      // Ensure audio is playing when game starts
      if (!audioInitialized) {
        audioManager.playSoundtrack();
        setAudioInitialized(true);
      }
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
