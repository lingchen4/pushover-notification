export interface EventLog {
  id: number;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  cardId?: string;
  cardType?: string;
  meta?: string;
}
