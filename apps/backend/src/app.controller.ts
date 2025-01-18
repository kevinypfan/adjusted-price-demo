import {
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FugleApiService } from './services/fugle-api.service';
import { GetCandles } from './dto/get-candles.dto';
import { TwseAggregatorService } from './services/twse-aggregator.service';
import { CACHE_MANAGER, CacheInterceptor, Cache } from '@nestjs/cache-manager';
import { Cron } from '@nestjs/schedule';
import { TpexAggregatorService } from './services/tpex-aggregator.service';
import { Exchange } from './enums/exchange.enum';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly fugleApiService: FugleApiService,
    private readonly twseAggregatorService: TwseAggregatorService,
    private readonly tpexAggregatorService: TpexAggregatorService
  ) {}

  @Get('ticker/:symbol')
  getTicker(@Param('symbol') symbol) {
    return this.fugleApiService.getTicker(symbol);
  }

  @Get('original/candles/:symbol')
  getOriginalCandles(@Param('symbol') symbol, @Query() query: GetCandles) {
    return this.fugleApiService.getCandles(symbol, query.from, query.to);
  }

  @Get('adjested/candles/:symbol')
  async getAdjestedCandles(
    @Param('symbol') symbol,
    @Query() query: GetCandles
  ) {
    const ticker = await this.fugleApiService.getTicker(symbol);

    if (ticker.exchange === Exchange.TWSE) {
      return this.twseAggregatorService.getAdjustedCandles(
        symbol,
        query.from,
        query.to
      );
    } else if (ticker.exchange === Exchange.TPEx) {
      return this.tpexAggregatorService.getAdjustedCandles(
        symbol,
        query.from,
        query.to
      );
    } else {
      throw new NotFoundException();
    }
  }

  @Cron('0 0 0 * * *')
  handleResetCache() {
    this.logger.verbose('every reset cache');
    this.cacheManager.reset();
  }

  @Cron('0 */30 * * * *')
  async handleCron() {
    const keys = await this.cacheManager.store.keys();
    this.logger.verbose(`every 30 min print cache keys: ${keys}`);
  }
}
