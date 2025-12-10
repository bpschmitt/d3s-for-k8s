# OpenFeature Integration - Deployment Guide

## Overview

The Cosmic Coffee Shop now includes OpenFeature integration with Flagd for dynamic feature flag control. This enables controlled chaos engineering and observability demonstrations without code changes.

## What Was Implemented

### 1. Cart Service Updates

**File: `cart/requirements.txt`**
- Added `openfeature-sdk==0.5.1`
- Added `openfeature-provider-flagd==0.2.0`

**File: `cart/app.py`**
- Imported OpenFeature SDK and Flagd provider
- Initialized feature flag client at startup
- Added feature flag check to `add_item_to_cart` endpoint
- Implements chaos error injection (15% failure rate, 2-second delay)

### 2. Kubernetes Configuration

**New File: `k8s/cart/flagd-config.yaml`**
- ConfigMap containing feature flag definitions
- Defines `cart-chaos-errors` flag with configurable error rate and delay

**Updated File: `k8s/cart/deployment.yaml`**
- Added Flagd sidecar container (port 8013)
- Mounted flagd-config ConfigMap
- Added environment variables for Flagd connection

### 3. Documentation

**Updated File: `ARCHITECTURE.md`**
- Added comprehensive OpenFeature section
- Updated service diagrams to show Flagd sidecar
- Documented feature flag management procedures
- Added observability impact details

## Deployment Steps

### Step 1: Rebuild Cart Image

```bash
cd /Users/bschmitt/newrelic/git-repos/d3s-for-k8s
./build-images.sh bpschmitt cart
```

This builds the cart service with OpenFeature SDK dependencies.

### Step 2: Update Kubernetes Manifests (if needed)

```bash
./update-k8s-images.sh bpschmitt
```

Ensures all deployment manifests reference your Docker Hub images.

### Step 3: Deploy to Kubernetes

```bash
# Deploy all services (includes new flagd-config.yaml)
./deploy-k8s.sh
```

Or deploy just the cart service:

```bash
kubectl apply -f k8s/cart/flagd-config.yaml
kubectl apply -f k8s/cart/deployment.yaml
```

### Step 4: Verify Deployment

Check that cart pods have 2 containers (cart + flagd):

```bash
kubectl get pods -n cosmic-coffee -l app=cart
```

Expected output:
```
NAME                    READY   STATUS    RESTARTS   AGE
cart-xxxxxxxxxx-xxxxx   2/2     Running   0          30s
cart-xxxxxxxxxx-xxxxx   2/2     Running   0          30s
```

Check logs to verify OpenFeature connection:

```bash
kubectl logs -n cosmic-coffee -l app=cart -c cart | grep OpenFeature
```

Expected output:
```
✅ OpenFeature connected to Flagd at localhost:8013
```

## Testing the Feature Flag

### Observe Chaos Errors

With the default configuration (15% error rate), watch the load generator logs:

```bash
kubectl logs -n cosmic-coffee -l app=load-generator -f
```

You should see approximately 15% of "add to cart" operations fail with:
```
✗ Error adding to cart: Request failed with status code 503
```

And in the cart service logs:
```bash
kubectl logs -n cosmic-coffee -l app=cart -c cart -f
```

You should see:
```
🎲 Feature flag triggered chaos: 15% error rate, 2000ms delay
```

### Adjust Error Rate

Edit the ConfigMap to change the error rate:

```bash
kubectl edit configmap flagd-config -n cosmic-coffee
```

Change `errorRate` from `15` to `30` (or any value 0-100):

```json
{
  "flags": {
    "cart-chaos-errors": {
      "state": "ENABLED",
      "variants": {
        "on": {
          "enabled": true,
          "errorRate": 30,
          "delayMs": 2000
        },
        ...
      }
    }
  }
}
```

Restart cart pods to apply changes:

```bash
kubectl rollout restart deployment/cart -n cosmic-coffee
```

### Disable Feature Flag

To turn off chaos errors, edit the ConfigMap:

```bash
kubectl edit configmap flagd-config -n cosmic-coffee
```

