#!/usr/bin/env node

//===============================================================================
// SSL Certificate Generator
//===============================================================================
// DESCRIPTION:
//   Generates self-signed SSL certificates for local development environments.
//   Creates secure certificates compatible with Docker, Nginx, and local servers.
//
// WHEN TO USE:
//   - Setting up HTTPS for local development
//   - Docker environments requiring SSL
//   - Local testing of SSL-enabled features
//   - Development environments that need encrypted connections
//   - Before deploying applications that require HTTPS
//
// USAGE:
//   node scripts/generate-ssl.js [options]
//
// OPTIONS:
//   --help, -h     Show help information
//   --force        Overwrite existing certificates
//   --domain <name> Custom domain name (default: localhost)
//
// EXAMPLES:
//   node scripts/generate-ssl.js                    # Generate localhost certificates
//   node scripts/generate-ssl.js --force            # Overwrite existing certs
//   node scripts/generate-ssl.js --domain dev.local # Custom domain
//
// REQUIREMENTS:
//   - OpenSSL installed and available in PATH
//   - Write permissions to docker/ssl directory
//   - Node.js >= 22.16.0
//
// OUTPUT:
//   - docker/ssl/selfsigned.crt (Certificate file)
//   - docker/ssl/selfsigned.key (Private key file)
//
// SECURITY NOTES:
//   - These are SELF-SIGNED certificates for development only
//   - Do NOT use in production environments
//   - Browsers will show security warnings (normal for dev)
//   - Valid for 365 days from generation date
//
// EXIT CODES:
//   0 - Success
//   1 - OpenSSL not installed or execution error
//   2 - File system error (permissions, disk space)
//===============================================================================

import { execSync } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration constants
const CONFIG = {
  targetDir: path.join(__dirname, '../docker/ssl'),
  certFile: 'selfsigned.crt',
  keyFile: 'selfsigned.key',
  validityDays: 365,
  keySize: 2048,
  defaultDomain: 'localhost',
};

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

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bold}🔒 ${msg}${colors.reset}`),
};

/**
 * Check if OpenSSL is installed and available
 * @returns {boolean} True if OpenSSL is available
 */
function isOpenSSLInstalled() {
  try {
    execSync('openssl version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    log.error(`OpenSSL is not installed or not available in PATH: ${error.message}`);
    return false;
  }
}

/**
 * Get OpenSSL version information
 * @returns {string} OpenSSL version string
 */
function getOpenSSLVersion() {
  try {
    const version = execSync('openssl version', { encoding: 'utf8' }).trim();
    return version;
  } catch (error) {
    log.warning(`Could not get OpenSSL version: ${error.message}`);
    return 'Unknown version';
  }
}

/**
 * Check if certificates already exist
 * @returns {boolean} True if certificates exist
 */
function certificatesExist() {
  const certPath = path.join(CONFIG.targetDir, CONFIG.certFile);
  const keyPath = path.join(CONFIG.targetDir, CONFIG.keyFile);
  return fs.existsSync(certPath) && fs.existsSync(keyPath);
}

/**
 * Get certificate information if it exists
 * @returns {Object|null} Certificate information or null
 */
function getCertificateInfo() {
  try {
    const certPath = path.join(CONFIG.targetDir, CONFIG.certFile);
    if (!fs.existsSync(certPath)) return null;

    const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, { encoding: 'utf8' });

    // Extract useful information using RegExp.exec() as recommended by SonarQube
    const subjectRegex = /Subject:.*?CN\s*=\s*([^,\n]+)/;
    const validityRegex = /Not After\s*:\s*(.+)/;

    const subjectMatch = subjectRegex.exec(certInfo);
    const validityMatch = validityRegex.exec(certInfo);

    return {
      subject: subjectMatch ? subjectMatch[1].trim() : 'Unknown',
      expiryDate: validityMatch ? validityMatch[1].trim() : 'Unknown',
      path: certPath,
    };
  } catch (error) {
    log.warning(`Could not parse certificate information: ${error.message}`);
    return null;
  }
}

/**
 * Create target directory if it doesn't exist
 * @returns {boolean} True if directory is ready
 */
function ensureTargetDirectory() {
  try {
    if (!fs.existsSync(CONFIG.targetDir)) {
      fs.mkdirSync(CONFIG.targetDir, { recursive: true });
      log.info(`Created target directory: ${CONFIG.targetDir}`);
    }
    return true;
  } catch (error) {
    log.error(`Failed to create target directory: ${error.message}`);
    return false;
  }
}

/**
 * Generate SSL certificates using OpenSSL
 * @param {string} domain - Domain name for the certificate
 * @param {boolean} force - Whether to overwrite existing certificates
 * @returns {boolean} True if generation was successful
 */
function generateCertificates(domain = CONFIG.defaultDomain, force = false) {
  try {
    // Check if certificates exist and handle accordingly
    if (certificatesExist() && !force) {
      const existingCert = getCertificateInfo();
      log.warning('SSL certificates already exist');
      if (existingCert) {
        console.log(`  - Domain: ${existingCert.subject}`);
        console.log(`  - Expires: ${existingCert.expiryDate}`);
        console.log(`  - Location: ${existingCert.path}`);
      }
      log.info('Use --force to overwrite existing certificates');
      return true; // Not an error, certificates exist
    }

    log.info(`Generating SSL certificates for domain: ${domain}`);
    log.info(`Validity period: ${CONFIG.validityDays} days`);
    log.info(`Key size: ${CONFIG.keySize} bits`);

    // Build OpenSSL command with cross-platform compatibility
    const certPath = path.join(CONFIG.targetDir, CONFIG.certFile);
    const keyPath = path.join(CONFIG.targetDir, CONFIG.keyFile);

    // Subject string - different format for Windows vs Unix
    const subjectString = process.platform === 'win32' ? `//CN=${domain}` : `/CN=${domain}`;

    const command = [
      'openssl',
      'req',
      '-x509',
      '-nodes',
      `-days ${CONFIG.validityDays}`,
      `-newkey rsa:${CONFIG.keySize}`,
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      `-subj "${subjectString}"`,
    ].join(' ');

    log.info('Executing OpenSSL command...');

    // Execute the command
    execSync(command, {
      cwd: CONFIG.targetDir,
      stdio: 'pipe', // Capture output to avoid cluttering console
    });

    // Verify files were created
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      throw new Error('Certificate files were not created');
    }

    // Check file sizes (should not be empty)
    const certStats = fs.statSync(certPath);
    const keyStats = fs.statSync(keyPath);

    if (certStats.size === 0 || keyStats.size === 0) {
      throw new Error('Generated certificate files are empty');
    }

    log.success('SSL certificates generated successfully');
    console.log(`  - Certificate: ${certPath} (${certStats.size} bytes)`);
    console.log(`  - Private key: ${keyPath} (${keyStats.size} bytes)`);
    console.log(`  - Domain: ${domain}`);
    console.log(`  - Valid for: ${CONFIG.validityDays} days`);

    return true;
  } catch (error) {
    log.error(`Failed to generate SSL certificates: ${error.message}`);
    return false;
  }
}

