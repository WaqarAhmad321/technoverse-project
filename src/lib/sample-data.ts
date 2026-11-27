import "server-only";

type Seeder = (userId: string) => Promise<void>;

// One seeder per line. Each fills its own slice's tables for one new account.
const seeders: Seeder[] = [
];

export async function seedSampleData(userId: string): Promise<void> {
  for (const seed of seeders) {
    await seed(userId);
  }
}
