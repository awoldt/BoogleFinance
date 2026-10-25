package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"time"

	"watchlist/models"
)

func GetHistoricalChartData(ticker, apiKey string) ([]models.ChartDataResult, error) {

	log.Printf("getting ticker chart data for %v", ticker)

	// we only want to grab up to the past year of chart data for a single ticker
	today := time.Now()
	yearAgo := today.Add(-time.Hour * 8760)
	yearAgoStr := yearAgo.Format("2006-01-02")

	url := fmt.Sprintf("https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=%v&apikey=%v&from=%v", ticker, apiKey, yearAgoStr)
	res, err := HttpClient.Get(url)
	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return []models.ChartDataResult{}, err
	}

	defer res.Body.Close()

	var result []models.ChartDataResult
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []models.ChartDataResult{}, err
	}

	return result, nil
}
