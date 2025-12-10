import React, { useState } from 'react';
import './CoffeeMenu.css';

function CoffeeMenu({ menu, onAddToCart }) {
  const [addingItem, setAddingItem] = useState(null);

  if (!menu || menu.length === 0) {
    return <div className="menu-empty">No items available</div>;
  }

  const handleAddToCart = async (item) => {
    setAddingItem(item.id);
    await onAddToCart(item, 1);
    setAddingItem(null);
    
    // Show brief success feedback
    setTimeout(() => {
      setAddingItem(null);
    }, 500);
  };

  return (
    <div className="coffee-menu">
      <h2>Our Cosmic Menu</h2>
      <p className="menu-subtitle">Select items to add to your cart</p>
      <div className="menu-grid">
        {menu.map((item) => (
          <div key={item.id} className="menu-item">
            <div className="menu-item-emoji">{item.emoji}</div>
            <h3>{item.name}</h3>
            <p className="menu-item-description">{item.description}</p>
            <div className="menu-item-price">${item.basePrice.toFixed(2)}</div>
            <div className="menu-item-stock">
              {item.inStock ? (
                <span className="in-stock">✓ In Stock</span>
              ) : (
                <span className="out-of-stock">✗ Out of Stock</span>
              )}
            </div>
            {item.inStock && (
              <button
                className="add-to-cart-btn"
                onClick={() => handleAddToCart(item)}
                disabled={addingItem === item.id}
              >
                {addingItem === item.id ? 'Adding...' : 'Add to Cart 🛒'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CoffeeMenu;

