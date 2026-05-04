export const EventLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;
export type EventLevel = (typeof EventLevel)[keyof typeof EventLevel];

export interface EventLog {
  id: number;
  timestamp: string;
  level: EventLevel;
  event: string;
  cardId?: string;
  cardType?: string;
  meta?: string;
}
