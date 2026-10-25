// helpers shared by the page routes

package routes

import (
	"net/http"
	"time"
	"watchlist/cache"
	"watchlist/models"

	"github.com/a-h/templ"
)

func renderPage(w http.ResponseWriter, r *http.Request, status int, page templ.Component) {
	templ.Handler(page, templ.WithStatus(status)).ServeHTTP(w, r)
}

// priceDetails turns a fresh FMP quote into the price fields we cache
func priceDetails(priceData models.TickerQuoteResult) models.PriceDetails {
	return models.PriceDetails{
		Price:            priceData.Price,
		Change:           priceData.Change,
		ChangePercentage: priceData.ChangePercentage,
		LastUpdated:      priceData.Timestamp,
		Expires:          time.Now().Add(cache.PRICE_TTL).Unix(),
	}
}
