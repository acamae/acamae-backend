import { User } from '../../../src/domain/entities/User.js';
import { API_ERROR_CODES } from '../../../src/shared/constants/apiCodes.js';
import { MIN_USERNAME_LENGTH, USER_ROLES } from '../../../src/shared/constants/validation.js';

const baseData = {
  id: '1',
  username: 'testuser',
  email: 'user@example.com',
  password: 'Secret123!',
};

describe('User entity', () => {
  it('creates valid user and exposes helpers', () => {
    const future = new Date(Date.now() + 60_000);
    const u = new User({
      ...baseData,
      firstName: 'John',
      lastName: 'Doe',
      role: USER_ROLES.ADMIN,
      verificationToken: 'tok',
      verificationExpiresAt: future,
      resetToken: 'rtok',
      resetExpiresAt: future,
      isVerified: true,
    });

    expect(u.getFullName()).toBe('John Doe');
    expect(u.isAdmin()).toBe(true);
    expect(u.isManager()).toBe(false);
    expect(u.isManagerOrAdmin()).toBe(true);
    expect(u.hasValidVerificationToken()).toBe(true);
    expect(u.hasValidResetToken()).toBe(true);

    const json = u.toJSON();
    expect(json).not.toHaveProperty('verificationToken');

    const jsonSensitive = u.toJSON(true);
    expect(jsonSensitive).toHaveProperty('verificationToken', 'tok');
  });

  it('falls back to username when no names', () => {
    const u = new User(baseData);
    expect(u.getFullName()).toBe('testuser');
  });

  it('throws on short username', () => {
    const data = { ...baseData, username: 'a'.repeat(MIN_USERNAME_LENGTH - 1) };
    expect(() => new User(data)).toThrow();
  });

  it('throws on invalid email', () => {
    expect(() => new User({ ...baseData, email: 'bad' })).toThrow();
  });

  it('throws on invalid role', () => {
    expect(() => new User({ ...baseData, role: 'super' })).toThrow();
  });
});
