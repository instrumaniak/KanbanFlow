import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
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

  describe('me', () => {
    it('should return user data when session exists', async () => {
      const mockSession: Record<string, unknown> = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      const result = await controller.me(mockSession);

      expect(result).toEqual({
        data: { id: 1, email: 'test@example.com', role: 'user' },
      });
    });

    it('should return 401 when session is missing', async () => {
      const mockSession: Record<string, unknown> = {};

      const result = await controller.me(mockSession);

      expect(result).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      });
    });
  });
});
