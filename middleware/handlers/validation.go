package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

type ValidateOrderRequest struct {
	ItemID       string `json:"itemId"`
	Quantity     int    `json:"quantity"`
	CustomerName string `json:"customerName"`
}

type ValidateOrderResponse struct {
	Valid   bool   `json:"valid"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

func ValidateOrderHandler(w http.ResponseWriter, r *http.Request) {
	var req ValidateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Simulate processing delay
	time.Sleep(time.Duration(20+rand.Intn(80)) * time.Millisecond)

	// Validation logic
	if req.CustomerName == "" {
		respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid: false,
			Error: "Customer name is required",
		})
		return
	}

	if req.ItemID == "" {
		respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid: false,
			Error: "Item ID is required",
		})
		return
	}

	if req.Quantity <= 0 {
		respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid: false,
			Error: "Quantity must be greater than 0",
		})
		return
	}

	if req.Quantity > 10 {
		respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid: false,
			Error: "Quantity cannot exceed 10 items",
		})
		return
	}

	// Occasionally simulate validation failure (2% chance)
	if rand.Float32() < 0.02 {
		respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid: false,
			Error: "Validation temporarily unavailable",
		})
		return
	}

	respondWithJSON(w, http.StatusOK, ValidateOrderResponse{
		Valid:   true,
		Message: "Order validation successful",
	})
}

