import axios from 'axios';
import * as cheerio from 'cheerio';
import { logEvent } from '../utils/eventLogger';

export interface AmazonPriceData {
  productUrl: string;
  title: string | undefined;
  price: number | undefined;
  fetchedAt: string;
}

export async function fetchAmazonPrice(productUrl: string): Promise<AmazonPriceData> {
  logEvent({ level: 'debug', event: 'amazonPrice.fetching', meta: { productUrl } });

  const { data: html } = await axios.get<string>(productUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-CA,en;q=0.9',
    },
    timeout: 15_000,
  });

  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim() || undefined;

  // Ordered from most specific/reliable to legacy fallbacks.
  // Intentionally excludes `.basisPrice` and `[data-a-strike]` (those are "was" / list prices).
  const priceSelectors = [
    '#corePriceDisplay_desktop_feature_div .a-offscreen', // current desktop buybox
    '.priceToPay .a-offscreen',                           // "price to pay" apex widget
    '.apexPriceToPay .a-offscreen',                       // alternative apex class
    '#apex_offerDisplay_desktop .a-offscreen',            // offer display widget
    '#price_inside_buybox',                               // simple buybox text
    '#priceblock_ourprice',                               // legacy
    '#priceblock_dealprice',                              // legacy sale
  ];

  let price: number | undefined;
  for (const selector of priceSelectors) {
    const raw = $(selector).first().text().trim();
    if (raw) {
      // Strip currency symbols, spaces, commas — keep digits and decimal point
      const numeric = raw.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(numeric);
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        break;
      }
    }
  }

  logEvent({
    level: 'info',
    event: 'amazonPrice.fetched',
    meta: { productUrl, title, price },
  });

  return { productUrl, title, price, fetchedAt: new Date().toISOString() };
}
