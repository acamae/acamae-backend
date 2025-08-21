import { API_ERROR_CODES } from '../../shared/constants/apiCodes.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { createError } from '../../shared/utils/error.js';

export const ensureSelfParam =
  (param = 'id') =>
  (req, _res, next) => {
    const pathId = parseInt(req.params[param], 10);
    const userId = parseInt(req.user?.id, 10);

    if (Number.isNaN(pathId) || Number.isNaN(userId) || pathId !== userId) {
      return next(
        createError({
          message: 'Forbidden',
          code: API_ERROR_CODES.AUTH_FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN,
          errorDetails: { type: 'business', details: [{ field: 'user', code: 'FORBIDDEN' }] },
        })
      );
    }

    next();
  };

// Ensure the provided profile id belongs to the authenticated user
export const ensureSelfProfile =
  (param = 'id') =>
  async (req, _res, next) => {
    try {
      const profileId = parseInt(req.params[param], 10);
      const userId = parseInt(req.user?.id, 10);
      if (Number.isNaN(profileId) || Number.isNaN(userId)) {
        return next(
          createError({
            message: 'Forbidden',
            code: API_ERROR_CODES.AUTH_FORBIDDEN,
            status: HTTP_STATUS.FORBIDDEN,
            errorDetails: { type: 'business', details: [{ field: 'user', code: 'FORBIDDEN' }] },
          })
        );
      }
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      let profile = await prisma.userProfile.findUnique({
        where: { id: profileId },
        select: { id: true, user_id: true },
      });
      // Compatibility: if no profile with that id, treat param as userId and translate to profileId
      if (!profile && profileId === userId) {
        const byUser = await prisma.userProfile.findUnique({
          where: { user_id: userId },
          select: { id: true, user_id: true },
        });
        if (byUser) {
          req.params[param] = byUser.id.toString();
          profile = byUser;
        }
      }
      await prisma.$disconnect();
      if (!profile || profile.user_id !== userId) {
        return next(
          createError({
            message: 'Forbidden',
            code: API_ERROR_CODES.AUTH_FORBIDDEN,
            status: HTTP_STATUS.FORBIDDEN,
            errorDetails: { type: 'business', details: [{ field: 'user', code: 'FORBIDDEN' }] },
          })
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
