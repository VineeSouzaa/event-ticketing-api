import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventHomeColumns1792100000000 implements MigrationInterface {
  name = 'AddEventHomeColumns1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Defaults only backfill rows that already exist; the entity declares none.
    await queryRunner.query(
      `ALTER TABLE "events" ADD "city" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD "category" character varying NOT NULL DEFAULT 'Shows'`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "city" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "category" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD "image_url" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_events_status_starts_at_id" ON "events" ("status", "starts_at", "id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_events_status_starts_at_id"`,
    );
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "city"`);
  }
}
