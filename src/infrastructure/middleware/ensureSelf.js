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
