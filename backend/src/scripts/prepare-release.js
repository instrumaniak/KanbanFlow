const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootPackageJsonPath = path.resolve(__dirname, '../../package.json');
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

const releaseDir = path.resolve(__dirname, '../../release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const bcryptVersion = rootPackageJson.dependencies?.bcrypt || '^6.0.0';

const releasePackageJson = {
  name: 'kanbanflow-release',
  version: rootPackageJson.version || '0.0.1',
  dependencies: {
    bcrypt: bcryptVersion,
  },
};

fs.writeFileSync(
  path.join(releaseDir, 'package.json'),
  JSON.stringify(releasePackageJson, null, 2),
);

console.log(`Generated release/package.json with bcrypt@${bcryptVersion}`);

const installResult = spawnSync('npm', ['install', '--production'], {
  cwd: releaseDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (installResult.status !== 0) {
  console.error('npm install --production failed in release/ directory');
  process.exit(1);
}

console.log('Release dependencies installed successfully.');
