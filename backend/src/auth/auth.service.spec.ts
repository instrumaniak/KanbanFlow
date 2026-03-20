import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = { email: 'test@example.com', password: 'Password123' };
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

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        'Email already registered',
      );
    });

    it('should throw ForbiddenException when registration is disabled', async () => {
      // Access private field to disable registration
      (service as unknown as { registrationEnabled: boolean }).registrationEnabled = false;

      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.register(registerDto, mockSession)).rejects.toThrow(
        'Registration is currently closed',
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
});
