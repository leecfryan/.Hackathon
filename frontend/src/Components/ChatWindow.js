// src/Components/ChatWindow.js

import React from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { sendPrivateMessage } from '../socket/socket';

/**
 * @param {Object} props
 * @param {Object} props.user - The user you're chatting with (e.g. { uid, name })
 * @param {Array} props.messages - Array of messages exchanged with this user
 * @param {Function} props.onSend - Function to update message state in App.js
 * @param {Function} props.onRetryMessage - Function to retry failed messages
 */
function ChatWindow({ user, messages, onSend, onRetryMessage }) {
  // If no user is selected, show a placeholder
  if (!user) return <div style={{ padding: '20px' }}>Select someone to chat with</div>;

  // Called when user sends a new message
  const handleSend = (text) => {
    // Send to backend via socket
    sendPrivateMessage(user.uid, text);
    
    // Update frontend state immediately
    onSend(user.uid, text);
  };

  // Handle retrying a failed message
  const handleRetryMessage = (message) => {
    if (onRetryMessage) {
      onRetryMessage(message);
    }
  };

  return (
    <div style={{ 
      flex: 1, 
      padding: '10px', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Chat with {user.name}</h3>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: '10px', 
        border: '1px solid #ccc', 
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginTop: '50px',
            fontSize: '14px'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              message={msg.message}
              fromSelf={msg.from === 'me'}
              timestamp={msg.timestamp}
              status={msg.status}
              edited={msg.edited}
              onRetry={() => handleRetryMessage(msg)}
            />
          ))
        )}
      </div>
      
      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default ChatWindow;
