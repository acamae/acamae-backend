describe('Middleware Exports Validation', () => {
  it('should export all functions without import errors', async () => {
    // This test ensures that all exports in middleware/index.js are valid
    // and prevents runtime import errors in production

    const middlewareExports = await import('../../../src/infrastructure/middleware/index.js');

    // Verify that all expected exports exist and are functions
    const expectedExports = [
      'requestIdMiddleware',
      'responseHelpersMiddleware',
      'errorHandler',
      'notFoundHandler',
      'applySecurityMiddleware',
      'validateRequest',
      'registerValidation',
      'loginValidation',
      'logoutValidation',
      'authenticate',
      'authorize',
      'isAdmin',
      'isManagerOrAdmin',
      'applyCompression',
      'requestLogger',
      'errorLogger',
    ];

    expectedExports.forEach((exportName) => {
      expect(middlewareExports).toHaveProperty(exportName);
      expect(typeof middlewareExports[exportName]).toBe('function');
    });
  });

  it('should match the exact exports used in app.js', async () => {
    // This test ensures that the exports used in app.js actually exist
    const middlewareExports = await import('../../../src/infrastructure/middleware/index.js');

    // These are the exact imports used in app.js
    const appJsImports = [
      'applyCompression',
      'applySecurityMiddleware',
      'errorHandler',
      'notFoundHandler',
      'requestIdMiddleware',
      'responseHelpersMiddleware',
    ];

    appJsImports.forEach((importName) => {
      expect(middlewareExports).toHaveProperty(importName);
      expect(typeof middlewareExports[importName]).toBe('function');
    });
  });

  it('should not export undefined functions', async () => {
    const middlewareExports = await import('../../../src/infrastructure/middleware/index.js');

    Object.entries(middlewareExports).forEach(([name, value]) => {
      if (name !== 'default') {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        expect(typeof value).toBe('function');
      }
    });
  });
});
