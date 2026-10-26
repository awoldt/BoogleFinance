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

const PRICE_TTL = time.Minute
const CHART_TTL = time.Hour * 24

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
			HistoricalChart: models.HistoricalChart{Prices: ticker.ChartDetails.HistoricalChart.Prices,
				Expires: ticker.ChartDetails.HistoricalChart.Expires},
		},
	}

	cache.Data[t.Symbol] = t
	log.Printf("saved %v to cache", ticker.Symbol)
}

func (cache *Cache) GetTickerFromCache(ticker, apiKey string, options GetCacheOptions) (found bool, TickerData models.Ticker, err error) {
	cache.Mu.RLock() // lock before reading
	cachedTicker, inCache := cache.Data[ticker]
	cache.Mu.RUnlock() // once we read from cache, no need for this read lock anymore

	if !inCache {
		log.Printf("%v does not exist in cache", ticker)
		return false, models.Ticker{}, nil
	}

	log.Printf("%v found in cache!", ticker)
	now := time.Now().Unix()

	// determine if we are getting price, chart, or price+chart data
	// some routes can save time if only need to grab price for exmaple....
	// no need to check/refresh chart cache for ticker
	switch options {
	case PriceOnly:
		{
			// price is expired
			if now >= cachedTicker.PriceDetails.Expires {
				refreshedPrice, err := fmp.GetTickerQuote(ticker, apiKey)
				if err != nil {
					return true, models.Ticker{}, err
				}

				cachedTicker.PriceDetails = models.PriceDetails{
					Price:            refreshedPrice.Price,
					Change:           refreshedPrice.Change,
					ChangePercentage: refreshedPrice.ChangePercentage,
					LastUpdated:      refreshedPrice.Timestamp,
					Expires:          time.Now().Add(PRICE_TTL).Unix(),
				}

				cache.SaveTickerToCache(cachedTicker)
			}

			return true, cachedTicker, nil
		}
	case ChartOnly:
		{
			// chart is expired
			if now >= cachedTicker.ChartDetails.HistoricalChart.Expires {
				refreshedChart, err := fmp.GetHistoricalChartData(ticker, apiKey)
				if err != nil {
					return true, models.Ticker{}, err
				}

				cachedTicker.ChartDetails = models.ChartDetails{
					HistoricalChart: models.HistoricalChart{Prices: refreshedChart,
						Expires: time.Now().Add(CHART_TTL).Unix()},
				}

				cache.SaveTickerToCache(cachedTicker)
			}

			return true, cachedTicker, nil
		}
	case PriceAndChart:
		{
			var saveCache bool // no need to save to cache if neither chart or price is expired

			// price is expired
			if now >= cachedTicker.PriceDetails.Expires {
				saveCache = true
				refreshedPrice, err := fmp.GetTickerQuote(ticker, apiKey)
				if err != nil {
					return true, models.Ticker{}, err
				}

				cachedTicker.PriceDetails = models.PriceDetails{
					Price:            refreshedPrice.Price,
					Change:           refreshedPrice.Change,
					ChangePercentage: refreshedPrice.ChangePercentage,
					LastUpdated:      refreshedPrice.Timestamp,
					Expires:          time.Now().Add(PRICE_TTL).Unix(),
				}
			}

			// chart is expired
			if now >= cachedTicker.ChartDetails.HistoricalChart.Expires {
				saveCache = true
				refreshedChart, err := fmp.GetHistoricalChartData(ticker, apiKey)
				if err != nil {
					return true, models.Ticker{}, err
				}

				cachedTicker.ChartDetails = models.ChartDetails{
					HistoricalChart: models.HistoricalChart{Prices: refreshedChart,
						Expires: time.Now().Add(CHART_TTL).Unix()},
				}

			}

			if saveCache {
				cache.SaveTickerToCache(cachedTicker)
			}

			return true, cachedTicker, nil
		}

	default:
		{
			return false, models.Ticker{}, fmt.Errorf("%v is not valid cache option", options)
		}
	}
}
