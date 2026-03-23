import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionGuard } from './session.guard';

describe('SessionGuard', () => {
  let guard: SessionGuard;

  beforeEach(() => {
    guard = new SessionGuard();
  });

  const createMockContext = (session: Record<string, unknown> | undefined): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ session }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with valid userId', () => {
    const context = createMockContext({ userId: 1 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow request with large userId', () => {
    const context = createMockContext({ userId: 999999 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException when session is undefined', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is null', () => {
    const context = createMockContext(null as unknown as Record<string, unknown>);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is missing', () => {
    const context = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is string', () => {
    const context = createMockContext({ userId: '1' as unknown as number });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is zero', () => {
    const context = createMockContext({ userId: 0 });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when userId is negative', () => {
    const context = createMockContext({ userId: -1 });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow decimal userId (guard only checks type)', () => {
    const context = createMockContext({ userId: 1.5 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow session with additional properties', () => {
    const context = createMockContext({ userId: 1, email: 'test@example.com', role: 'user' });
    expect(guard.canActivate(context)).toBe(true);
  });
});
