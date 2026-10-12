package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"net/http"
)

var HttpClient http.Client

type TickerQuoteResult struct {
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	Timestamp        int     `json:"timestamp"`
}

func GetTickerQuote(ticker, apiKey string) (TickerQuoteResult, error) {
	log.Printf("getting ticker data for %v", ticker)
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote?symbol=%v&apikey=%v", ticker, apiKey)
	res, err := HttpClient.Get(url)

	// ticker doesnt exist
	if res.StatusCode == 404 {
		log.Printf("ERROR: %v is not a valid ticker on FMP", ticker)
		return TickerQuoteResult{}, err
	}

	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return TickerQuoteResult{}, err
	}

	defer res.Body.Close()

	var result []TickerQuoteResult
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return TickerQuoteResult{}, err
	}

	return result[0], nil
}
