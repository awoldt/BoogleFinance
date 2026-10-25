package routes

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
	"watchlist/cache"
	"watchlist/components"
	"watchlist/fmp"
	"watchlist/models"

	"github.com/go-chi/chi/v5"
)

// TickerPage renders a ticker's price and chart (/AAPL)
func TickerPage(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		symbol, err := url.PathUnescape(chi.URLParam(r, "ticker"))
		if err != nil || symbol == "" {
			renderPage(w, r, http.StatusNotFound, components.TickerNotFound(chi.URLParam(r, "ticker")))
			return
		}
		symbol = strings.ToUpper(symbol)

		ticker, err := loadTicker(symbol, apiKey)
		if errors.Is(err, fmp.ErrTickerNotFound) {
			renderPage(w, r, http.StatusNotFound, components.TickerNotFound(symbol))
			return
		}
		if err != nil {
			log.Printf("error while loading %v for its page %v", symbol, err)
			renderPage(w, r, http.StatusInternalServerError, components.TickerFailed(symbol))
			return
		}

		renderPage(w, r, http.StatusOK, components.Ticker(ticker))
	}
}

// loadTicker gets a ticker's price and chart from the cache, or FMP when it
// isnt cached yet
func loadTicker(symbol, apiKey string) (models.Ticker, error) {
	hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(symbol, apiKey, cache.PriceAndChart)
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

	historicalChartData, err := fmp.GetHistoricalChartData(symbol, apiKey)
	if err != nil {
		// dont throw error on getting chart data, the page says its unavailable
		log.Printf("error while getting chart data on new ticker fetch %v", err)
	}

	tickerData := models.Ticker{
		Symbol:       priceData.Symbol,
		Name:         priceData.Name,
		PriceDetails: priceDetails(priceData),
		ChartDetails: models.ChartDetails{
			Prices:  historicalChartData,
			Expires: time.Now().Add(cache.CHART_TTL).Unix(),
		},
	}
	cache.PRICE_CACHE.SaveTickerToCache(tickerData)
	return tickerData, nil
}
