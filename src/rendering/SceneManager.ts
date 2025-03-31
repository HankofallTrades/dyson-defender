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
  private scene: THREE.Scene = new THREE.Scene();
  private renderer: THREE.WebGLRenderer | null = null;
  private activeCamera: THREE.PerspectiveCamera | null = null;
  
  // Container element
  private container: HTMLElement;
  
  /**
   * Private constructor to enforce singleton pattern
   * @param container The HTML element where the scene will be rendered
   */
  private constructor(container: HTMLElement) {
    this.container = container;
    
    console.log('[SceneManager] Starting initialization...', {
      containerSize: {
        width: container.clientWidth,
        height: container.clientHeight
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    try {
      console.log('[SceneManager] Initializing scene...');
      this.initScene();
      
      console.log('[SceneManager] Initializing renderer...');
      this.initRenderer();
      
      console.log('[SceneManager] Initializing lights...');
      this.initLights();
      
      console.log('[SceneManager] Handling initial resize...');
      this.handleResize();
      
      window.addEventListener('resize', this.handleResize);
      console.log('[SceneManager] Initialization complete');
    } catch (error) {
      console.error('[SceneManager] Error during initialization:', error);
      throw error;
    }
  }
  
  /**
   * Get the SceneManager instance (creates one if it doesn't exist)
   * @param container The HTML element where the scene will be rendered
   */
  public static getInstance(container?: HTMLElement): SceneManager {
    if (!SceneManager.instance && container) {
      SceneManager.instance = new SceneManager(container);
    }
    if (!SceneManager.instance) {
      throw new Error('SceneManager not initialized');
    }
    return SceneManager.instance;
  }
  
  /**
   * Initialize the Three.js scene
   */
  private initScene(): void {
    console.log('[SceneManager] Creating scene...');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005); // Very dark blue, almost black
    
    console.log('[SceneManager] Creating camera...');
    this.activeCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.activeCamera.position.z = 5;
  }
  
  /**
   * Initialize the renderer
   */
  private initRenderer(): void {
    console.log('[SceneManager] Creating WebGL renderer...');
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    
    if (!this.renderer) {
      throw new Error('Failed to create WebGL renderer');
    }
    
    console.log('[SceneManager] Configuring renderer...');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    console.log('[SceneManager] Appending renderer to container...');
    this.container.appendChild(this.renderer.domElement);
  }
  
  private initLights(): void {
    console.log('[SceneManager] Setting up lights...');
    
    // Create a brighter ambient light for better overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x505080, 1.0);
    this.scene.add(ambientLight);
    
    // Add a soft directional light to simulate starfield lighting
    const starfieldLight = new THREE.DirectionalLight(0xd0d0ff, 0.5);
    starfieldLight.position.set(0, 1, 0); // Coming from above
    this.scene.add(starfieldLight);
    
    // The central star will still be our main light source
    
    console.log('[SceneManager] Ambient and starfield lights configured, main light comes from the star');
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    if (!this.activeCamera || !this.renderer) return;

    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    console.log('Handling resize...', {
      container: {
        width: container.clientWidth,
        height: container.clientHeight
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.activeCamera.aspect = width / height;
    this.activeCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Set the active camera for rendering
   * @param camera The Three.js camera to use for rendering
   */
  public setActiveCamera(camera: THREE.PerspectiveCamera): void {
    this.activeCamera = camera;
    this.handleResize(); // Update aspect ratio and projection matrix
  }
  
  /**
   * Render the scene
   */
  public render(): void {
    if (!this.activeCamera || !this.renderer) {
      console.warn('No active camera or renderer set in SceneManager');
      return;
    }
    this.renderer.render(this.scene, this.activeCamera);
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
  public getCamera(): THREE.PerspectiveCamera | null {
    return this.activeCamera;
  }
  
  /**
   * Get the Three.js renderer
   */
  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }
  
  /**
   * Get the Three.js renderer's DOM element
   */
  public getRendererDomElement(): HTMLCanvasElement | null {
    return this.renderer?.domElement || null;
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
   * Clear all objects from the scene
   * This properly disposes of geometries and materials to prevent memory leaks
   */
  public clearScene(): void {
    // Dispose of all geometries and materials
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
    
    // Remove all objects from the scene
    while(this.scene.children.length > 0) { 
      this.scene.remove(this.scene.children[0]); 
    }
    
    // Re-add the lights
    this.initLights();
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
    SceneManager.instance = null;
  }
} 