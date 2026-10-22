import { API_ORIGIN } from "~/lib/search";

const STORAGE_KEY = "watchlist";

// The user's tickers live in localStorage as a JSON array, e.g. ["AAPL","TSLA"].
export function readSavedTickers(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const symbols = parsed.filter(
      (item): item is string => typeof item === "string" && item !== "",
    );
    return [...new Set(symbols)];
  } catch {
    // storage blocked or the value is corrupt
    return [];
  }
}

export function writeSavedTickers(symbols: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // storage blocked or full, the watchlist just won't persist
  }
}

// The price fields of a ticker (the server-side cache field `expires` is
// ignored).
export type PriceDetails = {
  price: number;
  change: number;
  changePercentage: number;
  timestamp: number; // epoch seconds of the last price update
};

// One entry of the /api/loadwatchlist response.
export type Quote = {
  name: string;
  symbol: string;
  priceDetails: PriceDetails;
};

/**
 * POST /api/loadwatchlist
 * Content-Type: application/json
 * {"tickers": ["AAPL", "TSLA"]}
 */
export async function loadWatchlist(
  symbols: string[],
  signal?: AbortSignal,
): Promise<Quote[]> {
  const res = await fetch(`${API_ORIGIN}/api/loadwatchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers: symbols }),
    signal,
  });
  if (!res.ok) throw new Error(`loadwatchlist failed (${res.status})`);

  const data: Quote[] | null = await res.json();
  return data ?? [];
}
