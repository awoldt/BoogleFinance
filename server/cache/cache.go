// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package cache

import (
	"log"
	"sync"
	"time"
	"watchlist/fmp"
)

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]fmp.Ticker // a map of all the tickers and their price data
}

// THIS IS THE SINGLE CACHE STRUCT THE SERVER WILL READ/WRITE FROM
var PRICE_CACHE Cache = Cache{
	Data: make(map[string]fmp.Ticker),
}

func (cache *Cache) SaveTickerToCache(ticker fmp.Ticker) {
	// lock before writing
	cache.Mu.Lock()
	defer cache.Mu.Unlock()

	var t fmp.Ticker = fmp.Ticker{
		Name:             ticker.Name,
		Symbol:           ticker.Symbol,
		Price:            ticker.Price,
		Change:           ticker.Change,
		ChangePercentage: ticker.ChangePercentage,
		LastUpdated:      ticker.LastUpdated,
		Expires:          time.Now().Add(time.Minute * 1).Unix(), // 1 min from time of save
	}

	cache.Data[t.Symbol] = t
	log.Printf("saved %v to cache", ticker.Symbol)
}

func (cache *Cache) GetTickerFromCache(ticker, apiKey string) (found bool, TickerData fmp.Ticker, err error) {
	// lock before reading
	// MAKE SURE TO UNLOCK!
	cache.Mu.RLock()

	t, ok := cache.Data[ticker]

	if !ok {
		// ticker doesnt exist in cache
		log.Printf("%v does not exist in cache", ticker)
		cache.Mu.RUnlock()

		return false, fmp.Ticker{}, nil
	} else {
		// ticker does exist
		// check if the cache is expired

		log.Printf("%v found in cache!", ticker)

		now := time.Now().Unix()
		if now >= t.Expires {
			// expired
			// refetch data from fmp and save new cache
			log.Printf("%v cached is expired...... saving new cache record", ticker)

			refreshedData, err := fmp.GetTickerPrice(ticker, apiKey)
			if err != nil {
				log.Printf("ERROR: failed to update cache with new ticker price: %v", err)
				cache.Mu.RUnlock()
				return true, fmp.Ticker{}, err
			}

			cache.Mu.RUnlock() // unlock the cache read so a write can happen
			cache.SaveTickerToCache(refreshedData)
			return true, refreshedData, nil
		}

		cache.Mu.RUnlock()
		return true, t, nil
	}
}
