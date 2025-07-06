# Especificaciones de API para Backend - Node.js + Express

## 🎯 **OBJETIVO PRINCIPAL**
Refactorizar TODAS las respuestas de la API del backend para que sigan una estructura completamente consistente que el frontend React ya está preparado para consumir.

## ⚠️ **REQUISITOS NO NEGOCIABLES**

### **1. ESTRUCTURA OBLIGATORIA - Sin Excepciones**

**TODA respuesta de la API DEBE seguir exactamente esta estructura:**

```typescript
// Respuesta EXITOSA
{
  "success": true,                    // SIEMPRE boolean true
  "data": T | null,                   // Los datos solicitados o null
  "status": number,                   // Código HTTP (200, 201, etc.)
  "code": "SUCCESS",                  // SIEMPRE "SUCCESS" para casos exitosos
  "message": string,                  // Mensaje descriptivo en ESPAÑOL
  "timestamp": string,                // ISO 8601 timestamp (OBLIGATORIO)
  "requestId": string,                // UUID único por request (OBLIGATORIO)
  "meta": object                      // OPCIONAL: paginación, totales, etc.
}

// Respuesta ERROR
{
  "success": false,                   // SIEMPRE boolean false
  "data": null,                       // SIEMPRE null en errores
  "status": number,                   // Código HTTP (400, 401, 500, etc.)
  "code": string,                     // Código semántico (ver lista abajo)
  "message": string,                  // Mensaje de error en ESPAÑOL
  "timestamp": string,                // ISO 8601 timestamp (OBLIGATORIO)
  "requestId": string,                // UUID único por request (OBLIGATORIO)
  "meta": object,                     // OPCIONAL
  "error": {                          // OPCIONAL pero recomendado
    "type": string,                   // validation|server|authentication|authorization|business
    "details": [                      // Array de errores específicos
      {
        "field": string,              // Campo que causó el error
        "code": string,               // Código específico del campo
        "message": string             // Mensaje específico en ESPAÑOL
      }
    ],
    "stack": string                   // SOLO en desarrollo (NODE_ENV !== 'production')
  }
}
```

### **2. MIDDLEWARE OBLIGATORIO**

Implementar este middleware ANTES de todas las rutas:

```javascript
const { v4: uuidv4 } = require('uuid');

// Middleware para añadir requestId a todas las requests
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Middleware para respuestas consistentes
const responseHandler = {
  success: (res, data = null, message = 'Operación exitosa', meta = null) => {
    return res.status(200).json({
      success: true,
      data,
      status: res.statusCode,
      code: 'SUCCESS',
      message,
      timestamp: new Date().toISOString(),
      requestId: res.req.requestId,
      ...(meta && { meta })
    });
  },

  error: (res, statusCode, code, message, errorDetails = null, meta = null) => {
    const errorResponse = {
      success: false,
      data: null,
      status: statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: res.req.requestId,
      ...(meta && { meta })
    };

    if (errorDetails) {
      errorResponse.error = errorDetails;
    }

    return res.status(statusCode).json(errorResponse);
  }
};

// Hacer disponible en todas las respuestas
app.use((req, res, next) => {
  res.apiSuccess = responseHandler.success.bind(null, res);
  res.apiError = responseHandler.error.bind(null, res);
  next();
});
```

## 📋 **CÓDIGOS DE RESPUESTA EXACTOS**

### **Código de Éxito**
```javascript
const API_SUCCESS_CODES = {
  SUCCESS: 'SUCCESS'
};
```

