#!/usr/bin/env node

//===============================================================================
// Environment Variables Manager
//===============================================================================
// DESCRIPTION:
//   Consolidated script for environment variable management.
//   Handles copying, testing, and validating environment configuration
//   for different environments (development, production).
//
// WHEN TO USE:
//   - During initial project setup
//   - Before running Prisma commands
//   - When switching between environments
//   - To validate environment configuration
//   - When troubleshooting environment-related issues
//
// USAGE:
//   node scripts/_env-manager.js <command>
//
// COMMANDS:
//   copy, copy-for-prisma  - Copy environment variables for Prisma
//   test, verify           - Verify environment configuration
//   setup                  - Copy and verify (complete setup)
//
// EXAMPLES:
//   node scripts/_env-manager.js copy     # Copy .env.development to .env
//   node scripts/_env-manager.js test     # Validate current environment
//   node scripts/_env-manager.js setup    # Complete environment setup
//   NODE_ENV=production node scripts/_env-manager.js copy  # Use production env
//
// REQUIREMENTS:
//   - Environment files (.env.development or .env.production)
//   - Node.js >= 22.16.0
//   - dotenv package
//
// EXIT CODES:
//   0 - Success
//   1 - Error (missing files, validation failed, etc.)
//
// ENVIRONMENT FILES:
//   .env.development - Development environment variables
//   .env.production  - Production environment variables
//   .env             - Target file for Prisma and runtime
//===============================================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color definitions for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging utilities with color support
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bold}🔧 ${msg}${colors.reset}`),
};

// Configuration constants
const CONFIG = {
  defaultEnv: 'development',
  criticalVars: ['DATABASE_URL', 'JWT_SECRET', 'PORT'],
  maxVarLength: 20, // For truncated display
};

/**
 * Get current environment and determine appropriate files
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || CONFIG.defaultEnv;

  // Determine the correct environment file based on NODE_ENV
  let envFile;
  switch (nodeEnv) {
    case 'production':
      envFile = '.env.production';
      break;
    case 'test':
      envFile = '.env.test';
      break;
    case 'development':
    default:
      envFile = '.env.development';
      break;
  }

  const envPath = path.join(__dirname, '..', envFile);
  const targetPath = path.join(__dirname, '..', '.env');

  return {
    nodeEnv,
    envFile,
    envPath,
    targetPath,
    isWindows: os.platform() === 'win32',
  };
}

/**
 * Safely truncate sensitive environment variables for display
 * @param {string} value - Environment variable value
 * @param {number} length - Maximum display length
 * @returns {string} Truncated value
 */
function truncateValue(value, length = CONFIG.maxVarLength) {
  if (!value) return 'undefined';
  if (value.length <= length) return value;
  return `${value.substring(0, length)}...`;
}

/**
 * Copy environment configuration file for Prisma
 * Copies the appropriate environment file to .env for Prisma to read
 * @returns {boolean} Success status
 */
function copyEnvForPrisma() {
  const config = getEnvironmentConfig();

  log.header(`Environment Setup - ${config.nodeEnv.toUpperCase()}`);
  log.info(`Source file: ${config.envFile}`);
  log.info(`Target file: .env`);

  if (config.isWindows) {
    log.info('🪟 Windows system detected');
    log.info('💡 Ensure Docker Desktop is installed and running');
  }

  try {
    // Verify source file exists
    if (!fs.existsSync(config.envPath)) {
      log.error(`Source file not found: ${config.envFile}`);
      log.info('Create the environment file with required variables:');
      log.info('- DATABASE_URL');
      log.info('- JWT_SECRET');
      log.info('- PORT');
      return false;
    }

    // Read and validate source content
    const envContent = fs.readFileSync(config.envPath, 'utf8');
    if (!envContent.trim()) {
      log.error(`Source file is empty: ${config.envFile}`);
      return false;
    }

    // Write to target file
    fs.writeFileSync(config.targetPath, envContent);
    log.success('.env file created successfully for Prisma');

    // Parse and display key variables (without exposing secrets)
    const envVars = dotenv.parse(envContent);
    log.info('📊 Configuration summary:');
    console.log(`   - NODE_ENV: ${envVars.NODE_ENV || config.nodeEnv}`);
    console.log(`   - PORT: ${envVars.PORT || 'not set'}`);
    console.log(`   - DATABASE_URL: ${truncateValue(envVars.DATABASE_URL)}`);
    console.log(`   - JWT_SECRET: ${envVars.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);

    return true;
  } catch (error) {
    log.error(`Error copying environment configuration: ${error.message}`);
    return false;
  }
}

