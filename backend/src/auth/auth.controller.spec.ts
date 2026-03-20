import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return registration success response', async () => {
      const registerDto = { email: 'test@example.com', password: 'Password123' };
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      const mockSession: Record<string, unknown> = {};

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.register(registerDto, mockSession);

      expect(result).toEqual({
        data: mockUser,
        message: 'Registration successful',
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto, mockSession);
    });

    it('should return 400 for validation errors', async () => {
      const registerDto = { email: 'invalid-email', password: '123' };
      const mockSession: Record<string, unknown> = {};

      mockAuthService.register.mockRejectedValue({
        statusCode: 400,
        message: ['email must be an email', 'password is too short'],
        error: 'Bad Request',
      });

      await expect(controller.register(registerDto, mockSession)).rejects.toEqual(
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });
  });

  describe('login', () => {
    it('should return login success response', async () => {
      const loginDto = { email: 'test@example.com', password: 'Password123' };
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      const mockSession: Record<string, unknown> = {};

      mockAuthService.login.mockResolvedValue(mockUser);

      const result = await controller.login(loginDto, mockSession);

      expect(result).toEqual({
        data: mockUser,
        message: 'Login successful',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, mockSession);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const mockSession: Record<string, unknown> = {};

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(controller.login(loginDto, mockSession)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should call authService.logout, clear cookie, and return success message', async () => {
      const mockSession: Record<string, unknown> = {};
      const mockRes = { clearCookie: jest.fn() };

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockSession, mockRes as never);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockSession);
      expect(mockRes.clearCookie).toHaveBeenCalledWith('connect.sid');
    });

    it('should propagate error when session destroy fails', async () => {
      const mockSession: Record<string, unknown> = {};
      const mockRes = { clearCookie: jest.fn() };

      mockAuthService.logout.mockRejectedValue(new Error('Session error'));

      await expect(controller.logout(mockSession, mockRes as never)).rejects.toThrow('Session error');
      expect(mockRes.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return user data when session exists', () => {
      const mockSession: Record<string, unknown> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const result = controller.me(mockSession);

      expect(result).toEqual({
        data: { id: 1, email: 'test@example.com', role: 'user' },
      });
    });

    it('should throw UnauthorizedException when session is missing', () => {
      const mockSession: Record<string, unknown> = {};

      expect(() => controller.me(mockSession)).toThrow(UnauthorizedException);
    });
  });
});
