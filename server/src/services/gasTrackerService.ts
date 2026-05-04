import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { logEvent } from '../utils/eventLogger';

export interface GasPriceData {
  price: number | undefined;
  change: number | undefined;
  /** Raw date string from the Historical Values table, e.g. "May 3, 2025" */
  latestDate: string | undefined;
  /** Headline upcoming-move text, e.g. "No Change" or "+3 cents" */
  headlineChange: string | undefined;
  /** Direction of the upcoming move: "+" | "-" | "=" */
  direction: '+' | '-' | '=';
  /** Full forecast block text (En-Pro prediction) */
  forecastBlock: string | undefined;
  fetchedAt: string;
}

const GAS_URL = 'https://toronto.citynews.ca/toronto-gta-gas-prices/';

function normText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseFirstNumber(text: string, pattern: RegExp): number | undefined {
  const m = pattern.exec(text);
  return m?.[1] === undefined ? undefined : Number.parseFloat(m[1]);
}

export async function fetchGasPrices(): Promise<GasPriceData> {
  logEvent({ level: 'debug', event: 'gasTracker.fetching', meta: { url: GAS_URL } });

  const { data: html } = await axios.get<string>(GAS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pushover-dashboard/1.0)' },
    timeout: 10_000,
  });

  const $ = cheerio.load(html);
  const result: GasPriceData = {
    price: undefined,
    change: undefined,
    latestDate: undefined,
    headlineChange: undefined,
    direction: '=',
    forecastBlock: undefined,
    fetchedAt: new Date().toISOString(),
  };

  // --- Forecast block (upcoming price move) ---
  const container = $('#gas_price_latest_container .float-box').first();
  if (container.length) {
    const changeBox = container.find('.data-box-change').first();
    const upStyle = changeBox.find('.up-arrow').first().attr('style') ?? '';
    const downStyle = changeBox.find('.down-arrow').first().attr('style') ?? '';
    if (upStyle.includes('display:block') || upStyle.includes('display: block')) {
      result.direction = '+';
    } else if (downStyle.includes('display:block') || downStyle.includes('display: block')) {
      result.direction = '-';
    }
    const changeEl = changeBox.find('.float-start').first();
    if (changeEl.length) {
      result.headlineChange = normText(changeEl.text());
    }
    const fullBox = normText(container.text());
    result.forecastBlock = result.headlineChange && fullBox.startsWith(result.headlineChange)
      ? fullBox.slice(result.headlineChange.length).trim()
      : fullBox;
  }

  // --- Historical Values table: Date | Change | Price ---
  let tableEl: cheerio.Cheerio<Element> | null = null;
  $('h2.page-table-title').each((_i, el) => {
    if (normText($(el).text()).startsWith('Historical')) {
      tableEl = $(el).nextAll('table.page-table-body').first();
      return false as unknown as void;
    }
  });

  const firstDataRow = tableEl
    ? (tableEl as cheerio.Cheerio<Element>).find('tr').filter((_i, tr) => {
        return $(tr).find('td.page-table-column').length >= 3;
      }).first()
    : $('table tr').filter((_i, el) => $(el).find('td').length >= 3).first();

  if (firstDataRow.length) {
    const cells = firstDataRow.find('td.page-table-column').length >= 3
      ? firstDataRow.find('td.page-table-column')
      : firstDataRow.find('td');

    result.latestDate = normText($(cells[0]).text());
    result.change = parseFirstNumber(normText($(cells[1]).text()), /([+-]?[\d.]+)/);
    result.price = parseFirstNumber(normText($(cells[2]).text()), /([\d.]+)/);
  }

  // Fallback: parse from body text
  result.price ??= parseFirstNumber($('body').text(), /average of ([\d.]+) cent/i);

  logEvent({
    level: 'info',
    event: 'gasTracker.fetched',
    meta: { price: result.price, direction: result.direction, headlineChange: result.headlineChange },
  });

  return result;
}
