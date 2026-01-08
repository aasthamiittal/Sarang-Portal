const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const CustomInvoice = require('../models/CustomInvoice');
const Shipment = require('../models/Shipment');

async function generateInvoicePDF(invoiceId) {
  const invoice = await CustomInvoice.findById(invoiceId).populate('shipment');
  if (!invoice) throw new Error('Invoice not found');

  const shipment = invoice.shipment;

  const doc = new PDFDocument();
  const fileName = `invoice_${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(__dirname, '../uploads', fileName);

  // Ensure uploads directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text('Tax Invoice', { align: 'center' });
  doc.moveDown();

  // Invoice details
  doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
  doc.text(`Date: ${invoice.createdAt.toDateString()}`);
  doc.text(`GST Number: ${invoice.gstNumber || 'N/A'}`);
  doc.moveDown();

  // Shipment details
  doc.text('Shipment Details:');
  doc.text(`Order ID: ${shipment.orderId}`);
  doc.text(`HSN Code: ${invoice.hsCode}`);
  doc.text(`Declared Value: ${invoice.declaredValue} ${invoice.currency}`);
  doc.text(`Origin Country: ${invoice.originCountry}`);
  doc.moveDown();

  // Tax details
  doc.text('Tax Details:');
  doc.text(`CGST: ${invoice.taxRates.cgst}%`);
  doc.text(`SGST: ${invoice.taxRates.sgst}%`);
  doc.text(`IGST: ${invoice.taxRates.igst}%`);
  const totalTax = (invoice.declaredValue * (invoice.taxRates.cgst + invoice.taxRates.sgst + invoice.taxRates.igst) / 100);
  doc.text(`Total Tax: ${totalTax.toFixed(2)} ${invoice.currency}`);
  doc.moveDown();

  // Total
  const totalAmount = invoice.declaredValue + totalTax;
  doc.text(`Total Amount: ${totalAmount.toFixed(2)} ${invoice.currency}`);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = {
  generateInvoicePDF
};