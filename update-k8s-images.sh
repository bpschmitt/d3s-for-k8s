#!/bin/bash

# Script to update Kubernetes deployment manifests with Docker Hub username
# This script is idempotent - can be run multiple times safely

set -e

DOCKERHUB_USER="${1:-}"

if [ -z "$DOCKERHUB_USER" ]; then
    echo "❌ Error: Docker Hub username is required"
    echo ""
    echo "Usage: $0 <dockerhub-username>"
    echo ""
    echo "Example: $0 bpschmitt"
    exit 1
fi

echo "🔄 Updating Kubernetes deployment manifests..."
echo "Docker Hub user: $DOCKERHUB_USER"
echo ""

# Function to update image in a deployment file
update_deployment_image() {
    local file=$1
    local service=$2
    
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        return
    fi
    
    # Use sed to replace image line, handling both cases:
    # 1. cosmic-coffee-SERVICE:latest (no username)
    # 2. */cosmic-coffee-SERVICE:latest (already has a username)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed
        sed -i '' "s|image: .*cosmic-coffee-${service}:latest|image: ${DOCKERHUB_USER}/cosmic-coffee-${service}:latest|g" "$file"
    else
        # Linux sed
        sed -i "s|image: .*cosmic-coffee-${service}:latest|image: ${DOCKERHUB_USER}/cosmic-coffee-${service}:latest|g" "$file"
    fi
    
    echo "✅ Updated $file"
}

# Update each service deployment
update_deployment_image "k8s/frontend/deployment.yaml" "frontend"
update_deployment_image "k8s/backend/deployment.yaml" "backend"
update_deployment_image "k8s/middleware/deployment.yaml" "middleware"
update_deployment_image "k8s/cart/deployment.yaml" "cart"
update_deployment_image "k8s/load-generator/deployment.yaml" "load-generator"

echo ""
echo "🎉 All deployment manifests updated!"
echo ""
echo "Images now configured as:"
echo "  - $DOCKERHUB_USER/cosmic-coffee-frontend:latest"
echo "  - $DOCKERHUB_USER/cosmic-coffee-backend:latest"
echo "  - $DOCKERHUB_USER/cosmic-coffee-middleware:latest"
echo "  - $DOCKERHUB_USER/cosmic-coffee-cart:latest"
echo "  - $DOCKERHUB_USER/cosmic-coffee-load-generator:latest"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff k8s/*/deployment.yaml"
echo "  2. Apply to cluster: kubectl apply -f k8s/frontend/ -f k8s/backend/ -f k8s/middleware/ -f k8s/cart/ -f k8s/load-generator/"
echo "  3. Or use: ./deploy-k8s.sh"

