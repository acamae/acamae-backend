import { v4 as uuidv4 } from 'uuid';

let userIdCounter = 1;

export const makeUser = (overrides = {}) => {
  const id = overrides.id ?? `user${userIdCounter++}`;
  const timestamp = overrides.timestamp ?? Date.now();

  return {
    id,
    email: overrides.email ?? `user${id}@example.com`,
    username: overrides.username ?? `user${id}`,
    password: overrides.password ?? 'Password123!',
    role: overrides.role ?? 'user',
    isVerified: overrides.isVerified ?? true,
    isActive: overrides.isActive ?? true, // Default to active
    lastLoginAt: overrides.lastLoginAt ?? null, // Last login timestamp
    lastLoginIp: overrides.lastLoginIp ?? null, // Last login IP
    createdAt: overrides.createdAt ?? new Date(timestamp),
    updatedAt: overrides.updatedAt ?? new Date(timestamp),
    passwordHash: overrides.passwordHash, // optional
    verificationToken: overrides.verificationToken,
    verificationExpiresAt: overrides.verificationExpiresAt,
    resetToken: overrides.resetToken,
    resetExpiresAt: overrides.resetExpiresAt,
    resetTokenUsed: overrides.resetTokenUsed ?? false,
  };
};

export const makeRegisterDto = (overrides = {}) => {
  const timestamp = overrides.timestamp ?? Date.now();

  return {
    email: overrides.email ?? `user${timestamp}@example.com`,
    username: overrides.username ?? `user${timestamp}`,
    password: overrides.password ?? 'Password123!',
    isActive: overrides.isActive ?? true, // Default to active
  };
};

// Generates a deterministic UUID token for testing
export const makeVerificationToken = (seed = 'test') => {
  // Use a deterministic approach for testing instead of random UUID
  return `${seed}-12345678-1234-4abc-8def-123456789012`;
};

// Reset counter for test isolation
export const resetUserFactory = () => {
  userIdCounter = 1;
};
