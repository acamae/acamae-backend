import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { AdminService } from '../../application/services/AdminService.js';
import { AuthService } from '../../application/services/AuthService.js';
import { CountriesService } from '../../application/services/CountriesService.js';
import { GameService } from '../../application/services/GameService.js';
import { ManagerService } from '../../application/services/ManagerService.js';
import { TeamService } from '../../application/services/TeamService.js';
import { UserService } from '../../application/services/UserService.js';
import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { API_ROUTES } from '../../shared/constants/apiRoutes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { config } from '../config/environment.js';
import { AdminController } from '../controllers/AdminController.js';
import { AuthController } from '../controllers/AuthController.js';
import { CountriesController } from '../controllers/CountriesController.js';
import { GameController } from '../controllers/GameController.js';
import { ManagerController } from '../controllers/ManagerController.js';
import { TeamController } from '../controllers/TeamController.js';
import { TimezonesController } from '../controllers/TimezonesController.js';
import { UserController } from '../controllers/UserController.js';
import { authenticate as authMiddleware, authorize } from '../middleware/auth.js';
import { cacheFromLoader, cachePublicSimple } from '../middleware/cache.js';
import { ensureSelfParam } from '../middleware/ensureSelf.js';
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
  validateResetTokenValidation,
  verifyEmailValidation,
} from '../middleware/validation.js';
import { PrismaCountryRepository } from '../repositories/PrismaCountryRepository.js';
import { PrismaGameRepository } from '../repositories/PrismaGameRepository.js';
import { PrismaSessionTokenRepository } from '../repositories/PrismaSessionTokenRepository.js';
import { PrismaTeamRepository } from '../repositories/PrismaTeamRepository.js';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';
// AdminService and ManagerService imported once at top

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
const gameRepository = new PrismaGameRepository();
const gameService = new GameService(gameRepository, userRepository);
const gameController = new GameController(gameService);
const adminService = new AdminService({});
const adminController = new AdminController(adminService);
const managerService = new ManagerService({});
const managerController = new ManagerController(managerService);
const timezonesController = new TimezonesController(config);

// Countries DI: repository + service + controller
const countryRepository = new PrismaCountryRepository();
const countriesService = new CountriesService(countryRepository, {
  loadFromTzdb: async () => {
    const { readFile, stat } = await import('fs/promises');
    const path = (await import('path')).default;
    const filePath = path.resolve(
      process.cwd(),
      'src',
      'infrastructure',
      'assets',
      'timezones.json'
    );
    const rawFile = await readFile(filePath, 'utf-8');
    const tzdb = JSON.parse(rawFile);
    const seen = new Set();
    const countries = [];
    for (const z of tzdb.timezones || []) {
      const code = z.countryCode;
      const name = z.countryName;
      if (!code || !name) continue;
      if (!seen.has(code)) {
        seen.add(code);
        countries.push({ code, name });
      }
    }
    countries.sort((a, b) => a.name.localeCompare(b.name));
    const fileStat = await stat(filePath);
    return { countries, mtime: fileStat.mtime };
  },
});
const countriesController = new CountriesController(countriesService);

// Rate limiter for critical authentication endpoints
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
});

// API root route
router.get(
  API_ROUTES.BASE,
  asyncHandler(async (_req, res) => {
    const apiData = {
      version: process.env.npm_package_version,
      environment: config.env,
      timestamp: new Date().toISOString(),
      documentation: '/api-docs',
      endpoints: {
        health: `${API_ROUTES.BASE}${API_ROUTES.HEALTH}`,
        auth: {
          login: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`,
          register: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REGISTER}`,
          refreshToken: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REFRESH_TOKEN}`,
          logout: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGOUT}`,
          verifyEmail: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`,
          resendVerification: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL_RESEND}`,
          forgotPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.FORGOT_PASSWORD}`,
          resetPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`,
          me: `${API_ROUTES.BASE}${API_ROUTES.AUTH.ME}`,
        },
        users: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`,
          getById: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`,
          updateById: `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID}`,
          deleteById: `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID}`,
        },
        teams: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`,
          getById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`,
          create: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.CREATE}`,
          updateById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID}`,
          deleteById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID}`,
        },
        games: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.GAMES.GET_ALL}`,
        },
        admin: {
          stats: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`,
          users: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.USERS}`,
          teams: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.TEAMS}`,
        },
        manager: {
          dashboard: `${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`,
        },
        countries: `${API_ROUTES.BASE}${API_ROUTES.COUNTRIES}`,
        timezones: `${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`,
      },
    };

    res.apiSuccess(apiData, 'Welcome to the Acamae API');
  })
);

// Countries catalog route with cache middleware
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.COUNTRIES}`,
  cacheFromLoader({
    config,
    maxAgeSeconds: 86400,
    noStoreInDev: true,
    attachTo: { rawKey: '__rawCountriesJson', jsonKey: '__cacheJson', mtimeKey: '__cacheMtime' },
    load: async () => {
      // Prefer DB; on fail fallback to tzdb-derived countries
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const rows = await prisma.country.findMany({
          select: { code: true, name: true },
          orderBy: { name: 'asc' },
        });
        await prisma.$disconnect();
        const json = { countries: rows };
        const raw = JSON.stringify(json);
        return { raw, json, mtime: new Date() };
      } catch {
        const { readFile, stat } = await import('fs/promises');
        const path = (await import('path')).default;
        const filePath = path.resolve(
          process.cwd(),
          'src',
          'infrastructure',
          'assets',
          'timezones.json'
        );
        const rawFile = await readFile(filePath, 'utf-8');
        const tzdb = JSON.parse(rawFile);
        const seen = new Set();
        const countries = [];
        for (const z of tzdb.timezones || []) {
          const code = z.countryCode;
          const name = z.countryName;
          if (!code || !name) continue;
          if (!seen.has(code)) {
            seen.add(code);
            countries.push({ code, name });
          }
        }
        countries.sort((a, b) => a.name.localeCompare(b.name));
        const json = { countries };
        const raw = JSON.stringify(json);
        const fileStat = await stat(filePath);
        return { raw, json, mtime: fileStat.mtime };
      }
    },
  }),
  asyncHandler(countriesController.getCountries.bind(countriesController))
);

