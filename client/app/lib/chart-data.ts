// Fake price history for the ticker page chart. It is generated, not fetched:
// a seeded random walk (same symbol + range always draws the same line) that
// ends exactly on the real price. On 1D it starts at the real previous close
// (price - change), so the day's line agrees with the header.

export const RANGES = ["1D", "5D", "1M", "6M", "YTD"] as const;
export type RangeKey = (typeof RANGES)[number];

export type Chart = {
  times: number[]; // epoch ms, one per point
  values: number[];
  ys: number[]; // 0-100 position of each point in the plot, 0 = top
  line: string; // svg path, x in 0-1000, y in 0-100
  area: string;
  yTicks: { pct: number; label: string }[];
  xTicks: { pct: number; label: string }[];
  baselinePct: number | null; // previous close, 1D only
  rising: boolean;
  formatTime: (ms: number) => string;
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

const POINTS: Record<RangeKey, number> = {
  "1D": 78,
  "5D": 130,
  "1M": 120,
  "6M": 130,
  YTD: 130,
};

function spanMs(range: RangeKey, endMs: number): number {
  switch (range) {
    case "1D":
      return 6.5 * HOUR;
    case "5D":
      return 5 * DAY;
    case "1M":
      return 30 * DAY;
    case "6M":
      return 182 * DAY;
    case "YTD": {
      const jan1 = new Date(new Date(endMs).getFullYear(), 0, 1).getTime();
      return Math.max(endMs - jan1, 7 * DAY);
    }
  }
}

// axis / tooltip date formats per range
const dateFormats: Record<RangeKey, [axis: Intl.DateTimeFormatOptions, tip: Intl.DateTimeFormatOptions]> = {
  "1D": [{ hour: "numeric", minute: "2-digit" }, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }],
  "5D": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }],
  "1M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "6M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  YTD: [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
};

// small seeded PRNG so a symbol always draws the same chart
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function niceTicks(min: number, max: number): { step: number; ticks: number[] } {
  const raw = (max - min) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return { step, ticks };
}

export function buildChart(
  symbol: string,
  range: RangeKey,
  price: number,
  change: number,
  timestampSec: number,
): Chart {
  const endMs = timestampSec > 0 ? timestampSec * 1000 : Date.now();
  const span = spanMs(range, endMs);
  const n = POINTS[range];
  const rand = mulberry32(hash(`${symbol}:${range}`));
  const gauss = () =>
    Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

  // ~30% annualised volatility, spread over the points
  const sigmaTotal = 0.3 * Math.sqrt(span / YEAR);
  const sigmaStep = sigmaTotal / Math.sqrt(n);

  const prevClose = price - change;
  const start =
    range === "1D" && prevClose > 0
      ? prevClose
      : price * Math.exp(-(rand() * 2 - 1) * sigmaTotal);
  const drift = Math.log(price / start);

  // random walk, bent into a bridge so it lands exactly on `price`
  const walk = new Array<number>(n);
  walk[0] = 0;
  for (let i = 1; i < n; i++) walk[i] = walk[i - 1] + sigmaStep * gauss();
  const lastWalk = walk[n - 1];

  const times = new Array<number>(n);
  const values = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    times[i] = endMs - span + f * span;
    values[i] = start * Math.exp(walk[i] - f * lastWalk + f * drift);
  }
  values[n - 1] = price;

  // vertical domain, padded a little so the line never touches the edges
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const showBaseline = range === "1D" && prevClose > 0;
  if (showBaseline) {
    lo = Math.min(lo, prevClose);
    hi = Math.max(hi, prevClose);
  }
  const pad = (hi - lo || hi * 0.01 || 1) * 0.08;
  const domainLo = lo - pad;
  const domainHi = hi + pad;
  const toPct = (v: number) => ((domainHi - v) / (domainHi - domainLo)) * 100;

  const ys = values.map(toPct);
  let line = "";
  for (let i = 0; i < n; i++) {
    line += `${i === 0 ? "M" : "L"}${((i / (n - 1)) * 1000).toFixed(1)} ${ys[i].toFixed(2)}`;
  }
  const area = `${line}L1000 100L0 100Z`;

  const { step, ticks } = niceTicks(domainLo, domainHi);
  const decimals = Math.min(4, Math.max(0, -Math.floor(Math.log10(step))));
  const tickFormat = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const yTicks = ticks.map((v) => ({ pct: toPct(v), label: tickFormat.format(v) }));

  const [axisOptions, tipOptions] = dateFormats[range];
  const axisFormat = new Intl.DateTimeFormat("en-US", axisOptions);
  const tipFormat = new Intl.DateTimeFormat("en-US", tipOptions);
  const xTicks = [0.125, 0.375, 0.625, 0.875].map((f) => ({
    pct: f * 100,
    label: axisFormat.format(endMs - span + f * span),
  }));

  return {
    times,
    values,
    ys,
    line,
    area,
    yTicks,
    xTicks,
    baselinePct: showBaseline ? toPct(prevClose) : null,
    rising: values[n - 1] >= values[0],
    formatTime: (ms) => tipFormat.format(ms),
  };
}
