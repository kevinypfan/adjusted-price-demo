import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Exchange } from '../enums/exchange.enum';
import numeral from 'numeral';

@Injectable()
export class TpexScraperService {
  private readonly logger = new Logger(TpexScraperService.name);

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
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    const query = new URLSearchParams({
      d: `${+startYear - 1911}/${startMonth}/${startDay}`,
      ed: `${+endYear - 1911}/${endMonth}/${endDay}`,
      o: 'json',
    });
    const url = `https://www.tpex.org.tw/web/bulletin/parvaluechg/rslt_result.php?${query}`;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.iTotalRecords > 0 && response.data;
    if (!json) return null;

    const data = json.aaData.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;

      const data: Record<string, any> = {};
      data.resumptionDate = `${date}`.replace(
        /(\d{3})(\d{2})(\d{2})/,
        (_, year, month, day) => `${+year + 1911}-${month}-${day}`
      );
      data.exchange = Exchange.TPEx;
      data.symbol = symbol;
      data.name = name.trim();
      data.lastClosingPrice = numeral(values[0]).value();
      data.referencePrice = numeral(values[1]).value();
      data.upperLimitPrice = numeral(values[2]).value();
      data.lowerLimitPrice = numeral(values[3]).value();
      data.openingReferencePrice = numeral(values[4]).value();

      return data;
    }) as Record<string, any>[];

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }

  async fetchStocksCapitalReduction(options: {
    startDate: string;
    endDate: string;
    symbol?: string;
  }) {
    const { startDate, endDate, symbol } = options;
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    const query = new URLSearchParams({
      d: `${+startYear - 1911}/${startMonth}/${startDay}`,
      ed: `${+endYear - 1911}/${endMonth}/${endDay}`,
      o: 'json',
    });
    const url = `https://www.tpex.org.tw/web/stock/exright/revivt/revivt_result.php?${query}`;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.iTotalRecords > 0 && response.data;
    if (!json) return null;

    const data = json.aaData.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;

      const data: Record<string, any> = {};
      data.resumptionDate = `${date}`.replace(
        /(\d{3})(\d{2})(\d{2})/,
        (_, year, month, day) => `${+year + 1911}-${month}-${day}`
      );
      data.exchange = Exchange.TPEx;
      data.symbol = symbol;
      data.name = name.trim();
      data.lastClosingPrice = numeral(values[0]).value();
      data.resumptionReferencePrice = numeral(values[1]).value();
      data.upperLimitPrice = numeral(values[2]).value();
      data.lowerLimitPrice = numeral(values[3]).value();
      data.openingReferencePrice = numeral(values[4]).value();
      data.rightsIssueReferencePrice = numeral(values[5]).value();
      data.capitalReductionReason = values[6].trim();

      const urlPattern = /window\.open\('(.+?)',/;
      const match = values[7].match(urlPattern);

      if (match) {
        const url = match[1];
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const details = [...urlParams.values()];
        data.stopTradingDate = `${details[2]}`.replace(
          /(\d{3})(\d{2})(\d{2})/,
          (_, year, month, day) => `${+year + 1911}-${month}-${day}`
        );
        data.newSharesPerThousand = numeral(details[4]).value();
        data.refundPerShare = numeral(details[5]).value();
      }
      return data;
    }) as Record<string, any>[];

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }

  async fetchStocksRightsAndDividend(options: {
    startDate: string;
    endDate: string;
    symbol?: string;
  }) {
    const { startDate, endDate, symbol } = options;
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    const query = new URLSearchParams({
      d: `${+startYear - 1911}/${startMonth}/${startDay}`,
      ed: `${+endYear - 1911}/${endMonth}/${endDay}`,
      o: 'json',
    });
    const url = `https://www.tpex.org.tw/web/stock/exright/dailyquo/exDailyQ_result.php?${query}`;

    const response = await firstValueFrom(this.httpService.get(url));
    const json = response.data.iTotalRecords > 0 && response.data;
    if (!json) return null;

    const data = json.aaData.map((row: string[]) => {
      const [date, symbol, name, ...values] = row;
      const [year, month, day] = date.split('/');

      const data: Record<string, any> = {};
      data.resumptionDate = `${+year + 1911}-${month}-${day}`;
      data.exchange = Exchange.TPEx;
      data.symbol = symbol;
      data.name = name.trim();
      data.closingPriceBeforeRightsAndDividends = numeral(values[0]).value();
      data.referencePrice = numeral(values[1]).value();
      data.rightsValue = numeral(values[2]).value();
      data.dividendValue = numeral(values[3]).value();
      data.rightsValuePlusDividendValue = numeral(values[4]).value();
      data.rightsOrDividend = values[5].trim();
      data.upperLimitPrice = numeral(values[6]).value();
      data.lowerLimitPrice = numeral(values[7]).value();
      data.openingReferencePrice = numeral(values[8]).value();
      data.referencePriceAfterDividendDeduction = numeral(values[9]).value();
      data.dividendPerShare = numeral(values[10]).value();
      data.rightPerShare = numeral(values[11]).value();

      return data;
    }) as Record<string, any>[];

    return symbol ? data.filter((data) => data.symbol === symbol) : data;
  }
}
