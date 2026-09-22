package main

import (
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
	err := godotenv.Load()
	if err != nil {
		log.Fatal("error loading .env file")
	}

	FMP_API_KEY := os.Getenv("FMP_API_KEY")
	if FMP_API_KEY == "" {
		log.Fatal("error fmp api key is blank")

	}

	var PRICE_CACHE Cache = Cache{
		Data: make(map[string]PriceValue),
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		// see if price is already cached
		cachedPrice := PRICE_CACHE.getCachedPrice("AAPL")

		var ticker Ticker
		if cachedPrice.Price == 0.0 {
			// NOT IN CACHE

			println("not in cache")
			// ticker requested was not in cache (price of 0.0)
			//  see if fmp returns result on it
			p, err := getPrice("AAPL", FMP_API_KEY)
			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte("error while loading page :("))
				return
			}

			// save price to cache
			PRICE_CACHE.saveCachedPrice("AAPL", p.Price)
			ticker = p
		} else {
			//  IN CACHE

			println("in cache!")
			now := time.Now()
			if now.Unix() >= cachedPrice.Expires {
				println("EXPIRED!")
				// price has expired
				// fetch new price
				p, err := getPrice("AAPL", FMP_API_KEY)
				if err != nil {
					w.WriteHeader(500)
					w.Write([]byte("error while loading page :("))
					return
				}

				// save price to cache
				PRICE_CACHE.saveCachedPrice("AAPL", p.Price)
				ticker = p
			}
		}

		w.Header().Add("Content-Type", "application/json")
		json.MarshalWrite(w, ticker)
	})

	http.ListenAndServe(":8080", r)
}
