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
  isLatest: boolean; // Flag to indicate if it's the latest animating message
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
  
  // Process incoming messages and add new ones to tracked state
  useEffect(() => {
    // Filter out non-display messages
    const filteredDisplayMessages = messages.filter(msg => 
      !msg.includes("WAVE") && !msg.includes("INCOMING") // Allow THREATS
    );

    // Find messages not yet tracked
    const currentTrackedContent = trackedMessages.map(tm => tm.message);
    // Convert incoming messages to uppercase here for comparison and storage
    const newMessagesToAdd = filteredDisplayMessages
        .map(msg => msg.toUpperCase())
        .filter(upperMsg => !currentTrackedContent.includes(upperMsg));

    if (newMessagesToAdd.length > 0) {
      let latestId = -1;
      const newTrackedEntries = newMessagesToAdd.map((upperMsg, index) => {
        const currentId = nextId + index;
        latestId = currentId; // Keep track of the last ID added
        return {
          id: currentId,
          message: upperMsg,
          isNew: true,
          isLatest: false // Set isLatest later
        };
      });

      setTrackedMessages(prev => {
        // Mark previous latest message as not latest
        const updatedPrev = prev.map(m => ({...m, isLatest: false}));
        // Mark the new latest message
        const finalNewEntries = newTrackedEntries.map(entry => 
           entry.id === latestId ? { ...entry, isLatest: true } : entry
        );
        return [...updatedPrev, ...finalNewEntries];
      });
      setNextId(prev => prev + newMessagesToAdd.length);

      // Set timer to remove 'isNew' flag after animation duration
      const animationDuration = 2500; // Match CSS animation duration + small buffer
      const timer = setTimeout(() => {
        setTrackedMessages(prev =>
          prev.map(msg => msg.isNew ? { ...msg, isNew: false, isLatest: false } : msg)
        );
      }, animationDuration);

      return () => clearTimeout(timer);
    }
  }, [messages, trackedMessages, nextId]); // Include trackedMessages dependency

  // Add objective message when conditions are met
  useEffect(() => {
    const objectiveMessageText = "OBJECTIVE: DEFEND THE DYSON SPHERE"; // Already uppercase
    const shouldAddObjective = waveCountdown === null && currentWave === 1;
    const objectiveExists = trackedMessages.some(msg => msg.message === objectiveMessageText);

    if (shouldAddObjective && !objectiveExists) {
      const newObjectiveEntry: TrackedMessage = {
        id: nextId,
        message: objectiveMessageText,
        isNew: true,
        isLatest: true // Assume objective is the latest when added
      };

      setTrackedMessages(prev => {
        // Mark previous latest as not latest
        const updatedPrev = prev.map(m => ({...m, isLatest: false}));
        return [...updatedPrev, newObjectiveEntry];
      });
      setNextId(prev => prev + 1);
      
      // Set timer to remove 'isNew' flag after animation duration
      const animationDuration = 3500; // Match objective CSS animation + buffer
       const timer = setTimeout(() => {
        setTrackedMessages(prev =>
          prev.map(msg => msg.id === newObjectiveEntry.id ? { ...msg, isNew: false, isLatest: false } : msg)
        );
      }, animationDuration);

      return () => clearTimeout(timer);
    }
  }, [waveCountdown, currentWave, trackedMessages, nextId]);

  // Auto-scroll to the bottom when trackedMessages change
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