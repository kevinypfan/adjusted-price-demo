import { Inject, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { RestClient } from '@fugle/marketdata';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RestStockHistoricalCandlesResponse } from '@fugle/marketdata/lib/rest/stock/historical/candles';
import { RestStockIntradayTickerResponse } from '@fugle/marketdata/lib/rest/stock/intraday/ticker';

@Injectable()
export class FugleApiService {
  private readonly logger = new Logger(FugleApiService.name);
  private readonly restClient = new RestClient({
    apiKey: process.env.FUGLE_API_KEY,
  });
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getTicker(symbol: string) {
    const cacheKey = `ticker:${symbol}`;
    const cacheCandles =
      await this.cacheManager.get<RestStockIntradayTickerResponse>(cacheKey);
    if (cacheCandles) return cacheCandles;
    const stock = this.restClient.stock; // Stock REST API client
    const ticker = await stock.intraday.ticker({ symbol });
    return ticker;
  }

  async getCandles(symbol: string, from: string, to: string) {
    const cacheKey = `candles:${symbol}:${from}:${to}`;
    const cacheCandles = await this.cacheManager.get<
      RestStockHistoricalCandlesResponse[]
    >(cacheKey);
    if (cacheCandles) return cacheCandles;

    const yearlyRanges = this.generateYearlyRanges(from, to);
    const stock = this.restClient.stock; // Stock REST API client

    const promises = yearlyRanges.map(({ start, end }) => {
      return stock.historical.candles({
        symbol,
        from: start,
        to: end,
      });
    });

    const results = await Promise.all(promises);
    const candles = results
      .filter((result) => result.data)
      .map((result) => result.data.reverse())
      .flat();

    await this.cacheManager.set(cacheKey, candles);

    return candles;
  }

  generateYearlyRanges(start: string, end: string) {
    let startDate = DateTime.fromISO(start);
    const endDate = DateTime.fromISO(end);

    const result = [];

    while (startDate < endDate) {
      const yearEnd = startDate.endOf('year');
      const yearStart = yearEnd.plus({ years: 1 }).startOf('year');

      if (yearEnd > endDate) {
        result.push({ start: startDate.toISODate(), end: endDate.toISODate() });
        break;
      }

      result.push({ start: startDate.toISODate(), end: yearEnd.toISODate() });
      startDate = yearStart;
    }

    return result;
  }
}
