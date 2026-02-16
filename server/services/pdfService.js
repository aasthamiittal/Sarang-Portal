const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');

class PDFService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Generate shipping label PDF
  async generateShippingLabel(shipment, userId) {
    const doc = new PDFDocument();
    const fileName = `shipping_label_${shipment.orderId}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Shipping Label', { align: 'center' });
    doc.moveDown();

    // Shipment details
    doc.fontSize(14).text(`Order ID: ${shipment.orderId}`);
    doc.text(`Tracking Number: ${shipment.trackingNumber}`);
    doc.text(`AWB Number: ${shipment.awbNumber || 'N/A'}`);
    doc.text(`Carrier: ${(shipment.carrierId && shipment.carrierId.name) || shipment.carrier}`);
    doc.moveDown();

    // Addresses
    doc.text('From:');
    doc.fontSize(12).text(`${shipment.origin}`);
    doc.moveDown();

    doc.fontSize(14).text('To:');
    if (shipment.customerInfo) {
      doc.fontSize(12).text(`${shipment.customerInfo.firstName} ${shipment.customerInfo.lastName}`);
      doc.text(`${shipment.destination}`);
    } else {
      doc.text(`${shipment.destination}`);
    }
    doc.moveDown();

    // Package details
    doc.fontSize(14).text('Package Details:');
    doc.fontSize(12).text(`Weight: ${shipment.weight} kg`);
    doc.text(`Cost: $${shipment.cost}`);
    doc.moveDown();

    // Barcode placeholder (in real implementation, use barcode library)
    doc.fontSize(14).text('Barcode: [Tracking Number]');
    doc.moveDown();

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        // Save to Document model
        const document = new Document({
          filename: fileName,
          originalName: fileName,
          mimetype: 'application/pdf',
          size: fs.statSync(filePath).size,
          path: filePath,
          userId: userId
        });
        await document.save();
        resolve({ filePath, documentId: document._id });
      });
      stream.on('error', reject);
    });
  }

  // Generate customs invoice PDF
  async generateCustomsInvoice(shipment, userId) {
    const doc = new PDFDocument();
    const fileName = `customs_invoice_${shipment.orderId}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Customs Invoice', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(14).text(`Invoice Number: INV-${shipment.orderId}`);
    doc.text(`Date: ${new Date().toDateString()}`);
    doc.moveDown();

    // Shipment details
    doc.text('Shipment Details:');
    doc.fontSize(12).text(`Order ID: ${shipment.orderId}`);
    doc.text(`HSN Code: ${shipment.productInfo?.hsnCode || 'N/A'}`);
    doc.text(`Declared Value: $${shipment.cost}`);
    doc.text(`Origin Country: ${shipment.origin}`);
    doc.text(`Destination Country: ${shipment.destination}`);
    doc.moveDown();

    // Items (simplified)
    doc.fontSize(14).text('Items:');
    doc.fontSize(12).text(`Description: ${shipment.productInfo?.description || 'General Goods'}`);
    doc.text(`Quantity: 1`);
    doc.text(`Weight: ${shipment.weight} kg`);
    doc.text(`Value: $${shipment.cost}`);
    doc.moveDown();

    // Tax details (placeholder)
    doc.fontSize(14).text('Tax Details:');
    doc.fontSize(12).text(`CGST: 9%`);
    doc.fontSize(12).text(`SGST: 9%`);
    doc.fontSize(12).text(`IGST: 0%`);
    const tax = shipment.cost * 0.18;
    doc.text(`Total Tax: $${tax.toFixed(2)}`);
    doc.moveDown();

    const total = shipment.cost + tax;
    doc.fontSize(14).text(`Total Amount: $${total.toFixed(2)}`);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        const document = new Document({
          filename: fileName,
          originalName: fileName,
          mimetype: 'application/pdf',
          size: fs.statSync(filePath).size,
          path: filePath,
          userId: userId
        });
        await document.save();
        resolve({ filePath, documentId: document._id });
      });
      stream.on('error', reject);
    });
  }

  // Generate manifest PDF
  async generateManifestPDF(manifest, shipments, userId) {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const fileName = `manifest_${manifest._id}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Shipment Manifest', { align: 'center' });
    doc.moveDown();

    // Manifest details
    doc.fontSize(14).text(`Manifest ID: ${manifest._id}`);
    doc.text(`Created: ${manifest.createdAt.toDateString()}`);
    doc.text(`Status: ${manifest.status}`);
    doc.moveDown();

    // Table header
    const tableTop = 150;
    doc.fontSize(12);
    doc.text('Order ID', 50, tableTop);
    doc.text('Tracking Number', 150, tableTop);
    doc.text('Carrier', 300, tableTop);
    doc.text('Origin', 400, tableTop);
    doc.text('Destination', 500, tableTop);
    doc.text('Weight', 600, tableTop);
    doc.text('Cost', 650, tableTop);

    // Table rows
    let y = tableTop + 20;
    shipments.forEach(shipment => {
      doc.text(shipment.orderId, 50, y);
      doc.text(shipment.trackingNumber, 150, y);
      doc.text((shipment.carrierId && shipment.carrierId.name) || shipment.carrier, 300, y);
      doc.text(shipment.origin, 400, y);
      doc.text(shipment.destination, 500, y);
      doc.text(`${shipment.weight}kg`, 600, y);
      doc.text(`$${shipment.cost}`, 650, y);
      y += 20;
    });

    // Summary
    doc.moveDown();
    const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
    const totalCost = shipments.reduce((sum, s) => sum + s.cost, 0);
    doc.fontSize(14).text(`Total Shipments: ${shipments.length}`);
    doc.text(`Total Weight: ${totalWeight} kg`);
    doc.text(`Total Cost: $${totalCost}`);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        const document = new Document({
          filename: fileName,
          originalName: fileName,
          mimetype: 'application/pdf',
          size: fs.statSync(filePath).size,
          path: filePath,
          userId: userId
        });
        await document.save();
        resolve({ filePath, documentId: document._id });
      });
      stream.on('error', reject);
    });
  }

  // Generate billing/tax invoice PDF (extend existing invoiceGenerator)
  async generateBillingInvoice(billing, shipment, userId) {
    const doc = new PDFDocument();
    const fileName = `billing_invoice_${billing._id}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Billing Invoice', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(14).text(`Invoice Number: BILL-${billing._id.toString().slice(-8).toUpperCase()}`);
    doc.text(`Date: ${billing.createdAt.toDateString()}`);
    doc.text(`Due Date: ${billing.dueDate.toDateString()}`);
    doc.moveDown();

    // Shipment details
    doc.text('Shipment Details:');
    doc.fontSize(12).text(`Order ID: ${shipment.orderId}`);
    doc.text(`Tracking Number: ${shipment.trackingNumber}`);
    doc.text(`Carrier: ${(shipment.carrierId && shipment.carrierId.name) || shipment.carrier}`);
    doc.text(`Weight: ${shipment.weight} kg`);
    doc.moveDown();

    // Billing details
    doc.fontSize(14).text('Charges:');
    doc.fontSize(12).text(`Shipping Cost: $${billing.amount}`);
    doc.text(`Taxes: $0.00`); // Placeholder
    doc.moveDown();

    const total = billing.amount;
    doc.fontSize(14).text(`Total Amount: $${total.toFixed(2)}`);
    doc.text(`Status: ${billing.status || 'Pending'}`);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        const document = new Document({
          filename: fileName,
          originalName: fileName,
          mimetype: 'application/pdf',
          size: fs.statSync(filePath).size,
          path: filePath,
          userId: userId
        });
        await document.save();
        resolve({ filePath, documentId: document._id });
      });
      stream.on('error', reject);
    });
  }
}

module.exports = new PDFService();