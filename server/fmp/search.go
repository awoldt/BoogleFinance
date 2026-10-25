package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"slices"
	"strings"
	"watchlist/models"
)

func SearchTicker(ticker, apiKey string) ([]models.SearchTickerResult, error) {
	// we will perform 2 different searches for this function to fmp:
	// 1. company search (Amazon)
	// 2. symbol search (AMZN)
	// combine unique results

	companySearchUrl := fmt.Sprintf("https://financialmodelingprep.com/stable/search-name?query=%v&apikey=%v&limit=10", ticker, apiKey)
	symbolSearchUrl := fmt.Sprintf("https://financialmodelingprep.com/stable/search-symbol?query=%v&apikey=%v&limit=10", ticker, apiKey)

	companySearchReq, err := HttpClient.Get(companySearchUrl)
	if err != nil {
		log.Printf("ERROR: could not company search for %v", ticker)
		return []models.SearchTickerResult{}, err
	}
	defer companySearchReq.Body.Close()

	symbolSearchReq, err := HttpClient.Get(symbolSearchUrl)
	if err != nil {
		log.Printf("ERROR: could not symbol search for %v", ticker)
		return []models.SearchTickerResult{}, err
	}
	defer symbolSearchReq.Body.Close()

	var invalidSymbolCharacter = "." // we dont want any "AMZN.NE or AMZN.TO.. just basic AMZN"

	var companySearchResults []models.SearchTickerResult
	err = json.UnmarshalRead(companySearchReq.Body, &companySearchResults)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []models.SearchTickerResult{}, err
	}

	var symbolSearchResults []models.SearchTickerResult
	err = json.UnmarshalRead(symbolSearchReq.Body, &symbolSearchResults)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []models.SearchTickerResult{}, err
	}

	// loop through and add each unique result
	var finalResults []models.SearchTickerResult
	for _, v := range companySearchResults {
		if strings.Contains(v.Symbol, invalidSymbolCharacter) {
			continue
		}

		exists := slices.ContainsFunc(finalResults, func(x models.SearchTickerResult) bool {
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

		exists := slices.ContainsFunc(finalResults, func(x models.SearchTickerResult) bool {
			if x.Symbol == v.Symbol {
				return true
			}
			return false
		})

		if !exists {
			finalResults = append(finalResults, v)
		}
	}

	// need to order the results to make it friendly for end user
	// if you search "AMZN", that should be the first result shown
	// basically... show exact matches for symbols at top of search results feed on UI
	for i, v := range finalResults {
		if v.Symbol == ticker {
			finalResults[0], finalResults[i] = v, finalResults[0]
			break
		}
	}

	return finalResults, nil
}
