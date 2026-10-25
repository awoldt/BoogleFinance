package models

type PriceDetails struct {
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	LastUpdated      int     `json:"timestamp"` // epoch time in seconds when this tickers price was last updated by FMP
	Expires          int64   `json:"expires"`   // epoch in seconds when to ping FMP to refresh this ticker's price data
}
