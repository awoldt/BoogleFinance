package routes

import (
	"encoding/json/v2"
	"log"
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
				priceData, err := fmp.GetTickerQuote(v, apiKey)
				if err != nil {
					w.WriteHeader(404)
					w.Write([]byte("could not find ticker :("))
					return
				}

				chartData, err := fmp.GetChartData(v, apiKey)
				if err != nil {
					// dont throw error on getting chart data
					log.Printf("error while getting chart data on new ticker fetch %v", err)
				}

				tickerData := cache.Ticker{
					Symbol: priceData.Symbol,
					Name:   priceData.Name,
					PriceDetails: cache.PriceDetails{
						Price:            priceData.Price,
						Change:           priceData.Change,
						ChangePercentage: priceData.ChangePercentage,
						LastUpdated:      priceData.Timestamp,
					},
					ChartDetails: cache.ChartDetails{
						Prices: chartData,
					},
				}

				// save this ticker to cache
				cache.PRICE_CACHE.SaveTickerToCache(tickerData)

				watchlistReturn = append(watchlistReturn, tickerData)
			} else {
				watchlistReturn = append(watchlistReturn, cachedTicker)
			}

		}

		json.MarshalWrite(w, watchlistReturn)
	}
}
