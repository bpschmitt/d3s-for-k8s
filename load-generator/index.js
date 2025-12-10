const axios = require('axios');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';
const REQUEST_RATE = parseInt(process.env.REQUEST_RATE) || 10; // requests per minute
const CUSTOMER_NAMES = [
  'Alice Anderson',
  'Bob Builder',
  'Charlie Chen',
  'Diana Davis',
  'Ethan Evans',
  'Fiona Foster',
  'George Garcia',
  'Hannah Harris',
  'Isaac Ibrahim',
  'Julia Johnson',
  'Kevin Kim',
  'Laura Lee',
  'Michael Martinez',
  'Nina Nelson',
  'Oliver O\'Brien',
];

const MENU_ITEMS = [
  'nebula-latte',
  'supernova-espresso',
  'galaxy-mocha',
  'asteroid-americano',
  'lunar-cappuccino',
  'starlight-frappe',
  'comet-cold-brew',
  'rocket-fuel',
];

const SPECIAL_INSTRUCTIONS = [
  '',
  '',
  '',
  'Extra hot',
  'Light ice',
  'Extra foam',
  'Oat milk please',
  'Double shot',
  'No sugar',
  'Extra sweet',
];

let requestCount = 0;
let successCount = 0;
let errorCount = 0;

// Get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fetch menu
async function fetchMenu() {
  try {
    const response = await axios.get(`${FRONTEND_URL}/api/menu`, {
      timeout: 5000,
    });
    requestCount++;
    successCount++;
    console.log(`✓ Fetched menu (${response.data.length} items)`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    console.error(`✗ Error fetching menu: ${error.message}`);
    return null;
  }
}

// Create a cart
async function createCart() {
  try {
    const response = await axios.post(`${FRONTEND_URL}/api/cart`, {}, {
      timeout: 5000,
    });
    requestCount++;
    successCount++;
    console.log(`🛒 Created cart ${response.data.id}`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    console.error(`✗ Error creating cart: ${error.message}`);
    return null;
  }
}

// Add item to cart
async function addToCart(cartId, itemId, itemName, itemEmoji, basePrice, quantity = 1) {
  try {
    const response = await axios.post(`${FRONTEND_URL}/api/cart/${cartId}/items`, {
      itemId,
      itemName,
      itemEmoji,
      quantity,
      basePrice,
    }, {
      timeout: 5000,
    });
    requestCount++;
    successCount++;
    console.log(`➕ Added ${quantity}x ${itemName} to cart ${cartId}`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    console.error(`✗ Error adding to cart: ${error.message}`);
    return null;
  }
}

// Checkout (place order from cart)
async function checkout(cartId, customerName) {
  try {
    const response = await axios.post(`${FRONTEND_URL}/api/orders`, {
      customerName,
      cartId,
      specialInstructions: getRandomElement(SPECIAL_INSTRUCTIONS),
    }, {
      timeout: 10000,
    });
    requestCount++;
    successCount++;
    console.log(`✓ Placed order #${response.data.id} for ${customerName} (${response.data.items?.length || 0} items)`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    if (error.response) {
      console.error(`✗ Error checking out: ${error.response.data.error || error.message}`);
    } else {
      console.error(`✗ Error checking out: ${error.message}`);
    }
    return null;
  }
}

// Fetch orders
async function fetchOrders() {
  try {
    const response = await axios.get(`${FRONTEND_URL}/api/orders`, {
      timeout: 5000,
    });
    requestCount++;
    successCount++;
    console.log(`✓ Fetched orders (${response.data.length} orders)`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    console.error(`✗ Error fetching orders: ${error.message}`);
    return null;
  }
}

// Fetch customers
async function fetchCustomers() {
  try {
    const response = await axios.get(`${FRONTEND_URL}/api/customers`, {
      timeout: 5000,
    });
    requestCount++;
    successCount++;
    console.log(`✓ Fetched customers (${response.data.length} customers)`);
    return response.data;
  } catch (error) {
    requestCount++;
    errorCount++;
    console.error(`✗ Error fetching customers: ${error.message}`);
    return null;
  }
}

// Simulate realistic user behavior with cart
async function simulateUserSession() {
  // 1. User visits and checks menu (80% of the time)
  let menu = null;
  if (Math.random() < 0.8) {
    menu = await fetchMenu();
    await sleep(Math.random() * 2000 + 500); // Wait 0.5-2.5 seconds
  }

  // 2. User adds items to cart and places order (60% of the time)
  if (Math.random() < 0.6 && menu && menu.length > 0) {
    // Create a cart
    const cart = await createCart();
    if (cart) {
      await sleep(Math.random() * 500 + 200); // Wait 0.2-0.7 seconds
      
      // Add 1-3 random items to cart
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        const item = getRandomElement(menu);
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 of each item
        await addToCart(cart.id, item.id, item.name, item.emoji, item.basePrice, quantity);
        await sleep(Math.random() * 1000 + 300); // Wait 0.3-1.3 seconds between items
      }
      
      // Checkout (90% of the time - some cart abandonment)
      if (Math.random() < 0.9) {
        await sleep(Math.random() * 1000 + 500); // Wait 0.5-1.5 seconds before checkout
        const customerName = getRandomElement(CUSTOMER_NAMES);
        await checkout(cart.id, customerName);
      } else {
        console.log(`🛒 Cart ${cart.id} abandoned (simulated cart abandonment)`);
      }
    }
  }

  // 3. User checks order history (30% of the time)
  if (Math.random() < 0.3) {
    await fetchOrders();
    await sleep(Math.random() * 1000); // Wait 0-1 seconds
  }

  // 4. Admin checks customers (10% of the time)
  if (Math.random() < 0.1) {
    await fetchCustomers();
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Print statistics
function printStats() {
  const uptime = process.uptime();
  const requestsPerSecond = (requestCount / uptime).toFixed(2);
  const successRate = requestCount > 0 ? ((successCount / requestCount) * 100).toFixed(2) : 0;

  console.log('\n=== Load Generator Statistics ===');
  console.log(`Uptime: ${Math.floor(uptime)}s`);
  console.log(`Total Requests: ${requestCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Requests/sec: ${requestsPerSecond}`);
  console.log('================================\n');
}

// Main loop
async function main() {
  console.log('🚀 Cosmic Coffee Load Generator Started');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Target Request Rate: ${REQUEST_RATE} requests/minute\n`);

  // Calculate delay between requests
  const delayBetweenRequests = (60 * 1000) / REQUEST_RATE;

  // Print stats every 30 seconds
  setInterval(printStats, 30000);

  // Run initial test
  console.log('Running initial connectivity test...');
  await fetchMenu();

  // Main generation loop
  while (true) {
    try {
      await simulateUserSession();
      await sleep(delayBetweenRequests);
    } catch (error) {
      console.error('Unexpected error in main loop:', error.message);
      await sleep(5000); // Wait 5 seconds on error
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM signal, shutting down gracefully...');
  printStats();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal, shutting down gracefully...');
  printStats();
  process.exit(0);
});

// Start the load generator
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

