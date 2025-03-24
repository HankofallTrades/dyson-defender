import { useEffect, useRef } from 'react'
import './App.css'
import Game from './core/Game'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize game using Game class
    const game = new Game(containerRef.current);
    gameRef.current = game;
    
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
    </div>
  )
}

export default App
