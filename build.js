import { execSync } from 'child_process';

// Check if we are running in a static hosting provider (like Cloudflare Pages, Netlify, Vercel)
const isStaticPlatform = process.env.CF_PAGES || process.env.NETLIFY || process.env.VERCEL;

if (!isStaticPlatform) {
  console.log('Building backend server to CJS...');
  try {
    execSync('esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit' });
    console.log('Server build completed successfully.');
  } catch (error) {
    console.error('Server build failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
} else {
  console.log('Static hosting platform detected (CF_PAGES/NETLIFY/VERCEL). Skipping server compilation and keeping dist/ as purely static assets.');
}
