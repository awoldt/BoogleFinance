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

// What a visitor with no watchlist cookie sees, in ABC order. Real quotes are
// loaded for these like for any saved ticker, so the first page isn't empty.
// Pick well-known symbols: the Go server fails the whole list if one is unknown.
export const DEFAULT_TICKERS = [
  "AAPL",
  "AMZN",
  "DIS",
  "GOOGL",
  "JPM",
  "KO",
  "META",
  "MSFT",
  "NFLX",
  "NVDA",
  "TSLA",
  "V",
].sort();

// the cookie's symbols, or null when the visitor has never saved a watchlist
// (no cookie, or a corrupt one)
async function readCookie(request: Request): Promise<string[] | null> {
  try {
    const value = await watchlistCookie.parse(request.headers.get("Cookie"));
    if (value !== null && value !== undefined) return cleanTickers(value);
  } catch {
    // the value is corrupt
  }
  return null;
}

/** The visitor's saved symbols. Empty when they have none. */
export async function readSavedTickers(request: Request): Promise<string[]> {
  return (await readCookie(request)) ?? [];
}

/**
 * The symbols the home page shows quotes for. A visitor who never saved a
 * watchlist gets the default list as a showcase (`showcase` is true); it is
 * not saved. A cookie holding an empty list means they removed everything on
 * purpose, so that stays empty.
 */
export async function readHomeTickers(
  request: Request,
): Promise<{ tickers: string[]; showcase: boolean }> {
  const saved = await readCookie(request);
  return saved === null
    ? { tickers: DEFAULT_TICKERS, showcase: true }
    : { tickers: saved, showcase: false };
}

/** The Set-Cookie header value that saves these symbols. */
export function serializeSavedTickers(symbols: string[]): Promise<string> {
  return watchlistCookie.serialize(cleanTickers(symbols));
}
