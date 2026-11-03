package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"net/http"
	"watchlist/models"
)

var HttpClient http.Client

func GetTickerQuote(ticker, apiKey string) (models.TickerQuoteResult, error) {
	log.Printf("getting ticker price data for %v", ticker)
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote?symbol=%v&apikey=%v", ticker, apiKey)
	res, err := HttpClient.Get(url)

	// ticker doesnt exist
	if res.StatusCode == 404 {
		log.Printf("ERROR: %v is not a valid ticker on FMP", ticker)
		return models.TickerQuoteResult{}, err
	}

	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return models.TickerQuoteResult{}, err
	}

	defer res.Body.Close()

	var result []models.TickerQuoteResult
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return models.TickerQuoteResult{}, err
	}

	if len(result) == 0 {
		return models.TickerQuoteResult{}, fmt.Errorf("ERROR: no ticker price results response from FMP API")
	}

	return result[0], nil
}
