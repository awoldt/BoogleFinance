import type { Route } from "./+types/home";
import { FinanceHome } from "~/components/finance-home";
import { loadWatchlist } from "~/lib/api.server";
import type { Quote } from "~/lib/watchlist";
import { readSavedTickers } from "~/lib/watchlist.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Finance" },
    {
      name: "description",
      content: "Search stocks, follow a watchlist, and scan the market.",
    },
  ];
}

// quotes for every saved ticker, keyed by symbol. Runs again after each
// watchlist change, so a newly added ticker gets its quote.
export async function loader({ request }: Route.LoaderArgs) {
  const saved = await readSavedTickers(request);
  // nothing saved means nothing to load
  if (saved.length === 0) return { quotes: {}, failed: false };

  try {
    const list = await loadWatchlist(saved, request.signal);
    const quotes: Record<string, Quote> = Object.fromEntries(
      list.map((quote) => [quote.symbol, quote]),
    );
    return { quotes, failed: false };
  } catch {
    return { quotes: {} as Record<string, Quote>, failed: true };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <FinanceHome quotes={loaderData.quotes} failed={loaderData.failed} />;
}