### **Códigos de Error - USAR EXACTAMENTE ESTOS**
```javascript
const API_ERROR_CODES = {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_ALREADY_EXISTS: 'AUTH_USER_ALREADY_EXISTS',
  AUTH_USER_ALREADY_VERIFIED: 'AUTH_USER_ALREADY_VERIFIED',
  AUTH_NO_ACTIVE_SESSION: 'AUTH_NO_ACTIVE_SESSION',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_ALREADY_USED: 'AUTH_TOKEN_ALREADY_USED',
  AUTH_TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  AUTH_TOKEN_MALICIOUS: 'AUTH_TOKEN_MALICIOUS',
  AUTH_TOKEN_OTHER_FLOW: 'AUTH_TOKEN_OTHER_FLOW',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_UPDATE_FAILED: 'AUTH_UPDATE_FAILED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // Resource related
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Network errors (no cambiar estos códigos, son específicos de Axios)
  ERR_NETWORK: 'ERR_NETWORK',
  ERR_CANCELED: 'ERR_CANCELED',
  ECONNABORTED: 'ECONNABORTED',
  ETIMEDOUT: 'ETIMEDOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  // Rate limit & availability
  AUTH_RATE_LIMIT: 'AUTH_RATE_LIMIT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // User related
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_USER_BLOCKED: 'AUTH_USER_BLOCKED'
};
```

## 🔧 **EJEMPLOS ESPECÍFICOS POR ENDPOINT**

### **POST /auth/login - Éxito**
```javascript
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Lógica de autenticación...
    const user = await authenticateUser(email, password);
    const tokens = await generateTokens(user.id);

    return res.apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }, 'Login exitoso');

  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.apiError(401, API_ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Las credenciales proporcionadas son incorrectas');
    }

    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Error interno del servidor');
  }
});
```

### **POST /auth/register - Error de Validación**
```javascript
app.post('/auth/register', async (req, res) => {
  try {
    const validationErrors = validateRegistrationData(req.body);

    if (validationErrors.length > 0) {
      return res.apiError(422, API_ERROR_CODES.VALIDATION_FAILED, 'Los datos enviados no son válidos', {
        type: 'validation',
        details: validationErrors.map(err => ({
          field: err.field,
          code: err.code,
          message: err.message
        }))
      });
    }

    // Lógica de registro...
    const user = await createUser(req.body);

    return res.apiSuccess(null, 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.');

  } catch (error) {
    if (error.code === 'USER_EXISTS') {
      return res.apiError(409, API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS, 'El email ya está registrado');
    }

    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Error interno del servidor');
  }
});
```

### **GET /auth/verify-email/:token - Error de Token**
```javascript
app.get('/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const verificationResult = await verifyEmailToken(token);

    if (!verificationResult.isValid) {
      const errorCode = getTokenErrorCode(verificationResult.reason);
      const errorMessage = getTokenErrorMessage(verificationResult.reason);

      return res.apiError(400, errorCode, errorMessage, {
        type: 'authentication',
        details: [{
          field: 'token',
          code: errorCode,
          message: errorMessage
        }]
      });
    }

    return res.apiSuccess(null, 'Email verificado correctamente');

  } catch (error) {
    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Error interno del servidor');
  }
});

function getTokenErrorCode(reason) {
  switch (reason) {
    case 'EXPIRED': return API_ERROR_CODES.AUTH_TOKEN_EXPIRED;
    case 'INVALID': return API_ERROR_CODES.AUTH_TOKEN_INVALID;
    case 'ALREADY_USED': return API_ERROR_CODES.AUTH_TOKEN_ALREADY_USED;
    case 'REVOKED': return API_ERROR_CODES.AUTH_TOKEN_REVOKED;
    default: return API_ERROR_CODES.AUTH_TOKEN_INVALID;
  }
}

function getTokenErrorMessage(reason) {
  switch (reason) {
    case 'EXPIRED': return 'El enlace de verificación ha expirado';
    case 'INVALID': return 'El enlace de verificación no es válido';
    case 'ALREADY_USED': return 'Este enlace ya ha sido utilizado';
    case 'REVOKED': return 'El enlace de verificación ha sido revocado';
    default: return 'El enlace de verificación no es válido';
  }
}
```

### **GET /users - Lista con Paginación**
```javascript
app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getUsersPaginated(page, limit);

    return res.apiSuccess(
      result.users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      'Usuarios obtenidos exitosamente',
      {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      }
    );

  } catch (error) {
    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Error interno del servidor');
  }
});
```

## 🚨 **MANEJO DE ERRORES GLOBAL**

