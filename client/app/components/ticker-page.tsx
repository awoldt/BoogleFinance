import { Link } from "react-router";
import type { Direction } from "~/data/markets";
import { useSavedTickers } from "~/hooks/use-saved-tickers";
import { ArrowIcon, BackIcon } from "~/components/icons";
import { TickerSearch } from "~/components/ticker-search";
import { PriceChart } from "~/components/price-chart";
import { ThemeToggle } from "~/components/theme-toggle";
import { directionClass, pillClass, usd } from "~/lib/format";
import type { ChartPoint, IntradayPoint, Quote } from "~/lib/watchlist";

// stable references so the chart isn't rebuilt on every render without data
const EMPTY_PRICES: ChartPoint[] = [];
const EMPTY_INTRADAY: IntradayPoint[] = [];

// New York time, the market's own clock. It also renders the same on the
// server as in the browser, whatever time zone each is in.
const updatedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
});

// The quote comes from the ticker loader, fetched on the server before the
// page renders.
export function TickerPage({
  symbol,
  quote,
  problem,
}: {
  symbol: string;
  quote: Quote | null;
  problem: "notfound" | "failed" | null;
}) {
  const { saved, toggle: toggleSaved } = useSavedTickers();

  return (
    <div className="min-h-screen bg-canvas">
      <main className="w-full px-[max(4rem,12vw)] py-8 min-[1280px]:px-[22vw]">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Link
            to="/"
            className="-ml-2 inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-link hover:bg-hover"
          >
            <BackIcon className="h-5 w-5" />
            Watchlist
          </Link>
          <div className="relative z-20 w-full sm:w-96">
            <TickerSearch compact saved={saved} onToggle={toggleSaved} />
          </div>
        </div>

        {quote ? (
          <QuoteView quote={quote} />
        ) : (
          <p className="mt-6 text-sm text-down">
            {problem === "notfound"
              ? `We couldn’t find a ticker called ${symbol}.`
              : `Couldn’t load ${symbol}. Try refreshing.`}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Link to="/privacy" className="text-sm text-muted hover:text-link">
            Privacy
          </Link>
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}

function QuoteView({ quote }: { quote: Quote }) {
  const { price, change, changePercentage, timestamp } = quote.priceDetails;
  const direction: Direction = change < 0 ? "down" : "up";
  const prices = quote.chartDetails?.historicalChart?.prices ?? EMPTY_PRICES;
  const intraday = quote.chartDetails?.intradayChart?.prices ?? EMPTY_INTRADAY;

  return (
    <section className="mt-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 w-14 shrink-0 items-center justify-center rounded-md bg-[#636366] text-[11px] font-bold tracking-wide text-white">
          {quote.symbol}
        </span>
        <h1 className="min-w-0 truncate text-2xl font-normal text-ink">
          {quote.name}
        </h1>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-4xl tabular-nums text-ink sm:text-5xl">
          {usd.format(price)}
        </p>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-3 py-1 text-sm font-medium tabular-nums ${pillClass(direction)}`}
        >
          <ArrowIcon direction={direction} />
          {Math.abs(changePercentage).toFixed(2)}%
        </span>
        <span className={`text-base tabular-nums ${directionClass(direction)}`}>
          {change < 0 ? "-" : "+"}
          {usd.format(Math.abs(change))} today
        </span>
      </div>

      {timestamp > 0 && (
        <p className="mt-3 text-sm text-muted">
          Last updated: {updatedFormat.format(timestamp * 1000)}
        </p>
      )}

      <PriceChart
        symbol={quote.symbol}
        price={price}
        change={change}
        prices={prices}
        intraday={intraday}
      />
    </section>
  );
}
