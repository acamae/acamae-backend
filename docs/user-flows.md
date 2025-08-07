# User Authentication Flows

## Overview

This document explains how user authentication works in the Acamae platform. It covers the three main flows that new developers need to understand when working with authentication features.

**Target Audience**: New developers, frontend developers, and anyone implementing authentication features.

## Table of Contents

- [User Registration Flow](#user-registration-flow)
- [Email Verification Flow](#email-verification-flow)
- [Password Reset Flow](#password-reset-flow)
- [Implementation Guide](#implementation-guide)
- [Testing These Flows](#testing-these-flows)

---

## User Registration Flow

### What Happens

1. User fills out registration form (email, username, password)
2. Frontend validates the form
3. API creates user account
4. System sends verification email
5. User sees "check your email" page

### Key Points

- **Email is sent BEFORE user creation** (prevents orphaned users)
- **User can't log in** until email is verified
- **Strong password validation** is enforced
- **Duplicate email/username** is prevented

### API Endpoints

```
POST /auth/register
```

**Success Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "newuser@example.com",
    "username": "newuser",
    "role": "user"
  },
  "status": 201,
  "code": "SUCCESS",
  "message": "User registered successfully. Check your email to verify your account."
}
```

**Common Errors**:

- `409 AUTH_EMAIL_ALREADY_EXISTS` - Email already registered
- `409 AUTH_USER_ALREADY_EXISTS` - Username already taken
- `422 VALIDATION_ERROR` - Invalid email/password format
- `503 SERVICE_UNAVAILABLE` - Email service down

### Frontend Components

- `RegisterForm` - The registration form
- `RegisterPage` - Page containing the form
- `EmailVerificationSentPage` - Success page after registration

---

## Email Verification Flow

### What Happens

1. User clicks verification link in email
2. Frontend extracts token from URL
3. API validates the token
4. User account is activated
5. User can now log in

### Key Points

- **Tokens expire** after a certain time
- **One-time use** - token can't be reused
- **User gets clear feedback** on success/failure
- **Resend option** available if needed

### API Endpoints

```
GET /auth/verify-email/{token}
POST /auth/verify-email-resend
```

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "user@example.com",
    "username": "user123",
    "role": "user"
  },
  "status": 200,
  "code": "SUCCESS",
  "message": "Email verified successfully"
}
```

**Common Errors**:

- `401 AUTH_TOKEN_EXPIRED` - Verification link expired
- `401 AUTH_TOKEN_INVALID` - Invalid verification link
- `409 AUTH_USER_ALREADY_VERIFIED` - User already verified

### Frontend Components

- `EmailVerificationPage` - Handles the verification process
- `EmailVerificationSuccessPage` - Success confirmation
- `EmailVerificationErrorPage` - Error handling
- `EmailVerificationExpiredPage` - Expired token handling
- `ResendVerificationForm` - Resend verification email

---

## Password Reset Flow

### What Happens

1. User requests password reset (enters email)
2. System sends reset email
3. User clicks reset link
4. **Token validation** happens first (POST request)
5. If valid, user sees password reset form
6. User enters new password
7. **Password update** happens (PUT request)
8. User can log in with new password

### Key Points

- **Two-step process**: validate token, then update password
- **REST semantics**: POST for validation, PUT for update
- **Tokens expire** for security
- **Strong password validation** is enforced

### API Endpoints

```
POST /auth/forgot-password
POST /auth/reset-password/{token}  # Validate token
PUT /auth/reset-password/{token}   # Update password
```

**Step 1 - Request Reset**:

```json
// POST /auth/forgot-password
{
  "success": true,
  "data": null,
  "status": 200,
  "code": "SUCCESS",
  "message": "We have sent you a link to reset your password"
}
```

**Step 2 - Validate Token**:

```json
// POST /auth/reset-password/{token}
{
  "success": true,
  "data": {
    "isValid": true,
    "isExpired": false,
    "userExists": true
  },
  "status": 200,
  "code": "SUCCESS",
  "message": "Token validation successful"
}
```

**Step 3 - Update Password**:

```json
// PUT /auth/reset-password/{token}
{
  "success": true,
  "data": null,
  "status": 200,
  "code": "SUCCESS",
  "message": "Password has been reset successfully"
}
```

**Common Errors**:

- `404 AUTH_USER_NOT_FOUND` - Email not found
- `400 AUTH_TOKEN_EXPIRED` - Reset link expired
- `404 INVALID_RESET_TOKEN` - Invalid reset link
- `409 AUTH_TOKEN_ALREADY_USED` - Reset link already used
- `422 VALIDATION_ERROR` - Weak password

### Frontend Components

- `ForgotPasswordForm` - Request password reset
- `ForgotPasswordPage` - Page for requesting reset
- `ResetPasswordForm` - Form to enter new password
- `ResetPasswordPage` - Page for resetting password
- `PasswordResetSuccessPage` - Success confirmation

---

## Implementation Guide

### For Frontend Developers

#### 1. Using Authentication Hooks

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <LoginPrompt />;

  return <div>Welcome, {user.username}!</div>;
}
```

#### 2. Making API Calls

```typescript
import { authRepository } from '@/infrastructure/api/AuthApiRepository';

async function registerUser(userData) {
  try {
    const result = await authRepository.register(userData);
    // result has the standard API structure
    console.log('Success:', result.message);
    return result.data;
  } catch (error) {
    // error also has the standard structure
    console.log('Error:', error.message);
    console.log('Error code:', error.code);
    throw error;
  }
}
```

#### 3. Handling Form Validation

```typescript
import { useForm } from '@/hooks/useForm';
import { validateRegistration } from '@/domain/services/validationService';

function RegisterForm() {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm({
    initialValues: { email: '', username: '', password: '' },
    validate: validateRegistration,
    onSubmit: registerUser,
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### For Backend Developers

#### Response Structure

**Always use this structure**:

```javascript
// Success
res.status(200).json({
  success: true,
  data: userData,
  status: 200,
  code: 'SUCCESS',
  message: 'Operation completed successfully',
  timestamp: new Date().toISOString(),
  requestId: req.requestId,
});

// Error
res.status(400).json({
  success: false,
  data: null,
  status: 400,
  code: 'VALIDATION_ERROR',
  message: 'The submitted data is not valid',
  timestamp: new Date().toISOString(),
  requestId: req.requestId,
  error: {
    type: 'validation',
    details: [{ field: 'email', code: 'INVALID_FORMAT', message: 'Invalid email format' }],
  },
});
```

---

## Testing These Flows

### Unit Tests

Test individual components and functions:

```javascript
describe('RegisterForm', () => {
  test('should validate email format', () => {
    const errors = validateRegistration({ email: 'invalid-email' });
    expect(errors.email).toBe('Invalid email format');
  });

  test('should submit valid data', async () => {
    const mockRegister = jest.fn().mockResolvedValue({ success: true });
    // Test implementation
  });
});
```

### Integration Tests

Test complete flows:

```javascript
describe('Registration Flow', () => {
  test('should complete registration and show success page', async () => {
    // 1. Fill form
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Username'), 'testuser');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123!');

    // 2. Submit form
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    // 3. Verify success page
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
  });
});
```

### E2E Tests (Cypress)

Test real user scenarios:

```javascript
describe('User Registration', () => {
  it('should register a new user', () => {
    cy.visit('/register');
    cy.get('[data-testid="email"]').type('test@example.com');
    cy.get('[data-testid="username"]').type('testuser');
    cy.get('[data-testid="password"]').type('Password123!');
    cy.get('[data-testid="submit"]').click();

    cy.url().should('include', '/verification-sent');
    cy.contains('Check your email').should('be.visible');
  });
});
```

---

## Common Issues & Solutions

### Issue: "User can't log in after registration"

**Solution**: Check if email verification is required. User must verify email first.

### Issue: "Email verification link doesn't work"

**Solution**: Check if token has expired or if it's a one-time-use token that was already used.

### Issue: "Password reset not working"

**Solution**: Verify the two-step process - token validation first, then password update.

### Issue: "API returns different structure"

**Solution**: Ensure backend follows the standard API response structure (see API Specification).

---

## Next Steps

- **Read the API Specification**: `docs/api-specification.md`
- **Check the OpenAPI docs**: `docs/swagger.yml`
- **Look at example implementations**: `src/infrastructure/api/AuthApiRepository.ts`
- **Run the tests**: `npm test` to see working examples

**Remember**: Authentication is critical for security. Always test thoroughly and follow the established patterns!
