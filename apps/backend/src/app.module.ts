import * as https from 'https';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { TwseScraperService } from './twse-scraper.service';
import { AggregatorService } from './aggregator.service';
import { FugleApiService } from './fugle-api.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

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
  providers: [TwseScraperService, AggregatorService, FugleApiService],
})
export class AppModule {}
