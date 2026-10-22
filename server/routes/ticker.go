package routes

import (
	"encoding/json/v2"
	"net/http"
	"strings"
	"watchlist/cache"
	"watchlist/fmp"
)

func TickerRoute(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")

		ticker := r.URL.Query().Get("ticker")
		if ticker == "" {
			w.WriteHeader(400)
			w.Write([]byte("missing ticker in url query"))
			return
		}
		ticker = strings.ToUpper(ticker)

		// check if we have this ticker stored in the cache
		hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(ticker, apiKey)
		if err != nil {
			w.WriteHeader(500)
			w.Write([]byte("error while getting ticker details :("))
			return
		}

		if !hit {
			// if not, search fmp for stock data
			tData, err := fmp.GetTickerQuote(ticker, apiKey)
			if err != nil {
				w.WriteHeader(404)
				w.Write([]byte("could not find ticker :("))
				return
			}

			tickerData := cache.Ticker{
				Symbol: tData.Symbol,
				Name:   tData.Name,
				PriceDetails: cache.PriceDetails{
					Price:            tData.Price,
					Change:           tData.Change,
					ChangePercentage: tData.ChangePercentage,
					LastUpdated:      tData.Timestamp,
				},
			}

			// save this ticker to cache
			cache.PRICE_CACHE.SaveTickerToCache(tickerData)

			json.MarshalWrite(w, tData)
			return
		}

		json.MarshalWrite(w, cachedTicker)
	}
}
