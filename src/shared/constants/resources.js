/**
 * Available resources in the system
 * @typedef {Object} Resource
 * @property {string} name - Resource name
 * @property {string} description - Resource description
 * @property {string[]} actions - Available actions for this resource
 */

/** @type {Record<string, Resource>} */
export const RESOURCES = {
  USERS: {
    name: 'users',
    description: 'User management',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  TEAMS: {
    name: 'teams',
    description: 'Team management',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  SYSTEM: {
    name: 'system',
    description: 'System configuration',
    actions: ['manage'],
  },
  MATCHES: {
    name: 'matches',
    description: 'Match management',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  TOURNAMENTS: {
    name: 'tournaments',
    description: 'Tournament management',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  STATISTICS: {
    name: 'statistics',
    description: 'Statistics and analytics',
    actions: ['read', 'manage'],
  },
};

/**
 * Available actions in the system
 * @typedef {Object} Action
 * @property {string} name - Action name
 * @property {string} description - Action description
 */

/** @type {Record<string, Action>} */
export const ACTIONS = {
  CREATE: {
    name: 'create',
    description: 'Create new resource',
  },
  READ: {
    name: 'read',
    description: 'Read resource data',
  },
  UPDATE: {
    name: 'update',
    description: 'Update resource data',
  },
  DELETE: {
    name: 'delete',
    description: 'Delete resource',
  },
  MANAGE: {
    name: 'manage',
    description: 'Full management of resource',
  },
};
