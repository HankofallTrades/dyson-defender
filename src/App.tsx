import { useEffect, useRef, useState } from 'react'
import './App.css'
import Game from './core/Game'
import { GameState } from './core/State'

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log("Creating game instance");
    console.log("Container dimensions:", {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    });
    
    const game = new Game(canvasRef.current);
    gameRef.current = game;
    
    // Start the game
    game.start();
    
    // Set up interval to update the UI with game state
    const stateInterval = setInterval(() => {
      if (game) {
        const state = game.getGameState();
        setGameState(state);
      }
    }, 100); // Update UI at 10 FPS to avoid performance issues
    
    return () => {
      console.log("Disposing game instance");
      clearInterval(stateInterval);
      game.dispose();
    };
  }, []);
  
  const handleStartStop = () => {
    if (!gameRef.current) return;
    
    if (gameState?.isPaused) {
      gameRef.current.start();
    } else {
      gameRef.current.pause();
    }
  };
  
  const handleReset = () => {
    if (!gameRef.current) return;
    gameRef.current.resetGame();
  };

  return (
    <div className="app">
      <div className="game-ui">
        <div className="game-hud">
          {gameState && (
            <>
              <div className="hud-item">Score: {gameState.score}</div>
              <div className="hud-item">Health: {gameState.dysonSphereHealth}/{gameState.dysonSphereMaxHealth}</div>
              <div className="hud-item">Wave: {gameState.currentWave}</div>
              <div className="hud-item">Enemies: {gameState.enemiesRemaining}</div>
            </>
          )}
        </div>
        <div className="game-controls">
          <button onClick={handleStartStop}>
            {gameState?.isPaused ? 'Start' : 'Pause'}
          </button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>
      <div id="game-container" className="game-container" ref={canvasRef}></div>
    </div>
  )
}

export default App
