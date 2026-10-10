package fmp

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
	Expires          int64   `json:"expires"`   // when to ping FMP to refresh this ticker stored in server cache (epoch in seconds)
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
