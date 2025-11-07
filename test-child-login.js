const fetch = require('node-fetch');

async function testChildLogin() {
  const API_URL = 'https://fintoosh-backend.onrender.com';

  try {
    console.log('Testing child login endpoint...');
    console.log('API URL:', API_URL);

    // Test with a known child account (you'll need to replace these with real test credentials)
    const testCredentials = {
      username: 'montu',
      pin: '123456'
    };

    console.log('Sending request with credentials:', {
      username: testCredentials.username,
      pin: '[HIDDEN]'
    });

    const response = await fetch(`${API_URL}/auth/child-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });

    const responseText = await response.text();
    console.log('Response body length:', responseText.length);
    console.log('Response body starts with:', responseText.substring(0, 100) + '...');

    // Check if response is HTML
    if (responseText.trim().startsWith('<')) {
      console.log('❌ ERROR: Server returned HTML instead of JSON!');
      console.log('This indicates a server error or misconfiguration.');
      return;
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS: Valid JSON response');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('❌ ERROR: Invalid JSON response');
      console.log('Parse error:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Health check
async function testHealth() {
  const API_URL = 'https://fintoosh-backend.onrender.com';

  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log('Health check result:', data);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('Testing Fintoosh Backend Child Login');
  console.log('='.repeat(50));

  await testHealth();
  console.log('');
  await testChildLogin();
}

runTests();