/**
 * Display installation instructions for OpenSSL
 */
function showOpenSSLInstallation() {
  log.error('OpenSSL is required but not installed');
  console.log('');
  log.info('Install OpenSSL:');

  switch (process.platform) {
    case 'win32':
      console.log('  - Download from: https://slproweb.com/products/Win32OpenSSL.html');
      console.log('  - Or use Chocolatey: choco install openssl');
      console.log('  - Or use winget: winget install OpenSSL');
      break;
    case 'darwin':
      console.log('  - Using Homebrew: brew install openssl');
      console.log('  - Using MacPorts: sudo port install openssl');
      break;
    case 'linux':
      console.log('  - Ubuntu/Debian: sudo apt-get install openssl');
      console.log('  - CentOS/RHEL: sudo yum install openssl');
      console.log('  - Fedora: sudo dnf install openssl');
      break;
    default:
      console.log('  - Use your system package manager to install openssl');
  }
  console.log('');
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`${colors.cyan}${colors.bold}SSL Certificate Generator${colors.reset}`);
  console.log('');
  console.log('USAGE:');
  console.log('  node generate-ssl.js [options]');
  console.log('');
  console.log('OPTIONS:');
  console.log('  --help, -h         Show this help message');
  console.log('  --force            Overwrite existing certificates');
  console.log('  --domain <name>    Custom domain name (default: localhost)');
  console.log('');
  console.log('EXAMPLES:');
  console.log('  node generate-ssl.js                    # Generate localhost certificates');
  console.log('  node generate-ssl.js --force            # Overwrite existing certificates');
  console.log('  node generate-ssl.js --domain dev.local # Custom domain');
  console.log('');
  console.log('OUTPUT FILES:');
  console.log(`  ${CONFIG.targetDir}/${CONFIG.certFile}    # Certificate file`);
  console.log(`  ${CONFIG.targetDir}/${CONFIG.keyFile}     # Private key file`);
  console.log('');
  console.log('NOTES:');
  console.log('  - Certificates are self-signed for development use only');
  console.log('  - Valid for 365 days from generation date');
  console.log('  - Browsers will show security warnings (normal for dev certificates)');
  console.log('');
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed options
 */
function parseArguments(args) {
  const options = {
    help: false,
    force: false,
    domain: CONFIG.defaultDomain,
  };

  let i = 2;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        i++;
        break;
      case '--force':
        options.force = true;
        i++;
        break;
      case '--domain':
        if (i + 1 < args.length) {
          options.domain = args[i + 1];
          i += 2; // Skip both current and next argument
        } else {
          throw new Error('--domain option requires a value');
        }
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

/**
 * Main execution function
 */
function main() {
  try {
    // Parse command line arguments
    const options = parseArguments(process.argv);

    // Show help if requested
    if (options.help) {
      showHelp();
      process.exit(0);
    }

    log.header('SSL Certificate Generator');
    log.info(`Platform: ${process.platform}`);
    log.info(`Target directory: ${CONFIG.targetDir}`);

    // Check OpenSSL availability
    if (!isOpenSSLInstalled()) {
      showOpenSSLInstallation();
      process.exit(1);
    }

    const opensslVersion = getOpenSSLVersion();
    log.info(`OpenSSL version: ${opensslVersion}`);

    // Ensure target directory exists
    if (!ensureTargetDirectory()) {
      process.exit(2);
    }

    // Generate certificates
    const success = generateCertificates(options.domain, options.force);

    if (success) {
      console.log('');
      log.success('🎉 SSL certificate generation completed');
      log.info('Next steps:');
      console.log('  1. Configure your server to use the generated certificates');
      console.log('  2. Add certificate to your trusted certificates (optional)');
      console.log('  3. Access your application via HTTPS');
      console.log('');
      log.warning('Remember: These are self-signed certificates for development only');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.log('');
    log.info('Use --help for usage information');
    process.exit(1);
  }
}

// Execute main function
main();
