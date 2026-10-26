package models

type ChartDataResult struct {
	Date  string  `json:"date"`
	Price float32 `json:"price"`
}

type HistoricalChart struct {
	Prices  []ChartDataResult `json:"prices"`
	Expires int64             `json:"expires"`
}

type ChartDetails struct {
	HistoricalChart HistoricalChart `json:"historicalChart"`

	// IntradayChart struct {
	// 	Prices  []TodayChart `json:"prices"`
	// 	Expires int64        `json:"expires"`
	// } `json:"intradayChart"`
}

type TodayChart struct {
	Date  string  `json:"date"`
	Price float32 `json:"open"`
}
