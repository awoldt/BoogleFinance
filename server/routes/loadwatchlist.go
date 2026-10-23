package routes

import (
	"encoding/json/v2"
	"net/http"
	"time"
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
			hit, cachedTicker, err := cache.PRICE_CACHE.GetTickerFromCache(v, apiKey, cache.PriceOnly)
			if err != nil {
				// just continue if error getting ticker
				continue
			}

			if !hit {
				// if not, search fmp for stock data
				priceData, err := fmp.GetTickerQuote(v, apiKey)
				if err != nil {
					w.WriteHeader(404)
					w.Write([]byte("could not find ticker :("))
					return
				}

				// dont set chart data and let be 0 value (saved payload size)
				tickerData := cache.Ticker{
					Symbol: priceData.Symbol,
					Name:   priceData.Name,
					PriceDetails: cache.PriceDetails{
						Price:            priceData.Price,
						Change:           priceData.Change,
						ChangePercentage: priceData.ChangePercentage,
						LastUpdated:      priceData.Timestamp,
						Expires:          time.Now().Add(time.Minute * 1).Unix(), // 1 min from time of save
					},
				}

				// save this ticker to cache
				cache.PRICE_CACHE.SaveTickerToCache(tickerData)
				watchlistReturn = append(watchlistReturn, tickerData)
			} else {
				// dont set chart data and let be 0 value (saved payload size)
				cachedTicker.ChartDetails = cache.ChartDetails{}

				watchlistReturn = append(watchlistReturn, cachedTicker)
			}

		}

		json.MarshalWrite(w, watchlistReturn)
	}
}
