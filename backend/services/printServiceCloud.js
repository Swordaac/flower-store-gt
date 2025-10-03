const { printnodeClient } = require('../config/printnode-cloud');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const printJobLogger = require('./printJobLogger');

class PrintServiceCloud {
  constructor() {
    this.client = printnodeClient;
    this.isCloudMode = process.env.NODE_ENV === 'production' || process.env.RENDER;
  }

  /**
   * Get available printers
   * @returns {Promise<Array>} List of available printers
   */
  async getPrinters() {
    try {
      const printers = await this.client.fetchPrinters();
      
      if (this.isCloudMode) {
        console.log('☁️  Cloud mode: PrintNode Client should be running on a local machine');
        console.log(`📊 Found ${printers.length} printers connected to PrintNode account`);
      } else {
        printJobLogger.logSystemEvent('printers_fetched', `Retrieved ${printers.length} printers`);
      }
      
      return printers;
    } catch (error) {
      if (this.isCloudMode) {
        console.warn('⚠️  Cloud mode: No PrintNode Client connected locally');
        return [];
      }
      printJobLogger.logApiError('get_printers', error);
      throw new Error('Failed to fetch printers from PrintNode');
    }
  }

  /**
   * Get the first available printer ID
   * @returns {Promise<string|null>} Printer ID or null if none available
   */
  async getFirstPrinterId() {
    try {
      const printers = await this.getPrinters();
      if (printers && printers.length > 0) {
        const printerId = printers[0].id;
        if (this.isCloudMode) {
          console.log(`☁️  Cloud mode: Selected printer ${printerId} (PrintNode Client should be running locally)`);
        } else {
          printJobLogger.logSystemEvent('printer_selected', `Selected printer: ${printerId}`);
        }
        return printerId;
      }
      
      if (this.isCloudMode) {
        console.warn('⚠️  Cloud mode: No printers available. Ensure PrintNode Client is running on a local machine.');
      } else {
        printJobLogger.logSystemEvent('no_printers_available', 'No printers found');
      }
      return null;
    } catch (error) {
      printJobLogger.logApiError('get_first_printer', error);
      return null;
    }
  }

  /**
   * Generate PDF for order recipient details
   * @param {Object} order - Order object with recipient information
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateOrderPDF(order) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(20)
           .fillColor('#2c3e50')
           .text('Order Details', 50, 50, { align: 'center' });

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Order Number: ${order.orderNumber}`, 50, 100)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 120);

        // Recipient Information Section
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Recipient Information', 50, 160);

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Name: ${order.recipient.name}`, 50, 190)
           .text(`Phone: ${order.recipient.phone}`, 50, 210)
           .text(`Email: ${order.recipient.email}`, 50, 230);

        // Address Information (if delivery)
        if (order.delivery.method === 'delivery' && order.delivery.address) {
          doc.fontSize(16)
             .fillColor('#2c3e50')
             .text('Delivery Address', 50, 270);

          const address = order.delivery.address;
          let yPos = 300;
          
          if (address.company) {
            doc.fontSize(12)
               .fillColor('#34495e')
               .text(`Company: ${address.company}`, 50, yPos);
            yPos += 20;
          }

          doc.fontSize(12)
             .fillColor('#34495e')
             .text(`Street: ${address.street}`, 50, yPos);
          yPos += 20;
          
          doc.text(`City: ${address.city}`, 50, yPos);
          yPos += 20;
          
          doc.text(`Province: ${address.province}`, 50, yPos);
          yPos += 20;
          
          doc.text(`Postal Code: ${address.postalCode}`, 50, yPos);
          yPos += 20;
          
          doc.text(`Country: ${address.country || 'Canada'}`, 50, yPos);
          yPos += 40;
        } else if (order.delivery.method === 'pickup') {
          doc.fontSize(16)
             .fillColor('#2c3e50')
             .text('Pickup Information', 50, 270);

          doc.fontSize(12)
             .fillColor('#34495e')
             .text(`Pickup Location: ${order.delivery.pickupStoreAddress}`, 50, 300);
        }

        // Delivery/Pickup Details
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Delivery Details', 50, order.delivery.method === 'delivery' ? 380 : 340);

        let detailsY = order.delivery.method === 'delivery' ? 410 : 370;
        
        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Method: ${order.delivery.method.charAt(0).toUpperCase() + order.delivery.method.slice(1)}`, 50, detailsY);
        detailsY += 20;
        
        doc.text(`Date: ${new Date(order.delivery.date).toLocaleDateString()}`, 50, detailsY);
        detailsY += 20;
        
        doc.text(`Time: ${order.delivery.time}`, 50, detailsY);
        detailsY += 20;

        // Special Instructions
        if (order.delivery.specialInstructions) {
          doc.fontSize(16)
             .fillColor('#2c3e50')
             .text('Special Instructions', 50, detailsY + 20);

          doc.fontSize(12)
             .fillColor('#34495e')
             .text(order.delivery.specialInstructions, 50, detailsY + 50, {
               width: 500,
               align: 'left'
             });
          detailsY += 100;
        }

        // Delivery Instructions (for delivery orders)
        if (order.delivery.method === 'delivery' && order.delivery.instructions) {
          doc.fontSize(16)
             .fillColor('#2c3e50')
             .text('Delivery Instructions', 50, detailsY + 20);

          doc.fontSize(12)
             .fillColor('#34495e')
             .text(order.delivery.instructions, 50, detailsY + 50, {
               width: 500,
               align: 'left'
             });
          detailsY += 100;
        }

        // Buzzer Code (for delivery orders)
        if (order.delivery.method === 'delivery' && order.delivery.buzzerCode) {
          doc.fontSize(12)
             .fillColor('#34495e')
             .text(`Buzzer Code: ${order.delivery.buzzerCode}`, 50, detailsY + 20);
        }

        // Order Items
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .text('Order Items', 50, detailsY + 60);

        let itemsY = detailsY + 90;
        order.items.forEach((item, index) => {
          doc.fontSize(12)
             .fillColor('#34495e')
             .text(`${index + 1}. ${item.name}`, 50, itemsY)
             .text(`   Quantity: ${item.quantity}`, 70, itemsY + 20)
             .text(`   Price: $${(item.price / 100).toFixed(2)}`, 70, itemsY + 40);
          itemsY += 70;
        });

        // Footer
        doc.fontSize(10)
           .fillColor('#7f8c8d')
           .text('Generated by Flower Store System', 50, doc.page.height - 100, { align: 'center' })
           .text(new Date().toLocaleString(), 50, doc.page.height - 80, { align: 'center' });

        doc.end();
      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Print order recipient details
   * @param {Object} order - Order object with recipient information
   * @returns {Promise<Object>} Print job result
   */
  async printOrderDetails(order) {
    const printJobData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      recipientName: order.recipient.name
    };

