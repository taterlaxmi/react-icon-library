import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { updatePreview } from './update-preview.mjs';

const isDev = process.argv.includes('--dev');
const shouldPreview = isDev || process.argv.includes('--preview');

console.log('🚀 [Pipeline] Starting React Icon Library pipeline...\n');

try {
  // Step 1: Ensure CLI is compiled with latest code
  console.log('📦 [1/4] Preparing generator CLI...');
  execSync('npx tsup src/generator.ts src/cli.ts --format="esm,cjs" --external sharp,@svgr/core,imagetracer --silent', { stdio: 'inherit' });

  // Step 2: Generate React icon components from brand-assets
  console.log('\n🎨 [2/4] Converting assets from brand-assets/ into React components...');
  execSync('node ./dist/cli.js ./brand-assets --output ./src/icons --overwrite', { stdio: 'inherit' });

  // Step 3: Compile full library (ESM, CJS, DTS)
  console.log('\n🔨 [3/4] Compiling production bundles & TypeScript definitions...');
  execSync('npx tsup src/index.ts src/generator.ts src/cli.ts --format esm,cjs --dts --clean --splitting false', { stdio: 'inherit' });

  // Step 4: Auto-update preview.html
  console.log('\n✨ [4/4] Synchronizing preview gallery...');
  await updatePreview();

  console.log('\n✅ [Pipeline] Completed successfully!');

  // Launch preview if dev mode
  if (shouldPreview) {
    console.log('\n🌐 Launching preview gallery in browser...');
    const openCmd =
      process.platform === 'win32'
        ? 'start preview.html'
        : process.platform === 'darwin'
        ? 'open preview.html'
        : 'xdg-open preview.html';
    try {
      execSync(openCmd, { stdio: 'ignore' });
    } catch {
      // Non-fatal if browser cannot be launched
    }
  }
} catch (error) {
  console.error('\n❌ [Pipeline] Failed:', error.message);
  process.exit(1);
}
