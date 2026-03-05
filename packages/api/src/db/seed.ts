import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@cyh/shared/db";

const DEFAULT_CATEGORIES = [
  { name: "Indoor", slug: "indoor", icon: "🏠", color: "#6366f1", sortOrder: 1 },
  { name: "Outdoor", slug: "outdoor", icon: "🌳", color: "#22c55e", sortOrder: 2 },
  { name: "Youth", slug: "youth", icon: "👦", color: "#f59e0b", sortOrder: 3 },
  { name: "Adult", slug: "adult", icon: "👤", color: "#3b82f6", sortOrder: 4 },
  { name: "Family", slug: "family", icon: "👨‍👩‍👧‍👦", color: "#ec4899", sortOrder: 5 },
  { name: "Veteran", slug: "veteran", icon: "🎖️", color: "#14532d", sortOrder: 6 },
  { name: "Pride / LGBTQ+", slug: "pride", icon: "🏳️‍🌈", color: "#a855f7", sortOrder: 7 },
  { name: "Arts & Culture", slug: "arts", icon: "🎨", color: "#e11d48", sortOrder: 8 },
  { name: "Sports & Fitness", slug: "sports", icon: "⚽", color: "#0ea5e9", sortOrder: 9 },
  { name: "Education", slug: "education", icon: "📚", color: "#0d9488", sortOrder: 10 },
  { name: "Food & Drink", slug: "food", icon: "🍽️", color: "#d97706", sortOrder: 11 },
  { name: "Music & Entertainment", slug: "music", icon: "🎵", color: "#7c3aed", sortOrder: 12 },
  { name: "Fundraiser", slug: "fundraiser", icon: "💰", color: "#059669", sortOrder: 13 },
  { name: "Volunteer", slug: "volunteer", icon: "🤝", color: "#2563eb", sortOrder: 14 },
  { name: "Government & Civic", slug: "government", icon: "🏛️", color: "#64748b", sortOrder: 15 },
];

async function seed() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding categories...");

  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoNothing({ target: schema.categories.slug });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
  await sql.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
