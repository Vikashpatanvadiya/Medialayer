import { Router, type IRouter } from "express";
import type { RequestHandler } from "express";
import { google } from "googleapis";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";

const router: IRouter = Router();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase() +
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getGoogleClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/google/callback`
  );
}

// Step 1: redirect to Google
const googleAuth: RequestHandler = (req, res) => {
  const { role } = req.query as { role?: string };
  const client = getGoogleClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
    state: role || "editor",
  });
  res.redirect(url);
};

// Step 2: Google callback
const googleCallback: RequestHandler = async (req, res) => {
  const { code, state: role } = req.query as { code: string; state: string };
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!code) {
    res.redirect(`${frontendUrl}/login?error=google_failed`);
    return;
  }

  try {
    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email) {
      res.redirect(`${frontendUrl}/login?error=no_email`);
      return;
    }

    const [existing] = await db.select().from(usersTable)
      .where(eq(usersTable.email, googleUser.email)).limit(1);

    const validRole = (role === "creator" || role === "editor") ? role : "editor";
    let user = existing;

    if (!user) {
      // New user — create with the requested role
      const [created] = await db.insert(usersTable).values({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        passwordHash: "google-oauth",
        role: validRole,
        inviteCode: validRole === "creator" ? generateInviteCode() : null,
        emailVerified: true,
        verificationToken: null,
      }).returning();
      user = created;
    } else {
      // Existing user — if they explicitly chose a different role (e.g. upgrading
      // from editor to creator via the "Join as Creator" button), update it.
      // This handles the case where someone signed up as editor first and later
      // wants a creator account.
      const updates: Record<string, any> = {};
      if (!user.emailVerified) updates.emailVerified = true;
      if (user.role !== validRole) {
        updates.role = validRole;
        // Ensure creators always have an invite code
        if (validRole === "creator" && !user.inviteCode) {
          updates.inviteCode = generateInviteCode();
        }
      }
      if (Object.keys(updates).length > 0) {
        await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
        user = { ...user, ...updates };
      }
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role as "creator" | "editor" });
    res.redirect(`${frontendUrl}/auth/google/success?token=${token}&role=${user.role}`);
  } catch (err: any) {
    console.error("[google-auth] Error:", err?.message);
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
};

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
