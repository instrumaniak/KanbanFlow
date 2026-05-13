import 'dotenv/config';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import inquirer from 'inquirer';
import { User } from '../users/entities/user.entity';
import { buildDataSourceOptions } from '../database/data-source-options';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d|[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/;

export const ERROR_MESSAGES = {
  invalidEmail: 'Invalid email format. Please provide a valid email address.',
  weakPassword:
    'Password must be at least 8 characters and contain at least one letter and one number or special character.',
  duplicateAdmin: 'An admin user already exists. Only one superadmin is allowed.',
  missingEnv: 'Configuration file (.env) not found. Please ensure .env is configured.',
  databaseError: 'Failed to connect to database. Please check your database configuration.',
};

interface CliArgs {
  email?: string;
  password?: string;
  help?: boolean;
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    const emailMatch = arg.match(/^--email=(.+)$/);
    if (emailMatch) {
      result.email = emailMatch[1];
      continue;
    }

    const passwordMatch = arg.match(/^--password=(.+)$/);
    if (passwordMatch) {
      result.password = passwordMatch[1];
      continue;
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`
Usage: node create-admin.js [options]

Options:
  --email=<email>     Admin email address
  --password=<pwd>    Admin password (WARNING: visible in shell history)
  --help, -h          Show this help message

Examples:
  node create-admin.js                    # Interactive mode
  node create-admin.js --email=admin@example.com  # Hybrid mode
  node create-admin.js --email=admin@example.com --password=SecurePass123  # Scripted mode

Security Warning: Using --password exposes the value in shell history.
Use interactive mode for better security.
`);
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) {
    return ERROR_MESSAGES.invalidEmail;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!PASSWORD_REGEX.test(password)) {
    return ERROR_MESSAGES.weakPassword;
  }
  return null;
}

async function promptEmail(): Promise<string> {
  const answers = await inquirer.prompt<{ email: string }>([
    {
      type: 'input',
      name: 'email',
      message: 'Enter admin email:',
      validate: (input: string) => {
        const error = validateEmail(input);
        return error || true;
      },
    },
  ]);
  return answers.email;
}

async function promptPassword(): Promise<string> {
  const answers = await inquirer.prompt<{ password: string }>([
    {
      type: 'password',
      name: 'password',
      message: 'Enter admin password:',
      validate: (input: string) => {
        const error = validatePassword(input);
        return error || true;
      },
    },
  ]);
  return answers.password;
}

interface DatabaseError {
  code?: string;
  message?: string;
}

async function main(): Promise<void> {
  let exitCode = 0;
  let dataSource: DataSource | undefined;

  try {
    await mainInternal();
  } catch (error) {
    console.error('Fatal error:', error);
    exitCode = 1;
  } finally {
    if (dataSource?.isInitialized) {
      try {
        await dataSource.destroy();
      } catch (destroyError) {
        console.error('Failed to destroy data source:', destroyError);
        exitCode = 1;
      }
    }
    process.exitCode = exitCode;
  }
}

export async function mainInternal(args = process.argv.slice(2)): Promise<void> {
  const parsedArgs = parseArgs(args);

  if (parsedArgs.help) {
    showHelp();
    return;
  }

  if (!process.env.DB_HOST && !process.env.DB_PORT) {
    console.error(ERROR_MESSAGES.missingEnv);
    throw new Error('Missing environment configuration');
  }

  let email = parsedArgs.email;
  let password = parsedArgs.password;

  if (!email) {
    email = await promptEmail();
  }

  if (!password) {
    password = await promptPassword();
  }

  const emailError = validateEmail(email);
  if (emailError) {
    console.error(emailError);
    throw new Error('Email validation failed');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    console.error(passwordError);
    throw new Error('Password validation failed');
  }

  const dataSource = new DataSource(buildDataSourceOptions());
  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(User);

    const existingAdmin = await userRepo.findOne({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.error(ERROR_MESSAGES.duplicateAdmin);
      throw new Error('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userRepo.insert({
      email,
      password: hashedPassword,
      role: 'admin',
    });

    console.log(`Admin user created successfully: ${email}`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

process.on('SIGINT', () => {
  console.log('\nOperation cancelled.');
  process.exitCode = 0;
});

// This script is always executed directly as a CLI tool.
main();
