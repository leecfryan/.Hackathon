// src/socket/socket.js

import { io } from 'socket.io-client';

// Initialize socket connection
let socket = null;

// Initialize the socket connection
export const initializeSocket = (serverUrl = 'http://localhost:3001') => {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: true, // CHANGE THIS to true
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // ADD THIS
      forceNew: true // ADD THIS
    });

    // Rest of your code stays the same...
  }
  return socket;
};

// Connect to the server
export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

// Disconnect from the server
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

// Send a private message to a specific user
export const sendPrivateMessage = (recipientUid, message) => {
  if (socket && socket.connected) {
    socket.emit('private_message', {
      to: recipientUid,
      message: message,
      timestamp: new Date().toISOString()
    });
    console.log(`Sending private message to ${recipientUid}:`, message);
  } else {
    console.error('Socket not connected. Cannot send message.');
    // You might want to queue messages or show an error to the user
  }
};

// Listen for incoming private messages
export const onPrivateMessage = (callback) => {
  if (socket) {
    socket.on('private_message', (data) => {
      console.log('Received private message:', data);
      callback(data);
    });
  }
};

// Remove private message listener
export const offPrivateMessage = () => {
  if (socket) {
    socket.off('private_message');
  }
};

// Join a room (if you're using rooms for organization)
export const joinRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('join_room', roomId);
    console.log(`Joined room: ${roomId}`);
  }
};

// Leave a room
export const leaveRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('leave_room', roomId);
    console.log(`Left room: ${roomId}`);
  }
};

// Send typing indicator
export const sendTypingIndicator = (recipientUid, isTyping) => {
  if (socket && socket.connected) {
    socket.emit('typing', {
      to: recipientUid,
      isTyping: isTyping
    });
  }
};

// Listen for typing indicators
export const onTypingIndicator = (callback) => {
  if (socket) {
    socket.on('typing', (data) => {
      callback(data);
    });
  }
};

// Get current socket instance
export const getSocket = () => socket;

// Check if socket is connected
export const isSocketConnected = () => socket && socket.connected;

// For development/testing - mock socket when server isn't available
export const enableMockMode = () => {
  console.warn('Socket running in mock mode - no real server connection');
  
  // Override the sendPrivateMessage function for testing
  window.mockSendPrivateMessage = sendPrivateMessage;
  
  // You can simulate receiving messages for testing
  window.simulateReceiveMessage = (fromUid, message) => {
    const mockData = {
      from: fromUid,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    // Trigger any registered private message listeners
    if (socket && socket.listeners('private_message').length > 0) {
      socket.emit('private_message', mockData);
    }
  };
};