// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package main

import (
	"sync"
)

type PriceValue struct {
	Name  string
	Price float32
	// epoch time that prices expires, should refresh price when expired
	Expires int
}

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]PriceValue // a map of all the tickers and their price data
}

func (p *Cache) savePrice(ticker string, price float32) {
	// lock before writing
	p.Mu.Lock()
	defer p.Mu.Unlock()

	x := p.Data[ticker]
	x.Price = price
	p.Data[ticker] = x
}

func (p *Cache) getPrice(ticker string) float32 {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	return p.Data[ticker].Price
}
