import { useEffect, useRef } from 'react'
import './App.css'
import { SceneManager } from './rendering/SceneManager'
import { World } from './core/World'
import { createDysonSphere } from './core/entities/DysonSphereEntity'
import { createPlayerShip } from './core/entities/PlayerShipEntity'
import { InputSystem } from './core/systems/InputSystem'
import { MovementSystem } from './core/systems/MovementSystem'
import { AutoRotateSystem } from './core/systems/AutoRotateSystem'
import { RenderingSystem } from './core/systems/RenderingSystem'

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize SceneManager
    const sceneManager = SceneManager.getInstance(containerRef.current);
    
    // Initialize World and Systems
    const world = new World();
    
    // Add systems in the correct order
    world.addSystem(new InputSystem(sceneManager, world));
    world.addSystem(new MovementSystem(sceneManager, world));
    world.addSystem(new AutoRotateSystem(world));
    world.addSystem(new RenderingSystem(world, sceneManager.getScene()));
    
    // Create entities
    createDysonSphere(world);
    createPlayerShip(world);
    
    // Animation loop
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      world.update(deltaTime);
      sceneManager.render();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      sceneManager.dispose();
    };
  }, []);

  return (
    <div className="app">
      <div id="game-container" className="game-container" ref={containerRef}></div>
    </div>
  )
}

export default App
