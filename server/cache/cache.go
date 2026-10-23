// THIS IS THE SINGLE MAP IN MEMORY THAT CACHES PRICE DATA
// PROTECT IT WITH A LOCK!

package cache

import (
	"fmt"
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
	ChartDetails ChartDetails `json:"chartDetails,omitzero"`
}

type Cache struct {
	Mu   sync.RWMutex
	Data map[string]Ticker // a map of all the tickers (including price and chart data)
}

type GetCacheOptions string

var PriceOnly GetCacheOptions = "price"
var ChartOnly GetCacheOptions = "chart"
var PriceAndChart GetCacheOptions = "both"

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

func (cache *Cache) GetTickerFromCache(ticker, apiKey string, options GetCacheOptions) (found bool, TickerData Ticker, err error) {
	// lock before reading
	// MAKE SURE TO UNLOCK!
	cache.Mu.RLock()

	cachedTicker, ok := cache.Data[ticker]
	cache.Mu.RUnlock() // once we read from cache, no need for this read lock anymore

	// ticker doesnt exist in cache
	if !ok {
		log.Printf("%v does not exist in cache", ticker)

		return false, Ticker{}, nil
	} else {
		log.Printf("%v found in cache!", ticker)

		now := time.Now().Unix()

		// determine if we are getting price, chart, or price+chart data
		switch options {
		case PriceOnly:
			{
				// price is expired
				if now >= cachedTicker.PriceDetails.Expires {
					err := refreshTickerPrice(&cachedTicker, apiKey)
					if err != nil {
						return true, Ticker{}, err
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
						return true, Ticker{}, err
					}

				}

				return true, cachedTicker, nil
			}
		case PriceAndChart:
			{
				var final Ticker = cachedTicker
				if now >= final.PriceDetails.Expires {
					err := refreshTickerPrice(&final, apiKey)
					if err != nil {
						return true, Ticker{}, err
					}

				}

				if now >= final.ChartDetails.Expires {
					err := refreshTickerChart(&final, apiKey)
					if err != nil {
						return true, Ticker{}, err
					}

				}

				return true, final, nil
			}

		default:
			{
				return false, Ticker{}, fmt.Errorf("%v is not valid cache option", options)
			}
		}
	}
}

func refreshTickerPrice(tickerCache *Ticker, apiKey string) (err error) {
	log.Printf("%v price cache is expired...... saving new value", tickerCache.Symbol)

	refreshedData, err := fmp.GetTickerQuote(tickerCache.Symbol, apiKey)
	if err != nil {
		log.Printf("ERROR: failed to update price cache: %v", err)
		return err
	}

	tickerCache.PriceDetails = PriceDetails{
		Price:            refreshedData.Price,
		Change:           refreshedData.Change,
		ChangePercentage: refreshedData.ChangePercentage,
		LastUpdated:      refreshedData.Timestamp,
		Expires:          time.Now().Add(time.Minute * 1).Unix(), // 1 min from time of save
	}

	// save to cache
	PRICE_CACHE.SaveTickerToCache(*tickerCache)

	return nil
}

func refreshTickerChart(tickerCache *Ticker, apiKey string) (err error) {
	log.Printf("%v chart cache is expired...... saving new value", tickerCache.Symbol)

	refreshedData, err := fmp.GetChartData(tickerCache.Symbol, apiKey)
	if err != nil {
		log.Printf("ERROR: failed to update chart cache: %v", err)
		return err
	}

	tickerCache.ChartDetails = ChartDetails{
		Prices:  refreshedData,
		Expires: time.Now().Add(time.Hour * 24).Unix(), // 24 hours from time of save
	}

	// save to cache
	PRICE_CACHE.SaveTickerToCache(*tickerCache)

	return nil
}
