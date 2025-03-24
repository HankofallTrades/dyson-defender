import { useEffect, useRef } from 'react'
import './App.css'
import { SceneManager } from './rendering/SceneManager'
import { World } from './core/World'
import { createDysonSphere } from './core/entities/DysonSphereEntity'
import { AutoRotateSystem } from './core/systems/AutoRotateSystem'

function App() {
  console.log('App component rendering');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('App useEffect triggered');
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    console.log('Initializing game...');
    console.log('Container dimensions:', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });

    // Initialize scene manager
    const sceneManager = SceneManager.getInstance(containerRef.current);
    console.log('Scene manager initialized');
    
    // Initialize world and systems
    const world = new World();
    const autoRotateSystem = new AutoRotateSystem(world);
    world.addSystem(autoRotateSystem);
    console.log('World and systems initialized');
    
    // Create Dyson Sphere
    const dysonSphereEntity = createDysonSphere(world, sceneManager.getScene());
    console.log('Created Dyson Sphere entity:', dysonSphereEntity);
    
    // Position camera to see the Dyson Sphere
    const camera = sceneManager.getCamera();
    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);
    console.log('Camera positioned:', camera.position);
    
    // Animation loop
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      world.update(deltaTime);
      sceneManager.render();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    console.log('Animation loop started');
    
    // Cleanup
    return () => {
      console.log('Cleaning up...');
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
