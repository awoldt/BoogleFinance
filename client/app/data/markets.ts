export type Direction = "up" | "down";

export type IndexQuote = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  direction: Direction;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percent: string;
  direction: Direction;
  color: string;
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

export const interested: StockQuote[] = [
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    price: "$459.34",
    change: "+$14.61",
    percent: "3.29%",
    direction: "up",
    color: "#e10600",
  },
  {
    symbol: "F",
    name: "Ford Motor Co",
    price: "$12.15",
    change: "+$0.19",
    percent: "1.63%",
    direction: "up",
    color: "#002f6c",
  },
  {
    symbol: "BABA",
    name: "Alibaba Group Holding Ltd.",
    price: "$180.81",
    change: "+$2.13",
    percent: "1.19%",
    direction: "up",
    color: "#ff6a00",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc",
    price: "$221.77",
    change: "+$2.20",
    percent: "1.00%",
    direction: "up",
    color: "#c45500",
  },
  {
    symbol: "NXST",
    name: "Nexstar Media Group Inc",
    price: "$196.09",
    change: "-$1.65",
    percent: "0.83%",
    direction: "down",
    color: "#5f6368",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc",
    price: "$256.37",
    change: "+$1.73",
    percent: "0.68%",
    direction: "up",
    color: "#636366",
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
