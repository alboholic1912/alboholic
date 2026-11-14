import "server-only";

/**
 * Instagram API with Instagram Login (graph.instagram.com). Needs a professional (Business or
 * Creator) account and a long-lived token with instagram_business_basic and
 * instagram_business_content_publish. POST requests carry the token in the body; GET requests
 * put it in the query string, as Meta documents.
 */
const GRAPH = "https://graph.instagram.com/v27.0";
const REFRESH = "https://graph.instagram.com/refresh_access_token";

interface GraphError {
  error?: { message?: string; error_user_msg?: string; error_user_title?: string; code?: number };
}

async function graph<T>(
  method: "GET" | "POST",
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const response =
    method === "GET"
      ? await fetch(`${GRAPH}${path}?${body}`, { cache: "no-store" })
      : await fetch(`${GRAPH}${path}`, { method: "POST", body, cache: "no-store" });

  const json = (await response.json().catch(() => ({}))) as T & GraphError;
  if (!response.ok || json.error) {
    const error = json.error;
    const message = error?.error_user_msg || error?.message || `Instagram returned ${response.status}.`;
    throw new Error(`Instagram: ${message}`);
  }
  return json;
}

export async function getProfile(token: string): Promise<{ igUserId: string; username: string }> {
  const me = await graph<{ id: string; user_id?: string; username?: string }>("GET", "/me", token, {
    fields: "id,user_id,username",
  });
  return { igUserId: me.user_id || me.id, username: me.username ?? "" };
}

/** Swaps a long-lived token for a fresh one valid for another 60 days. Works once it is a day old. */
export async function refreshToken(token: string): Promise<{ token: string; expiresAt: Date }> {
  const query = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
  const response = await fetch(`${REFRESH}?${query}`, { cache: "no-store" });
  const json = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number } & GraphError;
  if (!response.ok || !json.access_token) {
    throw new Error(`Instagram: ${json.error?.message ?? "could not refresh the token."}`);
  }
  return { token: json.access_token, expiresAt: new Date(Date.now() + (json.expires_in ?? 5184000) * 1000) };
}

export interface ContainerImage {
  url: string;
  tags: string[];
  alt: string;
}

/** Spreads tags across the image so their labels don't sit on top of each other. */
function userTags(tags: string[]): string | undefined {
  if (tags.length === 0) return undefined;
  return JSON.stringify(
    tags.map((username, i) => ({
      username,
      x: Number(((i + 1) / (tags.length + 1)).toFixed(3)),
      y: Number((0.3 + (0.4 * i) / Math.max(tags.length - 1, 1)).toFixed(3)),
    }))
  );
}

function imageParams(image: ContainerImage): Record<string, string> {
  const params: Record<string, string> = { image_url: image.url };
  const tags = userTags(image.tags);
  if (tags) params.user_tags = tags;
  if (image.alt.trim()) params.alt_text = image.alt.trim().slice(0, 1000);
  return params;
}

async function createContainer(token: string, igUserId: string, params: Record<string, string>): Promise<string> {
  const { id } = await graph<{ id: string }>("POST", `/${igUserId}/media`, token, params);
  return id;
}

/** Image containers are usually ready at once; this waits up to ~40 seconds. */
async function waitUntilReady(token: string, containerId: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const { status_code } = await graph<{ status_code?: string }>("GET", `/${containerId}`, token, {
      fields: "status_code",
    });
    if (status_code === "FINISHED" || status_code === undefined) return;
    if (status_code === "ERROR" || status_code === "EXPIRED") {
      throw new Error(`Instagram could not process an image (${status_code}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Instagram took too long to process the images. Try again in a few minutes.");
}

/** Publishes one image or a carousel and returns the new post's id and link. */
export async function publishMedia(
  token: string,
  igUserId: string,
  { images, caption, locationId }: { images: ContainerImage[]; caption: string; locationId: string }
): Promise<{ mediaId: string; permalink: string | null }> {
  if (images.length === 0) throw new Error("Add at least one image.");

  const shared: Record<string, string> = {};
  if (caption.trim()) shared.caption = caption;
  if (locationId.trim()) shared.location_id = locationId.trim();

  let containerId: string;
  if (images.length === 1) {
    containerId = await createContainer(token, igUserId, { ...imageParams(images[0]), ...shared });
  } else {
    const children: string[] = [];
    for (const image of images) {
      children.push(await createContainer(token, igUserId, { ...imageParams(image), is_carousel_item: "true" }));
    }
    for (const child of children) await waitUntilReady(token, child);
    containerId = await createContainer(token, igUserId, {
      media_type: "CAROUSEL",
      children: children.join(","),
      ...shared,
    });
  }

  await waitUntilReady(token, containerId);
  const { id: mediaId } = await graph<{ id: string }>("POST", `/${igUserId}/media_publish`, token, {
    creation_id: containerId,
  });

  let permalink: string | null = null;
  try {
    ({ permalink } = await graph<{ permalink: string }>("GET", `/${mediaId}`, token, { fields: "permalink" }));
  } catch (err) {
    // The post is live either way; the link is only a convenience.
    console.error("[instagram] could not read the permalink:", err);
  }
  return { mediaId, permalink };
}
