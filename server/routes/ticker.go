package routes

import (
	"encoding/json/v2"
	"log"
	"net/http"
	"strings"
	"time"
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
			// if not, search fmp for stock data (chart + price)
			priceData, err := fmp.GetTickerQuote(ticker, apiKey)
			if err != nil {
				w.WriteHeader(404)
				w.Write([]byte("could not find ticker :("))
				return
			}

			chartData, err := fmp.GetChartData(ticker, apiKey)
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
					Expires:          time.Now().Add(time.Minute * 1).Unix(), // 1 min from time of save
				},
				ChartDetails: cache.ChartDetails{
					Prices:  chartData,
					Expires: time.Now().Add(time.Hour * 24).Unix(), // 24 hours from time of save
				},
			}

			// save this ticker to cache
			cache.PRICE_CACHE.SaveTickerToCache(tickerData)

			json.MarshalWrite(w, tickerData)
			return
		}

		json.MarshalWrite(w, cachedTicker)
	}
}
