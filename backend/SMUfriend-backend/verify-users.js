// verify-users.js - Check if the user IDs exist in database
const { Pool } = require('pg');
require('dotenv').config();

async function verifyUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking if user IDs exist in database...\n');

    const johnId = '550e8400-e29b-41d4-a716-446655440000';
    const aliceId = '550e8400-e29b-41d4-a716-446655440001';

    // Check John
    const johnResult = await pool.query('SELECT user_id, email, display_name FROM users WHERE user_id = $1', [johnId]);
    console.log('👤 John Doe check:');
    if (johnResult.rows.length > 0) {
      console.log('  ✅ Found:', johnResult.rows[0].display_name, '(', johnResult.rows[0].email, ')');
    } else {
      console.log('  ❌ NOT FOUND with ID:', johnId);
    }

    // Check Alice  
    const aliceResult = await pool.query('SELECT user_id, email, display_name FROM users WHERE user_id = $1', [aliceId]);
    console.log('\n👤 Alice check:');
    if (aliceResult.rows.length > 0) {
      console.log('  ✅ Found:', aliceResult.rows[0].display_name, '(', aliceResult.rows[0].email, ')');
    } else {
      console.log('  ❌ NOT FOUND with ID:', aliceId);
    }

    // List all users in database
    console.log('\n📋 All users in database:');
    const allUsers = await pool.query('SELECT user_id, email, display_name FROM users ORDER BY email');
    if (allUsers.rows.length === 0) {
      console.log('  ❌ No users found in database!');
    } else {
      allUsers.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.display_name}`);
        console.log(`     ID: ${user.user_id}`);
        console.log(`     Email: ${user.email}\n`);
      });
    }

    // Check if sample conversation exists
    console.log('💬 Checking sample conversation:');
    const convResult = await pool.query('SELECT conversation_id, conversation_type FROM conversations');
    if (convResult.rows.length > 0) {
      console.log('  ✅ Found conversations:', convResult.rows.length);
      convResult.rows.forEach(conv => {
        console.log(`    - ${conv.conversation_type}: ${conv.conversation_id}`);
      });
    } else {
      console.log('  ❌ No conversations found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyUsers();