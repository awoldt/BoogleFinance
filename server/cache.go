// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package main

import (
	"sync"
	"time"
)

type PriceValue struct {
	Name    string
	Price   float32
	Expires int64 // epoch time in seconds when thsi price will expire and need to be refreshed
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
	oneMinFromNow := time.Now().Add(time.Minute * 1).Unix()
	value.Expires = oneMinFromNow

	// set the value of the map
	p.Data[ticker] = value
}

func (p *Cache) getCachedPrice(ticker string) PriceValue {
	// lock before reading
	p.Mu.RLock()
	defer p.Mu.RUnlock()

	t, ok := p.Data[ticker]
	if !ok {
		// ticker doesnt exist in cache
		// price will be 0.0 which means not in cache
		return PriceValue{}
	} else {
		return t
	}
}
