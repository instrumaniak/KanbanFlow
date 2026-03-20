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
import { LoginDto } from './dto/login.dto';

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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async login(@Body() loginDto: LoginDto, @Session() session: Record<string, unknown>) {
    const user = await this.authService.login(loginDto, session);
    return {
      data: user,
      message: 'Login successful',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Session() session: Record<string, unknown>) {
    await this.authService.logout(session);
    return { message: 'Logout successful' };
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
}
