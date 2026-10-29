// Builds the ticker page chart. 1D is drawn from the 5 minute prices of the
// latest trading day, laid out on the full 9:30am-4pm market session so the
// line stops short of the right edge until the market closes. Every other
// range is a slice of the daily closes the server sends (up to a year of
// them), so switching between those never needs another request.

import type { ChartPoint, IntradayPoint } from "~/lib/watchlist";

export const RANGES = ["1D", "5D", "1M", "6M", "1Y"] as const;
export type RangeKey = (typeof RANGES)[number];
type DailyRange = Exclude<RangeKey, "1D">;

export type Chart = {
  times: number[]; // epoch ms, one per point
  values: number[];
  xs: number[]; // 0-1 position of each point in the plot, 0 = left
  ys: number[]; // 0-100 position of each point in the plot, 0 = top
  line: string; // svg path, x in 0-1000, y in 0-100
  area: string;
  yTicks: { pct: number; label: string }[];
  xTicks: { pct: number; label: string }[];
  baseline: number; // what the range's change is measured against
  rising: boolean;
  formatTime: (ms: number) => string;
  /** Index of the point nearest a 0-1 plot position, -1 past the end of the data. */
  indexAt: (fraction: number) => number;
};

export type ChartData = {
  daily: ChartPoint[];
  intraday: IntradayPoint[];
  previousClose: number; // 1D is measured against this, 0 when unknown
};

type Series = {
  times: number[];
  values: number[];
  xs: number[];
};

// the regular session in minutes after midnight, the intraday timestamps are
// New York time
const OPEN = 9 * 60 + 30;
const CLOSE = 16 * 60;
const SESSION = CLOSE - OPEN;
const INTRADAY_STEP = 5; // minutes between intraday prices

// 1D axis labels, in minutes after the open
const INTRADAY_TICKS = [
  { minutes: 60, label: "10:30 AM" },
  { minutes: 150, label: "12:00 PM" },
  { minutes: 240, label: "1:30 PM" },
  { minutes: 330, label: "3:00 PM" },
];

// 5D is the last five trading days, the others reach back this many months
// from the newest close
const MONTHS: Record<Exclude<DailyRange, "5D">, number> = {
  "1M": 1,
  "6M": 6,
  "1Y": 12,
};

// axis / tooltip date formats per range
const dateFormats: Record<DailyRange, [axis: Intl.DateTimeFormatOptions, tip: Intl.DateTimeFormatOptions]> = {
  "5D": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "1M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "6M": [{ month: "short", day: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
  "1Y": [{ month: "short", year: "numeric" }, { month: "short", day: "numeric", year: "numeric" }],
};

const intradayTipFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

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
function sliceRange(prices: ChartPoint[], range: DailyRange): ChartPoint[] {
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

function dailySeries(prices: ChartPoint[], range: DailyRange): Series | null {
  if (prices.length < 2) return null;

  const points = sliceRange(prices, range);
  const last = points.length - 1;
  return {
    times: points.map((point) => parseDate(point.date)),
    values: points.map((point) => point.price),
    xs: points.map((_, i) => i / last),
  };
}

// "2026-10-29 09:35:00" -> the day, and minutes after midnight
const INTRADAY_DATE = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/;

// the session of the newest day in the prices (the server also sends the
// previous Friday on weekends), placed by time of day
function intradaySeries(prices: IntradayPoint[]): Series | null {
  const session: { date: string; minutes: number; price: number }[] = [];
  for (const point of prices) {
    const match = INTRADAY_DATE.exec(point.date);
    if (!match) continue;
    const minutes = Number(match[2]) * 60 + Number(match[3]);
    if (minutes < OPEN || minutes > CLOSE) continue; // pre/after hours
    session.push({ date: match[1], minutes, price: point.open });
  }

  const day = session.reduce((newest, p) => (p.date > newest ? p.date : newest), "");
  const today = session
    .filter((p) => p.date === day)
    .sort((a, b) => a.minutes - b.minutes);
  if (today.length < 2) return null;

  const [year, month, date] = day.split("-").map(Number);
  return {
    times: today.map((p) => new Date(year, month - 1, date, 0, p.minutes).getTime()),
    values: today.map((p) => p.price),
    xs: today.map((p) => (p.minutes - OPEN) / SESSION),
  };
}

/** Null when there are too few prices to draw a line. */
export function buildChart(range: RangeKey, data: ChartData): Chart | null {
  const series =
    range === "1D" ? intradaySeries(data.intraday) : dailySeries(data.daily, range);
  if (!series) return null;

  const { times, values, xs } = series;
  const n = values.length;
  const last = n - 1;

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
    line += `${i === 0 ? "M" : "L"}${(xs[i] * 1000).toFixed(1)} ${ys[i].toFixed(2)}`;
  }
  const area = `${line}L${(xs[last] * 1000).toFixed(1)} 100L${(xs[0] * 1000).toFixed(1)} 100Z`;

  const { step, ticks } = niceTicks(domainLo, domainHi);
  const decimals = Math.min(4, Math.max(0, -Math.floor(Math.log10(step))));
  const tickFormat = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const yTicks = ticks.map((v) => ({ pct: toPct(v), label: tickFormat.format(v) }));

  let xTicks: Chart["xTicks"];
  let formatTime: Chart["formatTime"];
  let baseline = values[0];
  let reach = 0; // how far past the last point the pointer still counts as on it
  if (range === "1D") {
    xTicks = INTRADAY_TICKS.map((tick) => ({
      pct: (tick.minutes / SESSION) * 100,
      label: tick.label,
    }));
    formatTime = (ms) => `${intradayTipFormat.format(ms)} ET`;
    if (data.previousClose > 0) baseline = data.previousClose;
    reach = INTRADAY_STEP / SESSION;
  } else {
    const [axisOptions, tipOptions] = dateFormats[range];
    const axisFormat = new Intl.DateTimeFormat("en-US", axisOptions);
    const tipFormat = new Intl.DateTimeFormat("en-US", tipOptions);
    // label real data points so each tick sits under the close it names
    xTicks = [0.125, 0.375, 0.625, 0.875].map((f) => {
      const i = Math.round(f * last);
      return { pct: xs[i] * 100, label: axisFormat.format(times[i]) };
    });
    formatTime = (ms) => tipFormat.format(ms);
  }

  const indexAt = (fraction: number) => {
    if (fraction > xs[last] + reach) return -1;
    let nearest = 0;
    for (let i = 1; i < n; i++) {
      if (Math.abs(xs[i] - fraction) < Math.abs(xs[nearest] - fraction)) nearest = i;
    }
    return nearest;
  };

  return {
    times,
    values,
    xs,
    ys,
    line,
    area,
    yTicks,
    xTicks,
    baseline,
    rising: values[last] >= baseline,
    formatTime,
    indexAt,
  };
}
