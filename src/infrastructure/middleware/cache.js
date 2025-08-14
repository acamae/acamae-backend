import { createHash } from 'crypto';

/**
 * Apply public cache headers (per-endpoint), optionally disabling cache in dev/local.
 * - Removes conflicting global headers (Pragma/Expires) if present
 * - Sets Cache-Control accordingly
 *
 * @param {Object} options
 * @param {number} [options.maxAgeSeconds=86400]
 * @param {boolean} [options.noStoreInDev=true]
 * @param {{ env: string }} options.config
 * @returns {import('express').RequestHandler}
 */
export const cachePublicSimple = ({ maxAgeSeconds = 86400, noStoreInDev = true, config }) => {
  return (_req, res, next) => {
    try {
      // Clean potentially conflicting headers set globally
      res.removeHeader('Pragma');
      res.removeHeader('Expires');

      const isDev = config.env === 'development' || config.env === 'local';
      if (noStoreInDev && isDev) {
        res.set('Cache-Control', 'no-store');
      } else {
        res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, must-revalidate`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Cache middleware that reads a JSON file, sets ETag/Last-Modified and serves 304 when possible.
 * It also attaches the raw and parsed content to res.locals for controllers to reuse.
 *
 * @param {Object} options
 * @param {(req: import('express').Request) => Promise<{ raw: string; json: any; mtime?: Date }>} options.load
 * @param {number} [options.maxAgeSeconds=86400]
 * @param {boolean} [options.noStoreInDev=true]
 * @param {{ env: string }} options.config
 * @param {Object} [options.attachTo]
 * @param {string} [options.attachTo.rawKey]
 * @param {string} [options.attachTo.jsonKey]
 * @param {string} [options.attachTo.mtimeKey]
 * @returns {import('express').RequestHandler}
 */
export const cacheFromLoader = ({
  load,
  maxAgeSeconds = 86400,
  noStoreInDev = true,
  config,
  attachTo = {},
}) => {
  const { rawKey = '__cacheRaw', jsonKey = '__cacheJson', mtimeKey = '__cacheMtime' } = attachTo;

  return async (req, res, next) => {
    try {
      // Clean conflicting headers from global security
      res.removeHeader('Pragma');
      res.removeHeader('Expires');

      const isDev = config.env === 'development' || config.env === 'local';
      if (noStoreInDev && isDev) {
        res.set('Cache-Control', 'no-store');
        // Even in dev we still load to serve fresh data
      } else {
        res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, must-revalidate`);
      }

      // Load data (raw/json/mtime)
      const { raw, json, mtime } = await load(req);

      // Compute ETag and conditional 304
      if (!isDev) {
        const etag = createHash('sha256').update(raw).digest('hex');
        res.set('ETag', etag);
        if (mtime instanceof Date) {
          res.set('Last-Modified', mtime.toUTCString());
        }
        if (req.headers['if-none-match'] === etag) {
          return res.status(304).end();
        }
      }

      // Attach for controller use
      res.locals[rawKey] = raw;
      res.locals[jsonKey] = json;
      res.locals[mtimeKey] = mtime || null;

      return next();
    } catch (error) {
      // Let the next handler decide how to respond (e.g., controller can fall back)
      return next(error);
    }
  };
};
