import { useEffect } from "react";
import { useFetchers, useRouteLoaderData, useSubmit } from "react-router";
import type { loader as rootLoader } from "~/root";
import { LEGACY_STORAGE_KEY, WATCHLIST_ROUTE } from "~/lib/watchlist";

// orders saves made in quick succession, the newest one wins
let saveCount = 0;
// The newest save until it finishes. The router applies a save in a
// transition, so a second click can land before the fetchers show the first;
// this lets it build on the first anyway.
let latestSave: { order: number; symbols: string[] } | null = null;

/**
 * The saved watchlist symbols. The root loader reads them from the cookie;
 * changes are posted to the watchlist route, which rewrites the cookie. Until
 * that finishes the list from the newest save still in flight is shown, so
 * toggling feels instant.
 */
export function useSavedTickers() {
  const stored = useRouteLoaderData<typeof rootLoader>("root")?.saved ?? [];
  const fetchers = useFetchers();
  const submit = useSubmit();

  let saved = stored;
  let newest = -1;
  for (const fetcher of fetchers) {
    if (fetcher.formAction !== WATCHLIST_ROUTE || !fetcher.formData) continue;
    const order = Number(fetcher.formData.get("order"));
    if (order > newest) {
      newest = order;
      saved = fetcher.formData.getAll("tickers") as string[];
    }
  }
  if (latestSave && latestSave.order > newest) {
    newest = latestSave.order;
    saved = latestSave.symbols;
  }
  const pending = newest >= 0;

  // each save sends the whole list, so a later save never depends on an
  // earlier one having reached the cookie
  function save(symbols: string[]) {
    const order = saveCount++;
    latestSave = { order, symbols };
    const form = new FormData();
    form.set("order", String(order));
    for (const symbol of symbols) form.append("tickers", symbol);
    const done = () => {
      if (latestSave?.order === order) latestSave = null;
    };
    submit(form, { method: "post", action: WATCHLIST_ROUTE, navigate: false }).then(done, done);
  }

  function toggle(symbol: string) {
    const current = latestSave?.symbols ?? saved;
    save(
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }

  return { saved, pending, save, toggle };
}

/**
 * Moves a watchlist saved by the old SPA (localStorage) into the cookie, once.
 * Its symbols are added after any already in the cookie.
 */
export function useMoveLegacyWatchlist() {
  const { saved, save } = useSavedTickers();

  useEffect(() => {
    let legacy: unknown;
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw === null) return;
      // removed first so this only ever runs once
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      legacy = JSON.parse(raw);
    } catch {
      // storage blocked or the value is corrupt
      return;
    }
    if (!Array.isArray(legacy)) return;

    const extra = legacy.filter(
      (item): item is string =>
        typeof item === "string" && item !== "" && !saved.includes(item),
    );
    if (extra.length > 0) save([...saved, ...extra]);
    // only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
