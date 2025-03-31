import React, { useEffect, useState, CSSProperties, useRef } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats, Reticle, FloatingScore, Position, WaveInfo, Radar, ShieldBarComponent, ShieldComponent, HealthBarComponent } from '../core/components';
import { COLORS } from '../constants/colors';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import PauseScreen from './PauseScreen';
import './styles/retro.css';
import { Vector3, Camera, WebGLRenderer, Scene, PerspectiveCamera, MeshBasicMaterial, BoxGeometry, SphereGeometry, IcosahedronGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, DoubleSide, Group, AmbientLight, MathUtils, TorusGeometry, PointLight, BufferGeometry, Line } from 'three';
import RadarDisplay from './hud/RadarDisplay'; // <-- ADDED IMPORT

// Hologram component for rendering small 3D wireframe models
const Hologram: React.FC<{
  modelType: 'ship' | 'dysonSphere';
  size: number;
  color?: string;
  gameIsActive?: boolean;
}> = ({ modelType, size, color = '#00aaff', gameIsActive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const modelRef = useRef<Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Setup and cleanup the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 4;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lighting
    const ambientLight = new AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    // Add a subtle point light for some depth
    const pointLight = new PointLight(0xffffff, 1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);
    
    // Create model based on type
    const model = new Group();
    
    if (modelType === 'ship') {
      // Create an angular fighter ship wireframe with pointed front and detailed wings
      // Main body - pointed front
      const bodyGeometry = new BufferGeometry().setFromPoints([
        // Left side points
        new Vector3(-0.4, 0, -1.2),   // back left
        new Vector3(-0.4, 0.2, -1.2), // back left top
        new Vector3(-0.4, 0.2, 0),    // middle left top
        new Vector3(-0.4, 0, 0),      // middle left
        new Vector3(-0.2, 0, 1.0),    // front left
        new Vector3(0, 0.15, 1.2),    // nose point
        
        // Right side points
        new Vector3(0.2, 0, 1.0),     // front right
        new Vector3(0.4, 0, 0),       // middle right
        new Vector3(0.4, 0.2, 0),     // middle right top
        new Vector3(0.4, 0.2, -1.2),  // back right top
        new Vector3(0.4, 0, -1.2),    // back right
        
        // Connect back
        new Vector3(-0.4, 0, -1.2),   // back to start (closing)
      ]);
      
      // Edges for top and bottom to complete the shape
      const bodyTopGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.4, 0.2, -1.2), // back left top
        new Vector3(0.4, 0.2, -1.2),  // back right top
      ]);
      
      const bodyMiddleTopGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.4, 0.2, 0),    // middle left top
        new Vector3(0.4, 0.2, 0),     // middle right top
      ]);
      
      const bodyFrontTopGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.2, 0, 1.0),    // front left
        new Vector3(0, 0.15, 1.2),    // nose point
        new Vector3(0.2, 0, 1.0),     // front right
      ]);
      
      const bodyBottomGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.4, 0, -1.2),   // back left bottom
        new Vector3(0.4, 0, -1.2),    // back right bottom
      ]);
      
      const bodyMiddleBottomGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.4, 0, 0),      // middle left bottom
        new Vector3(0.4, 0, 0),       // middle right bottom
      ]);
      
      // Add all body parts
      const bodyMaterial = new LineBasicMaterial({ color, linewidth: 1.5 });
      model.add(new Line(bodyGeometry, bodyMaterial));
      model.add(new Line(bodyTopGeometry, bodyMaterial));
      model.add(new Line(bodyMiddleTopGeometry, bodyMaterial));
      model.add(new Line(bodyFrontTopGeometry, bodyMaterial));
      model.add(new Line(bodyBottomGeometry, bodyMaterial));
      model.add(new Line(bodyMiddleBottomGeometry, bodyMaterial));
      
      // Wings - more detailed and angular
      // Left wing - main structure
      const leftWingGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-1.5, -0.1, -0.5),  // outer back
        new Vector3(-0.4, -0.1, -0.8),  // inner back
        new Vector3(-0.4, -0.1, 0.3),   // inner front
        new Vector3(-1.2, -0.1, 0.0),   // outer middle
        new Vector3(-1.5, -0.1, -0.5),  // outer back (close shape)
      ]);
      
      // Left wing - interior details
      const leftWingDetailGeometry = new BufferGeometry().setFromPoints([
        new Vector3(-1.2, -0.1, 0.0),   // outer middle
        new Vector3(-0.8, -0.1, -0.3),  // middle detail
        new Vector3(-0.4, -0.1, -0.2),  // inner middle
      ]);
      
      const leftWingDetail2Geometry = new BufferGeometry().setFromPoints([
        new Vector3(-0.8, -0.1, -0.3),  // middle detail
        new Vector3(-0.4, -0.1, -0.8),  // inner back
      ]);
      
      // Right wing - main structure
      const rightWingGeometry = new BufferGeometry().setFromPoints([
        new Vector3(1.5, -0.1, -0.5),   // outer back
        new Vector3(0.4, -0.1, -0.8),   // inner back
        new Vector3(0.4, -0.1, 0.3),    // inner front
        new Vector3(1.2, -0.1, 0.0),    // outer middle
        new Vector3(1.5, -0.1, -0.5),   // outer back (close shape)
      ]);
      
      // Right wing - interior details
      const rightWingDetailGeometry = new BufferGeometry().setFromPoints([
        new Vector3(1.2, -0.1, 0.0),    // outer middle
        new Vector3(0.8, -0.1, -0.3),   // middle detail
        new Vector3(0.4, -0.1, -0.2),   // inner middle
      ]);
      
      const rightWingDetail2Geometry = new BufferGeometry().setFromPoints([
        new Vector3(0.8, -0.1, -0.3),   // middle detail
        new Vector3(0.4, -0.1, -0.8),   // inner back
      ]);
      
      // Add all wing parts
      const wingMaterial = new LineBasicMaterial({ color, linewidth: 1.5 });
      model.add(new Line(leftWingGeometry, wingMaterial));
      model.add(new Line(leftWingDetailGeometry, wingMaterial));
      model.add(new Line(leftWingDetail2Geometry, wingMaterial));
      model.add(new Line(rightWingGeometry, wingMaterial));
      model.add(new Line(rightWingDetailGeometry, wingMaterial));
      model.add(new Line(rightWingDetail2Geometry, wingMaterial));
      
      // Cockpit - more aerodynamic
      const cockpitGeometry = new SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const cockpitEdges = new EdgesGeometry(cockpitGeometry);
      const cockpitLines = new LineSegments(
        cockpitEdges,
        new LineBasicMaterial({ color, linewidth: 1.5 })
      );
      cockpitLines.position.set(0, 0.2, 0.4); // Raised and forward
      cockpitLines.scale.set(1, 0.5, 1.5); // Stretched for aerodynamic look
      model.add(cockpitLines);
      
      // Engines
      const engineGeometry = new TorusGeometry(0.15, 0.05, 8, 8);
      const engineEdges = new EdgesGeometry(engineGeometry);
      const engineLines1 = new LineSegments(
        engineEdges,
        new LineBasicMaterial({ color, linewidth: 1.5 })
      );
      engineLines1.position.set(0.4, 0, -1.1);
      engineLines1.rotation.x = Math.PI / 2;
      model.add(engineLines1);
      
      const engineLines2 = engineLines1.clone();
      engineLines2.position.set(-0.4, 0, -1.1);
      model.add(engineLines2);
      
      // Fin - add vertical stabilizer
      const finGeometry = new BufferGeometry().setFromPoints([
        new Vector3(0, 0.2, -0.7),    // bottom front
        new Vector3(0, 0.6, -0.9),    // top back
        new Vector3(0, 0.2, -1.2),    // bottom back
        new Vector3(0, 0.2, -0.7),    // bottom front (close shape)
      ]);
      const fin = new Line(finGeometry, new LineBasicMaterial({ color, linewidth: 1.5 }));
      model.add(fin);
      
      // Rotate the ship to face forward and tilt it
      model.rotation.y = Math.PI;
      model.rotation.x = 30 * (Math.PI / 180); // 30 degrees downward pitch (static)
      
    } else if (modelType === 'dysonSphere') {
      // Create a perfect sphere wireframe with evenly distributed lines
      
      // Use a different approach for a more perfect sphere appearance
      const radius = 1.3;
      const strutMaterial = new LineBasicMaterial({ color, linewidth: 0.5 });
      
      // Create horizontal rings
      const ringCount = 4; // Use fewer rings for cleaner appearance
      
      for (let i = 0; i < ringCount; i++) {
        // Calculate angle based on position (distribute evenly)
        const phi = ((i + 0.5) / ringCount) * Math.PI;
        
        // Create points for this ring
        const segments = 12; // Number of segments in each ring
        const ringPoints: Vector3[] = [];
        
        // Y position of this ring
        const y = radius * Math.cos(phi);
        // Radius of this ring
        const ringRadius = radius * Math.sin(phi);
        
        // Create the points around the ring
        for (let j = 0; j <= segments; j++) {
          const theta = (j / segments) * Math.PI * 2;
          const x = ringRadius * Math.cos(theta);
          const z = ringRadius * Math.sin(theta);
          ringPoints.push(new Vector3(x, y, z));
        }
        
        // Create the ring line
        const ringGeometry = new BufferGeometry().setFromPoints(ringPoints);
        const ring = new Line(ringGeometry, strutMaterial);
        model.add(ring);
      }
      
      // Add central equatorial ring (exactly in the middle)
      const equatorialSegments = 16; // More segments for smoother central ring
      const equatorialPoints: Vector3[] = [];
      
      for (let j = 0; j <= equatorialSegments; j++) {
        const theta = (j / equatorialSegments) * Math.PI * 2;
        // Central ring is exactly at y=0 (equator) with full radius
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        equatorialPoints.push(new Vector3(x, 0, z));
      }
      
      const equatorialGeometry = new BufferGeometry().setFromPoints(equatorialPoints);
      const equatorialRing = new Line(equatorialGeometry, strutMaterial);
      // Make it slightly thicker for emphasis
      equatorialRing.material = new LineBasicMaterial({ color, linewidth: 0.5 });
      model.add(equatorialRing);
      
      // Create vertical semicircles
      const verticalCount = 12; // Double the number of vertical semicircles (was 6)
      
      for (let i = 0; i < verticalCount; i++) {
        const theta = (i / verticalCount) * Math.PI * 2; // Now goes all the way around (0 to 2π)
        
        // Create points for this semicircle
        const segments = 16; // Number of segments in each semicircle
        const arcPoints: Vector3[] = [];
        
        // Create the points along the semicircle
        for (let j = 0; j <= segments; j++) {
          const phi = (j / segments) * Math.PI;
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);
          arcPoints.push(new Vector3(x, y, z));
        }
        
        // Create the semicircle line
        const arcGeometry = new BufferGeometry().setFromPoints(arcPoints);
        const arc = new Line(arcGeometry, strutMaterial);
        model.add(arc);
      }
    }
    
    // Add model to scene
    model.scale.set(0.8, 0.8, 0.8); // Slightly larger scale for better visibility
    model.position.y = 0; // Center vertically
    scene.add(model);
    modelRef.current = model;
    
    // Do an initial render even if not active
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [modelType, size, color]);
  
  // Handle animation in a separate effect that responds to game state
  useEffect(() => {
    if (!gameIsActive) {
      // If game is not active, cancel any running animation
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    // Set initial rotation for models to ensure consistent starting point
    if (modelRef.current) {
      if (modelType === 'ship') {
        // Ensure ship has the correct static pitch at all times
        modelRef.current.rotation.x = 30 * (Math.PI / 180);
      }
    }
    
    // Animation loop - only run when game is active
    const animate = () => {
      if (!modelRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return;
      }
      
      // Apply rotation - both models only rotate around Y axis with different speeds
      if (modelType === 'ship') {
        // Ship rotates around Y axis only, keeping static X rotation (pitch)
        modelRef.current.rotation.y += 0.01;
        // Ensure pitch stays at exactly 30 degrees
        modelRef.current.rotation.x = 30 * (Math.PI / 180);
      } else {
        // Dyson Sphere rotates slowly around Y axis only
        modelRef.current.rotation.y += 0.005;
      }
      
      // Apply slight bobbing movement for holographic feel
      modelRef.current.position.y = 0.1 + Math.sin(Date.now() * 0.002) * 0.05;
      
      // Render
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animate();
    
    // Cleanup on state change
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [gameIsActive, modelType]);
  
  // Add hologram effect with CSS (projection effect)
  return (
    <div 
      className="hologram-container"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        display: 'inline-block',
        marginRight: '8px',
        position: 'relative',
        background: 'transparent'
      }}
    >
      {/* Actual Three.js canvas container */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: 1 // Full opacity for better visibility
        }}
      />
      
      {/* Projection cone */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `12px solid ${color}`,
          filter: `blur(3px) brightness(1.5)`,
          opacity: 0.7,
          zIndex: -1
        }}
      />
      
      {/* Light pool/base effect */}
      <div
        style={{
          position: 'absolute',
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '18px',
          height: '4px',
          background: color,
          borderRadius: '50%',
          filter: 'blur(3px)',
          opacity: 0.5,
          zIndex: -1
        }}
      />
      
      {/* Scanline overlay for hologram effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(180deg, 
            rgba(0, 0, 0, 0) 0%, 
            rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1) 50%, 
            rgba(0, 0, 0, 0) 100%)`,
          backgroundSize: `100% ${size / 10}px`,
          animation: 'scanline 2s linear infinite',
          pointerEvents: 'none',
          opacity: 0.3
        }}
      />
      
      {/* Hologram flicker */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.2,
          animation: 'hologram-flicker 4s ease-in-out infinite',
          background: 'transparent',
          mixBlendMode: 'screen',
          pointerEvents: 'none'
        }}
      />
      
      {/* Ambient glow around model */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${size * 0.8}px`,
          height: `${size * 0.8}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,170,255,0.2) 0%, rgba(0,170,255,0) 70%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

