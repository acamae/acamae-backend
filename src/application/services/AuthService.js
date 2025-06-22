import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../../infrastructure/config/environment.js';
import { API_ERROR_CODES, ERROR_MESSAGES } from '../../shared/constants/apiCodes.js';
import { APP_ROUTES } from '../../shared/constants/appRoutes.js';
import { USER_ROLES } from '../../shared/constants/validation.js';
import { createError } from '../../shared/utils/error.js';

const prisma = new PrismaClient();

/**
 * Authentication service
 */
export class AuthService {
  /**
   * @param {UserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.SALT_ROUNDS = 10;
    this.JWT_SECRET = config.JWT_SECRET;
    this.JWT_REFRESH_SECRET = config.JWT_REFRESH_SECRET || config.JWT_SECRET;
    this.JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
    this.JWT_REFRESH_EXPIRES_IN = '7d';
  }

  /**
   * Generate JWT tokens for a user
   * @param {User} user - User to generate tokens for
   * @returns {{accessToken: string, refreshToken: string}} JWT tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
        algorithm: 'HS256',
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        algorithm: 'HS256',
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token to verify
   * @param {boolean} [isRefresh=false] - Whether this is a refresh token
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token, isRefresh = false) {
    try {
      return jwt.verify(token, isRefresh ? this.JWT_REFRESH_SECRET : this.JWT_SECRET);
    } catch (error) {
      console.error('Error verifying token:', error);
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_TOKEN],
        API_ERROR_CODES.INVALID_TOKEN
      );
    }
  }

  /**
   * Register a new user
   * @param {CreateUserDto} userData
   * @returns {Promise<User>}
   */
  async register(userData) {
    const { email, password, username } = userData;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.EMAIL_ALREADY_EXISTS],
          API_ERROR_CODES.EMAIL_ALREADY_EXISTS
        );
      }
      if (existingUser.username === username) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.USERNAME_ALREADY_EXISTS],
          API_ERROR_CODES.USERNAME_ALREADY_EXISTS
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    const verificationToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        username,
        verification_token: verificationToken,
        role: USER_ROLES.USER,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        is_verified: true,
      },
    });

    // Enviar email de verificación
    await this.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  /**
   * Verify the email of a user
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: { verification_token: token },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_VERIFICATION_TOKEN],
        API_ERROR_CODES.INVALID_VERIFICATION_TOKEN
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_token: null,
      },
    });

    return true;
  }

  /**
   * Start user login
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: User, accessToken: string, refreshToken: string}>}
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        username: true,
        role: true,
        is_verified: true,
      },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_CREDENTIALS],
        API_ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_CREDENTIALS],
        API_ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    if (!user.is_verified) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.EMAIL_NOT_VERIFIED],
        API_ERROR_CODES.EMAIL_NOT_VERIFIED
      );
    }

    const { ...userWithoutPassword } = user;
    const tokens = this.generateTokens(userWithoutPassword);

    // Guardar refreshToken en session_tokens
    try {
      await prisma.sessionToken.create({
        data: {
          user_id: user.id,
          token: tokens.refreshToken,
          last_activity_at: new Date(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        },
      });
    } catch (err) {
      console.error('Error guardando session token:', err);
    }

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Get current user information
   * @param {string} userId
   * @returns {Promise<User>}
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        is_verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.USER_NOT_FOUND],
        API_ERROR_CODES.USER_NOT_FOUND
      );
    }

    return user;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshToken(refreshToken) {
    try {
      // Verificar que el refreshToken exista en session_tokens
      const sessionToken = await prisma.sessionToken.findUnique({ where: { token: refreshToken } });
      if (!sessionToken) {
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
          API_ERROR_CODES.INVALID_REFRESH_TOKEN
        );
      }

      if (sessionToken.expires_at < new Date()) {
        // Token expirado -> eliminar registro y lanzar error
        await prisma.sessionToken.delete({ where: { id: sessionToken.id } });
        throw createError(
          ERROR_MESSAGES[API_ERROR_CODES.TOKEN_EXPIRED],
          API_ERROR_CODES.TOKEN_EXPIRED
        );
      }

      // Actualizar última actividad
      await prisma.sessionToken.update({
        where: { id: sessionToken.id },
        data: { last_activity_at: new Date() },
      });

      // Generar nuevos tokens y reemplazar refresh en BD
      const newTokens = this.generateTokens(user);
      await prisma.sessionToken.update({
        where: { id: sessionToken.id },
        data: {
          token: newTokens.refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return newTokens;
    } catch (_error) {
      console.error('Error refreshing token:', _error);
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_REFRESH_TOKEN],
        API_ERROR_CODES.INVALID_REFRESH_TOKEN
      );
    }
  }

  /**
   * @TODO: Implementar logout
   * Logout user
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    try {
      // Eliminar token de la base de datos para invalidarlo
      await prisma.sessionToken.delete({ where: { token: refreshToken } });
      return true;
    } catch (err) {
      console.error('Error during logout:', err);
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN_ERROR],
        API_ERROR_CODES.UNKNOWN_ERROR
      );
    }
  }

  /**
   * Start the password reset process
   * @param {string} email
   * @returns {Promise<void>}
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.USER_NOT_FOUND],
        API_ERROR_CODES.USER_NOT_FOUND
      );
    }

    const resetToken = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000), // 1 hora
      },
    });

    // @TODO: Send email with the reset token
    console.log('Reset token:', resetToken);
  }

  /**
   * Reset user password
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw createError(
        ERROR_MESSAGES[API_ERROR_CODES.INVALID_RESET_TOKEN],
        API_ERROR_CODES.INVALID_RESET_TOKEN
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return true;
  }

  /**
   * Send verification email
   * @param {string} email
   * @param {string} token
   */
  async sendVerificationEmail(email, token) {
    if (!config.mail) {
      console.log(`Verification email for ${email}: ${token}`);
      return;
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport('SMTP', {
        host: config.mail.host,
        port: config.mail.port,
        auth: {
          user: config.mail.user,
          pass: config.mail.password,
        },
      });

      const verifyUrl = `${config.cors.frontendUrl}${APP_ROUTES.VERIFY_EMAIL}?token=${token}`;

      await transporter.sendMail({
        from: config.mail.from,
        to: email,
        subject: 'Verifica tu correo',
        html: `<p>Por favor verifica tu correo haciendo clic en el siguiente enlace:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (err) {
      console.error('Error enviando email de verificación:', err);
    }
  }
}
