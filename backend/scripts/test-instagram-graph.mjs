/**
 * Exercises the Instagram publish sequence against a stub Graph API:
 * container → poll (IN_PROGRESS ×2 → FINISHED) → publish → permalink,
 * plus the error translations that matter (expired token, bad format).
 */
import { createServer } from "node:http";

process.env.META_GRAPH_BASE = "http://127.0.0.1:3222";
process.env.META_APP_ID = "app123";
process.env.META_APP_SECRET = "secret123";
process.env.INSTAGRAM_REDIRECT_URI = "https://medialayer.app/api/integrations/instagram/callback";

const calls = [];
let statusPolls = 0;

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:3222");
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    calls.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: body ? JSON.parse(body) : null });
    res.setHeader("Content-Type", "application/json");

    // Container creation
    if (req.method === "POST" && url.pathname.endsWith("/media")) {
      const parsed = JSON.parse(body);
      if (parsed.access_token === "expired-token") {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: { message: "Error validating access token: Session has expired", code: 190, error_subcode: 463 } }));
      }
      if (parsed.video_url?.includes("badformat")) {
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

    // Publish
    if (req.method === "POST" && url.pathname.endsWith("/media_publish")) {
      return res.end(JSON.stringify({ id: "media_999" }));
    }

    // Permalink
    if (req.method === "GET" && url.searchParams.get("fields") === "permalink") {
      return res.end(JSON.stringify({ permalink: "https://www.instagram.com/reel/ABC123/" }));
    }

    // Pages discovery
    if (req.method === "GET" && url.pathname.endsWith("/me/accounts")) {
      return res.end(JSON.stringify({
        data: [
          { id: "page_1", name: "No IG Page", access_token: "page_token_1" },
          { id: "page_2", name: "Studio Page", access_token: "page_token_2",
            instagram_business_account: { id: "ig_42", username: "medialayer", profile_picture_url: "https://cdn/pic.jpg" } },
        ],
      }));
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: { message: `no stub for ${req.method} ${url.pathname}`, code: 803 } }));
  });
});

await new Promise((r) => server.listen(3222, r));

const ig = await import(new URL("../src/lib/instagram.ts", import.meta.url).href);

let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "  ✓" : "  ✗"} ${name}${cond ? "" : ` — ${detail}`}`);
  if (!cond) failures += 1;
};

console.log("Account discovery");
const { accounts, pageNames } = await ig.discoverInstagramAccounts("user_token");
check("only Pages with an IG account are returned", accounts.length === 1, `got ${accounts.length}`);
check("maps IG id/username/page token", accounts[0].instagramId === "ig_42" && accounts[0].username === "medialayer" && accounts[0].pageAccessToken === "page_token_2");
check("reports every Page Facebook returned", pageNames.includes("Studio Page") && pageNames.includes("No IG Page"));

console.log("\nReel publish (happy path)");
const containerId = await ig.createMediaContainer({
  instagramUserId: "ig_42", accessToken: "page_token_2",
  videoUrl: "https://cdn/video.mp4", caption: "Ship it #medialayer", coverUrl: "https://cdn/cover.jpg", postType: "REELS",
});
check("container created", containerId === "container_777", containerId);
const createCall = calls.find((c) => c.method === "POST" && c.path.endsWith("/media"));
check("media_type is REELS", createCall.body.media_type === "REELS");
check("REELS does not share to feed", createCall.body.share_to_feed === false);
check("cover_url passed through", createCall.body.cover_url === "https://cdn/cover.jpg");

await ig.waitForContainer(containerId, "page_token_2", { intervalMs: 10 });
check("polled until FINISHED", statusPolls === 3, `polls=${statusPolls}`);

const mediaId = await ig.publishContainer({ instagramUserId: "ig_42", containerId, accessToken: "page_token_2" });
check("published container", mediaId === "media_999", mediaId);
const publishCall = calls.find((c) => c.path.endsWith("/media_publish"));
check("creation_id sent", publishCall.body.creation_id === "container_777");

const permalink = await ig.getMediaPermalink(mediaId, "page_token_2");
check("permalink fetched", permalink === "https://www.instagram.com/reel/ABC123/", String(permalink));

console.log("\nFeed post");
await ig.createMediaContainer({
  instagramUserId: "ig_42", accessToken: "page_token_2",
  videoUrl: "https://cdn/video.mp4", caption: "", postType: "FEED",
});
const feedCall = calls.filter((c) => c.method === "POST" && c.path.endsWith("/media")).pop();
check("FEED shares to the profile feed", feedCall.body.share_to_feed === true);
check("no cover_url when not provided", !("cover_url" in feedCall.body));

console.log("\nError translation");
try {
  await ig.createMediaContainer({ instagramUserId: "ig_42", accessToken: "expired-token", videoUrl: "https://cdn/v.mp4", caption: "", postType: "REELS" });
  check("expired token throws", false, "no throw");
} catch (err) {
  check("expired token → reconnect message", /reconnect your Instagram account/i.test(err.message), err.message);
  check("expired token flagged needsReconnect", err.needsReconnect === true);
}
try {
  await ig.createMediaContainer({ instagramUserId: "ig_42", accessToken: "page_token_2", videoUrl: "https://cdn/badformat.mp4", caption: "", postType: "REELS" });
  check("bad format throws", false, "no throw");
} catch (err) {
  check("bad format → actionable message", /MP4\/MOV/.test(err.message), err.message);
  check("bad format not flagged as reconnect", err.needsReconnect === false);
}

console.log("\nOAuth URL");
const authUrl = ig.getInstagramAuthUrl("state123");
check("uses the Facebook OAuth dialog", authUrl.startsWith("https://www.facebook.com/v21.0/dialog/oauth"));
check("requests page + instagram scopes", new URL(authUrl).searchParams.get("scope") === "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management");
check("rerequests permissions so Page picker appears", new URL(authUrl).searchParams.get("auth_type") === "rerequest");
check("carries the signed state", new URL(authUrl).searchParams.get("state") === "state123");
check("asks for an auth code", new URL(authUrl).searchParams.get("response_type") === "code");

// Facebook Login for Business apps use a dashboard configuration instead.
process.env.META_LOGIN_CONFIG_ID = "cfg_9876";
const businessUrl = ig.getInstagramAuthUrl("state123");
check("business login sends config_id", new URL(businessUrl).searchParams.get("config_id") === "cfg_9876");
check("business login omits scope", !new URL(businessUrl).searchParams.has("scope"));
delete process.env.META_LOGIN_CONFIG_ID;

server.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
