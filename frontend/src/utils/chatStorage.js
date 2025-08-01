// src/utils/chatStorage.js - Enhanced local storage for persistence

export class ChatStorage {
  static STORAGE_PREFIX = 'smu_chat_';
  static CONVERSATIONS_KEY = 'conversations';
  static METADATA_KEY = 'metadata';
  static MAX_MESSAGES_PER_CONVERSATION = 1000;
  static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Generate storage key for user
  static getUserStorageKey(userId) {
    return `${this.STORAGE_PREFIX}${userId}_${this.CONVERSATIONS_KEY}`;
  }

  static getMetadataKey(userId) {
    return `${this.STORAGE_PREFIX}${userId}_${this.METADATA_KEY}`;
  }

  // Get conversation key (ensures consistent ordering)
  static getConversationKey(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  // Get all conversations for a user
  static getAllConversations(userId) {
    try {
      const data = localStorage.getItem(this.getUserStorageKey(userId));
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading conversations from localStorage:', error);
      return {};
    }
  }

  // Get metadata (last sync time, etc.)
  static getMetadata(userId) {
    try {
      const data = localStorage.getItem(this.getMetadataKey(userId));
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading metadata from localStorage:', error);
      return {};
    }
  }

  // Update metadata
  static updateMetadata(userId, updates) {
    try {
      const currentMetadata = this.getMetadata(userId);
      const newMetadata = { ...currentMetadata, ...updates };
      localStorage.setItem(this.getMetadataKey(userId), JSON.stringify(newMetadata));
      return true;
    } catch (error) {
      console.error('Error updating metadata:', error);
      return false;
    }
  }

  // Get specific conversation between two users
  static getConversation(userId1, userId2) {
    const conversations = this.getAllConversations(userId1);
    const conversationKey = this.getConversationKey(userId1, userId2);
    const messages = conversations[conversationKey] || [];
    
    // Sort messages by timestamp to ensure correct order
    return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Save entire conversation
  static saveConversation(userId1, userId2, messages) {
    try {
      const conversations = this.getAllConversations(userId1);
      const conversationKey = this.getConversationKey(userId1, userId2);
      
      // Limit messages and sort by timestamp
      const sortedMessages = messages
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-this.MAX_MESSAGES_PER_CONVERSATION);
      
      conversations[conversationKey] = sortedMessages;
      
      localStorage.setItem(this.getUserStorageKey(userId1), JSON.stringify(conversations));
      
      // Update metadata
      this.updateMetadata(userId1, {
        [`${conversationKey}_lastUpdate`]: new Date().toISOString(),
        [`${conversationKey}_messageCount`]: sortedMessages.length
      });
      
      return true;
    } catch (error) {
      console.error('Error saving conversation to localStorage:', error);
      return false;
    }
  }

  // Add a single message to conversation
  static addMessage(userId1, userId2, message) {
    try {
      const conversations = this.getAllConversations(userId1);
      const conversationKey = this.getConversationKey(userId1, userId2);
      
      if (!conversations[conversationKey]) {
        conversations[conversationKey] = [];
      }
      
      // Check if message already exists (prevent duplicates)
      const existingMessageIndex = conversations[conversationKey].findIndex(
        msg => msg.id === message.id
      );
      
      if (existingMessageIndex >= 0) {
        // Update existing message
        conversations[conversationKey][existingMessageIndex] = message;
      } else {
        // Add new message
        conversations[conversationKey].push(message);
      }
      
      // Sort and limit messages
      conversations[conversationKey] = conversations[conversationKey]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-this.MAX_MESSAGES_PER_CONVERSATION);
      
      localStorage.setItem(this.getUserStorageKey(userId1), JSON.stringify(conversations));
      
      // Update metadata
      this.updateMetadata(userId1, {
        [`${conversationKey}_lastUpdate`]: new Date().toISOString(),
        [`${conversationKey}_messageCount`]: conversations[conversationKey].length,
        [`${conversationKey}_lastMessage`]: message.timestamp
      });
      
      return true;
    } catch (error) {
      console.error('Error adding message to localStorage:', error);
      return false;
    }
  }

