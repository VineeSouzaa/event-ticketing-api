import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Event } from '../core/entities/event.entity';
import { ListEventsQueryDto } from './dto/events.dto';
import { decodeCursor, encodeCursor, EventsService } from './events.service';

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const event = (n: number) =>
  ({
    id: id(n),
    name: `Event ${n}`,
    category: 'Shows',
    startsAt: new Date(Date.UTC(2027, 0, n)),
    venue: 'Venue',
    city: 'City',
    imageUrl: null,
  }) as Event;

const query = (overrides: Partial<ListEventsQueryDto> = {}) =>
  Object.assign(new ListEventsQueryDto(), overrides);

describe('cursor', () => {
  it('round-trips', () => {
    const cursor = { startsAt: '2027-01-01T00:00:00.000Z', id: id(1) };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it.each([
    'not-base64-json',
    Buffer.from('{"startsAt":"nope","id":"x"}').toString('base64url'),
    Buffer.from('{}').toString('base64url'),
  ])('rejects a malformed cursor (%s)', (raw) => {
    expect(() => decodeCursor(raw)).toThrow(BadRequestException);
  });
});

describe('EventsService', () => {
  const qb = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
  };
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
    findOne: jest.fn(),
  };
  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(repo as unknown as Repository<Event>);
  });

  const rows = (...ns: number[]) => ({
    entities: ns.map(event),
    raw: ns.map(() => ({ min_price: '85.00' })),
  });

  it('returns a full page with a cursor pointing at its last item', async () => {
    qb.getRawAndEntities.mockResolvedValue(rows(1, 2, 3));

    const page = await service.list(query({ limit: 2 }));

    expect(qb.limit).toHaveBeenCalledWith(3);
    expect(page.items.map((e) => e.id)).toEqual([id(1), id(2)]);
    expect(page.items[0].minPrice).toBe('85.00');
    expect(decodeCursor(page.nextCursor!)).toEqual({
      startsAt: '2027-01-02T00:00:00.000Z',
      id: id(2),
    });
  });

  it('has no cursor on the last page', async () => {
    qb.getRawAndEntities.mockResolvedValue(rows(1, 2));

    const page = await service.list(query({ limit: 2 }));

    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it('applies the keyset cursor and escapes LIKE wildcards in the search', async () => {
    qb.getRawAndEntities.mockResolvedValue(rows());
    const cursor = encodeCursor({
      startsAt: '2027-01-02T00:00:00.000Z',
      id: id(2),
    });

    await service.list(query({ cursor, q: '50%_off' }));

    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('>'), {
      startsAt: '2027-01-02T00:00:00.000Z',
      id: id(2),
    });
    expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), {
      q: '%50\\%\\_off%',
    });
  });

  it('rejects an invalid cursor before querying', async () => {
    await expect(service.list(query({ cursor: 'garbage' }))).rejects.toThrow(
      BadRequestException,
    );
    expect(qb.getRawAndEntities).not.toHaveBeenCalled();
  });

  it('404s for an unknown or unpublished event', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(id(9))).rejects.toThrow(NotFoundException);
  });

  it('returns the detail with tiers and the cheapest price', async () => {
    repo.findOne.mockResolvedValue(
      Object.assign({}, event(1), {
        description: 'desc',
        ticketTiers: [
          {
            id: 't1',
            name: 'Pista',
            price: '85.00',
            totalQuantity: 10,
            available: 4,
          },
          {
            id: 't2',
            name: 'VIP',
            price: '200.00',
            totalQuantity: 5,
            available: 5,
          },
        ],
      }),
    );

    const detail = await service.findOne(id(1));

    expect(detail.minPrice).toBe('85.00');
    expect(detail.tiers).toHaveLength(2);
    expect(detail.description).toBe('desc');
  });
});
