const axios = require('axios');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3002';

class MiddlewareClient {
  async validateOrder(orderData) {
    try {
      const response = await axios.post(`${MIDDLEWARE_URL}/validate`, orderData, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error validating order with middleware:', error.message);
      // Fallback validation
      return {
        valid: true,
        message: 'Validated with fallback (middleware unavailable)',
      };
    }
  }

  async calculatePrice(pricingData) {
    try {
      const response = await axios.post(`${MIDDLEWARE_URL}/calculate-price`, pricingData, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating price with middleware:', error.message);
      // Fallback calculation
      return {
        totalPrice: pricingData.basePrice * pricingData.quantity,
        message: 'Calculated with fallback (middleware unavailable)',
      };
    }
  }

  async checkInventory(inventoryData) {
    try {
      const response = await axios.post(`${MIDDLEWARE_URL}/check-inventory`, inventoryData, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error checking inventory with middleware:', error.message);
      // Fallback - assume available
      return {
        available: true,
        message: 'Inventory check fallback (middleware unavailable)',
      };
    }
  }
}

module.exports = new MiddlewareClient();

