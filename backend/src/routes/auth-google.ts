import { Router, type IRouter } from "express";
import { google } from "googleapis";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";

const router: IRouter = Router() as IRouter;

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
router.get("/google", (req, res) => {
  const { role } = req.query as { role?: string };
  const client = getGoogleClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state: role || "editor", // pass role through state
  });
  res.redirect(url);
});

// Step 2: Google callback
router.get("/google/callback", async (req, res) => {
  const { code, state: role } = req.query as { code: string; state: string };
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  try {
    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: googleUser } = await oauth2.userinfo.get();

    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

    // Check if user already exists
    const [existing] = await db.select().from(usersTable)
      .where(eq(usersTable.email, googleUser.email)).limit(1);

    let user = existing;

    if (!user) {
      // New user — create account (role from state param)
      const validRole = (role === "creator" || role === "editor") ? role : "editor";
      const [created] = await db.insert(usersTable).values({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        passwordHash: "google-oauth", // no password for Google users
        role: validRole,
        inviteCode: validRole === "creator" ? generateInviteCode() : null,
        emailVerified: true, // Google already verified the email
        verificationToken: null,
      }).returning();
      user = created;
    } else {
      // Existing user — mark email as verified if not already
      if (!user.emailVerified) {
        await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
        user = { ...user, emailVerified: true };
      }
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role as "creator" | "editor" });

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/google/success?token=${token}&role=${user.role}`);
  } catch (err: any) {
    console.error("[google-auth] Error:", err?.message);
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
});

export default router;
