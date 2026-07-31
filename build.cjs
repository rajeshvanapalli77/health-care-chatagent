const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [VERCEL BUILD] Starting build process...');

const isFrontendSubdir = fs.existsSync(path.join(__dirname, 'src')) && fs.existsSync(path.join(__dirname, 'index.html'));

if (isFrontendSubdir) {
  console.log('📍 Executing build inside frontend subfolder...');
  execSync('npx vite build', { stdio: 'inherit' });

  const src = path.join(__dirname, 'dist');
  const parentDist = path.join(__dirname, '..', 'dist');

  if (fs.existsSync(src)) {
    try {
      if (path.resolve(src) !== path.resolve(parentDist)) {
        fs.mkdirSync(parentDist, { recursive: true });
        fs.cpSync(src, parentDist, { recursive: true });
      }
      console.log('✅ [VERCEL BUILD] Successfully replicated dist to root!');
    } catch (e) {
      console.log('Note on replication:', e.message);
    }
  }
} else {
  console.log('📍 Executing build at repository root level...');
  const frontendDir = path.join(__dirname, 'frontend');
  if (fs.existsSync(frontendDir)) {
    console.log('📦 Installing dependencies in frontend...');
    execSync('npm --prefix frontend install', { stdio: 'inherit' });
    console.log('⚡ Running vite build in frontend...');
    execSync('npm --prefix frontend run build', { stdio: 'inherit' });

    const srcDir = path.join(frontendDir, 'dist');
    const rootDist = path.join(__dirname, 'dist');

    if (fs.existsSync(srcDir)) {
      if (path.resolve(srcDir) !== path.resolve(rootDist)) {
        fs.mkdirSync(rootDist, { recursive: true });
        fs.cpSync(srcDir, rootDist, { recursive: true });
      }
      console.log('✅ [VERCEL BUILD] Successfully populated root ./dist folder');
    }
  }
}
