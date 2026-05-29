const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const releaseDir = path.resolve(__dirname, '../../release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// --- Step 1: Build frontend ---
const frontendDir = path.resolve(__dirname, '../../../frontend');

if (!fs.existsSync(frontendDir)) {
  console.error('Frontend directory not found at:', frontendDir);
  process.exit(1);
}

console.log('Building frontend...');
const frontendBuild = spawnSync('npm', ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (frontendBuild.status !== 0) {
  console.error('Frontend build failed.');
  process.exit(1);
}

console.log('Frontend build completed.');

// --- Step 2: Copy frontend/dist into release/public ---
const frontendDist = path.join(frontendDir, 'dist');
const publicDir = path.join(releaseDir, 'public');

if (!fs.existsSync(frontendDist)) {
  console.error('Frontend dist folder not found at:', frontendDist);
  process.exit(1);
}

// Remove old public/ if it exists to avoid stale files
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(frontendDist, publicDir);

console.log(`Copied frontend/dist to release/public`);
console.log('Release preparation completed successfully.');
