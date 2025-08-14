import {
  API_ROUTES,
  getAuthResetPasswordUrl,
  getAuthVerifyEmailUrl,
  getDeleteTeamByIdUrl,
  getDeleteUserByIdUrl,
  getTeamByIdUrl,
  getUpdateTeamByIdUrl,
  getUpdateUserByIdUrl,
  getUserByIdUrl,
} from '../../../src/shared/constants/apiRoutes.js';

describe('API Routes Constants', () => {
  describe('Static Route Constants', () => {
    it('should have all base routes defined', () => {
      expect(API_ROUTES.BASE).toBe('/api');
      expect(`${API_ROUTES.BASE}${API_ROUTES.HEALTH}`).toBe('/api/health');
      expect(`${API_ROUTES.BASE}${API_ROUTES.DEV}`).toBe('/api/dev');
    });

    it('should have all auth routes defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`).toBe('/api/auth/login');
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.REGISTER}`).toBe('/api/auth/register');
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`).toBe(
        '/api/auth/verify-email/:token'
      );
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`).toBe(
        '/api/auth/reset-password/:token'
      );
    });

    it('should have all user routes defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`).toBe('/api/users/:id');
      expect(`${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID}`).toBe('/api/users/:id');
      expect(`${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID}`).toBe('/api/users/:id');
    });

    it('should have all team routes defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`).toBe('/api/teams/:id');
      expect(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID}`).toBe('/api/teams/:id');
      expect(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID}`).toBe('/api/teams/:id');
    });

    it('should have timezones route defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.TIMEZONES}`).toBe('/api/timezones');
    });

    it('should have countries route defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.COUNTRIES}`).toBe('/api/countries');
    });

    it('should have all game routes defined', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.GAMES.GET_ALL}`).toBe('/api/games');
    });
  });

  describe('Auxiliary Route Functions', () => {
    describe('Auth Routes with Parameters', () => {
      it('should replace token parameter in verify email URL', () => {
        const token = 'abc123-def456';
        const result = getAuthVerifyEmailUrl(token);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL.replace(':token', token)}`
        );
      });

      it('should replace token parameter in reset password URL', () => {
        const token = 'reset-token-xyz789';
        const result = getAuthResetPasswordUrl(token);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD.replace(':token', token)}`
        );
      });
    });

    describe('User Routes with Parameters', () => {
      it('should replace id parameter in get user by ID URL', () => {
        const userId = '12345';
        const result = getUserByIdUrl(userId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID.replace(':id', userId)}`
        );
      });

      it('should replace id parameter in update user by ID URL', () => {
        const userId = 'user-abc123';
        const result = getUpdateUserByIdUrl(userId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID.replace(':id', userId)}`
        );
      });

      it('should replace id parameter in delete user by ID URL', () => {
        const userId = '67890';
        const result = getDeleteUserByIdUrl(userId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.USERS.DELETE_BY_ID.replace(':id', userId)}`
        );
      });
    });

    describe('Team Routes with Parameters', () => {
      it('should replace id parameter in get team by ID URL', () => {
        const teamId = 'team-456';
        const result = getTeamByIdUrl(teamId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID.replace(':id', teamId)}`
        );
      });

      it('should replace id parameter in update team by ID URL', () => {
        const teamId = 'team-update-789';
        const result = getUpdateTeamByIdUrl(teamId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.TEAMS.UPDATE_BY_ID.replace(':id', teamId)}`
        );
      });

      it('should replace id parameter in delete team by ID URL', () => {
        const teamId = 'team-delete-101';
        const result = getDeleteTeamByIdUrl(teamId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.TEAMS.DELETE_BY_ID.replace(':id', teamId)}`
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in parameters', () => {
        const specialId = 'id-with-special-chars_123@test.com';
        const result = getUserByIdUrl(specialId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID.replace(':id', specialId)}`
        );
      });

      it('should handle empty string parameters', () => {
        const result = getTeamByIdUrl('');
        expect(result).toBe(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID.replace(':id', '')}`);
      });

      it('should handle numeric parameters as strings', () => {
        const numericId = '999';
        const result = getUpdateUserByIdUrl(numericId);
        expect(result).toBe(
          `${API_ROUTES.BASE}${API_ROUTES.USERS.UPDATE_BY_ID.replace(':id', numericId)}`
        );
      });
    });
  });

  describe('Route Structure Consistency', () => {
    const basePath = `${API_ROUTES.BASE}`;
    it('should maintain consistent base path across all routes', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`).toMatch(/^\/api/);
      expect(`${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`).toMatch(/^\/api/);
      expect(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`).toMatch(/^\/api/);
      expect(`${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`).toMatch(/^\/api/);
      expect(`${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`).toMatch(/^\/api/);
    });

    it('should use consistent parameter placeholder format', () => {
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.VERIFY_EMAIL}`).toContain(':token');
      expect(`${API_ROUTES.BASE}${API_ROUTES.AUTH.RESET_PASSWORD}`).toContain(':token');
      expect(`${API_ROUTES.BASE}${API_ROUTES.USERS.GET_BY_ID}`).toContain(':id');
      expect(`${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_BY_ID}`).toContain(':id');
    });

    it('should maintain API prefix consistency', () => {
      const allRoutes = [
        `${API_ROUTES.BASE}${API_ROUTES.BASE}`,
        `${API_ROUTES.BASE}${API_ROUTES.HEALTH}`,
        `${API_ROUTES.BASE}${API_ROUTES.AUTH.LOGIN}`,
        `${API_ROUTES.BASE}${API_ROUTES.USERS.GET_ALL}`,
        `${API_ROUTES.BASE}${API_ROUTES.TEAMS.GET_ALL}`,
        `${API_ROUTES.BASE}${API_ROUTES.ADMIN.STATS}`,
        `${API_ROUTES.BASE}${API_ROUTES.MANAGER.DASHBOARD}`,
      ];

      allRoutes.forEach((route) => {
        expect(route.startsWith('/api')).toBe(true);
      });
    });
  });
});
