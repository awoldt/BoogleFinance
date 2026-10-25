package models

type Ticker struct {
	Name         string       `json:"name"`
	Symbol       string       `json:"symbol"`
	PriceDetails PriceDetails `json:"priceDetails"`
	ChartDetails ChartDetails `json:"chartDetails,omitzero"`
}

type TickerQuoteResult struct {
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Price            float32 `json:"price"`
	Change           float32 `json:"change"`
	ChangePercentage float32 `json:"changePercentage"`
	Timestamp        int     `json:"timestamp"`
}

type SearchTickerResult struct {
	Symbol   string `json:"symbol"`
	Name     string `json:"name"`
	Exchange string `json:"exchange"`
}
