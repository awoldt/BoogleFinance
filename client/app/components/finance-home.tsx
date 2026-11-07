import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Direction } from "~/data/markets";
import { useSavedTickers } from "~/hooks/use-saved-tickers";
import { directionClass, pillClass, usd } from "~/lib/format";
import type { Quote } from "~/lib/watchlist";
import { ArrowIcon, CheckIcon, PlusIcon, SpinnerIcon } from "~/components/icons";
import { Brand } from "~/components/brand";
import { TickerSearch } from "~/components/ticker-search";
import { FooterLinks } from "~/components/footer-links";
import { ThemeToggle } from "~/components/theme-toggle";

function WaveBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-wave"
      viewBox="0 0 1440 240"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M-40 70c180 80 320-40 520-10s300 90 520 20 280-70 480-20" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M-40 100c200 70 340-50 540 0s280 80 500 10 300-80 480-10" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      <path d="M-40 130c220 60 360-70 560 10s260 70 480-10 320-60 480 10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path d="M-20 40c240 90 300-60 560-20s340 100 500 30 260-90 420-30" fill="none" stroke="currentColor" strokeWidth="1.15" opacity="0.45" />
      <path d="M-40 170c200 40 380-80 600 0s300 60 460-20 280-40 460 20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      <path d="M200 20c160 70 220-30 380 10s200 60 340 0 220-50 360 10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

type SortKey = "symbol" | "name" | "price" | "change" | "percent";
type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

// the value each column sorts by; undefined (no quote yet) always sorts last
function sortValue(
  key: SortKey,
  symbol: string,
  quote: Quote | undefined,
): string | number | undefined {
  const details = quote?.priceDetails;
  switch (key) {
    case "symbol":
      return symbol;
    case "name":
      return quote?.name;
    case "price":
      return details?.price;
    case "change":
      return details?.change;
    case "percent":
      return details?.changePercentage;
  }
}

