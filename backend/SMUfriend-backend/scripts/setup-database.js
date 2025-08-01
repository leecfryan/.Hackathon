// scripts/setup-database.js
const { Pool } = require('pg');
require('dotenv').config();

const schema = `
-- PostgreSQL Chat Application Database Schema
-- Enable UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS table (enhanced for chat)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    year_of_enrollment INTEGER CHECK (year_of_enrollment IN (1, 2, 3, 4)),
    gender VARCHAR(10) CHECK (gender IN ('m', 'f', 'other')),
    verified BOOLEAN DEFAULT FALSE,
    faculty VARCHAR(100),
    
    -- Additional fields for chat functionality
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INTERESTS table
CREATE TABLE IF NOT EXISTS interests (
    interest_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BUILDINGS table
CREATE TABLE IF NOT EXISTS buildings (
    building_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLACES table
CREATE TABLE IF NOT EXISTS places (
    place_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(building_id) ON DELETE CASCADE,
    place_name VARCHAR(255) NOT NULL,
    place_type VARCHAR(50) CHECK (place_type IN ('study', 'eat', 'social', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REQUESTS table (for matching system)
CREATE TABLE IF NOT EXISTS requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) CHECK (activity_type IN ('lunch', 'dinner', 'breakfast', 'study')),
    preferred_gender VARCHAR(10) CHECK (preferred_gender IN ('m', 'f', 'any')),
    preferred_faculty VARCHAR(100),
    preferred_year INTEGER CHECK (preferred_year IN (1, 2, 3, 4)),
    meeting_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('pending', 'matched', 'expired', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- MATCHES table
CREATE TABLE IF NOT EXISTS matches (
    match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_a_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
    request_b_id UUID REFERENCES requests(request_id) ON DELETE CASCADE,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active'
);

-- CONVERSATIONS table (enhanced for chat)
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(match_id) ON DELETE CASCADE,
    conversation_type VARCHAR(20) CHECK (conversation_type IN ('match', 'direct', 'group')) DEFAULT 'match',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional fields for chat management
    is_active BOOLEAN DEFAULT TRUE,
    archived_by TEXT[], -- Array to store user IDs who archived this chat
    
    UNIQUE(match_id) -- One conversation per match
);

-- CONVERSATION_PARTICIPANTS table
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Chat-specific fields
    last_read_at TIMESTAMP WITH TIME ZONE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES table (enhanced for chat features)
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
    
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Message status tracking
    delivery_status VARCHAR(20) CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
    
    -- For file/image messages
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- For system messages (user joined, left, etc.)
    system_data JSONB,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(user_id)
);

-- MESSAGE_READS table (for read receipts)
CREATE TABLE IF NOT EXISTS message_reads (
    message_id UUID REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (message_id, user_id)
);

-- REPORTS table
CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(place_id) ON DELETE CASCADE,
    reported_level VARCHAR(20) CHECK (reported_level IN ('low', 'medium', 'high', 'very_high')),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE
);

-- VERIFICATION_TOKENS table
CREATE TABLE IF NOT EXISTS verification_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token_type VARCHAR(20) CHECK (token_type IN ('email_verification', 'password_reset')) DEFAULT 'email_verification',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_faculty_year ON users(faculty, year_of_enrollment);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_updated ON conversations(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_expires ON requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);

CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_conversation_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_updated = NOW() 
    WHERE conversation_id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_updated();

-- Sample data for testing (optional)
INSERT INTO users (user_id, email, password, display_name, faculty, year_of_enrollment) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john.doe.2024@student.smu.edu.sg', 'temp_password_123', 'John Doe', 'School of Engineering', 2),
('550e8400-e29b-41d4-a716-446655440001', 'alice.smith.2023@student.smu.edu.sg', 'temp_password_456', 'Alice (SOE, Yr 2)', 'School of Engineering', 2)
ON CONFLICT (email) DO NOTHING;

-- Create a sample conversation
INSERT INTO conversations (conversation_id, conversation_type) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'direct')
ON CONFLICT (conversation_id) DO NOTHING;

-- Add participants
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (conversation_id, user_id) DO NOTHING;
`;

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    console.log('📝 Running schema setup...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    console.log('🔍 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;