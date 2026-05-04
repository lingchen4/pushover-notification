import type { GasTrackerConfig } from '../types/card';
import type { GasPriceData } from './gasTrackerService';
import type { AmazonPriceData } from './amazonPriceService';

const GAS_SOURCE_URL = 'https://toronto.citynews.ca/toronto-gta-gas-prices/';

export interface GasNotification {
  title: string;
  message: string;
}

export interface AmazonNotification {
  title: string;
  message: string;
}

export function buildGasNotification(
  cardTitle: string,
  config: GasTrackerConfig,
  data: GasPriceData & { price: number },
): GasNotification {
  // Date + price line
  const datePart = data.latestDate ? `(${data.latestDate}) ` : '';

  const lines: string[] = [
    `Latest ${datePart}: ${data.price}\u00a2/L`,
  ];

  // Upcoming move
  if (data.headlineChange) {
    let dirSymbol: string;
    if (data.direction === '+') dirSymbol = '\u2191';
    else if (data.direction === '-') dirSymbol = '\u2193';
    else dirSymbol = '\u2194';
    lines.push(`Upcoming: ${dirSymbol} ${data.headlineChange}`);
  }

  // Forecast block (En-Pro prediction text)
  if (data.forecastBlock) {
    lines.push('', data.forecastBlock);
  }

  // Optional threshold + source
  const footer: string[] = [];
  if (config.priceThreshold !== undefined) {
    footer.push('', `Threshold \u2264 ${config.priceThreshold}\u00a2/L`);
  }
  footer.push(`Source: ${GAS_SOURCE_URL}`);
  lines.push(...footer);

  return {
    title: `\u26fd ${cardTitle}`,
    message: lines.join('\n'),
  };
}

export function buildAmazonNotification(
  cardTitle: string,
  data: AmazonPriceData & { price: number },
  targetPrice: number,
): AmazonNotification {
  const savings = targetPrice - data.price;
  let productLine = '';
  if (data.title) {
    const truncated = data.title.length > 60 ? `${data.title.substring(0, 60)}\u2026` : data.title;
    productLine = `\n${truncated}`;
  }

  return {
    title: `\uD83C\uDFAF Target Price Reached \u2014 ${cardTitle}`,
    message: `Now: $${data.price.toFixed(2)} (target: $${targetPrice.toFixed(2)})\nSaving: $${savings.toFixed(2)} vs target${productLine}`,
  };
}
