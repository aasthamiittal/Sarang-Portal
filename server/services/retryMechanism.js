const mongoose = require('mongoose');

class RetryMechanism {
  constructor(maxRetries = 3, delay = 1000) {
    this.maxRetries = maxRetries;
    this.delay = delay;
  }

  async executeWithRetry(operation, context = {}) {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error.message);

        // Log failure
        await this.logFailure(error, context, attempts);

        if (attempts >= this.maxRetries) {
          throw new Error(`Operation failed after ${this.maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry
        await this.wait(this.delay * attempts);
      }
    }
  }

  async logFailure(error, context, attempt) {
    // In a real implementation, log to database or external service
    console.error(`Retry failure - Context: ${JSON.stringify(context)}, Attempt: ${attempt}, Error: ${error.message}`);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryMechanism;