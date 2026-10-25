package components

import (
	"math"
	"net/url"
	"strconv"
	"strings"

	"github.com/a-h/templ"
)

// formatNumber formats v with thousands separators, e.g. 1234.5 -> "1,234.50"
func formatNumber(v float64, decimals int) string {
	s := strconv.FormatFloat(v, 'f', decimals, 64)
	neg := strings.HasPrefix(s, "-")
	s = strings.TrimPrefix(s, "-")
	if strings.Trim(s, "0.") == "" {
		neg = false // no "-0.00"
	}

	whole, frac, hasFrac := strings.Cut(s, ".")
	var b strings.Builder
	if neg {
		b.WriteByte('-')
	}
	for i, r := range whole {
		if i > 0 && (len(whole)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(r)
	}
	if hasFrac {
		b.WriteByte('.')
		b.WriteString(frac)
	}
	return b.String()
}

// usd formats a price, e.g. 1234.5 -> "$1,234.50"
func usd(v float64) string {
	if v < 0 {
		return "-$" + formatNumber(-v, 2)
	}
	return "$" + formatNumber(v, 2)
}

// signedUSD formats a change in price, e.g. -1.5 -> "-$1.50", 2 -> "+$2.00"
func signedUSD(v float64) string {
	if v < 0 {
		return "-" + usd(-v)
	}
	return "+" + usd(v)
}

// percent formats the size of a change, e.g. -1.234 -> "1.23%" (the arrow
// next to it shows the direction)
func percent(v float64) string {
	return strconv.FormatFloat(math.Abs(v), 'f', 2, 64) + "%"
}

func directionClass(change float64) string {
	if change < 0 {
		return "text-down"
	}
	return "text-up"
}

func pillClass(change float64) string {
	if change < 0 {
		return "bg-down-bg text-down"
	}
	return "bg-up-bg text-up"
}

// tickerURL is the link to a ticker's page, e.g. "/AAPL"
func tickerURL(symbol string) templ.SafeURL {
	return templ.URL("/" + url.PathEscape(symbol))
}