// Helper function to convert world position to screen coordinates
function worldToScreen(position: Position, camera: Camera): { x: number, y: number } | null {
  // Create a Three.js Vector3 from the position
  const vec = new Vector3(position.x, position.y, position.z);
  
  // Project the 3D point to 2D screen coordinates
  vec.project(camera);
  
  // Convert to screen coordinates
  return {
    x: (vec.x * 0.5 + 0.5) * window.innerWidth,
    y: (-vec.y * 0.5 + 0.5) * window.innerHeight
  };
}

// Hook for responsive design
function useScreenSize() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
}

interface HUDProps {
  world: World;
  onStartGame: () => void;
  onRestartGame: () => void;
  onResumeGame: () => void;
  onRestartAtWave: (waveNumber: number) => void;
  camera?: Camera; // Add camera as an optional prop
}

const HUD: React.FC<HUDProps> = ({ world, onStartGame, onRestartGame, onResumeGame, onRestartAtWave, camera }) => {
  // Screen size for responsive layout
  const screen = useScreenSize();
  
  // State to hold UI data
  const [playerHealth, setPlayerHealth] = useState<Health>({ current: 100, max: 100 });
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [dysonHealth, setDysonHealth] = useState({ 
    shieldPercentage: 100, 
    healthPercentage: 100 
  });
  const [enemiesRemaining, setEnemiesRemaining] = useState({ current: 0, total: 0 });
  const [currentWave, setCurrentWave] = useState(1);
  const [boostReady, setBoostReady] = useState(true);
  const [boostData, setBoostData] = useState({
    active: false,
    remaining: 1.0,
    cooldown: 0,
    maxTime: 1.0
  });
  const [damageEffect, setDamageEffect] = useState({ active: false, intensity: 0 });
  const [gameState, setGameState] = useState<'not_started' | 'playing' | 'paused' | 'game_over'>('not_started');
  const [gameOverStats, setGameOverStats] = useState({ finalScore: 0, survivalTime: 0, enemiesDefeated: 0, wavesCompleted: 0 });
  const [waveCountdown, setWaveCountdown] = useState<number | null>(null);
  const [waveComplete, setWaveComplete] = useState(false);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [animatedMessages, setAnimatedMessages] = useState<Set<string>>(new Set());
  const [reticle, setReticle] = useState<Reticle>({
    visible: true,
    style: 'default',
    size: 1,
    color: '#00ffff',
    pulsating: true
  });
  const [floatingScores, setFloatingScores] = useState<Array<{
    id: number;
    value: number;
    position: { x: number, y: number };
    color: string;
    opacity: number;
  }>>([]);
  const [radarData, setRadarData] = useState<{
    active: boolean;
    trackedEntities: Array<{
      entityId: number;
      entityType: string;
      distance: number;
      direction: {
        x: number;
        y: number;
        z: number;
      };
      threatLevel: number;
    }>;
  }>({
    active: true,
    trackedEntities: []
  });
  
  // Add state for shield bars
  const [shieldBars, setShieldBars] = useState<Array<{
    id: number;
    position: { x: number, y: number };
    width: number;
    height: number;
    percent: number;
  }>>([]);
  
  // Add state for health bars
  const [healthBars, setHealthBars] = useState<Array<{
    id: number;
    position: { x: number, y: number };
    width: number;
    height: number;
    percent: number;
  }>>([]);
  
  // State for tracking brackets position with lag effect
  const [bracketsOffset, setBracketsOffset] = useState({ x: 0, y: 0 });
  const lastMouseMoveRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Use a ref to track processed messages so we have immediate access to the latest value
  const processedMessagesRef = useRef<Set<string>>(new Set());
  
  // Add this ref near the other refs (around line 95)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Update UI data from ECS world
  useEffect(() => {
    let lastRender = performance.now();
    
    // This is our "render" function that runs on each animation frame
    const updateHUD = (timestamp: number) => {
      // Calculate time since last update (for smooth animations)
      const deltaTime = timestamp - lastRender;
      lastRender = timestamp;
      
      const hudEntities = world.getEntitiesWith(['UIDisplay']);
      if (hudEntities.length === 0) return;
      
      const hudEntity = hudEntities[0];
      
      // Update health
      const healthDisplay = world.getComponent<HealthDisplay>(hudEntity, 'HealthDisplay');
      if (healthDisplay) {
        const targetHealth = world.getComponent<Health>(healthDisplay.entity, 'Health');
        if (targetHealth) {
          setPlayerHealth(targetHealth);
        }
      }
      
      // Update score
      const scoreDisplay = world.getComponent<ScoreDisplay>(hudEntity, 'ScoreDisplay');
      if (scoreDisplay) {
        setScore(scoreDisplay.score);
      }
      
      // Update message
      const messageDisplay = world.getComponent<MessageDisplay>(hudEntity, 'MessageDisplay');
      if (messageDisplay) {
        const newMessage = messageDisplay.message;
        
        // Only process if this is a new message that we haven't seen before
        if (newMessage && newMessage.trim() !== '' && 
            !processedMessagesRef.current.has(newMessage) && 
            !alertMessages.includes(newMessage) &&  
            !(newMessage === "OBJECTIVE: DEFEND THE DYSON SPHERE" && 
              alertMessages.includes("OBJECTIVE: DEFEND THE DYSON SPHERE"))) {
          
          // Add to processed messages ref immediately
          processedMessagesRef.current.add(newMessage);
          
          // Add to alert messages array - keep all messages, don't limit to 4
          setAlertMessages(prev => [...prev, newMessage]);
        }
        
        setMessage(newMessage);
      }
      
      // Update Dyson Sphere status
      const dysonStatus = world.getComponent<DysonSphereStatus>(hudEntity, 'DysonSphereStatus');
      if (dysonStatus) {
        setDysonHealth({
          shieldPercentage: dysonStatus.shieldPercentage,
          healthPercentage: dysonStatus.healthPercentage
        });
      }
      
      // Update damage effect
      const damageEffectComp = world.getComponent<DamageEffect>(hudEntity, 'DamageEffect');
      if (damageEffectComp) {
        setDamageEffect({
          active: damageEffectComp.active,
          intensity: damageEffectComp.intensity
        });
      }
      
      // Update game state
      const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      if (gameStateDisplay) {
        setGameState(gameStateDisplay.currentState);
      }
      
      // Update reticle
      const reticleComponent = world.getComponent<Reticle>(hudEntity, 'Reticle');
      if (reticleComponent) {
        setReticle(reticleComponent);
      }
      
      // Update boost state from game state - priority update for smoothness
      const gameState = world.getGameState();
      if (gameState) {
        // Boost is ready if cooldown is 0 and there's some boost remaining
        setBoostReady(gameState.boostCooldown <= 0 && gameState.boostRemaining > 0);
        
        // Update the boost data with exact values from game state
        setBoostData({
          active: gameState.boostActive,
          remaining: gameState.boostRemaining,
          cooldown: gameState.boostCooldown,
          maxTime: 1.0
        });
      }
      
      // Update game over stats if in game over state
      if (gameStateDisplay && gameStateDisplay.currentState === 'game_over') {
        const stats = world.getComponent<GameOverStats>(hudEntity, 'GameOverStats');
        if (stats) {
          setGameOverStats(stats);
        }
      }
      
      // Update wave information
      const waveEntities = world.getEntitiesWith(['WaveInfo']);
      if (waveEntities.length > 0) {
        const waveInfo = world.getComponent<WaveInfo>(waveEntities[0], 'WaveInfo');
        if (waveInfo) {
          setCurrentWave(waveInfo.currentWave);
          setEnemiesRemaining({
            current: waveInfo.enemiesRemaining,
            total: waveInfo.totalEnemies + waveInfo.enemiesRemaining
          });
          
          // Update wave countdown and completion state
          if (!waveInfo.isActive && waveInfo.nextWaveTimer > 0) {
            // Round to nearest integer for clean display
            setWaveCountdown(Math.ceil(waveInfo.nextWaveTimer));
            setWaveComplete(waveInfo.currentWave > 0);
          } else {
            setWaveCountdown(null);
            setWaveComplete(false);
          }
        }
      }
      
      // Update floating scores if camera is available
      if (camera) {
        const scoreEntities = world.getEntitiesWith(['FloatingScore', 'Position']);
        const newFloatingScores = scoreEntities.map(entity => {
          const scoreComp = world.getComponent<FloatingScore>(entity, 'FloatingScore');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!scoreComp || !positionComp) return null;
          
          // Convert world position to screen coordinates
          const screenPos = worldToScreen(positionComp, camera);
          
          if (!screenPos) return null;
          
          return {
            id: entity,
            value: scoreComp.value,
            position: screenPos,
            color: scoreComp.color,
            opacity: scoreComp.opacity
          };
        }).filter(score => score !== null) as Array<{
          id: number;
          value: number;
          position: { x: number, y: number };
          color: string;
          opacity: number;
        }>;
        
        setFloatingScores(newFloatingScores);
      }
      
      // Update radar data
      const radarComponent = world.getComponent<Radar>(hudEntity, 'Radar');
      if (radarComponent) {
        setRadarData({
          active: radarComponent.active,
          trackedEntities: radarComponent.trackedEntities
        });
      }
      
      // Update shield bars if camera is available
      if (camera) {
        const shieldBarEntities = world.getEntitiesWith(['ShieldBarComponent', 'Position']);
        
        const newShieldBars = shieldBarEntities.map(entity => {
          const shieldBarComp = world.getComponent<ShieldBarComponent>(entity, 'ShieldBarComponent');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!shieldBarComp || !positionComp || !shieldBarComp.visible) return null;
          
          // Get the shield component to determine fill percentage
          const shieldComp = world.getComponent<ShieldComponent>(shieldBarComp.entity, 'ShieldComponent');
          if (!shieldComp) return null;
          
          // Convert world position to screen coordinates
          const basePos = worldToScreen({
            x: positionComp.x,
            y: positionComp.y + shieldBarComp.offsetY, // Apply vertical offset
            z: positionComp.z
          }, camera);
          
          if (!basePos) return null;
          
          const percent = (shieldComp.currentShield / shieldComp.maxShield) * 100;
          
          return {
            id: entity,
            position: basePos,
            width: shieldBarComp.width,
            height: shieldBarComp.height,
            percent
          };
        }).filter(bar => bar !== null) as Array<{
          id: number;
          position: { x: number, y: number };
          width: number;
          height: number;
          percent: number;
        }>;
        
        setShieldBars(newShieldBars);
        
        // Update health bars
        const healthBarEntities = world.getEntitiesWith(['HealthBarComponent', 'Position']);
        
        const newHealthBars = healthBarEntities.map(entity => {
          const healthBarComp = world.getComponent<HealthBarComponent>(entity, 'HealthBarComponent');
          const positionComp = world.getComponent<Position>(entity, 'Position');
          
          if (!healthBarComp || !positionComp || !healthBarComp.visible) return null;
          
          // Get the health component to determine fill percentage
          const healthComp = world.getComponent<Health>(healthBarComp.entity, 'Health');
          if (!healthComp) return null;
          
          // Convert world position to screen coordinates
          const basePos = worldToScreen({
            x: positionComp.x,
            y: positionComp.y + healthBarComp.offsetY, // Apply vertical offset
            z: positionComp.z
          }, camera);
          
          if (!basePos) return null;
          
          const percent = (healthComp.current / healthComp.max) * 100;
          
          return {
            id: entity,
            position: basePos,
            width: healthBarComp.width,
            height: healthBarComp.height,
            percent
          };
        }).filter(bar => bar !== null) as Array<{
          id: number;
          position: { x: number, y: number };
          width: number;
          height: number;
          percent: number;
        }>;
        
        setHealthBars(newHealthBars);
      }
      
      // Request next frame update - use the timestamp
      requestAnimationFrame(updateHUD);
    };
    
    // Start the update loop
    const animationId = requestAnimationFrame(updateHUD);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [world, camera]);
  
  // Effect to handle alert messages after wave countdown
  useEffect(() => {
    // When wave countdown ends (changes from a number to null), show only the objective alert
    if (waveCountdown === null && gameState === 'playing') {
      // Clear alerts immediately before setting new one to prevent flashing
      setAlertMessages([]);
      
      // Small delay to ensure full clear before showing objective
      setTimeout(() => {
        // Always show the objective message when wave countdown ends
        setAlertMessages(["OBJECTIVE: DEFEND THE DYSON SPHERE"]);
        // Reset animated messages so objective gets animated
        setAnimatedMessages(new Set());
      }, 200);
    }
  }, [waveCountdown, gameState]); // Remove alertMessages from dependencies
  
  // Reset processed messages when starting a new wave
  useEffect(() => {
    if (waveCountdown !== null) {
      // Reset the processed messages when a new wave is about to start
      processedMessagesRef.current = new Set();
      // Reset animated messages so new messages get animated
      setAnimatedMessages(new Set());
    }
  }, [waveCountdown]);
  
  // Add this effect to scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [alertMessages]);
  
  // Convert hex color to CSS color format
  const hexToCSS = (hexColor: number): string => {
    return `#${hexColor.toString(16).padStart(6, '0')}`;
  };
  
  // Calculate player health percentage
  const playerHealthPercentage = (playerHealth.current / playerHealth.max) * 100;
  
  // Determine hull status text and color based on health percentage
  const getHullStatus = () => {
    if (playerHealthPercentage > 75) {
      return { text: 'OPTIMAL', color: '#4CAF50' };
    } else if (playerHealthPercentage > 50) {
      return { text: 'FUNCTIONAL', color: '#FFC107' };
    } else if (playerHealthPercentage > 25) {
      return { text: 'WARNING', color: '#FF9800' };
    } else {
      return { text: 'CRITICAL', color: '#F44336' };
    }
  };
  
  const hullStatus = getHullStatus();

  // Generate random shake transform when damage effect is active
  const getShakeTransform = (): string => {
    if (damageEffect.active) {
      const intensity = damageEffect.intensity * 10;
      const xShake = (Math.random() - 0.5) * intensity;
      const yShake = (Math.random() - 0.5) * intensity;
      return `translate(${xShake}px, ${yShake}px)`;
    }
    return 'translate(0, 0)';
  };
  
  // Add handlers for pause functionality
  const handlePauseGame = () => {
    if (gameState === 'playing') {
      // Update world gameState
      const hudEntities = world.getEntitiesWith(['UIDisplay']);
      if (hudEntities.length > 0) {
        const hudEntity = hudEntities[0];
        const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
        
        if (gameStateDisplay) {
          // Remove the old component and add the updated one
          world.removeComponent(hudEntity, 'GameStateDisplay');
          world.addComponent(hudEntity, 'GameStateDisplay', {
            ...gameStateDisplay,
            currentState: 'paused'
          });
        }
      }
    }
  };
  
  const handleResumeGame = () => {
    // Call the prop function to handle resuming the game at the App level
    onResumeGame();
    
    // Update world gameState
    const hudEntities = world.getEntitiesWith(['UIDisplay']);
    if (hudEntities.length > 0) {
      const hudEntity = hudEntities[0];
      const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay) {
        // Remove the old component and add the updated one
        world.removeComponent(hudEntity, 'GameStateDisplay');
        world.addComponent(hudEntity, 'GameStateDisplay', {
          ...gameStateDisplay,
          currentState: 'playing'
        });
      }
    }
  };
  
  const handleSelectWave = (wave: number) => {
    // Call the App-level handler to fully restart the game at the selected wave
    onRestartAtWave(wave);
  };
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        handlePauseGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  // Add effect to handle mouse movement for reticle bracket lag
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Capture mouse movement - negate the values to make brackets move in opposite direction
      const now = performance.now();
      
      // Calculate magnitude of movement (speed)
      const movementMagnitude = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
      
      lastMouseMoveRef.current = { 
        x: -e.movementX, // Negate to make brackets move in opposite direction
        y: -e.movementY, // Negate to make brackets move in opposite direction
        time: now 
      };
    };

    // Animation frame to update bracket positions with smoother, springier motion
    const updateBracketPositions = () => {
      if (gameState === 'playing') {
        const now = performance.now();
        const timeSinceLastMove = now - lastMouseMoveRef.current.time;
        
        // Apply lag effect with springy motion
        const lagFactor = 0.15; // Reduced for smoother movement
        const springFactor = 0.08; // Reduced for smoother return
        const maxOffset = 60; // Maximum pixel offset in any direction
        
        // If there was recent mouse movement, update the offset
        if (timeSinceLastMove < 100) {
          // Add to the current offset
          setBracketsOffset(prev => {
            // Calculate new position with lag effect - simplified for smoother motion
            const targetX = lastMouseMoveRef.current.x;
            const targetY = lastMouseMoveRef.current.y;
            
            const newX = prev.x + (targetX - prev.x) * lagFactor;
            const newY = prev.y + (targetY - prev.y) * lagFactor;
            
            // Apply maximum limits
            return {
              x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
              y: Math.max(-maxOffset, Math.min(maxOffset, newY))
            };
          });
        } else {
          // No recent movement, smoothly return to center using the same factor
          setBracketsOffset(prev => ({
            x: prev.x * (1 - springFactor),
            y: prev.y * (1 - springFactor)
          }));
        }
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(updateBracketPositions);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    let animationFrameId = requestAnimationFrame(updateBracketPositions);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);
  
  // Render appropriate screen based on game state
  if (gameState === 'not_started') {
    return <StartScreen onStartGame={onStartGame} />;
  }
  
  if (gameState === 'game_over') {
    return <GameOverScreen stats={gameOverStats} onRestart={onRestartGame} />;
  }
  
  if (gameState === 'paused') {
    return (
      <PauseScreen 
        onResume={handleResumeGame} 
        onRestart={onRestartGame}
        currentWave={currentWave}
        onSelectWave={handleSelectWave}
      />
    );
  }
  
  // Main game HUD
  return (
    <>
      {/* Damage effect overlay */}
      {damageEffect.active && (
        <div className="damage-effect" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          boxShadow: `inset 0 0 ${50 * damageEffect.intensity}px rgba(255, 0, 0, 0.8)`,
          zIndex: 100,
          pointerEvents: 'none',
          transform: getShakeTransform()
        }} />
      )}
      
      {/* Floating Score Indicators */}
      {floatingScores.map(score => (
        <div
          key={score.id}
          className="floating-score"
          style={{
            position: 'absolute',
            top: score.position.y,
            left: score.position.x,
            transform: 'translate(-50%, -50%)',
            color: score.color,
            opacity: score.opacity,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: `0 0 8px ${score.color}`,
            zIndex: 20,
            pointerEvents: 'none'
          }}
        >
          +{score.value}
        </div>
      ))}
      
      {/* Shield Bars */}
      {shieldBars.map(bar => (
        <div
          key={bar.id}
          style={{
            position: 'absolute',
            top: bar.position.y,
            left: bar.position.x - bar.width / 2, // Center on position
            width: `${bar.width}px`,
            height: `${bar.height}px`,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #21a9f3',
            borderRadius: '2px',
            overflow: 'hidden',
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(33, 169, 243, 0.6)'
          }}
        >
          <div style={{
            width: `${bar.percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #21a9f3, #64c6f7)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      ))}
      
      {/* Health Bars */}
      {healthBars.map(bar => (
        <div
          key={bar.id}
          style={{
            position: 'absolute',
            top: bar.position.y,
            left: bar.position.x - bar.width / 2, // Center on position
            width: `${bar.width}px`,
            height: `${bar.height}px`,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid #ff5252',
            borderRadius: '2px',
            overflow: 'hidden',
            zIndex: 20,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(255, 82, 82, 0.6)'
          }}
        >
          <div style={{
            width: `${bar.percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff5252, #ff8a80)',
            transition: 'width 0.2s ease'
          }} />
        </div>
      ))}
      
      {/* Retro Futuristic Reticle */}
      {reticle.visible && gameState === 'playing' && (
        <div
          className={`retro-reticle ${reticle.pulsating ? 'pulsating' : ''}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) ${damageEffect.active ? getShakeTransform() : ''}`,
            width: `${30 * reticle.size}px`,
            height: `${30 * reticle.size}px`,
            zIndex: 5,
            pointerEvents: 'none',
            opacity: reticle.pulsating ? 0.8 : 1
          }}
        >
          {/* Inner Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${4 * reticle.size}px`,
            height: `${4 * reticle.size}px`,
            borderRadius: '50%',
            border: `1px solid ${reticle.color}`,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.6
          }}></div>
          
          {/* Outer Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${20 * reticle.size}px`,
            height: `${20 * reticle.size}px`,
            borderRadius: '50%',
            border: `1px solid ${reticle.color}`,
            boxShadow: `0 0 8px ${reticle.color}`,
            opacity: 0.6
          }}></div>
          
          {/* Crosshair lines */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            transform: 'translateY(-50%)',
            width: '100%',
            height: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.6
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            height: '100%',
            width: `${1 * reticle.size}px`,
            background: reticle.color,
            boxShadow: `0 0 5px ${reticle.color}`,
            opacity: 0.6
          }}></div>
          
          {/* Corner brackets with lag effect - create a container for all brackets */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            transform: `translate(${bracketsOffset.x}px, ${bracketsOffset.y}px)`,
            transition: 'none', // Removed transition for more direct control
            opacity: 0.4 // Added transparency to brackets
          }}>
            {/* Top-left brackets */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: `${8 * reticle.size}px`,
              height: `${1 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: `${1 * reticle.size}px`,
              height: `${8 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            
            {/* Top-right brackets */}
            <div style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: `${8 * reticle.size}px`,
              height: `${1 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            <div style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: `${1 * reticle.size}px`,
              height: `${8 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            
            {/* Bottom-left brackets */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: `${8 * reticle.size}px`,
              height: `${1 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: `${1 * reticle.size}px`,
              height: `${8 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            
            {/* Bottom-right brackets */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: `${8 * reticle.size}px`,
              height: `${1 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: `${1 * reticle.size}px`,
              height: `${8 * reticle.size}px`,
              background: reticle.color,
              boxShadow: `0 0 5px ${reticle.color}`,
            }}></div>
          </div>
        </div>
      )}
      
      {/* === NEW: Top Right Radar Container === */}
      {!screen.isMobile && (
        <div style={{
          position: 'absolute',
          top: '20px',        // Position from top
          right: '20px',       // Position from right
          zIndex: 10,          // Ensure it's above game, below modals
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end', // Align content (labels) to the right
          background: 'rgba(0, 0, 0, 0.6)', // Keeping background
          padding: '10px', // Keeping padding
          borderRadius: '8px', // Keeping border radius
          // border: '1px solid #ff00ff', // REMOVED border
          // boxShadow: '0 0 10px rgba(255, 0, 255, 0.4)', // REMOVED glow
          pointerEvents: 'none', // Allow clicks to pass through usually
        }}>
          {/* Render the Radar Display Component with updated size prop */}
          <RadarDisplay radarData={radarData} radarVisualRadius={82} />

          {/* Threats Label below the radar */}
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <div style={{
              fontSize: '0.7rem',
              color: radarData.trackedEntities.filter(e => e.entityType !== 'dysonSphere').length > 0 ? '#ff5555' : '#44ff44',
              fontFamily: "'Press Start 2P', monospace",
              textShadow: '1px 1px 1px #000',
            }}>
              THREATS: {radarData.trackedEntities.filter(e => e.entityType !== 'dysonSphere').length}
            </div>
            {/* Wave Label REMOVED */}
            {/* <div style={{
              fontSize: '0.7rem',
              color: '#00ffff',
              marginTop: '4px',
              fontFamily: "'Press Start 2P', monospace",
              textShadow: '1px 1px 1px #000',
            }}>
              WAVE: {currentWave}
            </div> */}
          </div>
        </div>
      )}
      {/* === END: Top Right Radar Container === */}


      {/* Player HUD - Bottom (Adjusted Layout) */}
      <div className="ship-console" style={{
        position: 'absolute',
        bottom: '40px', // Raised from 20px
        left: '50%',
        transform: `translateX(-50%) ${damageEffect.active ? getShakeTransform() : ''}`,
        display: 'flex',
        width: '90%',           // Adjust as needed
        maxWidth: '1000px',     // Reduce max width slightly?
        // height adjustment handled by individual panels now if needed, or set a min-height
        justifyContent: 'center', // Center the two remaining panels
        gap: '2%',              // Add space between panels
        alignItems: 'flex-end',
        zIndex: 10,
        pointerEvents: 'none',
        flexDirection: screen.isMobile ? 'column' : 'row'
      }}>

        {/* Left Panel - Messages Console */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '49%', // Increased width
          height: screen.isMobile ? '120px' : '220px', // Match height of center panel for consistency
          marginBottom: screen.isMobile ? '10px' : '0',
          display: screen.isMobile && !waveCountdown ? 'none' : 'flex', // Hide on mobile when no wave activity
          background: 'rgba(0, 0, 0, 0.7)',
          borderTop: '2px solid #ff00ff',
          borderLeft: '2px solid #ff00ff',
          borderRight: '2px solid #ff00ff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
          padding: '12px',
          overflow: 'hidden',
          flexDirection: 'column',
          minWidth: '350px'
        }}>
          {/* ... Keep ALL internal content of the messages panel ... */}
          <div style={{
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '8px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>
              {waveCountdown !== null ? 'ALERT' : 'COMMS'}
              {(alertMessages.length > 0 || waveCountdown !== null) && <span className="notification-indicator"></span>}
            </span>
            <span style={{ 
              color: waveCountdown !== null ? '#ff5555' : '#00ffff', 
              fontSize: '0.6rem',
              animation: waveCountdown !== null ? 'alert-text-blink 1s infinite' : 'pulse-opacity 1s infinite alternate'
            }}>
              {waveCountdown !== null ? 'WARNING' : 'ONLINE'}
            </span>
          </div>
          
          <div style={{ 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {waveCountdown && (
              <div 
                className="wave-alert-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '1rem',
                  zIndex: 2,
                  animation: waveComplete ? 'wave-alert-flicker 0.5s infinite' : 'none'
                }}
              >
                {waveComplete ? (
                  <div 
                    style={{
                      color: '#ff0000', 
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      textShadow: '0 0 10px #ff0000',
                      animation: 'alert-text-blink 1s infinite',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{letterSpacing: '0.2rem'}}>WAVE COMPLETE</div>
                    <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>
                      NEXT WAVE IN {waveCountdown}
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{
                      color: '#ff9900', 
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      textShadow: '0 0 10px #ff9900',
                      animation: 'alert-text-blink 1s infinite',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{letterSpacing: '0.2rem'}}>INCOMING WAVE</div>
                    <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>
                      {waveCountdown}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Normal console content when no wave notification */}
            {waveCountdown === null && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                padding: '5px 0',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
                maxHeight: '100%'
              }}>
                {/* Display messages with oldest at the top, newest at the bottom */}
                {alertMessages.map((alert, index) => {
                  // Only animate messages that haven't been animated yet
                  const shouldAnimate = !animatedMessages.has(alert);
                  
                  // When a message has been rendered with animation, add it to the set
                  if (shouldAnimate) {
                    // Use timeout to ensure message gets animated before adding to set
                    setTimeout(() => {
                      setAnimatedMessages(prev => new Set([...prev, alert]));
                    }, 2100); // Wait for animation to complete
                  }

                  // Split message into lines with max 25 characters per line
                  const words = alert.split(' ');
                  let lines: string[] = [];
                  let currentLine = '';

                  words.forEach(word => {
                    if (currentLine.length + word.length + 1 > 25) {
                      lines.push(currentLine.trim());
                      currentLine = word;
                    } else {
                      currentLine += (currentLine ? ' ' : '') + word;
                    }
                  });
                  if (currentLine) {
                    lines.push(currentLine.trim());
                  }
                  
                  return (
                    <div 
                      key={`alert-${index}-${alert}`}
                      style={{ 
                        color: alert.includes('OBJECTIVE') ? '#00ff00' : '#ff5555', 
                        fontSize: '0.7rem', 
                        marginBottom: '8px',
                        width: '100%',
                        lineHeight: '1.2'
                      }}
                    >
                      &gt; {lines.map((line, lineIndex) => (
                        <div 
                          key={`line-${lineIndex}`}
                          style={{
                            display: 'block',
                            marginLeft: lineIndex > 0 ? '12px' : '0'
                          }}
                        >
                          <span 
                            className={shouldAnimate ? `typing-animation line-${lineIndex}` : ""}
                            style={{
                              display: 'inline-block',
                              maxWidth: 'calc(100% - 15px)',
                              wordBreak: 'break-word',
                              '--delay': lineIndex * 1.2,
                              '--total-lines': lines.length,
                              '--line-index': lineIndex
                            } as React.CSSProperties}
                          >
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {alertMessages.length === 0 && (
                  <div style={{ color: '#666666', fontSize: '0.7rem', fontStyle: 'italic' }}>
                    &gt; No messages
                  </div>
                )}
                <div ref={messagesEndRef} /> {/* This element helps us scroll to the bottom */}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Ship Status */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '49%', // Increased width
          height: screen.isMobile ? '140px' : '220px', // Increased height from 180px
          marginBottom: screen.isMobile ? '10px' : '0',
          background: 'rgba(0, 0, 0, 0.7)',
          borderTop: '2px solid #ff00ff',
          borderLeft: '2px solid #ff00ff',
          borderRight: '2px solid #ff00ff',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px',
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
           {/* ... Keep ALL internal content of the systems panel ... */}
           <div style={{
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '8px',
            marginBottom: '8px', // Reduced margin slightly
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem' }}>SYSTEMS</span>
            <span style={{ 
              color: hullStatus.color, 
              fontSize: '0.6rem',
              animation: hullStatus.text === 'CRITICAL' ? 'alertBlink 0.5s infinite alternate' : 'none'
            }}>{hullStatus.text}</span>
          </div>

          {/* Container for the two columns */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            flex: '1' // Allow this container to grow and fill space
          }}>
            {/* Left Column: Ship Systems */}
            <div style={{
              flex: '1',
              marginRight: '8px', // Adjusted space for separator
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Ship Systems Header with Hologram */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                {/* Add hologram next to the ship header */}
                <Hologram modelType="ship" size={35} color="#00aaff" gameIsActive={gameState === 'playing'} />
                <span style={{ color: '#ff00ff', fontSize: '0.65rem', fontWeight: 'bold' }}>SHIP</span>
              </div>
              {/* Dotted line below header */}
              <div style={{
                width: '90%', // Make slightly shorter than full width
                borderBottom: '1px dotted rgba(255, 0, 255, 0.5)', // Dotted magenta line
                marginBottom: '8px' // Space below line
              }}></div>

              {/* Boost System */}
              <div style={{ marginBottom: '10px' }}> 
                <div style={{
                  color: '#00ffff', 
                  marginBottom: '5px',
                  fontSize: '0.6rem'
                }}>
                  BOOST SYSTEM:
                </div>
                <div style={{
                  width: '100%',
                  height: '16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid #555555',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: boostData.cooldown > 0 
                      ? `${(1 - boostData.cooldown / 3.0) * 100}%` 
                      : `${Math.max(0, (boostData.remaining / boostData.maxTime) * 100)}%`,
                    height: '100%',
                    background: boostData.cooldown > 0
                      ? 'linear-gradient(90deg, #330066, #660066)'
                      : (boostData.active 
                          ? 'linear-gradient(90deg, #ff00ff, #00ffff)' 
                          : 'linear-gradient(90deg, #00ffff, #ff00ff)'),
                    boxShadow: boostData.active 
                      ? '0 0 10px #ff00ff, 0 0 20px #ff00ff' 
                      : 'none',
                    transitionProperty: 'box-shadow, background',
                    transitionDuration: '0.2s',
                    transform: 'translateZ(0)',
                    willChange: 'width'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: boostData.cooldown > 0 ? '#888888' : '#ffffff',
                    textShadow: '1px 1px 2px #000000',
                    fontSize: '0.65rem',
                    fontWeight: 'bold'
                  }}>
                    {boostData.cooldown > 0 
                      ? "CHARGING" 
                      : boostData.active 
                        ? "ACTIVE" 
                        : "READY"
                    }
                  </div>
                </div>
              </div>

              {/* Hull Status */}
              <div style={{ marginBottom: '10px' }}> 
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '5px',
                  color: hullStatus.color,
                  fontSize: '0.6rem',
                  whiteSpace: 'nowrap'
                }}>
                  <span>HULL INTEGRITY:</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid #555555',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: `${playerHealthPercentage}%`,
                    height: '100%',
                    background: hullStatus.color,
                    transition: 'width 0.3s ease'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px #000000',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {hullStatus.text}
                  </div>
                </div>
              </div>
            </div> {/* End Left Column */}

            {/* Vertical Separator - ADD THIS */}
            <div style={{
              width: '1px',
              background: 'rgba(255, 0, 255, 0.3)', // Magenta separator
              height: '85%', // Adjust height as needed, relative to parent container
              alignSelf: 'center', // Center it vertically
              margin: '0 4px' // Add small horizontal margin
            }}></div>

            {/* Right Column: Dyson Systems */}
            <div style={{
              flex: '1',
              marginLeft: '8px', // Ensure this is set
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Dyson Systems Header with Hologram */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                {/* Add hologram next to the Dyson Sphere header */}
                <Hologram modelType="dysonSphere" size={40} color="#00aaff" gameIsActive={gameState === 'playing'} />
                <span style={{ color: '#ff00ff', fontSize: '0.65rem', fontWeight: 'bold' }}>DYSON SPHERE</span>
              </div>
              {/* Dotted line below header */}
              <div style={{
                width: '90%', // Make slightly shorter than full width
                borderBottom: '1px dotted rgba(255, 0, 255, 0.5)', // Dotted magenta line
                marginBottom: '8px' // Space below line
              }}></div>

              {/* Dyson Shield Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  color: dysonHealth.shieldPercentage > 70 ? '#21a9f3' : dysonHealth.shieldPercentage > 30 ? '#FFC107' : '#F44336',
                  marginBottom: '5px',
                  fontSize: '0.6rem'
                }}>
                  DYSON SHIELD:
                </div>
                <div style={{
                  width: '100%',
                  height: '16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid #555555',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: `${dysonHealth.shieldPercentage}%`,
                    height: '100%',
                    background: dysonHealth.shieldPercentage > 70 
                      ? 'linear-gradient(90deg, #2196F3, #64B5F6)'
                      : dysonHealth.shieldPercentage > 30
                      ? 'linear-gradient(90deg, #FFC107, #FFD54F)'
                      : 'linear-gradient(90deg, #F44336, #E57373)',
                    transition: 'width 0.3s ease'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px #000000',
                    fontSize: '0.65rem',
                    fontWeight: 'bold'
                  }}>
                    {Math.round(dysonHealth.shieldPercentage)}%
                  </div>
                </div>
              </div>

              {/* Dyson Core Status */}
              <div style={{ marginBottom: '10px' }}>
                 <div style={{
                  color: dysonHealth.healthPercentage > 70 ? '#4CAF50' : dysonHealth.healthPercentage > 30 ? '#FFC107' : '#F44336',
                  marginBottom: '5px',
                  fontSize: '0.6rem'
                }}>
                  DYSON CORE:
                </div>
                <div style={{
                  width: '100%',
                  height: '16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid #555555',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: `${dysonHealth.healthPercentage}%`,
                    height: '100%',
                    background: dysonHealth.healthPercentage > 70
                      ? 'linear-gradient(90deg, #4CAF50, #81C784)'
                      : dysonHealth.healthPercentage > 30
                      ? 'linear-gradient(90deg, #FFC107, #FFD54F)'
                      : 'linear-gradient(90deg, #F44336, #E57373)',
                    transition: 'width 0.3s ease',
                    animation: dysonHealth.healthPercentage < 30 ? 'alertBlinkBackground 0.5s infinite alternate' : 'none'
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ffffff',
                    textShadow: '1px 1px 2px #000000',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    {dysonHealth.healthPercentage > 70 ? 'STABLE' : dysonHealth.healthPercentage > 30 ? 'WARNING' : 'CRITICAL'}
                  </div>
                </div>
              </div>
            </div> {/* End Right Column */}
          </div> {/* End Columns Container */}
          
          {/* Ship information */}
          <div style={{
            marginTop: 'auto',
            borderTop: '1px solid #555555',
            paddingTop: '8px',
            color: '#bbbbbb',
            fontSize: '0.6rem',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>CLASS: DEFENDER</div>
            <div>ID: DSP-117</div>
          </div>
        </div>

        {/* === REMOVED Right Panel === */}
        {/* The entire div.console-panel.retro-text for the Radar has been removed */}

      </div> {/* End ship-console */}
    </>
  );
};

export default HUD;
