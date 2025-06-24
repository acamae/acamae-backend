#!/usr/bin/env node

// Consolidated script for environment variable management
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
};

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.join(__dirname, '..', envFile);
const targetPath = path.join(__dirname, '..', '.env');

// Check if Windows
const isWindows = os.platform() === 'win32';

// Function to copy environment variables for Prisma
function copyEnvForPrisma() {
  log.info(`Copying environment configuration for Prisma: ${NODE_ENV}`);
  log.info(`📁 Source file: ${envFile}`);

  if (isWindows) {
    log.info(`🪟 Windows system detected`);
    log.info(`💡 Make sure Docker Desktop is installed and running`);
  }

  try {
    // Verify that the environment file exists
    if (!fs.existsSync(envPath)) {
      log.error(`Source file not found: ${envFile}`);
      process.exit(1);
    }

    // Read the environment file
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Write to .env (so Prisma can read it)
    fs.writeFileSync(targetPath, envContent);

    log.success('.env file created successfully for Prisma');
    log.info(`📊 Variables loaded from: ${envFile}`);

    // Show some variables (without showing secrets)
    const envVars = dotenv.parse(envContent);
    log.info(`   - NODE_ENV: ${envVars.NODE_ENV}`);
    log.info(`   - PORT: ${envVars.PORT}`);
    log.info(`   - DATABASE_URL: ${envVars.DATABASE_URL?.substring(0, 20)}...`);

    return true;
  } catch (error) {
    log.error(`Error copying environment configuration: ${error.message}`);
    process.exit(1);
  }
}

// Function to verify environment configuration
function testEnv() {
  log.info(`Verifying environment variables from: ${envPath}`);

  if (isWindows) {
    log.info(`🪟 Windows system detected`);
    log.info(`💡 Make sure Docker Desktop is installed and running`);
  }

  try {
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      log.error(`Error loading environment file: ${result.error.message}`);
      process.exit(1);
    }

    log.success('Environment variables loaded successfully');

    // Verify critical variables
    const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
    const missingVars = criticalVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      log.error(`Missing environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }

    log.success('All critical variables are configured');
    log.info(`📊 Current configuration:`);
    log.info(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    log.info(`   - PORT: ${process.env.PORT}`);
    log.info(`   - DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`);

    return true;
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Main function
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'copy':
    case 'copy-for-prisma':
      copyEnvForPrisma();
      break;

    case 'test':
    case 'verify':
      testEnv();
      break;

    case 'setup':
      // Copy and then verify
      copyEnvForPrisma();
      testEnv();
      break;

    default:
      console.log('Usage: node env-manager.js <command>');
      console.log('');
      console.log('Available commands:');
      console.log('  copy, copy-for-prisma  - Copy environment variables for Prisma');
      console.log('  test, verify           - Verify environment configuration');
      console.log('  setup                  - Copy and verify (complete)');
      console.log('');
      console.log('Examples:');
      console.log('  node env-manager.js copy');
      console.log('  node env-manager.js test');
      console.log('  node env-manager.js setup');
      process.exit(1);
  }
}

main();
