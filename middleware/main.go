package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cosmic-coffee-middleware/handlers"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
)

var (
	redisClient *redis.Client
	ctx         = context.Background()
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	// Initialize Redis client
	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "",
		DB:       0,
	})

	// Test Redis connection
	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Could not connect to Redis: %v", err)
	} else {
		log.Println("Connected to Redis")
	}

	// Initialize handlers
	handlers.InitHandlers(redisClient, ctx)

	// Create router
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/health", healthHandler).Methods("GET")
	r.HandleFunc("/validate", handlers.ValidateOrderHandler).Methods("POST")
	r.HandleFunc("/calculate-price", handlers.CalculatePriceHandler).Methods("POST")
	r.HandleFunc("/check-inventory", handlers.CheckInventoryHandler).Methods("POST")

	// Middleware
	r.Use(loggingMiddleware)
	r.Use(latencyMiddleware)

	// Start server
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Middleware service starting on port %s", port)
	log.Fatal(http.ListenAndServe(addr, r))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "middleware",
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("Started %s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
		log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func latencyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate variable latency for observability (10-100ms)
		latency := time.Duration(10+time.Now().UnixNano()%90) * time.Millisecond
		time.Sleep(latency)
		next.ServeHTTP(w, r)
	})
}

