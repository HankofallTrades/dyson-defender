import React, { useState, useEffect } from 'react';
import { AudioManager } from '../../core/AudioManager';
import '../styles/retro.css'; // Import the CSS file for styling

interface AudioToggleProps {
  audioManager: AudioManager;
}

export const AudioToggle: React.FC<AudioToggleProps> = ({ audioManager }) => {
  // Initialize state based on the AudioManager's current muted status
  const [isOn, setIsOn] = useState(!audioManager.isMuted());

  // Update internal state if AudioManager state changes externally (e.g., initial load)
  // This might not be strictly necessary if only the toggle controls it, but good practice.
  useEffect(() => {
    const checkMutedStatus = () => {
      setIsOn(!audioManager.isMuted());
    };
    // Check initially
    checkMutedStatus();
    // Add a listener or interval if AudioManager state could change elsewhere
    // For simplicity now, we assume the toggle is the sole controller after mount.
  }, [audioManager]);


  const handleToggle = async () => {
    const currentMuted = audioManager.isMuted();
    const newMutedState = !currentMuted;

    // Visually update immediately for responsiveness
    setIsOn(!newMutedState);

    // Perform the actual audio state change
    try {
      await audioManager.setMuted(newMutedState);
      // Optionally re-sync state after async operation, though should match
      // setIsOn(!audioManager.isMuted());
      console.log(`Audio muted state set to: ${newMutedState}`);
    } catch (error) {
      console.error("Error setting audio muted state:", error);
      // Revert visual state if the operation failed
      setIsOn(currentMuted);
    }
  };

  return (
    <div
      className={`audio-toggle ${isOn ? 'on' : 'off'}`}
      onClick={handleToggle}
      onTouchEnd={handleToggle} // Basic mobile support
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle game audio"
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }} // Keyboard support
    >
      <div className="audio-toggle-switch">
        <div className="audio-toggle-knob" />
      </div>
      <span className="audio-toggle-label">
        {isOn ? 'SOUND ON' : 'SOUND OFF'}
      </span>
    </div>
  );
}; 