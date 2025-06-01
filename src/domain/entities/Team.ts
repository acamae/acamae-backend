import { User } from './User';

export interface Team {
  id: string;
  userId: string;
  name: string;
  tag: string;
  logoFilename?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface CreateTeamDto {
  name: string;
  tag: string;
  logoFilename?: string;
  description?: string;
}

export interface UpdateTeamDto {
  name?: string;
  tag?: string;
  logoFilename?: string;
  description?: string;
} 