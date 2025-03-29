import React, { useRef, useEffect } from 'react';
import { JoystickStateHolder } from '../core/input/JoystickStateHolder';
import { AimingJoystickStateHolder } from '../core/input/AimingJoystickStateHolder';
import styled from '@emotion/styled';
import { InputManager } from '../core/input/InputManager';
import nipplejs, { EventData, JoystickManager } from 'nipplejs';

// Make sure nipplejs types are available globally if using CDN
declare global {
  interface Window {
    nipplejs: any;
  }
}

// Define a more specific type for the event data we care about
interface NippleEventData extends EventData {
  angle: {
    radian: number;
  };
  force: number;
  vector: {
    x: number;
    y: number;
  };
  // Add other properties if needed, based on nipplejs documentation
}

// Type for the JoystickManager instance (adjust if methods are incorrect)
// It seems the default 'JoystickManager' type might be incomplete or incorrect
interface NippleJoystickManager {
  on: (event: string, listener: (evt: EventData, data: NippleEventData) => void) => void;
  destroy: () => void;
  // Add other methods/properties if needed
}

const MobileControlsContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: all;
  z-index: 1000;
  touch-action: none;
`;

const JoystickZone = styled.div`
  position: absolute;
  left: 5vmin;
  bottom: 5vmin;
  width: 25vmin;
  height: 25vmin;
  pointer-events: all;
  touch-action: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 9999;
`;

const AimingJoystickZone = styled.div`
  position: absolute;
  right: 5vmin;
  bottom: 5vmin;
  width: 25vmin;
  height: 25vmin;
  pointer-events: all;
  touch-action: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 9999;
`;

// Added Boost Button - Positioned above aiming joystick
const BoostButton = styled.div`
  position: absolute;
  right: 32vmin;
  bottom: 5vmin;
  width: 9vmin;
  height: 9vmin;
  background: rgba(0, 100, 255, 0.3);
  border: 2px solid rgba(0, 100, 255, 0.5);
  border-radius: 50%;
  pointer-events: all;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  user-select: none;
  z-index: 9999;

  &:active {
    background: rgba(0, 100, 255, 0.5);
  }
`;

const FireButton = styled.div`
  position: absolute;
  right: 5vmin;
  bottom: 32vmin;
  width: 10vmin;
  height: 10vmin;
  background: rgba(255, 0, 0, 0.3);
  border: 2px solid rgba(255, 0, 0, 0.5);
  border-radius: 50%;
  pointer-events: all;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  user-select: none;
  
  &:active {
    background: rgba(255, 0, 0, 0.5);
  }
`;

export const MobileControls: React.FC = () => {
  const joystickZoneRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<any>(null);
  const aimingJoystickZoneRef = useRef<HTMLDivElement>(null);
  const aimingJoystickRef = useRef<any>(null);
  const joystickStateHolder = JoystickStateHolder.getInstance();
  const aimingJoystickStateHolder = AimingJoystickStateHolder.getInstance();
  const inputManager = InputManager.getInstance(document.body);

  useEffect(() => {
    if (!joystickZoneRef.current || !aimingJoystickZoneRef.current) return;
    if (joystickRef.current || aimingJoystickRef.current) return;

    if (!window.nipplejs) {
      console.error('nipplejs not loaded!');
      return;
    }

    let movementManager: NippleJoystickManager | null = null;
    let aimingManager: NippleJoystickManager | null = null;

    try {
      movementManager = window.nipplejs.create({
        zone: joystickZoneRef.current,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "white",
        size: 100,
        threshold: 0.05,
        fadeTime: 100,
        multitouch: true,
        dataOnly: false,
        restJoystick: true,
        restOpacity: 0.5,
      });
      
      joystickRef.current = movementManager;

      if (movementManager) {
        movementManager.on('move', (_: EventData, data: NippleEventData) => {
          if (!data || !data.vector || typeof data.force !== 'number') return;

          const angle = data.angle.radian;
          const x = Math.cos(angle);
          const y = Math.sin(angle);
          const force = Math.min(data.force / 5, 1);

          joystickStateHolder.update(x, y, force);
        });

        movementManager.on('end', () => {
          joystickStateHolder.reset();
        });
      } else {
        console.error('Failed to create movement joystick manager.');
      }

      aimingManager = window.nipplejs.create({
        zone: aimingJoystickZoneRef.current,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "red",
        size: 100,
        threshold: 0.01,
        fadeTime: 100,
        multitouch: true,
        dataOnly: false,
        restJoystick: true,
        restOpacity: 0.5,
      });

      aimingJoystickRef.current = aimingManager;

      if (aimingManager) {
        aimingManager.on('move', (_: EventData, data: NippleEventData) => {
          if (!data || !data.vector || typeof data.force !== 'number') return;
          
          const angle = data.angle.radian;
          const x = Math.cos(angle);
          const y = Math.sin(angle);
          const force = Math.min(data.force / 5, 1);

          aimingJoystickStateHolder.update(x, y, force);
        });

        aimingManager.on('end', () => {
          aimingJoystickStateHolder.reset();
        });
      } else {
        console.error('Failed to create aiming joystick manager.');
      }

    } catch (error) {
      console.error('Failed to initialize one or both joysticks:', error);
    }

    return () => {
      if (joystickRef.current) {
        joystickRef.current.destroy();
        joystickRef.current = null;
      }
      if (aimingJoystickRef.current) {
        aimingJoystickRef.current.destroy();
        aimingJoystickRef.current = null;
      }
    };
  }, []);

  const handleFireStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    inputManager.setMobileFiring(true);
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.setMobileFiring(false);
  };

  // Added handlers for Boost button
  const handleBoostStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.vibrate) {
      navigator.vibrate(30); // Shorter vibration for boost?
    }
    inputManager.setMobileBoosting(true); // This method needs to be added to InputManager
  };

  const handleBoostEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.setMobileBoosting(false); // This method needs to be added to InputManager
  };

  return (
    <MobileControlsContainer>
      <JoystickZone 
        ref={joystickZoneRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />
      <AimingJoystickZone
        ref={aimingJoystickZoneRef}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />
      <FireButton
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        onTouchCancel={handleFireEnd}
      >
        FIRE
      </FireButton>
      {/* Added Boost Button */}
      <BoostButton
        onTouchStart={handleBoostStart}
        onTouchEnd={handleBoostEnd}
        onTouchCancel={handleBoostEnd}
      >
        BOOST
      </BoostButton>
    </MobileControlsContainer>
  );
}; 