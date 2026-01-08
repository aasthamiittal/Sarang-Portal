const CarrierService = require('./CarrierService');

class FedExService extends CarrierService {
  constructor(carrier) {
    super(carrier);
    this.baseUrl = 'https://apis.fedex.com';
    this.clientId = carrier.clientId;
    this.clientSecret = carrier.apiKey; // Assuming apiKey is client_secret
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await this.makeRequest('POST', `${this.baseUrl}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this.accessToken = response.access_token;
    // Token expires in response.expires_in seconds, set expiry 5 min early
    this.tokenExpiry = Date.now() + (response.expires_in - 300) * 1000;
    return this.accessToken;
  }

  async makeRequest(method, url, data = null, headers = {}) {
    const token = await this.getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
    return super.makeRequest(method, url, data, headers);
  }

  async generateAWB(shipmentData) {
    return this.executeWithRetry(async () => {
      // Prepare shipment payload for FedEx Ship API
      const payload = {
        accountNumber: {
          value: shipmentData.accountNumber || 'YOUR_FEDEX_ACCOUNT_NUMBER' // Should be configurable
        },
        requestedShipment: {
          shipper: {
            contact: {
              personName: shipmentData.shipper.name,
              phoneNumber: shipmentData.shipper.phone
            },
            address: {
              streetLines: [shipmentData.shipper.address.line1],
              city: shipmentData.shipper.address.city,
              stateOrProvinceCode: shipmentData.shipper.address.state,
              postalCode: shipmentData.shipper.address.postalCode,
              countryCode: shipmentData.shipper.address.countryCode
            }
          },
          recipients: [{
            contact: {
              personName: shipmentData.recipient.name,
              phoneNumber: shipmentData.recipient.phone
            },
            address: {
              streetLines: [shipmentData.recipient.address.line1],
              city: shipmentData.recipient.address.city,
              stateOrProvinceCode: shipmentData.recipient.address.state,
              postalCode: shipmentData.recipient.address.postalCode,
              countryCode: shipmentData.recipient.address.countryCode
            }
          }],
          shipDatestamp: new Date().toISOString().split('T')[0],
          serviceType: shipmentData.serviceType || 'FEDEX_GROUND',
          packagingType: shipmentData.packagingType || 'YOUR_PACKAGING',
          pickupType: 'USE_SCHEDULED_PICKUP',
          blockInsightVisibility: false,
          shippingChargesPayment: {
            paymentType: 'SENDER'
          },
          labelSpecification: {
            imageType: 'PDF',
            labelStockType: 'PAPER_8.5X11_TOP_HALF_LABEL'
          },
          requestedPackageLineItems: [{
            weight: {
              units: 'KG',
              value: shipmentData.weight
            },
            dimensions: {
              length: shipmentData.length || 10,
              width: shipmentData.width || 10,
              height: shipmentData.height || 10,
              units: 'CM'
            }
          }]
        },
        labelResponseOptions: 'URL_ONLY',
        accountNumber: {
          value: shipmentData.accountNumber || 'YOUR_FEDEX_ACCOUNT_NUMBER'
        }
      };

      const response = await this.makeRequest('POST', `${this.baseUrl}/ship/v1/shipments`, payload);
      return {
        awbNumber: response.output.transactionShipments[0].masterTrackingNumber,
        labelUrl: response.output.transactionShipments[0].pieceResponses[0].packageDocuments[0].url
      };
    }, { operation: 'generateAWB', shipmentData });
  }

  async fetchLabel(awbNumber) {
    // For FedEx, label is typically obtained during shipment creation
    // If needed separately, can call Ship API again or use stored URL
    // For now, return placeholder - in practice, store label URL from generateAWB
    throw new Error('Label should be fetched during AWB generation. Use stored label URL.');
  }

  async fetchTracking(awbNumber) {
    const response = await this.makeRequest('GET', `${this.baseUrl}/track/v1/trackingnumbers`, null, {
      'trackingnumber': awbNumber
    });

    return response.output.completeTrackResults[0].trackResults[0].scanEvents.map(event => ({
      status: event.eventType,
      timestamp: new Date(event.date + 'T' + event.time),
      location: `${event.scanLocation.city}, ${event.scanLocation.stateOrProvinceCode}, ${event.scanLocation.countryCode}`,
      description: event.eventDescription
    }));
  }
}

module.exports = FedExService;