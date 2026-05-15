const friendlyDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

export function formatFriendlyDate(value: string | number | Date) {
  return friendlyDateFormatter.format(new Date(value));
}