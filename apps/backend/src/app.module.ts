import * as https from 'https';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { TwseScraperService } from './services/twse-scraper.service';
import { TwseAggregatorService } from './services/twse-aggregator.service';
import { FugleApiService } from './services/fugle-api.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TpexScraperService } from './services/tpex-scraper.service';
import { TpexAggregatorService } from './services/tpex-aggregator.service';

@Module({
  imports: [
    CacheModule.register({ ttl: 0 }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HttpModule.register({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    TwseScraperService,
    TwseAggregatorService,
    TpexScraperService,
    TpexAggregatorService,
    FugleApiService,
  ],
})
export class AppModule {}
