// src/ui/hud/CommsDisplay.tsx
import React, { useEffect, useRef } from 'react';
import '../styles/retro.css'; // Ensure styles are imported

interface CommsDisplayProps {
  messages: string[];
}

const CommsDisplay: React.FC<CommsDisplayProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animatedMessagesRef = useRef<Set<string>>(new Set()); // Use ref for immediate access

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset animated messages when messages array clears (e.g., new game)
  useEffect(() => {
    if (messages.length === 0) {
      animatedMessagesRef.current = new Set();
    }
  }, [messages]);

  // Filter out messages that should appear in the AlertsDisplay
  const filteredMessages = messages.filter(msg => 
    // Only show messages in CommsDisplay that don't contain these terms
    // as they will be shown in the AlertsDisplay
    !msg.includes("WAVE") && !msg.includes("THREATS") && !msg.includes("INCOMING")
  );

  return (
    <div style={{
      width: '280px', 
      height: '180px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderTop: '2px solid #ff00ff',
      borderLeft: '2px solid #ff00ff',
      borderRight: '2px solid #ff00ff',
      borderTopLeftRadius: '15px',
      borderTopRightRadius: '15px',
      boxShadow: '0 0 15px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2)',
      padding: '12px',
      overflowY: 'auto',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '0.7rem',
      color: '#00ff00',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        borderBottom: '1px solid #ff00ff',
        paddingBottom: '5px',
        marginBottom: '5px',
        color: '#ff00ff',
        fontSize: '0.6rem'
      }}>
        COMMS LOG
      </div>
      <div style={{ flexGrow: 1, overflowY: 'auto', scrollBehavior: 'smooth' }}>
        {filteredMessages.map((alert, index) => {
          const uniqueKey = `${index}-${alert}`; // More robust key
          const shouldAnimate = !animatedMessagesRef.current.has(uniqueKey);

          if (shouldAnimate) {
            // Use timeout to mark as animated *after* the animation duration
            // Add a small buffer
            setTimeout(() => {
              animatedMessagesRef.current.add(uniqueKey);
            }, 1000 + 100); // Assumes 1s animation + buffer
          }

          const words = alert.split(' ');
          let lines: string[] = [];
          let currentLine = '';
          const maxChars = 30; // Slightly reduced to fit the new width

          words.forEach(word => {
            if (currentLine.length + word.length + 1 > maxChars) {
              lines.push(currentLine.trim());
              currentLine = word;
            } else {
              currentLine += (currentLine ? ' ' : '') + word;
            }
          });
          if (currentLine) {
            lines.push(currentLine.trim());
          }

          return (
            <div
              key={uniqueKey} // Use the unique key
              style={{
                color: alert.includes('OBJECTIVE') ? '#00ff00' : alert.includes('THREAT') ? '#ff5555' : '#00ffff',
                marginBottom: '8px',
                width: '100%',
                lineHeight: '1.2'
              }}
            >
              {'> '} {lines.map((line, lineIndex) => (
                <div
                  key={`line-${lineIndex}`}
                  style={{
                    display: 'block',
                    marginLeft: lineIndex > 0 ? '12px' : '0'
                  }}
                >
                  <span
                    className={shouldAnimate ? `typing-animation line-${lineIndex}` : ""}
                    style={{
                      display: 'inline-block',
                      maxWidth: 'calc(100% - 15px)',
                      wordBreak: 'break-word',
                      '--delay': lineIndex * 0.8, // Faster typing per line
                    } as React.CSSProperties}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {filteredMessages.length === 0 && (
          <div style={{ color: '#666666', fontStyle: 'italic' }}>
            {'> '} No messages
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default CommsDisplay; 