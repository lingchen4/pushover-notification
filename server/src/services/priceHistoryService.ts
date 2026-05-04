import db from '../db/database';

export interface PriceHistoryRow {
  value: number;
  timestamp: string;
}

export function savePriceHistory(cardId: string, value: number): void {
  db.prepare('INSERT INTO price_history (card_id, value, timestamp) VALUES (?, ?, ?)').run(
    cardId,
    value,
    new Date().toISOString(),
  );
}

export function getLastPriceRow(cardId: string): { value: number } | undefined {
  return db
    .prepare('SELECT value FROM price_history WHERE card_id = ? ORDER BY timestamp DESC LIMIT 1')
    .get(cardId) as { value: number } | undefined;
}

export function getLastChangedRow(cardId: string, currentValue: number): { timestamp: string } | undefined {
  return db
    .prepare('SELECT timestamp FROM price_history WHERE card_id = ? AND value != ? ORDER BY timestamp DESC LIMIT 1')
    .get(cardId, currentValue) as { timestamp: string } | undefined;
}

export function getPriceHistory(cardId: string, limit = 100): PriceHistoryRow[] {
  return db
    .prepare('SELECT value, timestamp FROM price_history WHERE card_id = ? ORDER BY timestamp DESC LIMIT ?')
    .all(cardId, limit) as PriceHistoryRow[];
}
