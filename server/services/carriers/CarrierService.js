const axios = require('axios');

class CarrierService {
  constructor(carrier) {
    this.carrier = carrier;
    this.apiKey = carrier.apiKey;
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

  // Common method for making API requests
  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url,
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
      throw new Error(`Carrier API error: ${error.message}`);
    }
  }
}

module.exports = CarrierService;