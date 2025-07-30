export const API_ROUTES = {
  BASE: '/api',
  HEALTH: '/api/health',
  DEV: '/api/dev',
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    VERIFY_EMAIL: '/api/auth/verify-email/:token',
    VERIFY_EMAIL_RESEND: '/api/auth/verify-email-resend',
    VERIFY_EMAIL_SENT: '/api/auth/verify-email-sent',
    VERIFY_EMAIL_SUCCESS: '/api/auth/verify-email-success',
    VERIFY_EMAIL_EXPIRED: '/api/auth/verify-email-expired',
    VERIFY_EMAIL_ALREADY_VERIFIED: '/api/auth/verify-email-already-verified',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password/:token',
    ME: '/api/auth/me',
  },
  USERS: {
    BASE: '/api/users',
    GET_ALL: '/api/users',
    GET_BY_ID: '/api/users/:id',
    UPDATE_BY_ID: '/api/users/:id',
    DELETE_BY_ID: '/api/users/:id',
  },
  TEAMS: {
    BASE: '/api/teams',
    GET_ALL: '/api/teams',
    GET_BY_ID: '/api/teams/:id',
    CREATE: '/api/teams',
    UPDATE_BY_ID: '/api/teams/:id',
    DELETE_BY_ID: '/api/teams/:id',
  },
  ADMIN: {
    BASE: '/api/admin',
    USERS: '/api/admin/users',
    TEAMS: '/api/admin/teams',
    STATS: '/api/admin/stats',
  },
  MANAGER: {
    BASE: '/api/manager',
    DASHBOARD: '/api/manager/dashboard',
  },
};

// Auxiliary functions for routes with parameters
export const getAuthVerifyEmailUrl = (token) =>
  API_ROUTES.AUTH.VERIFY_EMAIL.replace(':token', token);

export const getAuthResetPasswordUrl = (token) =>
  API_ROUTES.AUTH.RESET_PASSWORD.replace(':token', token);

export const getUserByIdUrl = (id) => API_ROUTES.USERS.GET_BY_ID.replace(':id', id);

export const getUpdateUserByIdUrl = (id) => API_ROUTES.USERS.UPDATE_BY_ID.replace(':id', id);

export const getDeleteUserByIdUrl = (id) => API_ROUTES.USERS.DELETE_BY_ID.replace(':id', id);

export const getTeamByIdUrl = (id) => API_ROUTES.TEAMS.GET_BY_ID.replace(':id', id);

export const getUpdateTeamByIdUrl = (id) => API_ROUTES.TEAMS.UPDATE_BY_ID.replace(':id', id);

export const getDeleteTeamByIdUrl = (id) => API_ROUTES.TEAMS.DELETE_BY_ID.replace(':id', id);
