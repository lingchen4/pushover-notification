import { CardType } from '../types/card';
import type { GasTrackerConfig, AmazonPriceConfig, PushoverConfig } from '../types/card';

const defaultPushover: PushoverConfig = { userKey: '', apiToken: '' };

export const DEFAULT_GAS_CONFIG: GasTrackerConfig = {
  intervalMinutes: 60,
  notificationsEnabled: false,
  pushoverConfig: defaultPushover,
};

export const DEFAULT_AMAZON_CONFIG: AmazonPriceConfig = {
  productUrl: '',
  intervalMinutes: 60,
  notificationsEnabled: false,
  pushoverConfig: defaultPushover,
};

export const CARD_TYPE_OPTIONS = [
  { value: CardType.GAS_TRACKER,   label: 'Gas Tracker' },
  { value: CardType.AMAZON_PRICE,  label: 'Amazon Price Tracker' },
] as const;
