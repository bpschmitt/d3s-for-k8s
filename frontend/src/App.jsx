import React, { useState, useEffect } from 'react';
import CoffeeMenu from './components/CoffeeMenu';
import Cart from './components/Cart';
import OrderHistory from './components/OrderHistory';
import './App.css';

// API URL: empty string means same origin (nginx will proxy to backend)
const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');

  useEffect(() => {
    fetchMenu();
    fetchOrders();
    createCart();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/api/menu`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenu(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const createCart = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to create cart');
      const data = await response.json();
      setCart(data);
      setCartId(data.id);
    } catch (err) {
      console.error('Error creating cart:', err);
    }
  };

  const fetchCart = async () => {
    if (!cartId) return;
    try {
      const response = await fetch(`${API_URL}/api/cart/${cartId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleAddToCart = async (item, quantity = 1) => {
    if (!cartId) {
      await createCart();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/cart/${cartId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.name,
          itemEmoji: item.emoji,
          quantity: quantity,
          basePrice: item.basePrice,
        }),
      });

      if (!response.ok) throw new Error('Failed to add item to cart');
      const updatedCart = await response.json();
      setCart(updatedCart);
      return { success: true };
    } catch (err) {
      console.error('Error adding to cart:', err);
      return { success: false, error: err.message };
    }
  };

  const handleUpdateCartItem = async (itemId, quantity) => {
    try {
      const response = await fetch(`${API_URL}/api/cart/${cartId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) throw new Error('Failed to update cart item');
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating cart item:', err);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/cart/${cartId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove item from cart');
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const handleCheckout = async (customerName, specialInstructions) => {
    try {
      // Create order from cart
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          specialInstructions,
          cartId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const newOrder = await response.json();
      setOrders([newOrder, ...orders]);
      
      // Create a new cart for next order
      await createCart();
      
      setActiveTab('history');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading cosmic menu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>☕️ Cosmic Coffee Shop 🚀</h1>
        <p>Order your favorite space-themed beverages!</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'menu' ? 'active' : ''}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </button>
        <button
          className={activeTab === 'cart' ? 'active' : ''}
          onClick={() => setActiveTab('cart')}
        >
          Cart {cart && cart.items && cart.items.length > 0 && `(${cart.items.length})`}
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Order History
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'menu' && (
          <CoffeeMenu menu={menu} onAddToCart={handleAddToCart} />
        )}
        {activeTab === 'cart' && (
          <Cart
            cart={cart}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveFromCart}
            onCheckout={handleCheckout}
          />
        )}
        {activeTab === 'history' && <OrderHistory orders={orders} />}
      </main>
    </div>
  );
}

export default App;