// API dev route (only in development environment)
if (config.env === 'development') {
  router.get(
    `${API_ROUTES.BASE}${API_ROUTES.DEV}`,
    asyncHandler(async (_req, res) => {
      const devData = {
        name: 'Esports Management API',
        version: process.env.npm_package_version,
        environment: config.env,
        timestamp: new Date().toISOString(),
        documentation: '/api-docs',
        endpoints: {
          health: `${API_ROUTES.BASE}${API_ROUTES.HEALTH}`,
          auth: {
            login: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`,
            register: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REGISTER}`,
            refreshToken: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REFRESH_TOKEN}`,
            logout: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGOUT}`,
            verifyEmail: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`,
            resendVerification: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL_RESEND}`,
            forgotPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.FORGOT_PASSWORD}`,
            resetPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`,
            me: `${API_ROUTES.BASE}${API_ROUTES.AUTH.ME}`,
          },
          users: {
            getAll: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`,
            getById: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`,
            updateById: `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID}`,
            deleteById: `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID}`,
          },
          teams: {
            getAll: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`,
            getById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`,
            create: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.CREATE}`,
            updateById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID}`,
            deleteById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID}`,
          },
          admin: {
            stats: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`,
            users: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.USERS}`,
            teams: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.TEAMS}`,
          },
          manager: {
            dashboard: `${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`,
          },
          games: {
            getAll: `${API_ROUTES.BASE}${API_ROUTES.GAMES.GET_ALL}`,
          },
          countries: `${API_ROUTES.BASE}${API_ROUTES.COUNTRIES}`,
          timezones: `${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`,
        },
      };

      res.apiSuccess(devData, 'Development API Information');
    })
  );

  // Development endpoint to reset rate limit (only in development)
  router.post(
    `${API_ROUTES.BASE}${API_ROUTES.DEV}/reset-rate-limit`,
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

// Health check route (returns welcome payload with endpoints)
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.HEALTH}`,
  asyncHandler(async (_req, res) => {
    const data = {
      version: process.env.npm_package_version,
      environment: config.env,
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: {
          login: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`,
          register: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REGISTER}`,
          refreshToken: `${API_ROUTES.BASE}${API_ROUTES.AUTH.REFRESH_TOKEN}`,
          logout: `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGOUT}`,
          verifyEmail: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`,
          resendVerification: `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL_RESEND}`,
          forgotPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.FORGOT_PASSWORD}`,
          resetPassword: `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`,
          me: `${API_ROUTES.BASE}${API_ROUTES.AUTH.ME}`,
        },
        users: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`,
          getById: `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`,
          updateById: `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID}`,
          deleteById: `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID}`,
        },
        teams: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`,
          getById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`,
          create: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.CREATE}`,
          updateById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID}`,
          deleteById: `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID}`,
        },
        games: {
          getAll: `${API_ROUTES.BASE}${API_ROUTES.GAMES.GET_ALL}`,
        },
        admin: {
          stats: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`,
          users: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.USERS}`,
          teams: `${API_ROUTES.BASE}${API_ROUTES.ADMIN.TEAMS}`,
        },
        manager: {
          dashboard: `${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`,
        },
        countries: `${API_ROUTES.BASE}${API_ROUTES.COUNTRIES}`,
        timezones: `${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`,
      },
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
    };

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      data.checks.database.status = 'healthy';
    } catch (error) {
      data.checks.database.status = 'unhealthy';
      data.checks.database.error = error.message;
    }

    res.apiSuccess(data, 'API Health');
  })
);

