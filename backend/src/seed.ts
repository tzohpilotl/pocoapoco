import { AppDataSource } from "./data-source";
import { ProjectStatus } from "./entities/project-status.entity";

// The overall Project Status catalog, matching the values the frontend mock
// (frontend/mock/db.json) shipped with — so a freshly-migrated local DB has
// the same statuses to choose from as the old json-server mock did. Idempotent:
// safe to re-run, inserts only the statuses that are missing by name.
const STATUS_NAMES = ["no response", "first contact", "interviewed", "offer", "rejected"];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(ProjectStatus);
    let created = 0;
    for (const name of STATUS_NAMES) {
      const existing = await repo.findOne({ where: { name } });
      if (!existing) {
        await repo.save(repo.create({ name }));
        created += 1;
      }
    }
    console.log(`Seeded project statuses (${created} created, ${STATUS_NAMES.length - created} already present).`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
