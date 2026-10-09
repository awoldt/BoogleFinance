// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package cache

import (
	"sync"
	"watchlist/fmp"
)

// THIS IS THE SINGLE CACHE STRUCT THE SERVER WILL READ/WRITE FROM
var PRICE_CACHE Cache = Cache{
	Data: make(map[string]fmp.Ticker),
}

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]fmp.Ticker // a map of all the tickers and their price data
}

func (p *Cache) SaveTickerToCache(ticker fmp.Ticker) {
	// lock before writing
	p.Mu.Lock()
	defer p.Mu.Unlock()

	var t fmp.Ticker = fmp.Ticker{
		Name:             ticker.Name,
		Symbol:           ticker.Symbol,
		Price:            ticker.Price,
		Change:           ticker.Change,
		ChangePercentage: ticker.ChangePercentage,
		LastUpdated:      ticker.LastUpdated,
		Expires:          ticker.Expires,
	}

	p.Data[t.Symbol] = t
}

func (p *Cache) GetTickerFromCache(symbol string) (found bool, TickerData fmp.Ticker) {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	t, ok := p.Data[symbol]

	if !ok {
		// ticker doesnt exist in cache
		return false, fmp.Ticker{}
	} else {
		return true, t
	}
}
