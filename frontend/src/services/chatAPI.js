// src/services/chatAPI.js - API service layer for server communication

export class ChatAPI {
  static BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  static TIMEOUT = 10000; // 10 second timeout

  // Helper method for making API requests
  static async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    const config = {
      timeout: this.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header when you implement auth
        // 'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers
      },
      ...options
    };

    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get conversation history between two users
  static async getConversation(userId1, userId2, limit = 100, offset = 0) {
    try {
      const response = await this.request(
        `/conversations/${userId1}/${userId2}`
      );
      
      // Your backend returns an array directly, not { messages: [...] }
      const messages = (Array.isArray(response) ? response : []).map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        message: msg.message,
        timestamp: msg.timestamp,
        status: msg.status || 'sent'
      }));
      
      return messages;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  }

  // Send a new message
  static async sendMessage(messageData) {
    try {
      const {
        id, from, to, message, timestamp,
        senderInfo, receiverInfo
      } = messageData;

      // Send data in the format your backend expects
      const payload = {
        id: id,
        from: from,
        to: to,
        message: message,
        timestamp: timestamp,
        senderInfo: senderInfo,
        receiverInfo: receiverInfo
      };

      const response = await this.request('/messages', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Return formatted message object
      return {
        id: response.id || id,
        from: from,
        to: to,
        message: message,
        timestamp: response.timestamp || timestamp,
        status: 'sent'
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Save incoming message (from socket)
  static async saveIncomingMessage(messageData) {
    try {
      const payload = {
        id: messageData.id,
        from: messageData.from,
        to: messageData.to,
        message: messageData.message,
        timestamp: messageData.timestamp
      };

      const response = await this.request('/messages/incoming', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      return response;
    } catch (error) {
      console.error('Failed to save incoming message:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(userId, conversationWithUserId) {
    try {
      const response = await this.request('/messages/mark-read', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          conversationWithUserId: conversationWithUserId,
          readAt: new Date().toISOString()
        })
      });

      return response;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  // Get conversation metadata (unread count, last message, etc.)
  static async getConversationMetadata(userId1, userId2) {
    try {
      const response = await this.request(
        `/conversations/${userId1}/${userId2}/metadata`
      );
      
      return {
        unreadCount: response.unreadCount || 0,
        lastMessage: response.lastMessage,
        lastMessageAt: response.lastMessageAt,
        status: response.status || 'active'
      };
    } catch (error) {
      console.error('Failed to fetch conversation metadata:', error);
      return { unreadCount: 0, lastMessage: null, lastMessageAt: null, status: 'active' };
    }
  }

  // Sync conversation - get messages newer than a timestamp
  static async syncConversation(userId1, userId2, lastSyncTimestamp) {
    try {
      const sinceParam = lastSyncTimestamp ? 
        `?since=${encodeURIComponent(lastSyncTimestamp)}` : '';
      
      const response = await this.request(
        `/conversations/${userId1}/${userId2}/sync${sinceParam}`
      );
      
      const messages = (response.messages || []).map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        message: msg.message,
        timestamp: msg.timestamp,
        status: 'sent',
        synced: true
      }));
      
      return {
        messages: messages,
        lastSyncTime: new Date().toISOString(),
        hasMore: response.hasMore || false
      };
    } catch (error) {
      console.error('Failed to sync conversation:', error);
      throw error;
    }
  }

  // Get all conversations for a user (for conversation list)
  static async getUserConversations(userId) {
    try {
      const response = await this.request(`/users/${userId}/conversations`);
      
      return (response.conversations || []).map(conv => ({
        conversationId: conv.id,
        otherUserId: conv.otherUserId,
        otherUserName: conv.otherUserName,
        otherUserEmail: conv.otherUserEmail,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount || 0,
        status: conv.status || 'active'
      }));
    } catch (error) {
      console.error('Failed to fetch user conversations:', error);
      return [];
    }
  }

  // Report user/message (for university safety)
  static async reportUser(reportData) {
    try {
      const response = await this.request('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
      
      return response;
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  }

  // Block user
  static async blockUser(blockerId, blockedUserId, reason) {
    try {
      const response = await this.request('/users/block', {
        method: 'POST',
        body: JSON.stringify({
          blockerId: blockerId,
          blockedUserId: blockedUserId,
          reason: reason,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  // Clear conversation (admin or user action)
  static async clearConversation(userId1, userId2) {
    try {
      const response = await this.request(`/conversations/${userId1}/${userId2}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      throw error;
    }
  }

  // Delete specific message
  static async deleteMessage(messageId, userId) {
    try {
      const response = await this.request(`/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          deletedBy: userId,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // Edit message
  static async editMessage(messageId, newContent, userId) {
    try {
      const response = await this.request(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: newContent,
          editedBy: userId,
          editedAt: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  // Search messages within a conversation
  static async searchConversation(userId1, userId2, query, limit = 50) {
    try {
      const response = await this.request(
        `/conversations/${userId1}/${userId2}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      return response.messages || [];
    } catch (error) {
      console.error('Failed to search conversation:', error);
      return [];
    }
  }

  // Batch operations for syncing multiple failed messages
  static async syncFailedMessages(messages) {
    try {
      const response = await this.request('/messages/batch-sync', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages,
          syncTimestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to sync failed messages:', error);
      throw error;
    }
  }

  // Health check for server availability
  static async healthCheck() {
    try {
      const response = await this.request('/health');
      return response.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  // Get user status (online, offline, etc.)
  static async getUserStatus(userId) {
    try {
      const response = await this.request(`/users/${userId}/status`);
      return {
        status: response.status || 'offline',
        lastSeen: response.lastSeen,
        isTyping: response.isTyping || false
      };
    } catch (error) {
      console.error('Failed to get user status:', error);
      return { status: 'offline', lastSeen: null, isTyping: false };
    }
  }

  // Update typing status
  static async updateTypingStatus(userId, conversationWithUserId, isTyping) {
    try {
      const response = await this.request('/users/typing', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          conversationWithUserId: conversationWithUserId,
          isTyping: isTyping,
          timestamp: new Date().toISOString()
        })
      });
      
      return response;
    } catch (error) {
      console.error('Failed to update typing status:', error);
      // Don't throw error for typing status - it's not critical
      return null;
    }
  }

  // Authentication helper (when you implement auth)
  static getAuthToken() {
    // Replace with your actual auth token retrieval
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // Set auth token
  static setAuthToken(token) {
    localStorage.setItem('auth_token', token);
  }

  // Clear auth token
  static clearAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  // Retry mechanism for failed requests
  static async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }
        
        // Wait before retrying
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  // Upload file/image (for future features)
  static async uploadFile(file, conversationId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(`${this.BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}