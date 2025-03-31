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

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '300px', // Adjust as needed
      height: '150px', // Adjust as needed
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid #ff00ff',
      borderRadius: '8px',
      padding: '10px',
      overflowY: 'auto',
      zIndex: 10,
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '0.7rem',
      color: '#00ff00', // Default comms color
      display: 'flex',
      flexDirection: 'column',
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
        {messages.map((alert, index) => {
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
          const maxChars = 35; // Approx chars based on width/font

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
        {messages.length === 0 && (
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