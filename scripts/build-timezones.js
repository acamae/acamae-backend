#!/usr/bin/env node
/* eslint-disable no-console */
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { getTimeZones } from '@vvo/tzdb';
import { DateTime } from 'luxon';

// Single source of truth: TZDB only (no Intl fallback)
const tzdbTimeZones = getTimeZones({ includeUtc: false });
const tzdbVersion = null; // @vvo/tzdb does not expose tzdb version; allow override via env if needed

// removed legacy helpers (fallback and array countries)

function build({ outPath }) {
  const now = DateTime.utc();
  const source = 'tzdb';
  let version = process.env.TZDB_VERSION || 'unknown';
  let timezones = [];

  // Build from TZDB only
  version = process.env.TZDB_VERSION || tzdbVersion || version;
  timezones = tzdbTimeZones.map((z) => {
    const dt = now.setZone(z.name);
    return {
      id: z.name,
      altName:
        z.alternativeName || z.abbreviation || dt.offsetNameLong || dt.offsetNameShort || null,
      countryCode: z.countryCode || null,
      countryName: z.countryName || '',
      continentCode: z.continentCode || '',
      continentName: z.continentName || '',
      group: Array.isArray(z.group) && z.group.length ? z.group : [z.name],
      utcOffset: dt.toFormat('ZZ'),
      isDST: typeof dt.isInDST === 'boolean' ? dt.isInDST : null,
    };
  });

  const data = { version, lastUpdated: now.toISO(), source, timezones };
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Generated ${outPath} with ${data.timezones.length} timezones (source=${source})`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const out = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : resolve(__dirname, '..', 'src', 'infrastructure', 'assets', 'timezones.json');

build({ outPath: out });
