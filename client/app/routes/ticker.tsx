import { data, type ShouldRevalidateFunctionArgs } from "react-router";
import type { Route } from "./+types/ticker";
import { TickerPage } from "~/components/ticker-page";
import { fetchTicker, TickerNotFoundError } from "~/lib/api.server";
import { WATCHLIST_ROUTE } from "~/lib/watchlist";

export function meta({ params }: Route.MetaArgs) {
  const symbol = params.ticker.toUpperCase();
  return [
    { title: `${symbol} · Finance` },
    { name: "description", content: `Price and chart for ${symbol}.` },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const symbol = params.ticker.toUpperCase();
  try {
    return { quote: await fetchTicker(symbol, request.signal), problem: null };
  } catch (error) {
    const notFound = error instanceof TickerNotFoundError;
    return data(
      { quote: null, problem: notFound ? ("notfound" as const) : ("failed" as const) },
      { status: notFound ? 404 : 502 },
    );
  }
}

// saving to the watchlist doesn't change the quote, so skip refetching it
export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formAction === WATCHLIST_ROUTE) return false;
  return defaultShouldRevalidate;
}

export default function Ticker({ params, loaderData }: Route.ComponentProps) {
  const symbol = params.ticker.toUpperCase();
  // keyed so moving between tickers starts with fresh state
  return (
    <TickerPage
      key={symbol}
      symbol={symbol}
      quote={loaderData.quote}
      problem={loaderData.problem}
    />
  );
}
