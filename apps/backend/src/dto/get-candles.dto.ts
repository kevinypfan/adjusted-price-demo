import { IsDateString } from 'class-validator';
import { DateTime } from 'luxon';

export class GetCandles {
  @IsDateString()
  from: string = DateTime.local().minus({ week: 1 }).toISODate();

  @IsDateString()
  to: string = DateTime.local().toISODate();
}
