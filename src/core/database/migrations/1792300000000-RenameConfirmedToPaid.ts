import { MigrationInterface, QueryRunner } from 'typeorm';

// "confirmed" was ambiguous (confirmed by whom? before or after payment?). The only transition
// into it is the payment webhook, so the status and its timestamp are renamed to say so.
export class RenameConfirmedToPaid1792300000000 implements MigrationInterface {
  name = 'RenameConfirmedToPaid1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."reservations_status_enum" RENAME VALUE 'confirmed' TO 'paid'`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" RENAME COLUMN "confirmed_at" TO "paid_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservations" RENAME COLUMN "paid_at" TO "confirmed_at"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."reservations_status_enum" RENAME VALUE 'paid' TO 'confirmed'`,
    );
  }
}
