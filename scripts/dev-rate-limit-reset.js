#!/usr/bin/env node

/**
 * Script para resetear el rate limit durante desarrollo
 * Uso: node scripts/dev-rate-limit-reset.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ENV_FILE = '.env.development';

function resetRateLimit() {
  try {
    console.log('🔄 Resetting rate limit configuration for development...');

    // Read current file
    const envPath = join(process.cwd(), ENV_FILE);
    let envContent = '';

    try {
      envContent = readFileSync(envPath, 'utf8');
    } catch (error) {
      console.log('📝 .env.development file not found, creating a new one...', error.message);
    }

    // Remove existing rate limit configurations
    const lines = envContent.split('\n').filter((line) => {
      return (
        !line.startsWith('RATE_LIMIT_AUTH_') &&
        !line.startsWith('RATE_LIMIT_WINDOW_') &&
        !line.startsWith('RATE_LIMIT_MAX') &&
        !line.includes('Rate Limit Configuration for Development')
      );
    });

    // Add development configuration with industry standards
    const devConfig = [
      '',
      '# Rate Limit Configuration for Development (Industry Standards)',
      'RATE_LIMIT_AUTH_WINDOW_MS=900000', // 15 minutes (industry standard)
      'RATE_LIMIT_AUTH_MAX=10', // 10 attempts per 15 minutes
      'RATE_LIMIT_WINDOW_MS=900000', // 15 minutes
      'RATE_LIMIT_MAX=500', // 500 requests per 15 minutes
    ];

    const newContent = lines.join('\n') + devConfig.join('\n');

    // Write updated file
    writeFileSync(envPath, newContent);

    console.log('✅ Rate limit reset for development:');
    console.log('   - Auth: 10 attempts per 15 minutes');
    console.log('   - General: 500 requests per 15 minutes');
    console.log('');
    console.log('🔄 Restart the server to apply the changes:');
    console.log('   npm run docker:restart');
  } catch (error) {
    console.error('❌ Error resetting rate limit:', error.message);
    process.exit(1);
  }
}

function showCurrentConfig() {
  try {
    const envPath = join(process.cwd(), ENV_FILE);
    const envContent = readFileSync(envPath, 'utf8');

    const rateLimitConfig = envContent
      .split('\n')
      .filter((line) => line.startsWith('RATE_LIMIT_'))
      .map((line) => line.trim());

    if (rateLimitConfig.length > 0) {
      console.log('📋 Current rate limit configuration:');
      rateLimitConfig.forEach((config) => console.log(`   ${config}`));
    } else {
      console.log('📋 No custom rate limit configuration found');
    }
  } catch (error) {
    console.log('📋 Could not read current configuration', error.message);
  }
}

function showHelp() {
  console.log(`
🔄 Rate Limit Reset Tool - Development

Usage:
  node scripts/dev-rate-limit-reset.js [option]

Options:
  reset     - Reset rate limit for development (default)
  show      - Show current configuration
  help      - Show this help

Examples:
  node scripts/dev-rate-limit-reset.js reset
  node scripts/dev-rate-limit-reset.js show
  node scripts/dev-rate-limit-reset.js help
`);
}

// Procesar argumentos
const args = process.argv.slice(2);
const command = args[0] || 'reset';

switch (command) {
  case 'reset':
    resetRateLimit();
    break;
  case 'show':
    showCurrentConfig();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
