import React, { useEffect, useState, CSSProperties, useRef } from 'react';
import { World } from '../core/World';
import { Health, UIDisplay, HealthDisplay, ScoreDisplay, MessageDisplay, DysonSphereStatus, DamageEffect, GameStateDisplay, GameOverStats, Reticle, FloatingScore, Position, WaveInfo, Radar, ShieldBarComponent, ShieldComponent, HealthBarComponent, ScreenPosition } from '../core/components';
import { COLORS } from '../constants/colors';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import PauseScreen from './PauseScreen';
import './styles/retro.css';
import { Vector3, Camera, WebGLRenderer, Scene, PerspectiveCamera, MeshBasicMaterial, BoxGeometry, SphereGeometry, IcosahedronGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, DoubleSide, Group, AmbientLight, MathUtils, TorusGeometry, PointLight, BufferGeometry, Line } from 'three';
import RadarDisplay from './hud/RadarDisplay';
import CommsDisplay from './hud/CommsDisplay'; // ADDED IMPORT
import AlertsDisplay from './hud/AlertsDisplay'; // Add import for new AlertsDisplay
import { GameStateManager } from '../core/State'; // Added import

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
  gameStateManager: GameStateManager; // Added gameStateManager
  onStartGame: () => void;
  onRestartGame: () => void;
  onResumeGame: () => void;
  onPauseGame: () => void; // ADD this prop
  onRestartAtWave: (waveNumber: number) => void;
  onExitGame: () => void; // Added exit game prop
  camera?: Camera; // Add camera as an optional prop
}

