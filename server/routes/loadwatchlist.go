package routes

import (
	"encoding/json/v2"
	"log"
	"net/http"
	"strings"
	"watchlist/cache"
	"watchlist/fmp"
)

func LoadWatchlistRoute(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("watchlist")
		if err != nil {
			w.WriteHeader(500)
			w.Write([]byte("error reading cookie on server"))
			return
		}

		log.Printf("cookie value %v", cookie.Value)

		tickers := strings.Split(cookie.Value, ",")

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
