// Builds the ticker page chart from the daily closes the server sends with a
// ticker (up to a year of them). Every range is just a slice of that one
// array, so switching ranges never needs another request.

import type { ChartPoint } from "~/lib/watchlist";

export const RANGES = ["5D", "1M", "6M", "1Y"] as const;
export type RangeKey = (typeof RANGES)[number];

export type Chart = {
  times: number[]; // epoch ms, one per point
  values: number[];
  ys: number[]; // 0-100 position of each point in the plot, 0 = top
  line: string; // svg path, x in 0-1000, y in 0-100
  area: string;
  yTicks: { pct: number; label: string }[];
  xTicks: { pct: number; label: string }[];
  rising: boolean;
  formatTime: (ms: number) => string;
};

// 5D is the last five trading days, the others reach back this many months
// from the newest close
const MONTHS: Record<Exclude<RangeKey, "5D">, number> = {
  "1M": 1,
  "6M": 6,
  "1Y": 12,
};

// axis / tooltip date formats per range
const dateFormats: Record<RangeKey, [axis: Intl.DateTimeFormatOptions, tip: Intl.DateTimeFormatOptions]> = {
  "5D": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "1M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "6M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "1Y": [{ month: "short", year: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
};

function niceTicks(min: number, max: number): { step: number; ticks: number[] } {
  const raw = (max - min) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return { step, ticks };
}

// "2026-10-21" as local midnight, so the label shows the same day everywhere
function parseDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

// the points of one range, oldest first
function sliceRange(prices: ChartPoint[], range: RangeKey): ChartPoint[] {
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  const end = sorted.length;

  let start: number;
  if (range === "5D") {
    start = end - 5;
  } else {
    const cutoff = new Date(parseDate(sorted[end - 1].date));
    cutoff.setMonth(cutoff.getMonth() - MONTHS[range]);
    const from = cutoff.getTime();
    start = sorted.findIndex((point) => parseDate(point.date) >= from);
  }
  // a line needs two points, whatever the range
  return sorted.slice(Math.max(Math.min(start, end - 2), 0));
}

/** Null when there are too few closes to draw a line. */
export function buildChart(prices: ChartPoint[], range: RangeKey): Chart | null {
  if (prices.length < 2) return null;

  const points = sliceRange(prices, range);
  const n = points.length;
  const last = n - 1;
  const times = points.map((point) => parseDate(point.date));
  const values = points.map((point) => point.price);

  // vertical domain, padded a little so the line never touches the edges
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo || hi * 0.01 || 1) * 0.08;
  const domainLo = lo - pad;
  const domainHi = hi + pad;
  const toPct = (v: number) => ((domainHi - v) / (domainHi - domainLo)) * 100;

  const ys = values.map(toPct);
  let line = "";
  for (let i = 0; i < n; i++) {
    line += `${i === 0 ? "M" : "L"}${((i / last) * 1000).toFixed(1)} ${ys[i].toFixed(2)}`;
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
  // label real data points so each tick sits under the close it names
  const xTicks = [0.125, 0.375, 0.625, 0.875].map((f) => {
    const i = Math.round(f * last);
    return { pct: (i / last) * 100, label: axisFormat.format(times[i]) };
  });

  return {
    times,
    values,
    ys,
    line,
    area,
    yTicks,
    xTicks,
    rising: values[last] >= values[0],
    formatTime: (ms) => tipFormat.format(ms),
  };
}