const HUD: React.FC<HUDProps> = ({ world, gameStateManager, onStartGame, onRestartGame, onResumeGame, onPauseGame, onRestartAtWave, onExitGame, camera }) => {
  // Screen size for responsive layout
  const screen = useScreenSize();
  
  // State to hold UI data
  const [playerHealth, setPlayerHealth] = useState<Health>({ current: 100, max: 100 });
  const [score, setScore] = useState(0);
  const [dysonHealth, setDysonHealth] = useState({ 
    shieldPercentage: 100, 
    healthPercentage: 100 
  });
  const [enemiesRemaining, setEnemiesRemaining] = useState({ current: 0, total: 0 });
  const [currentWave, setCurrentWave] = useState(0); // Start at 0, update from WaveInfo
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
  const [alertMessages, setAlertMessages] = useState<string[]>([]); // Log for CommsDisplay
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
  
  // Use a ref to track processed messages for the log
  const processedMessagesLogRef = useRef<Set<string>>(new Set());
  
  // State and ref for current alerts
  const [currentObjective, setCurrentObjective] = useState<string | null>(null);
  const [currentTempAlert, setCurrentTempAlert] = useState<string | null>(null);
  const alertTimeoutRef = useRef<number | null>(null); // CHANGED: NodeJS.Timeout to number
  
  // --- Boost Bar Smoothing ---
  // Ref to store the actual current values being interpolated for display
  const currentBoostDataRef = useRef({ active: false, remaining: 1.0, cooldown: 0, maxTime: 1.0 });
  // Ref to store the latest target values received from GameState
  const targetBoostDataRef = useRef({ active: false, remaining: 1.0, cooldown: 0, maxTime: 1.0 });
  // State variable to trigger re-renders with the smoothed data
  const [displayedBoostData, setDisplayedBoostData] = useState({ active: false, remaining: 1.0, cooldown: 0, maxTime: 1.0 });
  // Previous boostReady state to avoid unnecessary updates
  const boostReadyRef = useRef(true); 
  // State for boost ready indicator (less critical for smoothing)
  const [boostReady, setBoostReady] = useState(true); 
  // --- End Boost Bar Smoothing ---
  
  // Update UI data from ECS world
  useEffect(() => {
    let lastRender = performance.now();
    let animationFrameId: number | null = null; // Store animation frame ID
    
    // This is our "render" function that runs on each animation frame
    const updateHUD = (timestamp: number) => {
      // Calculate delta time in seconds
      const deltaTime = Math.min(0.1, (timestamp - lastRender) / 1000); // Cap delta time
      lastRender = timestamp;
      
      const hudEntities = world.getEntitiesWith(['UIDisplay']);
      // Use requestAnimationFrame for the next update even if we return early
      if (hudEntities.length === 0) return requestAnimationFrame(updateHUD);
      
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
      
      // --- Handle Messages ---
      const messageDisplay = world.getComponent<MessageDisplay>(hudEntity, 'MessageDisplay');
      const newMessage = messageDisplay?.message;
      const messageIsActive = messageDisplay && messageDisplay.timeRemaining > 0;
      
      if (messageIsActive && newMessage) {
        // Add to log if new
        if (!processedMessagesLogRef.current.has(newMessage)) {
          processedMessagesLogRef.current.add(newMessage);
          // Append to keep chronological order in log - don't filter here to maintain full history
          setAlertMessages(prev => [...prev, newMessage]);
        }
        
        // Handle displaying the message based on type
        if (newMessage.includes('OBJECTIVE:')) {
          // Set objective if it's different from the current one
          if (newMessage !== currentObjective) {
             setCurrentObjective(newMessage);
             // Clear any temporary alert that might be showing
             if (currentTempAlert) setCurrentTempAlert(null);
             if (alertTimeoutRef.current) {
                 clearTimeout(alertTimeoutRef.current);
                 alertTimeoutRef.current = null;
             }
          }
        } else if (!newMessage.includes('WAVE')) { // Handle non-objective, non-wave alerts
          // Show as temp alert if it's different from the current one
          // Only show temp alert if no objective is currently displayed? Or show both? Show both.
          if (newMessage !== currentTempAlert) {
            setCurrentTempAlert(newMessage);
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
            alertTimeoutRef.current = setTimeout(() => {
              setCurrentTempAlert(null);
              alertTimeoutRef.current = null;
            }, 3000); // Show for 3 seconds
          }
        }
      }
      // Note: We don't explicitly clear currentObjective here. It persists until replaced or game reset.
      // Temp alerts clear themselves via timeout.
      
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
        const newGameState = gameStateDisplay.currentState;
        // Update local state only if it differs to avoid unnecessary re-renders
        if (newGameState !== gameState) {
          setGameState(newGameState);

          // --- NEW: Fetch final stats from GameStateManager on game over transition --- 
          if (newGameState === 'game_over') {
            const finalState = gameStateManager.getState();
            setGameOverStats({
              finalScore: finalState.score,
              enemiesDefeated: finalState.enemiesDefeated,
              wavesCompleted: finalState.wavesCompleted,
              survivalTime: 0 // Calculate this? Or get from state if needed.
              // Note: Survival time was previously calculated in HUDSystem.
              // If needed, it should be added to GameState and calculated/updated
              // perhaps in Game.ts during the update loop, or kept in HUDSystem 
              // just for the GameOverStats component (less ideal).
              // For now, setting to 0 as it wasn't part of the initial problem.
            });
            console.log("[HUD] Game Over state detected. Final stats fetched:", finalState);
          }
          // --- End NEW --- 
        }
      }
      
      // Update reticle
      const reticleComponent = world.getComponent<Reticle>(hudEntity, 'Reticle');
      if (reticleComponent) {
        // Simple comparison check to avoid object state update if unchanged
        if (JSON.stringify(reticleComponent) !== JSON.stringify(reticle)) {
          setReticle(reticleComponent);
        }
      }
      
      // Update boost state from game state - Get Target Values
      const worldGameState = world.getGameState();
      if (worldGameState) {
        targetBoostDataRef.current = {
          active: worldGameState.boostActive,
          remaining: worldGameState.boostRemaining,
          cooldown: worldGameState.boostCooldown,
          maxTime: 1.0 // Assuming constant
        };
      }
      
      // Interpolate current boost values towards the target
      const target = targetBoostDataRef.current; // Keep target ref

      let needsUpdate = false;
      const tolerance = 0.001;

      // --- V4 Fix: Use existing worldGameState, Correct Scope --- 
      
      // Get the latest game state (Ensure worldGameState is accessible here, declared earlier)
      if (worldGameState) { // worldGameState should already be defined from earlier in updateHUD
        targetBoostDataRef.current = {
          active: worldGameState.boostActive,
          remaining: worldGameState.boostRemaining,
          cooldown: worldGameState.boostCooldown,
          maxTime: 1.0 // Assuming constant
        };
      }
      
      // Determine the values to display in *this* frame
      let displayActive = target.active;
      let displayRemaining = target.remaining;
      let displayCooldown = target.cooldown;
      
      // Apply interpolation ONLY where needed (currently just for cooldown visual smoothing)
      // We still need the previous displayed value for this calculation
      const previousCooldown = displayedBoostData.cooldown; 
      
      if (target.cooldown > 0) {
          // Only interpolate if the target is actively cooling down
          const lerpFactor = 1.0 - Math.exp(-deltaTime * 15); // Adjust factor as needed
          const interpolatedCooldown = previousCooldown + (target.cooldown - previousCooldown) * lerpFactor;
          // Use the interpolated value, but clamp it between 0 and target
          // (Don't let visual interpolation go below the actual target cooldown)
          displayCooldown = Math.max(target.cooldown, Math.max(0, interpolatedCooldown)); 
      } else {
          // Snap cooldown to 0 if target is 0
          displayCooldown = 0;
      }

      // --- NO Interpolation for Remaining or Active for now --- 
      // displayRemaining and displayActive directly reflect the target state.

      // Check if the calculated display values differ from the current state
      if (
        displayActive !== displayedBoostData.active ||
        Math.abs(displayRemaining - displayedBoostData.remaining) > tolerance ||
        Math.abs(displayCooldown - displayedBoostData.cooldown) > tolerance
      ) {
        needsUpdate = true;
      }
      // --- End V4 Logic ---

      // Update the React state used for rendering ONLY if needed
      if (needsUpdate) {
         setDisplayedBoostData({ 
            active: displayActive,
            remaining: displayRemaining,
            cooldown: displayCooldown, // Use the (potentially interpolated) cooldown
            maxTime: target.maxTime 
         }); 
      }

      // Update boostReady state (based on target state for accuracy)
      const ready = target.cooldown <= 0 && target.remaining > 0;
      if (ready !== boostReadyRef.current) {
          boostReadyRef.current = ready;
          setBoostReady(ready);
      }
      
      // Update wave information
      const waveEntities = world.getEntitiesWith(['WaveInfo']);
      if (waveEntities.length > 0) {
        const waveInfo = world.getComponent<WaveInfo>(waveEntities[0], 'WaveInfo');
        if (waveInfo) {
          // Update states only if they change
          if (waveInfo.currentWave !== currentWave) setCurrentWave(waveInfo.currentWave);
          const newEnemiesRemaining = {
            current: waveInfo.enemiesRemaining,
            total: waveInfo.totalEnemies + waveInfo.enemiesRemaining
          };
          if (JSON.stringify(newEnemiesRemaining) !== JSON.stringify(enemiesRemaining)) {
            setEnemiesRemaining(newEnemiesRemaining);
          }
          
          // Simple approach: only show countdown when wave is not active and timer > 0
          if (!waveInfo.isActive && waveInfo.nextWaveTimer > 0) {
            // Update countdown
            const newWaveCountdown = Math.ceil(waveInfo.nextWaveTimer);
            if (newWaveCountdown !== waveCountdown) {
              setWaveCountdown(newWaveCountdown);
            }
            // Set wave complete flag
            if (waveInfo.currentWave > 0 && !waveComplete) {
              setWaveComplete(true);
            }
          } else {
            // Clear countdown when wave is active or timer is 0
            if (waveCountdown !== null) {
              setWaveCountdown(null);
            }
            if (waveComplete) {
              setWaveComplete(false);
            }
          }
        }
      } else {
        // Reset wave info if component is gone
        if (waveCountdown !== null) setWaveCountdown(null);
        if (waveComplete) setWaveComplete(false);
        if (enemiesRemaining.current !== 0 || enemiesRemaining.total !== 0) {
          setEnemiesRemaining({ current: 0, total: 0 });
        }
      }
      
      // Update floating scores if camera is available
      if (camera) {
        const scoreEntities = world.getEntitiesWith(['FloatingScore', 'Position', 'ScreenPosition']);
        
        const newFloatingScores = scoreEntities.map(entity => {
          const scoreComp = world.getComponent<FloatingScore>(entity, 'FloatingScore');
          const screenPosComp = world.getComponent<ScreenPosition>(entity, 'ScreenPosition'); // Get screen position
          
          // Ensure components exist and the position is valid (isOnScreen)
          if (!scoreComp || !screenPosComp || !screenPosComp.isOnScreen) return null;
          
          return {
            id: entity,
            value: scoreComp.value,
            position: { x: screenPosComp.x, y: screenPosComp.y }, // Use directly from component
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
        
        // Update state if changed
        if (JSON.stringify(newFloatingScores) !== JSON.stringify(floatingScores)) {
            setFloatingScores(newFloatingScores);
        }
      }
      
      // Update radar data
      const radarComponent = world.getComponent<Radar>(hudEntity, 'Radar');
      if (radarComponent) {
         // Check before setting state
         if (JSON.stringify(radarComponent) !== JSON.stringify(radarData)) {
             setRadarData({ // Assuming Radar component structure matches state
               active: radarComponent.active,
               trackedEntities: radarComponent.trackedEntities
             });
         }
      }
      
      // Update shield bars if camera is available
      if (camera) {
        const shieldBarEntities = world.getEntitiesWith(['ShieldBarComponent', 'Position', 'ScreenPosition']);
        
        const newShieldBars = shieldBarEntities.map(entity => {
          const shieldBarComp = world.getComponent<ShieldBarComponent>(entity, 'ShieldBarComponent');
          const screenPosComp = world.getComponent<ScreenPosition>(entity, 'ScreenPosition'); // Get screen position
          
          // Don't need Position directly anymore, but check ShieldBarComponent exists and is visible
          if (!shieldBarComp || !shieldBarComp.visible || !screenPosComp || !screenPosComp.isOnScreen) return null;
          
          // Get the shield component to determine fill percentage
          const shieldComp = world.getComponent<ShieldComponent>(shieldBarComp.entity, 'ShieldComponent');
          if (!shieldComp) return null;
          
          // Position comes from ScreenPosition component
          const percent = (shieldComp.currentShield / shieldComp.maxShield) * 100;
          
          // ADDED LOGGING: Check the offsetY value being read
          // console.log(`[HUD ShieldBar] Entity ${entity}: Reading offsetY: ${shieldBarComp?.offsetY}, screenY: ${screenPosComp?.y}`);
          
          return {
            id: entity,
            // Apply offset directly to the pre-calculated screen Y coordinate
            position: { x: screenPosComp.x, y: screenPosComp.y + shieldBarComp.offsetY },
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
        
        // Update state if changed
        // REMOVED Conditional Check: Always update state to reflect current query
        // if (newShieldBars.length !== shieldBars.length || JSON.stringify(newShieldBars) !== JSON.stringify(shieldBars)) {
             setShieldBars(newShieldBars);
        // }
        
        // Update health bars
        const healthBarEntities = world.getEntitiesWith(['HealthBarComponent', 'Position', 'ScreenPosition']);
        
        const newHealthBars = healthBarEntities.map(entity => {
          const healthBarComp = world.getComponent<HealthBarComponent>(entity, 'HealthBarComponent');
          const screenPosComp = world.getComponent<ScreenPosition>(entity, 'ScreenPosition'); // Get screen position
          
          // Check HealthBarComponent exists and is visible
          if (!healthBarComp || !healthBarComp.visible || !screenPosComp || !screenPosComp.isOnScreen) return null;
          
          // Get the health component to determine fill percentage
          const healthComp = world.getComponent<Health>(healthBarComp.entity, 'Health');
          if (!healthComp) return null;
          
          // Check if health bar should be shown only when damaged
          if (healthBarComp.showWhenDamaged && healthComp.current >= healthComp.max) return null;

          // Position comes from ScreenPosition component
          const percent = (healthComp.current / healthComp.max) * 100;
          
          // ADDED LOGGING: Check the offsetY value being read
          // console.log(`[HUD HealthBar] Entity ${entity}: Reading offsetY: ${healthBarComp?.offsetY}, screenY: ${screenPosComp?.y}`);
          
          return {
            id: entity,
            // Apply offset directly to the pre-calculated screen Y coordinate
            position: { x: screenPosComp.x, y: screenPosComp.y + healthBarComp.offsetY }, 
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
        
        // Update state if changed
        // REMOVED Conditional Check: Always update state to reflect current query
        // if (newHealthBars.length !== healthBars.length || JSON.stringify(newHealthBars) !== JSON.stringify(healthBars)) {
            setHealthBars(newHealthBars);
        // }
      }
      
      // Request next frame update
      animationFrameId = requestAnimationFrame(updateHUD);
    };
    
    // Start the update loop
    animationFrameId = requestAnimationFrame(updateHUD);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Clear alert timeout on unmount
      if (alertTimeoutRef.current) {
         clearTimeout(alertTimeoutRef.current);
      }
    };
    // Dependencies: world, camera. Other states are updated internally based on these.
  }, [world, camera]); // Keep dependencies minimal
  
  // Effect to clear alerts and logs on game state reset
  useEffect(() => {
    if (gameState === 'not_started' || gameState === 'game_over') {
      setAlertMessages([]);
      processedMessagesLogRef.current.clear();
      setCurrentObjective(null);
      setCurrentTempAlert(null);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
      // Reset wave info specific to active gameplay?
      // setWaveCountdown(null); // This should be handled by WaveInfo component absence
      // setWaveComplete(false);
      // Reset score? No, keep for game over screen.
    }
  }, [gameState]);
  
  // Convert hex color to CSS color format
  const hexToCSS = (hexColor: number): string => {
    return `#${hexColor.toString(16).padStart(6, '0')}`;
  };
  
  // Calculate player health percentage
  const playerHealthPercentage = playerHealth.max > 0 ? (playerHealth.current / playerHealth.max) * 100 : 0;
  
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
    console.log('[HUD] Pause game triggered, current gameState:', gameState);
    
    // Force update the local gameState to ensure UI updates
    setGameState('paused');
    
    // Call the prop function passed from the parent
    onPauseGame();
    
    // Force exit pointer lock to ensure UI is accessible
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  const handleResumeGame = () => {
    console.log('[HUD] Resume game triggered, current gameState:', gameState);
    
    // Force update the local state first
    setGameState('playing');
    
    // Call the parent handler
    onResumeGame();
  };
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Only respond to Escape key when actually playing the game
        if (gameState === 'playing') {
          // Call the parent handler directly to ensure we update the game state
          onPauseGame();
          // Also immediately update local state for quick UI response
          setGameState('paused');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, onPauseGame]); // Add onPauseGame to dependencies
  
  // Add pointerlock change event listener
  useEffect(() => {
    // Only add this listener when in playing state
    if (gameState !== 'playing') return;
    
    const handlePointerLockChange = () => {
      // Check if pointer lock was exited
      if (document.pointerLockElement === null && gameState === 'playing') {
        // Pause the game when pointer lock is exited
        onPauseGame();
        // Update local state immediately
        setGameState('paused');
      }
    };
    
    // Add pointer lock change listener
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gameState, onPauseGame]);
  
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
  }, [gameState]); // Dependency is correct
  
  // Add effect to force-clear the countdown
  useEffect(() => {
    // If countdown reaches 1, force clear it after a short delay
    if (waveCountdown === 1) {
      const timerId = setTimeout(() => {
        setWaveCountdown(null);
      }, 1000); // Clear after 1 second
      
      return () => clearTimeout(timerId);
    }
  }, [waveCountdown]);
  
  // Add effect to show objective message after wave countdown finishes
  useEffect(() => {
    // When wave countdown reaches 1, queue up the objective message after a short delay
    if (waveCountdown === 1) {
      const timerId = setTimeout(() => {
        // Add the objective message if it doesn't exist yet
        const objectiveMessage = "OBJECTIVE: DEFEND THE DYSON SPHERE";
        if (!processedMessagesLogRef.current.has(objectiveMessage)) {
          processedMessagesLogRef.current.add(objectiveMessage);
          setAlertMessages(prev => [...prev, objectiveMessage]);
          setCurrentObjective(objectiveMessage);
        }
      }, 2000); // Show after 2 seconds (after countdown disappears)
      
      return () => clearTimeout(timerId);
    }
  }, [waveCountdown]);
  
  // Add effect to ensure that state changes from Game are reflected correctly
  useEffect(() => {
    // This effect is for when the game state needs to be manually synced
    // with the Game component state (for example, after a reset)
    const syncGameState = () => {
      const hudEntities = world.getEntitiesWith(['UIDisplay', 'GameStateDisplay']);
      if (hudEntities.length === 0) return;
      
      const hudEntity = hudEntities[0];
      const gameStateDisplay = world.getComponent<GameStateDisplay>(hudEntity, 'GameStateDisplay');
      
      if (gameStateDisplay && gameStateDisplay.currentState !== gameState) {
        setGameState(gameStateDisplay.currentState);
      }
    };
    
    // Check on mount and whenever world changes
    syncGameState();
    
    // Set up an interval to periodically check and sync the state
    const intervalId = setInterval(syncGameState, 100); // Check every 100ms
    
    return () => {
      clearInterval(intervalId);
    };
  }, [world, gameState]);

  // Add a dedicated handler for exit game
  const handleExitGame = () => {
    // First call the parent handler to reset the game
    onExitGame();
    
    // Force update local state after a small delay to ensure Game.reset() has time to complete
    setTimeout(() => {
      // This direct state update ensures the HUD component immediately renders the start screen
      setGameState('not_started');
      
      // Clear any old game data
      setScore(0);
      setAlertMessages([]);
      processedMessagesLogRef.current.clear();
      setCurrentObjective(null);
      setCurrentTempAlert(null);
      
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    }, 50); // Small delay to let Game.reset() complete its work
  };
  
  // --- Render Logic ---
  if (gameState === 'not_started') {
    return <StartScreen onStartGame={onStartGame} />;
  }
  if (gameState === 'game_over') {
    // Pass the final wave number captured by HUDSystem directly
    return <GameOverScreen stats={gameOverStats} onRestart={onRestartGame} />;
  }
  if (gameState === 'paused') {
    return (
      <PauseScreen
        onResume={handleResumeGame}
        onRestart={onRestartGame}
        onExit={handleExitGame}
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
      
      {/* Floating score numbers */}
      {floatingScores.map(score => (
        <div
          key={score.id}
          className="floating-score"
          style={{
            position: 'absolute',
            top: `${score.position.y}px`,
            left: `${score.position.x}px`,
            color: score.color,
            opacity: score.opacity,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '0 0 5px rgba(0,0,0,0.7)',
            zIndex: 500,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
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
      
      {/* --- NEW: Comms Log Display --- */}
      {/* Render CommsDisplay, passing the collected alertMessages */}
      {/* Moved to bottom left */}
      
      {/* Top Right Radar (as before, Wave display added back below) */}
      {/* Moved to bottom right */}
      
      {/* Player HUD - Bottom (Adjusted Layout) */}
      <div className="ship-console" style={{
        position: 'absolute',
        bottom: '5px', // Changed from 0px to 5px to raise the console
        left: '0',
        right: '0',
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'flex-end',
        zIndex: 10,
        pointerEvents: 'none',
        flexDirection: screen.isMobile ? 'column' : 'row',
        transform: damageEffect.active ? getShakeTransform() : 'none'
      }}>

        {/* Left Side - Comms Display */}
        {!screen.isMobile && (
          <div style={{ 
            alignSelf: 'flex-end',
            marginBottom: '0',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end'
          }}>
            {/* Wave Information */}
            <div style={{ 
              marginRight: '10px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
              paddingBottom: '20px'
            }}>
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#00ffff', 
                fontFamily: "'Press Start 2P', monospace", 
                textShadow: '1px 1px 1px #000' 
              }}>
                WAVE: {currentWave > 0 ? currentWave : '-'}
              </div>
            </div>
            <CommsDisplay 
              messages={alertMessages} 
              waveCountdown={waveCountdown}
              currentWave={currentWave}
            />
          </div>
        )}

        {/* Center Panel - Ship Status */}
        <div className="console-panel retro-text" style={{
          width: screen.isMobile ? '100%' : '30%',
          height: screen.isMobile ? '120px' : '180px',
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
          {/* ... (Internal content of the Ship Status panel remains exactly the same) ... */}
          <div style={{ borderBottom: '1px solid #ff00ff', paddingBottom: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ff00ff', fontSize: '0.7rem' }}>SYSTEMS</span>
            <span style={{ color: hullStatus.color, fontSize: '0.6rem', animation: hullStatus.text === 'CRITICAL' ? 'alertBlink 0.5s infinite alternate' : 'none' }}>{hullStatus.text}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: '1' }}>
            {/* Left Column: Ship Systems */}
            <div style={{ flex: '1', marginRight: '8px', display: 'flex', flexDirection: 'column' }}>
              {/* Ship Systems Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', height: '35px' }}> {/* Added fixed height */}
                <Hologram modelType="ship" size={35} color="#00aaff" gameIsActive={gameState === 'playing'} />
                <span style={{ color: '#ff00ff', fontSize: '0.65rem', fontWeight: 'bold' }}>SHIP</span>
              </div>
              {/* Dotted line */}
              <div style={{ width: '90%', borderBottom: '1px dotted rgba(255, 0, 255, 0.5)', marginBottom: '8px' }}></div>
              {/* Boost System */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#00ffff', marginBottom: '5px', fontSize: '0.6rem', height: '14px' }}>BOOST SYSTEM:</div> {/* Added fixed height */}
                <div style={{ width: '100%', height: '16px', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #555555', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
                  {/* Boost Bar Fill - Width uses smoothed state, Color uses target ref */}
                  <div style={{
                    // Width uses displayedBoostData for smooth cooldown transition
                    width: displayedBoostData.cooldown > 0 
                      ? `${(1 - displayedBoostData.cooldown / 3.0) * 100}%` 
                      : `${Math.max(0, (displayedBoostData.remaining / displayedBoostData.maxTime) * 100)}%`, 
                    height: '100%',
                    // Color logic uses targetBoostDataRef.current for instant feedback
                    background: targetBoostDataRef.current.cooldown > 0 
                        ? 'linear-gradient(90deg, #330066, #660066)' // Charging Purple
                        : (targetBoostDataRef.current.active 
                            ? 'linear-gradient(90deg, #ff00ff, #00ffff)' // Active Cyan/Magenta
                            : 'linear-gradient(90deg, #00ffff, #ff00ff)'), // Ready Magenta/Cyan
                    // Shadow uses targetBoostDataRef.current for instant feedback
                    boxShadow: targetBoostDataRef.current.active ? '0 0 10px #ff00ff, 0 0 20px #ff00ff' : 'none',
                    transition: 'none', 
                    transform: 'translateZ(0)', 
                    willChange: 'width, background' 
                  }}></div>
                  {/* Boost Bar Text - Text and color use targetBoostDataRef.current */}
                  <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)', 
                      // Use target ref for instant color
                      color: targetBoostDataRef.current.cooldown > 0 ? '#888888' : '#ffffff', 
                      textShadow: '1px 1px 2px #000000', 
                      fontSize: '0.65rem', 
                      fontWeight: 'bold' 
                  }}>
                    {/* Use target ref for instant text */}
                    {targetBoostDataRef.current.cooldown > 0 ? "CHARGING" : targetBoostDataRef.current.active ? "ACTIVE" : "READY"} 
                  </div>
                </div>
              </div>
              {/* Hull Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', color: hullStatus.color, fontSize: '0.6rem', whiteSpace: 'nowrap', height: '14px' }}> {/* Added fixed height */}
                  <span>HULL INTEGRITY:</span>
                </div>
                <div style={{ width: '100%', height: '16px', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #555555', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
                  {/* Hull Bar Fill */}
                  <div style={{ width: `${playerHealthPercentage}%`, height: '100%', background: hullStatus.color, transition: 'width 0.3s ease' }}></div>
                  {/* Hull Bar Text */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '1px 1px 2px #000000', fontSize: '0.65rem', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>
                    {hullStatus.text}
                  </div>
                </div>
              </div>
            </div>
            {/* Vertical Separator */}
            <div style={{ width: '1px', background: 'rgba(255, 0, 255, 0.3)', height: '85%', alignSelf: 'center', margin: '0 4px' }}></div>
            {/* Right Column: Dyson Systems */}
            <div style={{ flex: '1', marginLeft: '8px', display: 'flex', flexDirection: 'column' }}>
              {/* Dyson Systems Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', height: '35px' }}> {/* Added fixed height to match Ship column */}
                <Hologram modelType="dysonSphere" size={35} color="#00aaff" gameIsActive={gameState === 'playing'} /> {/* Changed size from 40 to 35 to match Ship */}
                <span style={{ color: '#ff00ff', fontSize: '0.65rem', fontWeight: 'bold' }}>DYSON SPHERE</span>
              </div>
              {/* Dotted line */}
              <div style={{ width: '90%', borderBottom: '1px dotted rgba(255, 0, 255, 0.5)', marginBottom: '8px' }}></div>
              {/* Dyson Shield Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: dysonHealth.shieldPercentage > 70 ? '#21a9f3' : dysonHealth.shieldPercentage > 30 ? '#FFC107' : '#F44336', marginBottom: '5px', fontSize: '0.6rem', height: '14px' }}>DYSON SHIELD:</div> {/* Added fixed height */}
                <div style={{ width: '100%', height: '16px', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #555555', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
                  {/* Shield Bar Fill */}
                  <div style={{ width: `${dysonHealth.shieldPercentage}%`, height: '100%', background: dysonHealth.shieldPercentage > 70 ? 'linear-gradient(90deg, #2196F3, #64B5F6)' : dysonHealth.shieldPercentage > 30 ? 'linear-gradient(90deg, #FFC107, #FFD54F)' : 'linear-gradient(90deg, #F44336, #E57373)', transition: 'width 0.3s ease' }}></div>
                  {/* Shield Bar Text */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '1px 1px 2px #000000', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    {Math.round(dysonHealth.shieldPercentage)}%
                  </div>
                </div>
              </div>
              {/* Dyson Core Status */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: dysonHealth.healthPercentage > 70 ? '#4CAF50' : dysonHealth.healthPercentage > 30 ? '#FFC107' : '#F44336', marginBottom: '5px', fontSize: '0.6rem', height: '14px' }}>DYSON CORE:</div> {/* Added fixed height */}
                <div style={{ width: '100%', height: '16px', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #555555', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 8px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(0, 0, 0, 0.5)', position: 'relative' }}>
                  {/* Core Bar Fill */}
                  <div style={{ width: `${dysonHealth.healthPercentage}%`, height: '100%', background: dysonHealth.healthPercentage > 70 ? 'linear-gradient(90deg, #4CAF50, #81C784)' : dysonHealth.healthPercentage > 30 ? 'linear-gradient(90deg, #FFC107, #FFD54F)' : 'linear-gradient(90deg, #F44336, #E57373)', transition: 'width 0.3s ease', animation: dysonHealth.healthPercentage < 30 ? 'alertBlinkBackground 0.5s infinite alternate' : 'none' }}></div>
                  {/* Core Bar Text */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ffffff', textShadow: '1px 1px 2px #000000', fontSize: '0.65rem', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>
                    {dysonHealth.healthPercentage > 70 ? 'STABLE' : dysonHealth.healthPercentage > 30 ? 'WARNING' : 'CRITICAL'}
                  </div>
                </div>
              </div>
            </div> {/* End Right Column */}
          </div> {/* End Columns Container */}
          {/* Ship information */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #555555', paddingTop: '8px', color: '#bbbbbb', fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
            <div>CLASS: DEFENDER</div>
            <div>ID: DSP-117</div>
          </div>
        </div>

        {/* Right Side - Radar Display */}
        {!screen.isMobile && (
          <div style={{ 
            alignSelf: 'flex-end',
            marginBottom: '0',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end'
          }}>
            <RadarDisplay radarData={radarData} radarVisualRadius={82} />
            
            {/* Threats Information - moved to right of radar */}
            <div style={{ 
              marginLeft: '10px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
              paddingBottom: '20px'
            }}>
              <div style={{ 
                fontSize: '0.7rem', 
                color: radarData.trackedEntities.filter(e => e.entityType !== 'dysonSphere').length > 0 ? '#ff5555' : '#44ff44', 
                fontFamily: "'Press Start 2P', monospace", 
                textShadow: '1px 1px 1px #000' 
              }}>
                THREATS: {radarData.trackedEntities.filter(e => e.entityType !== 'dysonSphere').length}
              </div>
            </div>
          </div>
        )}
      </div> {/* End ship-console */}
      
      {/* --- NEW: Comms Log Display --- */}
      {/* Render CommsDisplay, passing the collected alertMessages */}
      {/* Moved to bottom left */}
      
      {/* Top Right Radar (as before, Wave display added back below) */}
      {/* Moved to bottom right */}
    </>
  );
};

export default HUD;
