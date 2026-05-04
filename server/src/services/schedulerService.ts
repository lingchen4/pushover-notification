import type { ScheduledTask } from 'node-cron';
import cron from 'node-cron';
import { logEvent } from '../utils/eventLogger';
import { fetchGasPrices } from './gasTrackerService';
import { fetchAmazonPrice } from './amazonPriceService';
import { sendNotification, resolveCredentials } from './pushoverService';
import { getCardById, saveLatestData } from './cardService';
import { savePriceHistory, getLastPriceRow, getLastChangedRow } from './priceHistoryService';
import { buildGasNotification, buildAmazonNotification } from './notificationBuilder';
import db from '../db/database';
import type { GasTrackerConfig, AmazonPriceConfig } from '../types/card';
import { CardType } from '../types/card';

const jobs = new Map<string, ScheduledTask>();

function intervalToCron(minutes: number, scheduledTime?: string): string {
  const [h, m] = scheduledTime ? scheduledTime.split(':').map(Number) : [0, 0];
  if (minutes < 60) return `*/${minutes} * * * *`;
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `0 */${hours} * * *`;
  }
  const days = Math.floor(minutes / 1440);
  return `${m} ${h} */${days} * *`;
}

async function runGasTrackerJob(cardId: string): Promise<void> {
  const card = getCardById(cardId);
  const config = card.config as GasTrackerConfig;

  const data = await fetchGasPrices();
  saveLatestData(cardId, data);

  if (data.price !== undefined) {
    const lastRow = getLastPriceRow(cardId);
    savePriceHistory(cardId, data.price);

    const { userKey, apiToken } = resolveCredentials(config.pushoverConfig);
    const thresholdMet = config.priceThreshold === undefined || data.price <= config.priceThreshold;

    if (config.notificationsEnabled && thresholdMet && userKey && apiToken) {
      const notification = buildGasNotification(card.title, config, { ...data, price: data.price });
      logEvent({ level: 'info', event: 'gasTracker.alertTriggered', cardId, meta: { price: data.price, change: data.change, previous: lastRow?.value, threshold: config.priceThreshold } });
      await sendNotification({ userKey, apiToken, ...notification });
    }
  }
}

async function runAmazonPriceJob(cardId: string): Promise<void> {
  const card = getCardById(cardId);
  const config = card.config as AmazonPriceConfig;

  const data = await fetchAmazonPrice(config.productUrl);

  if (data.price !== undefined) {
    const lastChangeRow = getLastChangedRow(cardId, data.price);
    savePriceHistory(cardId, data.price);
    saveLatestData(cardId, { ...data, lastChangedAt: lastChangeRow?.timestamp });

    const { userKey, apiToken } = resolveCredentials(config.pushoverConfig);
    const targetPrice = config.targetPrice;

    if (config.notificationsEnabled && userKey && apiToken && targetPrice != null && targetPrice > 0) {
      if (data.price <= targetPrice) {
        const notification = buildAmazonNotification(card.title, { ...data, price: data.price }, targetPrice);
        logEvent({ level: 'info', event: 'amazonPrice.targetReached', cardId, meta: { target: targetPrice, current: data.price } });
        await sendNotification({ userKey, apiToken, ...notification });
      }
    }
  }
}

export async function fetchCardNow(cardId: string): Promise<void> {
  const card = getCardById(cardId);
  if (card.type === CardType.GAS_TRACKER) {
    await runGasTrackerJob(cardId);
  } else if (card.type === CardType.AMAZON_PRICE) {
    await runAmazonPriceJob(cardId);
  }
}

export function startJob(cardId: string): void {
  stopJob(cardId);

  const card = getCardById(cardId);
  if (!card.enabled) return;

  if (card.type === CardType.GAS_TRACKER) {
    const config = card.config as GasTrackerConfig;
    const expression = intervalToCron(config.intervalMinutes, config.scheduledTime);
    const task = cron.schedule(expression, () => {
      runGasTrackerJob(cardId).catch((err) =>
        logEvent({ level: 'error', event: 'gasTracker.jobFailed', cardId, meta: { error: String(err) } }),
      );
    });
    jobs.set(cardId, task);
    logEvent({ level: 'info', event: 'scheduler.jobStarted', cardId, cardType: card.type, meta: { expression } });
  }

  if (card.type === CardType.AMAZON_PRICE) {
    const config = card.config as AmazonPriceConfig;
    const expression = intervalToCron(config.intervalMinutes, config.scheduledTime);
    const task = cron.schedule(expression, () => {
      runAmazonPriceJob(cardId).catch((err) =>
        logEvent({ level: 'error', event: 'amazonPrice.jobFailed', cardId, meta: { error: String(err) } }),
      );
    });
    jobs.set(cardId, task);
    logEvent({ level: 'info', event: 'scheduler.jobStarted', cardId, cardType: card.type, meta: { expression } });
  }
}

export function stopJob(cardId: string): void {
  const task = jobs.get(cardId);
  if (task) {
    task.stop();
    jobs.delete(cardId);
    logEvent({ level: 'info', event: 'scheduler.jobStopped', cardId });
  }
}

export function restartAllEnabledJobs(): void {
  const rows = db.prepare('SELECT id FROM cards WHERE enabled = 1').all() as { id: string }[];
  for (const row of rows) {
    startJob(row.id);
  }
  logEvent({ level: 'info', event: 'scheduler.allJobsRestored', meta: { count: rows.length } });
}


