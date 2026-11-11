import type { AcademicYear, EligibilityHint } from '@talea/shared';

export function eligibilityText(years: readonly AcademicYear[]): string {
  if (years.length === 0) return 'Not stated';
  const sorted = [...years].sort((a, b) => {
    if (a === 'graduate') return 1;
    if (b === 'graduate') return -1;
    return a - b;
  });
  return sorted.map((year) => (year === 'graduate' ? 'Graduates' : `Year ${year}`)).join(', ');
}

export function eligibilityHintText(
  hint: EligibilityHint,
  years: readonly AcademicYear[],
): string {
  if (hint === 'eligible') return 'Open to your year';
  if (hint === 'not_yet') return `For ${eligibilityText(years).toLowerCase()}`;
  return eligibilityText(years);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
