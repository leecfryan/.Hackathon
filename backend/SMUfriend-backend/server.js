// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Your React app URL  
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  socket.on('private_message', (data) => {
    const recipientSocketId = connectedUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private_message', data);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connected users
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// API Routes

// Get conversation between two users
app.get('/api/conversations/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // First, find or create conversation
    let conversationResult = await pool.query(`
      SELECT c.conversation_id 
      FROM conversations c
      JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
      AND c.conversation_type = 'direct'
      LIMIT 1
    `, [userId1, userId2]);

    let conversationId;
    
    if (conversationResult.rows.length === 0) {
      // Create new conversation
      const newConversation = await pool.query(`
        INSERT INTO conversations (conversation_type) 
        VALUES ('direct') 
        RETURNING conversation_id
      `);
      
      conversationId = newConversation.rows[0].conversation_id;
      
      // Add participants
      await pool.query(`
        INSERT INTO conversation_participants (conversation_id, user_id) 
        VALUES ($1, $2), ($1, $3)
      `, [conversationId, userId1, userId2]);
    } else {
      conversationId = conversationResult.rows[0].conversation_id;
    }

    // Get messages
    const messages = await pool.query(`
      SELECT 
        m.message_id as id,
        m.sender_id as from,
        $2 as to,
        m.message_text as message,
        m.sent_at as timestamp,
        CASE 
          WHEN m.delivery_status = 'read' THEN 'read'
          WHEN m.delivery_status = 'delivered' THEN 'delivered'
          WHEN m.delivery_status = 'sent' THEN 'sent'
          WHEN m.delivery_status = 'failed' THEN 'failed'
          ELSE 'sent'
        END as status
      FROM messages m
      WHERE m.conversation_id = $1 
      AND m.deleted_at IS NULL
      ORDER BY m.sent_at ASC
    `, [conversationId, userId1]);

    res.json(messages.rows);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Send message - REPLACE the entire app.post('/api/messages', ...) route with this:
app.post('/api/messages', async (req, res) => {
  console.log('📨 /api/messages called');
  console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      id, 
      from, 
      to, 
      message, 
      timestamp, 
      senderInfo, 
      receiverInfo 
    } = req.body;

    console.log('📋 Parsed data:', { id, from, to, message, timestamp });

    // Find or create conversation
    console.log('🔍 Looking for conversation between:', from, 'and', to);
    
    let conversationResult = await pool.query(`
      SELECT c.conversation_id 
      FROM conversations c
      JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
      AND c.conversation_type = 'direct'
      LIMIT 1
    `, [from, to]);

    console.log('💬 Found conversations:', conversationResult.rows.length);

    let conversationId;
    
    if (conversationResult.rows.length === 0) {
      console.log('🆕 Creating new conversation...');
      // Create new conversation
      const newConversation = await pool.query(`
        INSERT INTO conversations (conversation_type) 
        VALUES ('direct') 
        RETURNING conversation_id
      `);
      
      conversationId = newConversation.rows[0].conversation_id;
      console.log('✅ Created conversation:', conversationId);
      
      // Add participants
      await pool.query(`
        INSERT INTO conversation_participants (conversation_id, user_id) 
        VALUES ($1, $2), ($1, $3)
      `, [conversationId, from, to]);
      console.log('✅ Added participants');
    } else {
      conversationId = conversationResult.rows[0].conversation_id;
      console.log('✅ Using existing conversation:', conversationId);
    }

    // Insert message
    console.log('💾 About to insert message...');
    const result = await pool.query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, sent_at, delivery_status)
      VALUES ($1, $2, $3, $4, $5, 'sent')
      RETURNING 
        message_id as id,
        sender_id as from,
        message_text as message,
        sent_at as timestamp,
        'sent' as status
    `, [id, conversationId, from, message, timestamp]);

    console.log('✅ Message inserted successfully');

    const savedMessage = result.rows[0];
    savedMessage.to = to;

    // Emit to connected recipient
    const recipientSocketId = connectedUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private_message', {
        id: savedMessage.id,
        from: savedMessage.from,
        to: savedMessage.to,
        message: savedMessage.message,
        timestamp: savedMessage.timestamp
      });
    }

    console.log('📤 Sending response:', savedMessage);
    res.json(savedMessage);
  } catch (error) {
    console.error('❌ DETAILED ERROR in /api/messages:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Detail:', error.detail);
    console.error('  Stack:', error.stack);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Save incoming message (for real-time sync)
app.post('/api/messages/incoming', async (req, res) => {
  try {
    const { id, from, to, message, timestamp } = req.body;

    // This endpoint is mainly for syncing purposes
    // In most cases, messages are already saved via the main send endpoint
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving incoming message:', error);
    res.status(500).json({ error: 'Failed to save incoming message' });
  }
});

// Clear conversation
app.delete('/api/conversations/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    // Find conversation
    const conversationResult = await pool.query(`
      SELECT c.conversation_id 
      FROM conversations c
      JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = $1 AND cp2.user_id = $2
      AND c.conversation_type = 'direct'
      LIMIT 1
    `, [userId1, userId2]);

    if (conversationResult.rows.length > 0) {
      const conversationId = conversationResult.rows[0].conversation_id;
      
      // Soft delete all messages
      await pool.query(`
        UPDATE messages 
        SET deleted_at = NOW(), deleted_by = $1 
        WHERE conversation_id = $2
      `, [userId1, conversationId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

// Get user info
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT user_id as uid, display_name as name, email, faculty, year_of_enrollment
      FROM users 
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user online status
app.post('/api/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    await pool.query(`
      UPDATE users 
      SET is_online = $1, last_seen = NOW() 
      WHERE user_id = $2
    `, [isOnline, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time messaging`);
});

module.exports = { app, server, io };