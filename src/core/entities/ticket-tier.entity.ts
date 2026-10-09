import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';

// The hot entity: `available` is read heavily (cached in Redis, see core/cache) and written
// through an atomic conditional UPDATE (see core/database) — never decremented via a
// read-then-write round trip. The CHECK constraints are a second, database-level guarantee on
// top of that application-level logic, not a replacement for it.
@Entity('ticket_tiers')
@Check(`"available" >= 0`)
@Check(`"available" <= "total_quantity"`)
export class TicketTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event, (event) => event.ticketTiers)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: string;

  @Column({ name: 'total_quantity', type: 'int' })
  totalQuantity: number;

  @Index()
  @Column({ type: 'int' })
  available: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
