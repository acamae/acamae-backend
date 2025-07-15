import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { AuthService } from '../../application/services/AuthService.js';
import { TeamService } from '../../application/services/TeamService.js';
import { UserService } from '../../application/services/UserService.js';
import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { API_ROUTES } from '../../shared/constants/apiRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { config } from '../config/environment.js';
import { AuthController } from '../controllers/AuthController.js';
import { TeamController } from '../controllers/TeamController.js';
import { UserController } from '../controllers/UserController.js';
import { authenticate as authMiddleware, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { timeoutMiddleware } from '../middleware/index.js';
import {
  forgotPasswordValidation,
  idValidation,
  loginValidation,
  logoutValidation,
  paginationValidation,
  refreshTokenValidation,
  registerValidation,
  resendVerificationValidation,
  resetPasswordValidation,
  teamValidation,
  updateUserValidation,
  verifyEmailValidation,
} from '../middleware/validation.js';
import { PrismaSessionTokenRepository } from '../repositories/PrismaSessionTokenRepository.js';
import { PrismaTeamRepository } from '../repositories/PrismaTeamRepository.js';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';

const router = Router();

// --- Dependency Injection ---
// 1. Instanciar el repositorio de infraestructura (implementa la interfaz de dominio)
const userRepository = new PrismaUserRepository();
// 2. Instanciar el servicio de aplicación, inyectando el repositorio
const userService = new UserService(userRepository);
// 3. Instanciar el controlador, inyectando el servicio (y futuros validadores/DTOs si aplica)
const userController = new UserController(userService);
// --- END Dependency Injection ---

// Initialize controllers
const sessionTokenRepository = new PrismaSessionTokenRepository();
const authService = new AuthService(userRepository, sessionTokenRepository);
const authController = new AuthController(authService);
const teamRepository = new PrismaTeamRepository();
const teamService = new TeamService(teamRepository, userRepository);
const teamController = new TeamController(teamService);

// Rate limiter para endpoints críticos de autenticación
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  handler: (req, res) => {
    return res.apiError(
      429,
      API_ERROR_CODES.AUTH_RATE_LIMIT,
      'Too many authentication attempts. Please try again later.',
      {
        type: 'business',
        details: [
          {
            field: 'auth',
            code: API_ERROR_CODES.AUTH_RATE_LIMIT,
            message: 'Too many authentication attempts. Please try again later.',
          },
        ],
      }
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API root route
router.get(
  API_ROUTES.BASE,
  asyncHandler(async (_req, res) => {
    res.json({
      status: 'SUCCESS',
      message: 'Welcome to the Acamae API',
      data: {
        version: process.env.npm_package_version,
        environment: config.env,
        timestamp: new Date().toISOString(),
        documentation: '/api-docs',
        endpoints: {
          health: API_ROUTES.HEALTH,
          auth: {
            login: API_ROUTES.AUTH.LOGIN,
            register: API_ROUTES.AUTH.REGISTER,
            refreshToken: API_ROUTES.AUTH.REFRESH_TOKEN,
            logout: API_ROUTES.AUTH.LOGOUT,
            verifyEmail: API_ROUTES.AUTH.VERIFY_EMAIL,
            resendVerification: API_ROUTES.AUTH.RESEND_VERIFICATION,
            forgotPassword: API_ROUTES.AUTH.FORGOT_PASSWORD,
            resetPassword: API_ROUTES.AUTH.RESET_PASSWORD,
            me: API_ROUTES.AUTH.ME,
          },
          users: {
            getAll: API_ROUTES.USERS.GET_ALL,
            getById: API_ROUTES.USERS.GET_BY_ID,
            updateById: API_ROUTES.USERS.UPDATE_BY_ID,
            deleteById: API_ROUTES.USERS.DELETE_BY_ID,
          },
          teams: {
            getAll: API_ROUTES.TEAMS.GET_ALL,
            getById: API_ROUTES.TEAMS.GET_BY_ID,
            create: API_ROUTES.TEAMS.CREATE,
            updateById: API_ROUTES.TEAMS.UPDATE_BY_ID,
            deleteById: API_ROUTES.TEAMS.DELETE_BY_ID,
          },
        },
      },
    });
  })
);

// API dev route (only in development environment)
if (config.env === 'development') {
  router.get(
    `${API_ROUTES.BASE}/dev`,
    asyncHandler(async (_req, res) => {
      res.json({
        status: 'SUCCESS',
        message: 'Development API Information',
        data: {
          name: 'Esports Management API',
          version: process.env.npm_package_version,
          environment: config.env,
          timestamp: new Date().toISOString(),
          documentation: '/api-docs',
          endpoints: {
            health: API_ROUTES.HEALTH,
            auth: {
              login: API_ROUTES.AUTH.LOGIN,
              register: API_ROUTES.AUTH.REGISTER,
              refreshToken: API_ROUTES.AUTH.REFRESH_TOKEN,
              logout: API_ROUTES.AUTH.LOGOUT,
              verifyEmail: API_ROUTES.AUTH.VERIFY_EMAIL,
              resendVerification: API_ROUTES.AUTH.RESEND_VERIFICATION,
              forgotPassword: API_ROUTES.AUTH.FORGOT_PASSWORD,
              resetPassword: API_ROUTES.AUTH.RESET_PASSWORD,
              me: API_ROUTES.AUTH.ME,
            },
            users: {
              getAll: API_ROUTES.USERS.GET_ALL,
              getById: API_ROUTES.USERS.GET_BY_ID,
              updateById: API_ROUTES.USERS.UPDATE_BY_ID,
              deleteById: API_ROUTES.USERS.DELETE_BY_ID,
            },
            teams: {
              getAll: API_ROUTES.TEAMS.GET_ALL,
              getById: API_ROUTES.TEAMS.GET_BY_ID,
              create: API_ROUTES.TEAMS.CREATE,
              updateById: API_ROUTES.TEAMS.UPDATE_BY_ID,
              deleteById: API_ROUTES.TEAMS.DELETE_BY_ID,
            },
            admin: {
              stats: API_ROUTES.ADMIN.STATS,
              users: API_ROUTES.ADMIN.USERS,
              teams: API_ROUTES.ADMIN.TEAMS,
            },
            manager: {
              dashboard: API_ROUTES.MANAGER.DASHBOARD,
            },
          },
        },
      });
    })
  );

  // Development endpoint to reset rate limit (only in development)
  router.post(
    `${API_ROUTES.BASE}/dev/reset-rate-limit`,
    asyncHandler(async (req, res) => {
      // This endpoint allows developers to reset their own rate limit
      const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

      // Simple approach: return success and let the developer know to restart
      return res.status(HTTP_STATUS.OK).apiSuccess(
        {
          message: 'Rate limit reset requested',
          ip: clientIp,
          timestamp: new Date().toISOString(),
          instructions: [
            '1. Use npm run dev:rate-limit:reset to reset configuration',
            '2. Use npm run docker:restart to apply changes',
            '3. Or wait for the current window to expire (1 minute)',
          ],
          currentConfig: {
            authWindowMs: config.rateLimit.auth.windowMs,
            authMax: config.rateLimit.auth.max,
            generalWindowMs: config.rateLimit.windowMs,
            generalMax: config.rateLimit.max,
          },
        },
        'Rate limit reset instructions for development'
      );
    })
  );
}

// Health check route
router.get(
  API_ROUTES.HEALTH,
  asyncHandler(async (_req, res) => {
    const healthCheck = {
      status: 'SUCCESS',
      message: 'Servidor funcionando correctamente',
      data: {
        environment: config.env,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version,
        checks: {
          server: {
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
              external: Math.round(process.memoryUsage().external / 1024 / 1024),
            },
          },
          database: {
            status: 'unknown',
          },
        },
      },
    };

    // Check database connection
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Simple connection test
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();

      healthCheck.data.checks.database.status = 'healthy';
    } catch (error) {
      healthCheck.data.checks.database.status = 'unhealthy';
      healthCheck.data.checks.database.error = error.message;
      healthCheck.status = 'error';
      healthCheck.message = 'Servidor con problemas de conectividad';
    }

    // Determine overall status
    const allChecksHealthy = Object.values(healthCheck.data.checks).every(
      (check) => check.status === 'healthy'
    );

    if (!allChecksHealthy) {
      healthCheck.status = 'error';
      healthCheck.message = 'Algunos servicios no están funcionando correctamente';
    }

    res.json(healthCheck);
  })
);

// Authentication routes
router.post(
  API_ROUTES.AUTH.LOGIN,
  authLimiter,
  timeoutMiddleware(15000), // 15 second timeout for login
  loginValidation,
  asyncHandler(authController.login.bind(authController))
);
router.post(
  API_ROUTES.AUTH.REGISTER,
  authLimiter,
  timeoutMiddleware(30000), // 30 second timeout for registration
  registerValidation,
  asyncHandler(authController.register.bind(authController))
);
router.post(
  API_ROUTES.AUTH.REFRESH_TOKEN,
  timeoutMiddleware(10000), // 10 second timeout for token refresh
  refreshTokenValidation,
  asyncHandler(authController.refreshToken.bind(authController))
);
router.post(
  API_ROUTES.AUTH.LOGOUT,
  timeoutMiddleware(5000), // 5 second timeout for logout
  logoutValidation,
  asyncHandler(authController.logout.bind(authController))
);
router.post(
  API_ROUTES.AUTH.VERIFY_EMAIL,
  authLimiter,
  timeoutMiddleware(10000), // 10 second timeout for email verification
  verifyEmailValidation,
  asyncHandler(authController.verifyEmail.bind(authController))
);
router.post(
  API_ROUTES.AUTH.VERIFY_EMAIL_RESEND,
  authLimiter,
  timeoutMiddleware(20000), // 20 second timeout for resend (email sending can take time)
  resendVerificationValidation,
  asyncHandler(authController.resendVerification.bind(authController))
);
router.get(
  '/api/auth/verify-email-sent',
  asyncHandler(authController.verifyEmailSent.bind(authController))
);
router.get(
  '/api/auth/verify-email-success',
  asyncHandler(authController.verifyEmailSuccess.bind(authController))
);
router.get(
  '/api/auth/verify-email-expired',
  asyncHandler(authController.verifyEmailExpired.bind(authController))
);
router.get(
  '/api/auth/verify-email-already-verified',
  asyncHandler(authController.verifyEmailAlreadyVerified.bind(authController))
);
router.post(
  API_ROUTES.AUTH.FORGOT_PASSWORD,
  authLimiter,
  timeoutMiddleware(10000),
  forgotPasswordValidation,
  asyncHandler(authController.forgotPassword.bind(authController))
);
router.post(
  API_ROUTES.AUTH.RESET_PASSWORD,
  authLimiter,
  resetPasswordValidation,
  asyncHandler(authController.resetPassword.bind(authController))
);
router.get(
  API_ROUTES.AUTH.ME,
  authMiddleware,
  asyncHandler(authController.getMe.bind(authController))
);

// Users routes
router.get(
  API_ROUTES.USERS.GET_ALL,
  authMiddleware,
  authorize('users', 'read'),
  asyncHandler(userController.getAllUsers.bind(userController))
);
router.get(
  API_ROUTES.USERS.GET_BY_ID,
  authMiddleware,
  authorize('users', 'read'),
  asyncHandler(userController.getUserById.bind(userController))
);
router.put(
  API_ROUTES.USERS.UPDATE_BY_ID,
  authMiddleware,
  authorize('users', 'update'),
  updateUserValidation,
  asyncHandler(userController.updateUser.bind(userController))
);
router.delete(
  API_ROUTES.USERS.DELETE_BY_ID,
  authMiddleware,
  authorize('users', 'delete'),
  asyncHandler(userController.deleteUser.bind(userController))
);

// Teams routes
router.get(
  API_ROUTES.TEAMS.GET_ALL,
  authMiddleware,
  authorize('teams', 'read'),
  asyncHandler(teamController.getAllTeams.bind(teamController))
);
router.get(
  API_ROUTES.TEAMS.GET_BY_ID,
  authMiddleware,
  authorize('teams', 'read'),
  asyncHandler(teamController.getTeamById.bind(teamController))
);
router.post(
  API_ROUTES.TEAMS.CREATE,
  authMiddleware,
  authorize('teams', 'create'),
  teamValidation,
  asyncHandler(teamController.createTeam.bind(teamController))
);
router.put(
  API_ROUTES.TEAMS.UPDATE_BY_ID,
  authMiddleware,
  authorize('teams', 'update'),
  teamValidation,
  asyncHandler(teamController.updateTeam.bind(teamController))
);
router.delete(
  API_ROUTES.TEAMS.DELETE_BY_ID,
  authMiddleware,
  authorize('teams', 'delete'),
  asyncHandler(teamController.deleteTeam.bind(teamController))
);

// TODO: Fix admin routes - commented out temporarily to run compliance tests (TODO: Fix admin routes)
// router.get(
//   API_ROUTES.ADMIN.STATS,
//   authMiddleware,
//   isAdmin(),
//   asyncHandler(async (_req, res) => {
//     res.json({ message: 'Admin stats' });
//   })
// );

// router.get(
//   API_ROUTES.MANAGER.DASHBOARD,
//   authMiddleware,
//   isManagerOrAdmin(),
//   asyncHandler(async (_req, res) => {
//     res.json({ message: 'Manager dashboard' });
//   })
// );

export default router;
