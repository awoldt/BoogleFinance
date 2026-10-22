import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { Direction } from "~/data/markets";
import { useTickerSearch } from "~/hooks/use-ticker-search";
import { directionClass, pillClass, usd } from "~/lib/format";
import type { SearchResult } from "~/lib/search";
import {
  loadWatchlist,
  readSavedTickers,
  writeSavedTickers,
  type Quote,
} from "~/lib/watchlist";
import {
  ArrowIcon,
  CheckIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
} from "~/components/icons";
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

export function FinanceHome() {
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>(readSavedTickers);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(saved.length > 0);
  const [failed, setFailed] = useState(false);
  const [lists, setLists] = useState<string[]>([]);
  const [namingList, setNamingList] = useState(false);
  const [listName, setListName] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { results, status } = useTickerSearch(query);

  // load quotes on app load and again whenever the watchlist changes. Nothing
  // saved means nothing to load, so skip the request and the spinner.
  useEffect(() => {
    if (saved.length === 0) {
      setLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    loadWatchlist(saved, controller.signal)
      .then((list) => {
        setQuotes(Object.fromEntries(list.map((quote) => [quote.symbol, quote])));
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [saved]);

  // keep localStorage in sync with every add/remove
  useEffect(() => {
    writeSavedTickers(saved);
  }, [saved]);

  // close the dropdown when clicking anywhere outside the search box
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function toggleSaved(symbol: string) {
    setSaved((current) =>
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }

  function addList() {
    const name = listName.trim();
    if (!name) {
      setNamingList(false);
      return;
    }
    setLists((current) => [...current, name]);
    setListName("");
    setNamingList(false);
  }

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative z-10 bg-hero">
        <div className="absolute inset-0 overflow-hidden">
          <WaveBackdrop />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <div ref={searchRef} className="relative">
            <label className="relative block">
              <span className="sr-only">Search for stocks, ETFs and more</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Search for stocks, ETFs & more"
                autoComplete="off"
                aria-expanded={searchOpen && query.trim() !== ""}
                className="h-14 w-full rounded-full border border-line-strong bg-search pr-5 pl-12 text-base text-ink shadow-[var(--shadow)] outline-none placeholder:text-faint focus:border-link"
              />
            </label>

            {searchOpen && query.trim() !== "" && (
              <SearchDropdown
                query={query.trim()}
                status={status}
                results={results}
                saved={saved}
                onToggle={toggleSaved}
              />
            )}
          </div>
        </div>
      </section>

      <main className="w-full px-[max(4rem,12vw)] py-8 min-[1280px]:px-[22vw]">
        <div>
          <h1 className="text-xl font-normal text-ink">Your watchlist</h1>

          {saved.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing here yet. Search for a stock above and tap + to watch it.
            </p>
          ) : loading && saved.every((symbol) => !quotes[symbol]) ? (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 text-sm text-muted"
            >
              <SpinnerIcon className="h-5 w-5 text-link" />
              Loading your watchlist…
            </div>
          ) : (
            <ul className="mt-2">
              {saved.map((symbol) => (
                <WatchlistRow
                  key={symbol}
                  symbol={symbol}
                  quote={quotes[symbol]}
                  pending={loading}
                  onRemove={() => toggleSaved(symbol)}
                />
              ))}
            </ul>
          )}

          {failed && (
            <p className="mt-3 text-sm text-down">
              Couldn’t load prices. Try refreshing.
            </p>
          )}

          <div className="mt-8">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted">
              YOUR LISTS
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-card px-4 py-2 text-sm text-ink hover:bg-hover"
              >
                <ListIcon className="h-4 w-4 text-muted" />
                Watchlist
                <span className="tabular-nums text-muted">{saved.length}</span>
              </button>
              {lists.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-line-strong bg-card px-4 py-2 text-sm text-ink"
                >
                  {name}
                </span>
              ))}
              {namingList ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addList();
                  }}
                >
                  <input
                    autoFocus
                    value={listName}
                    onChange={(event) => setListName(event.target.value)}
                    placeholder="List name"
                    aria-label="List name"
                    className="h-9 w-36 rounded-full border border-line-strong bg-card px-3 text-sm text-ink outline-none focus:border-link"
                  />
                  <button type="submit" className="text-sm font-medium text-link">
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setNamingList(true)}
                  className="inline-flex items-center gap-1 px-1 text-sm font-medium text-link"
                >
                  <PlusIcon className="h-4 w-4" />
                  New list
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}

function SearchDropdown({
  query,
  status,
  results,
  saved,
  onToggle,
}: {
  query: string;
  status: "idle" | "loading" | "success" | "error";
  results: SearchResult[];
  saved: string[];
  onToggle: (symbol: string) => void;
}) {
  const loading = status === "loading";

  return (
    <div className="absolute top-full right-0 left-0 z-20 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-line-strong bg-card shadow-[var(--shadow)]">
      {status === "error" ? (
        <p className="px-5 py-6 text-sm text-down">
          Something went wrong. Try again.
        </p>
      ) : results.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          {loading ? "Searching…" : `No matches for “${query}”.`}
        </p>
      ) : (
        <ul className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {results.map((result) => (
            <SearchResultRow
              key={result.symbol}
              result={result}
              saved={saved.includes(result.symbol)}
              onToggle={() => onToggle(result.symbol)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchResultRow({
  result,
  saved,
  onToggle,
}: {
  result: SearchResult;
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0 hover:bg-hover">
      <span className="inline-flex h-7 w-14 shrink-0 items-center justify-center rounded-md bg-link-bg text-[11px] font-bold tracking-wide text-link">
        {result.symbol}
      </span>
      <p className="min-w-0 flex-1 truncate text-[15px] text-ink">{result.name}</p>
      <p className="hidden shrink-0 text-sm text-muted sm:block">{result.exchange}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={
          saved ? `Remove ${result.symbol} from watchlist` : `Add ${result.symbol} to watchlist`
        }
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          saved
            ? "border-link bg-link-bg text-link"
            : "border-line-strong text-muted hover:bg-hover"
        }`}
      >
        {saved ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      </button>
    </li>
  );
}

function WatchlistRow({
  symbol,
  quote,
  pending,
  onRemove,
}: {
  symbol: string;
  quote: Quote | undefined;
  pending: boolean;
  onRemove: () => void;
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
        state={{ quote }}
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
        onClick={onRemove}
        aria-label={`Remove ${symbol} from watchlist`}
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-link bg-link-bg text-link"
      >
        <CheckIcon className="h-4 w-4" />
      </button>
    </li>
  );
}
