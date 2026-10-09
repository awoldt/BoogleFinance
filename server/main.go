package main

import (
	"watchlist/cache"
	"watchlist/fmp"
	"watchlist/routes"

	"encoding/json/v2"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main() {
	// load the env variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("error loading .env file")
	}

	// get the FMP api key
	FMP_API_KEY := os.Getenv("FMP_API_KEY")
	if FMP_API_KEY == "" {
		log.Fatal("error fmp api key is blank")
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Get("/search", routes.SearchTicker(FMP_API_KEY))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		// see if price is already cached
		hit, cachedPrice := cache.PRICE_CACHE.GetTickerFromCache("AAPL")

		var ticker fmp.Ticker
		if !hit {
			// NOT IN CACHE

			println("not in cache")
			// ticker requested was not in cache (price of 0.0)
			//  see if fmp returns result on it
			p, err := fmp.GetTickerPrice("AAPL", FMP_API_KEY)
			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte("error while loading page :("))
				return
			}

			// save to cache
			cache.PRICE_CACHE.SaveTickerToCache(p)
			ticker = p
		} else {
			//  IN CACHE
			println("in cache!")
			now := time.Now()

			// see if cache needs to be refreshd for this ticker
			if now.Unix() >= cachedPrice.Expires {
				println("EXPIRED!")
				p, err := fmp.GetTickerPrice("AAPL", FMP_API_KEY)
				if err != nil {
					w.WriteHeader(500)
					w.Write([]byte("error while loading page :("))
					return
				}

				// save price to cache
				cache.PRICE_CACHE.SaveTickerToCache(p)
				ticker = p
			}

			ticker = cachedPrice
		}

		w.Header().Add("Content-Type", "application/json")
		json.MarshalWrite(w, ticker)
	})

	http.ListenAndServe(":8080", r)
}
