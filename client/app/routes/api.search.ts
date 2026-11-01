import type { Route } from "./+types/api.search";
import { searchTickers } from "~/lib/api.server";

// GET /api/search?q=tesla, called by the search box. Passes the term on to
// the Go server and returns its results as JSON.
export async function loader({ request }: Route.LoaderArgs) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return Response.json([]);

  try {
    // request.signal aborts when the search box moves on to a newer term
    return Response.json(await searchTickers(query, request.signal));
  } catch {
    return Response.json({ error: "search failed" }, { status: 502 });
  }
}
