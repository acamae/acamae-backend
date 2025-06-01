import { Team, CreateTeamDto, UpdateTeamDto } from '@domain/entities/Team';
import { TeamRepository } from '@domain/repositories/TeamRepository';
import { PrismaClient } from '@prisma/client';

/**
 * Implementación del repositorio de equipos usando Prisma
 */
export class PrismaTeamRepository implements TeamRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Convierte un modelo de Prisma a una entidad de dominio
   */
  private _toDomainModel(prismaTeam: any): Team | null {
    if (!prismaTeam) return null;
    
    return {
      id: prismaTeam.id.toString(),
      userId: prismaTeam.userId.toString(),
      name: prismaTeam.name,
      tag: prismaTeam.tag,
      logoFilename: prismaTeam.logo_filename || undefined,
      description: prismaTeam.description || undefined,
      createdAt: prismaTeam.created_at,
      updatedAt: prismaTeam.updated_at,
      user: prismaTeam.user ? {
        id: prismaTeam.user.id.toString(),
        username: prismaTeam.user.username,
        email: prismaTeam.user.email,
        passwordHash: prismaTeam.user.password_hash,
        role: prismaTeam.user.role as 'user' | 'admin',
        isVerified: prismaTeam.user.is_verified,
        createdAt: prismaTeam.user.created_at,
        updatedAt: prismaTeam.user.updated_at
      } : undefined
    };
  }

  /**
   * Encuentra todos los equipos
   */
  async findAll(): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      include: { user: true }
    });
    return teams.map(team => this._toDomainModel(team)).filter((t): t is Team => t !== null);
  }

  /**
   * Encuentra un equipo por su ID
   */
  async findById(id: string): Promise<Team | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });
    return team ? this._toDomainModel(team) : null;
  }

  /**
   * Encuentra equipos por ID de usuario
   */
  async findByUserId(userId: string): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      where: { userId: parseInt(userId) },
      include: { user: true }
    });
    return teams.map(team => this._toDomainModel(team)).filter((t): t is Team => t !== null);
  }

  /**
   * Crea un nuevo equipo
   */
  async create(userId: string, data: CreateTeamDto): Promise<Team> {
    const team = await this.prisma.team.create({
      data: {
        userId: parseInt(userId),
        name: data.name,
        logo_filename: data.logoFilename,
        description: data.description
      },
      include: { user: true }
    });
    return this._toDomainModel(team) as Team;
  }

  /**
   * Actualiza un equipo existente
   */
  async update(id: string, data: UpdateTeamDto): Promise<Team> {
    const team = await this.prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        logo_filename: data.logoFilename,
        description: data.description
      },
      include: { user: true }
    });
    return this._toDomainModel(team) as Team;
  }

  /**
   * Elimina un equipo
   */
  async delete(id: string): Promise<void> {
    await this.prisma.team.delete({
      where: { id: parseInt(id) }
    });
  }
} 