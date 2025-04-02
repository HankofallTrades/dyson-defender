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
    
    this.initScene();
    this.initRenderer();
    this.initLights();
    this.handleResize(); // Initial setup
    window.addEventListener('resize', this.handleResize);
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
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005); // Very dark blue, almost black
    
    this.activeCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.activeCamera.position.set(0, 10, 30);
  }
  
  /**
   * Initialize the renderer
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    
    if (!this.renderer) {
      throw new Error('Failed to create WebGL renderer');
    }
    
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    this.container.appendChild(this.renderer.domElement);
  }
  
  private initLights(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add a light for the starfield background
    const starfieldLight = new THREE.PointLight(0xffffff, 0.1, 10000); // Weak distant light
    starfieldLight.position.set(0, 0, -500); // Far away
    this.scene.add(starfieldLight);
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    if (!this.activeCamera || !this.renderer) return;

    const container = this.renderer.domElement.parentElement;
    if (!container) return;

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