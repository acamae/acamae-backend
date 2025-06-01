export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email/:token',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password/:token',
    ME: '/auth/me',
  },
  USERS: {
    // GET_ALL: '/users', // Descomentar cuando se implemente
    GET_BY_ID: '/users/:id',
    UPDATE_BY_ID: '/users/:id', // Asumiendo que PUT /users/:id es para actualizar
    DELETE_BY_ID: '/users/:id', // Añadido
    // CREATE: '/users', // Descomentar cuando se implemente
    // DELETE_BY_ID: '/users/:id', // Descomentar cuando se implemente
  },
  // Aquí se pueden añadir otros dominios/recursos en el futuro, por ejemplo:
  // TEAMS: {
  //   GET_ALL: '/teams',
  //   GET_BY_ID: '/teams/:id',
  // },
};

// Funciones auxiliares para rutas con parámetros (opcional, pero recomendado)
export const getAuthVerifyEmailUrl = (token: string): string =>
  API_ROUTES.AUTH.VERIFY_EMAIL.replace(':token', token);

export const getAuthResetPasswordUrl = (token: string): string =>
  API_ROUTES.AUTH.RESET_PASSWORD.replace(':token', token);

export const getUserByIdUrl = (id: string): string =>
  API_ROUTES.USERS.GET_BY_ID.replace(':id', id);

export const getUpdateUserByIdUrl = (id: string): string =>
  API_ROUTES.USERS.UPDATE_BY_ID.replace(':id', id);

export const getDeleteUserByIdUrl = (id: string): string => // Añadido
  API_ROUTES.USERS.DELETE_BY_ID.replace(':id', id); 