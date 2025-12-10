# Cart Service (Python/Flask)

A microservice for managing shopping carts in the Cosmic Coffee Shop application. Built with Python and Flask.

## Technology Stack

- **Python 3.11**
- **Flask 3.0** - Web framework
- **Redis** - Session storage for carts
- **Gunicorn** - Production WSGI server

## Features

- Create new shopping carts
- Add/remove items from cart
- Update item quantities
- Persistent cart storage (1 hour TTL)
- Variable latency simulation for observability
- Health check endpoint

## API Endpoints

### Health Check
```
GET /health
```

### Create Cart
```
POST /cart
Response: { "id": "abc123", "items": [], "createdAt": "...", "updatedAt": "..." }
```

### Get Cart
```
GET /cart/{cartId}
Response: { "id": "abc123", "items": [...], "createdAt": "...", "updatedAt": "..." }
```

### Add Item to Cart
```
POST /cart/{cartId}/items
Body: {
  "itemId": "nebula-latte",
  "itemName": "Nebula Latte",
  "itemEmoji": "🌌",
  "quantity": 2,
  "basePrice": 5.99
}
```

### Update Item Quantity
```
PATCH /cart/{cartId}/items/{itemId}
Body: { "quantity": 3 }
```

### Remove Item
```
DELETE /cart/{cartId}/items/{itemId}
```

### Clear Cart
```
DELETE /cart/{cartId}
```

## Environment Variables

- `PORT` - Server port (default: 3003)
- `REDIS_URL` - Redis connection string (default: localhost:6379)

## Running Locally

### With Python
```bash
cd cart
pip install -r requirements.txt
python app.py
```

### With Docker
```bash
docker build -t cosmic-coffee-cart .
docker run -p 3003:3003 -e REDIS_URL=localhost:6379 cosmic-coffee-cart
```

### With Docker Compose
```bash
docker-compose up cart
```

## Cart Data Structure

```json
{
  "id": "abc123",
  "items": [
    {
      "itemId": "nebula-latte",
      "itemName": "Nebula Latte",
      "itemEmoji": "🌌",
      "quantity": 2,
      "basePrice": 5.99,
      "addedAt": "2025-12-09T20:30:00.000Z"
    }
  ],
  "createdAt": "2025-12-09T20:30:00.000Z",
  "updatedAt": "2025-12-09T20:35:00.000Z"
}
```

## Observability Features

- **Latency Simulation**: Variable response times (20-150ms)
- **Logging**: Structured logs with emojis for easy reading
- **Health Checks**: Kubernetes liveness/readiness probes
- **Redis Integration**: All cart operations tracked in Redis

## Architecture

The cart service sits between the frontend and backend:

```
Frontend → Cart Service → Redis
            ↓
         Backend (for checkout)
```

## Deployment

Deployed as part of the Cosmic Coffee Shop Kubernetes application. See the main README for deployment instructions.

