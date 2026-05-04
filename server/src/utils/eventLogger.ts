import db from '../db/database';
import logger from './logger';
import type { EventLevel } from '../types/event';

interface LogEventOptions {
  level: EventLevel;
  event: string;
  cardId?: string;
  cardType?: string;
  meta?: Record<string, unknown>;
}

export function logEvent(options: LogEventOptions): void {
  const { level, event, cardId, cardType, meta } = options;
  const timestamp = new Date().toISOString();

  logger[level](event, { cardId, cardType, ...meta });

  if (level === 'debug') return;

  try {
    db.prepare(
      `INSERT INTO event_log (timestamp, level, event, card_id, card_type, meta)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      timestamp,
      level,
      event,
      cardId ?? null,
      cardType ?? null,
      meta ? JSON.stringify(meta) : null,
    );
  } catch (err) {
    logger.error('Failed to persist event to DB', { err });
  }
}

export function pruneOldEvents(daysToKeep = 30): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const result = db
    .prepare(`DELETE FROM event_log WHERE timestamp < ?`)
    .run(cutoff.toISOString());
  logger.info(`Pruned ${result.changes} old event log entries`);
}
