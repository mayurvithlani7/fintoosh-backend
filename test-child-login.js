const https = require('https');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

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

    const response = await makeRequest(`${API_URL}/api/auth/child-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log('Response status:', response.statusCode);
    console.log('Response headers:', {
      'content-type': response.headers['content-type'],
      'content-length': response.headers['content-length']
    });

    console.log('Response body length:', response.data.length);
    console.log('Response body starts with:', response.data.substring(0, 100) + '...');

    // Check if response is HTML
    if (response.data.trim().startsWith('<')) {
      console.log('❌ ERROR: Server returned HTML instead of JSON!');
      console.log('This indicates a server error or misconfiguration.');
      return;
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(response.data);
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
    const response = await makeRequest(`${API_URL}/api/health`);
    console.log('Health check result:', JSON.parse(response.data));
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
