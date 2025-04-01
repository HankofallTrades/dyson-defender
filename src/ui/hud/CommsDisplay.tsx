// src/ui/hud/CommsDisplay.tsx
// This component displays a log of communications messages in the game UI
// It also handles the display of alert overlays during wave transitions
import React, { useEffect, useRef, useState } from 'react';
import '../styles/retro.css';

interface CommsDisplayProps {
  messages: string[];
  waveCountdown?: number | null;
  currentWave?: number;
}

// Message with tracking for animation state
interface TrackedMessage {
  id: number;
  message: string;
  isNew: boolean;
  isLatest: boolean;
}

// Format message with line breaks to prevent text from being cut off
// Using larger maxCharsPerLine for VT323 font which is more compact
const formatMessageWithBreaks = (message: string, maxCharsPerLine = 40): string[] => {
  // Convert to uppercase before processing
  const upperMessage = message.toUpperCase();
  const words = upperMessage.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    // If adding this word would make the line too long
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
};

const CommsDisplay: React.FC<CommsDisplayProps> = ({
  messages,
  waveCountdown = null,
  currentWave = 0
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [trackedMessages, setTrackedMessages] = useState<TrackedMessage[]>([]);
  const [nextId, setNextId] = useState(1);
  const prevWaveRef = useRef(currentWave);

  // Clear everything when entering wave 0
  useEffect(() => {
    // Only clear when transitioning TO wave 0 from a different wave
    if (currentWave === 0 && prevWaveRef.current !== 0) {
      setTrackedMessages([]);
      setNextId(1);
    }
    prevWaveRef.current = currentWave;
  }, [currentWave]);

  // Handle messages
  useEffect(() => {
    // Don't process any messages during wave 0
    if (currentWave === 0) {
      return;
    }

    // Special handling for wave 1 start - show only objective
    if (currentWave === 1 && waveCountdown === null) {
      const objectiveMsg = "OBJECTIVE: DEFEND THE DYSON SPHERE";
      const hasObjective = trackedMessages.some(msg => msg.message === objectiveMsg);
      
      if (!hasObjective) {
        const objectiveEntry: TrackedMessage = {
          id: 1,
          message: objectiveMsg,
          isNew: true,
          isLatest: true
        };
        setTrackedMessages([objectiveEntry]);
        setNextId(2);
        
        const timer = setTimeout(() => {
          setTrackedMessages(prev =>
            prev.map(msg => ({ ...msg, isNew: false, isLatest: false }))
          );
        }, 3500);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Handle regular messages
    const newMessages = messages
      .filter(msg => !msg.includes("WAVE") && !msg.includes("INCOMING"))
      .map(msg => msg.toUpperCase())
      .filter(msg => !trackedMessages.some(tracked => tracked.message === msg));

    if (newMessages.length > 0) {
      const newEntries = newMessages.map((msg, index) => ({
        id: nextId + index,
        message: msg,
        isNew: true,
        isLatest: index === newMessages.length - 1
      }));

      setTrackedMessages(prev => [
        ...prev.map(msg => ({ ...msg, isLatest: false })),
        ...newEntries
      ]);
      
      setNextId(prev => prev + newMessages.length);

      const timer = setTimeout(() => {
        setTrackedMessages(prev =>
          prev.map(msg => 
            newEntries.some(n => n.id === msg.id)
              ? { ...msg, isNew: false, isLatest: false }
              : msg
          )
        );
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [messages, currentWave, waveCountdown, nextId, trackedMessages]);

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trackedMessages]);

  // Create alert overlay for wave transitions
  const renderAlertOverlay = () => {
    if (waveCountdown === null) return null;

    const isFirstWave = currentWave === 0;

    return (
      <div className="comms-content-alert-overlay">
        {isFirstWave ? (
          <div className="comms-alert-warning">
            WARNING: INCOMING THREATS DETECTED
          </div>
        ) : (
          <div className="comms-alert-wave">
            WAVE {currentWave + 1} INCOMING
          </div>
        )}
        <div className="comms-alert-countdown">
          {waveCountdown}
        </div>
        <div className="wave-notification-scan"></div>
      </div>
    );
  };

  // Helper to check if a message is a threat message
  const isThreatMessage = (message: string): boolean => {
    // Use the already uppercased message
    return message.includes("THREAT");
  };

  const isObjectiveMessage = (message: string): boolean => {
    // Use the already uppercased message
    return message.includes("OBJECTIVE: DEFEND");
  }

  return (
    <div className="comms-display retro-hud-container">
      <div className="comms-header retro-hud-label">COMMS LOG</div>
      <div className="comms-content console-content">
        {renderAlertOverlay()}

        {/* Messages with line breaks */}
        {trackedMessages.map((trackedMsg) => {
          const formattedLines = formatMessageWithBreaks(trackedMsg.message);
          const isThreat = isThreatMessage(trackedMsg.message);
          const isObjective = isObjectiveMessage(trackedMsg.message);

          return (
            <div
              key={`msg-${trackedMsg.id}`}
              className="comms-message-container"
            >
              {formattedLines.map((line, lineIndex) => {
                const isFirstLine = lineIndex === 0;
                const classes = ["comms-message-line"];

                if (isFirstLine) {
                  classes.push("first-line");
                  if (trackedMsg.isNew) {
                    classes.push(isObjective ? "objective-typing" : "message-typing");
                  }
                  if (isThreat) classes.push("threat-message");
                  if (isObjective) classes.push("objective-message");
                } else {
                  classes.push("continuation-line");
                }

                const textColor = isObjective ? '#00ff00' :
                                 isThreat ? '#ff5555' : '#00ffff';

                return (
                  <div
                    key={`line-${lineIndex}`}
                    className={classes.join(" ")}
                    style={{ color: textColor }}
                  >
                    <span className="line-content">{isFirstLine ? '> ' : '  '}{line}</span>
                    {/* Inline cursor only on the first line of the *latest* new message */}
                    {(isFirstLine && trackedMsg.isNew && trackedMsg.isLatest) && (
                      <span className="inline-cursor">▌</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="console-scanner">
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default CommsDisplay; 