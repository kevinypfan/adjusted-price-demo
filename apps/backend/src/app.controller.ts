import {
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FugleApiService } from './fugle-api.service';
import { GetCandles } from './dto/get-candles.dto';
import { AggregatorService } from './aggregator.service';
import { CACHE_MANAGER, CacheInterceptor, Cache } from '@nestjs/cache-manager';
import { Cron } from '@nestjs/schedule';

@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly fugleApiService: FugleApiService,
    private readonly aggregatorService: AggregatorService,
  ) {}

  @Get('original/candles/:symbol')
  getOriginalCandles(@Param('symbol') symbol, @Query() query: GetCandles) {
    return this.fugleApiService.getCandles(symbol, query.from, query.to);
  }

  @Get('adjested/candles/:symbol')
  getAdjestedCandles(@Param('symbol') symbol, @Query() query: GetCandles) {
    return this.aggregatorService.getAdjustedCandles(
      symbol,
      query.from,
      query.to,
    );
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
