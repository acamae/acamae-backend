import { execSync } from 'child_process';

try {
  // Get commit message
  const commitMsg = execSync('git log -1 --pretty=%B').toString().trim();
  console.log('Commit message:', commitMsg);

  // Skip for Lerna version commits (detect 'chore(release):')
  if (/^chore\(release\):/i.test(commitMsg)) {
    console.log('⏩ Pre-commit hook skipped for Lerna version commit.');
    process.exit(0);
  }

  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
    .toString()
    .split('\n')
    .filter((file) => /\.(js|jsx)$/.test(file))
    .join(' ');

  // Run tests if there are staged files
  if (stagedFiles) {
    console.log('🧪 Running tests...');
    execSync(`npx jest --bail --findRelatedTests --passWithNoTests ${stagedFiles}`, {
      stdio: 'inherit',
    });
  }

  // Run linter
  console.log('🧪 Running linter...');
  execSync('npx lint-staged', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Pre-commit hook failed:', error.message);
  process.exit(1);
}
