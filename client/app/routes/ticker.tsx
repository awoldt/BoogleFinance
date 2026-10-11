import type { Route } from "./+types/ticker";
import { TickerPage } from "~/components/ticker-page";

export function meta({ params }: Route.MetaArgs) {
  const symbol = params.ticker.toUpperCase();
  return [
    { title: `${symbol} · Finance` },
    { name: "description", content: `Price and chart for ${symbol}.` },
  ];
}

export default function Ticker({ params }: Route.ComponentProps) {
  const symbol = params.ticker.toUpperCase();
  // keyed so moving between tickers starts with fresh state
  return <TickerPage key={symbol} symbol={symbol} />;
}
