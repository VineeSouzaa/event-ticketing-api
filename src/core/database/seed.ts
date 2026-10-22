import { PasswordHasher } from '@nestjs/authentication';

import { Event, EventStatus } from '../entities/event.entity';
import { TicketTier } from '../entities/ticket-tier.entity';
import { User } from '../entities/user.entity';
import dataSource from './data-source';

// Local dev data only. Run with `pnpm seed`; safe to re-run — rows that already exist (user by
// email, event by name) are skipped, so it never resets `available` on a tier mid-testing.
const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password1234',
};

// Starts at a round hour (America/Sao_Paulo is UTC-3 with no DST) so the UI shows e.g. 21:00.
const daysFromNow = (days: number, hourLocal = 21) => {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  date.setUTCHours(hourLocal + 3, 0, 0, 0);
  return date;
};

const EVENTS = [
  {
    name: 'Frequência Festival',
    description:
      'Uma noite de encontros, música eletrônica e uma pista em outra frequência.',
    category: 'Eletrônica',
    startsAt: daysFromNow(24),
    venue: 'Pavilhão das Artes',
    city: 'São Paulo, SP',
    imageUrl: '/events/event-frequency.jpg',
    status: EventStatus.PUBLISHED,
    tiers: [
      { name: 'Camarote', price: '420.00', totalQuantity: 50 },
      { name: 'Pista', price: '180.00', totalQuantity: 500 },
    ],
  },
  {
    name: 'Horizonte Music Festival',
    description:
      'O pôr do sol encontra a música. Uma seleção de shows ao ar livre para viver sem pressa.',
    category: 'Festivais',
    startsAt: daysFromNow(31),
    venue: 'Parque do Horizonte',
    city: 'São Paulo, SP',
    imageUrl: '/events/event-horizon.jpg',
    status: EventStatus.PUBLISHED,
    tiers: [
      { name: 'VIP', price: '300.00', totalQuantity: 80 },
      { name: 'Pista', price: '120.00', totalQuantity: 800 },
    ],
  },
  {
    name: 'Jazz After Hours',
    description:
      'Uma noite intimista de jazz ao vivo, improviso e encontros na Casa do Jazz.',
    category: 'Shows',
    startsAt: daysFromNow(38),
    venue: 'Casa do Jazz',
    city: 'São Paulo, SP',
    imageUrl: '/events/event-jazz.jpg',
    status: EventStatus.PUBLISHED,
    // Deliberately tiny: handy for exercising the sold-out / concurrent-reservation paths.
    tiers: [{ name: 'Pista', price: '85.00', totalQuantity: 10 }],
  },
  {
    name: 'Festival de Inverno (draft)',
    description: 'Not yet announced — should not appear in public listings.',
    category: 'Festivais',
    startsAt: daysFromNow(180),
    venue: 'Auditório Principal',
    city: 'Campos do Jordão, SP',
    imageUrl: null,
    status: EventStatus.DRAFT,
    tiers: [{ name: 'Pista', price: '200.00', totalQuantity: 200 }],
  },
];

async function seedUser() {
  const users = dataSource.getRepository(User);
  if (await users.existsBy({ email: TEST_USER.email })) {
    console.log(`user ${TEST_USER.email}: already exists, skipped`);
    return;
  }
  await users.save(
    users.create({
      email: TEST_USER.email,
      name: TEST_USER.name,
      passwordHash: await new PasswordHasher().hash(TEST_USER.password),
    }),
  );
  console.log(
    `user ${TEST_USER.email}: created (password: ${TEST_USER.password})`,
  );
}

async function seedEvents() {
  const events = dataSource.getRepository(Event);
  const tiers = dataSource.getRepository(TicketTier);
  for (const { tiers: tierSeeds, ...eventSeed } of EVENTS) {
    if (await events.existsBy({ name: eventSeed.name })) {
      console.log(`event "${eventSeed.name}": already exists, skipped`);
      continue;
    }
    const event = await events.save(events.create(eventSeed));
    await tiers.save(
      tierSeeds.map((tier) =>
        tiers.create({
          ...tier,
          eventId: event.id,
          available: tier.totalQuantity,
        }),
      ),
    );
    console.log(
      `event "${event.name}": created with ${tierSeeds.length} tier(s)`,
    );
  }
}

async function main() {
  await dataSource.initialize();
  try {
    await seedUser();
    await seedEvents();
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
