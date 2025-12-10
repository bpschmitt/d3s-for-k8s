#!/bin/bash

# Build and push script for Cosmic Coffee Shop Docker images
# This script builds multi-architecture Docker images (amd64/arm64) and optionally pushes them to Docker Hub
#
# Usage:
#   ./build-images.sh                              # Build all images (local arch)
#   ./build-images.sh <dockerhub-user>             # Build all images (multi-arch) and push to Docker Hub
#   ./build-images.sh <dockerhub-user> <service>   # Build specific service and push
#   ./build-images.sh local <service>              # Build specific service locally
#
# Services: frontend, backend, middleware, cart, load-generator, all

set -e

# Parse arguments
DOCKERHUB_USER=""
SERVICE="all"
PUSH_TO_DOCKERHUB=false
PLATFORMS="linux/amd64,linux/arm64"

# Parse arguments
if [ $# -eq 0 ]; then
    # No arguments - build all locally
    SERVICE="all"
elif [ $# -eq 1 ]; then
    if [ "$1" = "local" ]; then
        SERVICE="all"
    else
        # One argument - dockerhub user, build all and push
        DOCKERHUB_USER="$1"
        PUSH_TO_DOCKERHUB=true
        SERVICE="all"
    fi
elif [ $# -eq 2 ]; then
    # Two arguments
    if [ "$1" = "local" ]; then
        # local <service>
        SERVICE="$2"
    else
        # <dockerhub-user> <service>
        DOCKERHUB_USER="$1"
        SERVICE="$2"
        PUSH_TO_DOCKERHUB=true
    fi
fi

# Validate service name
VALID_SERVICES=("frontend" "backend" "middleware" "cart" "load-generator" "all")
if [[ ! " ${VALID_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
    echo "❌ Invalid service: $SERVICE"
    echo "Valid services: ${VALID_SERVICES[@]}"
    exit 1
fi

if [ "$PUSH_TO_DOCKERHUB" = true ]; then
    echo "🐳 Docker Hub user: $DOCKERHUB_USER"
    if [ "$SERVICE" = "all" ]; then
        echo "📦 Building all services for: $PLATFORMS"
    else
        echo "📦 Building $SERVICE for: $PLATFORMS"
    fi
    echo "Images will be pushed to Docker Hub after building"
    echo ""
    
    # Check if user is logged in to Docker Hub
    if ! docker info | grep -q "Username"; then
        echo "⚠️  You may need to log in to Docker Hub first:"
        echo "   docker login"
        echo ""
    fi
    
    # Setup buildx if needed
    echo "🔧 Setting up Docker buildx for multi-platform builds..."
    if ! docker buildx inspect cosmic-builder > /dev/null 2>&1; then
        docker buildx create --name cosmic-builder --use --bootstrap
        echo "✅ Buildx builder created"
    else
        docker buildx use cosmic-builder
        echo "✅ Using existing buildx builder"
    fi
    echo ""
else
    if [ "$SERVICE" = "all" ]; then
        echo "Building all Cosmic Coffee Shop Docker images (local architecture only)..."
    else
        echo "Building $SERVICE image (local architecture only)..."
    fi
    echo "💡 Tip: To build for multiple architectures and push to Docker Hub, run:"
    echo "   ./build-images.sh <your-dockerhub-username>"
    echo ""
fi

# Build function
build_service() {
    local service=$1
    local dir=$2
    local name=$3
    
    echo "📦 Building $name image..."
    cd "$dir"
    
    if [ "$PUSH_TO_DOCKERHUB" = true ]; then
        docker buildx build \
            --platform $PLATFORMS \
            --tag $DOCKERHUB_USER/cosmic-coffee-$service:latest \
            --push \
            .
        echo "✅ $name image built and pushed (multi-arch)"
    else
        docker build -t cosmic-coffee-$service:latest .
        echo "✅ $name image built"
    fi
    echo ""
    cd - > /dev/null
}

# Build selected service(s)
if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "frontend" ]; then
    build_service "frontend" "frontend" "Frontend"
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "backend" ]; then
    build_service "backend" "backend" "Backend"
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "middleware" ]; then
    build_service "middleware" "middleware" "Middleware"
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "cart" ]; then
    build_service "cart" "cart" "Cart"
fi

if [ "$SERVICE" = "all" ] || [ "$SERVICE" = "load-generator" ]; then
    build_service "load-generator" "load-generator" "Load Generator"
fi

echo "🎉 Build completed successfully!"
echo ""

if [ "$PUSH_TO_DOCKERHUB" = true ]; then
    echo "🎉 Images pushed to Docker Hub successfully!"
    echo ""
    if [ "$SERVICE" = "all" ]; then
        echo "Images available at (amd64 + arm64):"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-frontend:latest"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-backend:latest"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-middleware:latest"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-cart:latest"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-load-generator:latest"
    else
        echo "Image available at (amd64 + arm64):"
        echo "  - $DOCKERHUB_USER/cosmic-coffee-$SERVICE:latest"
    fi
    echo ""
    echo "✅ These images will work on:"
    echo "   - x86_64/amd64 instances (Intel/AMD)"
    echo "   - ARM64 instances (AWS Graviton, Apple Silicon)"
    echo ""
    echo "To update your Kubernetes manifests to use these images, run:"
    echo "  ./update-k8s-images.sh $DOCKERHUB_USER"
else
    if [ "$SERVICE" = "all" ]; then
        echo "Local images created:"
        echo "  - cosmic-coffee-frontend:latest"
        echo "  - cosmic-coffee-backend:latest"
        echo "  - cosmic-coffee-middleware:latest"
        echo "  - cosmic-coffee-cart:latest"
        echo "  - cosmic-coffee-load-generator:latest"
    else
        echo "Local image created:"
        echo "  - cosmic-coffee-$SERVICE:latest"
    fi
    echo ""
    echo "💡 Note: Local builds are for your current architecture only"
fi

echo ""
echo "Next steps:"
if [ "$PUSH_TO_DOCKERHUB" = true ]; then
    echo "  1. Update Kubernetes manifests: ./update-k8s-images.sh $DOCKERHUB_USER"
    echo "  2. Deploy to Kubernetes: ./deploy-k8s.sh"
    if [ "$SERVICE" != "all" ]; then
        echo "  3. Or restart just $SERVICE: kubectl rollout restart deployment/$SERVICE -n cosmic-coffee"
    fi
else
    echo "  1. Push to Docker Hub: ./build-images.sh <your-dockerhub-username>"
    echo "  2. Deploy locally: docker-compose up"
    echo "  3. Or deploy to Kubernetes: ./deploy-k8s.sh"
fi
