import 'dotenv/config';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import inquirer from 'inquirer';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';

const dataSourceOptions = {
  type: 'mysql' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'kanbanflow_dev',
  entities: [User, Project],
};

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
Usage: npm run create-admin [options]

Options:
  --email=<email>     Admin email address
  --password=<pwd>    Admin password (WARNING: visible in shell history)
  --help, -h          Show this help message

Examples:
  npm run create-admin                    # Interactive mode
  npm run create-admin -- --email=admin@example.com  # Hybrid mode
  npm run create-admin -- --email=admin@example.com --password=SecurePass123  # Scripted mode

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
  try {
    await mainInternal();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

export async function mainInternal(args = process.argv.slice(2)): Promise<void> {
  const parsedArgs = parseArgs(args);

  if (parsedArgs.help) {
    showHelp();
    process.exit(0);
  }

  if (!process.env.DB_HOST && !process.env.DB_PORT) {
    console.error(ERROR_MESSAGES.missingEnv);
    process.exit(1);
  }

  let email = parsedArgs.email;
  let password = parsedArgs.password;

  try {
    if (!email) {
      email = await promptEmail();
    }

    if (!password) {
      password = await promptPassword();
    }

    const emailError = validateEmail(email);
    if (emailError) {
      console.error(emailError);
      process.exit(1);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      console.error(passwordError);
      process.exit(1);
    }

    const dataSource = new DataSource(dataSourceOptions);
    await dataSource.initialize();

    try {
      const userRepo = dataSource.getRepository(User);

      const existingAdmin = await userRepo.findOne({
        where: { role: 'admin' },
      });

      if (existingAdmin) {
        console.error(ERROR_MESSAGES.duplicateAdmin);
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await userRepo.insert({
        email,
        password: hashedPassword,
        role: 'admin',
      });

      console.log(`✅ Admin user created successfully: ${email}`);
      process.exit(0);
    } finally {
      await dataSource.destroy();
    }
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED') {
      console.error(ERROR_MESSAGES.databaseError);
    } else {
      console.error('Error:', dbError.message || 'Unknown error occurred');
    }
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\nOperation cancelled.');
  process.exit(0);
});

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
