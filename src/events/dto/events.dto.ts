import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListEventsQueryDto {
  @ApiPropertyOptional({ description: 'Opaque cursor from a previous page' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;

  @ApiPropertyOptional({
    description: 'Matches name, category, venue and city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ example: 'Shows' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class EventSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  startsAt: Date;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  city: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '85.00',
    description: 'Cheapest tier price; null when the event has no tiers',
  })
  minPrice: string | null;
}

export class EventPageDto {
  @ApiProperty({ type: [EventSummaryDto] })
  items: EventSummaryDto[];

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Pass as `cursor` to get the next page; null on the last page',
  })
  nextCursor: string | null;
}

export class TicketTierDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: '85.00' })
  price: string;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  available: number;
}

export class EventDetailDto extends EventSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ type: [TicketTierDto] })
  tiers: TicketTierDto[];
}
