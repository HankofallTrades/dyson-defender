import * as THREE from 'three';
import { GameState, GameStateManager } from './State';

/**
 * Main Game class that handles the game loop and state management
 */
class Game {
  // Container element where the game will be rendered
  private container: HTMLElement;
  
  // Three.js essentials
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Game state management
  private stateManager: GameStateManager;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  
  /**
   * Constructor for the Game class
   * @param container The HTML element where the game will be rendered
   */
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize game state
    this.stateManager = new GameStateManager();
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    
    // Initialize Three.js essentials
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      container.clientWidth / container.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    
    // Set up renderer
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 1); // Set explicit background color
    container.appendChild(this.renderer.domElement);
    
    // Set renderer element to fill container
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    
    // Position camera back a bit
    this.camera.position.z = 5;
    
    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    
    // Add a simple cube to test rendering
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
    
    // Make the cube larger for better visibility
    cube.scale.set(2, 2, 2);
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
    
    // Force an initial render
    this.render();
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.stateManager.updateState({ isPaused: false });
      this.animate();
      console.log('Game started');
    }
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.isRunning && this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.isRunning = false;
      this.stateManager.updateState({ isPaused: true });
      console.log('Game stopped');
    }
  }
  
  /**
   * Pause the game
   */
  pause(): void {
    this.stop();
  }
  
  /**
   * Resume the game
   */
  resume(): void {
    this.start();
  }
  
  /**
   * The main game loop
   */
  private animate = (): void => {
    // Store animation frame ID for potential cancellation
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Calculate delta time for frame-independent movement
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    // Don't update if game is over or paused
    const gameState = this.stateManager.getState();
    if (gameState.isGameOver || gameState.isPaused) {
      return;
    }
    
    // Update game state with timing information
    this.stateManager.updateState({ lastUpdateTime: Date.now() });
    
    // Update game state here
    this.update(deltaTime);
    
    // Render the scene
    this.render();
  }
  
  /**
   * Update the game state
   * @param deltaTime Time elapsed since last frame in seconds
   */
  private update(deltaTime: number): void {
    // This will be expanded later to include game logic
    // For now, just rotate the cube for visual feedback
    const cube = this.scene.children.find(
      child => child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry
    ) as THREE.Mesh;
    
    if (cube) {
      cube.rotation.x += 0.5 * deltaTime;
      cube.rotation.y += 0.5 * deltaTime;
    }
  }
  
  /**
   * Render the current scene
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.stateManager.getState();
  }
  
  /**
   * Reset the game state
   */
  resetGame(): void {
    this.stateManager.resetState();
    this.start();
    console.log('Game reset');
  }
  
  /**
   * Clean up resources when the game is disposed
   */
  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.container.removeChild(this.renderer.domElement);
    
    // Dispose of Three.js resources
    this.renderer.dispose();
    
    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
  }
}

export default Game; 