import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hunters = sqliteTable("hunters", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  version: integer("version").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
