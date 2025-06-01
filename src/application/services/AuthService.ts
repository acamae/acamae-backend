import * as crypto from 'crypto';

import { User, CreateUserDto } from '@domain/entities/User';
import { UserRepository } from '@domain/repositories/UserRepository';
import { config } from '@infrastructure/config/environment';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Secret, SignOptions } from 'jsonwebtoken';

/**
 * Servicio de autenticación
 */
export class AuthService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Registra un nuevo usuario
   */
  async register(userData: CreateUserDto): Promise<User> {
    // Verificar si el usuario ya existe
    const existingEmail = await this.userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const existingUsername = await this.userRepository.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Crear usuario
    const user = await this.userRepository.create(userData);

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // 24 horas de validez

    await this.userRepository.setVerificationToken(user.id, verificationToken, expirationDate);

    // Aquí se podría enviar un correo electrónico con el token de verificación

    return user;
  }

  /**
   * Verifica el correo electrónico de un usuario
   */
  async verifyEmail(token: string): Promise<boolean> {
    const users = await this.userRepository.findAll();
    const user = users.find(u => u.verificationToken === token && u.verificationExpiresAt && u.verificationExpiresAt > new Date());

    if (!user) {
      throw new Error('Token de verificación inválido o expirado');
    }

    await this.userRepository.setVerified(user.id, true);
    return true;
  }

  /**
   * Inicia sesión de usuario
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isVerified) {
      throw new Error('Por favor, verifica tu correo electrónico antes de iniciar sesión');
    }

    // Generar JWT usando la configuración centralizada
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.JWT_SECRET as Secret,
      { expiresIn: config.JWT_EXPIRES_IN as string } as SignOptions
    );

    return { user, token };
  }

  /**
   * Inicia el proceso de recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      // No revelar si el usuario existe por seguridad
      return;
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1); // 1 hora de validez

    await this.userRepository.setResetToken(user.id, resetToken, expirationDate);

    // Aquí se podría enviar un correo electrónico con el token de restablecimiento
  }

  /**
   * Restablece la contraseña de un usuario
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const users = await this.userRepository.findAll();
    const user = users.find(u => u.resetToken === token && u.resetExpiresAt && u.resetExpiresAt > new Date());

    if (!user) {
      throw new Error('Token de restablecimiento inválido o expirado');
    }

    await this.userRepository.update(user.id, {
      password: newPassword
    });

    // Limpiar el token de restablecimiento
    await this.userRepository.setResetToken(user.id, '', new Date());

    return true;
  }

  /**
   * Obtiene el usuario actual a partir de un token JWT
   */
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      return this.userRepository.findById(decoded.id);
    } catch (_error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    // Invalidate the token
    console.log('logout');
  }
} 