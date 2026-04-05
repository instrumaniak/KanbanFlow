import { validateEmail, validatePassword, parseArgs, ERROR_MESSAGES } from './create-admin';

describe('create-admin CLI validation', () => {
  describe('validateEmail', () => {
    it('should return null for valid email', () => {
      expect(validateEmail('admin@example.com')).toBeNull();
      expect(validateEmail('test.user@domain.org')).toBeNull();
      expect(validateEmail('admin+tag@example.co.uk')).toBeNull();
    });

    it('should return error for invalid email - no @', () => {
      expect(validateEmail('example.com')).toBe(ERROR_MESSAGES.invalidEmail);
    });

    it('should return error for invalid email - no domain', () => {
      expect(validateEmail('admin@')).toBe(ERROR_MESSAGES.invalidEmail);
    });

    it('should return error for invalid email - no tld', () => {
      expect(validateEmail('admin@example')).toBe(ERROR_MESSAGES.invalidEmail);
    });

    it('should return error for invalid email - empty', () => {
      expect(validateEmail('')).toBe(ERROR_MESSAGES.invalidEmail);
    });

    it('should return error for invalid email - spaces', () => {
      expect(validateEmail('admin @example.com')).toBe(ERROR_MESSAGES.invalidEmail);
    });

    it('should return error for invalid email - missing local part', () => {
      expect(validateEmail('@example.com')).toBe(ERROR_MESSAGES.invalidEmail);
    });
  });

  describe('validatePassword', () => {
    it('should return null for valid password with number', () => {
      expect(validatePassword('password123')).toBeNull();
      expect(validatePassword('TestPass123')).toBeNull();
      expect(validatePassword('abc12345')).toBeNull();
    });

    it('should return null for valid password with special char (and number)', () => {
      expect(validatePassword('TestPass@123')).toBeNull();
      expect(validatePassword('abc#1234')).toBeNull();
      expect(validatePassword('TestPass1!')).toBeNull();
    });

    it('should return error for password too short', () => {
      expect(validatePassword('abc')).toBe(ERROR_MESSAGES.weakPassword);
      expect(validatePassword('1234567')).toBe(ERROR_MESSAGES.weakPassword);
    });

    it('should return error for password missing letter', () => {
      expect(validatePassword('12345678')).toBe(ERROR_MESSAGES.weakPassword);
      expect(validatePassword('123456!@')).toBe(ERROR_MESSAGES.weakPassword);
    });

    it('should return error for password missing number and special', () => {
      expect(validatePassword('password')).toBe(ERROR_MESSAGES.weakPassword);
      expect(validatePassword('abcdefgh')).toBe(ERROR_MESSAGES.weakPassword);
    });

    it('should return error for password with only special char but no number', () => {
      expect(validatePassword('password!')).toBe(ERROR_MESSAGES.weakPassword);
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toBe(ERROR_MESSAGES.weakPassword);
    });
  });

  describe('parseArgs', () => {
    it('should return empty object for no args', () => {
      expect(parseArgs([])).toEqual({});
    });

    it('should parse --email flag', () => {
      expect(parseArgs(['--email=admin@example.com'])).toEqual({
        email: 'admin@example.com',
      });
    });

    it('should parse --password flag', () => {
      expect(parseArgs(['--password=TestPass123'])).toEqual({
        password: 'TestPass123',
      });
    });

    it('should parse both --email and --password flags', () => {
      expect(parseArgs(['--email=admin@example.com', '--password=TestPass123'])).toEqual({
        email: 'admin@example.com',
        password: 'TestPass123',
      });
    });

    it('should parse --help flag', () => {
      expect(parseArgs(['--help'])).toEqual({ help: true });
    });

    it('should parse -h shortcut', () => {
      expect(parseArgs(['-h'])).toEqual({ help: true });
    });

    it('should handle args with special chars in values', () => {
      expect(parseArgs(['--password=P@ssw0rd!'])).toEqual({
        password: 'P@ssw0rd!',
      });
    });

    it('should ignore unknown args', () => {
      expect(parseArgs(['--unknown=value', '--email=test@test.com'])).toEqual({
        email: 'test@test.com',
      });
    });

    it('should ignore empty value after equals', () => {
      expect(parseArgs(['--email='])).toEqual({});
    });
  });
});
