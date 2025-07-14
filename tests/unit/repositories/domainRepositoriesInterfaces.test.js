import { SessionTokenRepository } from '../../../src/domain/repositories/SessionTokenRepository.js';
import { TeamRepository } from '../../../src/domain/repositories/TeamRepository.js';
import { UserRepository } from '../../../src/domain/repositories/UserRepository.js';
import { PrismaSessionTokenRepository } from '../../../src/infrastructure/repositories/PrismaSessionTokenRepository.js';
import { PrismaTeamRepository } from '../../../src/infrastructure/repositories/PrismaTeamRepository.js';
import { PrismaUserRepository } from '../../../src/infrastructure/repositories/PrismaUserRepository.js';

describe('UserRepository interface (dominio)', () => {
  let repo;
  beforeEach(() => {
    repo = new UserRepository();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('debe lanzar error en todos los métodos por ser abstracta', async () => {
    await expect(repo.findById('1')).rejects.toThrow('Method not implemented');
    await expect(repo.findByEmail('a@b.com')).rejects.toThrow('Method not implemented');
    await expect(repo.findByUsername('usr')).rejects.toThrow('Method not implemented');
    await expect(repo.create({})).rejects.toThrow('Method not implemented');
    await expect(repo.update('1', {})).rejects.toThrow('Method not implemented');
    await expect(repo.delete('1')).rejects.toThrow('Method not implemented');
    await expect(repo.findAll()).rejects.toThrow('Method not implemented');
    await expect(repo.findByVerificationToken('tok')).rejects.toThrow('Method not implemented');
    await expect(repo.findByResetToken('tok')).rejects.toThrow('Method not implemented');
    await expect(repo.setVerificationToken('1', 'tok', new Date())).rejects.toThrow(
      'Method not implemented'
    );
    await expect(repo.setVerified('1', true)).rejects.toThrow('Method not implemented');
    await expect(repo.setResetToken('1', 'tok', new Date())).rejects.toThrow(
      'Method not implemented'
    );
    await expect(repo.findByIdWithFields('1', ['id'])).rejects.toThrow('Method not implemented');
    await expect(repo.cleanExpiredVerificationTokens()).rejects.toThrow('Method not implemented');
    await expect(repo.setNewPassword('1', 'newpass')).rejects.toThrow('Method not implemented');
  });
});

describe('PrismaUserRepository Interface Compliance', () => {
  let repo;

  beforeEach(() => {
    repo = new PrismaUserRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Required methods', () => {
    it('should have findById method', () => {
      expect(typeof repo.findById).toBe('function');
    });
    it('should have findByEmail method', () => {
      expect(typeof repo.findByEmail).toBe('function');
    });
    it('should have findByUsername method', () => {
      expect(typeof repo.findByUsername).toBe('function');
    });
    it('should have create method', () => {
      expect(typeof repo.create).toBe('function');
    });
    it('should have update method', () => {
      expect(typeof repo.update).toBe('function');
    });
    it('should have delete method', () => {
      expect(typeof repo.delete).toBe('function');
    });
    it('should have findAll method', () => {
      expect(typeof repo.findAll).toBe('function');
    });
    it('should have findByVerificationToken method', () => {
      expect(typeof repo.findByVerificationToken).toBe('function');
    });
    it('should have findByResetToken method', () => {
      expect(typeof repo.findByResetToken).toBe('function');
    });
    it('should have setVerificationToken method', () => {
      expect(typeof repo.setVerificationToken).toBe('function');
    });
    it('should have setVerified method', () => {
      expect(typeof repo.setVerified).toBe('function');
    });
    it('should have setResetToken method', () => {
      expect(typeof repo.setResetToken).toBe('function');
    });
    it('should have findByIdWithFields method', () => {
      expect(typeof repo.findByIdWithFields).toBe('function');
    });
    it('should have cleanExpiredVerificationTokens method', () => {
      expect(typeof repo.cleanExpiredVerificationTokens).toBe('function');
    });
    it('should have setNewPassword method', () => {
      expect(typeof repo.setNewPassword).toBe('function');
    });
  });
});

describe('TeamRepository interface (dominio)', () => {
  let repo;
  beforeEach(() => {
    repo = new TeamRepository();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('debe lanzar error en todos los métodos por ser abstracta', async () => {
    await expect(repo.findById('1')).rejects.toThrow('Method not implemented');
    await expect(repo.findAll()).rejects.toThrow('Method not implemented');
    await expect(repo.findByUserId('1')).rejects.toThrow('Method not implemented');
    await expect(repo.findByTeamName('team')).rejects.toThrow('Method not implemented');
    await expect(repo.create('1', {})).rejects.toThrow('Method not implemented');
    await expect(repo.update('1', {})).rejects.toThrow('Method not implemented');
    await expect(repo.delete('1')).rejects.toThrow('Method not implemented');
    await expect(repo.addMember('1', '2')).rejects.toThrow('Method not implemented');
    await expect(repo.removeMember('1', '2')).rejects.toThrow('Method not implemented');
  });
});

describe('PrismaTeamRepository Interface Compliance', () => {
  let repo;
  beforeEach(() => {
    repo = new PrismaTeamRepository();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('Required methods', () => {
    it('should have findById method', () => {
      expect(typeof repo.findById).toBe('function');
    });
    it('should have findByUserId method', () => {
      expect(typeof repo.findByUserId).toBe('function');
    });
    it('should have findAll method', () => {
      expect(typeof repo.findAll).toBe('function');
    });
    it('should have findByTeamName method', () => {
      expect(typeof repo.findByTeamName).toBe('function');
    });
    it('should have create method', () => {
      expect(typeof repo.create).toBe('function');
    });
    it('should have update method', () => {
      expect(typeof repo.update).toBe('function');
    });
    it('should have delete method', () => {
      expect(typeof repo.delete).toBe('function');
    });
    it('should have addMember method', () => {
      expect(typeof repo.addMember).toBe('function');
    });
    it('should have removeMember method', () => {
      expect(typeof repo.removeMember).toBe('function');
    });
  });
});

describe('SessionTokenRepository interface (dominio)', () => {
  let repo;
  beforeEach(() => {
    repo = new SessionTokenRepository();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('debe lanzar error en todos los métodos por ser abstracta', async () => {
    await expect(repo.findByToken('token')).rejects.toThrow('Method not implemented');
    await expect(repo.create({})).rejects.toThrow('Method not implemented');
    await expect(repo.update('1', {})).rejects.toThrow('Method not implemented');
    await expect(repo.deleteById('1')).rejects.toThrow('Method not implemented');
    await expect(repo.deleteByToken('token')).rejects.toThrow('Method not implemented');
  });
});

describe('PrismaSessionTokenRepository Interface Compliance', () => {
  let repo;

  beforeEach(() => {
    repo = new PrismaSessionTokenRepository();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('Required methods', () => {
    it('should have findByToken method', () => {
      expect(typeof repo.findByToken).toBe('function');
    });
    it('should have create method', () => {
      expect(typeof repo.create).toBe('function');
    });
    it('should have update method', () => {
      expect(typeof repo.update).toBe('function');
    });
    it('should have deleteById method', () => {
      expect(typeof repo.deleteById).toBe('function');
    });
    it('should have deleteByToken method', () => {
      expect(typeof repo.deleteByToken).toBe('function');
    });
  });
});
