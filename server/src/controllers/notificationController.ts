import type { Request, Response, NextFunction } from 'express';
import { sendNotification, resolveCredentials } from '../services/pushoverService';
import { getCardById } from '../services/cardService';
import { buildGasNotification, buildAmazonNotification } from '../services/notificationBuilder';
import { ValidationError } from '../utils/validation';
import { CardType } from '../types/card';
import type { GasTrackerConfig, AmazonPriceConfig, GasPriceLatestData, AmazonPriceLatestData } from '../types/card';

export async function testNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userKey, apiToken, message, title } = req.body as Record<string, unknown>;

    // Fall back to global env vars so per-card keys are optional
    const resolvedUserKey =
      typeof userKey === 'string' && userKey.trim() ? userKey.trim() : process.env['PUSHOVER_USER_KEY'];
    const resolvedApiToken =
      typeof apiToken === 'string' && apiToken.trim() ? apiToken.trim() : process.env['PUSHOVER_APP_TOKEN'];

    if (!resolvedUserKey || !resolvedApiToken) {
      throw new ValidationError(
        'No Pushover keys found. Set PUSHOVER_USER_KEY and PUSHOVER_APP_TOKEN in .env or provide them in the request.',
      );
    }

    if (typeof message !== 'string' || !message.trim()) {
      throw new ValidationError('message is required');
    }

    const result = await sendNotification({
      userKey: resolvedUserKey,
      apiToken: resolvedApiToken,
      message,
      title: typeof title === 'string' ? title : 'Pushover Dashboard Test',
    });

    res.json({ success: true, request: result.request });
  } catch (err) {
    next(err);
  }
}

export async function testCardNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userKey, apiToken } = req.body as Record<string, unknown>;

    const card = getCardById(id);
    const { userKey: resolvedUserKey, apiToken: resolvedApiToken } = resolveCredentials({
      userKey: typeof userKey === 'string' ? userKey : (card.config as GasTrackerConfig | AmazonPriceConfig).pushoverConfig.userKey,
      apiToken: typeof apiToken === 'string' ? apiToken : (card.config as GasTrackerConfig | AmazonPriceConfig).pushoverConfig.apiToken,
    });

    if (!resolvedUserKey || !resolvedApiToken) {
      throw new ValidationError(
        'No Pushover keys found. Set PUSHOVER_USER_KEY and PUSHOVER_APP_TOKEN in .env or provide them in the card settings.',
      );
    }

    let notification: { title: string; message: string };
    if (card.type === CardType.GAS_TRACKER) {
      const config = card.config as GasTrackerConfig;
      const latestData = (card.latestData ?? {}) as GasPriceLatestData;
      const gasData = {
        price: latestData.price ?? 0,
        change: latestData.change,
        latestDate: latestData.latestDate,
        headlineChange: latestData.headlineChange,
        direction: latestData.direction ?? ('=' as const),
        forecastBlock: latestData.forecastBlock,
        fetchedAt: latestData.fetchedAt ?? new Date().toISOString(),
      };
      notification = buildGasNotification(card.title, config, gasData);
    } else {
      const config = card.config as AmazonPriceConfig;
      const latestData = (card.latestData ?? {}) as AmazonPriceLatestData;
      const amazonData = {
        productUrl: latestData.productUrl ?? config.productUrl,
        title: latestData.title,
        price: latestData.price ?? 0,
        fetchedAt: latestData.fetchedAt ?? new Date().toISOString(),
      };
      notification = buildAmazonNotification(
        card.title,
        amazonData,
        config.targetPrice ?? 0,
      );
    }

    const result = await sendNotification({ userKey: resolvedUserKey, apiToken: resolvedApiToken, ...notification });
    res.json({ success: true, request: result.request });
  } catch (err) {
    next(err);
  }
}
