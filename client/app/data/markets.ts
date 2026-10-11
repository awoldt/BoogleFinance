export type Direction = "up" | "down";

export type IndexQuote = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  direction: Direction;
};

export type Trend = {
  id: string;
  label: string;
  icon: TrendIcon;
};

export type TrendIcon =
  | "indexes"
  | "active"
  | "gainers"
  | "losers"
  | "climate"
  | "crypto"
  | "currencies";

export type Earning = {
  month: string;
  company: string;
};

export const indexes: IndexQuote[] = [
  {
    symbol: "DJI",
    name: "Dow Jones",
    price: "48,817.93",
    change: "+119.56",
    percent: "+0.25%",
    direction: "up",
  },
  {
    symbol: "GSPC",
    name: "S&P 500",
    price: "6,703.93",
    change: "+113.43",
    percent: "+1.72%",
    direction: "up",
  },
  {
    symbol: "IXIC",
    name: "Nasdaq",
    price: "22,736.66",
    change: "+170.65",
    percent: "+0.76%",
    direction: "up",
  },
  {
    symbol: "RUT",
    name: "Russell 2000",
    price: "2,456.48",
    change: "-8.21",
    percent: "-0.33%",
    direction: "down",
  },
  {
    symbol: "VIX",
    name: "VIX",
    price: "18.65",
    change: "-0.19",
    percent: "-1.01%",
    direction: "down",
  },
];

export const trends: Trend[] = [
  { id: "indexes", label: "Market indexes", icon: "indexes" },
  { id: "active", label: "Most active", icon: "active" },
  { id: "gainers", label: "Gainers", icon: "gainers" },
  { id: "losers", label: "Losers", icon: "losers" },
  { id: "climate", label: "Climate leaders", icon: "climate" },
  { id: "crypto", label: "Crypto", icon: "crypto" },
  { id: "currencies", label: "Currencies", icon: "currencies" },
];

export const earnings: Earning[] = [
  { month: "OCT", company: "Progressive Corporation" },
  { month: "OCT", company: "Tesla Inc" },
  { month: "OCT", company: "Netflix Inc" },
  { month: "NOV", company: "Apple Inc" },
  { month: "NOV", company: "NVIDIA Corp" },
];
