// Script de testing rápido para verificar las mejoras de seguridad
const BASE_URL = 'http://localhost:3000';

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: {}
    };
  }
}

async function testHealthEndpoint() {
  logTest('Health Endpoint');
  
  const result = await makeRequest(`${BASE_URL}/api/health`);
  
  if (result.status === 200) {
    logSuccess('Health endpoint is accessible');
    return true;
  } else {
    logError(`Health endpoint failed: ${result.status}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  logTest('Unauthorized Access Protection');
  
  // Test /api/usuarios without token
  const result = await makeRequest(`${BASE_URL}/api/usuarios`);
  
  if (result.status === 401) {
    logSuccess('Unauthorized access properly blocked');
    return true;
  } else {
    logError(`Expected 401, got ${result.status}`);
    return false;
  }
}

async function testRateLimiting() {
  logTest('Rate Limiting');
  
  log('Making multiple requests to test rate limiting...');
  
  const promises = [];
  for (let i = 0; i < 12; i++) {
    promises.push(makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    }));
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.some(r => r.status === 429);
  
  if (rateLimited) {
    logSuccess('Rate limiting is working');
    return true;
  } else {
    logWarning('Rate limiting may not be working (or limits are high)');
    return false;
  }
}

async function testLoginWithInvalidData() {
  logTest('Login with Invalid Data');
  
  const testCases = [
    {
      name: 'Invalid email format',
      data: { email: 'invalid-email', password: 'password123' }
    },
    {
      name: 'XSS attempt in email',
      data: { email: '<script>alert("xss")</script>@test.com', password: 'password123' }
    },
    {
      name: 'SQL injection attempt',
      data: { email: "admin'; DROP TABLE usuarios; --", password: 'password123' }
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(testCase.data)
    });
    
    if (result.status === 400 || result.status === 401) {
      logSuccess(`${testCase.name}: Properly rejected`);
    } else {
      logError(`${testCase.name}: Expected rejection, got ${result.status}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testValidLogin() {
  logTest('Valid Login');
  
  // First, create a test user
  const createUserResult = await makeRequest(`${BASE_URL}/api/usuarios`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      rol: 'usuario'
    })
  });
  
  if (createUserResult.status !== 201 && createUserResult.status !== 409) {
    logWarning('Could not create test user, trying login anyway...');
  }
  
  // Try to login
  const loginResult = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'testuser@example.com',
      password: 'TestPassword123!'
    })
  });
  
  if (loginResult.status === 200 && loginResult.data.success) {
    logSuccess('Valid login successful');
    return loginResult.data.data.session.accessToken;
  } else {
    logError(`Login failed: ${loginResult.status} - ${loginResult.data.message}`);
    return null;
  }
}

async function testAuthenticatedAccess(token) {
  logTest('Authenticated Access');
  
  if (!token) {
    logError('No token available for testing');
    return false;
  }
  
  // Test /api/auth/me
  const meResult = await makeRequest(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (meResult.status === 200) {
    logSuccess('Authenticated access to /api/auth/me works');
  } else {
    logError(`/api/auth/me failed: ${meResult.status}`);
    return false;
  }
  
  // Test /api/usuarios (should fail for non-admin)
  const usuariosResult = await makeRequest(`${BASE_URL}/api/usuarios`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (usuariosResult.status === 403) {
    logSuccess('Non-admin properly blocked from /api/usuarios');
  } else {
    logWarning(`Expected 403 for non-admin, got ${usuariosResult.status}`);
  }
  
  return true;
}

async function testTokenRefresh(token) {
  logTest('Token Refresh');
  
  if (!token) {
    logError('No token available for testing');
    return false;
  }
  
  // First get a refresh token by logging in again
  const loginResult = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'testuser@example.com',
      password: 'TestPassword123!'
    })
  });
  
  if (loginResult.status !== 200 || !loginResult.data.data.session.refreshToken) {
    logError('Could not get refresh token');
    return false;
  }
  
  const refreshToken = loginResult.data.data.session.refreshToken;
  
  // Test refresh
  const refreshResult = await makeRequest(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: refreshToken
    })
  });
  
  if (refreshResult.status === 200 && refreshResult.data.success) {
    logSuccess('Token refresh successful');
    return true;
  } else {
    logError(`Token refresh failed: ${refreshResult.status}`);
    return false;
  }
}

async function testLogout(token) {
  logTest('Logout');
  
  if (!token) {
    logError('No token available for testing');
    return false;
  }
  
  const logoutResult = await makeRequest(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
  
  if (logoutResult.status === 200 && logoutResult.data.success) {
    logSuccess('Logout successful');
    return true;
  } else {
    logError(`Logout failed: ${logoutResult.status}`);
    return false;
  }
}

async function testSecurityHeaders() {
  logTest('Security Headers');
  
  const result = await makeRequest(`${BASE_URL}/api/health`);
  
  const securityHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ];
  
  let foundHeaders = 0;
  for (const header of securityHeaders) {
    if (result.headers[header.toLowerCase()]) {
      foundHeaders++;
    }
  }
  
  if (foundHeaders > 0) {
    logSuccess(`Found ${foundHeaders}/${securityHeaders.length} security headers`);
  } else {
    logWarning('No security headers found (may be configured elsewhere)');
  }
  
  return true;
}

async function runAllTests() {
  log(`${colors.bold}🚀 Starting Security Tests${colors.reset}`);
  log('=' * 50);
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Invalid Data Protection', fn: testLoginWithInvalidData },
    { name: 'Valid Login', fn: testValidLogin },
    { name: 'Security Headers', fn: testSecurityHeaders }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  let authToken = null;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result === true) {
        passedTests++;
      } else if (typeof result === 'string') {
        // Token returned from login test
        authToken = result;
        passedTests++;
      }
    } catch (error) {
      logError(`Test ${test.name} threw error: ${error.message}`);
    }
  }
  
  // Run authenticated tests if we have a token
  if (authToken) {
    const authTests = [
      { name: 'Authenticated Access', fn: () => testAuthenticatedAccess(authToken) },
      { name: 'Token Refresh', fn: () => testTokenRefresh(authToken) },
      { name: 'Logout', fn: () => testLogout(authToken) }
    ];
    
    for (const test of authTests) {
      try {
        const result = await test.fn();
        if (result === true) {
          passedTests++;
        }
        totalTests++;
      } catch (error) {
        logError(`Test ${test.name} threw error: ${error.message}`);
        totalTests++;
      }
    }
  }
  
  // Summary
  log('\n' + '=' * 50);
  log(`${colors.bold}📊 Test Results:${colors.reset}`);
  log(`Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    logSuccess('All tests passed! 🎉');
  } else {
    logWarning(`${totalTests - passedTests} tests failed or had issues`);
  }
  
  log('\n💡 Note: Some tests may fail if the server is not running or if there are configuration issues.');
  log('Make sure to start the server with: npm run dev');
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthEndpoint,
  testUnauthorizedAccess,
  testRateLimiting,
  testLoginWithInvalidData,
  testValidLogin,
  testAuthenticatedAccess,
  testTokenRefresh,
  testLogout,
  testSecurityHeaders
};
