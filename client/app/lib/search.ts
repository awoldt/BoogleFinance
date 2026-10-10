export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

// In dev, vite proxies /api -> the Go server (see vite.config.ts).
// Override with VITE_API_URL when the API lives somewhere else.
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function searchTickers(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const res = await fetch(
    `${API_URL}/search?ticker=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) throw new Error(`search failed (${res.status})`);

  const data: SearchResult[] | null = await res.json();
  return data ?? [];
}