### **Error Handler Middleware**
```javascript
// Error handler global (DEBE ir al final)
app.use((error, req, res, next) => {
  console.error('Error:', error);

  // Log para Morgan
  req.log = {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId
  };

  // Si ya se envió la respuesta, no hacer nada
  if (res.headersSent) {
    return next(error);
  }

  // Errores de validación de Express Validator
  if (error.type === 'validation') {
    return res.apiError(422, API_ERROR_CODES.VALIDATION_FAILED, 'Los datos enviados no son válidos', {
      type: 'validation',
      details: error.details,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  }

  // Errores de autenticación JWT
  if (error.name === 'JsonWebTokenError') {
    return res.apiError(401, API_ERROR_CODES.AUTH_TOKEN_INVALID, 'Token de acceso inválido');
  }

  if (error.name === 'TokenExpiredError') {
    return res.apiError(401, API_ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Token de acceso expirado');
  }

  // Error de base de datos
  if (error.code === 'ER_DUP_ENTRY') {
    return res.apiError(409, API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS, 'El recurso ya existe');
  }

  // Error genérico
  return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Error interno del servidor', {
    type: 'server',
    ...(process.env.NODE_ENV !== 'production' && {
      details: [{ field: 'server', code: 'INTERNAL_ERROR', message: error.message }],
      stack: error.stack
    })
  });
});

// 404 Handler
app.use('*', (req, res) => {
  return res.apiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, `La ruta ${req.originalUrl} no existe`);
});
```

## 📊 **CONFIGURACIÓN DE MORGAN LOGS**

```javascript
const morgan = require('morgan');

// Token personalizado para requestId
morgan.token('requestId', (req) => req.requestId);
morgan.token('errorDetails', (req) => req.log ? JSON.stringify(req.log) : '');

// Formato de log personalizado
const logFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :requestId :errorDetails'
  : ':method :url :status :response-time ms - :res[content-length] :requestId :errorDetails';

app.use(morgan(logFormat));
```

## ⚡ **CASOS ESPECIALES**

### **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return res.apiError(429, API_ERROR_CODES.AUTH_RATE_LIMIT, 'Demasiados intentos de login. Intenta de nuevo en 15 minutos');
  }
});

app.use('/auth/login', loginLimiter);
```

### **Maintenance Mode**
```javascript
app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.apiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, 'El servicio está en mantenimiento. Intenta más tarde');
  }
  next();
});
```

## 🔒 **VALIDACIONES OBLIGATORIAS**

### **1. NUNCA devolver respuestas que no sigan la estructura**
### **2. SIEMPRE incluir timestamp y requestId**
### **3. SIEMPRE usar los códigos exactos de la lista**
### **4. TODOS los mensajes en ESPAÑOL**
### **5. NEVER usar console.log en producción, usar Morgan**
### **6. SIEMPRE manejar async/await con try/catch**
### **7. NEVER exponer stack traces en producción**

## 🧪 **TESTING**

Cada endpoint DEBE devolver respuestas que cumplan exactamente esta estructura. El frontend ya está preparado para consumir estas respuestas y fallará si no son consistentes.

**Ejemplo de test:**
```javascript
// Verificar estructura de respuesta exitosa
expect(response.body).toHaveProperty('success', true);
expect(response.body).toHaveProperty('data');
expect(response.body).toHaveProperty('status');
expect(response.body).toHaveProperty('code', 'SUCCESS');
expect(response.body).toHaveProperty('message');
expect(response.body).toHaveProperty('timestamp');
expect(response.body).toHaveProperty('requestId');

// Verificar estructura de respuesta de error
expect(response.body).toHaveProperty('success', false);
expect(response.body).toHaveProperty('data', null);
expect(response.body).toHaveProperty('status');
expect(response.body).toHaveProperty('code');
expect(response.body).toHaveProperty('message');
expect(response.body).toHaveProperty('timestamp');
expect(response.body).toHaveProperty('requestId');
```

## 🎯 **RESULTADO ESPERADO**

Después de esta refactorización, TODA respuesta de la API debe ser predecible y consistente. El frontend React + TypeScript ya está completamente preparado para consumir esta estructura exacta.

**NO HAY EXCEPCIONES. TODA respuesta debe seguir esta estructura.**
