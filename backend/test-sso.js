/**
 * Test script for SSO endpoints
 * Run with: node test-sso.js
 */

const http = require('http');

// Test SSO login endpoint
function testSSOLogin() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sso/login',
      method: 'GET',
      followRedirect: false, // Don't follow redirects, we want to see the redirect URL
    };

    const req = http.request(options, (res) => {
      console.log(`\n=== SSO Login Test ===`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);

      if (res.statusCode === 302 || res.statusCode === 301) {
        const location = res.headers.location;
        console.log(`\n✅ Redirect to SSO provider:`);
        console.log(`   ${location}`);
        
        if (location && location.includes('sso2.kpi.fei.tuke.sk')) {
          console.log(`\n✅ SUCCESS: SSO login endpoint is working!`);
          console.log(`   The redirect URL contains the SSO provider domain.`);
          resolve({ success: true, redirectUrl: location });
        } else {
          console.log(`\n❌ ERROR: Redirect URL doesn't contain SSO provider`);
          reject(new Error('Invalid redirect URL'));
        }
      } else {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`\nResponse body:`, data);
          if (res.statusCode === 500) {
            console.log(`\n❌ ERROR: Server error - check SSO configuration`);
            reject(new Error(`Server error: ${data}`));
          } else {
            reject(new Error(`Unexpected status code: ${res.statusCode}`));
          }
        });
      }
    });

    req.on('error', (error) => {
      console.error(`\n❌ Request error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Test SSO callback endpoint (should fail without proper parameters)
function testSSOCallback() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sso/callback?error=test_error&error_description=Test',
      method: 'GET',
      followRedirect: false,
    };

    const req = http.request(options, (res) => {
      console.log(`\n=== SSO Callback Test (with error) ===`);
      console.log(`Status Code: ${res.statusCode}`);
      
      if (res.statusCode === 302 || res.statusCode === 301) {
        const location = res.headers.location;
        console.log(`\n✅ Redirect to frontend with error:`);
        console.log(`   ${location}`);
        resolve({ success: true, redirectUrl: location });
      } else {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Response:`, data);
          resolve({ success: false, data });
        });
      }
    });

    req.on('error', (error) => {
      console.error(`Request error:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing SSO Backend Endpoints...\n');
  console.log('Make sure backend is running on port 3001');
  console.log('Make sure SSO environment variables are set\n');

  try {
    await testSSOLogin();
    await testSSOCallback();
    console.log(`\n✅ All tests completed!`);
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    process.exit(1);
  }
}

runTests();

