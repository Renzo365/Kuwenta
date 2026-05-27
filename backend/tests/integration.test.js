const test = require('node:test');
const assert = require('node:assert');
const express = require('express');

// Import routes and auth helper
const authRoutes = require('../routes/auth');
const transactionRoutes = require('../routes/transactions');
const { generateAccessToken } = require('../middleware/authMiddleware');

// Set up Express application for testing
const app = express();
app.use(express.json());

// Mount routes (no manual injection of req.user, let authenticateJWT handle it)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// Spin up a test server on a random port
let server;
let baseUrl;
let validToken;

test.before(() => {
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      
      // Generate a valid JWT token signed with the test secret
      const testUser = { id: 1, username: 'test_user', email: 'test@school.edu' };
      validToken = generateAccessToken(testUser);
      
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('Test server stopped.');
      resolve();
    });
  });
});

// Test Suite: Input validation schema checks
test('Authentication Registration Input Validation', async (t) => {
  
  await t.test('Should return 400 Bad Request if fields are empty', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const body = await res.json();
    
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Validation failed');
    assert.ok(body.errors.length > 0);
    
    const fieldsWithErrors = body.errors.map(err => err.field);
    assert.ok(fieldsWithErrors.includes('username'));
    assert.ok(fieldsWithErrors.includes('email'));
    assert.ok(fieldsWithErrors.includes('password'));
  });

  await t.test('Should return 400 Bad Request if password is too short', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'student',
        email: 'student@university.edu',
        password: '123' // too short
      })
    });

    const body = await res.json();

    assert.strictEqual(res.status, 400);
    const passwordError = body.errors.find(err => err.field === 'password');
    assert.ok(passwordError);
    assert.strictEqual(passwordError.message, 'Password must be at least 8 characters long');
  });

  await t.test('Should return 400 Bad Request if email format is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'student',
        email: 'invalid_email_format',
        password: 'securepassword123'
      })
    });

    const body = await res.json();

    assert.strictEqual(res.status, 400);
    const emailError = body.errors.find(err => err.field === 'email');
    assert.ok(emailError);
    assert.strictEqual(emailError.message, 'Please provide a valid email address');
  });
});

test('Transaction CRUD Schema Validation', async (t) => {

  await t.test('Should return 401 Unauthorized if authorization header is missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 15.50,
        type: 'expense',
        categoryId: 1,
        transactionDate: '2026-05-27'
      })
    });

    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Access denied. No token provided.');
  });

  await t.test('Should return 400 Bad Request if transaction amount is negative', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        amount: -15.50, // invalid
        type: 'expense',
        categoryId: 1,
        transactionDate: '2026-05-27',
        paymentMethod: 'cash'
      })
    });

    const body = await res.json();

    assert.strictEqual(res.status, 400);
    const amountError = body.errors.find(err => err.field === 'amount');
    assert.ok(amountError);
    assert.strictEqual(amountError.message, 'Amount must be greater than 0');
  });

  await t.test('Should return 400 Bad Request if transaction type is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        amount: 15.50,
        type: 'invalid_type', // invalid
        categoryId: 1,
        transactionDate: '2026-05-27',
        paymentMethod: 'cash'
      })
    });

    const body = await res.json();

    assert.strictEqual(res.status, 400);
    const typeError = body.errors.find(err => err.field === 'type');
    assert.ok(typeError);
    assert.strictEqual(typeError.message, "Type must be either 'income' or 'expense'");
  });
});
