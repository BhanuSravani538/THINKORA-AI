import { api } from '../src/services/api';

// Polyfill localStorage for node environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  } as Storage;
}

async function runAuthIntegrationTests() {
  console.log('===============================================================');
  console.log('🧪 THINKORA Frontend Auth Client Integration Tests');
  console.log('===============================================================');

  const ts = Date.now();
  const testEmail = `fe_test_${ts}@thinkora.test`;
  const testPassword = `TestPass@${ts}`;
  const testFullName = 'Dr. Elena Vance';

  // 1. Test Registration
  console.log('1. Testing frontend registration API call...');
  const regResult = await api.register({
    email: testEmail,
    password: testPassword,
    fullName: testFullName,
    role: 'researcher',
  });

  if (!regResult.success || !regResult.token || !regResult.user) {
    throw new Error('Registration did not return expected payload');
  }
  if (regResult.user.email !== testEmail || regResult.user.fullName !== testFullName) {
    throw new Error('Registration user data mismatch');
  }
  if (localStorage.getItem('token') !== regResult.token) {
    throw new Error('JWT token was not stored in localStorage on registration');
  }
  console.log('✅ [PASS] Registration succeeded and stored auth token');

  // 2. Test Get Current User
  console.log('2. Testing getCurrentUser() profile retrieval...');
  const currentUser = await api.getCurrentUser();
  if (!currentUser || currentUser.email !== testEmail) {
    throw new Error('getCurrentUser() failed to retrieve authenticated profile');
  }
  console.log('✅ [PASS] Profile successfully retrieved with stored token');

  // 3. Test Logout
  console.log('3. Testing logout() session teardown...');
  api.logout();
  if (localStorage.getItem('token') !== null || localStorage.getItem('thinkora_user') !== null) {
    throw new Error('Tokens were not cleared on logout');
  }
  const unauthUser = await api.getCurrentUser();
  if (unauthUser !== null) {
    throw new Error('User profile should be null after logout');
  }
  console.log('✅ [PASS] Logout successfully wiped session from localStorage');

  // 4. Test Login with Valid Credentials
  console.log('4. Testing login() with valid credentials...');
  const loginResult = await api.login({
    email: testEmail,
    password: testPassword,
  });
  if (!loginResult.success || !loginResult.token) {
    throw new Error('Login failed with valid credentials');
  }
  if (localStorage.getItem('token') !== loginResult.token) {
    throw new Error('Login failed to update localStorage token');
  }
  console.log('✅ [PASS] Login succeeded and refreshed session in storage');

  // 5. Test Login with Invalid Credentials
  console.log('5. Testing login() with invalid password rejection...');
  let threw = false;
  try {
    await api.login({
      email: testEmail,
      password: 'WrongPassword999',
    });
  } catch (err: any) {
    threw = true;
    if (err.statusCode !== 401) {
      throw new Error(`Expected status 401, got ${err.statusCode}`);
    }
  }
  if (!threw) {
    throw new Error('Login should have thrown an error for invalid credentials');
  }
  console.log('✅ [PASS] Invalid login credentials properly rejected with ApiError (401)');

  console.log('===============================================================');
  console.log('🏁 Frontend Auth Integration Tests: 5 / 5 passed.');
  console.log('===============================================================');
}

runAuthIntegrationTests().catch(err => {
  console.error('❌ Frontend auth integration tests failed:', err);
  process.exit(1);
});
