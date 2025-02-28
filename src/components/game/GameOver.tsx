import React, { useEffect, useState } from 'react';

interface GameOverProps {
  onReset: () => void;
  score: number;
  level: number;
}

export const GameOver: React.FC<GameOverProps> = ({ onReset, score, level }) => {
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [gameOverVisible, setGameOverVisible] = useState(true);

  useEffect(() => {
    // Initial delay before starting animations
    const initialDelay = setTimeout(() => {
      // Start pulsing animation
      let pulseCount = 0;
      const pulseInterval = setInterval(() => {
        pulseCount++;
        setGameOverVisible(prev => !prev);
        
        // After 3 pulses, start countdown
        if (pulseCount >= 6) {
          clearInterval(pulseInterval);
          setGameOverVisible(true);
          setShowCountdown(true);
        }
      }, 400);

      return () => {
        clearInterval(pulseInterval);
      };
    }, 500);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!showCountdown) return;

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showCountdown, onReset]);

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        fontFamily: "'Press Start 2P', monospace"
      }}
    >
      <div 
        className={`transition-opacity duration-200 ${gameOverVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          textAlign: 'center'
        }}
      >
        <div 
          className="text-8xl font-bold mb-8"
          style={{
            color: '#b800e6',
            textShadow: `
              0 0 20px #b800e6,
              0 0 30px #b800e6,
              0 0 40px #b800e6
            `,
            transform: gameOverVisible ? 'scale(1)' : 'scale(0.95)',
            transition: 'transform 200ms'
          }}
        >
          GAME OVER
        </div>
        
        <div className="text-2xl text-white mb-8 space-y-4">
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
        </div>

        {showCountdown && (
          <div 
            className="text-6xl text-yellow-400 mt-12"
            style={{
              textShadow: '0 0 10px #fbbf24'
            }}
          >
            {countdown}
          </div>
        )}
      </div>
    </div>
  );
};
