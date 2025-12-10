package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
)

var (
	redisClient *redis.Client
	ctx         context.Context
)

// InitHandlers initializes the handlers with Redis client
func InitHandlers(client *redis.Client, context context.Context) {
	redisClient = client
	ctx = context
	initializeInventory()
}

type CheckInventoryRequest struct {
	ItemID   string `json:"itemId"`
	Quantity int    `json:"quantity"`
}

type CheckInventoryResponse struct {
	Available       bool   `json:"available"`
	CurrentStock    int    `json:"currentStock"`
	RequestedAmount int    `json:"requestedAmount"`
	Message         string `json:"message,omitempty"`
}

func initializeInventory() {
	// Initialize inventory for each item if not exists
	items := []string{
		"nebula-latte",
		"supernova-espresso",
		"galaxy-mocha",
		"asteroid-americano",
		"lunar-cappuccino",
		"starlight-frappe",
		"comet-cold-brew",
		"rocket-fuel",
	}

	for _, itemID := range items {
		key := fmt.Sprintf("inventory:%s", itemID)
		exists, _ := redisClient.Exists(ctx, key).Result()
		if exists == 0 {
			// Initialize with higher stock for demo (200-300)
			initialStock := 200 + rand.Intn(101)
			redisClient.Set(ctx, key, initialStock, 0)
		}
	}
}

func CheckInventoryHandler(w http.ResponseWriter, r *http.Request) {
	var req CheckInventoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Simulate processing delay
	time.Sleep(time.Duration(20+rand.Intn(60)) * time.Millisecond)

	// Validate inputs
	if req.ItemID == "" {
		respondWithError(w, http.StatusBadRequest, "Item ID is required")
		return
	}

	if req.Quantity <= 0 {
		respondWithError(w, http.StatusBadRequest, "Quantity must be greater than 0")
		return
	}

	// Check inventory in Redis
	key := fmt.Sprintf("inventory:%s", req.ItemID)
	stockStr, err := redisClient.Get(ctx, key).Result()
	
	var currentStock int
	if err == redis.Nil {
		// Item not found, initialize it with higher stock
		currentStock = 250
		redisClient.Set(ctx, key, currentStock, 0)
	} else if err != nil {
		// Redis error, assume available
		respondWithJSON(w, http.StatusOK, CheckInventoryResponse{
			Available:       true,
			CurrentStock:    999,
			RequestedAmount: req.Quantity,
			Message:         "Inventory check bypassed (Redis unavailable)",
		})
		return
	} else {
		currentStock, _ = strconv.Atoi(stockStr)
	}

	// Check if enough stock is available
	available := currentStock >= req.Quantity

	if available {
		// Deduct from inventory
		newStock := currentStock - req.Quantity
		redisClient.Set(ctx, key, newStock, 0)

		// Auto-replenish stock if it's low (more aggressive for demo)
		if newStock < 50 {
			// 80% chance to replenish when stock is low
			if rand.Float32() < 0.8 {
				replenishAmount := 100 + rand.Intn(101) // Replenish 100-200 items
				redisClient.IncrBy(ctx, key, int64(replenishAmount))
				fmt.Printf("🔄 Replenished %s inventory: +%d items\n", req.ItemID, replenishAmount)
			}
		}
	}

	response := CheckInventoryResponse{
		Available:       available,
		CurrentStock:    currentStock,
		RequestedAmount: req.Quantity,
	}

	if available {
		response.Message = "Inventory available"
	} else {
		response.Message = "Insufficient inventory"
	}

	respondWithJSON(w, http.StatusOK, response)
}

// Helper functions
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

