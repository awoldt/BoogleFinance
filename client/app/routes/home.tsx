import type { Route } from "./+types/home";
import { FinanceHome } from "~/components/finance-home";
import { loadWatchlist } from "~/lib/api.server";
import type { Quote } from "~/lib/watchlist";
import { seoMeta } from "~/lib/seo";
import { readHomeTickers } from "~/lib/watchlist.server";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Boogle Finance - Stock prices and your watchlist",
    description:
      "Boogle Finance lets you search stocks, follow a watchlist, and scan the market.",
  });
}

// quotes for every saved ticker, keyed by symbol. A visitor with no saved
// watchlist gets quotes for the default list instead, as a showcase. Runs
// again after each watchlist change, so a newly added ticker gets its quote.
export async function loader({ request }: Route.LoaderArgs) {
  const { tickers, showcase } = await readHomeTickers(request);
  // an emptied watchlist means nothing to load
  if (tickers.length === 0) {
    return { quotes: {}, failed: false, showcaseSymbols: [] as string[] };
  }

  // empty unless the default list is being shown
  const showcaseSymbols = showcase ? tickers : [];
  try {
    const list = await loadWatchlist(tickers, request.signal);
    const quotes: Record<string, Quote> = Object.fromEntries(
      list.map((quote) => [quote.symbol, quote]),
    );
    return { quotes, failed: false, showcaseSymbols };
  } catch {
    return { quotes: {} as Record<string, Quote>, failed: true, showcaseSymbols };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <FinanceHome
      quotes={loaderData.quotes}
      failed={loaderData.failed}
      showcaseSymbols={loaderData.showcaseSymbols}
    />
  );
}
