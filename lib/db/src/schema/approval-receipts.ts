import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { videosTable } from "./videos";
import { usersTable } from "./users";

export const approvalReceiptsTable = pgTable("approval_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videosTable.id),
  approverId: uuid("approver_id").notNull().references(() => usersTable.id),
  version: integer("version").notNull(),
  txSignature: text("tx_signature"),
  videoHash: text("video_hash").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "failed"] }).notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApprovalReceipt = typeof approvalReceiptsTable.$inferSelect;
