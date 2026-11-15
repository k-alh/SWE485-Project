export interface OrganisationProfile {
  logo: string;
  website: string;
}

export const ORGANISATION_PROFILES: Record<string, OrganisationProfile> = {
  'Saudi Aramco': { logo: '/logos/saudi-aramco.png', website: 'https://www.aramco.com' },
  STC: { logo: '/logos/stc.png', website: 'https://www.stc.com.sa' },
  Thiqah: { logo: '/logos/thiqah.png', website: 'https://www.thiqah.sa' },
  'King Faisal Specialist Hospital': { logo: '/logos/kfshrc.svg', website: 'https://www.kfshrc.edu.sa' },
  SABIC: { logo: '/logos/sabic.png', website: 'https://www.sabic.com' },
  'Savola Group': { logo: '/logos/savola.png', website: 'https://www.savola.com' },
  NEOM: { logo: '/logos/neom.png', website: 'https://www.neom.com' },
  Almarai: { logo: '/logos/almarai.png', website: 'https://www.almarai.com' },
  'Al Rajhi Bank': { logo: '/logos/al-rajhi.png', website: 'https://www.alrajhibank.com.sa' },
  Maaden: { logo: '/logos/maaden.png', website: 'https://www.maaden.com.sa' },
  'Zain Saudi Arabia': { logo: '/logos/zain.png', website: 'https://www.zain.com/sa' },
  'Saudi Awwal Bank': { logo: '/logos/sab.png', website: 'https://www.sab.com.sa' },
  'ACWA Power': { logo: '/logos/acwa-power.png', website: 'https://www.acwapower.com' },
  'Saudi National Bank': { logo: '/logos/snb.png', website: 'https://www.alahli.com' },
  Elm: { logo: '/logos/elm.png', website: 'https://www.elm.sa' },
};

const byNormalisedName = new Map(
  Object.entries(ORGANISATION_PROFILES).map(([name, profile]) => [name.trim().toLowerCase(), profile]),
);

export function organisationProfile(name: string): OrganisationProfile | null {
  return byNormalisedName.get(name.trim().toLowerCase()) ?? null;
}
