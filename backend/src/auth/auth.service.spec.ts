import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv, REGISTRATION_ENABLED: 'true' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: mockUsersService }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('register', () => {
    const registerDto = { email: 'Test@Example.COM', password: 'Password123' };
    const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
    const mockSession: Record<string, unknown> = {};

    it('should register a user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto, mockSession);

      expect(result).toEqual({ id: 1, email: 'test@example.com', role: 'user' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockSession.userId).toBe(1);
      expect(mockSession.email).toBe('test@example.com');
      expect(mockSession.role).toBe('user');
    });

    it('should normalize email to lowercase before storage', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register(registerDto, mockSession);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' }),
      );
    });

    it('should throw ConflictException with period when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto, mockSession)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        'Email already registered.',
      );
    });

    it('should handle DB duplicate entry race condition', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const dupError = new QueryFailedError('INSERT', [], new Error('Duplicate'));
      (dupError as unknown as { code: string }).code = 'ER_DUP_ENTRY';
      mockUsersService.create.mockRejectedValue(dupError);

      await expect(service.register(registerDto, mockSession)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        'Email already registered.',
      );
    });

    it('should throw ForbiddenException with period when registration is disabled', async () => {
      (service as unknown as { registrationEnabled: boolean }).registrationEnabled = false;

      await expect(service.register(registerDto, mockSession)).rejects.toThrow(ForbiddenException);
      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        'Registration is currently closed.',
      );
    });

    it('should hash password with bcrypt before storing', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register(registerDto, mockSession);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedPassword',
        }),
      );
    });

    it('should set session data on successful registration', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register(registerDto, mockSession);

      expect(mockSession.userId).toBe(1);
      expect(mockSession.email).toBe('test@example.com');
      expect(mockSession.role).toBe('user');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when user exists', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(1);

      expect(result).toEqual({ id: 1, email: 'test@example.com', role: 'user' });
    });

    it('should return null when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.getCurrentUser(999);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'Test@Example.COM', password: 'Password123' };
    const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword', role: 'user' };
    const mockSession: Record<string, unknown> = {};

    it('should login user with valid credentials and set session', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto, mockSession);

      expect(result).toEqual({ id: 1, email: 'test@example.com', role: 'user' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'hashedPassword');
      expect(mockSession.userId).toBe(1);
      expect(mockSession.email).toBe('test@example.com');
      expect(mockSession.role).toBe('user');
    });

    it('should normalize email to lowercase before lookup', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto, mockSession);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException with generic message when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto, mockSession)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto, mockSession)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException with generic message when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, mockSession)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto, mockSession)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('logout', () => {
    it('should destroy session on logout', async () => {
      const destroyFn = jest.fn((cb: (err: null) => void) => cb(null));
      const mockSession: Record<string, unknown> = {
        destroy: destroyFn as unknown as (cb: (err: Error | null) => void) => void,
      };

      await service.logout(mockSession);

      expect(destroyFn).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when destroy is unavailable', async () => {
      const mockSession: Record<string, unknown> = {};

      await expect(service.logout(mockSession)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
