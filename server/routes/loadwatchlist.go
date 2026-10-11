package routes

import (
	"encoding/json/v2"
	"net/http"
	"watchlist/cache"
	"watchlist/fmp"
)

func LoadWatchlistRoute(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")

		// the tickers will be sent like this: ?ticker=AAPL&ticker=AMZN&ticker=PYPL
		// will return a map with ALL the ticker values for each url param key
		query := r.URL.Query()
		tickers := query["ticker"]

		// loop through all the tickers for a users watchlist and
		// check cache, if not get the price
		var watchlistReturn []fmp.Ticker
		for _, v := range tickers {
			hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(v, apiKey)
			if err != nil {
				// just continue if error getting ticker
				continue
			}

			if !hit {
				// if not, search fmp for stock data
				tData, err := fmp.GetTickerPrice(v, apiKey)
				if err != nil {
					// just continue if error getting ticker
					continue
				}

				// save this ticker to cache
				cache.PRICE_CACHE.SaveTickerToCache(tData)

				watchlistReturn = append(watchlistReturn, tData)
			}
			watchlistReturn = append(watchlistReturn, cachedTicker)
		}

		json.MarshalWrite(w, watchlistReturn)
	}
}
