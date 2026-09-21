package main

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"net/http"
)

var HttpClient http.Client

type Price struct {
	Symbol string  `json:"symbol"`
	Price  float32 `json:"price"`
	Change float32 `json:"change"`
}

func getPrice(ticker, apiKey string) (Price, error) {
	url := fmt.Sprintf("https://financialmodelingprep.com/stable/quote-short?symbol=%v&apikey=%v", ticker, apiKey)
	res, err := HttpClient.Get(url)
	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return Price{}, err
	}

	defer res.Body.Close()

	var result []Price
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return Price{}, err
	}

	return result[0], nil
}
