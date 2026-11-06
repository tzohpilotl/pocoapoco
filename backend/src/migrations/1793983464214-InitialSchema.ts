import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793983464214 implements MigrationInterface {
    name = 'InitialSchema1793983464214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_625ed5469429a6b32e34ba9f827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "googleId" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying, "projectStatusId" uuid NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_status_configuration" ("projectId" uuid NOT NULL, "projectStatusId" uuid NOT NULL, CONSTRAINT "PK_a614ccfb09c4675e84d06965114" PRIMARY KEY ("projectId", "projectStatusId"))`);
        await queryRunner.query(`CREATE TABLE "project_status_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loggedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid NOT NULL, "projectStatusId" uuid NOT NULL, "notes" character varying, CONSTRAINT "PK_8d1e0a3a680a0d1e9ce6ce78c89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_7c4b0d3b77eaf26f8b4da879e63" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_1e9987aced9ea3cdbc45367853b" FOREIGN KEY ("projectStatusId") REFERENCES "project_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_status_configuration" ADD CONSTRAINT "FK_cd218ec60667be4b653a80f7e40" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_status_configuration" ADD CONSTRAINT "FK_3c8e2a28c47369841ac520781df" FOREIGN KEY ("projectStatusId") REFERENCES "project_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_status_log" ADD CONSTRAINT "FK_2cc095f3a3a6012dd4a72bb5bd7" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_status_log" ADD CONSTRAINT "FK_d2068e1811f16bfb86b067fccd5" FOREIGN KEY ("projectStatusId") REFERENCES "project_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_status_log" DROP CONSTRAINT "FK_d2068e1811f16bfb86b067fccd5"`);
        await queryRunner.query(`ALTER TABLE "project_status_log" DROP CONSTRAINT "FK_2cc095f3a3a6012dd4a72bb5bd7"`);
        await queryRunner.query(`ALTER TABLE "project_status_configuration" DROP CONSTRAINT "FK_3c8e2a28c47369841ac520781df"`);
        await queryRunner.query(`ALTER TABLE "project_status_configuration" DROP CONSTRAINT "FK_cd218ec60667be4b653a80f7e40"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_1e9987aced9ea3cdbc45367853b"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_7c4b0d3b77eaf26f8b4da879e63"`);
        await queryRunner.query(`DROP TABLE "project_status_log"`);
        await queryRunner.query(`DROP TABLE "project_status_configuration"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "project_status"`);
    }

}
