package main

import (
	"watchlist/routes"

	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
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
		log.Fatal("error fmp api key is blank")
	}

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://watchlist-production-2251.up.railway.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// static assets
	static := http.FileServer(http.Dir("static"))
	r.Handle("/static/*", http.StripPrefix("/static/", static))
	r.Get("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/favicon.ico")
	})

	// search api
	r.Post("/api/search", routes.SearchTickerRoute(FMP_API_KEY))

	// main pages
	r.Get("/", routes.HomePage(FMP_API_KEY))
	r.Get("/{ticker}", routes.TickerPage(FMP_API_KEY))

	http.ListenAndServe(":"+port, r)
}
