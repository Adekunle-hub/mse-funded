export const REMINDER_DAYS = [7, 3, 1] as const;

export function reminderMark(daysLeft: number, daysLeftWhenSaved: number): number | null {
  if (daysLeft < 0) return null;
  const mark = [1, 3, 7].find((days) => daysLeft <= days);
  if (mark === undefined || daysLeftWhenSaved <= mark) return null;
  return mark;
}

export function closesIn(daysLeft: number): string {
  if (daysLeft <= 0) return 'Closes today';
  if (daysLeft === 1) return 'Closes tomorrow';
  return `Closes in ${daysLeft} days`;
}
