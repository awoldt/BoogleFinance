// Calls to the Go server. Only loaders and actions use this, so the browser
// never talks to the Go server directly.

import type { SearchResult } from "~/lib/search";
import type { Quote } from "~/lib/watchlist";

// Origin of the Go server, e.g. https://my-server.up.railway.app (no /api),
// read at runtime. VITE_API_URL is what the SPA build used, still honored so
// an existing deploy keeps working. Trailing slashes are stripped so a
// copy/pasted "https://host/" doesn't produce "//api/...".
const API_ORIGIN = (
  process.env.API_URL ??
  process.env.VITE_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

export class TickerNotFoundError extends Error {}

/** POST /api/search?ticker=AAPL */
export async function searchTickers(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const res = await fetch(
    `${API_ORIGIN}/api/search?ticker=${encodeURIComponent(query)}`,
    { method: "POST", signal },
  );
  if (!res.ok) throw new Error(`search failed (${res.status})`);

  const data: SearchResult[] | null = await res.json();
  return data ?? [];
}

/**
 * POST /api/ticker?ticker=AAPL
 * Returns one ticker (same shape as an /api/loadwatchlist entry), including
 * its price history for the chart.
 */
export async function fetchTicker(
  symbol: string,
  signal?: AbortSignal,
): Promise<Quote> {
  const res = await fetch(
    `${API_ORIGIN}/api/ticker?ticker=${encodeURIComponent(symbol)}`,
    { method: "POST", signal },
  );
  if (res.status === 404) throw new TickerNotFoundError(symbol);
  if (!res.ok) throw new Error(`ticker failed (${res.status})`);

  const data: Quote | null = await res.json();
  // an unknown symbol can come back as an empty ticker
  if (!data || !data.symbol) throw new TickerNotFoundError(symbol);
  return data;
}

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
