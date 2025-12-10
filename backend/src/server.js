const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const customersRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CART_URL = process.env.CART_URL || 'http://cart:3003';

// Middleware
app.use(cors());
app.use(express.json());

// Redis client
let redisClient;

// Initialize Redis
async function initRedis() {
  redisClient = createClient({
    url: REDIS_URL,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Connected to Redis'));

  await redisClient.connect();
}

// Make redis client available to routes
app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'backend' });
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function startServer() {
  try {
    await initRedis();
    app.listen(PORT, () => {
      console.log(`Backend API listening on port ${PORT}`);
      console.log(`Connected to Redis at ${REDIS_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

