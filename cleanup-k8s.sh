#!/bin/bash

# Cleanup script for Cosmic Coffee Shop on Kubernetes
# This script removes all components from the Kubernetes cluster

set -e

echo "🧹 Cleaning up Cosmic Coffee Shop from Kubernetes..."
echo ""

# Delete namespace (this will delete all resources in the namespace)
echo "🗑️  Deleting namespace and all resources..."
kubectl delete namespace cosmic-coffee

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "All Cosmic Coffee Shop resources have been removed from the cluster."

