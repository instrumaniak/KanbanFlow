import {
  Injectable,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private registrationEnabled: boolean;

  constructor(private readonly usersService: UsersService) {
    this.registrationEnabled = process.env.REGISTRATION_ENABLED !== 'false';
  }

  async register(
    registerDto: RegisterDto,
    session: Record<string, unknown>,
  ): Promise<{ id: number; email: string; role: string }> {
    if (!this.registrationEnabled) {
      throw new ForbiddenException('Registration is currently closed.');
    }

    const email = registerDto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    let user;
    try {
      user = await this.usersService.create({
        email,
        password: hashedPassword,
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Email already registered.');
      }
      throw new InternalServerErrorException();
    }

    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;

    return { id: user.id, email: user.email, role: user.role };
  }

  async getCurrentUser(
    userId: number,
  ): Promise<{ id: number; email: string; role: string } | null> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(
    loginDto: LoginDto,
    session: Record<string, unknown>,
  ): Promise<{ id: number; email: string; role: string }> {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;

    return { id: user.id, email: user.email, role: user.role };
  }

  async logout(session: Record<string, unknown>): Promise<void> {
    const destroy = session as {
      destroy?: (cb: (err: Error | null) => void) => void;
    };
    if (!destroy.destroy) {
      throw new InternalServerErrorException('Session destroy unavailable');
    }
    await new Promise<void>((resolve, reject) => {
      destroy.destroy!((err: Error | null) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
