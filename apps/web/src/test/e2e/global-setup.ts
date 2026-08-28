import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../../../..');

export default async function globalSetup() {
  console.log('🔧 Global Setup: Running E2E seed...');

  try {
    execSync('corepack pnpm --filter @nextcommerce/api db:seed:e2e', {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' },
    });
    console.log('✅ E2E seed completed');
  } catch (error) {
    console.error('❌ E2E seed failed:', error);
    throw error;
  }

  console.log('🔍 Verifying API readiness...');
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:3001/ready');
      if (response.ok) {
        console.log('✅ API ready endpoint responding');
        break;
      }
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('🎭 Global setup complete');
}
