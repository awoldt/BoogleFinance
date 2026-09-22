package main

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"net/http"
)

var HttpClient http.Client

type Ticker struct {
	Name             string  `json:"name"`
	Symbol           string  `json:"symbol"`
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	LastUpdated      int     `json:"timestamp"` // epoch time in seconds when this tickers price was last updated by FMP
}

func getPrice(ticker, apiKey string) (Ticker, error) {
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote?symbol=%v&apikey=%v", ticker, apiKey)
	res, err := HttpClient.Get(url)
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
