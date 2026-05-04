import { randomUUID } from 'node:crypto';
import db from '../db/database';
import { logEvent } from '../utils/eventLogger';
import { encrypt, decrypt } from '../utils/encryption';
import { NotFoundError } from '../middleware/errorMiddleware';
import type { Card, CardType, CardConfig, CreateCardDto, UpdateCardDto, LatestData, PushoverConfig } from '../types/card';

function encryptConfig(config: CardConfig): CardConfig {
  const cfg = config as CardConfig & { pushoverConfig?: PushoverConfig };
  if (!cfg.pushoverConfig) return config;
  return {
    ...config,
    pushoverConfig: {
      ...cfg.pushoverConfig,
      userKey: encrypt(cfg.pushoverConfig.userKey),
      apiToken: encrypt(cfg.pushoverConfig.apiToken),
    },
  };
}

function decryptConfig(config: CardConfig): CardConfig {
  const cfg = config as CardConfig & { pushoverConfig?: PushoverConfig };
  if (!cfg.pushoverConfig) return config;
  return {
    ...config,
    pushoverConfig: {
      ...cfg.pushoverConfig,
      userKey: decrypt(cfg.pushoverConfig.userKey),
      apiToken: decrypt(cfg.pushoverConfig.apiToken),
    },
  };
}

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row['id'] as string,
    type: row['type'] as CardType,
    title: row['title'] as string,
    enabled: row['enabled'] === 1,
    config: decryptConfig(JSON.parse(row['config'] as string) as CardConfig),
    latestData: row['latest_data'] ? JSON.parse(row['latest_data'] as string) as LatestData : undefined,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export function getAllCards(): Card[] {
  const rows = db.prepare('SELECT * FROM cards ORDER BY created_at DESC').all();
  return (rows as Record<string, unknown>[]).map(rowToCard);
}

export function getCardById(id: string): Card {
  const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  if (!row) throw new NotFoundError(`Card ${id} not found`);
  return rowToCard(row as Record<string, unknown>);
}

export function createCard(dto: CreateCardDto): Card {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO cards (id, type, title, enabled, config, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
  ).run(id, dto.type, dto.title, JSON.stringify(encryptConfig(dto.config)), now, now);

  logEvent({ level: 'info', event: 'card.created', cardId: id, cardType: dto.type, meta: { title: dto.title } });

  return getCardById(id);
}

export function updateCard(id: string, dto: UpdateCardDto): Card {
  const existing = getCardById(id);
  const now = new Date().toISOString();

  const newTitle = dto.title ?? existing.title;
  const newConfig = dto.config ?? existing.config;

  db.prepare(
    `UPDATE cards SET title = ?, config = ?, updated_at = ? WHERE id = ?`,
  ).run(newTitle, JSON.stringify(encryptConfig(newConfig)), now, id);

  logEvent({ level: 'info', event: 'card.updated', cardId: id, cardType: existing.type });

  return getCardById(id);
}

export function deleteCard(id: string): void {
  const existing = getCardById(id);
  db.prepare('DELETE FROM cards WHERE id = ?').run(id);
  logEvent({ level: 'info', event: 'card.deleted', cardId: id, cardType: existing.type });
}

export function toggleCard(id: string): Card {
  const existing = getCardById(id);
  const newEnabled = existing.enabled ? 0 : 1;
  const now = new Date().toISOString();

  db.prepare('UPDATE cards SET enabled = ?, updated_at = ? WHERE id = ?').run(newEnabled, now, id);

  logEvent({
    level: 'info',
    event: newEnabled ? 'card.enabled' : 'card.disabled',
    cardId: id,
    cardType: existing.type,
  });

  return getCardById(id);
}

export function saveLatestData(id: string, data: LatestData): void {
  db.prepare('UPDATE cards SET latest_data = ? WHERE id = ?').run(JSON.stringify(data), id);
}
