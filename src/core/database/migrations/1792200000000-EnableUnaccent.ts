import { MigrationInterface, QueryRunner } from 'typeorm';

// Lets event search match "frequencia" against "Frequência".
export class EnableUnaccent1792200000000 implements MigrationInterface {
  name = 'EnableUnaccent1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent"`);
  }
}
