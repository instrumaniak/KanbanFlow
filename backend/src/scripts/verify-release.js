const fs = require('fs');
const path = require('path');

const releaseDir = path.resolve(__dirname, '../../release');
const requiredFiles = ['app.js', 'migrate.js', 'create-admin.js', 'common.js', 'package.json'];
const requiredDirs = ['node_modules/bcrypt'];

let failed = false;

for (const file of requiredFiles) {
  const filePath = path.join(releaseDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  } else {
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.error(`Empty file: ${file}`);
      failed = true;
    }
  }
}

// Verify all .js files in release/ are non-empty (covers webpack split chunks)
const jsFiles = fs.readdirSync(releaseDir).filter((f) => f.endsWith('.js'));
for (const file of jsFiles) {
  const filePath = path.join(releaseDir, file);
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    console.error(`Empty chunk file: ${file}`);
    failed = true;
  }
}

for (const dir of requiredDirs) {
  const dirPath = path.join(releaseDir, dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`Missing required directory: ${dir}`);
    failed = true;
  }
}

if (failed) {
  console.error('Release artifact verification failed.');
  process.exit(1);
}

console.log('Release artifact verification passed.');
