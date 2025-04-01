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
  const prevWaveCountdownRef = useRef<number | null>(waveCountdown);

  const calculateNextId = () => trackedMessages.length + 1;

  useEffect(() => {
    if (currentWave === 0 && prevWaveRef.current !== 0) {
      setTrackedMessages([]);
    }
    prevWaveRef.current = currentWave;
  }, [currentWave]);

  useEffect(() => {
    const currentCountdown = waveCountdown;
    const prevCountdown = prevWaveCountdownRef.current;

    prevWaveCountdownRef.current = currentCountdown;

    if (currentCountdown !== null || currentWave === 0) {
      return;
    }

    const nextId = calculateNextId();

    if (currentWave === 1) {
      const objectiveMsg = "OBJECTIVE: DEFEND THE DYSON SPHERE";
      const hasObjective = trackedMessages.some(msg => msg.message === objectiveMsg);
      if (!hasObjective) {
        const objectiveEntry: TrackedMessage = {
          id: nextId,
          message: objectiveMsg,
          isNew: true,
          isLatest: true
        };
        setTrackedMessages([objectiveEntry]);
        const timer = setTimeout(() => {
          setTrackedMessages(prev =>
            prev.map(msg => (msg.id === objectiveEntry.id ? { ...msg, isNew: false, isLatest: false } : msg))
          );
        }, 3500);
        return () => clearTimeout(timer);
      }
    }

    const newMessagesFromProp = messages
      .filter(msg => !msg.includes("WAVE") && !msg.includes("INCOMING"))
      .map(msg => msg.toUpperCase())
      .filter(msg => !trackedMessages.some(tracked => tracked.message === msg));

    if (newMessagesFromProp.length > 0) {
      const newEntries = newMessagesFromProp.map((msg, index) => ({
        id: nextId + index,
        message: msg,
        isNew: true,
        isLatest: index === newMessagesFromProp.length - 1
      }));

      setTrackedMessages(prev => [
        ...prev.map(msg => ({ ...msg, isLatest: false })),
        ...newEntries
      ]);

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
  }, [messages, currentWave, waveCountdown]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trackedMessages]);

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

  const isThreatMessage = (message: string): boolean => {
    return message.includes("THREAT");
  };

  const isObjectiveMessage = (message: string): boolean => {
    return message.includes("OBJECTIVE: DEFEND");
  }

  return (
    <div className="comms-display retro-hud-container">
      <div className="comms-header retro-hud-label">COMMS LOG</div>
      <div className="comms-content console-content">
        {renderAlertOverlay()}

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