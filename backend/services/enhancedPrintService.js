const { printnodeClient } = require('../config/printnode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const printJobLogger = require('./printJobLogger');

class EnhancedPrintService {
  constructor() {
    this.client = printnodeClient;
    this.defaultLayouts = {
      deliveryInstructions: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        fontSizes: {
          title: 18,
          subtitle: 14,
          body: 12,
          small: 10
        },
        colors: {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#e74c3c',
          muted: '#7f8c8d'
        }
      },
      cardMessage: {
        paperSize: 'A6',
        orientation: 'portrait',
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
        fontSizes: {
          title: 16,
          subtitle: 12,
          body: 11,
          small: 9
        },
        colors: {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#e74c3c',
          muted: '#7f8c8d'
        }
      },
      orderSummary: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        fontSizes: {
          title: 20,
          subtitle: 16,
          body: 12,
          small: 10
        },
        colors: {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#e74c3c',
          muted: '#7f8c8d'
        }
      }
    };
  }

  /**
   * Get available printers with tray information
   * @returns {Promise<Array>} List of available printers with tray details
   */
  async getPrintersWithTrays() {
    try {
      const printers = await this.client.fetchPrinters();
      const printersWithTrays = [];
      
      for (const printer of printers) {
        try {
          // Get printer capabilities to check for tray information
          const capabilities = await this.client.fetchPrinterCapabilities(printer.id);
          const trays = this.extractTrayInformation(capabilities);
          
          printersWithTrays.push({
            ...printer,
            trays: trays,
            hasMultipleTrays: trays.length > 1
          });
        } catch (error) {
          // If we can't get capabilities, add printer without tray info
          printersWithTrays.push({
            ...printer,
            trays: [{ name: 'Default Tray', id: 'default' }],
            hasMultipleTrays: false
          });
        }
      }
      
      printJobLogger.logSystemEvent('printers_with_trays_fetched', `Retrieved ${printersWithTrays.length} printers with tray information`);
      return printersWithTrays;
    } catch (error) {
      printJobLogger.logApiError('get_printers_with_trays', error);
      throw new Error('Failed to fetch printers with tray information from PrintNode');
    }
  }

  /**
   * Extract tray information from printer capabilities
   * @param {Object} capabilities - Printer capabilities object
   * @returns {Array} Array of tray information
   */
  extractTrayInformation(capabilities) {
    const trays = [];
    
    // Common tray names and their mappings
    const trayMappings = {
      'Tray 1': { name: 'Tray 1', id: 'tray1', description: 'Main paper tray' },
      'Tray 2': { name: 'Tray 2', id: 'tray2', description: 'Secondary paper tray' },
      'Tray 3': { name: 'Tray 3', id: 'tray3', description: 'Third paper tray' },
      'Manual Feed': { name: 'Manual Feed', id: 'manual', description: 'Manual paper feed' },
      'Envelope': { name: 'Envelope Tray', id: 'envelope', description: 'Envelope tray' },
      'Card Stock': { name: 'Card Stock', id: 'cardstock', description: 'Card stock tray' },
      'Photo Paper': { name: 'Photo Paper', id: 'photo', description: 'Photo paper tray' }
    };

    // Try to extract tray information from capabilities
    if (capabilities && capabilities.paperSources) {
      capabilities.paperSources.forEach(source => {
        if (trayMappings[source.name]) {
          trays.push(trayMappings[source.name]);
        } else {
          trays.push({
            name: source.name,
            id: source.name.toLowerCase().replace(/\s+/g, '_'),
            description: `Paper source: ${source.name}`
          });
        }
      });
    }

    // If no trays found, add default
    if (trays.length === 0) {
      trays.push({ name: 'Default Tray', id: 'default', description: 'Default paper source' });
    }

    return trays;
  }

  /**
   * Generate delivery instructions PDF
   * @param {Object} order - Order object
   * @param {Object} layout - Layout configuration
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateDeliveryInstructionsPDF(order, layout = null) {
    const config = layout || this.defaultLayouts.deliveryInstructions;
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: config.paperSize,
          margins: config.margins
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(config.fontSizes.title)
           .fillColor(config.colors.primary)
           .text('DELIVERY INSTRUCTIONS', 50, 50, { align: 'center' });

        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text(`Order: ${order.orderNumber}`, 50, 80, { align: 'center' })
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 95, { align: 'center' });

        // Recipient Information
        doc.fontSize(config.fontSizes.subtitle)
           .fillColor(config.colors.primary)
           .text('RECIPIENT', 50, 130);

        doc.fontSize(config.fontSizes.body)
           .fillColor(config.colors.secondary)
           .text(`Name: ${order.recipient.name}`, 50, 155)
           .text(`Phone: ${order.recipient.phone}`, 50, 175)
           .text(`Email: ${order.recipient.email}`, 50, 195);

        // Delivery Address
        if (order.delivery.method === 'delivery' && order.delivery.address) {
          doc.fontSize(config.fontSizes.subtitle)
             .fillColor(config.colors.primary)
             .text('DELIVERY ADDRESS', 50, 230);

          const address = order.delivery.address;
          let yPos = 255;
          
          if (address.company) {
            doc.fontSize(config.fontSizes.body)
               .fillColor(config.colors.secondary)
               .text(`Company: ${address.company}`, 50, yPos);
            yPos += 20;
          }

          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.secondary)
             .text(`Address: ${address.street}`, 50, yPos);
          yPos += 20;
          doc.text(`${address.city}, ${address.province} ${address.postalCode}`, 50, yPos);
          yPos += 20;
          doc.text(`${address.country}`, 50, yPos);
          yPos += 30;
        }

        // Delivery Details
        doc.fontSize(config.fontSizes.subtitle)
           .fillColor(config.colors.primary)
           .text('DELIVERY DETAILS', 50, order.delivery.method === 'delivery' ? 320 : 280);

        let detailsY = order.delivery.method === 'delivery' ? 350 : 310;
        
        doc.fontSize(config.fontSizes.body)
           .fillColor(config.colors.secondary)
           .text(`Method: ${order.delivery.method.charAt(0).toUpperCase() + order.delivery.method.slice(1)}`, 50, detailsY);
        detailsY += 20;
        
        doc.text(`Date: ${new Date(order.delivery.date).toLocaleDateString()}`, 50, detailsY);
        detailsY += 20;
        
        doc.text(`Time: ${order.delivery.time}`, 50, detailsY);
        detailsY += 20;

        // Special Instructions
        if (order.delivery.specialInstructions) {
          doc.fontSize(config.fontSizes.subtitle)
             .fillColor(config.colors.primary)
             .text('SPECIAL INSTRUCTIONS', 50, detailsY + 20);

          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.secondary)
             .text(order.delivery.specialInstructions, 50, detailsY + 50, {
               width: 500,
               align: 'left'
             });
          detailsY += 100;
        }

        // Delivery Instructions
        if (order.delivery.method === 'delivery' && order.delivery.instructions) {
          doc.fontSize(config.fontSizes.subtitle)
             .fillColor(config.colors.primary)
             .text('DELIVERY INSTRUCTIONS', 50, detailsY + 20);

          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.secondary)
             .text(order.delivery.instructions, 50, detailsY + 50, {
               width: 500,
               align: 'left'
             });
          detailsY += 100;
        }

        // Buzzer Code
        if (order.delivery.method === 'delivery' && order.delivery.buzzerCode) {
          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.accent)
             .text(`BUZZER CODE: ${order.delivery.buzzerCode}`, 50, detailsY + 20, { 
               align: 'center',
               underline: true
             });
        }

        // Footer
        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text('Generated by Flower Store System', 50, doc.page.height - 50, { align: 'center' })
           .text(new Date().toLocaleString(), 50, doc.page.height - 35, { align: 'center' });

        doc.end();
      } catch (error) {
        console.error('Error generating delivery instructions PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate card message PDF
   * @param {Object} order - Order object
   * @param {Object} layout - Layout configuration
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateCardMessagePDF(order, layout = null) {
    const config = layout || this.defaultLayouts.cardMessage;
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: config.paperSize,
          margins: config.margins
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Decorative border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .stroke('#e0e0e0', 2);

        // Card message header
        doc.fontSize(config.fontSizes.title)
           .fillColor(config.colors.primary)
           .text('CARD MESSAGE', 30, 50, { align: 'center' });

        // Occasion (if provided)
        if (order.occasion) {
          doc.fontSize(config.fontSizes.subtitle)
             .fillColor(config.colors.accent)
             .text(order.occasion.toUpperCase(), 30, 80, { align: 'center' });
        }

        // Card message
        if (order.cardMessage) {
          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.secondary)
             .text(order.cardMessage, 30, 120, {
               width: doc.page.width - 60,
               align: 'center',
               lineGap: 5
             });
        } else {
          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.muted)
             .text('No message provided', 30, 120, { align: 'center' });
        }

        // Order reference
        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text(`Order: ${order.orderNumber}`, 30, doc.page.height - 60, { align: 'center' });

        // Footer
        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text('Flower Store', 30, doc.page.height - 40, { align: 'center' });

        doc.end();
      } catch (error) {
        console.error('Error generating card message PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate order summary PDF
   * @param {Object} order - Order object
   * @param {Object} layout - Layout configuration
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateOrderSummaryPDF(order, layout = null) {
    const config = layout || this.defaultLayouts.orderSummary;
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: config.paperSize,
          margins: config.margins
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc.fontSize(config.fontSizes.title)
           .fillColor(config.colors.primary)
           .text('ORDER SUMMARY', 50, 50, { align: 'center' });

        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text(`Order Number: ${order.orderNumber}`, 50, 100)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 120);

        // Order Items
        doc.fontSize(config.fontSizes.subtitle)
           .fillColor(config.colors.primary)
           .text('ORDER ITEMS', 50, 160);

        let itemsY = 190;
        order.items.forEach((item, index) => {
          doc.fontSize(config.fontSizes.body)
             .fillColor(config.colors.secondary)
             .text(`${index + 1}. ${item.name}`, 50, itemsY)
             .text(`   Quantity: ${item.quantity}`, 70, itemsY + 20)
             .text(`   Price: $${(item.price / 100).toFixed(2)}`, 70, itemsY + 40);
          itemsY += 70;
        });

        // Financial Summary
        doc.fontSize(config.fontSizes.subtitle)
           .fillColor(config.colors.primary)
           .text('FINANCIAL SUMMARY', 50, itemsY + 20);

        let financialY = itemsY + 50;
        
        doc.fontSize(config.fontSizes.body)
           .fillColor(config.colors.secondary)
           .text(`Subtotal: $${(order.subtotal / 100).toFixed(2)}`, 50, financialY);
        financialY += 20;
        
        if (order.taxAmount > 0) {
          doc.text(`Tax: $${(order.taxAmount / 100).toFixed(2)}`, 50, financialY);
          financialY += 20;
        }
        
        if (order.deliveryFee > 0) {
          doc.text(`Delivery Fee: $${(order.deliveryFee / 100).toFixed(2)}`, 50, financialY);
          financialY += 20;
        }
        
        if (order.serviceFee > 0) {
          doc.text(`Service Fee: $${(order.serviceFee / 100).toFixed(2)}`, 50, financialY);
          financialY += 20;
        }
        
        doc.fontSize(config.fontSizes.subtitle)
           .fillColor(config.colors.accent)
           .text(`TOTAL: $${(order.total / 100).toFixed(2)}`, 50, financialY + 10);

        // Footer
        doc.fontSize(config.fontSizes.small)
           .fillColor(config.colors.muted)
           .text('Generated by Flower Store System', 50, doc.page.height - 100, { align: 'center' })
           .text(new Date().toLocaleString(), 50, doc.page.height - 80, { align: 'center' });

        doc.end();
      } catch (error) {
        console.error('Error generating order summary PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Print with specific tray selection
   * @param {Object} options - Print options
   * @returns {Promise<Object>} Print job result
   */
  async printWithTray(options) {
    const {
      order,
      printType = 'deliveryInstructions', // 'deliveryInstructions', 'cardMessage', 'orderSummary'
      printerId = null,
      trayId = 'default',
      layout = null
    } = options;

    try {
      // Get printer ID if not provided
      const targetPrinterId = printerId || await this.getFirstPrinterId();
      if (!targetPrinterId) {
        throw new Error('No printers available');
      }

      // Generate appropriate PDF based on print type
      let pdfBuffer;
      switch (printType) {
        case 'deliveryInstructions':
          pdfBuffer = await this.generateDeliveryInstructionsPDF(order, layout);
          break;
        case 'cardMessage':
          pdfBuffer = await this.generateCardMessagePDF(order, layout);
          break;
        case 'orderSummary':
          pdfBuffer = await this.generateOrderSummaryPDF(order, layout);
          break;
        default:
          throw new Error(`Unknown print type: ${printType}`);
      }

      const pdfBase64 = pdfBuffer.toString('base64');

      // Create print job with tray specification
      const printJob = {
        printerId: targetPrinterId,
        title: `${printType} - Order ${order.orderNumber} - ${order.recipient.name}`,
        contentType: 'pdf_base64',
        content: pdfBase64,
        source: 'Flower Store System',
        // Add tray specification if supported
        ...(trayId !== 'default' && { tray: trayId })
      };

      printJobLogger.logSystemEvent('enhanced_print_job_created', 'Enhanced print job created', {
        orderNumber: order.orderNumber,
        printerId: targetPrinterId,
        printType,
        trayId,
        title: printJob.title
      });

      // Submit print job
      const result = await this.client.createPrintJob(printJob);
      
      return {
        success: true,
        printJobId: result.id,
        printerId: targetPrinterId,
        printType,
        trayId,
        message: `Print job submitted successfully for ${printType}`
      };

    } catch (error) {
      printJobLogger.logApiError('enhanced_print_with_tray', error, {
        orderNumber: order.orderNumber,
        printType,
        trayId
      });

      return {
        success: false,
        error: error.message,
        message: `Failed to print ${printType}`
      };
    }
  }

  /**
   * Print all order documents with different tray selections
   * @param {Object} order - Order object
   * @param {Object} printConfig - Print configuration
   * @returns {Promise<Object>} Print job results
   */
  async printAllOrderDocuments(order, printConfig = {}) {
    const {
      deliveryInstructionsTray = 'default',
      cardMessageTray = 'default',
      orderSummaryTray = 'default',
      printerId = null,
      layouts = {}
    } = printConfig;

    const results = {
      deliveryInstructions: null,
      cardMessage: null,
      orderSummary: null
    };

    try {
      // Print delivery instructions
      if (order.delivery.method === 'delivery') {
        results.deliveryInstructions = await this.printWithTray({
          order,
          printType: 'deliveryInstructions',
          printerId,
          trayId: deliveryInstructionsTray,
          layout: layouts.deliveryInstructions
        });
      }

      // Print card message (if provided)
      if (order.cardMessage || order.occasion) {
        results.cardMessage = await this.printWithTray({
          order,
          printType: 'cardMessage',
          printerId,
          trayId: cardMessageTray,
          layout: layouts.cardMessage
        });
      }

      // Print order summary
      results.orderSummary = await this.printWithTray({
        order,
        printType: 'orderSummary',
        printerId,
        trayId: orderSummaryTray,
        layout: layouts.orderSummary
      });

      return {
        success: true,
        results,
        message: 'All order documents printed successfully'
      };

    } catch (error) {
      printJobLogger.logApiError('print_all_order_documents', error, {
        orderNumber: order.orderNumber
      });

      return {
        success: false,
        error: error.message,
        results,
        message: 'Failed to print some order documents'
      };
    }
  }

  /**
   * Get the first available printer ID
   * @returns {Promise<string|null>} Printer ID or null if none available
   */
  async getFirstPrinterId() {
    try {
      const printers = await this.getPrintersWithTrays();
      if (printers && printers.length > 0) {
        const printerId = printers[0].id;
        printJobLogger.logSystemEvent('printer_selected', `Selected printer: ${printerId}`);
        return printerId;
      }
      printJobLogger.logSystemEvent('no_printers_available', 'No printers found');
      return null;
    } catch (error) {
      printJobLogger.logApiError('get_first_printer', error);
      return null;
    }
  }

  /**
   * Test PrintNode connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const whoami = await this.client.whoami();
      printJobLogger.logSystemEvent('connection_test', 'PrintNode connection successful', { account: whoami });
      return {
        success: true,
        message: 'PrintNode connection successful',
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
}

module.exports = new EnhancedPrintService();
