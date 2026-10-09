import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Deliberately minimal — auth/identity is not a focus area of this project (see CLAUDE.md).
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
