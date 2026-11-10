import React, { useState, useEffect } from 'react';
import { AudioManager } from '../../core/AudioManager';
import '../styles/retro.css'; // Import the CSS file for styling

interface AudioToggleProps {
  audioManager: AudioManager;
}

export const AudioToggle: React.FC<AudioToggleProps> = ({ audioManager }) => {
  const [isOn, setIsOn] = useState(!audioManager.isMuted());

  // Stay in sync when sound is toggled elsewhere (the M key).
  useEffect(() => audioManager.onMutedChange((muted) => setIsOn(!muted)), [audioManager]);


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
      // onClick only: a tap fires both touchend and click, which toggled twice.
      onClick={handleToggle}
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle game audio"
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
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