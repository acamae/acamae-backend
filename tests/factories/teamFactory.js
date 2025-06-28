export const makeTeam = (overrides = {}) => {
  const id = overrides.id ?? Math.floor(Math.random() * 1000).toString();
  return {
    id,
    userId: overrides.userId ?? '1',
    name: overrides.name ?? `Team ${id}`,
    tag: overrides.tag ?? `TAG${id}`,
    logoFilename: overrides.logoFilename,
    description: overrides.description ?? 'A test team',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
