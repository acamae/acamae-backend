import { execSync } from 'child_process';
import fs from 'fs';

describe('build-timezones script', () => {
  const out = 'src/infrastructure/assets/timezones.json';

  test('generates valid JSON with expected structure', () => {
    execSync('node scripts/build-timezones.js', { stdio: 'ignore' });
    const raw = fs.readFileSync(out, 'utf-8');
    const data = JSON.parse(raw);

    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('lastUpdated');
    expect(['tzdb']).toContain(data.source);
    expect(Array.isArray(data.timezones)).toBe(true);
    // Basic shape of first entry
    const tz = data.timezones[0];
    expect(tz).toHaveProperty('id');
    expect(tz).toHaveProperty('altName');
    expect(tz).toHaveProperty('group');
    expect(tz).toHaveProperty('utcOffset');
    expect(Object.hasOwn(tz, 'isDST')).toBe(true);
    expect(Object.hasOwn(tz, 'countryCode')).toBe(true);
    expect(Object.hasOwn(tz, 'countryName')).toBe(true);
    expect(Object.hasOwn(tz, 'continentCode')).toBe(true);
    expect(Object.hasOwn(tz, 'continentName')).toBe(true);
  });
});
