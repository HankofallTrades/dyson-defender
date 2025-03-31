import React from 'react';
// No direct import of Radar component needed here, as the data structure is defined in props
// import { Radar } from '../../core/components'; // Adjust path if needed
import * as THREE from 'three'; // Only if THREE types are used (e.g., Vector3)

interface RadarDisplayProps {
  radarData: {
    active: boolean;
    trackedEntities: Array<{
      entityId: number;
      entityType: string;
      distance: number;
      direction: {
        x: number; // Left/Right relative to player's forward
        y: number; // Vertical difference
        z: number; // Forward/Backward relative to player's forward
      };
      threatLevel: number;
    }>;
  };
  radarVisualRadius?: number; // Configurable visual size
}

const RadarDisplay: React.FC<RadarDisplayProps> = ({ radarData, radarVisualRadius = 82 }) => {
  if (!radarData.active) {
    return null;
  }

  const radarLogicRadius = 250; // Logical detection range

  return (
    <div style={{
      width: '180px', // Increased from 120px
      height: '180px', // Increased from 120px
      borderRadius: '50%',
      border: '2px solid #00ffff',
      boxShadow: 'inset 0 0 15px rgba(0, 255, 255, 0.3)',
      position: 'relative',
      overflow: 'hidden' // Added to contain sweep
    }}>
      {/* Center dot (Player) */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#00ffff', transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 5px #00ffff',
      }}></div>

      {/* Radar grid lines */}
      <div style={{
        position: 'absolute', top: '50%', left: '0', right: '0',
        height: '1px', background: 'rgba(0, 255, 255, 0.3)'
      }}></div>
      <div style={{
        position: 'absolute', top: '0', bottom: '0', left: '50%',
        width: '1px', background: 'rgba(0, 255, 255, 0.3)'
      }}></div>
      <div style={{
        position: 'absolute', top: '25%', left: '25%', right: '25%', bottom: '25%',
        borderRadius: '50%', border: '1px solid rgba(0, 255, 255, 0.2)'
      }}></div>

      {/* Radar sweep line */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: '0', height: '0',
        zIndex: 5, animation: 'radar-scan 2s linear infinite', transformOrigin: 'center center',
      }}>
        <div style={{
          position: 'absolute', left: '0', top: '0', width: `${radarVisualRadius}px`, height: '1.5px',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.6), rgba(0, 255, 255, 0.05))',
          transform: 'rotate(90deg)', transformOrigin: 'left center',
          boxShadow: '0 0 3px rgba(0, 255, 255, 0.5)',
        }}></div>
      </div>

      {/* Enemy blips */}
      {radarData.trackedEntities.map((entity) => {
        // --- Start of Blip Calculation Logic ---
        let dirX = entity.direction.x;
        let dirZ = entity.direction.z;
        // Calculate distance projected onto the XZ plane first
        const xzDist = Math.sqrt(entity.direction.x**2 + entity.direction.z**2);
        // If xzDist is near zero, avoid division by zero; place blip near center
        if (xzDist < 0.001) {
            dirX = 0;
            dirZ = 0;
        } else {
            // Normalize the XZ direction vector
            dirX = entity.direction.x / xzDist;
            dirZ = entity.direction.z / xzDist;
        }

        // Actual distance in the XZ plane
        const actualXZDistance = xzDist * entity.distance;

        // Determine how far out the blip should be on the radar display (0 to 1)
        const distanceRatio = Math.min(actualXZDistance / radarLogicRadius, 1);

        // Calculate visual position based on normalized direction and distance ratio
        const x = dirX * distanceRatio * radarVisualRadius;
        const y = -dirZ * distanceRatio * radarVisualRadius; // Invert Z for screen Y

        const verticalThreshold = 10; // Keep this threshold
        const isAbove = entity.direction.y * entity.distance > verticalThreshold;
        const isBelow = entity.direction.y * entity.distance < -verticalThreshold;

        let color = '#ff0000';
        let size = Math.max(3, 6 - distanceRatio * 2);
        let shape: 'dot' | 'diamond' | 'triangle' = 'dot';
        let zIndex = 1;
        let pulseSpeed = 0.8;
        let boxShadow = `0 0 3px ${color}`;
        let additionalStyles: React.CSSProperties = {};

        if (entity.entityType === 'dysonSphere') {
          color = '#00ff00'; size = 14; zIndex = 10;
          boxShadow = `0 0 6px ${color}`;
          additionalStyles = { border: `2px solid ${color}`, background: 'rgba(0, 255, 0, 0.3)' };
          // Dyson Sphere should always be a dot regardless of elevation
          shape = 'dot';
        } else if (entity.entityType === 'asteroid') {
          color = '#ff9900'; size = Math.max(4, 9 - distanceRatio * 3);
          shape = 'diamond'; zIndex = 3; boxShadow = `0 0 8px ${color}`; pulseSpeed = 0.5;
        }

        // Determine shape based on elevation *after* setting defaults
        if ((shape === 'dot' || shape === 'diamond') && (isAbove || isBelow) && entity.entityType !== 'dysonSphere') {
          shape = 'triangle';
        }
        // --- End of Blip Calculation Logic ---

        // --- Start of Blip Rendering ---
        const commonStyle: React.CSSProperties = {
          position: 'absolute', top: '50%', left: '50%',
          // We apply the offset translate within the specific shape styles now
          zIndex: zIndex,
          animation: `pulse-opacity ${pulseSpeed}s infinite alternate`
        };

        if (shape === 'dot') {
          // Centered dot
          return (
            <div key={entity.entityId} style={{ ...commonStyle, width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: color, boxShadow: boxShadow, transform: `translate(${x - size / 2}px, ${y - size / 2}px)`, ...additionalStyles }}></div>
          );
        } else if (shape === 'diamond') {
          // Centered diamond
          return (
            <div key={entity.entityId} style={{ ...commonStyle, width: `${size}px`, height: `${size}px`, background: color, transform: `translate(${x - size / 2}px, ${y - size / 2}px) rotate(45deg)`, boxShadow: boxShadow }}></div>
          );
        } else if (shape === 'triangle') {
          // Adjusted triangle positioning to be centered on the (x, y) point
          const triangleHeight = size * 1.5; // Slightly taller triangle
          const triangleBase = size * 1.2;  // Slightly wider base
          return (
            <div key={entity.entityId} style={{ ...commonStyle, width: '0', height: '0',
              borderLeft: `${triangleBase / 2}px solid transparent`,
              borderRight: `${triangleBase / 2}px solid transparent`,
              borderBottom: isAbove ? `${triangleHeight}px solid ${color}` : 'none',
              borderTop: isBelow ? `${triangleHeight}px solid ${color}` : 'none',
              transform: `translate(${x - triangleBase / 2}px, ${y - (isAbove ? triangleHeight : 0)}px)`,
              boxShadow: boxShadow
            }}></div>
          );
        }
        return null;
        // --- End of Blip Rendering ---
      })}
    </div>
  );
};

export default RadarDisplay;
