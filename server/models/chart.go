package models

type ChartDataResult struct {
	Date  string  `json:"date"`
	Price float32 `json:"price"`
}

type ChartDetails struct {
	Prices  []ChartDataResult `json:"prices"`
	Expires int64             `json:"expires"` // epoch in seconds when to ping FMP to refresh this ticker's chart data
}

type TodayChart struct {
	Date  string  `json:"date"`
	Price float32 `json:"open"`
}
