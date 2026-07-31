const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [VERCEL BUILD] Starting Frontend Build Process...');

try {
  console.log('📦 Installing frontend dependencies...');
  execSync('npm --prefix frontend install', { stdio: 'inherit' });

  console.log('⚡ Building Vite production bundle...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });

  const srcDir = path.join(__dirname, 'frontend', 'dist');
  const destDir = path.join(__dirname, 'dist');

  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('✅ [VERCEL BUILD] Successfully copied frontend/dist to ./dist');
  } else {
    console.error('❌ [VERCEL BUILD] Build directory frontend/dist was not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ [VERCEL BUILD] Build failed:', error);
  process.exit(1);
}
