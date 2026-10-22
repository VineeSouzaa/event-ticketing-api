import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event, EventStatus } from '../core/entities/event.entity';
import {
  EventDetailDto,
  EventPageDto,
  EventSummaryDto,
  ListEventsQueryDto,
} from './dto/events.dto';

// Response DTOs are classes for Swagger; the objects we build are plain, so spreading is safe.
type Plain<T> = { [K in keyof T]: T[K] };

type Cursor = { startsAt: string; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const encodeCursor = (cursor: Cursor) =>
  Buffer.from(JSON.stringify(cursor)).toString('base64url');

export function decodeCursor(raw: string): Cursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, 'base64url').toString(),
    ) as Cursor;
    if (
      typeof parsed.startsAt === 'string' &&
      !Number.isNaN(Date.parse(parsed.startsAt)) &&
      typeof parsed.id === 'string' &&
      UUID.test(parsed.id)
    ) {
      return parsed;
    }
  } catch {
    // falls through to the error below
  }
  throw new BadRequestException('Invalid cursor');
}

// `%` and `_` are wildcards in ILIKE — the user's search text must match literally.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const MIN_PRICE = `(SELECT MIN(t.price) FROM ticket_tiers t WHERE t.event_id = event.id)`;

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly events: Repository<Event>,
  ) {}

  async list(query: ListEventsQueryDto): Promise<EventPageDto> {
    const qb = this.events
      .createQueryBuilder('event')
      .addSelect(MIN_PRICE, 'min_price')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.startsAt >= now()')
      .orderBy('event.startsAt', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .limit(query.limit + 1); // one extra row tells us whether another page exists

    if (query.cursor) {
      const { startsAt, id } = decodeCursor(query.cursor);
      qb.andWhere('(event.startsAt, event.id) > (:startsAt, :id)', {
        startsAt,
        id,
      });
    }
    if (query.category) {
      qb.andWhere('event.category = :category', { category: query.category });
    }
    const search = query.q?.trim();
    if (search) {
      qb.andWhere(
        `(unaccent(event.name) ILIKE unaccent(:q)
          OR unaccent(event.category) ILIKE unaccent(:q)
          OR unaccent(event.venue) ILIKE unaccent(:q)
          OR unaccent(event.city) ILIKE unaccent(:q))`,
        { q: `%${escapeLike(search)}%` },
      );
    }

    const { entities, raw } = await qb.getRawAndEntities<{
      min_price: string | null;
    }>();
    const rows = entities.map((event, i) => ({
      event,
      minPrice: raw[i].min_price,
    }));
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map(({ event, minPrice }) => this.toSummary(event, minPrice)),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              startsAt: last.event.startsAt.toISOString(),
              id: last.event.id,
            })
          : null,
    };
  }

  async findOne(id: string): Promise<EventDetailDto> {
    const event = await this.events.findOne({
      where: { id, status: EventStatus.PUBLISHED },
      relations: { ticketTiers: true },
      order: { ticketTiers: { price: 'ASC' } },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    // Read straight from Postgres for now; the Redis read-through cache goes in front of this
    // once the availability slice exists (see CLAUDE.md).
    const tiers = event.ticketTiers.map(
      ({ id, name, price, totalQuantity, available }) => ({
        id,
        name,
        price,
        totalQuantity,
        available,
      }),
    );
    return {
      ...this.toSummary(event, tiers[0]?.price ?? null),
      description: event.description,
      tiers,
    };
  }

  private toSummary(
    event: Event,
    minPrice: string | null,
  ): Plain<EventSummaryDto> {
    return {
      id: event.id,
      name: event.name,
      category: event.category,
      startsAt: event.startsAt,
      venue: event.venue,
      city: event.city,
      imageUrl: event.imageUrl,
      minPrice,
    };
  }
}
