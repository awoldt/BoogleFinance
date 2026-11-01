// The resource route that saves the watchlist cookie. It takes the whole
// list as repeated `tickers` form fields.
export const WATCHLIST_ROUTE = "/api/watchlist";

// Where the SPA used to keep the watchlist, a JSON array in localStorage.
// Read once to move an old watchlist into the cookie.
export const LEGACY_STORAGE_KEY = "watchlist";

// The price fields of a ticker (the server-side cache field `expires` is
// ignored).
export type PriceDetails = {
  price: number;
  change: number;
  changePercentage: number;
  timestamp: number; // epoch seconds of the last price update
};

// One daily close, e.g. {date: "2026-10-21", price: 314.14}.
export type ChartPoint = {
  date: string; // YYYY-MM-DD
  price: number;
};

// Up to a year of daily closes, newest first (the server-side cache field
// `expires` is ignored). The server sends `null` when it couldn't get them.
export type HistoricalChart = {
  prices: ChartPoint[] | null;
};

// One 5 minute price of the current trading day, e.g.
// {date: "2026-10-29 09:35:00", open: 314.14}. The date is New York time.
export type IntradayPoint = {
  date: string; // YYYY-MM-DD HH:MM:SS
  open: number;
};

// Every 5 minutes of the latest trading day, newest first (the server-side
// cache field `expires` is ignored). The server sends `null` when it couldn't
// get them.
export type IntradayChart = {
  prices: IntradayPoint[] | null;
};

export type ChartDetails = {
  historicalChart: HistoricalChart;
  intradayChart?: IntradayChart;
};

// One entry of the /api/loadwatchlist response, and the /api/ticker response.
export type Quote = {
  name: string;
  symbol: string;
  priceDetails: PriceDetails;
  chartDetails?: ChartDetails;
};
