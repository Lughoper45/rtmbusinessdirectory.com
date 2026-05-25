/** Publish listing posts to Meta, LinkedIn, and X when secrets are configured. */

export type SocialPublishInput = {
  facebook?: string;
  linkedin?: string;
  x?: string;
  profileUrl: string;
  imageUrl?: string;
};

export type SocialPublishResult = Record<string, string>;

export async function publishToSocialChannels(
  channels: string[],
  payload: SocialPublishInput,
  fallbackText: (channel: string) => string,
): Promise<SocialPublishResult> {
  const published: SocialPublishResult = {};

  for (const ch of channels) {
    const text = (payload as Record<string, string>)[ch] || fallbackText(ch);
    published[ch] = `dry-run:${ch}:${text.slice(0, 48)}…`;
  }

  const metaToken = Deno.env.get("META_PAGE_ACCESS_TOKEN");
  const metaPageId = Deno.env.get("META_PAGE_ID");
  if (metaToken && metaPageId && channels.includes("facebook")) {
    try {
      const message = payload.facebook || payload.linkedin || fallbackText("facebook");
      const link = payload.profileUrl;
      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, link, access_token: metaToken }),
      });
      const json = await res.json();
      published.facebook = json.id
        ? `https://www.facebook.com/${json.id}`
        : `meta-error:${JSON.stringify(json)}`;
    } catch (e) {
      published.facebook = `meta-error:${e instanceof Error ? e.message : "failed"}`;
    }
  }

  const linkedInToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  const linkedInOrgUrn = Deno.env.get("LINKEDIN_ORGANIZATION_URN");
  if (linkedInToken && linkedInOrgUrn && channels.includes("linkedin")) {
    try {
      const text = payload.linkedin || fallbackText("linkedin");
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${linkedInToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: linkedInOrgUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text },
              shareMediaCategory: "ARTICLE",
              media: [
                {
                  status: "READY",
                  originalUrl: payload.profileUrl,
                },
              ],
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      const json = await res.json();
      published.linkedin = json.id
        ? `https://www.linkedin.com/feed/update/${encodeURIComponent(json.id)}`
        : `linkedin-error:${JSON.stringify(json)}`;
    } catch (e) {
      published.linkedin = `linkedin-error:${e instanceof Error ? e.message : "failed"}`;
    }
  }

  const xToken = Deno.env.get("X_API_BEARER_TOKEN");
  if (xToken && channels.includes("x")) {
    try {
      let text = payload.x || fallbackText("x");
      if (text.length > 280) text = `${text.slice(0, 277)}…`;
      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${xToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      const tweetId = json?.data?.id;
      published.x = tweetId
        ? `https://twitter.com/i/web/status/${tweetId}`
        : `x-error:${JSON.stringify(json)}`;
    } catch (e) {
      published.x = `x-error:${e instanceof Error ? e.message : "failed"}`;
    }
  }

  return published;
}