// Timezones catalog route with cache middleware
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`,
  cacheFromLoader({
    config,
    maxAgeSeconds: 86400,
    noStoreInDev: true,
    attachTo: { rawKey: '__rawTimezonesJson', jsonKey: '__cacheJson', mtimeKey: '__cacheMtime' },
    load: async () => {
      const { readFile, stat } = await import('fs/promises');
      const path = (await import('path')).default;
      const filePath = path.resolve(
        process.cwd(),
        'src',
        'infrastructure',
        'assets',
        'timezones.json'
      );
      const raw = await readFile(filePath, 'utf-8');
      const json = JSON.parse(raw);
      const fileStat = await stat(filePath);
      return { raw, json, mtime: fileStat.mtime };
    },
  }),
  asyncHandler(timezonesController.getTimezones.bind(timezonesController))
);

// Authentication routes
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`,
  authLimiter,
  timeoutMiddleware(15000), // 15 second timeout for login
  loginValidation,
  asyncHandler(authController.login.bind(authController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.REGISTER}`,
  authLimiter,
  timeoutMiddleware(30000), // 30 second timeout for registration
  registerValidation,
  asyncHandler(authController.register.bind(authController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.REFRESH_TOKEN}`,
  timeoutMiddleware(10000), // 10 second timeout for token refresh
  refreshTokenValidation,
  asyncHandler(authController.refreshToken.bind(authController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGOUT}`,
  timeoutMiddleware(5000), // 5 second timeout for logout
  logoutValidation,
  asyncHandler(authController.logout.bind(authController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`,
  authLimiter,
  timeoutMiddleware(10000), // 10 second timeout for email verification
  verifyEmailValidation,
  asyncHandler(authController.verifyEmail.bind(authController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL_RESEND}`,
  authLimiter,
  timeoutMiddleware(20000), // 20 second timeout for resend (email sending can take time)
  resendVerificationValidation,
  asyncHandler(authController.resendVerification.bind(authController))
);

router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.FORGOT_PASSWORD}`,
  authLimiter,
  timeoutMiddleware(10000),
  forgotPasswordValidation,
  asyncHandler(authController.forgotPassword.bind(authController))
);

// Reset Password Flow - Two endpoints following REST semantics
// POST: Validate reset token (check if token is valid before showing form)
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`,
  authLimiter,
  validateResetTokenValidation,
  asyncHandler(authController.validateResetToken.bind(authController))
);

// PUT: Reset password (update password using valid token)
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`,
  authLimiter,
  resetPasswordValidation,
  asyncHandler(authController.resetPassword.bind(authController))
);

router.get(
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.ME}`,
  authMiddleware,
  asyncHandler(authController.getMe.bind(authController))
);

// Users routes
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`,
  authMiddleware,
  authorize('users', 'read'),
  asyncHandler(userController.getAllUsers.bind(userController))
);
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`,
  authMiddleware,
  authorize('users', 'read'),
  asyncHandler(userController.getUserById.bind(userController))
);
// User games (idempotent add/remove)
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GAMES}`,
  authMiddleware,
  ensureSelfParam('id'),
  asyncHandler(userController.addGame.bind(userController))
);
router.delete(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GAMES}`,
  authMiddleware,
  ensureSelfParam('id'),
  asyncHandler(userController.removeGame.bind(userController))
);
// Availability
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.AVAILABILITY}`,
  authMiddleware,
  ensureSelfParam('id'),
  asyncHandler(userController.getAvailability.bind(userController))
);
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.AVAILABILITY}`,
  authMiddleware,
  ensureSelfParam('id'),
  asyncHandler(userController.replaceAvailability.bind(userController))
);
// Public profile (no auth required)
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.PUBLIC_PROFILE}`,
  asyncHandler(userController.getPublicProfile.bind(userController))
);
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID}`,
  authMiddleware,
  authorize('users', 'update'),
  updateUserValidation,
  asyncHandler(userController.updateUser.bind(userController))
);
router.delete(
  `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID}`,
  authMiddleware,
  authorize('users', 'delete'),
  asyncHandler(userController.deleteUser.bind(userController))
);

// Teams routes
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`,
  authMiddleware,
  authorize('teams', 'read'),
  asyncHandler(teamController.getAllTeams.bind(teamController))
);
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`,
  authMiddleware,
  authorize('teams', 'read'),
  asyncHandler(teamController.getTeamById.bind(teamController))
);
router.post(
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.CREATE}`,
  authMiddleware,
  authorize('teams', 'create'),
  teamValidation,
  asyncHandler(teamController.createTeam.bind(teamController))
);
router.put(
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID}`,
  authMiddleware,
  authorize('teams', 'update'),
  teamValidation,
  asyncHandler(teamController.updateTeam.bind(teamController))
);
router.delete(
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID}`,
  authMiddleware,
  authorize('teams', 'delete'),
  asyncHandler(teamController.deleteTeam.bind(teamController))
);

// Games routes
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.GAMES.GET_ALL}`,
  asyncHandler(gameController.listGames.bind(gameController))
);

// Admin routes
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`,
  authMiddleware,
  authorize('admin', 'read'),
  asyncHandler(adminController.getStats.bind(adminController))
);

// Manager routes
router.get(
  `${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`,
  authMiddleware,
  authorize('manager', 'read'),
  asyncHandler(managerController.getDashboard.bind(managerController))
);

// (Removed duplicate countries/timezones routes at bottom)

export default router;
