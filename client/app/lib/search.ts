export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

/**
 * GET /api/search?q=AAPL
 * The app's own resource route (routes/api.search.ts), which asks the Go
 * server, so the browser never calls the Go server itself.
 */
export async function searchTickers(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error(`search failed (${res.status})`);

  const data: SearchResult[] | null = await res.json();
  return data ?? [];
}
