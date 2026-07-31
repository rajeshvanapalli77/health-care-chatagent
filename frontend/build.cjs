const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [FRONTEND BUILD] Running Vite build...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  
  const src = path.join(__dirname, 'dist');
  const parentDist = path.join(__dirname, '..', 'dist');

  if (fs.existsSync(src)) {
    try {
      if (path.resolve(src) !== path.resolve(parentDist)) {
        fs.mkdirSync(parentDist, { recursive: true });
        fs.cpSync(src, parentDist, { recursive: true });
      }
      console.log('✅ [FRONTEND BUILD] Replicated dist to parent dist!');
    } catch (e) {
      console.log('Replication note:', e.message);
    }
  }
  console.log('✅ [FRONTEND BUILD] Build complete!');
} catch (err) {
  console.error('❌ [FRONTEND BUILD] Build error:', err);
  process.exit(1);
}
