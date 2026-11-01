import { useMemo, useRef, useState } from "react";
import {
  buildChart,
  RANGES,
  type Chart,
  type RangeKey,
} from "~/lib/chart-data";
import { ArrowIcon } from "~/components/icons";
import type { Direction } from "~/data/markets";
import { directionClass, pillClass, usd } from "~/lib/format";
import type { ChartPoint, IntradayPoint } from "~/lib/watchlist";

type Props = {
  symbol: string;
  price: number; // latest price, the end of what each range is measured against
  change: number; // today's change, which puts the previous close at price - change
  prices: ChartPoint[];
  intraday: IntradayPoint[];
};

const RANGE_LABELS: Record<RangeKey, string> = {
  "1D": "today",
  "5D": "past 5 days",
  "1M": "past month",
  "6M": "past 6 months",
  "1Y": "past year",
};

export function PriceChart({ symbol, price, change, prices, intraday }: Props) {
  const [range, setRange] = useState<RangeKey>("1D");
  // every range is a slice of the prices already in the browser
  const chart = useMemo(
    () =>
      buildChart(range, {
        daily: prices,
        intraday,
        previousClose: price - change,
      }),
    [prices, intraday, price, change, range],
  );

  if (prices.length < 2 && intraday.length < 2) {
    return (
      <p className="mt-6 text-sm text-muted">Chart data isn’t available.</p>
    );
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-1">
        <div
          role="tablist"
          aria-label="Chart range"
          className="flex flex-wrap gap-x-5 gap-y-1"
        >
          {RANGES.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === range}
              onClick={() => setRange(key)}
              className={`border-b-2 py-2 text-sm font-medium ${
                key === range
                  ? "border-link text-link"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {chart && (
          <RangeChange
            from={chart.baseline}
            to={price}
            label={RANGE_LABELS[range]}
          />
        )}
      </div>

      {chart ? (
        <>
          {/* keyed so a new range starts with the hover state cleared */}
          <ChartPlot key={range} symbol={symbol} chart={chart} />
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">
          {range === "1D"
            ? "No trading data for today yet."
            : "Chart data isn’t available."}
        </p>
      )}
    </div>
  );
}

/** How far the price moved from the start of the range to the latest price. */
function RangeChange({
  from,
  to,
  label,
}: {
  from: number;
  to: number;
  label: string;
}) {
  if (!(from > 0)) return null;

  const change = to - from;
  const direction: Direction = change < 0 ? "down" : "up";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm tabular-nums">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 font-medium ${pillClass(direction)}`}
      >
        <ArrowIcon direction={direction} />
        {Math.abs((change / from) * 100).toFixed(2)}%
      </span>
      <span className={directionClass(direction)}>
        {change < 0 ? "-" : "+"}
        {usd.format(Math.abs(change))}
      </span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

/**
 * Line chart drawn as one SVG path (no chart library). The hover state is
 * written straight to the DOM from the pointer handler, so scrubbing never
 * triggers a React render.
 */
function ChartPlot({ symbol, chart }: { symbol: string; chart: Chart }) {
  const plotRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipPriceRef = useRef<HTMLSpanElement>(null);
  const tipDateRef = useRef<HTMLSpanElement>(null);
  const active = useRef(-1); // index being inspected, -1 when hidden

  const last = chart.values.length - 1;

  function show(index: number) {
    const plot = plotRef.current;
    const hover = hoverRef.current;
    const tip = tipRef.current;
    if (
      !plot ||
      !hover ||
      !tip ||
      !tipPriceRef.current ||
      !tipDateRef.current
    ) {
      return;
    }
    active.current = index;
    const width = plot.clientWidth;
    const x = chart.xs[index] * width;

    hover.style.setProperty("--x", `${x}px`);
    hover.style.setProperty("--y", `${chart.ys[index]}%`);
    tipPriceRef.current.textContent = usd.format(chart.values[index]);
    tipDateRef.current.textContent = chart.formatTime(chart.times[index]);
    tip.style.left = `${Math.min(Math.max(x - tip.offsetWidth / 2, 0), width - tip.offsetWidth)}px`;
    hover.style.visibility = "visible";
  }

  function hide() {
    active.current = -1;
    if (hoverRef.current) hoverRef.current.style.visibility = "hidden";
  }

  function onPointer(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    const index = chart.indexAt(fraction);
    if (index < 0) hide();
    else show(index);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = active.current < 0 ? last : active.current;
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
        next = Math.max(current - 1, 0);
        break;
      case "ArrowRight":
        next = Math.min(current + 1, last);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Escape":
        hide();
        return;
      default:
        return;
    }
    event.preventDefault();
    show(next);
  }

  return (
    <div
      className={`mt-4 pr-1 pb-7 pl-12 sm:pl-14 ${chart.rising ? "text-up" : "text-down"}`}
    >
      <div
        ref={plotRef}
        tabIndex={0}
        aria-label={`${symbol} price chart. Use the left and right arrow keys to inspect values.`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={hide}
        onKeyDown={onKeyDown}
        onBlur={hide}
        className="relative h-64 cursor-crosshair touch-pan-y outline-none select-none focus-visible:ring-2 focus-visible:ring-link sm:h-80"
      >
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="chart-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chart.yTicks.map((tick) => (
            <line
              key={tick.label}
              x1="0"
              x2="1000"
              y1={tick.pct}
              y2={tick.pct}
              vectorEffect="non-scaling-stroke"
              className="stroke-line"
            />
          ))}
          <path d={chart.area} fill="url(#chart-fade)" />
          <path
            d={chart.line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {chart.yTicks.map((tick) => (
          <span
            key={tick.label}
            style={{ top: `${tick.pct}%` }}
            className="pointer-events-none absolute right-full -translate-y-1/2 pr-2 text-xs tabular-nums text-muted"
          >
            {tick.label}
          </span>
        ))}
        {chart.xTicks.map((tick, i) => (
          <span
            key={tick.pct}
            style={{ left: `${tick.pct}%` }}
            className={`pointer-events-none absolute top-full -translate-x-1/2 pt-2 text-xs whitespace-nowrap text-muted ${i % 2 === 1 ? "max-sm:hidden" : ""}`}
          >
            {tick.label}
          </span>
        ))}

        <div
          ref={hoverRef}
          style={{ visibility: "hidden" }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            style={{ left: "var(--x)" }}
            className="absolute top-0 bottom-0 w-px bg-line-strong"
          />
          <div
            style={{ left: "var(--x)", top: "var(--y)" }}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-canvas"
          />
          <div
            ref={tipRef}
            className="absolute top-1 rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[var(--shadow)]"
          >
            <span
              ref={tipPriceRef}
              className="block font-medium tabular-nums text-ink"
            />
            <span ref={tipDateRef} className="block text-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
