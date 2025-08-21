export const API_ROUTES = {
  BASE: '/api',
  HEALTH: '/health',
  DEV: '/dev',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email/:token',
    VERIFY_EMAIL_RESEND: '/auth/verify-email-resend',
    VERIFY_EMAIL_SENT: '/auth/verify-email-sent',
    VERIFY_EMAIL_SUCCESS: '/auth/verify-email-success',
    VERIFY_EMAIL_EXPIRED: '/auth/verify-email-expired',
    VERIFY_EMAIL_ALREADY_VERIFIED: '/auth/verify-email-already-verified',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password/:token',
    ME: '/auth/me',
  },
  USERS: {
    GET_ALL: '/users',
    GET_BY_ID: '/users/:id',
    UPDATE_BY_ID: '/users/:id',
    DELETE_BY_ID: '/users/:id',
    PREFERENCES: '/users/:id/preferences',
  },
  PROFILES: {
    GET_BY_ID: '/profiles/:id',
    PUBLIC: '/profiles/:id/public',
    AVAILABILITY: '/profiles/:id/availability',
    GAMES: '/profiles/:id/games',
    COUNTRY: '/profiles/:id/country',
    TIMEZONE: '/profiles/:id/timezone',
  },
  GAMES: {
    GET_ALL: '/games',
  },
  TEAMS: {
    GET_ALL: '/teams',
    GET_BY_ID: '/teams/:id',
    CREATE: '/teams',
    UPDATE_BY_ID: '/teams/:id',
    DELETE_BY_ID: '/teams/:id',
  },
  ADMIN: {
    USERS: '/admin/users',
    TEAMS: '/admin/teams',
    STATS: '/admin/stats',
  },
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
  },
  TIMEZONES: '/timezones',
  COUNTRIES: '/countries',
};

// Auxiliary functions for routes with parameters
export const getAuthVerifyEmailUrl = (token) =>
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL.replace(':token', token)}`;

export const getAuthResetPasswordUrl = (token) =>
  `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD.replace(':token', token)}`;

export const getUserByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID.replace(':id', id)}`;

export const getUpdateUserByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID.replace(':id', id)}`;

export const getDeleteUserByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID.replace(':id', id)}`;

export const getTeamByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID.replace(':id', id)}`;

export const getUpdateTeamByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID.replace(':id', id)}`;

export const getDeleteTeamByIdUrl = (id) =>
  `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID.replace(':id', id)}`;
