// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package main

import "sync"

type PriceCache map[string]float32

type Cache struct {
	Mu   sync.RWMutex
	Data PriceCache
}

var PRICE_CACHE = make(PriceCache)

func (p *Cache) savePrice(ticker string, price float32) {
	// lock before writing
	p.Mu.Lock()
	defer p.Mu.Unlock()

	p.Data[ticker] = price
}

func (p *Cache) getPrice(ticker string) float32 {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	return p.Data[ticker]
}
