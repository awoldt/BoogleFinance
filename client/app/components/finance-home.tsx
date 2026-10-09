import { useMemo, useState } from "react";
import {
  interested,
  type Direction,
  type StockQuote,
} from "~/data/markets";
import {
  ArrowIcon,
  CheckIcon,
  InfoIcon,
  ListIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "~/components/icons";

function directionClass(direction: Direction) {
  return direction === "up" ? "text-up" : "text-down";
}

function pillClass(direction: Direction) {
  return direction === "up"
    ? "bg-up-bg text-up"
    : "bg-down-bg text-down";
}

function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color scheme"
      className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-hover"
    >
      <SunIcon className="hidden h-5 w-5 dark:block" />
      <MoonIcon className="h-5 w-5 dark:hidden" />
    </button>
  );
}

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
  const [saved, setSaved] = useState<string[]>([]);
  const [lists, setLists] = useState<string[]>([]);
  const [namingList, setNamingList] = useState(false);
  const [listName, setListName] = useState("");

  const stocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interested;
    return interested.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q),
    );
  }, [query]);

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
      <section className="relative overflow-hidden bg-hero">
        <WaveBackdrop />
        <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <label className="relative block">
            <span className="sr-only">Search for stocks, ETFs and more</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for stocks, ETFs & more"
              className="h-14 w-full rounded-full border border-line-strong bg-search pr-5 pl-12 text-base text-ink shadow-[var(--shadow)] outline-none placeholder:text-faint focus:border-link"
            />
          </label>
        </div>
      </section>

      <main className="w-full px-[max(4rem,12vw)] py-8 min-[1280px]:px-[22vw]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-normal text-ink">You may be interested in</h1>
            <button
              type="button"
              className="text-faint"
              aria-label="Suggested from popular stocks"
              title="Suggested from popular stocks"
            >
              <InfoIcon className="h-5 w-5" />
            </button>
          </div>

          <ul className="mt-2">
            {stocks.map((stock) => (
              <StockRow
                key={stock.symbol}
                stock={stock}
                saved={saved.includes(stock.symbol)}
                onToggle={() => toggleSaved(stock.symbol)}
              />
            ))}
            {stocks.length === 0 && (
              <li className="py-8 text-sm text-muted">
                No matches for “{query.trim()}”.
              </li>
            )}
          </ul>

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

function StockRow({
  stock,
  saved,
  onToggle,
}: {
  stock: StockQuote;
  saved: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
      <span
        className="inline-flex h-7 w-14 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tracking-wide text-white"
        style={{ backgroundColor: stock.color }}
      >
        {stock.symbol}
      </span>
      <p className="min-w-0 flex-1 truncate text-[15px] text-ink">{stock.name}</p>
      <p className="w-[5.5rem] shrink-0 text-right text-[15px] font-medium tabular-nums text-ink">
        {stock.price}
      </p>
      <p
        className={`hidden w-[4.75rem] shrink-0 text-right text-sm tabular-nums sm:block ${directionClass(stock.direction)}`}
      >
        {stock.change}
      </p>
      <span
        className={`inline-flex w-[5.5rem] shrink-0 items-center justify-center gap-0.5 rounded-full px-2 py-1 text-sm font-medium tabular-nums ${pillClass(stock.direction)}`}
      >
        <ArrowIcon direction={stock.direction} />
        {stock.percent}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={
          saved ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`
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
