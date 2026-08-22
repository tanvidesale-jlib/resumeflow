import { jsonb, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type ResumePayload = Record<string, unknown>;

export const resumesTable = pgTable("resumes", {
  id: integer("id").primaryKey(),
  data: jsonb("data").$type<ResumePayload>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userResumesTable = pgTable("user_resumes", {
  userId: text("user_id").primaryKey(),
  data: jsonb("data").$type<ResumePayload>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});