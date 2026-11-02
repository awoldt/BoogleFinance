package main

import (
	"watchlist/routes"

	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
)

func main() {
	// load the env variables (ignore error, this reads from .env locally but should work on cloud deployments)
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // local development
	}

	// get the FMP api key
	FMP_API_KEY := os.Getenv("FMP_API_KEY")
	if FMP_API_KEY == "" {
		log.Fatal("error fmp api key is missing")
	}

	// get auth header
	// each request made to api needs an auth header
	AUTH_HEADER := os.Getenv("AUTH_HEADER")
	if AUTH_HEADER == "" {
		log.Fatal("error auth header is missing")
	}

	r := chi.NewRouter()

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ah := r.Header.Get("Authorization")
			if ah == "" || ah != AUTH_HEADER {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	r.Post("/api/ticker", routes.TickerRoute(FMP_API_KEY))
	r.Post("/api/search", routes.SearchTickerRoute(FMP_API_KEY))
	r.Post("/api/loadwatchlist", routes.LoadWatchlistRoute(FMP_API_KEY))

	http.ListenAndServe(":"+port, r)
}
