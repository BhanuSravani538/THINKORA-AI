import express from 'express';
import http from 'http';
import authRouter from '../routes/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { dbStore } from '../db/store.js';
import { verifyToken } from '../utils/tokens.js';

async function runAuthTests() {
  console.log('======================================================');
  console.log('🧪 THINKORA Authentication & Security Test Suite');
  console.log('======================================================');

  // Ensure DB store is initialized
  await dbStore.initStore();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start test HTTP server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}/api/auth`;

  try {
    const timestamp = Date.now();
    const testEmail = `auth_test_${timestamp}@thinkora.test`;
    const testPassword = `SecureP@ss${timestamp}`;
    const testFullName = 'Dr. Test Researcher';

    // -------------------------------------------------------------------------
    // TEST 1: Register New User
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Register New User with Valid Credentials ---');
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
        role: 'researcher',
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.success || !regData.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    if (!regData.user || regData.user.email !== testEmail) {
      throw new Error(`Registration user data mismatch: ${JSON.stringify(regData.user)}`);
    }
    // Verify password is NEVER leaked
    if (regData.user.password || regData.user.passwordHash) {
      throw new Error('CRITICAL SECURITY LEAK: Password or hash exposed in registration response');
    }
    console.log('✅ [PASS] Successfully registered user and received valid JWT token');

    // Verify token structure
    const decoded = verifyToken(regData.token);
    if (decoded.email !== testEmail || decoded.userId !== regData.user.id) {
      throw new Error(`Token payload mismatch: ${JSON.stringify(decoded)}`);
    }
    console.log('✅ [PASS] JWT token cryptographically signed and verified');

    // -------------------------------------------------------------------------
    // TEST 2: Duplicate Email Registration Blocked
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Duplicate Email Registration Prevention ---');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Duplicate User',
        role: 'researcher',
      }),
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict, received ${dupRes.status}`);
    }
    console.log('✅ [PASS] Duplicate email registration blocked with HTTP 409 Conflict');

    // -------------------------------------------------------------------------
    // TEST 3: Password Complexity Enforcement
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Password Complexity & Validation ---');
    // Short password (< 8 chars)
    const shortRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `short_${timestamp}@thinkora.test`,
        password: 'Pass1',
        fullName: 'Short Pass',
      }),
    });
    if (shortRes.status !== 400) {
      throw new Error(`Expected 400 for short password, got ${shortRes.status}`);
    }

    // Missing uppercase
    const noUpperRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `noupper_${timestamp}@thinkora.test`,
        password: 'password123',
        fullName: 'No Upper',
      }),
    });
    if (noUpperRes.status !== 400) {
      throw new Error(`Expected 400 for missing uppercase, got ${noUpperRes.status}`);
    }

    // Missing number
    const noDigitRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nodigit_${timestamp}@thinkora.test`,
        password: 'PasswordOnly',
        fullName: 'No Digit',
      }),
    });
    if (noDigitRes.status !== 400) {
      throw new Error(`Expected 400 for missing digit, got ${noDigitRes.status}`);
    }
    console.log('✅ [PASS] Server enforces minimum 8 chars, 1 uppercase, and 1 digit validation');

    // -------------------------------------------------------------------------
    // TEST 4: Login with Valid Credentials
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Login with Valid Credentials ---');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.success || !loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    if (loginData.user.email !== testEmail || !loginData.user.id) {
      throw new Error(`User payload mismatch on login: ${JSON.stringify(loginData.user)}`);
    }
    console.log('✅ [PASS] Login successful with valid credentials');

    // -------------------------------------------------------------------------
    // TEST 5: Login with Wrong Password
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Login with Invalid Password ---');
    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'IncorrectPassword999',
      }),
    });
    if (wrongPassRes.status !== 401) {
      throw new Error(`Expected 401 for wrong password, got ${wrongPassRes.status}`);
    }
    console.log('✅ [PASS] Login with invalid password rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // TEST 6: Login with Nonexistent Email
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Login with Nonexistent Email ---');
    const noUserRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent_${timestamp}@thinkora.test`,
        password: 'SomePassword1',
      }),
    });
    if (noUserRes.status !== 401) {
      throw new Error(`Expected 401 for nonexistent user, got ${noUserRes.status}`);
    }
    console.log('✅ [PASS] Login with nonexistent email rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // TEST 7: Protected Route /api/auth/me with Valid Token
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Access /api/auth/me with Bearer Token ---');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${loginData.token}`,
      },
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || !meData.success || meData.user.email !== testEmail) {
      throw new Error(`GET /me failed: ${JSON.stringify(meData)}`);
    }
    console.log('✅ [PASS] /api/auth/me successfully returned authenticated profile');

    // -------------------------------------------------------------------------
    // TEST 8: Protected Route /api/auth/me without Token
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Access /api/auth/me without Token ---');
    const noTokenRes = await fetch(`${baseUrl}/me`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated /me, got ${noTokenRes.status}`);
    }
    console.log('✅ [PASS] Unauthenticated access to /api/auth/me rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // TEST 9: Protected Route /api/auth/me with Invalid Token
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Access /api/auth/me with Invalid Token ---');
    const badTokenRes = await fetch(`${baseUrl}/me`, {
      headers: {
        Authorization: 'Bearer invalid.tampered.token',
      },
    });
    if (badTokenRes.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${badTokenRes.status}`);
    }
    console.log('✅ [PASS] Tampered or invalid token rejected with HTTP 401');

    console.log('\n======================================================');
    console.log('🎉 ALL 9 AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runAuthTests().catch((err) => {
  console.error('❌ Auth test suite failed:', err);
  process.exit(1);
});
