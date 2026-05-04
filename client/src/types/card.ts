export const CardType = {
  GAS_TRACKER: 'gas_tracker',
  AMAZON_PRICE: 'amazon_price',
} as const;
export type CardType = (typeof CardType)[keyof typeof CardType];

export interface PushoverConfig {
  userKey: string;
  apiToken: string;
  sound?: string;
  priority?: number;
}

export interface GasTrackerConfig {
  intervalMinutes: number;
  scheduledTime?: string;
  priceThreshold?: number;
  notificationsEnabled: boolean;
  pushoverConfig: PushoverConfig;
}

export interface AmazonPriceConfig {
  productUrl: string;
  intervalMinutes: number;
  scheduledTime?: string;
  targetPrice?: number;
  notificationsEnabled: boolean;
  pushoverConfig: PushoverConfig;
}

export type CardConfig = GasTrackerConfig | AmazonPriceConfig;

export interface GasPriceLatestData {
  price?: number;
  change?: number;
  latestDate?: string;
  headlineChange?: string;
  direction?: '+' | '-' | '=';
  forecastBlock?: string;
  fetchedAt: string;
}

export interface AmazonPriceLatestData {
  productUrl: string;
  title?: string;
  price?: number;
  lastChangedAt?: string;
  fetchedAt: string;
}

export type LatestData = GasPriceLatestData | AmazonPriceLatestData;

export interface Card {
  id: string;
  type: CardType;
  title: string;
  enabled: boolean;
  config: CardConfig;
  latestData?: LatestData;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardDto {
  type: CardType;
  title: string;
  config: CardConfig;
}

export interface UpdateCardDto {
  title?: string;
  config?: CardConfig;
}
