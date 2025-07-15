# Rate Limit Reset - Development Guide

This guide explains how to reset rate limits during development to avoid blocks during testing.

## 🔄 Methods to Reset Rate Limit

### **1. Automatic Script (Recommended)**

```bash
# Reset rate limit for development
npm run dev:rate-limit:reset

# View current configuration
npm run dev:rate-limit:show

# Restart server to apply changes
npm run docker:restart
```

### **2. Manual Environment Variables**

Edit `.env.development` and add:

```bash
# Rate Limit for Development (industry standard)
RATE_LIMIT_AUTH_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_AUTH_MAX=10              # 10 attempts per 15 minutes
RATE_LIMIT_WINDOW_MS=900000         # 15 minutes
RATE_LIMIT_MAX=500                  # 500 requests per 15 minutes
```

### **3. Development Endpoint (Dynamic)**

```bash
# Reset rate limit for your current IP
curl -X POST https://localhost/api/dev/reset-rate-limit
```

**Successful response:**

```json
{
  "success": true,
  "data": {
    "message": "Rate limit reset requested",
    "ip": "192.168.1.100",
    "timestamp": "2025-07-14T15:45:00.000Z",
    "instructions": [
      "1. Use npm run dev:rate-limit:reset to reset configuration",
      "2. Use npm run docker:restart to apply changes",
      "3. Or wait for the current window to expire (15 minutes)"
    ],
    "currentConfig": {
      "authWindowMs": 900000,
      "authMax": 10,
      "generalWindowMs": 900000,
      "generalMax": 500
    }
  },
  "status": 200,
  "message": "Rate limit reset instructions for development",
  "timestamp": "2025-07-14T15:45:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 📊 Environment Configurations

### **Development (After Reset)**

- **Auth Rate Limit**: 10 attempts per 15 minutes
- **General Rate Limit**: 500 requests per 15 minutes
- **Time Window**: 15 minutes (both)

### **Production (Original)**

- **Auth Rate Limit**: 5 attempts per 15 minutes
- **General Rate Limit**: 200 requests per 15 minutes
- **Time Window**: 15 minutes (both)

### **Testing**

- **Auth Rate Limit**: 1000 attempts per second
- **General Rate Limit**: 1000 requests per second
- **Time Window**: 1 second

## 🛠️ Available Scripts

### **npm run dev:rate-limit:reset**

- Resets configuration for development
- Sets more permissive limits
- Updates `.env.development`

### **npm run dev:rate-limit:show**

- Shows current configuration
- Lists all rate limit variables

### **Manual Script**

```bash
node scripts/dev-rate-limit-reset.js [option]

Options:
  reset     - Reset rate limit (default)
  show      - Show current configuration
  help      - Show help
```

## 🔧 Advanced Configuration

### **Customize Limits**

Edit `scripts/dev-rate-limit-reset.js`:

```javascript
const devConfig = [
  '',
  '# Rate Limit Configuration for Development',
  'RATE_LIMIT_AUTH_WINDOW_MS=30000', // 30 seconds
  'RATE_LIMIT_AUTH_MAX=50', // 50 attempts per 30 seconds
  'RATE_LIMIT_WINDOW_MS=120000', // 2 minutes
  'RATE_LIMIT_MAX=500', // 500 requests per 2 minutes
];
```

### **Disable Rate Limit (Testing Only)**

```bash
# In .env.development
RATE_LIMIT_AUTH_WINDOW_MS=1000
RATE_LIMIT_AUTH_MAX=999999
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX=999999
```

## 🚨 Troubleshooting

### **Error: Rate limit doesn't reset**

1. **Verify server is restarted:**

   ```bash
   npm run docker:restart
   ```

2. **Verify configuration:**

   ```bash
   npm run dev:rate-limit:show
   ```

3. **Clear browser cache** or use incognito mode

### **Error: Endpoint not available**

- Verify that `NODE_ENV=development`
- Verify that server is running
- Check logs: `npm run docker:logs`

### **Error: Configuration doesn't apply**

1. **Check .env.development file:**

   ```bash
   cat .env.development | grep RATE_LIMIT
   ```

2. **Recreate configuration file:**
   ```bash
   npm run env:setup
   npm run dev:rate-limit:reset
   ```

## 📝 Important Notes

### **Security**

- Development endpoints are only available in `NODE_ENV=development`
- Never use development configurations in production
- Dynamic resets only affect the client's IP

### **Development**

- Rate limit resets automatically in tests
- Development limits are much more permissive
- Always restart server after changing configuration

### **Testing**

- Tests use special configuration with very high limits
- Rate limit is mocked in integration tests
- See `jest.setup.js` for test configuration

## 🔄 Recommended Workflow

### **When starting development:**

```bash
npm run dev:rate-limit:reset
npm run docker:restart
```

### **During development (if you get blocked):**

```bash
# Option 1: Dynamic reset
curl -X POST https://localhost/api/dev/reset-rate-limit

# Option 2: Complete reset
npm run dev:rate-limit:reset
npm run docker:restart
```

### **Before commit:**

```bash
# Restore original configuration (optional)
# Default values are restored automatically
```

## 📚 References

- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Rate Limiting Best Practices](https://expressjs.com/en/advanced/best-practices-performance.html#use-rate-limiting)
- [Security Headers](https://helmetjs.com/)
