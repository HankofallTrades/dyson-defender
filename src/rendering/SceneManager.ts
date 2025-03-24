import * as THREE from 'three';

/**
 * Three.js Scene Management System
 * 
 * Purpose:
 * Abstracts all Three.js rendering concerns, providing a clean interface for managing
 * the 3D scene, camera, and renderer while isolating rendering logic from game logic.
 * 
 * Responsibilities:
 * - Manages the Three.js scene, camera, and renderer
 * - Handles scene setup and lighting
 * - Manages window resizing and viewport adjustments
 * - Provides scene manipulation utilities
 * - Handles resource cleanup and disposal
 * 
 * This class follows the separation-of-concerns.mdc rule by keeping all rendering
 * logic isolated from game logic, making it possible to swap rendering engines
 * or update Three.js without affecting other systems.
 */
export class SceneManager {
  private static instance: SceneManager | null = null;
  
  // Three.js essentials
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  
  // Container element
  private container: HTMLElement;
  
  // Input state
  private inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  };
  
  /**
   * Private constructor to enforce singleton pattern
   * @param container The HTML element where the scene will be rendered
   */
  private constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize in specific order
    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initLights();
    this.initInputHandling();
    
    // Handle initial resize
    this.handleResize();
    
    // Set up resize listener
    window.addEventListener('resize', this.handleResize);
  }
  
  /**
   * Get the SceneManager instance (creates one if it doesn't exist)
   * @param container The HTML element where the scene will be rendered
   */
  public static getInstance(container: HTMLElement): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager(container);
    }
    return SceneManager.instance;
  }
  
  /**
   * Initialize the Three.js scene
   */
  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011); // Deep blue background
  }
  
  /**
   * Initialize the camera
   */
  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clip
      1000 // Far clip
    );
    
    // Position the camera
    this.camera.position.set(0, 30, 100);
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Initialize the renderer
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    // Append to container
    this.container.appendChild(this.renderer.domElement);
  }
  
  /**
   * Initialize lights
   */
  private initLights(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }
  
  /**
   * Initialize input handling
   */
  private initInputHandling(): void {
    window.addEventListener('keydown', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w': this.inputState.forward = true; break;
        case 's': this.inputState.backward = true; break;
        case 'a': this.inputState.left = true; break;
        case 'd': this.inputState.right = true; break;
        case 'q': this.inputState.up = true; break;
        case 'e': this.inputState.down = true; break;
      }
    });
    
    window.addEventListener('keyup', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w': this.inputState.forward = false; break;
        case 's': this.inputState.backward = false; break;
        case 'a': this.inputState.left = false; break;
        case 'd': this.inputState.right = false; break;
        case 'q': this.inputState.up = false; break;
        case 'e': this.inputState.down = false; break;
      }
    });
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
   * Get the current input state
   */
  public getInputState(): typeof this.inputState {
    return { ...this.inputState };
  }
  
  /**
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Get the Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  /**
   * Get the Three.js camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
  
  /**
   * Get the Three.js renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  /**
   * Add an object to the scene
   * @param object The Three.js object to add
   */
  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }
  
  /**
   * Remove an object from the scene
   * @param object The Three.js object to remove
   */
  public removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    
    // Remove input event listeners
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    
    // Dispose of renderer
    this.renderer.dispose();
    
    // Remove renderer from DOM
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Clear singleton instance
    SceneManager.instance = null;
  }
} 