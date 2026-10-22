// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package cache

import (
	"log"
	"sync"
	"time"
	"watchlist/fmp"
)

type PriceDetails struct {
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	LastUpdated      int     `json:"timestamp"` // epoch time in seconds when this tickers price was last updated by FMP
	Expires          int64   `json:"expires"`   // epoch in seconds when to ping FMP to refresh this ticker's price data
}

type ChartDetails struct {
	Prices  []fmp.ChartDataResult `json:"prices"`
	Expires int64                 `json:"expires"` // epoch in seconds when to ping FMP to refresh this ticker's chart data
}

type Ticker struct {
	Name         string       `json:"name"`
	Symbol       string       `json:"symbol"`
	PriceDetails PriceDetails `json:"priceDetails"`
	ChartDetails ChartDetails `json:"chartDetails"`
}

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]Ticker // a map of all the tickers (including price and chart data)
}

// THIS IS THE SINGLE CACHE STRUCT THE SERVER WILL READ/WRITE FROM
var PRICE_CACHE Cache = Cache{
	Data: make(map[string]Ticker),
}

func (cache *Cache) SaveTickerToCache(ticker Ticker) {
	// lock before writing
	cache.Mu.Lock()
	defer cache.Mu.Unlock()

	var t Ticker = Ticker{
		Name:   ticker.Name,
		Symbol: ticker.Symbol,
		PriceDetails: PriceDetails{
			Price:            ticker.PriceDetails.Price,
			Change:           ticker.PriceDetails.Change,
			ChangePercentage: ticker.PriceDetails.ChangePercentage,
			LastUpdated:      ticker.PriceDetails.LastUpdated,
			Expires:          ticker.PriceDetails.Expires,
		},
		ChartDetails: ChartDetails{
			Prices:  ticker.ChartDetails.Prices,
			Expires: ticker.ChartDetails.Expires,
		},
	}

	cache.Data[t.Symbol] = t
	log.Printf("saved %v to cache", ticker.Symbol)
}

func (cache *Cache) GetTickerFromCache(ticker, apiKey string) (found bool, TickerData Ticker, err error) {
	// lock before reading
	// MAKE SURE TO UNLOCK!
	cache.Mu.RLock()

	cachedTicker, ok := cache.Data[ticker]
	cache.Mu.RUnlock() // once we read from cache, no need for this read lock anymore

	if !ok {
		// ticker doesnt exist in cache
		log.Printf("%v does not exist in cache", ticker)

		return false, Ticker{}, nil
	} else {
		// ticker does exist
		// check if the cache is expired

		log.Printf("%v found in cache!", ticker)

		now := time.Now().Unix()

		var tickerData Ticker = cachedTicker

		// check price cache
		if now >= cachedTicker.PriceDetails.Expires {
			// expired
			// refetch data from fmp and save new cache
			log.Printf("%v cached is expired...... saving new cache record", ticker)

			refreshedData, err := fmp.GetTickerQuote(ticker, apiKey)
			if err != nil {
				log.Printf("ERROR: failed to update cache with new ticker price: %v", err)

				return true, Ticker{}, err
			}

			tickerData = Ticker{
				Symbol: refreshedData.Symbol,
				Name:   refreshedData.Name,
				PriceDetails: PriceDetails{
					Price:            refreshedData.Price,
					Change:           refreshedData.Change,
					ChangePercentage: refreshedData.ChangePercentage,
					LastUpdated:      refreshedData.Timestamp,
					Expires:          time.Now().Add(time.Minute * 1).Unix(), // 1 min from time of save
				},
				ChartDetails: ChartDetails{
					Prices:  cachedTicker.ChartDetails.Prices,
					Expires: cachedTicker.ChartDetails.Expires,
				},
			}

			cache.SaveTickerToCache(tickerData)
		}

		// check chart cache
		if now >= cachedTicker.ChartDetails.Expires {
			// expired
			// refetch chart data
			refreshedData, err := fmp.GetChartData(ticker, apiKey)
			if err != nil {
				log.Printf("ERROR: failed to update cache with new ticker chart data: %v", err)

				return true, Ticker{}, err
			}

			tickerData = Ticker{
				Symbol:       tickerData.Symbol,
				Name:         tickerData.Name,
				PriceDetails: tickerData.PriceDetails,
				ChartDetails: ChartDetails{
					Prices:  refreshedData,
					Expires: time.Now().Add(time.Hour * 24).Unix(), // 24 hours from time of save
				},
			}

			cache.SaveTickerToCache(tickerData)
		}

		return true, tickerData, nil
	}
}
