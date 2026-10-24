package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"time"
)

type ChartDataResult struct {
	Date  string  `json:"date"`
	Price float32 `json:"price"`
}

func GetChartData(ticker, apiKey string) ([]ChartDataResult, error) {

	log.Printf("getting ticker chart data for %v", ticker)

	// we only want to grab up to the past year of chart data for a single ticker
	today := time.Now()
	yearAgo := today.Add(-time.Hour * 8760)
	yearAgoStr := yearAgo.Format("2006-01-02")

	url := fmt.Sprintf("https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=%v&apikey=%v&from=%v", ticker, apiKey, yearAgoStr)
	res, err := HttpClient.Get(url)
	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return []ChartDataResult{}, err
	}

	defer res.Body.Close()

	var result []ChartDataResult
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []ChartDataResult{}, err
	}

	return result, nil
}
