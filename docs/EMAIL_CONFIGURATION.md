# 📧 Email Configuration for User Verification

## 🚨 CURRENT PROBLEM

**Users are not receiving verification emails** because there is no email configuration in the backend.

## 🔧 QUICK SOLUTION

### 1. Configure Environment Variables

Create `.env.development` file with:

```bash
# Email - MailerSend API (RECOMMENDED)
MAIL_API_KEY="your-mailersend-api-key"
MAIL_FROM="noreply@yourdomain.com"

# Or alternatively, use SMTP
# MAIL_HOST="smtp.yourdomain.com"
# MAIL_PORT="587"
# MAIL_USER="your-email@yourdomain.com"
# MAIL_PASSWORD="your-email-password"

# Other necessary variables
NODE_ENV=development
PORT=4000
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
JWT_SECRET="your-super-secret-jwt-key-with-at-least-32-characters-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-with-at-least-32-characters-long"
CORS_ORIGIN="https://localhost"
FRONTEND_URL="https://localhost"
```

### 2. Get MailerSend API Key

1. Go to [MailerSend](https://mailersend.com)
2. Register and create an account
3. Go to "API Tokens" and create a new token
4. Copy the token to `MAIL_API_KEY`

### 3. Configure Domain

1. In MailerSend, go to "Domains"
2. Add your domain
3. Configure DNS records
4. Use the verified domain in `MAIL_FROM`

## 📋 CURRENT FLOW (AFTER CORRECTION)

### With Email Configured ✅

```
POST /api/auth/register
↓
User created in DB
↓
Email sent successfully
↓
HTTP 201 + message "User registered successfully. Check your email..."
```

### Without Email Configured ❌

```
POST /api/auth/register
↓
User created in DB
↓
Error sending email
↓
HTTP 207 + message "User registered, but could not send verification email..."
```

## 🧪 TESTING

### Test Registration with Email

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!"
  }'
```

### Expected Responses

**With email configured (HTTP 201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "test@example.com",
      "username": "testuser",
      "role": "user",
      "isVerified": false
    },
    "emailSent": true
  },
  "message": "User registered successfully. Check your email to verify your account.",
  "code": "SUCCESS",
  "status": 201
}
```

**Without email configured (HTTP 207):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "test@example.com",
      "username": "testuser",
      "role": "user",
      "isVerified": false
    },
    "emailSent": false,
    "emailError": "Email service not configured..."
  },
  "message": "User registered successfully, but could not send verification email. Contact technical support.",
  "code": "SUCCESS",
  "status": 207
}
```

## 🔧 TEMPORARY SOLUTION (DEVELOPMENT)

If you need to create users for testing without configuring email:

### Option 1: Mark User as Verified

```sql
UPDATE users SET is_verified = true WHERE email = 'test@example.com';
```

### Option 2: Use Token from Logs

1. Register user
2. Find verification token in logs
3. Make POST to `/api/auth/verify-email/{token}`

## 🚀 USEFUL COMMANDS

```bash
# Copy example configuration
cp .env.example .env.development

# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verify configuration
npm run env:dev

# Start server
npm run start:dev
```

## 📝 IMPORTANT NOTES

1. **Security**: Never commit .env files to repository
2. **Production**: Use system environment variables, not .env files
3. **Testing**: Tests automatically mock the email service
4. **Logs**: Check logs to see email configuration messages

---

**✅ After configuring email, users will be able to:**

- Register and receive verification email
- Verify their account by clicking the link
- Successfully login

**❌ Without configuring email:**

- Users register but cannot login
- Need manual account verification
