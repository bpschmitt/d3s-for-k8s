# Cosmic Coffee Shop - Microservices Demo Application

A whimsical, fully-functional microservices application for demonstrating SaaS observability platforms. This space-themed coffee ordering system showcases inter-service communication, database operations, variable latency patterns, and realistic traffic generation - perfect for observability demos on Kubernetes.

## Architecture

```
┌─────────────┐
│   Frontend  │  (React + Nginx)
│  Port: 80   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │  (Node.js/Express)
│  Port: 3001 │
└──────┬──────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Middleware  │   │    Redis    │
│    (Go)     │   │ (Key-Value) │
│  Port: 3002 │   │  Port: 6379 │
└──────┬──────┘   └─────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
└─────────────┘

       ┌──────────────────┐
       │ Load Generator   │  (Node.js)
       │  (Continuous)    │
       └────────┬─────────┘
                │
                ▼
         (Generates Traffic)
```

### Components

- **Frontend (React)**: Customer-facing web interface for browsing cosmic coffee drinks and placing orders
- **Backend API (Node.js/Express)**: REST API handling orders, customer management, and business logic
- **Middleware (Go)**: Inventory management, order validation, pricing calculations with dynamic pricing logic
- **Redis**: Key-value store for orders, inventory counts, customer sessions, and caching
- **Load Generator (Node.js)**: Continuous traffic generation simulating realistic user behavior

## Features

### Cosmic Menu Items
- 🌌 Nebula Latte
- 💥 Supernova Espresso
- 🌠 Galaxy Mocha
- ☄️ Asteroid Americano
- 🌙 Lunar Cappuccino
- ✨ Starlight Frappé
- ☄️ Comet Cold Brew
- 🚀 Rocket Fuel

### Observability Features
- Inter-service HTTP calls (Frontend → Backend → Middleware)
- Database operations (Redis reads/writes)
- Variable latency patterns (50-300ms)
- Occasional error responses (2-5% error rate)
- Request tracing across services
- High request volume from load generator
- Dynamic pricing based on time of day
- Inventory management with automatic replenishment

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured

### Local Development with Docker Compose

1. **Clone the repository**
```bash
git clone <repository-url>
cd d3s-for-k8s
```

2. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Middleware: http://localhost:3002
- Redis: localhost:6379

### Kubernetes Deployment

#### Option 1: Build Images Locally

1. **Build Docker images**
```bash
# Frontend
cd frontend
docker build -t cosmic-coffee-frontend:latest .

# Backend
cd ../backend
docker build -t cosmic-coffee-backend:latest .

# Middleware
cd ../middleware
docker build -t cosmic-coffee-middleware:latest .

# Load Generator
cd ../load-generator
docker build -t cosmic-coffee-load-generator:latest .
cd ..
```

2. **Deploy to Kubernetes**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Redis
kubectl apply -f k8s/redis/

# Deploy Middleware
kubectl apply -f k8s/middleware/

# Deploy Backend
kubectl apply -f k8s/backend/

# Deploy Frontend
kubectl apply -f k8s/frontend/

# Deploy Load Generator
kubectl apply -f k8s/load-generator/
```

3. **Verify deployment**
```bash
kubectl get pods -n cosmic-coffee
kubectl get services -n cosmic-coffee
```

4. **Access the application**
```bash
# Get the frontend service external IP/port
kubectl get service frontend -n cosmic-coffee

# For minikube
minikube service frontend -n cosmic-coffee

# For port-forwarding
kubectl port-forward -n cosmic-coffee service/frontend 8080:80
```

#### Option 2: Deploy All at Once

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis/
kubectl apply -f k8s/middleware/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/load-generator/
```

## API Endpoints

### Backend API (Port 3001)

- `GET /health` - Health check
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get specific menu item
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status
- `GET /api/customers` - Get all customers
- `GET /api/customers/:name/orders` - Get orders for a customer

### Middleware API (Port 3002)

- `GET /health` - Health check
- `POST /validate` - Validate order data
- `POST /calculate-price` - Calculate dynamic pricing
- `POST /check-inventory` - Check and update inventory

## Configuration

### Environment Variables

#### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3001)

#### Backend
- `PORT` - Server port (default: 3001)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `MIDDLEWARE_URL` - Middleware service URL (default: http://localhost:3002)

#### Middleware
- `PORT` - Server port (default: 3002)
- `REDIS_URL` - Redis connection string (default: localhost:6379)

#### Load Generator
- `BACKEND_URL` - Backend API URL (default: http://localhost:3001)
- `REQUEST_RATE` - Requests per minute (default: 10)

## Monitoring & Observability

This application is designed to showcase observability features:

### Metrics to Monitor
- Request rates and latencies across services
- Error rates (intentionally 2-5%)
- Database connection pooling
- Service dependencies and call graphs
- Resource utilization (CPU, memory)

### Distributed Tracing
The application generates traces across:
1. Frontend → Backend (HTTP)
2. Backend → Middleware (HTTP)
3. Backend → Redis (Database)
4. Middleware → Redis (Database)

### Logs
Each service outputs structured logs:
- Request/response logs
- Error logs
- Performance metrics
- Business events (orders created, inventory updates)

## Development

### Project Structure
```
d3s-for-k8s/
├── frontend/              # React application
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   └── services/
│   └── Dockerfile
├── middleware/           # Go service
│   ├── handlers/
│   ├── main.go
│   └── Dockerfile
├── load-generator/       # Traffic generator
│   ├── index.js
│   └── Dockerfile
├── k8s/                 # Kubernetes manifests
│   ├── namespace.yaml
│   ├── redis/
│   ├── frontend/
│   ├── backend/
│   ├── middleware/
│   └── load-generator/
└── docker-compose.yml   # Local development
```

### Building Individual Services

```bash
# Frontend
cd frontend && npm install && npm run build

# Backend
cd backend && npm install

# Middleware
cd middleware && go mod download && go build

# Load Generator
cd load-generator && npm install
```

## Troubleshooting

### Common Issues

1. **Services can't connect to Redis**
   - Verify Redis is running: `kubectl get pods -n cosmic-coffee | grep redis`
   - Check logs: `kubectl logs -n cosmic-coffee -l app=redis`

2. **Frontend can't reach backend**
   - Update `REACT_APP_API_URL` to point to correct backend URL
   - Check backend service: `kubectl get service backend -n cosmic-coffee`

3. **Load generator not generating traffic**
   - Check logs: `kubectl logs -n cosmic-coffee -l app=load-generator`
   - Verify backend URL configuration

4. **Pods stuck in ImagePullBackOff**
   - Images need to be built and available to the cluster
   - For minikube: `eval $(minikube docker-env)` before building

### Viewing Logs

```bash
# All pods in namespace
kubectl logs -n cosmic-coffee -l app=<service-name>

# Specific pod
kubectl logs -n cosmic-coffee <pod-name>

# Follow logs
kubectl logs -n cosmic-coffee -l app=backend -f
```

### Scaling Services

```bash
# Scale backend replicas
kubectl scale deployment backend -n cosmic-coffee --replicas=5

# Scale load generator intensity
kubectl set env deployment/load-generator -n cosmic-coffee REQUEST_RATE=100
```

## Cleanup

### Docker Compose
```bash
docker-compose down -v
```

### Kubernetes
```bash
kubectl delete namespace cosmic-coffee
```

## License

MIT License - See LICENSE file for details

## Contributing

This is a demo application for observability platforms. Feel free to fork and customize for your needs!