/**
 * Verify and test environment configuration
 * Loads environment variables and validates critical settings
 * @returns {boolean} Success status
 */
function testEnvironment() {
  const config = getEnvironmentConfig();

  log.header(`Environment Validation - ${config.nodeEnv.toUpperCase()}`);
  log.info(`Validating: ${config.envFile}`);

  if (config.isWindows) {
    log.info('🪟 Windows system detected');
    log.info('💡 Ensure Docker Desktop is installed and running');
  }

  try {
    // Load environment file
    const result = dotenv.config({ path: config.envPath });

    if (result.error) {
      log.error(`Error loading environment file: ${result.error.message}`);
      return false;
    }

    log.success('Environment file loaded successfully');

    // Validate critical variables
    const missingVars = CONFIG.criticalVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      log.error(`Missing critical environment variables: ${missingVars.join(', ')}`);
      log.info('Add these variables to your environment file:');
      missingVars.forEach((varName) => {
        console.log(`   - ${varName}`);
      });
      return false;
    }

    // Validate DATABASE_URL format
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && !databaseUrl.includes('://')) {
      log.warning('DATABASE_URL may have invalid format');
    }

    // Validate JWT_SECRET strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      log.warning('JWT_SECRET should be at least 32 characters long');
    }

    log.success('All critical variables are configured');
    log.info('📊 Current configuration:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || config.nodeEnv}`);
    console.log(`   - PORT: ${process.env.PORT}`);
    console.log(`   - DATABASE_URL: ${truncateValue(process.env.DATABASE_URL)}`);
    console.log(`   - JWT_SECRET: [SET - ${jwtSecret?.length || 0} chars]`);

    // Additional environment-specific validations
    if (config.nodeEnv === 'production') {
      log.info('🔒 Production environment detected');
      if (!process.env.CORS_ORIGIN) {
        log.warning('Consider setting CORS_ORIGIN for production');
      }
    }

    return true;
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

/**
 * Complete environment setup (copy + verify)
 * @returns {boolean} Success status
 */
function setupEnvironment() {
  log.header('Complete Environment Setup');

  // Step 1: Copy environment configuration
  if (!copyEnvForPrisma()) {
    log.error('Environment setup failed during copy phase');
    return false;
  }

  console.log(); // Add spacing

  // Step 2: Verify configuration
  if (!testEnvironment()) {
    log.error('Environment setup failed during validation phase');
    return false;
  }

  log.success('🎉 Environment setup completed successfully');
  return true;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`${colors.cyan}${colors.bold}Environment Variables Manager${colors.reset}`);
  console.log('');
  console.log('USAGE:');
  console.log('  node _env-manager.js <command>');
  console.log('');
  console.log('COMMANDS:');
  console.log('  copy, copy-for-prisma  Copy environment variables for Prisma');
  console.log('  test, verify           Verify environment configuration');
  console.log('  setup                  Copy and verify (complete setup)');
  console.log('  help                   Show this help message');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  node _env-manager.js copy');
  console.log('  node _env-manager.js test');
  console.log('  node _env-manager.js setup');
  console.log('  NODE_ENV=production node _env-manager.js copy');
  console.log('');
  console.log('ENVIRONMENT FILES:');
  console.log('  .env.development  Development environment (default)');
  console.log('  .env.production   Production environment');
  console.log('  .env              Target file (auto-generated)');
  console.log('');
}

/**
 * Main execution function
 */
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'copy':
    case 'copy-for-prisma':
      process.exit(copyEnvForPrisma() ? 0 : 1);
      break;

    case 'test':
    case 'verify':
      process.exit(testEnvironment() ? 0 : 1);
      break;

    case 'setup':
      process.exit(setupEnvironment() ? 0 : 1);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;

    default:
      if (command) {
        log.error(`Unknown command: ${command}`);
        console.log('');
      }
      showHelp();
      process.exit(1);
  }
}

// Execute main function
main();
