import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuthColumns1792000000000 implements MigrationInterface {
  name = 'AddUserAuthColumns1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_hash" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }
}
