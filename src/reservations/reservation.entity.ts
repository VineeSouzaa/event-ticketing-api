import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TicketTier } from '../core/entities/ticket-tier.entity';
import { User } from '../core/entities/user.entity';

// Belongs to this slice only — nothing outside `reservations/` references Reservation directly
// (see src/reservations/README.md and the one-directional dependency rule in CLAUDE.md).
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('reservations')
@Index(['status', 'expiresAt']) // the expiry job scans for pending reservations past expiresAt
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_tier_id' })
  ticketTierId: string;

  @ManyToOne(() => TicketTier)
  @JoinColumn({ name: 'ticket_tier_id' })
  ticketTier: TicketTier;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  // Client-supplied, deduped on — prevents a double-click or network retry from decrementing
  // availability twice for what the caller considers one request. See reservations/README.md.
  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Null once confirmed/cancelled — only meaningful while status is PENDING. The expiry job and
  // the confirm endpoint must guard against racing each other on this field (see CLAUDE.md).
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
}
