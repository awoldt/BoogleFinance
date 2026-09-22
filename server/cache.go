// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package main

import (
	"sync"
)

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]Ticker // a map of all the tickers and their price data
}

func (p *Cache) saveTickerToCache(ticker Ticker) {
	// lock before writing
	p.Mu.Lock()
	defer p.Mu.Unlock()

	var t Ticker = Ticker{
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

func (p *Cache) getTickerFromCache(symbol string) Ticker {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	t, ok := p.Data[symbol]
	if !ok {
		// ticker doesnt exist in cache
		// price will be 0.0 which means not in cache
		return Ticker{}
	} else {
		return t
	}
}
