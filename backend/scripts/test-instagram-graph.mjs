/**
 * Exercises the Instagram Business Login flow against a stub Instagram API:
 * authorize URL → code exchange → long-lived token → profile →
 * container → poll (IN_PROGRESS ×2 → FINISHED) → publish → permalink,
 * plus the error translations that matter.
 *
 *   pnpm --filter @workspace/api-server test:instagram
 */
import { createServer } from "node:http";

const PORT = 3222;
process.env.INSTAGRAM_OAUTH_HOST = `http://127.0.0.1:${PORT}`;
process.env.INSTAGRAM_GRAPH_HOST = `http://127.0.0.1:${PORT}`;
process.env.INSTAGRAM_CLIENT_ID = "ig_app_123";
process.env.INSTAGRAM_CLIENT_SECRET = "ig_secret_456";
process.env.INSTAGRAM_REDIRECT_URI = "https://example.ngrok-free.app/api/integrations/instagram/callback";

const calls = [];
let statusPolls = 0;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    calls.push({
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      contentType: req.headers["content-type"] ?? null,
      body: body || null,
    });
    res.setHeader("Content-Type", "application/json");

    // Code → short-lived token (form-encoded POST to api.instagram.com)
    if (req.method === "POST" && url.pathname === "/oauth/access_token") {
      const form = new URLSearchParams(body);
      if (form.get("code") === "bad-code") {
        res.statusCode = 400;
        return res.end(
          JSON.stringify({ error_type: "OAuthException", code: 400, error_message: "Invalid authorization code" }),
        );
      }
      return res.end(JSON.stringify({ access_token: "short_token", user_id: 178414, permissions: ["instagram_business_basic"] }));
    }

    // Short-lived → long-lived
    if (req.method === "GET" && url.pathname === "/access_token") {
      return res.end(JSON.stringify({ access_token: "long_token", token_type: "bearer", expires_in: 5183944 }));
    }

    // Long-lived refresh
    if (req.method === "GET" && url.pathname === "/refresh_access_token") {
      return res.end(JSON.stringify({ access_token: "refreshed_token", expires_in: 5183944 }));
    }

    // Profile
    if (req.method === "GET" && url.pathname.endsWith("/me")) {
      if (url.searchParams.get("access_token") === "expired-token") {
        res.statusCode = 400;
        return res.end(
          JSON.stringify({ error: { message: "Session has expired", code: 190, type: "OAuthException" } }),
        );
      }
      return res.end(
        JSON.stringify({ user_id: "178414", username: "medialayer", account_type: "BUSINESS", profile_picture_url: "https://cdn/pic.jpg" }),
      );
    }

    // Container creation
    if (req.method === "POST" && url.pathname.endsWith("/media")) {
      const parsed = JSON.parse(body);
      if (parsed.access_token === "expired-token") {
        res.statusCode = 400;
        return res.end(
          JSON.stringify({ error: { message: "Session has expired", code: 190, error_subcode: 463 } }),
        );
      }
      if (String(parsed.video_url).includes("badformat")) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: { message: "Unsupported format", code: 100, error_subcode: 2207026 } }));
      }
      return res.end(JSON.stringify({ id: "container_777" }));
    }

    // Container status polling
    if (req.method === "GET" && url.searchParams.get("fields") === "status_code,status") {
      statusPolls += 1;
      const status_code = statusPolls >= 3 ? "FINISHED" : "IN_PROGRESS";
      return res.end(JSON.stringify({ status_code, status: `${status_code}: fake` }));
    }

    if (req.method === "POST" && url.pathname.endsWith("/media_publish")) {
      return res.end(JSON.stringify({ id: "media_999" }));
    }

    if (req.method === "GET" && url.searchParams.get("fields") === "permalink") {
      return res.end(JSON.stringify({ permalink: "https://www.instagram.com/reel/ABC123/" }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: { message: `no stub for ${req.method} ${url.pathname}`, code: 803 } }));
  });
});

await new Promise((r) => server.listen(PORT, r));

const ig = await import(new URL("../src/lib/instagram.ts", import.meta.url).href);

