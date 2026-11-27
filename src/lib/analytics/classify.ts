/**
 * Turns the raw details of a page view (browser name, referring address, campaign tags) into
 * the plain labels the Analytics page groups by. Nothing here identifies a person.
 */

/** Crawlers, link previews and uptime checkers. Their visits are dropped, not counted. */
const BOT =
  /bot|crawl|spider|slurp|archiver|preview|facebookexternalhit|meta-externalagent|embedly|whatsapp\/|telegram|discord|skype|headless|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl\/|wget|python|httpclient|axios|node-fetch|undici|go-http|java\/|okhttp|scrapy|vercel/i;

export function isBot(userAgent: string): boolean {
  return userAgent.trim() === "" || BOT.test(userAgent);
}

export interface DeviceInfo {
  device: "Mobile" | "Tablet" | "Desktop";
  browser: string;
  os: string;
}

/**
 * Device type, browser and system from the browser's user-agent string. iPads ask for the
 * desktop site and say they are Macs, so `touch` (the page saw a touch screen) tells them apart.
 */
export function parseUserAgent(userAgent: string, touch: boolean): DeviceInfo {
  const ua = userAgent;
  const iPadAsMac = /Macintosh/.test(ua) && touch;

  let os = "Other";
  if (/iPhone|iPod/.test(ua)) os = "iOS";
  else if (/iPad/.test(ua) || iPadAsMac) os = "iPadOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let device: DeviceInfo["device"] = "Desktop";
  if (/iPad|Tablet|PlayBook|Silk/.test(ua) || iPadAsMac || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    device = "Tablet";
  } else if (/Mobi|iPhone|iPod|Android|Windows Phone/.test(ua)) {
    device = "Mobile";
  }

  // In-app browsers first: they also call themselves Safari or Chrome.
  let browser = "Other";
  if (/Instagram/.test(ua)) browser = "Instagram app";
  else if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) browser = "Facebook app";
  else if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) browser = "TikTok app";
  else if (/Snapchat/.test(ua)) browser = "Snapchat app";
  else if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera|OPT\//.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung Internet";
  else if (/Firefox|FxiOS/.test(ua)) browser = "Firefox";
  else if (/Chrome|CriOS|Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua)) browser = "Safari";

  return { device, browser, os };
}

/** Referring sites we know, matched on the end of the host name. */
const KNOWN_SITES: { name: string; hosts: RegExp }[] = [
  { name: "Instagram", hosts: /(^|\.)instagram\.com$/ },
  { name: "Facebook", hosts: /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/ },
  { name: "Google", hosts: /(^|\.)google\.[a-z.]+$|^googleapis\.com$|(^|\.)googlequicksearchbox/ },
  { name: "Bing", hosts: /(^|\.)bing\.com$/ },
  { name: "DuckDuckGo", hosts: /(^|\.)duckduckgo\.com$/ },
  { name: "Yahoo", hosts: /(^|\.)yahoo\.[a-z.]+$/ },
  { name: "Yandex", hosts: /(^|\.)yandex\.[a-z.]+$/ },
  { name: "Ecosia", hosts: /(^|\.)ecosia\.org$/ },
  { name: "Brave Search", hosts: /^search\.brave\.com$/ },
  { name: "X (Twitter)", hosts: /(^|\.)(twitter\.com|x\.com|t\.co)$/ },
  { name: "TikTok", hosts: /(^|\.)tiktok\.com$/ },
  { name: "YouTube", hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { name: "Reddit", hosts: /(^|\.)reddit\.com$/ },
  { name: "WhatsApp", hosts: /(^|\.)(whatsapp\.com|wa\.me)$/ },
  { name: "Telegram", hosts: /(^|\.)(t\.me|telegram\.org)$/ },
  { name: "LinkedIn", hosts: /(^|\.)(linkedin\.com|lnkd\.in)$/ },
  { name: "Pinterest", hosts: /(^|\.)pinterest\.[a-z.]+$/ },
  { name: "Wikipedia", hosts: /(^|\.)wikipedia\.org$/ },
  { name: "ChatGPT", hosts: /(^|\.)(chatgpt\.com|openai\.com)$/ },
  { name: "Perplexity", hosts: /(^|\.)perplexity\.ai$/ },
  { name: "Claude", hosts: /(^|\.)claude\.ai$/ },
];

/** Short campaign tags people use in links, e.g. ?ref=ig or ?utm_source=instagram. */
const TAG_NAMES: Record<string, string> = {
  ig: "Instagram",
  insta: "Instagram",
  instagram: "Instagram",
  fb: "Facebook",
  facebook: "Facebook",
  tiktok: "TikTok",
  tt: "TikTok",
  x: "X (Twitter)",
  twitter: "X (Twitter)",
  wa: "WhatsApp",
  whatsapp: "WhatsApp",
  yt: "YouTube",
  youtube: "YouTube",
  google: "Google",
  newsletter: "Newsletter",
  email: "Newsletter",
};

function hostOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/**
 * Where a reader came from. A campaign tag in the link wins, then the app the page was
 * opened in (Instagram's own browser sends no referring address), then the referring site.
 * Our own address as the referrer means a click within the site, not a new arrival.
 */
export function classifySource(input: {
  referrer: string;
  userAgent: string;
  tag: string | null;
  ownHost: string | null;
}): { source: string; referrerHost: string | null } {
  const referrerHost = hostOf(input.referrer);
  const ownHost = input.ownHost?.toLowerCase().replace(/^www\./, "") ?? null;
  const external = referrerHost && referrerHost !== ownHost ? referrerHost : null;

  const tag = input.tag?.trim().toLowerCase();
  if (tag) {
    const named = TAG_NAMES[tag];
    if (named) return { source: named, referrerHost: external };
    return { source: tag.charAt(0).toUpperCase() + tag.slice(1, 40), referrerHost: external };
  }

  if (/Instagram/.test(input.userAgent)) return { source: "Instagram", referrerHost: external };
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(input.userAgent)) return { source: "Facebook", referrerHost: external };
  if (/musical_ly|BytedanceWebview/i.test(input.userAgent)) return { source: "TikTok", referrerHost: external };

  if (referrerHost && referrerHost === ownHost) return { source: "Internal", referrerHost: null };
  if (!external) return { source: "Direct", referrerHost: null };

  const known = KNOWN_SITES.find((site) => site.hosts.test(external));
  return { source: known ? known.name : external, referrerHost: external };
}
