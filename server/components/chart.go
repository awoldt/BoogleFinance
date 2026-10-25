// Builds the ticker page chart from the daily closes the server has for a
// ticker (up to a year of them). Every range is just a slice of that one
// list, so all of them are rendered up front and switching ranges in the
// browser only shows a different one.

package components

import (
	"encoding/json"
	"fmt"
	"math"
	"slices"
	"strings"
	"time"
	"watchlist/models"
)

type chartRange struct {
	Key    string
	Label  string
	Months int // how far back from the newest close, 0 = last five trading days
}

var chartRanges = []chartRange{
	{"5D", "past 5 days", 0},
	{"1M", "past month", 1},
	{"6M", "past 6 months", 6},
	{"1Y", "past year", 12},
}

const defaultRange = "1M"

type chartTick struct {
	Pct   float64 // 0-100 position along the axis
	Label string
}

type chart struct {
	chartRange
	Start  int     // index of the range's first point in chartData.Points
	First  float64 // first close of the range
	Lo, Hi float64 // vertical domain, Hi is the top of the plot
	Line   string  // svg path, x in 0-1000, y in 0-100
	Area   string
	YTicks []chartTick
	XTicks []chartTick
	Rising bool
}

type chartData struct {
	// every close oldest first as [price, "$1.00", "Jan 2, 2006"], read by the
	// browser to show the hover tooltip
	Points string
	Ranges []chart
}

type chartPoint struct {
	t time.Time
	v float64
}

// buildChartData returns false when there are too few closes to draw a line
func buildChartData(prices []models.ChartDataResult) (chartData, bool) {
	points := make([]chartPoint, 0, len(prices))
	for _, p := range prices {
		t, err := time.Parse(time.DateOnly, p.Date)
		if err != nil {
			continue
		}
		points = append(points, chartPoint{t, float64(p.Price)})
	}
	if len(points) < 2 {
		return chartData{}, false
	}
	// the server keeps them newest first
	slices.SortFunc(points, func(a, b chartPoint) int { return a.t.Compare(b.t) })

	tips := make([][3]any, len(points))
	for i, p := range points {
		// rounded, the float32 prices carry noise like 1439.7113037109375
		tips[i] = [3]any{math.Round(p.v*1e4) / 1e4, usd(p.v), p.t.Format("Jan 2, 2006")}
	}
	encoded, err := json.Marshal(tips)
	if err != nil {
		return chartData{}, false
	}

	data := chartData{Points: string(encoded)}
	for _, r := range chartRanges {
		data.Ranges = append(data.Ranges, buildChart(points, r))
	}
	return data, true
}

// index of the first point in a range
func rangeStart(points []chartPoint, r chartRange) int {
	end := len(points)
	start := end - 5
	if r.Months > 0 {
		cutoff := points[end-1].t.AddDate(0, -r.Months, 0)
		start = slices.IndexFunc(points, func(p chartPoint) bool { return !p.t.Before(cutoff) })
	}
	// a line needs two points, whatever the range
	return max(min(start, end-2), 0)
}

func buildChart(all []chartPoint, r chartRange) chart {
	start := rangeStart(all, r)
	points := all[start:]
	last := len(points) - 1

	// vertical domain, padded a little so the line never touches the edges
	lo, hi := points[0].v, points[0].v
	for _, p := range points {
		lo, hi = min(lo, p.v), max(hi, p.v)
	}
	pad := hi - lo
	if pad == 0 {
		pad = hi * 0.01
	}
	if pad == 0 {
		pad = 1
	}
	pad *= 0.08
	domainLo, domainHi := lo-pad, hi+pad
	toPct := func(v float64) float64 { return (domainHi - v) / (domainHi - domainLo) * 100 }

	var line strings.Builder
	for i, p := range points {
		cmd := "L"
		if i == 0 {
			cmd = "M"
		}
		fmt.Fprintf(&line, "%s%.1f %.2f", cmd, float64(i)/float64(last)*1000, toPct(p.v))
	}

	step, ticks := niceTicks(domainLo, domainHi)
	decimals := min(4, max(0, -int(math.Floor(math.Log10(step)))))
	yTicks := make([]chartTick, len(ticks))
	for i, v := range ticks {
		yTicks[i] = chartTick{toPct(v), formatNumber(v, decimals)}
	}

	axisLayout := "Jan 2"
	if r.Key == "1Y" {
		axisLayout = "Jan 2006"
	}
	// label real data points so each tick sits under the close it names
	var xTicks []chartTick
	for _, f := range []float64{0.125, 0.375, 0.625, 0.875} {
		i := int(math.Round(f * float64(last)))
		xTicks = append(xTicks, chartTick{float64(i) / float64(last) * 100, points[i].t.Format(axisLayout)})
	}

	return chart{
		chartRange: r,
		Start:      start,
		First:      points[0].v,
		Lo:         domainLo,
		Hi:         domainHi,
		Line:       line.String(),
		Area:       line.String() + "L1000 100L0 100Z",
		YTicks:     yTicks,
		XTicks:     xTicks,
		Rising:     points[last].v >= points[0].v,
	}
}

// about four evenly spaced round numbers between min and max
func niceTicks(lo, hi float64) (float64, []float64) {
	raw := (hi - lo) / 4
	mag := math.Pow(10, math.Floor(math.Log10(raw)))
	norm := raw / mag
	var step float64
	switch {
	case norm < 1.5:
		step = mag
	case norm < 3:
		step = 2 * mag
	case norm < 7:
		step = 5 * mag
	default:
		step = 10 * mag
	}
	var ticks []float64
	for v := math.Ceil(lo/step) * step; v <= hi; v += step {
		ticks = append(ticks, v)
	}
	return step, ticks
}

// pct formats a 0-100 position for svg attributes and inline styles
func pct(v float64) string {
	return fmt.Sprintf("%.2f", v)
}
