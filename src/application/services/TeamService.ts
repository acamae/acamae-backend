import { Team, CreateTeamDto, UpdateTeamDto } from '@domain/entities/Team';
import { TeamRepository } from '@domain/repositories/TeamRepository';
import { UserRepository } from '@domain/repositories/UserRepository';

/**
 * Servicio de equipos
 */
export class TeamService {
  constructor(
    private teamRepository: TeamRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Obtiene todos los equipos
   */
  async getAllTeams(): Promise<Team[]> {
    return this.teamRepository.findAll();
  }

  /**
   * Obtiene un equipo por su ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    return this.teamRepository.findById(id);
  }

  /**
   * Obtiene los equipos de un usuario
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    return this.teamRepository.findByUserId(userId);
  }

  /**
   * Crea un nuevo equipo
   */
  async createTeam(userId: string, teamData: CreateTeamDto): Promise<Team> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('El usuario no existe');
    }

    return this.teamRepository.create(userId, teamData);
  }

  /**
   * Actualiza un equipo
   */
  async updateTeam(id: string, userId: string, teamData: UpdateTeamDto): Promise<Team> {
    // Verificar que el equipo existe
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new Error('El equipo no existe');
    }

    // Verificar que el equipo pertenece al usuario
    if (team.userId !== userId) {
      throw new Error('No tienes permiso para actualizar este equipo');
    }

    return this.teamRepository.update(id, teamData);
  }

  /**
   * Elimina un equipo
   */
  async deleteTeam(id: string, userId: string): Promise<void> {
    // Verificar que el equipo existe
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new Error('El equipo no existe');
    }

    // Verificar que el equipo pertenece al usuario o es admin
    const user = await this.userRepository.findById(userId);
    if (!user || (team.userId !== userId && user.role !== 'admin')) {
      throw new Error('No tienes permiso para eliminar este equipo');
    }

    await this.teamRepository.delete(id);
  }
} 