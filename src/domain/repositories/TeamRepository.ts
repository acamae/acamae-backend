import { Team, CreateTeamDto, UpdateTeamDto } from '../entities/Team';

/**
 * Interfaz para el repositorio de equipos
 */
export interface TeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  findByUserId(userId: string): Promise<Team[]>;
  create(userId: string, data: CreateTeamDto): Promise<Team>;
  update(id: string, data: UpdateTeamDto): Promise<Team>;
  delete(id: string): Promise<void>;
} 