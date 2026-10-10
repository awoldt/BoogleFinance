package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"net/http"
	"slices"
)

var HttpClient http.Client

type Ticker struct {
	Name             string  `json:"name"`
	Symbol           string  `json:"symbol"`
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	LastUpdated      int     `json:"timestamp"` // epoch time in seconds when this tickers price was last updated by FMP
	Expires          int64   `json:"expires"`   // when to ping FMP to refresh this ticker stored in server cache (epoch in seconds)
}

type SearchTickerResult struct {
	Symbol   string `json:"symbol"`
	Name     string `json:"name"`
	Exchange string `json:"exchange"`
}

func SearchTicker(ticker, apiKey string) ([]SearchTickerResult, error) {
	// we will perform 2 different searches for this function to fmp:
	// 1. company search (Amazon)
	// 2. symbol search (AMZN)
	// combine unique results

	companySearchUrl := fmt.Sprintf("https://financialmodelingprep.com/stable/search-name?query=%v&apikey=%v", ticker, apiKey)
	symbolSearchUrl := fmt.Sprintf("https://financialmodelingprep.com/stable/search-symbol?query=%v&apikey=%v", ticker, apiKey)

	companySearchReq, err := HttpClient.Get(companySearchUrl)
	if err != nil {
		log.Printf("ERROR: could not company search for %v", ticker)
		return []SearchTickerResult{}, err
	}
	defer companySearchReq.Body.Close()

	symbolSearchReq, err := HttpClient.Get(symbolSearchUrl)
	if err != nil {
		log.Printf("ERROR: could not symbol search for %v", ticker)
		return []SearchTickerResult{}, err
	}
	defer symbolSearchReq.Body.Close()

	var companySearchResults []SearchTickerResult
	err = json.UnmarshalRead(companySearchReq.Body, &companySearchResults)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []SearchTickerResult{}, err
	}

	var symbolSearchResults []SearchTickerResult
	err = json.UnmarshalRead(symbolSearchReq.Body, &symbolSearchResults)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []SearchTickerResult{}, err
	}

	// loop through and add each unique result
	var finalResults []SearchTickerResult
	for _, v := range companySearchResults {

		exists := slices.ContainsFunc(finalResults, func(x SearchTickerResult) bool {
			if x.Symbol == v.Symbol {
				return true
			}
			return false
		})

		if !exists {
			finalResults = append(finalResults, v)
		}
	}
	for _, v := range symbolSearchResults {
		exists := slices.ContainsFunc(finalResults, func(x SearchTickerResult) bool {
			if x.Symbol == v.Symbol {
				return true
			}
			return false
		})

		if !exists {
			finalResults = append(finalResults, v)
		}
	}

	return finalResults, nil
}

func GetTickerPrice(ticker, apiKey string) (Ticker, error) {
	log.Printf("getting ticker data for %v", ticker)
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote?symbol=%v&apikey=%v", ticker, apiKey)
	res, err := HttpClient.Get(url)

	// ticker doesnt exist
	if res.StatusCode == 404 {
		log.Printf("ERROR: %v is not a valid ticker on FMP", ticker)
		return Ticker{}, err
	}

	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return Ticker{}, err
	}

	defer res.Body.Close()

	var result []Ticker
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return Ticker{}, err
	}

	return result[0], nil
}
