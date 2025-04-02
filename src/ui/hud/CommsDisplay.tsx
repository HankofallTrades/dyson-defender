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
  const prevWaveRef = useRef(currentWave);
  const prevWaveCountdownRef = useRef<number | null>(waveCountdown); // Track previous countdown value

  // Calculate nextId based on current state length
  const calculateNextId = () => trackedMessages.length + 1;

  // Clear everything when entering wave 0
  useEffect(() => {
    // Only clear when transitioning TO wave 0 from a different wave
    if (currentWave === 0 && prevWaveRef.current !== 0) {
      setTrackedMessages([]);
    }
    prevWaveRef.current = currentWave;
  }, [currentWave]);

  // Handle messages - Revised Dependencies and Logic
  useEffect(() => {
    const currentCountdown = waveCountdown;
    const prevCountdown = prevWaveCountdownRef.current;

    // Update previous countdown ref *before* processing logic for the current render
    prevWaveCountdownRef.current = currentCountdown;

    // Don't process messages during countdown or in wave 0
    if (currentCountdown !== null || currentWave === 0) {
      return;
    }

    // Determine the next available ID
    const nextId = calculateNextId();

    // --- Special handling for Wave 1 Objective ---
    // This logic seems specific and might be better handled upstream,
    // but let's keep it for now to minimize changes.
    // It only runs when countdown is null and wave is 1.
    if (currentWave === 1) {
        const objectiveMsg = "OBJECTIVE: DEFEND THE DYSON SPHERE";
        const hasObjective = trackedMessages.some(msg => msg.message === objectiveMsg);
        if (!hasObjective) {
            const objectiveEntry: TrackedMessage = {
                id: nextId, // Use calculated ID
                message: objectiveMsg,
                isNew: true,
                isLatest: true
            };
            // Reset messages to only the objective for Wave 1 start
            setTrackedMessages([objectiveEntry]);
            // Start timer to mark as not new/latest
            const timer = setTimeout(() => {
                setTrackedMessages(prev =>
                    prev.map(msg => (msg.id === objectiveEntry.id ? { ...msg, isNew: false, isLatest: false } : msg))
                );
            }, 3500); // Animation duration
            return () => clearTimeout(timer);
        }
        // If objective already exists for wave 1, proceed to regular message handling below
    }
    // --- End Wave 1 Special Handling ---

    // --- Regular Message Handling (Wave > 1 or Wave 1 after objective shown) ---
    // Filter incoming messages: exclude wave/incoming, uppercase, find ones not yet tracked
    const newMessagesFromProp = messages
        .filter(msg => !msg.includes("WAVE") && !msg.includes("INCOMING"))
        .map(msg => msg.toUpperCase())
        .filter(msg => !trackedMessages.some(tracked => tracked.message === msg));

    if (newMessagesFromProp.length > 0) {
        const newEntries = newMessagesFromProp.map((msg, index) => ({
            id: nextId + index, // Calculate IDs sequentially
            message: msg,
            isNew: true,
            isLatest: index === newMessagesFromProp.length - 1 // Only the last one is "latest"
        }));

        // Add new entries, marking previous ones as not latest
        setTrackedMessages(prev => [
            ...prev.map(msg => ({ ...msg, isLatest: false })),
            ...newEntries
        ]);

        // Start timer to mark new entries as not new/latest after animation
        const timer = setTimeout(() => {
            setTrackedMessages(prev =>
                prev.map(msg =>
                    newEntries.some(n => n.id === msg.id)
                        ? { ...msg, isNew: false, isLatest: false }
                        : msg
                )
            );
        }, 2500); // Animation duration

        return () => clearTimeout(timer);
    }

  // Rerun when messages prop changes OR when countdown changes state (from number to null or vice-versa) OR wave changes (relevant for wave 1 logic)
  }, [messages, currentWave, waveCountdown]); // Simplified Dependencies

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
    <div className="comms-display" style={{
      borderTop: '2px solid rgba(255, 0, 255, 0.6)',
      borderLeft: '2px solid rgba(255, 0, 255, 0.6)',
      borderRight: '2px solid rgba(255, 0, 255, 0.6)',
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
      boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)',
      background: 'rgba(0, 0, 0, 0.7)',
      marginBottom: '0',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignSelf: 'flex-end'
    }}>
      <div className="comms-header retro-hud-label">COMMS</div>
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