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
import { timeoutMiddleware } from '../middleware/timeout.js';
import {
  forgotPasswordValidation,
  // idValidation,
  loginValidation,
  logoutValidation,
  // paginationValidation,
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

// Dependency Injection
const userRepository = new PrismaUserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

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
      HTTP_STATUS.TOO_MANY_REQUESTS,
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
  skip: (req, res) => {
    return config.env === 'development' || config.env === 'test';
  },
});

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
  API_ROUTES.AUTH.VERIFY_EMAIL_SENT,
  asyncHandler(authController.verifyEmailSent.bind(authController))
);
router.get(
  API_ROUTES.AUTH.VERIFY_EMAIL_SUCCESS,
  asyncHandler(authController.verifyEmailSuccess.bind(authController))
);
router.get(
  API_ROUTES.AUTH.VERIFY_EMAIL_EXPIRED,
  asyncHandler(authController.verifyEmailExpired.bind(authController))
);
router.get(
  API_ROUTES.AUTH.VERIFY_EMAIL_ALREADY_VERIFIED,
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

export default router;
