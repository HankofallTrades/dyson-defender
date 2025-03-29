import React, { useEffect, useRef } from 'react';
import nipplejs, { JoystickData } from 'nipplejs';
import { InputManager } from '../core/input/InputManager';
import styled from '@emotion/styled';

const MobileControlsContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 1000;
`;

const JoystickZone = styled.div`
  position: absolute;
  left: 40px;
  bottom: 40px;
  width: 120px;
  height: 120px;
  pointer-events: auto;
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
  pointer-events: auto;
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

  useEffect(() => {
    if (!joystickZoneRef.current) return;

    const nipple = nipplejs({
      zone: joystickZoneRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'white',
      size: 100,
    });

    const joystick = nipple.get(0);

    joystick.on('move', (data: JoystickData) => {
      const force = Math.min(data.force / 50, 1); // Normalize force
      const angle = data.angle.radian;
      
      // Convert polar coordinates to cartesian
      const x = Math.cos(angle) * force;
      const y = -Math.sin(angle) * force; // Negate y because screen coordinates are inverted
      
      inputManager.updateJoystick(x, y, force);
    });

    joystick.on('end', () => {
      inputManager.resetJoystick();
    });

    return () => {
      nipple.destroy();
    };
  }, []);

  const handleFireStart = () => {
    inputManager.setMobileFiring(true);
  };

  const handleFireEnd = () => {
    inputManager.setMobileFiring(false);
  };

  return (
    <MobileControlsContainer>
      <JoystickZone ref={joystickZoneRef} />
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