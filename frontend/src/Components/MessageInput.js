// src/Components/MessageInput.js

import React, { useState } from 'react';

/**
 * @param {Object} props
 * @param {Function} props.onSend - Callback function when user sends a message
 */
function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmedText = text.trim();
    if (trimmedText) {
      onSend(trimmedText);
      setText(''); // Clear input after sending
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSend();
    }
  };

  const handleKeyDown = (e) => {
    // Allow Shift+Enter for new lines
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Let the default behavior happen
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px',
      alignItems: 'flex-end',
      padding: '8px 0'
    }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '20px',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: '14px',
          minHeight: '20px',
          maxHeight: '100px',
          overflow: 'auto'
        }}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        style={{
          padding: '8px 16px',
          backgroundColor: text.trim() ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;