let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "  ✓" : "  ✗"} ${name}${cond ? "" : ` — ${detail}`}`);
  if (!cond) failures += 1;
};

console.log("Authorization URL (Instagram Login, not Facebook)");
const authUrl = new URL(ig.getInstagramAuthUrl("state123"));
check("points at instagram.com/oauth/authorize", authUrl.origin + authUrl.pathname === "https://www.instagram.com/oauth/authorize", authUrl.href);
check("no facebook.com anywhere", !authUrl.href.includes("facebook.com"));
check("requests the two business scopes", authUrl.searchParams.get("scope") === "instagram_business_basic,instagram_business_content_publish", String(authUrl.searchParams.get("scope")));
check("carries state", authUrl.searchParams.get("state") === "state123");
check("asks for a code", authUrl.searchParams.get("response_type") === "code");

console.log("\nRedirect URI validation");
check("rejects http", /HTTPS/.test(String(ig.validateRedirectUri("http://localhost:3000/api/integrations/instagram/callback"))));
check("rejects doubled scheme", ig.validateRedirectUri("https://https://x.onrender.com/api/integrations/instagram/callback") !== null);
check("rejects wrong path", ig.validateRedirectUri("https://x.onrender.com/callback") !== null);
check("accepts a valid tunnel URI", ig.validateRedirectUri("https://abc.ngrok-free.app/api/integrations/instagram/callback") === null);

console.log("\nToken exchange");
const short = await ig.exchangeCodeForToken("auth_code_1");
check("returns token + instagram user id", short.accessToken === "short_token" && short.instagramId === "178414", JSON.stringify(short));
const tokenCall = calls.find((c) => c.path === "/oauth/access_token");
check("posts form-encoded", tokenCall.contentType?.includes("application/x-www-form-urlencoded"));
check("sends grant_type=authorization_code", new URLSearchParams(tokenCall.body).get("grant_type") === "authorization_code");
check("sends the redirect_uri", new URLSearchParams(tokenCall.body).get("redirect_uri") === process.env.INSTAGRAM_REDIRECT_URI);

const long = await ig.exchangeForLongLivedToken("short_token");
check("upgrades to a long-lived token", long.token === "long_token");
check("records an expiry ~60 days out", long.expiresAt && long.expiresAt > new Date(Date.now() + 59 * 864e5));
const refreshed = await ig.refreshLongLivedToken("long_token");
check("can refresh a long-lived token", refreshed.token === "refreshed_token");

console.log("\nProfile");
const profile = await ig.getInstagramProfile("long_token");
check("reads username and account type", profile.username === "medialayer" && profile.accountType === "BUSINESS");
check("no Facebook Page involved", !JSON.stringify(profile).toLowerCase().includes("page"));

console.log("\nReel publish (happy path)");
const containerId = await ig.createMediaContainer({
  instagramUserId: "178414", accessToken: "long_token",
  mediaUrl: "https://cdn/video.mp4", caption: "Ship it #medialayer", coverUrl: "https://cdn/cover.jpg", postType: "REELS",
});
check("container created", containerId === "container_777", containerId);
const createCall = calls.find((c) => c.method === "POST" && c.path.endsWith("/media"));
check("media_type is REELS", JSON.parse(createCall.body).media_type === "REELS");
check("REELS does not share to feed", JSON.parse(createCall.body).share_to_feed === false);
check("cover_url passed through", JSON.parse(createCall.body).cover_url === "https://cdn/cover.jpg");

await ig.waitForContainer(containerId, "long_token", { intervalMs: 10 });
check("polled until FINISHED", statusPolls === 3, `polls=${statusPolls}`);

const mediaId = await ig.publishContainer({ instagramUserId: "178414", containerId, accessToken: "long_token" });
check("published container", mediaId === "media_999", mediaId);
check("creation_id sent", JSON.parse(calls.find((c) => c.path.endsWith("/media_publish")).body).creation_id === "container_777");
check("permalink fetched", (await ig.getMediaPermalink(mediaId, "long_token")) === "https://www.instagram.com/reel/ABC123/");

console.log("\nFeed post and images");
await ig.createMediaContainer({ instagramUserId: "178414", accessToken: "long_token", mediaUrl: "https://cdn/v.mp4", caption: "", postType: "FEED" });
const feedCall = calls.filter((c) => c.method === "POST" && c.path.endsWith("/media")).pop();
check("FEED shares to the profile feed", JSON.parse(feedCall.body).share_to_feed === true);
check("no cover_url when not provided", !("cover_url" in JSON.parse(feedCall.body)));

await ig.createMediaContainer({ instagramUserId: "178414", accessToken: "long_token", mediaUrl: "https://cdn/pic.jpg", caption: "hi", postType: "FEED", isImage: true });
const imageCall = calls.filter((c) => c.method === "POST" && c.path.endsWith("/media")).pop();
check("image container uses image_url", JSON.parse(imageCall.body).image_url === "https://cdn/pic.jpg");
check("image container has no media_type REELS", !JSON.parse(imageCall.body).media_type);

console.log("\nError translation");
try {
  await ig.exchangeCodeForToken("bad-code");
  check("bad code throws", false, "no throw");
} catch (err) {
  check("bad code surfaces an error", err instanceof ig.InstagramApiError, err.message);
}
try {
  await ig.getInstagramProfile("expired-token");
  check("expired token throws", false, "no throw");
} catch (err) {
  check("expired token → reconnect message", /reconnect your Instagram account/i.test(err.message), err.message);
  check("expired token flagged needsReconnect", err.needsReconnect === true);
}
try {
  await ig.createMediaContainer({ instagramUserId: "178414", accessToken: "long_token", mediaUrl: "https://cdn/badformat.mp4", caption: "", postType: "REELS" });
  check("bad format throws", false, "no throw");
} catch (err) {
  check("bad format → actionable message", /MP4\/MOV/.test(err.message), err.message);
  check("bad format not flagged as reconnect", err.needsReconnect === false);
}

console.log("\nNo Facebook endpoints were called");
const fbCalls = calls.filter((c) => JSON.stringify(c).includes("facebook"));
check("zero graph.facebook.com calls", fbCalls.length === 0, JSON.stringify(fbCalls));

server.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
