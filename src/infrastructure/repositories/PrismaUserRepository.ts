import { User, CreateUserDto, UpdateUserDto } from '@domain/entities/User';
import { UserRepository } from '@domain/repositories/UserRepository';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Implementación del repositorio de usuarios usando Prisma
 */
export class PrismaUserRepository implements UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Convierte un modelo de Prisma a una entidad de dominio
   */
  private _toDomainModel(prismaUser: any): User | null {
    if (!prismaUser) return null;
    
    return {
      id: prismaUser.id.toString(),
      username: prismaUser.username,
      email: prismaUser.email,
      passwordHash: prismaUser.password_hash,
      firstName: prismaUser.first_name || undefined,
      lastName: prismaUser.last_name || undefined,
      role: prismaUser.role as 'user' | 'admin',
      isVerified: prismaUser.is_verified,
      verificationToken: prismaUser.verification_token || undefined,
      verificationExpiresAt: prismaUser.verification_expires_at || undefined,
      resetToken: prismaUser.reset_token || undefined,
      resetExpiresAt: prismaUser.reset_expires_at || undefined,
      createdAt: prismaUser.created_at,
      updatedAt: prismaUser.updated_at
    };
  }

  /**
   * Encuentra todos los usuarios
   */
  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => this._toDomainModel(user)).filter((u): u is User => u !== null);
  }

  /**
   * Encuentra un usuario por su ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    return user ? this._toDomainModel(user) as User : null;
  }

  /**
   * Encuentra un usuario por su nombre de usuario
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username }
    });
    return user ? this._toDomainModel(user) : null;
  }

  /**
   * Encuentra un usuario por su correo electrónico
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user ? this._toDomainModel(user) : null;
  }

  /**
   * Crea un nuevo usuario
   */
  async create(userData: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role || 'user',
        is_verified: false
      }
    });
    
    return this._toDomainModel(user) as User;
  }

  /**
   * Actualiza un usuario existente
   */
  async update(id: string, userData: UpdateUserDto): Promise<User> {
    const data: any = {
      username: userData.username,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
      is_verified: userData.isVerified
    };
    
    // Solo actualizar la contraseña si se proporciona
    if (userData.password) {
      data.password_hash = await bcrypt.hash(userData.password, 10);
    }
    
    const user = await this.prisma.user.update({
      where: { id: parseInt(id) },
      data
    });
    
    return this._toDomainModel(user) as User;
  }

  /**
   * Elimina un usuario
   */
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: parseInt(id) }
    });
  }

  /**
   * Establece el estado de verificación de un usuario
   */
  async setVerified(id: string, isVerified: boolean): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        is_verified: isVerified,
        verification_token: null,
        verification_expires_at: null
      }
    });
    
    return this._toDomainModel(user) as User;
  }

  /**
   * Establece un token de verificación para un usuario
   */
  async setVerificationToken(id: string, token: string, expiresAt: Date): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        verification_token: token,
        verification_expires_at: expiresAt
      }
    });
    
    return this._toDomainModel(user) as User;
  }

  /**
   * Establece un token de restablecimiento para un usuario
   */
  async setResetToken(id: string, token: string, expiresAt: Date): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        reset_token: token,
        reset_expires_at: expiresAt
      }
    });
    
    return this._toDomainModel(user) as User;
  }
} 