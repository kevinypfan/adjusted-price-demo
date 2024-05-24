import { Injectable } from '@nestjs/common';
import { TpexScraperService } from './tpex-scraper.service';
import { DateTime } from 'luxon';
import { FugleApiService } from './fugle-api.service';
import Decimal from 'decimal.js';

@Injectable()
export class TpexAggregatorService {
  constructor(
    private readonly tpexScraperService: TpexScraperService,
    private readonly fugleApiService: FugleApiService
  ) {}

  async getAdjustedCandles(symbol: string, from: string, to: string) {
    const candles = await this.fugleApiService.getCandles(symbol, from, to);
    const rates = await this.getAdjustedRates(symbol, from, to);
    rates.forEach((rate) => {
      candles.forEach((candle) => {
        if (DateTime.fromISO(rate.date) > DateTime.fromISO(candle.date)) {
          candle.open = Decimal.mul(candle.open, rate.rate).toNumber();
          candle.high = Decimal.mul(candle.high, rate.rate).toNumber();
          candle.low = Decimal.mul(candle.low, rate.rate).toNumber();
          candle.close = Decimal.mul(candle.close, rate.rate).toNumber();
        }
      });
    });
    return candles.map((candle) => ({
      ...candle,
      open: +candle.open.toFixed(2),
      high: +candle.high.toFixed(2),
      low: +candle.low.toFixed(2),
      close: +candle.close.toFixed(2),
    }));
  }

  async getAdjustedRates(symbol: string, from: string, to: string) {
    const options = { symbol, startDate: from, endDate: to };

    const rates = [];

    const capitalReduction =
      await this.tpexScraperService.fetchStocksCapitalReduction(options);
    for (const cr of capitalReduction) {
      // (昨收 - 每股退還股款) / ( 1 - (1000 - 每一仟股換發新股票) / 1000)
      const referencePrice = Decimal.div(
        Decimal.sub(cr.lastClosingPrice, cr.refundPerShare),
        Decimal.sub(
          1,
          Decimal.div(Decimal.sub(1000, cr.newSharesPerThousand), 1000)
        )
      );

      rates.push({
        date: cr.resumptionDate,
        rate: Decimal.sub(
          1,
          Decimal.div(
            Decimal.sub(cr.lastClosingPrice, referencePrice),
            cr.lastClosingPrice
          )
        ),
      });
    }

    const rightsAndDividend =
      await this.tpexScraperService.fetchStocksRightsAndDividend(options);
    for (const rd of rightsAndDividend) {
      if (rd.dividendPerShare) {
        const rate = {
          date: rd.resumptionDate,
          rate: Decimal.sub(
            1,
            Decimal.div(
              rd.dividendPerShare,
              rd.closingPriceBeforeRightsAndDividends
            )
          ),
        };
        rates.push(rate);
      }

      if (rd.rightPerShare) {
        const rate = {
          date: rd.resumptionDate,
          rate: Decimal.div(
            1,
            Decimal.add(1, Decimal.div(rd.rightPerShare, 1000))
          ),
        };
        rates.push(rate);
      }
    }

    const splits = await this.tpexScraperService.fetchStocksSplits(options);
    for (const sp of splits) {
      rates.push({
        date: sp.resumptionDate,
        rate: Decimal.sub(
          1,
          Decimal.div(
            Decimal.sub(sp.lastClosingPrice, sp.referencePrice),
            sp.lastClosingPrice
          )
        ),
      });
    }
    return rates;
  }
}
