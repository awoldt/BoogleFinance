package routes

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"watchlist/cache"
	"watchlist/components"
	"watchlist/fmp"
	"watchlist/models"
)

// HomePage renders the watchlist saved in the "watchlist" cookie
func HomePage(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var tickers []models.Ticker
		var failed bool
		for _, symbol := range watchlistFromCookie(r) {
			ticker, err := loadQuote(symbol, apiKey)
			if errors.Is(err, fmp.ErrTickerNotFound) {
				continue // nothing to show for a ticker that doesnt exist
			}
			if err != nil {
				log.Printf("error while loading %v for the watchlist %v", symbol, err)
				failed = true
				continue
			}
			tickers = append(tickers, ticker)
		}

		// the page depends on the cookie, never serve a stale copy
		w.Header().Set("Cache-Control", "no-store")
		renderPage(w, r, http.StatusOK, components.Index(tickers, failed))
	}
}

// the cookie holds the symbols comma separated and url encoded ("AAPL%2CTSLA"),
// in the order they were added
func watchlistFromCookie(r *http.Request) []string {
	cookie, err := r.Cookie("watchlist")
	if err != nil {
		return nil
	}
	value, err := url.QueryUnescape(cookie.Value)
	if err != nil {
		return nil
	}

	var symbols []string
	for symbol := range strings.SplitSeq(value, ",") {
		symbol = strings.ToUpper(strings.TrimSpace(symbol))
		if symbol != "" && !slices.Contains(symbols, symbol) {
			symbols = append(symbols, symbol)
		}
	}
	return symbols
}

// loadQuote gets a ticker's price (no chart) from the cache, or FMP when it
// isnt cached yet
func loadQuote(symbol, apiKey string) (models.Ticker, error) {
	hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(symbol, apiKey, cache.PriceOnly)
	if err != nil {
		return models.Ticker{}, err
	}
	if hit {
		return cachedTicker, nil
	}

	priceData, err := fmp.GetTickerQuote(symbol, apiKey)
	if err != nil {
		return models.Ticker{}, err
	}

	// dont set chart data, the ticker page fills it in when its opened
	tickerData := models.Ticker{
		Symbol:       priceData.Symbol,
		Name:         priceData.Name,
		PriceDetails: priceDetails(priceData),
	}
	cache.PRICE_CACHE.SaveTickerToCache(tickerData)
	return tickerData, nil
}
