import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private registrationEnabled = true;

  constructor(private readonly usersService: UsersService) {}

  async register(
    registerDto: RegisterDto,
    session: Record<string, unknown>,
  ): Promise<{ id: number; email: string; role: string }> {
    if (!this.registrationEnabled) {
      throw new ForbiddenException('Registration is currently closed');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
    });

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
}
