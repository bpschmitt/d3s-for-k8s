import React, { useState } from 'react';
import './Cart.css';

function Cart({ cart, onUpdateItem, onRemoveItem, onCheckout }) {
  const [customerName, setCustomerName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState(null);

  if (!cart || !cart.items) {
    return (
      <div className="cart">
        <h2>Your Cart</h2>
        <div className="cart-empty">
          <p>🛒 Your cart is empty</p>
          <p>Add some cosmic coffee to get started!</p>
        </div>
      </div>
    );
  }

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      return total + (item.basePrice * item.quantity);
    }, 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (cart.items.length === 0) {
      setMessage({ type: 'error', text: 'Your cart is empty' });
      return;
    }

    if (!customerName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    setCheckingOut(true);
    setMessage(null);

    const result = await onCheckout(customerName, specialInstructions);

    if (result.success) {
      setMessage({ type: 'success', text: 'Order placed successfully! 🎉' });
      setCustomerName('');
      setSpecialInstructions('');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to place order' });
    }

    setCheckingOut(false);
  };

  return (
    <div className="cart">
      <h2>Your Cart 🛒</h2>
      
      {cart.items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty</p>
          <p>Add some cosmic coffee to get started!</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.itemId} className="cart-item">
                <div className="cart-item-emoji">{item.itemEmoji}</div>
                <div className="cart-item-details">
                  <h3>{item.itemName}</h3>
                  <p className="cart-item-price">${item.basePrice.toFixed(2)} each</p>
                </div>
                <div className="cart-item-quantity">
                  <button
                    onClick={() => onUpdateItem(item.itemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => onUpdateItem(item.itemId, item.quantity + 1)}
                    disabled={item.quantity >= 10}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-total">
                  ${(item.basePrice * item.quantity).toFixed(2)}
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => onRemoveItem(item.itemId)}
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Total:</span>
              <span className="cart-total-amount">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <form className="checkout-form" onSubmit={handleCheckout}>
            <h3>Checkout</h3>
            
            <div className="form-group">
              <label htmlFor="customerName">Your Name *</label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="specialInstructions">Special Instructions (optional)</label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests?"
                rows="3"
              />
            </div>

            {message && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="checkout-button"
              disabled={checkingOut || cart.items.length === 0}
            >
              {checkingOut ? 'Placing Order...' : 'Place Order 🚀'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default Cart;