Change `defaultVariant` to `"off"`:

```json
{
  "defaultVariant": "off"
}
```

Or set `enabled` to `false` in the variant:

```json
{
  "on": {
    "enabled": false,
    "errorRate": 0,
    "delayMs": 0
  }
}
```

Then restart:

```bash
kubectl rollout restart deployment/cart -n cosmic-coffee
```

## Observability Demo Scenarios

### Scenario 1: Baseline Performance

1. Disable the feature flag (`defaultVariant: "off"`)
2. Observe normal cart operations in APM/observability tool
3. Note baseline error rate (~0%) and latency

### Scenario 2: Introduce Chaos

1. Enable feature flag with 15% error rate
2. Watch error rate increase to ~15% in observability tool
3. Observe 2-second latency spikes on failed requests
4. Show error logs with "Feature flag triggered chaos"

### Scenario 3: Increase Chaos

1. Increase error rate to 50%
2. Show dramatic impact on user experience
3. Demonstrate how feature flags enable instant rollback

### Scenario 4: Instant Rollback

1. Disable feature flag
2. Show immediate return to normal operation
3. No code deployment or pod restart required (after initial restart)

## Architecture

```
┌─────────────────────────────────────┐
│         Cart Pod                     │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Cart Service │  │    Flagd     │ │
│  │  Port 3003   │──│  Port 8013   │ │
│  │  (Python)    │  │   (gRPC)     │ │
│  └──────────────┘  └──────┬───────┘ │
└────────────────────────────┼─────────┘
                             │
                             │ reads
                             ▼
                    ┌────────────────┐
                    │  flagd-config  │
                    │   ConfigMap    │
                    │  (flags.json)  │
                    └────────────────┘
```

## Current Feature Flags

### `cart-chaos-errors`

**Purpose:** Controlled chaos engineering for cart service

**Configuration:**
- `enabled` (boolean): Enable/disable the flag
- `errorRate` (0-100): Percentage of requests that fail
- `delayMs` (milliseconds): Delay before returning error

**Affected Endpoint:** `POST /cart/:id/items` (add items to cart)

**Error Response:**
```json
{
  "error": "Cart service temporarily unavailable",
  "code": "FEATURE_FLAG_CHAOS",
  "retryAfter": 2000
}
```

**HTTP Status:** 503 Service Unavailable

## Troubleshooting

### Flagd Sidecar Not Starting

Check Flagd logs:
```bash
kubectl logs -n cosmic-coffee <cart-pod-name> -c flagd
```

Common issues:
- ConfigMap not mounted correctly
- Invalid JSON in flags.json

### Feature Flag Not Working

1. Check OpenFeature connection in cart logs:
```bash
kubectl logs -n cosmic-coffee -l app=cart -c cart | grep OpenFeature
```

2. Verify Flagd is running:
```bash
kubectl get pods -n cosmic-coffee -l app=cart
# Should show 2/2 containers ready
```

3. Check ConfigMap exists:
```bash
kubectl get configmap flagd-config -n cosmic-coffee
```

### Changes Not Taking Effect

After editing the ConfigMap, you must restart the cart pods:
```bash
kubectl rollout restart deployment/cart -n cosmic-coffee
```

## Future Enhancements

With this foundation in place, you can easily add more feature flags:

1. **Dynamic Pricing**: A/B test different pricing strategies
2. **Cart TTL Variants**: Test different expiration times
3. **Regional Features**: Enable features by region
4. **Gradual Rollouts**: Roll out to percentage of users
5. **Multi-Service Flags**: Extend to backend, middleware, frontend

## Resources

- [OpenFeature Documentation](https://openfeature.dev/)
- [Flagd Documentation](https://flagd.dev/)
- [Feature Flag Best Practices](https://openfeature.dev/docs/tutorials/)
- [CNCF OpenFeature Project](https://www.cncf.io/projects/openfeature/)

---

**Implementation Complete!** ✅

The Cosmic Coffee Shop now demonstrates modern feature flag patterns with OpenFeature and Flagd, perfect for observability platform demos.

