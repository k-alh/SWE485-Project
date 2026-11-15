import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ORGANISATION_PROFILES, organisationProfile } from './organisations.js';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));

describe('organisationProfile', () => {
  it('finds a profile for an organisation name regardless of case and padding', () => {
    const exact = organisationProfile('Elm');
    expect(organisationProfile(' elm ')).toEqual(exact);
    expect(organisationProfile('STC')).toEqual(organisationProfile('stc'));
  });

  it('returns null for an organisation we have no profile for', () => {
    expect(organisationProfile('Some Other Company')).toBeNull();
    expect(organisationProfile('')).toBeNull();
  });

  it('gives every seeded organisation a logo and an https website', () => {
    const seeded = [
      'Saudi Aramco',
      'STC',
      'Thiqah',
      'King Faisal Specialist Hospital',
      'SABIC',
      'Savola Group',
      'NEOM',
      'Almarai',
      'Al Rajhi Bank',
      'Maaden',
      'Zain Saudi Arabia',
      'Saudi Awwal Bank',
      'ACWA Power',
      'Saudi National Bank',
      'Elm',
    ];

    for (const name of seeded) {
      const profile = organisationProfile(name);
      expect(profile, name).not.toBeNull();
      expect(profile?.website.startsWith('https://'), name).toBe(true);
      expect(profile?.logo.startsWith('/logos/'), name).toBe(true);
    }
  });

  it('points at logo files that exist in public/', () => {
    for (const profile of Object.values(ORGANISATION_PROFILES)) {
      expect(existsSync(`${publicDir}${profile.logo.replace('/logos/', '/logos/')}`), profile.logo).toBe(true);
    }
  });
});
