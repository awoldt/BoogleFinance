import { useCallback, useEffect, useState } from "react";
import { readSavedTickers, writeSavedTickers } from "~/lib/watchlist";

/** The saved watchlist symbols, kept in sync with localStorage. */
export function useSavedTickers() {
  const [saved, setSaved] = useState<string[]>(readSavedTickers);

  useEffect(() => {
    writeSavedTickers(saved);
  }, [saved]);

  const toggle = useCallback((symbol: string) => {
    setSaved((current) =>
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
  }, []);

  return [saved, toggle] as const;
}
