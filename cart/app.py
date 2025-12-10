from flask import Flask, request, jsonify
from flask_cors import CORS
import redis
import json
import uuid
import os
import time
import random
from datetime import datetime
from openfeature import api
from openfeature.evaluation_context import EvaluationContext

# Import FlagdProvider - package name is openfeature-provider-flagd
# Import path uses underscores instead of hyphens
FlagdProvider = None
try:
    # Standard import for openfeature-provider-flagd package
    from openfeature_provider_flagd import FlagdProvider
except ImportError as e:
    # If that fails, try alternative paths
    try:
        from openfeature_provider_flagd.provider import FlagdProvider
    except ImportError:
        try:
            from openfeature_provider_flagd.flagd import FlagdProvider
        except ImportError:
            print(f"⚠️  Warning: Could not import FlagdProvider: {e}")
            FlagdProvider = None

app = Flask(__name__)
CORS(app)

# Configuration
PORT = int(os.getenv('PORT', 3003))
REDIS_URL = os.getenv('REDIS_URL', 'localhost:6379')
CART_TTL = 3600  # 1 hour

# Parse Redis URL
if REDIS_URL.startswith('redis://'):
    REDIS_URL = REDIS_URL.replace('redis://', '')
    
redis_host, redis_port = REDIS_URL.split(':') if ':' in REDIS_URL else (REDIS_URL, '6379')

# Initialize Redis client
redis_client = redis.Redis(
    host=redis_host,
    port=int(redis_port),
    decode_responses=True,
    socket_connect_timeout=5
)

# Test Redis connection
try:
    redis_client.ping()
    print(f"✅ Connected to Redis at {redis_host}:{redis_port}")
except redis.ConnectionError as e:
    print(f"⚠️  Warning: Could not connect to Redis: {e}")

# Initialize OpenFeature
flagd_host = os.getenv('FLAGD_HOST', 'localhost')
flagd_port = int(os.getenv('FLAGD_PORT', 8013))
feature_flag_client = None

if FlagdProvider is None:
    print("⚠️  Warning: FlagdProvider not available. Feature flags disabled.")
else:
    try:
        api.set_provider(FlagdProvider(host=flagd_host, port=flagd_port))
        feature_flag_client = api.get_client()
        print(f"✅ OpenFeature connected to Flagd at {flagd_host}:{flagd_port}")
    except Exception as e:
        print(f"⚠️  Warning: Could not connect to Flagd: {e}")
        feature_flag_client = None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'cart'}), 200


