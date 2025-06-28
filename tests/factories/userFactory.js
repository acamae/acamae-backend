import { v4 as uuidv4 } from 'uuid';

export const makeUser = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 1000).toString();
  return {
    id,
    email: overrides.email ?? `user${id}@example.com`,
    username: overrides.username ?? `user${id}`,
    password: overrides.password ?? 'Password123!',
    role: overrides.role ?? 'user',
    isVerified: overrides.isVerified ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordHash: overrides.passwordHash, // optional
    verificationToken: overrides.verificationToken,
    verificationExpiresAt: overrides.verificationExpiresAt,
  };
};

export const makeRegisterDto = (overrides = {}) => ({
  email: overrides.email ?? `user${Date.now()}@example.com`,
  username: overrides.username ?? `user${Date.now()}`,
  password: overrides.password ?? 'Password123!',
});

// Generates a UUID token representing an email verification token
export const makeVerificationToken = () => uuidv4();
