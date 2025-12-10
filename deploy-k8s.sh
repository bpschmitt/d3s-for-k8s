#!/bin/bash

# Deployment script for Cosmic Coffee Shop on Kubernetes
# This script deploys all components to a Kubernetes cluster

set -e

echo "☕️ Deploying Cosmic Coffee Shop to Kubernetes..."
echo ""

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f k8s/namespace.yaml
echo "✅ Namespace created"
echo ""

# Deploy Redis
echo "📦 Deploying Redis..."
kubectl apply -f k8s/redis/
echo "✅ Redis deployed"
echo ""

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n cosmic-coffee --timeout=60s
echo "✅ Redis is ready"
echo ""

# Deploy Middleware
echo "📦 Deploying Middleware..."
kubectl apply -f k8s/middleware/
echo "✅ Middleware deployed"
echo ""

# Wait for Middleware to be ready
echo "⏳ Waiting for Middleware to be ready..."
kubectl wait --for=condition=ready pod -l app=middleware -n cosmic-coffee --timeout=60s
echo "✅ Middleware is ready"
echo ""

# Deploy Cart
echo "📦 Deploying Cart..."
kubectl apply -f k8s/cart/
echo "✅ Cart deployed"
echo ""

# Wait for Cart to be ready
echo "⏳ Waiting for Cart to be ready..."
kubectl wait --for=condition=ready pod -l app=cart -n cosmic-coffee --timeout=60s
echo "✅ Cart is ready"
echo ""

# Deploy Backend
echo "📦 Deploying Backend..."
kubectl apply -f k8s/backend/
echo "✅ Backend deployed"
echo ""

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n cosmic-coffee --timeout=60s
echo "✅ Backend is ready"
echo ""

# Deploy Frontend
echo "📦 Deploying Frontend..."
kubectl apply -f k8s/frontend/
echo "✅ Frontend deployed"
echo ""

# Deploy Load Generator
echo "📦 Deploying Load Generator..."
kubectl apply -f k8s/load-generator/
echo "✅ Load Generator deployed"
echo ""

# Show status
echo "🎉 Deployment complete!"
echo ""
echo "Checking pod status..."
kubectl get pods -n cosmic-coffee
echo ""
echo "Checking services..."
kubectl get services -n cosmic-coffee
echo ""
echo "Access the application:"
echo "  - Run: kubectl port-forward -n cosmic-coffee service/frontend 8080:80"
echo "  - Then visit: http://localhost:8080"
echo ""
echo "Or get the LoadBalancer IP (if available):"
echo "  - kubectl get service frontend -n cosmic-coffee"

