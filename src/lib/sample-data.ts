import "server-only";
import { seedWorld, type WorldContext } from "@/lib/seed-world";

type Seeder = (world: WorldContext) => Promise<void>;

// One seeder per line. Each fills its own tables for one new institution.
const seeders: Seeder[] = [
  seedWorld,
];

export async function seedSampleData(world: WorldContext): Promise<void> {
  for (const seed of seeders) {
    await seed(world);
  }
}
