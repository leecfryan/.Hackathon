// src/App.js - Updated with persistence

import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect } from 'react';
import ChatWindow from './Components/ChatWindow';
import { 
  initializeSocket, 
  connectSocket, 
  disconnectSocket, 
  onPrivateMessage, 
  offPrivateMessage,
  enableMockMode 
} from './socket/socket';

// Import persistence utilities (we'll create these next)
import { ChatStorage } from './utils/chatStorage';
import { ChatAPI } from './services/chatAPI';

const currentUser = {
  uid: '550e8400-e29b-41d4-a716-446655440000', // ✅ John Doe's actual UUID
  name: 'John Doe',
  email: 'john.doe.2024@student.smu.edu.sg'
};

const dummyUser = {
  uid: '550e8400-e29b-41d4-a716-446655440001', // ✅ Alice's actual UUID
  name: 'Alice (SOE, Yr 2)'
};

function App() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Load messages when component mounts
  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Socket setup
  useEffect(() => {
    setupSocket();
    return () => {
      offPrivateMessage();
      disconnectSocket();
    };
  }, []);

  const loadConversationHistory = async () => {
    setIsLoadingMessages(true);
    setConnectionError(null);
    
    try {
      // Step 1: Load from local storage immediately for instant UI
      const cachedMessages = ChatStorage.getConversation(currentUser.uid, dummyUser.uid);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        console.log(`Loaded ${cachedMessages.length} messages from cache`);
      }

      // Step 2: Fetch latest from server
      const serverMessages = await ChatAPI.getConversation(currentUser.uid, dummyUser.uid);
      
      // Step 3: Update UI with server data (source of truth)
      setMessages(serverMessages);
      
      // Step 4: Update local cache with latest server data
      ChatStorage.saveConversation(currentUser.uid, dummyUser.uid, serverMessages);
      
      console.log(`Loaded ${serverMessages.length} messages from server`);
      
    } catch (error) {
      console.error('Failed to load messages from server:', error);
      setConnectionError('Failed to sync with server');
      
      // Fallback to cached messages if server fails
      const cachedMessages = ChatStorage.getConversation(currentUser.uid, dummyUser.uid);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        console.log('Using cached messages as fallback');
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const setupSocket = () => {
    const socket = initializeSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setConnectionError('Connection failed');
    });

    // Listen for incoming messages
    onPrivateMessage(async (data) => {
      const incomingMessage = {
        id: data.id || uuidv4(),
        from: data.from,
        to: currentUser.uid,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        status: 'received'
      };

      // Update UI immediately
      setMessages(prev => [...prev, incomingMessage]);

      // Save to local storage immediately
      ChatStorage.addMessage(currentUser.uid, dummyUser.uid, incomingMessage);

      // Save to server (async, don't block UI)
      try {
        await ChatAPI.saveIncomingMessage(incomingMessage);
      } catch (error) {
        console.error('Failed to save incoming message to server:', error);
        // Message is still in local storage, will sync later
      }
    });

    connectSocket();
  };

    const handleSend = async (uid, messageText) => {
    // Create message object
    const newMessage = {
      id: uuidv4(), // ✅ Generate proper UUID instead of timestamp
      from: currentUser.uid,
      to: uid,
      message: messageText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    // Step 1: Optimistic UI update (show message immediately)
    setMessages(prev => [...prev, newMessage]);

    // Step 2: Save to local storage immediately (for persistence)
    ChatStorage.addMessage(currentUser.uid, uid, newMessage);

    try {
      // Step 3: Send to server
      const savedMessage = await ChatAPI.sendMessage({
        ...newMessage,
        senderInfo: {
          uid: currentUser.uid,
          name: currentUser.name,
          email: currentUser.email
        },
        receiverInfo: {
          uid: dummyUser.uid,
          name: dummyUser.name
        }
      });

      // Step 4: Update message status to 'sent'
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...savedMessage, status: 'sent' }
          : msg
      ));

      // Step 5: Update local storage with server response
      ChatStorage.updateMessage(currentUser.uid, uid, newMessage.id, {
        ...savedMessage, 
        status: 'sent'
      });

    } catch (error) {
      console.error('Failed to send message to server:', error);
      
      // Step 6: Mark message as failed but keep in local storage
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));

      ChatStorage.updateMessage(currentUser.uid, uid, newMessage.id, {
        ...newMessage,
        status: 'failed'
      });

      // Optionally show retry option to user
      setConnectionError('Message failed to send. Will retry when connection is restored.');
    }
  };

  const handleRetryMessage = async (failedMessage) => {
    try {
      // Update status to sending
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id 
          ? { ...msg, status: 'sending' }
          : msg
      ));

      const savedMessage = await ChatAPI.sendMessage({
        ...failedMessage,
        senderInfo: {
          uid: currentUser.uid,
          name: currentUser.name,
          email: currentUser.email
        },
        receiverInfo: {
          uid: dummyUser.uid,
          name: dummyUser.name
        }
      });

      // Update to sent
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id 
          ? { ...savedMessage, status: 'sent' }
          : msg
      ));

      ChatStorage.updateMessage(currentUser.uid, dummyUser.uid, failedMessage.id, {
        ...savedMessage,
        status: 'sent'
      });

    } catch (error) {
      console.error('Failed to retry message:', error);
      
      // Update back to failed
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };

  const handleRetryFailedMessages = async () => {
    const failedMessages = messages.filter(msg => msg.status === 'failed');
    
    for (const failedMsg of failedMessages) {
      try {
        // Update status to sending first
        setMessages(prev => prev.map(msg => 
          msg.id === failedMsg.id 
            ? { ...msg, status: 'sending' }
            : msg
        ));

        const savedMessage = await ChatAPI.sendMessage({
          ...failedMsg,
          senderInfo: {
            uid: currentUser.uid,
            name: currentUser.name,
            email: currentUser.email
          },
          receiverInfo: {
            uid: dummyUser.uid,
            name: dummyUser.name
          }
        });

        // Update status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === failedMsg.id 
            ? { ...savedMessage, status: 'sent' }
            : msg
        ));

        ChatStorage.updateMessage(currentUser.uid, dummyUser.uid, failedMsg.id, {
          ...savedMessage,
          status: 'sent'
        });

      } catch (error) {
        console.error(`Failed to retry message ${failedMsg.id}:`, error);
        
        // Update back to failed
        setMessages(prev => prev.map(msg => 
          msg.id === failedMsg.id 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
      // Clear UI
      setMessages([]);
      
      // Clear local storage
      ChatStorage.clearConversation(currentUser.uid, dummyUser.uid);
      
      // Clear from server (optional - you might want to keep for admin purposes)
      try {
        await ChatAPI.clearConversation(currentUser.uid, dummyUser.uid);
      } catch (error) {
        console.error('Failed to clear chat on server:', error);
      }
    }
  };

  if (isLoadingMessages) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: '#666'
      }}>
        <div>Loading chat history...</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Syncing with server
        </div>
      </div>
    );
  }

  const failedMessageCount = messages.filter(msg => msg.status === 'failed').length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Connection status and controls */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          {connectionError && ` - ${connectionError}`}
        </span>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {failedMessageCount > 0 && (
            <button
              onClick={handleRetryFailedMessages}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry Failed ({failedMessageCount})
            </button>
          )}
          
          <button
            onClick={handleClearChat}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>
      
      <ChatWindow 
        user={dummyUser} 
        messages={messages} 
        onSend={handleSend}
        onRetryMessage={handleRetryMessage}
      />
    </div>
  );
}

export default App;