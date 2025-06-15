import { RESOURCES, ACTIONS } from './resources.js';

/**
 * User roles and their associated permissions
 * @typedef {Object} Permission
 * @property {string} resource - Resource to access
 * @property {string[]} actions - Allowed actions on the resource
 */

/**
 * @typedef {Object} RolePermissions
 * @property {string} name - Role name
 * @property {string} description - Role description
 * @property {Permission[]} permissions - List of permissions for this role
 */

/** @type {Record<string, RolePermissions>} */
export const ROLES = {
  ADMIN: {
    name: 'admin',
    description: 'Administrator with full access',
    permissions: [
      {
        resource: RESOURCES.USERS.name,
        actions: [ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.TEAMS.name,
        actions: [ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.SYSTEM.name,
        actions: [ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.MATCHES.name,
        actions: [ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.TOURNAMENTS.name,
        actions: [ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.STATISTICS.name,
        actions: [ACTIONS.MANAGE.name],
      },
    ],
  },
  MANAGER: {
    name: 'manager',
    description: 'Team manager with team management capabilities',
    permissions: [
      {
        resource: RESOURCES.USERS.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.TEAMS.name,
        actions: [ACTIONS.CREATE.name, ACTIONS.READ.name, ACTIONS.UPDATE.name, ACTIONS.MANAGE.name],
      },
      {
        resource: RESOURCES.MATCHES.name,
        actions: [ACTIONS.CREATE.name, ACTIONS.READ.name, ACTIONS.UPDATE.name],
      },
      {
        resource: RESOURCES.TOURNAMENTS.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.STATISTICS.name,
        actions: [ACTIONS.READ.name],
      },
    ],
  },
  USER: {
    name: 'user',
    description: 'Regular user with basic access',
    permissions: [
      {
        resource: RESOURCES.USERS.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.TEAMS.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.MATCHES.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.TOURNAMENTS.name,
        actions: [ACTIONS.READ.name],
      },
      {
        resource: RESOURCES.STATISTICS.name,
        actions: [ACTIONS.READ.name],
      },
    ],
  },
};
