import { deadlineStatus, daysUntil } from '@talea/shared';

export function DeadlinePill({ deadline }: { deadline: string }) {
  const status = deadlineStatus(deadline);
  const days = daysUntil(deadline);

  let label: string;
  if (status === 'closed') {
    label = 'Closed';
  } else if (days === 0) {
    label = 'Closes today';
  } else if (status === 'closing_soon') {
    label = `Closes in ${days} day${days === 1 ? '' : 's'}`;
  } else {
    label = `Open · ${days} days`;
  }

  return <span className={`pill pill--${status}`}>{label}</span>;
}
