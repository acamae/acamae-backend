import { execSync } from 'child_process';

try {
  const [, , msgFile] = process.argv;
  console.log('🔍 Checking commit message...');
  execSync(`npx --no-install commitlint --edit ${msgFile}`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Commit message validation failed:', error.message);
  process.exit(1);
}
