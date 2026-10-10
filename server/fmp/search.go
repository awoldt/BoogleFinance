package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"slices"
	"strings"
)

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

	var invalidSymbolCharacter = "." // we dont want any "AMZN.NE or AMZN.TO.. just basic AMZN"

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
		if strings.Contains(v.Symbol, invalidSymbolCharacter) {
			continue
		}

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
		if strings.Contains(v.Symbol, invalidSymbolCharacter) {
			continue
		}

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
