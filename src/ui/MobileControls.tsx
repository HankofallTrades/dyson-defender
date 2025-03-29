import React, { useRef, useEffect } from 'react';
import { JoystickStateHolder } from '../core/input/JoystickStateHolder';
import styled from '@emotion/styled';
import { InputManager } from '../core/input/InputManager';
import nipplejs, { EventData, JoystickManager } from 'nipplejs';

// Make sure nipplejs types are available globally if using CDN
declare global {
  interface Window {
    nipplejs: any;
  }
}

interface JoystickEventData {
  angle: {
    radian: number;
  };
  force: number;
  vector: {
    x: number;
    y: number;
  };
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
  const joystickRef = useRef<any>(null);
  const joystickStateHolder = JoystickStateHolder.getInstance(); // Get the singleton instance for joystick state
  const inputManager = InputManager.getInstance(document.body); // Get InputManager instance for firing

  useEffect(() => {
    if (!joystickZoneRef.current) return;
    if (joystickRef.current) return; // Prevent double initialization

    // Check if nipplejs is loaded
    if (!window.nipplejs) {
      console.error('nipplejs not loaded!');
      return;
    }

    try {
      const manager = window.nipplejs.create({
        zone: joystickZoneRef.current,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "white",
        size: 100,
        threshold: 0.05,
        fadeTime: 100,
        multitouch: false
      });
      
      joystickRef.current = manager;

      manager.on('move', (_: Event, data: JoystickEventData) => {
        if (!data || !data.vector || !data.force) return;

        const angle = data.angle.radian;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        const force = Math.min(data.force / 5, 1);

        JoystickStateHolder.getInstance().update(x, y, force);
      });

      manager.on('end', () => {
        joystickStateHolder.reset();
      });
    } catch (error) {
      console.error('Failed to initialize joystick:', error);
    }

    // Cleanup function
    return () => {
      if (joystickRef.current) {
        joystickRef.current.destroy();
        joystickRef.current = null;
      }
    };
  }, [joystickStateHolder]); // Add joystickStateHolder to dependencies

  const handleFireStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    inputManager.setMobileFiring(true); // Use InputManager for firing
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputManager.setMobileFiring(false); // Use InputManager for firing
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