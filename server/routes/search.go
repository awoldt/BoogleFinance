package routes

import (
	"encoding/json/v2"
	"net/http"
	"strings"
	"watchlist/fmp"
)

func SearchTickerRoute(apiKey string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")

		// get ticker from url (/search?ticker=AAPL)
		ticker := r.URL.Query().Get("ticker")
		if ticker == "" {
			w.WriteHeader(400)
			w.Write([]byte("missing ticker in url query"))
			return
		}
		ticker = strings.ToUpper(ticker)

		searchResults, err := fmp.SearchTicker(ticker, apiKey)
		if err != nil {
			w.WriteHeader(500)
			w.Write([]byte("errror while searching tickers :("))
			return
		}

		json.MarshalWrite(w, searchResults)
	}
}
