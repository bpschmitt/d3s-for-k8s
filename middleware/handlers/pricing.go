package handlers

import (
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
	"time"
)

type CalculatePriceRequest struct {
	ItemID    string  `json:"itemId"`
	Quantity  int     `json:"quantity"`
	BasePrice float64 `json:"basePrice"`
}

type CalculatePriceResponse struct {
	TotalPrice     float64 `json:"totalPrice"`
	BasePrice      float64 `json:"basePrice"`
	Quantity       int     `json:"quantity"`
	Discount       float64 `json:"discount,omitempty"`
	PriceMultiplier float64 `json:"priceMultiplier,omitempty"`
	Message        string  `json:"message,omitempty"`
}

func CalculatePriceHandler(w http.ResponseWriter, r *http.Request) {
	var req CalculatePriceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Simulate processing delay
	time.Sleep(time.Duration(30+rand.Intn(70)) * time.Millisecond)

	// Validate inputs
	if req.BasePrice <= 0 {
		respondWithError(w, http.StatusBadRequest, "Base price must be greater than 0")
		return
	}

	if req.Quantity <= 0 {
		respondWithError(w, http.StatusBadRequest, "Quantity must be greater than 0")
		return
	}

	// Calculate base total
	totalPrice := req.BasePrice * float64(req.Quantity)

	// Apply dynamic pricing based on time of day and demand
	hour := time.Now().Hour()
	var priceMultiplier float64 = 1.0
	var discount float64 = 0.0

	// Rush hour pricing (7-9 AM, 12-1 PM)
	if (hour >= 7 && hour < 9) || (hour >= 12 && hour < 13) {
		priceMultiplier = 1.1
	}

	// Off-peak discount (2-4 PM)
	if hour >= 14 && hour < 16 {
		discount = 0.15
		totalPrice *= (1 - discount)
	} else {
		totalPrice *= priceMultiplier
	}

	// Bulk discount for 5+ items
	if req.Quantity >= 5 {
		bulkDiscount := 0.1
		totalPrice *= (1 - bulkDiscount)
		if discount == 0 {
			discount = bulkDiscount
		}
	}

	// Random surge pricing (10% chance)
	if rand.Float32() < 0.1 {
		surgeMultiplier := 1.2
		totalPrice *= surgeMultiplier
		priceMultiplier *= surgeMultiplier
	}

	// Round to 2 decimal places
	totalPrice = math.Round(totalPrice*100) / 100

	response := CalculatePriceResponse{
		TotalPrice:      totalPrice,
		BasePrice:       req.BasePrice,
		Quantity:        req.Quantity,
		Discount:        discount,
		PriceMultiplier: priceMultiplier,
		Message:         "Price calculated successfully",
	}

	respondWithJSON(w, http.StatusOK, response)
}

