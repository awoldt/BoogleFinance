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

/**
 * POST /api/loadwatchlist?ticker=AAPL&ticker=TSLA
 * One `ticker` query param per symbol (none at all for an empty list).
 */
export async function loadWatchlist(
  symbols: string[],
  signal?: AbortSignal,
): Promise<void> {
  const params = new URLSearchParams();
  for (const symbol of symbols) params.append("ticker", symbol);

  const query = params.toString();
  const res = await fetch(
    `${API_ORIGIN}/api/loadwatchlist${query ? `?${query}` : ""}`,
    { method: "POST", signal },
  );
  if (!res.ok) throw new Error(`loadwatchlist failed (${res.status})`);
}
