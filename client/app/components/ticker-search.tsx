import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTickerSearch } from "~/hooks/use-ticker-search";
import type { SearchResult } from "~/lib/search";
import { CheckIcon, PlusIcon, SearchIcon } from "~/components/icons";

export function TickerSearch({
  saved,
  onToggle,
  compact = false,
}: {
  saved: string[];
  onToggle: (symbol: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, status } = useTickerSearch(query);

  // close the dropdown when clicking anywhere outside the search box
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="relative block">
        <span className="sr-only">Search for stocks, ETFs and more</span>
        <SearchIcon
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint ${
            compact ? "left-4 h-4 w-4" : "left-5 h-5 w-5"
          }`}
        />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Search for stocks, ETFs & more"
          autoComplete="off"
          aria-expanded={open && query.trim() !== ""}
          className={`w-full rounded-full border border-line-strong bg-search text-ink outline-none placeholder:text-faint focus:border-link ${
            compact
              ? "h-11 pr-4 pl-11 text-[15px]"
              : "h-14 pr-5 pl-12 text-base shadow-[var(--shadow)]"
          }`}
        />
      </label>

      {open && query.trim() !== "" && (
        <SearchDropdown
          query={query.trim()}
          status={status}
          results={results}
          saved={saved}
          onToggle={onToggle}
        />
      )}
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
    <li className="relative flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0 hover:bg-hover">
      <span className="inline-flex h-7 w-14 shrink-0 items-center justify-center rounded-md bg-link-bg text-[11px] font-bold tracking-wide text-link">
        {result.symbol}
      </span>
      {/* the link's ::after stretches over the whole row so any click opens the ticker page */}
      <Link
        to={`/${encodeURIComponent(result.symbol)}`}
        aria-label={`Open ${result.symbol}`}
        className="min-w-0 flex-1 truncate text-[15px] text-ink after:absolute after:inset-0"
      >
        {result.name}
      </Link>
      <p className="hidden shrink-0 text-sm text-muted sm:block">{result.exchange}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={
          saved ? `Remove ${result.symbol} from watchlist` : `Add ${result.symbol} to watchlist`
        }
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
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
