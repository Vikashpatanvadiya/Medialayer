import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db, usersTable, videosTable, notificationsTable, editorCreatorsTable } from "@workspace/db";import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { sendEmail } from "../lib/mailer.js";

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

  // Verify email is real using EasyEmailAPI (if API key is configured)
  const emailVerifyKey = process.env.EMAIL_VERIFY_API_KEY;
  if (emailVerifyKey) {
    try {
      const verifyRes = await fetch(
        `http://easyemailapi.com/api/verify/${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${emailVerifyKey}` } }
      );
      if (verifyRes.ok) {
        const result = await verifyRes.json() as any;
        if (!result.valid) {
          res.status(400).json({ error: "This email address is invalid. Please use a real email." });
          return;
        }
        if (result.disposable) {
          res.status(400).json({ error: "Disposable email addresses are not allowed." });
          return;
        }
        if (!result.valid_mx) {
          res.status(400).json({ error: "This email domain does not exist. Please use a valid email." });
          return;
        }
      }
    } catch {
      // If verification API fails, allow registration to proceed
    }
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "Email already registered" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString("hex");

  const [user] = await db
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      name,
      role,
      inviteCode: role === "creator" ? generateInviteCode() : null,
      emailVerified: false,
      verificationToken,
    })
    .returning();

  // Auto-link editor to creator if invite code was provided
  const inviteCodeParam = req.body.inviteCode as string | undefined;
  if (role === "editor" && inviteCodeParam) {
    const [creator] = await db.select().from(usersTable)
      .where(eq(usersTable.inviteCode, inviteCodeParam.trim().toUpperCase())).limit(1);
    if (creator) {
      await db.insert(editorCreatorsTable).values({ editorId: user.id, creatorId: creator.id }).onConflictDoNothing();
    }
  }

  // Send verification email (non-blocking — don't await)
  const verifyUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/verify-email?token=${verificationToken}`;
  sendEmail(email, "Verify your MediaLayer email", `
    <p>Hi ${name},</p>
    <p>Welcome to MediaLayer! Please verify your email address to activate your account.</p>
    <p><a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
    <p>Or copy this link: ${verifyUrl}</p>
  `).catch(() => {});

  res.status(201).json({ message: "Account created. Please check your email to verify your account." });
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query as { token: string };
  if (!token) { res.status(400).send("Invalid verification link"); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.verificationToken, token)).limit(1);
  if (!user) { res.status(400).send("Invalid or expired verification link"); return; }

  await db.update(usersTable)
    .set({ emailVerified: true, verificationToken: null })
    .where(eq(usersTable.id, user.id));

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  // Redirect to login with email pre-filled and a success flag
  res.redirect(`${frontendUrl}/login?verified=1&email=${encodeURIComponent(user.email)}`);
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) { res.status(200).json({ message: "If that email exists, a verification link has been sent." }); return; }
  if (user.emailVerified) { res.status(200).json({ message: "Email is already verified. You can log in." }); return; }

  const verificationToken = randomBytes(32).toString("hex");
  await db.update(usersTable).set({ verificationToken }).where(eq(usersTable.id, user.id));

  const verifyUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/verify-email?token=${verificationToken}`;
  sendEmail(email, "Verify your MediaLayer email", `
    <p>Hi ${user.name},</p>
    <p>Here is your new verification link for MediaLayer:</p>
    <p><a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
    <p>Or copy this link: ${verifyUrl}</p>
  `).catch(() => {});

  res.json({ message: "Verification email resent. Please check your inbox." });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

  if (!user.emailVerified) {
    res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role as "creator" | "editor" });
  res.json({ user: formatUser(user), token });
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) { res.status(404).json({ error: "No account found with this email" }); return; }
  if (user.emailVerified) { res.status(400).json({ error: "Email is already verified" }); return; }

  const verificationToken = randomBytes(32).toString("hex");
  await db.update(usersTable).set({ verificationToken }).where(eq(usersTable.id, user.id));

  const verifyUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/verify-email?token=${verificationToken}`;
  sendEmail(email, "Verify your MediaLayer email", `
    <p>Hi ${user.name},</p>
    <p>Here is your new verification link:</p>
    <p><a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
    <p>Or copy: ${verifyUrl}</p>
  `).catch(() => {});

  res.json({ message: "Verification email resent. Check your inbox." });
});

router.delete("/account", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  await db.delete(editorCreatorsTable).where(eq(editorCreatorsTable.editorId, userId));
  await db.delete(editorCreatorsTable).where(eq(editorCreatorsTable.creatorId, userId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ message: "Account deleted" });
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
