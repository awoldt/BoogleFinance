package routes

import (
	"encoding/json/v2"
	"net/http"
	"watchlist/cache"
	"watchlist/fmp"
)

func SearchTicker(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		w.Header().Add("Content-Type", "application/json")

		// check if we have this ticker stored in the cache
		hit, cachedTicker := cache.PRICE_CACHE.GetTickerFromCache("AAPL")

		if !hit {
			// if not, search fmp for stock data
			tData, err := fmp.GetTickerPrice("GOOGL", apiKey)
			if err != nil {
				w.WriteHeader(404)
				w.Write([]byte("could not find ticker :("))
				return
			}

			json.MarshalWrite(w, tData)
			return
		}

		json.MarshalWrite(w, cachedTicker)
	}
}
