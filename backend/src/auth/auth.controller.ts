import {
  Controller,
  Post,
  Get,
  Body,
  Session,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 403, description: 'Registration is currently closed.' })
  async register(@Body() registerDto: RegisterDto, @Session() session: Record<string, unknown>) {
    const user = await this.authService.register(registerDto, session);
    return {
      data: user,
      message: 'Registration successful',
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Session() session: Record<string, unknown>) {
    if (!session.userId || !session.email || !session.role) {
      throw new UnauthorizedException();
    }
    return {
      data: {
        id: session.userId,
        email: session.email,
        role: session.role,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Session() session: Record<string, unknown>) {
    return new Promise<void>((resolve, reject) => {
      const destroy = (session as { destroy?: (cb: (err: Error | null) => void) => void }).destroy;
      if (!destroy) return resolve();
      destroy((err: Error | null) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
