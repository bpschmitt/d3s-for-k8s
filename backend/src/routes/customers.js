const express = require('express');
const router = express.Router();

// GET /api/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    // Simulate latency
    const latency = Math.random() * 50 + 20;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const customers = await req.redisClient.sMembers('customers');
    
    res.json(customers.sort());
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:name/orders - Get orders for a specific customer
router.get('/:name/orders', async (req, res) => {
  try {
    const customerName = req.params.name;
    const orderKeys = await req.redisClient.keys('order:*');
    const customerOrders = [];

    for (const key of orderKeys) {
      const orderData = await req.redisClient.get(key);
      if (orderData) {
        const order = JSON.parse(orderData);
        if (order.customerName === customerName) {
          customerOrders.push(order);
        }
      }
    }

    // Sort by timestamp descending
    customerOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(customerOrders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

module.exports = router;

