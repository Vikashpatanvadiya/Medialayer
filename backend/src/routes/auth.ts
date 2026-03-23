import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase() +
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    inviteCode: user.inviteCode ?? undefined,
    createdAt: user.createdAt,
  };
}

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { email, password, name, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Email already registered" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, role, inviteCode: role === "creator" ? generateInviteCode() : null })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, role: user.role as "creator" | "editor" });
  res.status(201).json({ user: formatUser(user), token });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const token = signToken({ userId: user.id, email: user.email, role: user.role as "creator" | "editor" });
  res.json({ user: formatUser(user), token });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

export default router;