@app.route('/cart', methods=['POST'])
def create_cart():
    """Create a new cart"""
    try:
        cart_id = str(uuid.uuid4()).split('-')[0]  # Short cart ID
        cart = {
            'id': cart_id,
            'items': [],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        redis_client.setex(f'cart:{cart_id}', CART_TTL, json.dumps(cart))
        
        print(f"🛒 Cart created: {cart_id}")
        return jsonify(cart), 201
    except Exception as e:
        print(f"❌ Error creating cart: {e}")
        return jsonify({'error': 'Failed to create cart'}), 500


@app.route('/cart/<cart_id>', methods=['GET'])
def get_cart(cart_id):
    """Get cart by ID"""
    try:
        # Simulate variable latency (20-70ms)
        time.sleep((20 + random.random() * 50) / 1000)
        
        cart_data = redis_client.get(f'cart:{cart_id}')
        
        if not cart_data:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart = json.loads(cart_data)
        return jsonify(cart), 200
    except Exception as e:
        print(f"❌ Error fetching cart: {e}")
        return jsonify({'error': 'Failed to fetch cart'}), 500


@app.route('/cart/<cart_id>/items', methods=['POST'])
def add_item_to_cart(cart_id):
    """Add item to cart"""
    try:
        # Check feature flag for chaos/error injection
        if feature_flag_client:
            context = EvaluationContext(targeting_key=cart_id, attributes={"endpoint": "add_item"})
            error_config = feature_flag_client.get_object_value(
                "cart-chaos-errors", 
                {"enabled": False, "errorRate": 0, "delayMs": 1000},
                evaluation_context=context
            )
            
            if error_config.get("enabled", False):
                error_rate = error_config.get("errorRate", 0)
                delay_ms = error_config.get("delayMs", 1000)
                
                # Random error injection based on rate (0-100)
                if random.random() * 100 < error_rate:
                    print(f"🎲 Feature flag triggered chaos: {error_rate}% error rate, {delay_ms}ms delay")
                    time.sleep(delay_ms / 1000)
                    return jsonify({
                        'error': 'Cart service temporarily unavailable',
                        'code': 'FEATURE_FLAG_CHAOS',
                        'retryAfter': delay_ms
                    }), 503
        
        data = request.get_json()
        item_id = data.get('itemId')
        item_name = data.get('itemName')
        item_emoji = data.get('itemEmoji')
        quantity = data.get('quantity', 1)
        base_price = data.get('basePrice', 0)
        
        if not item_id or not quantity:
            return jsonify({'error': 'itemId and quantity are required'}), 400
        
        # Simulate variable latency (50-150ms)
        time.sleep((50 + random.random() * 100) / 1000)
        
        cart_data = redis_client.get(f'cart:{cart_id}')
        
        if not cart_data:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart = json.loads(cart_data)
        
        # Check if item already exists in cart
        existing_item = next((item for item in cart['items'] if item['itemId'] == item_id), None)
        
        if existing_item:
            existing_item['quantity'] += quantity
        else:
            cart['items'].append({
                'itemId': item_id,
                'itemName': item_name,
                'itemEmoji': item_emoji,
                'quantity': quantity,
                'basePrice': base_price,
                'addedAt': datetime.now().isoformat()
            })
        
        cart['updatedAt'] = datetime.now().isoformat()
        
        # Save updated cart
        redis_client.setex(f'cart:{cart_id}', CART_TTL, json.dumps(cart))
        
        print(f"➕ Added {quantity}x {item_id} to cart {cart_id}")
        return jsonify(cart), 200
    except Exception as e:
        print(f"❌ Error adding item to cart: {e}")
        return jsonify({'error': 'Failed to add item to cart'}), 500


@app.route('/cart/<cart_id>/items/<item_id>', methods=['PATCH'])
def update_cart_item(cart_id, item_id):
    """Update item quantity in cart"""
    try:
        data = request.get_json()
        quantity = data.get('quantity')
        
        if quantity is None:
            return jsonify({'error': 'quantity is required'}), 400
        
        cart_data = redis_client.get(f'cart:{cart_id}')
        
        if not cart_data:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart = json.loads(cart_data)
        item = next((item for item in cart['items'] if item['itemId'] == item_id), None)
        
        if not item:
            return jsonify({'error': 'Item not found in cart'}), 404
        
        if quantity <= 0:
            # Remove item if quantity is 0
            cart['items'] = [item for item in cart['items'] if item['itemId'] != item_id]
        else:
            item['quantity'] = quantity
        
        cart['updatedAt'] = datetime.now().isoformat()
        
        redis_client.setex(f'cart:{cart_id}', CART_TTL, json.dumps(cart))
        
        print(f"📝 Updated {item_id} quantity to {quantity} in cart {cart_id}")
        return jsonify(cart), 200
    except Exception as e:
        print(f"❌ Error updating cart item: {e}")
        return jsonify({'error': 'Failed to update cart item'}), 500


@app.route('/cart/<cart_id>/items/<item_id>', methods=['DELETE'])
def remove_cart_item(cart_id, item_id):
    """Remove item from cart"""
    try:
        cart_data = redis_client.get(f'cart:{cart_id}')
        
        if not cart_data:
            return jsonify({'error': 'Cart not found'}), 404
        
        cart = json.loads(cart_data)
        cart['items'] = [item for item in cart['items'] if item['itemId'] != item_id]
        cart['updatedAt'] = datetime.now().isoformat()
        
        redis_client.setex(f'cart:{cart_id}', CART_TTL, json.dumps(cart))
        
        print(f"🗑️  Removed {item_id} from cart {cart_id}")
        return jsonify(cart), 200
    except Exception as e:
        print(f"❌ Error removing cart item: {e}")
        return jsonify({'error': 'Failed to remove cart item'}), 500


@app.route('/cart/<cart_id>', methods=['DELETE'])
def clear_cart(cart_id):
    """Clear cart"""
    try:
        result = redis_client.delete(f'cart:{cart_id}')
        
        if result == 0:
            return jsonify({'error': 'Cart not found'}), 404
        
        print(f"🧹 Cart cleared: {cart_id}")
        return jsonify({'message': 'Cart cleared successfully'}), 200
    except Exception as e:
        print(f"❌ Error clearing cart: {e}")
        return jsonify({'error': 'Failed to clear cart'}), 500


@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    print(f"❌ Error: {error}")
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500


if __name__ == '__main__':
    print(f"🚀 Cart service starting on port {PORT}")
    print(f"🔗 Redis: {redis_host}:{redis_port}")
    app.run(host='0.0.0.0', port=PORT, debug=False)

