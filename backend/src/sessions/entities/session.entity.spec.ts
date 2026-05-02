import { Session } from './session.entity';

describe('Session Entity', () => {
  it('should implement ISession with all required properties', () => {
    const session = new Session();

    expect(session).toHaveProperty('expiredAt');
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('json');
    expect(session).toHaveProperty('destroyedAt');
  });

  it('should set expiredAt to current timestamp by default', () => {
    const now = Date.now();
    const session = new Session();

    expect(session.expiredAt).toBeGreaterThanOrEqual(now - 100);
    expect(session.expiredAt).toBeLessThanOrEqual(now + 100);
  });

  it('should default id to empty string', () => {
    const session = new Session();
    expect(session.id).toBe('');
  });

  it('should default json to empty string', () => {
    const session = new Session();
    expect(session.json).toBe('');
  });

  it('should allow setting all ISession properties', () => {
    const session = new Session();
    session.id = 'test-session-id';
    session.json = '{"userId":1,"email":"test@example.com"}';
    session.expiredAt = Date.now() + 86400000;
    session.destroyedAt = new Date();

    expect(session.id).toBe('test-session-id');
    expect(session.json).toBe('{"userId":1,"email":"test@example.com"}');
    expect(session.destroyedAt).toBeInstanceOf(Date);
  });
});