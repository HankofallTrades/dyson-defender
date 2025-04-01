import React from 'react';
import '../styles/retro.css'; // Import retro styles for animations

interface AlertsDisplayProps {
  waveCountdown: number | null;
  waveComplete: boolean;
  currentWave: number;
}

const AlertsDisplay: React.FC<AlertsDisplayProps> = ({ 
  waveCountdown, 
  waveComplete, 
  currentWave 
}) => {
  // Only show alert if there's an active countdown
  if (waveCountdown === null) return null;

  // Determine if it's the first wave (game start/restart)
  const isFirstWave = currentWave === 0;

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '20px',
      background: 'rgba(0, 0, 0, 0.75)',
      borderRadius: '15px',
      border: '2px solid #ff5555',
      boxShadow: '0 0 20px rgba(255, 85, 85, 0.6), inset 0 0 15px rgba(255, 85, 85, 0.3)',
      textAlign: 'center',
      zIndex: 100,
      minWidth: '350px'
    }}>
      {isFirstWave ? (
        // First wave - show warning message
        <div
          style={{
            color: '#ff9900', // Orange for incoming
            fontSize: '2.5rem',
            textShadow: '0 0 15px #ff9900',
            animation: 'alert-text-blink 1s infinite', // Standard blink
            fontFamily: "'Press Start 2P', monospace",
            marginBottom: '0.5rem',
            letterSpacing: '0.2rem'
          }}
        >
          WARNING: INCOMING THREATS DETECTED
        </div>
      ) : (
        // Subsequent waves - show wave number incoming
        <div
          style={{
            color: '#4CAF50', // Green for wave transitions
            fontSize: '2.5rem', // Larger font
            textShadow: '0 0 15px #4CAF50', // Green shadow
            animation: 'alert-text-blink 1.5s infinite', // Slower blink for transitions
            fontFamily: "'Press Start 2P', monospace",
            marginBottom: '0.5rem',
            letterSpacing: '0.2rem'
          }}
        >
          WAVE {currentWave + 1} INCOMING
        </div>
      )}
      <div style={{ 
        fontSize: '2.5rem', 
        color: '#ffffff', 
        fontFamily: "'Press Start 2P', monospace" 
      }}>
        {waveCountdown}
      </div>
      {/* Add scanlines effect within this overlay */}
      <div className="wave-notification-scan"></div>
    </div>
  );
};

export default AlertsDisplay; 