// The quotes come from the home loader, which runs on the server on page load
// and again after every watchlist change. Until it catches up, saved tickers
// without a quote show a spinner.
export function FinanceHome({
  quotes,
  failed,
  showcaseSymbols,
}: {
  quotes: Record<string, Quote>;
  failed: boolean;
  // the default list for a visitor who hasn't saved a watchlist, else empty
  showcaseSymbols: string[];
}) {
  const { saved, pending, toggle: toggleSaved } = useSavedTickers();
  // Adding a ticker ends the showcase right away, without waiting for the
  // loader: the list below is then the visitor's own watchlist.
  const showcase = saved.length === 0 && showcaseSymbols.length > 0;
  const symbols = showcase ? showcaseSymbols : saved;

  // null keeps the list in the order it was saved (or showcased)
  const [sort, setSort] = useState<SortState>(null);
  const sortedSymbols = useMemo(() => {
    if (!sort) return symbols;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...symbols].sort((a, b) => {
      const x = sortValue(sort.key, a, quotes[a]);
      const y = sortValue(sort.key, b, quotes[b]);
      if (x === undefined || y === undefined) {
        return x === y ? 0 : x === undefined ? 1 : -1;
      }
      if (typeof x === "string" && typeof y === "string") {
        return factor * x.localeCompare(y);
      }
      return factor * ((x as number) - (y as number));
    });
  }, [symbols, quotes, sort]);

  // first click sorts in the column's natural direction (A-Z, biggest first),
  // the second reverses it, the third goes back to the saved order
  function sortBy(key: SortKey) {
    setSort((current) => {
      const natural = key === "symbol" || key === "name" ? "asc" : "desc";
      if (current?.key !== key) return { key, dir: natural };
      if (current.dir === natural) {
        return { key, dir: natural === "asc" ? "desc" : "asc" };
      }
      return null;
    });
  }

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative z-10 bg-hero">
        <div className="absolute inset-0 overflow-hidden">
          <WaveBackdrop />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <Brand />
          <TickerSearch saved={saved} onToggle={toggleSaved} />
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-xl font-normal text-ink">
            {showcase ? "Popular stocks" : "Your watchlist"}
          </h1>
          {showcase && (
            <p className="mt-1 text-sm text-muted">
              Your watchlist is empty, so here’s what’s popular. Search for a
              stock above, or tap + on any of these to start your own watchlist.
            </p>
          )}

          {symbols.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing here yet. Search for a stock above and tap + to watch it.
            </p>
          ) : pending && symbols.every((symbol) => !quotes[symbol]) ? (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 text-sm text-muted"
            >
              <SpinnerIcon className="h-5 w-5 text-link" />
              Loading your watchlist…
            </div>
          ) : (
            <>
              <SortHeader sort={sort} onSort={sortBy} />
              <ul>
                {sortedSymbols.map((symbol) => (
                  <WatchlistRow
                    key={symbol}
                    symbol={symbol}
                    quote={quotes[symbol]}
                    pending={pending}
                    added={!showcase}
                    onToggle={() => toggleSaved(symbol)}
                  />
                ))}
              </ul>
            </>
          )}

          {failed && !pending && (
            <p className="mt-3 text-sm text-down">
              Couldn’t load prices. Try refreshing.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <FooterLinks />
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}

// Column headings, laid out with the same widths and gaps as WatchlistRow so
// each one sits over its column. Each is a button that sorts by that column.
function SortHeader({
  sort,
  onSort,
}: {
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  function heading(key: SortKey, label: string, align: "left" | "right") {
    const active = sort?.key === key;
    const arrow = active && (
      <ArrowIcon direction={sort.dir === "asc" ? "up" : "down"} />
    );
    return (
      <button
        type="button"
        onClick={() => onSort(key)}
        aria-label={`Sort by ${label}`}
        aria-pressed={active}
        className={`inline-flex items-center gap-1 rounded py-1 text-xs font-medium whitespace-nowrap hover:text-ink ${
          align === "right" ? "w-full justify-end" : "justify-start"
        } ${active ? "text-ink" : "text-muted"}`}
      >
        {/* the arrow sits on the inside edge so right-aligned labels stay flush */}
        {align === "right" && arrow}
        {label}
        {align === "left" && arrow}
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 border-b border-line pb-1">
      <div className="w-14 shrink-0">{heading("symbol", "Symbol", "left")}</div>
      <div className="min-w-0 flex-1">{heading("name", "Name", "left")}</div>
      {/* same stacking as the rows: price over % on phones, columns from sm up */}
      <div className="flex w-[5.5rem] shrink-0 flex-col items-end sm:w-auto sm:flex-row sm:items-center sm:gap-3">
        <div className="w-full sm:w-[5.5rem]">
          {heading("price", "Price", "right")}
        </div>
        <div className="hidden w-[4.75rem] shrink-0 sm:block">
          {heading("change", "Change", "right")}
        </div>
        <div className="w-full sm:w-[5.5rem] sm:shrink-0">
          {heading("percent", "% Change", "right")}
        </div>
      </div>
      {/* room for the add/remove button column */}
      <span className="w-8 shrink-0" aria-hidden="true" />
    </div>
  );
}

function WatchlistRow({
  symbol,
  quote,
  pending,
  added,
  onToggle,
}: {
  symbol: string;
  quote: Quote | undefined;
  pending: boolean;
  // on the watchlist (✓ removes it) or just showcased (+ adds it)
  added: boolean;
  onToggle: () => void;
}) {
  const details = quote?.priceDetails;
  const direction: Direction = details && details.change < 0 ? "down" : "up";

  return (
    <li className="relative flex items-center gap-3 border-b border-line py-3.5 last:border-b-0 hover:bg-hover">
      <span className="inline-flex h-7 w-14 shrink-0 items-center justify-center rounded-md bg-[#636366] text-[11px] font-bold tracking-wide text-white">
        {symbol}
      </span>
      {/* the link's ::after stretches over the whole row so any click opens the ticker page */}
      <Link
        to={`/${encodeURIComponent(symbol)}`}
        aria-label={`Open ${symbol}`}
        className="min-w-0 flex-1 truncate text-[15px] text-ink after:absolute after:inset-0"
      >
        {quote?.name ?? ""}
      </Link>
      {details ? (
        // phones stack the price over the change pill so the name keeps room;
        // from sm up they sit in one line as separate columns
        <div className="flex w-[5.5rem] shrink-0 flex-col items-end gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <p className="text-right text-[15px] font-medium tabular-nums text-ink sm:w-[5.5rem]">
            {usd.format(details.price)}
          </p>
          <p
            className={`hidden w-[4.75rem] shrink-0 text-right text-sm tabular-nums sm:block ${directionClass(direction)}`}
          >
            {details.change < 0 ? "-" : "+"}
            {usd.format(Math.abs(details.change))}
          </p>
          <span
            className={`inline-flex w-[4.75rem] shrink-0 items-center justify-center gap-0.5 rounded-full px-2 py-0.5 text-sm font-medium tabular-nums sm:w-[5.5rem] sm:py-1 ${pillClass(direction)}`}
          >
            <ArrowIcon direction={direction} />
            {Math.abs(details.changePercentage).toFixed(2)}%
          </span>
        </div>
      ) : (
        <span className="flex w-[5.5rem] shrink-0 justify-end text-muted sm:w-[17.25rem]">
          {pending ? <SpinnerIcon className="h-4 w-4" /> : "—"}
        </span>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`
        }
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          added
            ? "border-link bg-link-bg text-link"
            : "border-line-strong text-muted hover:bg-hover"
        }`}
      >
        {added ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      </button>
    </li>
  );
}
