/*
	this is different than get_historical_chart.go as this chart data is
	specifically for the current trading day and not a historical

	it will return the price of a ticker for every single minute during
	the current trading day
*/

package fmp

import (
	"encoding/json/v2"
	"fmt"
	"log"
	"time"
	"watchlist/models"
)

func GetIntradayChartData(ticker, apiKey string) ([]models.TodayChart, error) {
	log.Printf("getting todays chart data for %v", ticker)

	today := time.Now()

	// if today sat/sun, get fridays prices
	weekDay := time.Now().Weekday()
	switch weekDay {
	// sat
	case 6:
		today = today.Add(-time.Hour * 24)
		// sun
	case 0:
		today = today.Add(-time.Hour * 48)
	}

	url := fmt.Sprintf("https://financialmodelingprep.com/stable/historical-chart/5min?symbol=%v&apikey=%v&from=%v", ticker, apiKey, today.Format("2006-01-02"))
	res, err := HttpClient.Get(url)
	if err != nil {
		log.Printf("ERROR: failed while making request to FMP API: %v", err)
		return []models.TodayChart{}, err
	}

	defer res.Body.Close()

	var result []models.TodayChart
	err = json.UnmarshalRead(res.Body, &result)
	if err != nil {
		log.Printf("ERROR: failed reading response from FMP API: %v", err)
		return []models.TodayChart{}, err
	}

	return result, nil
}
