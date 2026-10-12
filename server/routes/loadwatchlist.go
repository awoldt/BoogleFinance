package routes

import (
	"encoding/json/v2"
	"net/http"
	"watchlist/cache"
	"watchlist/fmp"
)

type LoadWatchlistRequest struct {
	Tickers []string `json:"tickers"`
}

func LoadWatchlistRoute(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")

		// the body of the request will contain all the tickers
		var body LoadWatchlistRequest
		err := json.UnmarshalRead(r.Body, &body)
		if err != nil {
			w.WriteHeader(500)
			w.Write([]byte("error while loading watchlist"))
			return
		}

		// loop through all the tickers for a users watchlist and
		// check cache, if not get the price
		var watchlistReturn []cache.Ticker
		for _, v := range body.Tickers {
			hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(v, apiKey)
			if err != nil {
				// just continue if error getting ticker
				continue
			}

			if !hit {
				// if not, search fmp for stock data
				tData, err := fmp.GetTickerQuote(v, apiKey)
				if err != nil {
					// just continue if error getting ticker
					continue
				}

				tickerData := cache.Ticker{
					Symbol:           tData.Symbol,
					Name:             tData.Name,
					Price:            tData.Price,
					Change:           tData.Change,
					ChangePercentage: tData.ChangePercentage,
					LastUpdated:      tData.Timestamp,
				}

				// save this ticker to cache
				cache.PRICE_CACHE.SaveTickerToCache(tickerData)

				watchlistReturn = append(watchlistReturn, tickerData)
			}
			watchlistReturn = append(watchlistReturn, cachedTicker)
		}

		json.MarshalWrite(w, watchlistReturn)
	}
}
