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
	// load the env variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("error loading .env file")
	}

	// get the FMP api key
	FMP_API_KEY := os.Getenv("FMP_API_KEY")
	if FMP_API_KEY == "" {
		log.Fatal("error fmp api key is blank")
	}

	r := chi.NewRouter()
	r.Get("/", routes.TickerRoute(FMP_API_KEY))
	r.Get("/search", routes.SearchTickerRoute(FMP_API_KEY))

	http.ListenAndServe(":8080", r)
}
