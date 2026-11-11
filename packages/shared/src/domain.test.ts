import { describe, expect, it } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  DomainError,
  assertTransition,
  buildDedupeKey,
  canTransition,
  deadlineStatus,
  daysUntil,
  eligibilityHint,
  isTerminalStatus,
} from './domain.js';

describe('tracker transitions', () => {
  it('allows the forward path saved -> applied -> interview -> offer', () => {
    expect(canTransition('saved', 'applied')).toBe(true);
    expect(canTransition('applied', 'interview')).toBe(true);
    expect(canTransition('interview', 'offer')).toBe(true);
  });

  it('rejects skipping a stage', () => {
    expect(canTransition('saved', 'interview')).toBe(false);
    expect(canTransition('saved', 'offer')).toBe(false);
    expect(() => assertTransition('saved', 'offer')).toThrow(DomainError);
  });

  it('rejects moving backwards', () => {
    expect(canTransition('interview', 'applied')).toBe(false);
    expect(canTransition('offer', 'interview')).toBe(false);
  });

  it('lets any open stage exit to rejected', () => {
    expect(canTransition('saved', 'rejected')).toBe(true);
    expect(canTransition('applied', 'rejected')).toBe(true);
    expect(canTransition('interview', 'rejected')).toBe(true);
    expect(canTransition('offer', 'rejected')).toBe(true);
  });

  it('treats rejected as terminal', () => {
    expect(isTerminalStatus('rejected')).toBe(true);
    expect(ALLOWED_TRANSITIONS.rejected).toHaveLength(0);
    expect(canTransition('rejected', 'saved')).toBe(false);
  });

  it('refuses a no-op transition', () => {
    expect(() => assertTransition('applied', 'applied')).toThrow(/already/i);
  });
});

describe('deadline status', () => {
  const now = new Date('2026-11-11T09:30:00.000Z');

  it('is open when the deadline is well ahead', () => {
    expect(deadlineStatus('2026-12-01', now)).toBe('open');
  });

  it('is closing soon inside the seven day window', () => {
    expect(deadlineStatus('2026-11-18', now)).toBe('closing_soon');
    expect(deadlineStatus('2026-11-11', now)).toBe('closing_soon');
  });

  it('is closed the day after the deadline', () => {
    expect(deadlineStatus('2026-11-10', now)).toBe('closed');
  });

  it('counts whole days regardless of clock time', () => {
    expect(daysUntil('2026-11-12', new Date('2026-11-11T23:59:00.000Z'))).toBe(1);
    expect(daysUntil('2026-11-11', new Date('2026-11-11T00:01:00.000Z'))).toBe(0);
  });

  it('throws on an unparseable date', () => {
    expect(() => daysUntil('not-a-date', now)).toThrow(DomainError);
  });
});

describe('eligibility hint', () => {
  it('is eligible when the student year is listed', () => {
    expect(eligibilityHint([4, 'graduate'], 4)).toBe('eligible');
  });

  it('is not_yet when the student year is absent', () => {
    expect(eligibilityHint([4, 'graduate'], 3)).toBe('not_yet');
  });

  it('is unknown when the student has no year', () => {
    expect(eligibilityHint([4], null)).toBe('unknown');
    expect(eligibilityHint([4], undefined)).toBe('unknown');
  });
});

describe('dedupe key', () => {
  it('ignores case, punctuation and spacing', () => {
    const a = buildDedupeKey('Saudi Aramco', 'CO-OP Program 2027', '2026-12-01');
    const b = buildDedupeKey('  saudi   aramco ', 'co-op program 2027', '2026-12-01');
    expect(a).toBe(b);
  });

  it('ignores the time of day of the deadline', () => {
    const a = buildDedupeKey('STC', 'GDP', '2026-12-01T00:00:00.000Z');
    const b = buildDedupeKey('STC', 'GDP', '2026-12-01T18:45:00.000Z');
    expect(a).toBe(b);
  });

  it('separates listings with different deadlines', () => {
    const a = buildDedupeKey('STC', 'GDP', '2026-12-01');
    const b = buildDedupeKey('STC', 'GDP', '2027-01-05');
    expect(a).not.toBe(b);
  });

  it('separates different organisations', () => {
    const a = buildDedupeKey('STC', 'GDP', '2026-12-01');
    const b = buildDedupeKey('Mobily', 'GDP', '2026-12-01');
    expect(a).not.toBe(b);
  });
});
