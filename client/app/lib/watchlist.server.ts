import { createCookie } from "react-router";

// The user's tickers live in a cookie so the server can load the watchlist
// before rendering the page. createCookie stores them as encoded JSON, e.g.
// ["AAPL","TSLA"].
const watchlistCookie = createCookie("watchlist", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 400, // the longest browsers keep a cookie
});

// keeps the cookie well under the 4KB browsers allow
const MAX_TICKERS = 100;
const MAX_SYMBOL_LENGTH = 20;

/** Unique, non-empty symbols, in the order given. Anything else is dropped. */
export function cleanTickers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const symbols = value.filter(
    (item): item is string =>
      typeof item === "string" && item !== "" && item.length <= MAX_SYMBOL_LENGTH,
  );
  return [...new Set(symbols)].slice(0, MAX_TICKERS);
}

export async function readSavedTickers(request: Request): Promise<string[]> {
  try {
    return cleanTickers(await watchlistCookie.parse(request.headers.get("Cookie")));
  } catch {
    // the value is corrupt
    return [];
  }
}

/** The Set-Cookie header value that saves these symbols. */
export function serializeSavedTickers(symbols: string[]): Promise<string> {
  return watchlistCookie.serialize(cleanTickers(symbols));
}
