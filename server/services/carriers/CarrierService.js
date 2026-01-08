const axios = require('axios');
const RetryMechanism = require('../retryMechanism');

class CarrierService {
  constructor(carrier) {
    this.carrier = carrier;
    this.apiKey = carrier.apiKey;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
    this.timeout = 30000; // 30 seconds timeout
    this.retryMech = new RetryMechanism(3, 2000);
  }

  // Abstract methods to be implemented by subclasses
  async generateAWB(shipmentData) {
    throw new Error('generateAWB must be implemented by subclass');
  }

  async fetchLabel(awbNumber) {
    throw new Error('fetchLabel must be implemented by subclass');
  }

  async fetchTracking(awbNumber) {
    throw new Error('fetchTracking must be implemented by subclass');
  }

  // Common method for making API requests with rate limiting and timeout
  async makeRequest(method, url, data = null, headers = {}) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.wait(this.rateLimitDelay - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const config = {
        method,
        url,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (this.apiKey) {
        config.headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Carrier API timeout: Request took longer than ${this.timeout}ms`);
      }
      throw new Error(`Carrier API error: ${error.response?.data?.message || error.message}`);
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithRetry(operation, context = {}) {
    return this.retryMech.executeWithRetry(operation, context);
  }
}

module.exports = CarrierService;