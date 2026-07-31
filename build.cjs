const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [VERCEL BUILD] Starting build process...');

const isFrontendSubdir = fs.existsSync(path.join(__dirname, 'src')) && fs.existsSync(path.join(__dirname, 'index.html'));

if (isFrontendSubdir) {
  console.log('📍 Executing build inside frontend subfolder...');
  execSync('npx vite build', { stdio: 'inherit' });
} else {
  console.log('📍 Executing build at repository root level...');
  const frontendDir = path.join(__dirname, 'frontend');
  if (fs.existsSync(frontendDir)) {
    console.log('📦 Installing dependencies in frontend...');
    execSync('npm --prefix frontend install', { stdio: 'inherit' });
    console.log('⚡ Running vite build in frontend...');
    execSync('npm --prefix frontend run build', { stdio: 'inherit' });
    
    const srcDir = path.join(frontendDir, 'dist');
    const destDir = path.join(__dirname, 'dist');
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log('✅ [VERCEL BUILD] Successfully populated root ./dist folder');
    }
  }
}
