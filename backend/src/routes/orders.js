const express = require('express');
const { v4: uuidv4 } = require('uuid');
const middlewareClient = require('../services/middleware-client');

const router = express.Router();

// GET /api/orders - Get all orders
router.get('/', async (req, res) => {
  try {
    // Simulate variable latency
    const latency = Math.random() * 100 + 30;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const orderKeys = await req.redisClient.keys('order:*');
    const orders = [];

    for (const key of orderKeys) {
      const orderData = await req.redisClient.get(key);
      if (orderData) {
        orders.push(JSON.parse(orderData));
      }
    }

    // Sort by timestamp descending
    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', async (req, res) => {
  try {
    const orderData = await req.redisClient.get(`order:${req.params.id}`);
    
    if (!orderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(JSON.parse(orderData));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order from cart
router.post('/', async (req, res) => {
  try {
    const { customerName, cartId, specialInstructions } = req.body;

    // Validate input
    if (!customerName || !cartId) {
      return res.status(400).json({ error: 'Missing required fields: customerName and cartId' });
    }

    // Simulate variable latency
    const latency = Math.random() * 200 + 100; // 100-300ms
    await new Promise((resolve) => setTimeout(resolve, latency));

    // Occasionally simulate an error (3% chance)
    if (Math.random() < 0.03) {
      throw new Error('Simulated order processing error');
    }

    // Fetch cart from cart service
    const axios = require('axios');
    const CART_URL = process.env.CART_URL || 'http://cart:3003';
    
    let cart;
    try {
      const cartResponse = await axios.get(`${CART_URL}/cart/${cartId}`);
      cart = cartResponse.data;
    } catch (error) {
      return res.status(404).json({ error: 'Cart not found or cart service unavailable' });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Get menu item details for validation
    const menuData = await req.redisClient.get('menu:items');
    let menuItems = [];
    if (menuData) {
      menuItems = JSON.parse(menuData);
    }

    // Process each item in cart
    let totalPrice = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const menuItem = menuItems.find((item) => item.id === cartItem.itemId);
      if (!menuItem) {
        return res.status(404).json({ error: `Menu item not found: ${cartItem.itemId}` });
      }

      // Validate each item
      const validationResult = await middlewareClient.validateOrder({
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        customerName,
      });

      if (!validationResult.valid) {
        return res.status(400).json({ error: `Validation failed for ${cartItem.itemName}: ${validationResult.error}` });
      }

      // Calculate price for this item
      const pricingResult = await middlewareClient.calculatePrice({
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        basePrice: cartItem.basePrice,
      });

      // Check inventory
      const inventoryResult = await middlewareClient.checkInventory({
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
      });

      if (!inventoryResult.available) {
        return res.status(400).json({ error: `Insufficient inventory for ${cartItem.itemName}` });
      }

      totalPrice += pricingResult.totalPrice;
      orderItems.push({
        itemId: cartItem.itemId,
        itemName: cartItem.itemName,
        itemEmoji: cartItem.itemEmoji,
        quantity: cartItem.quantity,
        basePrice: cartItem.basePrice,
        itemTotal: pricingResult.totalPrice,
      });
    }

    // Create order
    const orderId = uuidv4().split('-')[0];
    const order = {
      id: orderId,
      customerName,
      items: orderItems,
      specialInstructions: specialInstructions || '',
      totalPrice,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Store order in Redis
    await req.redisClient.setEx(`order:${orderId}`, 3600, JSON.stringify(order));

    // Store customer info
    await req.redisClient.sAdd('customers', customerName);

    // Clear the cart
    try {
      await axios.delete(`${CART_URL}/cart/${cartId}`);
    } catch (error) {
      console.error('Failed to clear cart:', error.message);
      // Don't fail the order if cart clearing fails
    }

    console.log(`Order created: ${orderId} for ${customerName} with ${orderItems.length} items`);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
});

// PATCH /api/orders/:id - Update order status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const orderData = await req.redisClient.get(`order:${req.params.id}`);
    
    if (!orderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = JSON.parse(orderData);
    order.status = status;
    order.updatedAt = new Date().toISOString();

    await req.redisClient.setEx(`order:${req.params.id}`, 3600, JSON.stringify(order));

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;

