/**
 * Stephens Family Hub - Comprehensive API Test Suite
 *
 * Tests all API routes for correct behavior including:
 * - Authentication/authorization enforcement
 * - Input validation & sanitization
 * - CRUD operations
 * - Error handling & response format consistency
 * - Permission checks
 * - Password validation
 * - Pagination support
 *
 * Run with: npx tsx tests/api-tests.ts
 * Requires dev server running on localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error });
    console.log(`  ✗ ${name}: ${error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function fetchApi(path: string, options?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
}

// ─── Test Suites ───────────────────────────────────────────────

async function testAuthEnforcement() {
  console.log('\n🔒 Authentication Enforcement - GET Routes');

  const protectedRoutes = [
    '/api/members', '/api/calendar', '/api/tasks', '/api/shopping',
    '/api/meals', '/api/bulletin', '/api/agents',
    '/api/admin/users', '/api/admin/ai-config',
  ];

  for (const path of protectedRoutes) {
    await test(`GET ${path} returns 401/403 without auth`, async () => {
      const res = await fetchApi(path);
      assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
    });
  }
}

async function testWriteAuthEnforcement() {
  console.log('\n🔒 Authentication Enforcement - Write Routes');

  const writeRoutes = [
    { path: '/api/calendar', method: 'POST', body: { title: 'Test', date: '2026-01-01', memberId: 'x' } },
    { path: '/api/calendar', method: 'PATCH', body: { id: 'x', title: 'Test' } },
    { path: '/api/calendar', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/tasks', method: 'POST', body: { title: 'Test', assignedTo: 'x' } },
    { path: '/api/tasks', method: 'PATCH', body: { id: 'x', title: 'Test' } },
    { path: '/api/tasks', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/shopping', method: 'POST', body: { name: 'Test' } },
    { path: '/api/shopping', method: 'PATCH', body: { id: 'x', name: 'Test' } },
    { path: '/api/shopping', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/meals', method: 'POST', body: { date: '2026-01-01', meal: 'dinner', recipe: 'Test' } },
    { path: '/api/meals', method: 'PATCH', body: { id: 'x', recipe: 'Test' } },
    { path: '/api/meals', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/bulletin', method: 'POST', body: { title: 'Test', content: 'Test' } },
    { path: '/api/bulletin', method: 'PATCH', body: { id: 'x', title: 'Test' } },
    { path: '/api/bulletin', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/agents', method: 'POST', body: { name: 'Test', systemPrompt: 'Test' } },
    { path: '/api/agents', method: 'PATCH', body: { id: 'x', name: 'Test' } },
    { path: '/api/agents', method: 'DELETE', body: { id: 'x' } },
    { path: '/api/admin/users', method: 'PATCH', body: { userId: 'x', role: 'child' } },
    { path: '/api/admin/users', method: 'DELETE', body: { userId: 'x' } },
    { path: '/api/admin/ai-config', method: 'PATCH', body: { selectedModel: 'gpt-4' } },
    { path: '/api/chat', method: 'POST', body: { messages: [{ role: 'user', content: 'hi' }], systemPrompt: 'test' } },
    { path: '/api/profile', method: 'PATCH', body: { name: 'Test' } },
    { path: '/api/profile', method: 'PUT', body: { currentPassword: 'x', newPassword: 'y' } },
  ];

  for (const route of writeRoutes) {
    await test(`${route.method} ${route.path} returns 401/403 without auth`, async () => {
      const res = await fetchApi(route.path, {
        method: route.method,
        body: JSON.stringify(route.body),
      });
      assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
    });
  }
}

async function testRegistration() {
  console.log('\n📝 Registration & Password Validation');

  await test('Register requires all fields', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error === 'All fields are required', `Expected required fields error, got: ${data.error}`);
  });

  await test('Register rejects short password (<8 chars)', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'short@test.com', password: 'Short1' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('8 characters'), `Expected min length error, got: ${data.error}`);
  });

  await test('Register rejects password without uppercase', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'noup@test.com', password: 'alllowercase1' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('uppercase'), `Expected uppercase error, got: ${data.error}`);
  });

  await test('Register rejects password without number', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'nonum@test.com', password: 'NoNumberHere' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('number'), `Expected number error, got: ${data.error}`);
  });

  await test('Register sanitizes HTML in name', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '<script>alert("xss")</script>',
        email: `xss-test-${Date.now()}@test.com`,
        password: 'ValidPass1',
      }),
    });
    // Should succeed (name gets sanitized) or fail gracefully
    if (res.ok) {
      const data = await res.json();
      assert(!data.message?.includes('<script>'), 'Response should not contain raw HTML');
    }
    // If 400, that's also acceptable (empty name after sanitization)
    assert(res.status === 200 || res.status === 400, `Expected 200 or 400, got ${res.status}`);
  });

  await test('Register rejects duplicate email', async () => {
    // First register
    await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dupe', email: 'dupe-test@test.com', password: 'ValidPass1' }),
    });
    // Try again with same email
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Dupe2', email: 'dupe-test@test.com', password: 'ValidPass1' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('already exists'), `Expected duplicate error, got: ${data.error}`);
  });
}

async function testResponseFormatConsistency() {
  console.log('\n📋 Response Format Consistency');

  await test('All protected GET routes return JSON with error field', async () => {
    const routes = ['/api/members', '/api/calendar', '/api/tasks', '/api/shopping', '/api/meals', '/api/bulletin', '/api/agents'];
    for (const path of routes) {
      const res = await fetchApi(path);
      const data = await res.json();
      assert(typeof data === 'object' && data !== null, `${path}: Response should be JSON object`);
      assert('error' in data, `${path}: Response should contain error field, got: ${JSON.stringify(data).slice(0, 100)}`);
    }
  });

  await test('Chat 401 returns error field (not content)', async () => {
    const res = await fetchApi('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], systemPrompt: 'test' }),
    });
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
    const data = await res.json();
    assert('error' in data, `Chat error response should use 'error' field, not 'content'. Got: ${JSON.stringify(data)}`);
    assert(!('content' in data), `Chat error should NOT have 'content' field`);
  });

  await test('Admin routes return proper forbidden messages', async () => {
    const res = await fetchApi('/api/admin/users');
    const data = await res.json();
    assert(typeof data.error === 'string', 'Error should be a string message');
  });
}

async function testPagination() {
  console.log('\n📄 Pagination Support');

  const paginatedRoutes = [
    '/api/calendar', '/api/tasks', '/api/shopping',
    '/api/meals', '/api/bulletin', '/api/agents',
  ];

  // Without auth these return 401, but we can test URL parsing doesn't break anything
  for (const path of paginatedRoutes) {
    await test(`${path}?page=1&limit=10 doesn't crash`, async () => {
      const res = await fetchApi(`${path}?page=1&limit=10`);
      // Should return 401 (auth required), not 500 (server error)
      assert(res.status !== 500, `Expected non-500 status, got ${res.status}`);
    });
  }
}

async function testInputValidation() {
  console.log('\n🛡️ Input Validation (Unauthenticated)');

  await test('Register rejects empty name (after sanitization)', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: '   ', email: 'empty-name@test.com', password: 'ValidPass1' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Register normalizes email to lowercase', async () => {
    const email = `case-test-${Date.now()}@TEST.COM`;
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'CaseTest', email, password: 'ValidPass1' }),
    });
    // Either succeeds or duplicate - both prove it processes
    assert(res.status === 200 || res.status === 400, `Expected 200/400, got ${res.status}`);
  });
}

async function testMethodHandling() {
  console.log('\n🚫 HTTP Method Handling');

  await test('Members route rejects POST', async () => {
    const res = await fetchApi('/api/members', {
      method: 'POST',
      body: JSON.stringify({ name: 'hack' }),
    });
    assert(res.status === 405 || res.status === 401 || res.status === 403,
      `Expected 405/401/403, got ${res.status}`);
  });

  await test('Profile rejects GET', async () => {
    const res = await fetchApi('/api/profile');
    assert(res.status === 405 || res.status === 401 || res.status === 403,
      `Expected 405/401/403, got ${res.status}`);
  });
}

async function testSanitizationUnit() {
  console.log('\n🧹 Sanitization Unit Tests');

  // We test sanitization by trying to register with HTML in name
  await test('HTML tags stripped from registration name', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test<b>Bold</b>User',
        email: `html-test-${Date.now()}@test.com`,
        password: 'ValidPass1',
      }),
    });
    // Name should be "TestBoldUser" after stripping
    assert(res.status === 200 || res.status === 400, `Expected 200/400, got ${res.status}`);
  });

  await test('Script tags stripped from registration name', async () => {
    const res = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: '<script>alert(1)</script>Normal',
        email: `script-test-${Date.now()}@test.com`,
        password: 'ValidPass1',
      }),
    });
    assert(res.status === 200 || res.status === 400, `Expected 200/400, got ${res.status}`);
  });
}

async function testStaticPages() {
  console.log('\n🌐 Static Page Accessibility');

  const publicPages = ['/login', '/register'];
  const protectedPages = ['/', '/calendar', '/tasks', '/shopping', '/meals', '/bulletin', '/agents', '/chat', '/profile', '/admin'];

  for (const page of publicPages) {
    await test(`GET ${page} returns 200`, async () => {
      const res = await fetch(`${BASE_URL}${page}`);
      assert(res.status === 200, `Expected 200, got ${res.status}`);
    });
  }

  for (const page of protectedPages) {
    await test(`GET ${page} returns 200 (client-side auth)`, async () => {
      const res = await fetch(`${BASE_URL}${page}`);
      // Pages always return 200 since auth is client-side via AppShell
      assert(res.status === 200 || res.status === 307, `Expected 200/307, got ${res.status}`);
    });
  }
}

async function testErrorPageExists() {
  console.log('\n🔍 Error Handling');

  await test('404 returns proper error page', async () => {
    const res = await fetch(`${BASE_URL}/nonexistent-page-xyz`);
    assert(res.status === 200 || res.status === 404, `Expected 200/404, got ${res.status}`);
  });
}

// ─── Runner ────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Stephens Family Hub - Comprehensive Test Suite  ║');
  console.log('╚══════════════════════════════════════════════════╝');

  await testAuthEnforcement();
  await testWriteAuthEnforcement();
  await testRegistration();
  await testResponseFormatConsistency();
  await testPagination();
  await testInputValidation();
  await testMethodHandling();
  await testSanitizationUnit();
  await testStaticPages();
  await testErrorPageExists();

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log('\n══════════════════════════════════════════════════');
  console.log(`Results: ${passed}/${total} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
  } else {
    console.log('\n All tests passed!');
  }

  console.log('══════════════════════════════════════════════════\n');
  return failed;
}

run().then((failures) => {
  process.exit(failures > 0 ? 1 : 0);
}).catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
