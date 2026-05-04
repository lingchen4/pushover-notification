import type { Request, Response, NextFunction } from 'express';
import db from '../db/database';
import type { EventLog } from '../types/event';

export function getEvents(req: Request, res: Response, next: NextFunction): void {
  try {
    const limit = Math.min(parseInt((req.query['limit'] as string) ?? '50', 10), 200);
    const cardId = req.query['cardId'] as string | undefined;

    const query = cardId
      ? db.prepare(
          'SELECT * FROM event_log WHERE card_id = ? ORDER BY timestamp DESC LIMIT ?',
        )
      : db.prepare('SELECT * FROM event_log ORDER BY timestamp DESC LIMIT ?');

    const rows = cardId ? query.all(cardId, limit) : query.all(limit);

    const events: EventLog[] = (rows as Record<string, unknown>[]).map((row) => ({
      id: row['id'] as number,
      timestamp: row['timestamp'] as string,
      level: row['level'] as EventLog['level'],
      event: row['event'] as string,
      cardId: (row['card_id'] as string) ?? undefined,
      cardType: (row['card_type'] as string) ?? undefined,
      meta: (row['meta'] as string) ?? undefined,
    }));

    res.json(events);
  } catch (err) {
    next(err);
  }
}
