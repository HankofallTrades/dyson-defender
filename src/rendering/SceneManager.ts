import * as THREE from 'three';

/**
 * SceneManager class responsible for managing the Three.js scene, camera, and renderer
 * Follows the singleton pattern to ensure only one instance exists
 */
export class SceneManager {
  private static instance: SceneManager | null = null;
  
  // Three.js essentials
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  
  // Container element
  private container: HTMLElement;
  
  // Test cube
  private testCube!: THREE.Mesh;
  
  /**
   * Private constructor to enforce singleton pattern
   * @param container The HTML element where the scene will be rendered
   */
  private constructor(container: HTMLElement) {
    this.container = container;
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initLights();
    this.addTestCube();
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
    this.scene.background = new THREE.Color(0x000020); // Dark blue background
  }
  
  /**
   * Initialize the camera
   */
  private initCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      aspect, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    // Position camera back a bit
    this.camera.position.z = 5;
  }
  
  /**
   * Initialize the WebGL renderer
   */
  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    
    // Set up renderer
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000020, 1); // Match scene background
    
    // Add renderer to DOM
    this.container.appendChild(this.renderer.domElement);
    
    // Set renderer element to fill container
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
  }
  
  /**
   * Add basic lighting to the scene
   */
  private initLights(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }
  
  /**
   * Add a test cube to verify rendering
   */
  private addTestCube(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.testCube = new THREE.Mesh(geometry, material);
    
    // Make the cube larger for better visibility
    this.testCube.scale.set(2, 2, 2);
    
    this.scene.add(this.testCube);
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
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Update method for animation
   * @param deltaTime Time elapsed since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Rotate the test cube for visual feedback
    if (this.testCube) {
      this.testCube.rotation.x += 0.5 * deltaTime;
      this.testCube.rotation.y += 0.5 * deltaTime;
    }
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