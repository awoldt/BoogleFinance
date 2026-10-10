import { useEffect, useState } from "react";
import { searchTickers, type SearchResult } from "~/lib/search";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

type Status = "idle" | "loading" | "success" | "error";

/**
 * Debounced ticker search. Fires one request once the user pauses typing and
 * aborts any in-flight request when the term changes, so a slow response for
 * "te" can never overwrite the results for "tesla".
 */
export function useTickerSearch(query: string, delay = 300) {
  const trimmed = query.trim();
  const term = useDebouncedValue(trimmed, delay);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!term) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    searchTickers(term, controller.signal)
      .then((found) => {
        setResults(found);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setStatus("error");
      });

    return () => controller.abort();
  }, [term]);

  // while the user is still typing (debounce pending) treat it as loading,
  // and drop everything the instant the box is cleared.
  if (!trimmed) return { results: [] as SearchResult[], status: "idle" as Status };

  const pending = trimmed !== term;
  return {
    results,
    status: pending && status !== "error" ? ("loading" as Status) : status,
  };
}
