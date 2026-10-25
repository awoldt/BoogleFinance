package fmp

import (
	"encoding/json/v2"
	"errors"
	"fmt"
	"log"
	"net/http"
	neturl "net/url"
	"watchlist/models"
)

var HttpClient http.Client

var ErrTickerNotFound = errors.New("ticker not found")

func GetTickerQuote(ticker, apiKey string) (models.TickerQuoteResult, error) {
	log.Printf("getting ticker price data for %v", ticker)
	// the ticker can come straight from a page url, so escape it
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote?symbol=%v&apikey=%v", neturl.QueryEscape(ticker), apiKey)
	res, err := HttpClient.Get(url)

	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return models.TickerQuoteResult{}, err
	}

	defer res.Body.Close()

	// ticker doesnt exist
	if res.StatusCode == 404 {
		log.Printf("ERROR: %v is not a valid ticker on FMP", ticker)
		return models.TickerQuoteResult{}, ErrTickerNotFound
	}

	var result []models.TickerQuoteResult
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return models.TickerQuoteResult{}, err
	}

	// FMP answers an unknown ticker with an empty list
	if len(result) == 0 {
		log.Printf("ERROR: %v is not a valid ticker on FMP", ticker)
		return models.TickerQuoteResult{}, ErrTickerNotFound
	}

	return result[0], nil
}
