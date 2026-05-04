export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatPrice(value: number | undefined, unit = '¢/L'): string {
  if (value === undefined) return '—';
  return `${value.toFixed(1)} ${unit}`;
}

export function formatDollar(value: number | undefined): string {
  if (value === undefined) return '—';
  return `$${value.toFixed(2)}`;
}

export function formatInterval(intervalMinutes: number, scheduledTime?: string): string {
  const suffix = scheduledTime ? ` at ${scheduledTime}` : '';
  if (intervalMinutes < 60) return `Every ${intervalMinutes}m`;
  if (intervalMinutes < 1440) return `Every ${intervalMinutes / 60}h`;
  const days = Math.floor(intervalMinutes / 1440);
  if (days % 7 === 0) return `Every ${days / 7}w${suffix}`;
  return `Every ${days}d${suffix}`;
}
