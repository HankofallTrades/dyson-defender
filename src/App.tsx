import { useEffect, useRef, useState } from 'react'
import './App.css'
import Game from './core/Game'
import HUD from './ui/HUD'
import { World } from './core/World'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [world, setWorld] = useState<World | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize game using Game class
    const game = new Game(containerRef.current);
    gameRef.current = game;
    
    // Get access to the world for HUD rendering
    // Access the private field using bracket notation
    // This is a workaround to access private fields in TypeScript
    const gameWorld = (game as any).world;
    if (gameWorld) {
      setWorld(gameWorld);
    }
    
    // Start the game
    game.start();
    
    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app">
      <div id="game-container" className="game-container" ref={containerRef}></div>
      {world && <HUD world={world} />}
    </div>
  )
}

export default App
