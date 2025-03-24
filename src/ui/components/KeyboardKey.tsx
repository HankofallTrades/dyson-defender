import React from 'react';

interface KeyboardKeyProps {
  children: React.ReactNode;
}

const KeyboardKey: React.FC<KeyboardKeyProps> = ({ children }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        height: '32px',
        padding: '0 6px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#00ffff',
        border: '1px solid #ff00ff',
        boxShadow: '0 0 5px #ff00ff, inset 0 0 5px rgba(255, 0, 255, 0.3)',
        borderRadius: '4px',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '0.7rem',
        textShadow: '0 0 3px rgba(0, 255, 255, 0.8)',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {children}
    </span>
  );
};

export default KeyboardKey; 