    try {
      if (this.isCloudMode) {
        console.log(`☁️  Cloud mode: Attempting to print order ${order.orderNumber}`);
        console.log(`📧 Recipient: ${order.recipient.name} (${order.recipient.email})`);
      } else {
        printJobLogger.logPrintJob(
          order._id,
          order.orderNumber,
          printJobData,
          'attempting',
          'Starting print job for order'
        );
      }

      // Generate PDF
      const pdfBuffer = await this.generateOrderPDF(order);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Get printer ID
      const printerId = await this.getFirstPrinterId();
      if (!printerId) {
        const error = new Error('No printers available');
        if (this.isCloudMode) {
          console.warn('⚠️  Cloud mode: No printers available. Ensure PrintNode Client is running on a local machine.');
          return {
            success: false,
            error: 'No printers available - PrintNode Client must be running locally',
            message: 'Print job queued for local printing'
          };
        }
        printJobLogger.logPrintJob(
          order._id,
          order.orderNumber,
          printJobData,
          'failed',
          'No printers available',
          error
        );
        throw error;
      }

      // Create print job
      const printJob = {
        printerId: printerId,
        title: `Order ${order.orderNumber} - ${order.recipient.name}`,
        contentType: 'pdf_base64',
        content: pdfBase64,
        source: 'Flower Store System'
      };

      if (this.isCloudMode) {
        console.log(`☁️  Cloud mode: Sending print job to printer ${printerId}`);
      } else {
        printJobLogger.logSystemEvent('print_job_created', 'Print job created', {
          orderNumber: order.orderNumber,
          printerId,
          title: printJob.title
        });
      }

      // Submit print job
      const result = await this.client.createPrintJob(printJob);
      
      const successData = {
        ...printJobData,
        printJobId: result.id,
        printerId: printerId
      };

      if (this.isCloudMode) {
        console.log(`✅ Cloud mode: Print job submitted successfully (ID: ${result.id})`);
        console.log(`📄 Order ${order.orderNumber} will be printed on local printer`);
      } else {
        printJobLogger.logPrintJob(
          order._id,
          order.orderNumber,
          successData,
          'success',
          'Print job submitted successfully'
        );
      }

      return {
        success: true,
        printJobId: result.id,
        printerId: printerId,
        message: this.isCloudMode ? 'Print job sent to local PrintNode Client' : 'Print job submitted successfully'
      };

    } catch (error) {
      if (this.isCloudMode) {
        console.error(`❌ Cloud mode: Failed to print order ${order.orderNumber}:`, error.message);
        return {
          success: false,
          error: error.message,
          message: 'Print job failed - check PrintNode Client connection'
        };
      }
      
      printJobLogger.logPrintJob(
        order._id,
        order.orderNumber,
        printJobData,
        'failed',
        'Failed to print order details',
        error
      );

      return {
        success: false,
        error: error.message,
        message: 'Failed to print order details'
      };
    }
  }

  /**
   * Test PrintNode connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const whoami = await this.client.whoami();
      if (this.isCloudMode) {
        console.log('☁️  Cloud mode: PrintNode API connection successful');
        console.log(`📧 Account: ${whoami.email}`);
      } else {
        printJobLogger.logSystemEvent('connection_test', 'PrintNode connection successful', { account: whoami });
      }
      return {
        success: true,
        message: this.isCloudMode ? 'PrintNode API connected (local client required)' : 'PrintNode connection successful',
        account: whoami
      };
    } catch (error) {
      printJobLogger.logApiError('test_connection', error);
      return {
        success: false,
        error: error.message,
        message: 'PrintNode connection failed'
      };
    }
  }

  /**
   * Get print job statistics
   * @param {number} days - Number of days to look back
   * @returns {Object} Print job statistics
   */
  getPrintJobStats(days = 7) {
    return printJobLogger.getPrintJobStats(days);
  }

  /**
   * Clean old log files
   * @param {number} daysToKeep - Number of days to keep logs
   */
  cleanOldLogs(daysToKeep = 30) {
    printJobLogger.cleanOldLogs(daysToKeep);
  }
}

module.exports = new PrintServiceCloud();
