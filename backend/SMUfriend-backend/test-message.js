// test-message.js - Test sending a message to your API
async function testSendMessage() {
  const testMessage = {
    id: `test_${Date.now()}`,
    from: '550e8400-e29b-41d4-a716-446655440000', // John Doe's ID
    to: '550e8400-e29b-41d4-a716-446655440001',   // Alice's ID
    message: 'Hello from API test!',
    timestamp: new Date().toISOString(),
    senderInfo: {
      uid: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john.doe.2024@student.smu.edu.sg'
    },
    receiverInfo: {
      uid: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Alice (SOE, Yr 2)'
    }
  };

  try {
    console.log('🧪 Testing message API...');
    console.log('Sending message:', testMessage.message);

    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Message sent successfully!');
    console.log('Response:', result);

    // Now test getting the conversation
    console.log('\n🔍 Testing get conversation...');
    const getResponse = await fetch(`http://localhost:3001/api/conversations/${testMessage.from}/${testMessage.to}`);
    
    if (getResponse.ok) {
      const messages = await getResponse.json();
      console.log('✅ Retrieved messages:', messages.length);
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. "${msg.message}" (${msg.status})`);
      });
    } else {
      console.error('❌ Failed to get conversation');
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('\n💡 Make sure your backend is running on port 3001');
  }
}

testSendMessage();