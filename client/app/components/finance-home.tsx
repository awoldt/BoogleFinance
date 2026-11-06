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

      <main className="w-full px-[max(4rem,12vw)] py-8 min-[1280px]:px-[22vw]">
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
            <ul className="mt-2">
              {symbols.map((symbol) => (
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
        <>
          <p className="w-[5.5rem] shrink-0 text-right text-[15px] font-medium tabular-nums text-ink">
            {usd.format(details.price)}
          </p>
          <p
            className={`hidden w-[4.75rem] shrink-0 text-right text-sm tabular-nums sm:block ${directionClass(direction)}`}
          >
            {details.change < 0 ? "-" : "+"}
            {usd.format(Math.abs(details.change))}
          </p>
          <span
            className={`inline-flex w-[5.5rem] shrink-0 items-center justify-center gap-0.5 rounded-full px-2 py-1 text-sm font-medium tabular-nums ${pillClass(direction)}`}
          >
            <ArrowIcon direction={direction} />
            {Math.abs(details.changePercentage).toFixed(2)}%
          </span>
        </>
      ) : (
        <span className="flex w-[5.5rem] shrink-0 justify-end text-muted sm:w-[15.75rem]">
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
