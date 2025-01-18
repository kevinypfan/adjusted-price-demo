import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import numeral from 'numeral';
import { DateTime } from 'luxon';
import { Exchange } from '../enums/exchange.enum';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class TwseScraperService {
  private readonly logger = new Logger(TwseScraperService.name);
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}
  async fetchStocksSplits(options: {
    startDate: string;
    endDate: string;
    symbol?: string;
  }) {
    const { startDate, endDate, symbol } = options;
    const query = new URLSearchParams({
      strDate: DateTime.fromISO(startDate).toFormat('yyyyMMdd'),
      endDate: DateTime.fromISO(endDate).toFormat('yyyyMMdd'),
      response: 'json',
    });
    const url = `https://www.twse.com.tw/pcversion/zh/exchangeReport/TWTB8U?${query}`;

    const cacheData = await this.cacheManager.get<Record<string, any>[]>(url);
    if (cacheData)
      return symbol
        ? cacheData.filter((data) => data.symbol === symbol)
        : cacheData;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.stat === 'OK' && response.data;
    if (!json) return null;

    const data = json.data.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;
      const [year, month, day] = date.split('/');

      const data: Record<string, any> = {};
      data.resumptionDate = `${+year + 1911}-${month}-${day}`;
      data.exchange = Exchange.TWSE;
      data.symbol = symbol;
      data.name = name.trim();
      data.lastClosingPrice = numeral(values[0]).value();
      data.referencePrice = numeral(values[1]).value();
      data.upperLimitPrice = numeral(values[2]).value();
      data.lowerLimitPrice = numeral(values[3]).value();
      data.openingReferencePrice = numeral(values[4]).value();

      return data;
    }) as Record<string, any>[];

    await this.cacheManager.set(url, data);

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }

  async fetchStocksCapitalReduction(options: {
    startDate: string;
    endDate: string;
    symbol?: string;
  }) {
    const { startDate, endDate, symbol } = options;
    const query = new URLSearchParams({
      startDate: DateTime.fromISO(startDate).toFormat('yyyyMMdd'),
      endDate: DateTime.fromISO(endDate).toFormat('yyyyMMdd'),
      response: 'json',
    });
    const url = `https://www.twse.com.tw/rwd/zh/reducation/TWTAUU?${query}`;

    const cacheData = await this.cacheManager.get<Record<string, any>[]>(url);
    if (cacheData)
      return symbol
        ? cacheData.filter((data) => data.symbol === symbol)
        : cacheData;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.stat === 'OK' && response.data;
    if (!json) return null;

    const data = json.data.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;
      const [year, month, day] = date.split('/');

      const data: Record<string, any> = {};
      data.resumptionDate = `${+year + 1911}-${month}-${day}`;
      data.exchange = Exchange.TWSE;
      data.symbol = symbol;
      data.name = name.trim();
      data.lastClosingPrice = numeral(values[0]).value();
      data.referencePrice = numeral(values[1]).value();
      data.upperLimitPrice = numeral(values[2]).value();
      data.lowerLimitPrice = numeral(values[3]).value();
      data.openingReferencePrice = numeral(values[4]).value();
      data.rightsIssueReferencePrice = numeral(values[5]).value();
      data.capitalReductionReason = values[6].trim();
      const [_, detailDate] = values[7].split(',');
      data.detailMeta = {
        symbol,
        date: detailDate,
      };

      return data;
    }) as Record<string, any>[];

    await this.cacheManager.set(url, data);

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }

  async fetchStockCapitalReductionDetail(symbol: string, date: string) {
    const query = new URLSearchParams({
      STK_NO: symbol,
      FILE_DATE: DateTime.fromISO(date).toFormat('yyyyMMdd'),
      response: 'json',
    });
    const url = `https://www.twse.com.tw/rwd/zh/reducation/TWTAVUDetail?${query}`;

    const cacheData = await this.cacheManager.get<Record<string, any>>(url);
    if (cacheData) return cacheData;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.stat === 'OK' && response.data;
    if (!json) return null;

    const [_, name, ...values] = json.data[0];
    const [year, month, day] = values[0].split('/');

    const data: Record<string, any> = {};

    data.symbol = symbol;
    data.stockName = name.trim();
    data.stopTradingDate = `${+year + 1911}-${month}-${day}`;
    data.newSharesPerThousand = parseFloat(values[1]);
    data.refundPerShare = parseFloat(values[2]);

    return data;
  }

  async fetchStocksRightsAndDividend(options: {
    startDate: string;
    endDate: string;
    symbol?: string;
  }) {
    const { startDate, endDate, symbol } = options;
    const query = new URLSearchParams({
      startDate: DateTime.fromISO(startDate).toFormat('yyyyMMdd'),
      endDate: DateTime.fromISO(endDate).toFormat('yyyyMMdd'),
      response: 'json',
    });
    const url = `https://wwwc.twse.com.tw/rwd/zh/exRight/TWT49U?${query}`;
    const cacheData = await this.cacheManager.get<Record<string, any>[]>(url);
    if (cacheData)
      return symbol
        ? cacheData.filter((data) => data.symbol === symbol)
        : cacheData;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.stat === 'OK' && response.data;
    if (!json) return null;

    const data = json.data.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;
      const formattedDate = date.replace(
        /(\d+)年(\d+)月(\d+)日/,
        (_, year, month, day) => {
          const westernYear = parseInt(year) + 1911;
          return `${westernYear}-${month.padStart(2, '0')}-${day.padStart(
            2,
            '0'
          )}`;
        }
      );

      const data: Record<string, any> = {};
      data.resumptionDate = formattedDate;
      data.exchange = Exchange.TWSE;
      data.symbol = symbol;
      data.name = name.trim();
      data.closingPriceBeforeRightsAndDividends = numeral(values[0]).value();
      data.referencePrice = numeral(values[1]).value();
      data.rightsValuePlusDividendValue = numeral(values[2]).value();
      data.rightsOrDividend = values[3].trim();
      data.upperLimitPrice = numeral(values[4]).value();
      data.lowerLimitPrice = numeral(values[5]).value();
      data.openingReferencePrice = numeral(values[6]).value();
      data.referencePriceAfterDividendDeduction = numeral(values[7]).value();
      const [_, detailDate] = values[8].split(',');
      data.detailMeta = {
        symbol,
        date: detailDate,
      };
      return data;
    }) as Record<string, any>[];

    await this.cacheManager.set(url, data);

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }

  async fetchStockRightsAndDividendDetail(symbol: string, date: string) {
    const query = new URLSearchParams({
      STK_NO: symbol,
      T1: DateTime.fromISO(date).toFormat('yyyyMMdd'),
      response: 'json',
    });
    const url = `https://wwwc.twse.com.tw/rwd/zh/exRight/TWT49UDetail?${query}`;
    const cacheData = await this.cacheManager.get<Record<string, any>>(url);
    if (cacheData) return cacheData;

    const response = await firstValueFrom(this.httpService.get(url));

    const json = response.data.stat === 'ok' && response.data;

    if (!json) return null;
    const [_, name, ...values] = json.data[0];
    const data: Record<string, any> = {};

    data.symbol = symbol;
    data.stockName = name.trim();
    data.dividendPerShare = values[0] ? parseFloat(values[0]) : null;
    data.rightPerShare = values[2] ? parseFloat(values[2]) : null;
    data.employeeBonusConvertedToStocks = parseFloat(values[3]);
    data.cashCapitalIncrease = parseFloat(values[4]);
    data.subscriptionAmountPerShare = parseFloat(values[5]);
    data.publicSubscription = parseFloat(values[6]);
    data.employeeSubscription = parseFloat(values[7]);
    data.shareholderSubscription = parseFloat(values[8]);
    data.subscriptionPerThousandSharesByShareholdersRatio = parseFloat(
      values[9]
    );

    return data;
  }
}
