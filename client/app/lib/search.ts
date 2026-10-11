export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

// Origin of the Go server, e.g. https://my-server.up.railway.app (no /api).
// Empty in dev so requests go through the vite proxy. Trailing slashes are
// stripped so a copy/pasted "https://host/" doesn't produce "//api/...".
export const API_ORIGIN =(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

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
