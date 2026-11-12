import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme.js';

describe('resolveTheme', () => {
  it('honours an explicit light choice even when the system prefers dark', () => {
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('honours an explicit dark choice even when the system prefers light', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system preference when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('ignores stored values that are not a theme', () => {
    expect(resolveTheme('sepia', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});
