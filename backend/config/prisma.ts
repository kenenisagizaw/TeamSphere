import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
