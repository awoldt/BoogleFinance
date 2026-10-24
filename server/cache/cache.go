// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package cache

import (
	"fmt"
	"log"
	"sync"
	"time"
	"watchlist/fmp"
	"watchlist/models"
)

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]models.Ticker // a map of all the tickers (including price and chart data)
}

type GetCacheOptions string

var PriceOnly GetCacheOptions = "price"
var ChartOnly GetCacheOptions = "chart"
var PriceAndChart GetCacheOptions = "both"

// THIS IS THE SINGLE CACHE STRUCT THE SERVER WILL READ/WRITE FROM
var PRICE_CACHE Cache = Cache{
	Data: make(map[string]models.Ticker),
}

func (cache *Cache) SaveTickerToCache(ticker models.Ticker) {
	// lock before writing
	cache.Mu.Lock()
	defer cache.Mu.Unlock()

	var t models.Ticker = models.Ticker{
		Name:   ticker.Name,
		Symbol: ticker.Symbol,
		PriceDetails: models.PriceDetails{
			Price:            ticker.PriceDetails.Price,
			Change:           ticker.PriceDetails.Change,
			ChangePercentage: ticker.PriceDetails.ChangePercentage,
			LastUpdated:      ticker.PriceDetails.LastUpdated,
			Expires:          ticker.PriceDetails.Expires,
		},
		ChartDetails: models.ChartDetails{
			Prices:  ticker.ChartDetails.Prices,
			Expires: ticker.ChartDetails.Expires,
		},
	}

	cache.Data[t.Symbol] = t
	log.Printf("saved %v to cache", ticker.Symbol)
}

func (cache *Cache) GetTickerFromCache(ticker, apiKey string, options GetCacheOptions) (found bool, TickerData models.Ticker, err error) {
	cache.Mu.RLock() // lock before reading
	cachedTicker, inCache := cache.Data[ticker]
	cache.Mu.RUnlock() // once we read from cache, no need for this read lock anymore

	switch inCache {
	case false:
		log.Printf("%v does not exist in cache", ticker)
		return false, models.Ticker{}, nil
	case true:
		log.Printf("%v found in cache!", ticker)
		now := time.Now().Unix()

		// determine if we are getting price, chart, or price+chart data
		switch options {
		case PriceOnly:
			{
				// price is expired
				if now >= cachedTicker.PriceDetails.Expires {
					refreshedPrice, err := fmp.GetTickerQuote(ticker, apiKey)
					if err != nil {
						return true, models.Ticker{}, err
					}



				}

				return true, cachedTicker, nil
			}
		case ChartOnly:
			{
				// chart is expired
				if now >= cachedTicker.ChartDetails.Expires {
					err := refreshTickerChart(&cachedTicker, apiKey)
					if err != nil {
						return true, models.Ticker{}, err
					}

				}

				return true, cachedTicker, nil
			}
		case PriceAndChart:
			{
				var final models.Ticker = cachedTicker
				if now >= final.PriceDetails.Expires {
					err := refreshTickerPrice(&final, apiKey)
					if err != nil {
						return true, models.Ticker{}, err
					}

				}

				if now >= final.ChartDetails.Expires {
					err := refreshTickerChart(&final, apiKey)
					if err != nil {
						return true, models.Ticker{}, err
					}

				}

				return true, final, nil
			}

		default:
			{
				return false, models.Ticker{}, fmt.Errorf("%v is not valid cache option", options)
			}
		}
	}

}

func updateTickerPrice(t models.Ticker, ) error {
	t.PriceDetails = models.PriceDetails{
		Price: ,
	}
}