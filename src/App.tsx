import { useEffect, useRef } from 'react'
import './App.css'
import * as THREE from 'three'
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
    console.log('App useEffect triggered');
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    console.log('Initializing game...');
    // Create a simple standalone scene for direct rendering
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 80);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // ----- ECS Setup ----- //
    console.log('Initializing ECS world...');
    const world = new World();
    
    // Add systems
    console.log('Adding systems...');
    const mockInputHandler = {
      getInputState: () => ({ forward: false, backward: false, left: false, right: false, up: false, down: false })
    };
    world.addSystem(new InputSystem(mockInputHandler as any, world));
    world.addSystem(new MovementSystem(mockInputHandler as any, world));
    world.addSystem(new AutoRotateSystem(world));
    world.addSystem(new RenderingSystem(world, scene)); // Use our direct scene
    
    // Create entities
    console.log('Creating entities...');
    const dysonSphereEntity = createDysonSphere(world);
    console.log('Dyson Sphere entity created:', dysonSphereEntity);
    
    const playerShipEntity = createPlayerShip(world);
    console.log('Player Ship entity created:', playerShipEntity);
    
    // Print all entities and their components
    console.log('All active entities:', Array.from(world.getActiveEntities()));
    for (const entity of world.getActiveEntities()) {
      console.log(`Entity ${entity} components:`);
      console.log('- Position:', world.getComponent(entity, 'Position'));
      console.log('- Renderable:', world.getComponent(entity, 'Renderable'));
      console.log('- Rotation:', world.getComponent(entity, 'Rotation'));
    }
    
    // Animation loop
    console.log('Starting animation loop...');
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Update world (only log once every 60 frames)
      if (Math.floor(currentTime / 1000) % 2 === 0) {
        console.log('Updating world...');
      }
      world.update(deltaTime);
      
      // Render
      renderer.render(scene, camera);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    console.log('Animation loop started');
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      console.log('Cleaning up...');
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
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
