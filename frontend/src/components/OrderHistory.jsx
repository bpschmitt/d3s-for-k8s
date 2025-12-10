import React from 'react';
import './OrderHistory.css';

function OrderHistory({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="order-history">
        <h2>Order History</h2>
        <div className="no-orders">No orders yet. Place your first order!</div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h2>Order History</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-id">Order #{order.id}</div>
              <div className="order-status status-{order.status}">
                {order.status}
              </div>
            </div>
            <div className="order-details">
              <div className="order-customer">
                <strong>Customer:</strong> {order.customerName}
              </div>
              {order.items ? (
                order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-emoji">{item.itemEmoji}</span>
                    <span className="item-name">{item.itemName}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                ))
              ) : (
                <div className="order-item">
                  <span className="item-emoji">{order.itemEmoji}</span>
                  <span className="item-name">{order.itemName}</span>
                  <span className="item-quantity">x{order.quantity}</span>
                </div>
              )}
              {order.specialInstructions && (
                <div className="order-instructions">
                  <strong>Special Instructions:</strong> {order.specialInstructions}
                </div>
              )}
              <div className="order-footer">
                <div className="order-price">Total: ${order.totalPrice.toFixed(2)}</div>
                <div className="order-date">
                  {new Date(order.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderHistory;

