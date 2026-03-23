import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const editorCreatorsTable = pgTable("editor_creators", {
  id: uuid("id").primaryKey().defaultRandom(),
  editorId: uuid("editor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
}, (t) => [
  unique("editor_creator_unique").on(t.editorId, t.creatorId),
]);

export type EditorCreator = typeof editorCreatorsTable.$inferSelect;
