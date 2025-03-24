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
  private activeCamera: THREE.PerspectiveCamera | null = null;
  private renderer!: THREE.WebGLRenderer;
  
  // Container element
  private container: HTMLElement;
  
  /**
   * Private constructor to enforce singleton pattern
   * @param container The HTML element where the scene will be rendered
   */
  private constructor(container: HTMLElement) {
    this.container = container;
    
    // Initialize in specific order
    this.initScene();
    this.initRenderer();
    this.initLights();
    
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
   * Initialize the renderer
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    // Append to container
    this.container.appendChild(this.renderer.domElement);
    
    // Ensure renderer's domElement has the correct styling
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
  }
  
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
   * Handle window resize events
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (this.activeCamera) {
      this.activeCamera.aspect = width / height;
      this.activeCamera.updateProjectionMatrix();
    }
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
    if (!this.activeCamera) {
      console.warn('No active camera set in SceneManager');
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
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
  
  /**
   * Get the Three.js renderer's DOM element
   */
  public getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
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
  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    
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