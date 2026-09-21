// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package main

import (
	"sync"
	"time"
)

type PriceValue struct {
	Name  string
	Price float32
	// epoch time that prices expires, should refresh price when expired
	Expires int64
}

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]PriceValue // a map of all the tickers and their price data
}

func (p *Cache) saveCachedPrice(ticker string, price float32) {
	// lock before writing
	p.Mu.Lock()
	defer p.Mu.Unlock()

	// set the price
	value := p.Data[ticker]
	value.Price = price

	// set the expiration (1 min from now)
	oneMinFromNow := time.Now()
	oneMinFromNow.Add(time.Minute * 1)
	value.Expires = oneMinFromNow.Unix()

	// set the value of the map
	p.Data[ticker] = value
}

func (p *Cache) getCachedPrice(ticker string) float32 {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	t, ok := p.Data[ticker]
	if !ok {
		// ticker doesnt exist in cache
		return 0.0
	} else {
		return t.Price
	}
}
