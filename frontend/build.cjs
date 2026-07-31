const { execSync } = require('child_process');

console.log('🚀 [FRONTEND BUILD] Running Vite build...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ [FRONTEND BUILD] Build complete!');
} catch (err) {
  console.error('❌ [FRONTEND BUILD] Build error:', err);
  process.exit(1);
}
