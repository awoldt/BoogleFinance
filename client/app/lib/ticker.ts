import { API_ORIGIN } from "~/lib/search";
import type { Quote } from "~/lib/watchlist";

export class TickerNotFoundError extends Error {}

/**
 * POST /api/price?ticker=AAPL
 * Returns one ticker (same shape as an /api/loadwatchlist entry).
 */
export async function fetchTicker(
  symbol: string,
  signal?: AbortSignal,
): Promise<Quote> {
  const res = await fetch(
    `${API_ORIGIN}/api/price?ticker=${encodeURIComponent(symbol)}`,
    { method: "POST", signal },
  );
  if (res.status === 404) throw new TickerNotFoundError(symbol);
  if (!res.ok) throw new Error(`price failed (${res.status})`);

  const data: Quote | null = await res.json();
  // an unknown symbol can come back as an empty ticker
  if (!data || !data.symbol) throw new TickerNotFoundError(symbol);
  return data;
}
