// src/Components/MessageBubble.js

import React from 'react';

/**
 * @param {Object} props
 * @param {string} props.message - The message text to display
 * @param {boolean} props.fromSelf - Whether this message is from the current user
 * @param {string} props.timestamp - Message timestamp
 * @param {string} props.status - Message status (sending, sent, failed, received)
 * @param {boolean} props.edited - Whether message was edited
 * @param {Function} props.onRetry - Callback for retrying failed messages
 */
function MessageBubble({ message, fromSelf, timestamp, status, edited, onRetry }) {
  const getStatusIcon = () => {
    if (!fromSelf) return null; // Don't show status for received messages
    
    switch (status) {
      case 'sending':
        return <span style={{ fontSize: '10px', opacity: 0.7 }}>⏳</span>;
      case 'sent':
        return <span style={{ fontSize: '10px', opacity: 0.7 }}>✓</span>;
      case 'failed':
        return (
          <button
            onClick={onRetry}
            style={{
              fontSize: '10px',
              background: 'none',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '4px'
            }}
            title="Click to retry"
          >
            ⚠️
          </button>
        );
      default:
        return null;
    }
  };

  const getBubbleStyle = () => {
    let backgroundColor = fromSelf ? '#007bff' : '#e9ecef';
    let color = fromSelf ? 'white' : '#333';
    
    // Dim failed messages
    if (status === 'failed') {
      backgroundColor = fromSelf ? '#6c757d' : '#f8f9fa';
      color = fromSelf ? '#fff' : '#6c757d';
    }
    
    return {
      maxWidth: '70%',
      padding: '8px 12px',
      borderRadius: '18px',
      backgroundColor,
      color,
      wordWrap: 'break-word',
      boxShadow: status === 'failed' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
      fontSize: '14px',
      lineHeight: '1.4',
      opacity: status === 'sending' ? 0.7 : 1
    };
  };

  const getTimestampText = () => {
    if (!timestamp) return '';
    
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return messageTime.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: fromSelf ? 'flex-end' : 'flex-start',
        marginBottom: '8px'
      }}
    >
      <div style={getBubbleStyle()}>
        {message}
        
        {/* Message footer with timestamp and status */}
        <div style={{
          fontSize: '11px',
          color: fromSelf ? 'rgba(255,255,255,0.7)' : '#666',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>
            {getTimestampText()}
            {edited && ' (edited)'}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;