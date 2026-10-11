import { API_ORIGIN } from "~/lib/search";

// The whole watchlist lives in one cookie as comma separated symbols,
// e.g. watchlist=AAPL,TSLA,F
const COOKIE_NAME = "watchlist";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readWatchlistCookie(): string[] {
  if (typeof document === "undefined") return [];

  const entry = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return [];

  const value = decodeURIComponent(entry.slice(COOKIE_NAME.length + 1));
  const symbols = value
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean);
  return [...new Set(symbols)];
}

export function writeWatchlistCookie(symbols: string[]) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  // commas are legal in cookie values, so keep them raw to stay comma separated
  document.cookie = `${COOKIE_NAME}=${symbols.join(",")}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}

/**
 * Pings the server once on app load. No params: the server reads the
 * `watchlist` cookie off the request itself. `credentials: "include"` makes
 * the browser attach cookies even when the API is on another origin.
 */
export async function loadWatchlist(signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${API_ORIGIN}/api/loadwatchlist`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error(`loadwatchlist failed (${res.status})`);
}
