import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

describe('create-admin CLI E2E Tests', () => {
  const timeout = 30000;

  function runCli(
    args: string[],
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve) => {
      const child = spawn(
        'npx',
        ['ts-node', '-r', 'tsconfig-paths/register', 'src/scripts/create-admin.ts', ...args],
        {
          shell: true,
          cwd: process.cwd(),
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });

      child.on('error', (error) => {
        resolve({ stdout: '', stderr: error.message, code: 1 });
      });

      setTimeout(() => {
        child.kill();
        resolve({ stdout, stderr, code: 1 });
      }, timeout);
    });
  }

  describe('--help flag', () => {
    it(
      'should display help and exit with code 0',
      async () => {
        const { stdout, code } = await runCli(['--help']);

        expect(stdout).toContain('Usage: node create-admin.js');
        expect(stdout).toContain('--email=<email>');
        expect(stdout).toContain('--password=<pwd>');
        expect(code).toBe(0);
      },
      timeout,
    );
  });

  describe('Scripted mode validation', () => {
    it(
      'should reject invalid email format',
      async () => {
        const { stdout, stderr, code } = await runCli([
          '--email=invalid',
          '--password=TestPass123',
        ]);
        const output = stdout + stderr;

        expect(code).toBe(1);
        expect(output).toContain('Invalid email format');
      },
      timeout,
    );

    it(
      'should reject weak password',
      async () => {
        const { stdout, stderr, code } = await runCli([
          '--email=admin@test.com',
          '--password=weak',
        ]);
        const output = stdout + stderr;

        expect(code).toBe(1);
        expect(output).toContain('Password must be at least 8 characters');
      },
      timeout,
    );
  });

  describe('Duplicate admin prevention', () => {
    it(
      'should create first admin successfully',
      async () => {
        const { stdout, stderr, code } = await runCli([
          '--email=firstadmin@test.com',
          '--password=TestPass123',
        ]);
        const output = stdout + stderr;

        expect(code).toBe(0);
        expect(output).toContain('firstadmin@test.com');
      },
      timeout,
    );

    it(
      'should prevent creating second admin',
      async () => {
        const { stdout, stderr, code } = await runCli([
          '--email=another@test.com',
          '--password=TestPass123',
        ]);
        const output = stdout + stderr;

        expect(code).toBe(1);
        expect(output).toContain('An admin user already exists');
      },
      timeout,
    );
  });

  describe('Argument parsing edge cases', () => {
    it(
      'should handle -h shortcut',
      async () => {
        const { stdout, code } = await runCli(['-h']);

        expect(stdout).toContain('Usage: node create-admin.js');
        expect(code).toBe(0);
      },
      timeout,
    );
  });
});
