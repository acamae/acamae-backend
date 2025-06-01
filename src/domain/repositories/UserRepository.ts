import { User, CreateUserDto, UpdateUserDto } from '../entities/User';

/**
 * Interfaz para el repositorio de usuarios
 */
export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserDto): Promise<User>;
  update(id: string, userData: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  
  // Métodos adicionales para la verificación y tokens
  setVerified(id: string, isVerified: boolean): Promise<User>;
  setVerificationToken(id: string, token: string, expiresAt: Date): Promise<User>;
  setResetToken(id: string, token: string, expiresAt: Date): Promise<User>;
} 