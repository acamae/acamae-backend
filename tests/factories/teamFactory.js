let teamIdCounter = 1;

export const makeTeam = (overrides = {}) => {
  const id = overrides.id ?? `team${teamIdCounter++}`;
  const timestamp = overrides.timestamp ?? Date.now();

  return {
    id,
    userId: overrides.userId ?? 'user1',
    name: overrides.name ?? `Team ${id}`,
    tag: overrides.tag ?? `TAG${teamIdCounter}`,
    logoFilename: overrides.logoFilename,
    description: overrides.description ?? 'A test team',
    createdAt: overrides.createdAt ?? new Date(timestamp),
    updatedAt: overrides.updatedAt ?? new Date(timestamp),
  };
};

// Reset counter for test isolation
export const resetTeamFactory = () => {
  teamIdCounter = 1;
};