  // Update specific message (useful for status updates)
  static updateMessage(userId1, userId2, messageId, updates) {
    try {
      const conversations = this.getAllConversations(userId1);
      const conversationKey = this.getConversationKey(userId1, userId2);
      
      if (!conversations[conversationKey]) {
        return false;
      }
      
      const messageIndex = conversations[conversationKey].findIndex(
        msg => msg.id === messageId
      );
      
      if (messageIndex >= 0) {
        conversations[conversationKey][messageIndex] = {
          ...conversations[conversationKey][messageIndex],
          ...updates
        };
        
        localStorage.setItem(this.getUserStorageKey(userId1), JSON.stringify(conversations));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating message in localStorage:', error);
      return false;
    }
  }

  // Get messages by status (e.g., failed messages)
  static getMessagesByStatus(userId1, userId2, status) {
    const messages = this.getConversation(userId1, userId2);
    return messages.filter(msg => msg.status === status);
  }

  // Clear specific conversation
  static clearConversation(userId1, userId2) {
    try {
      const conversations = this.getAllConversations(userId1);
      const conversationKey = this.getConversationKey(userId1, userId2);
      delete conversations[conversationKey];
      
      localStorage.setItem(this.getUserStorageKey(userId1), JSON.stringify(conversations));
      
      // Clear metadata for this conversation
      const metadata = this.getMetadata(userId1);
      Object.keys(metadata).forEach(key => {
        if (key.startsWith(`${conversationKey}_`)) {
          delete metadata[key];
        }
      });
      localStorage.setItem(this.getMetadataKey(userId1), JSON.stringify(metadata));
      
      return true;
    } catch (error) {
      console.error('Error clearing conversation from localStorage:', error);
      return false;
    }
  }

  // Clear all conversations for user
  static clearAllConversations(userId) {
    try {
      localStorage.removeItem(this.getUserStorageKey(userId));
      localStorage.removeItem(this.getMetadataKey(userId));
      return true;
    } catch (error) {
      console.error('Error clearing all conversations:', error);
      return false;
    }
  }

  // Get storage statistics
  static getStorageStats(userId) {
    try {
      const conversations = this.getAllConversations(userId);
      const metadata = this.getMetadata(userId);
      
      const conversationCount = Object.keys(conversations).length;
      const totalMessages = Object.values(conversations).reduce(
        (total, msgs) => total + msgs.length, 0
      );
      
      const storageData = JSON.stringify({ conversations, metadata });
      const storageSizeBytes = new Blob([storageData]).size;
      
      return {
        conversationCount,
        totalMessages,
        storageSizeBytes,
        storageSizeKB: Math.round(storageSizeBytes / 1024),
        lastUpdate: metadata.lastGlobalUpdate || 'Never'
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }

  // Check if local data is stale
  static isDataStale(userId, conversationKey) {
    const metadata = this.getMetadata(userId);
    const lastUpdate = metadata[`${conversationKey}_lastUpdate`];
    
    if (!lastUpdate) return true;
    
    const lastUpdateTime = new Date(lastUpdate).getTime();
    const now = Date.now();
    
    return (now - lastUpdateTime) > this.CACHE_DURATION;
  }

  // Export conversation for backup
  static exportConversation(userId1, userId2) {
    const conversation = this.getConversation(userId1, userId2);
    const metadata = this.getMetadata(userId1);
    const conversationKey = this.getConversationKey(userId1, userId2);
    
    return {
      conversationId: conversationKey,
      participants: [userId1, userId2],
      messages: conversation,
      metadata: {
        messageCount: conversation.length,
        exportDate: new Date().toISOString(),
        lastUpdate: metadata[`${conversationKey}_lastUpdate`]
      }
    };
  }

  // Import conversation from backup
  static importConversation(userId, conversationData) {
    try {
      const { conversationId, messages } = conversationData;
      const conversations = this.getAllConversations(userId);
      
      conversations[conversationId] = messages;
      localStorage.setItem(this.getUserStorageKey(userId), JSON.stringify(conversations));
      
      this.updateMetadata(userId, {
        [`${conversationId}_lastUpdate`]: new Date().toISOString(),
        [`${conversationId}_messageCount`]: messages.length,
        [`${conversationId}_imported`]: true
      });
      
      return true;
    } catch (error) {
      console.error('Error importing conversation:', error);
      return false;
    }
  }

  // Clean up old/stale data
  static cleanup(userId, daysToKeep = 30) {
    try {
      const conversations = this.getAllConversations(userId);
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      
      let cleanedCount = 0;
      
      Object.keys(conversations).forEach(conversationKey => {
        const messages = conversations[conversationKey];
        const filteredMessages = messages.filter(msg => 
          new Date(msg.timestamp) > cutoffDate
        );
        
        if (filteredMessages.length !== messages.length) {
          conversations[conversationKey] = filteredMessages;
          cleanedCount += (messages.length - filteredMessages.length);
        }
      });
      
      localStorage.setItem(this.getUserStorageKey(userId), JSON.stringify(conversations));
      
      console.log(`Cleaned up ${cleanedCount} old messages`);
      return cleanedCount;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }
}