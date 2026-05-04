import { CardType } from '../types/card';
import type { CreateCardDto, UpdateCardDto, CardConfig, GasTrackerConfig, AmazonPriceConfig } from '../types/card';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isGasTrackerConfig(config: CardConfig): config is GasTrackerConfig {
  const c = config as GasTrackerConfig;
  return (
    typeof c.intervalMinutes === 'number' &&
    (c.scheduledTime === undefined || typeof c.scheduledTime === 'string') &&
    (c.priceThreshold === undefined || typeof c.priceThreshold === 'number') &&
    typeof c.notificationsEnabled === 'boolean' &&
    typeof c.pushoverConfig?.userKey === 'string' &&
    typeof c.pushoverConfig?.apiToken === 'string'
  );
}

function isAmazonPriceConfig(config: CardConfig): config is AmazonPriceConfig {
  const c = config as AmazonPriceConfig;
  return (
    typeof c.productUrl === 'string' &&
    c.productUrl.length > 0 &&
    typeof c.intervalMinutes === 'number' &&
    (c.scheduledTime === undefined || typeof c.scheduledTime === 'string') &&
    (c.targetPrice === undefined || typeof c.targetPrice === 'number') &&
    typeof c.notificationsEnabled === 'boolean' &&
    typeof c.pushoverConfig?.userKey === 'string' &&
    typeof c.pushoverConfig?.apiToken === 'string'
  );
}

export function validateCreateCard(body: unknown): CreateCardDto {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const { type, title, config } = body as Record<string, unknown>;

  if (!type || !Object.values(CardType).includes(type as CardType)) {
    throw new ValidationError(`type must be one of: ${Object.values(CardType).join(', ')}`);
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('title must be a non-empty string');
  }

  if (!config || typeof config !== 'object') {
    throw new ValidationError('config must be an object');
  }

  if (type === CardType.GAS_TRACKER && !isGasTrackerConfig(config as CardConfig)) {
    throw new ValidationError('Invalid GasTrackerConfig');
  }

  if (type === CardType.AMAZON_PRICE && !isAmazonPriceConfig(config as CardConfig)) {
    throw new ValidationError('Invalid AmazonPriceConfig');
  }

  return { type: type as CardType, title: title.trim(), config: config as CardConfig };
}

export function validateUpdateCard(body: unknown): UpdateCardDto {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const { title, config } = body as Record<string, unknown>;
  const dto: UpdateCardDto = {};

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('title must be a non-empty string');
    }
    dto.title = title.trim();
  }

  if (config !== undefined) {
    if (typeof config !== 'object' || config === null) {
      throw new ValidationError('config must be an object');
    }
    dto.config = config as CardConfig;
  }

  return dto;
}
