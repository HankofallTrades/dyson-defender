import React, { useEffect, useRef } from 'react';
import { InputManager } from '../core/input/InputManager';
import styled from '@emotion/styled';

// Define the types for nipplejs
type JoystickEventData = {
  angle: {
    radian: number;
  };
  force: number;
  direction: {
    angle: string;
    x: string;
    y: string;
  };
};

// Define a type for the global nipplejs variable
declare global {
  interface Window {
    nipplejs: {
      create: (options: {
        zone: HTMLElement;
        mode: "static" | "dynamic" | "semi";
        position: { left: string; top: string };
        color: string;
        size: number;
        multitouch?: boolean;
        maxNumberOfNipples?: number;
        dataOnly?: boolean;
        threshold?: number;
        fadeTime?: number;
      }) => {
        on: (event: string, callback: (evt: any, data: JoystickEventData) => void) => void;
        destroy: () => void;
      }
    }
  }
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
  left: 40px;
  bottom: 40px;
  width: 150px;
  height: 150px;
  pointer-events: all;
  touch-action: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 9999;
`;

const FireButton = styled.div`
  position: absolute;
  right: 40px;
  bottom: 40px;
  width: 80px;
  height: 80px;
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
  const inputManager = InputManager.getInstance(document.body);
  const joystickRef = useRef<any>(null);

  useEffect(() => {
    if (!joystickZoneRef.current) return;
    
    try {
      console.log('Initializing joystick...', window.nipplejs);
      
      // Use the global nipplejs variable from the CDN
      const manager = window.nipplejs.create({
        zone: joystickZoneRef.current,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "white",
        size: 100,
        threshold: 0.05,  // Lower threshold for more sensitivity
        fadeTime: 100    // Faster fade time for more responsive feel
      });
      
      joystickRef.current = manager;

      // Attach event handlers with debug logging
      manager.on('start', () => {
        console.log('Joystick start event fired');
      });

      manager.on('move', (evt: any, data: JoystickEventData) => {
        console.log('Joystick move event:', data);
        const force = Math.min(data.force / 50, 1);
        
        // Skip very small movements (dead zone)
        if (force < 0.05) {
          inputManager.resetJoystick();
          return;
        }
        
        // DEBUG LOGGING: Log all raw data from nipplejs
        console.log('Full nipplejs data:', {
          angle: data.angle,
          direction: data.direction,
          force: data.force,
          raw: data
        });
        
        // Use angle instead of directions to allow for diagonal movement
        const angle = data.angle.radian;
        
        // Convert angle to normalized X/Y coordinates
        // 0 = right, π/2 = down, π = left, 3π/2 = up
        const rawX = Math.cos(angle);
        const rawY = Math.sin(angle);
        
        // Y is inverted in nipplejs (up is negative Y)
        // We want up on joystick to mean forward (W key)
        // and down to mean backward (S key)
        const x = rawX * force;
        const y = -rawY * force; // Invert Y so up means forward
        
        console.log(`Joystick movement: angle=${angle.toFixed(2)}, x=${x.toFixed(2)}, y=${y.toFixed(2)}, force=${force.toFixed(2)}`);
        
        // Update InputManager with the mapped coordinates
        inputManager.updateJoystick(x, y, force);
      });

      manager.on('end', () => {
        console.log('Joystick end event fired');
        inputManager.resetJoystick();
      });

      console.log('Joystick initialized successfully');
    } catch (error) {
      console.error('Failed to initialize joystick:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }

    return () => {
      if (joystickRef.current) {
        joystickRef.current.destroy();
        joystickRef.current = null;
      }
    };
  }, []);

  const handleFireStart = (e: React.TouchEvent) => {
    console.log('Fire button touch start');
    e.preventDefault(); // Prevent default touch behavior
    e.stopPropagation(); // Stop event propagation
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    inputManager.setMobileFiring(true);
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    console.log('Fire button touch end');
    e.preventDefault();
    e.stopPropagation();
    inputManager.setMobileFiring(false);
  };

  return (
    <MobileControlsContainer>
      <JoystickZone 
        ref={joystickZoneRef}
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
    </MobileControlsContainer>
  );
}; 