const express = require('express');
const router = express.Router();

// Cosmic coffee menu items
const MENU_ITEMS = [
  {
    id: 'nebula-latte',
    name: 'Nebula Latte',
    description: 'A swirling mix of espresso and steamed milk with cosmic purple foam',
    emoji: '🌌',
    basePrice: 5.99,
    inStock: true,
  },
  {
    id: 'supernova-espresso',
    name: 'Supernova Espresso',
    description: 'An explosive shot of pure energy to kickstart your day',
    emoji: '💥',
    basePrice: 3.99,
    inStock: true,
  },
  {
    id: 'galaxy-mocha',
    name: 'Galaxy Mocha',
    description: 'Rich chocolate and espresso swirled like distant galaxies',
    emoji: '🌠',
    basePrice: 6.49,
    inStock: true,
  },
  {
    id: 'asteroid-americano',
    name: 'Asteroid Americano',
    description: 'Bold and strong, like a rock hurtling through space',
    emoji: '☄️',
    basePrice: 4.49,
    inStock: true,
  },
  {
    id: 'lunar-cappuccino',
    name: 'Lunar Cappuccino',
    description: 'Smooth and creamy with a moon-white foam',
    emoji: '🌙',
    basePrice: 5.49,
    inStock: true,
  },
  {
    id: 'starlight-frappe',
    name: 'Starlight Frappé',
    description: 'Iced perfection with a shimmer of stardust',
    emoji: '✨',
    basePrice: 6.99,
    inStock: true,
  },
  {
    id: 'comet-cold-brew',
    name: 'Comet Cold Brew',
    description: 'Smooth cold brew with a tail of vanilla cream',
    emoji: '☄️',
    basePrice: 5.29,
    inStock: true,
  },
  {
    id: 'rocket-fuel',
    name: 'Rocket Fuel',
    description: 'Triple shot espresso for maximum lift-off',
    emoji: '🚀',
    basePrice: 4.99,
    inStock: true,
  },
];

// GET /api/menu - Get all menu items
router.get('/', async (req, res) => {
  try {
    // Simulate variable latency for observability
    const latency = Math.random() * 100 + 50; // 50-150ms
    await new Promise((resolve) => setTimeout(resolve, latency));

    // Occasionally simulate an error (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Simulated menu fetch error');
    }

    // Try to get menu from Redis cache
    const cachedMenu = await req.redisClient.get('menu:items');
    
    if (cachedMenu) {
      console.log('Menu served from cache');
      return res.json(JSON.parse(cachedMenu));
    }

    // Cache menu items
    await req.redisClient.setEx('menu:items', 300, JSON.stringify(MENU_ITEMS));
    
    console.log('Menu served from source');
    res.json(MENU_ITEMS);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/:id - Get specific menu item
router.get('/:id', async (req, res) => {
  try {
    const item = MENU_ITEMS.find((item) => item.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

module.exports = router;

