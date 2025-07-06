import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { AuthService } from '../../application/services/AuthService.js';
import { TeamService } from '../../application/services/TeamService.js';
import { UserService } from '../../application/services/UserService.js';
import { API_ROUTES } from '../../shared/constants/apiRoutes.js';
import { config } from '../config/environment.js';
import { AuthController } from '../controllers/AuthController.js';
import { TeamController } from '../controllers/TeamController.js';
import { UserController } from '../controllers/UserController.js';
import {
  authenticate as authMiddleware,
  authorize,
  isAdmin,
  isManagerOrAdmin,
} from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  loginValidation,
  logoutValidation,
  registerValidation,
  teamValidation,
  updateUserValidation,
  validateRequest,
  verifyEmailValidation,
} from '../middleware/validation.js';
import { PrismaSessionTokenRepository } from '../repositories/PrismaSessionTokenRepository.js';
import { PrismaTeamRepository } from '../repositories/PrismaTeamRepository.js';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';

const router = Router();

// --- INYECCIÓN DE DEPENDENCIAS (PATRÓN RECOMENDADO) ---
// 1. Instanciar el repositorio de infraestructura (implementa la interfaz de dominio)
const userRepository = new PrismaUserRepository();
// 2. Instanciar el servicio de aplicación, inyectando el repositorio
const userService = new UserService(userRepository);
// 3. Instanciar el controlador, inyectando el servicio (y futuros validadores/DTOs si aplica)
const userController = new UserController(userService);
// --- FIN INYECCIÓN DE DEPENDENCIAS ---

// Inicialización de controladores
const sessionTokenRepository = new PrismaSessionTokenRepository();
const authService = new AuthService(userRepository, sessionTokenRepository);
const authController = new AuthController(authService);
const teamRepository = new PrismaTeamRepository();
const teamService = new TeamService(teamRepository, userRepository);
const teamController = new TeamController(teamService);

// Rate limiter específico para verificación de email
const verifyEmailLimiter = rateLimit({ windowMs: 60_000, max: 5 });

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

// API dev route (only in development)
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

    // Verificar conexión a base de datos
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Test de conexión simple
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();

      healthCheck.data.checks.database.status = 'healthy';
    } catch (error) {
      healthCheck.data.checks.database.status = 'unhealthy';
      healthCheck.data.checks.database.error = error.message;
      healthCheck.status = 'error';
      healthCheck.message = 'Servidor con problemas de conectividad';
    }

    // Determinar status general
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
  loginValidation,
  asyncHandler(authController.login.bind(authController))
);
router.post(
  API_ROUTES.AUTH.REGISTER,
  registerValidation,
  asyncHandler(authController.register.bind(authController))
);
router.post(
  API_ROUTES.AUTH.REFRESH_TOKEN,
  validateRequest,
  asyncHandler(authController.refreshToken.bind(authController))
);
router.post(
  API_ROUTES.AUTH.LOGOUT,
  logoutValidation,
  asyncHandler(authController.logout.bind(authController))
);
router.post(
  API_ROUTES.AUTH.VERIFY_EMAIL,
  verifyEmailValidation,
  asyncHandler(authController.verifyEmail.bind(authController))
);
router.post(
  API_ROUTES.AUTH.RESEND_VERIFICATION,
  validateRequest,
  asyncHandler(authController.resendVerification.bind(authController))
);
router.post(
  API_ROUTES.AUTH.FORGOT_PASSWORD,
  validateRequest,
  asyncHandler(authController.forgotPassword.bind(authController))
);
router.post(
  API_ROUTES.AUTH.RESET_PASSWORD,
  validateRequest,
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

// TODO: Fix admin routes - commented out temporarily to run compliance tests
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
