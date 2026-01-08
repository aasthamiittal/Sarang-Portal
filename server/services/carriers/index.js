const FedExService = require('./fedex');
// Add more carriers as needed
// const DHLService = require('./dhl');

const carrierServices = {
  'fedex': FedExService,
  // 'dhl': DHLService,
};

function getCarrierService(carrier) {
  const ServiceClass = carrierServices[carrier.name.toLowerCase()];
  if (!ServiceClass) {
    throw new Error(`No service implemented for carrier: ${carrier.name}`);
  }
  return new ServiceClass(carrier);
}

module.exports = { getCarrierService };