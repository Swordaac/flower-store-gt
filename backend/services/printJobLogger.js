const fs = require('fs');
const path = require('path');

class PrintJobLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log print job attempt
   * @param {string} orderId - Order ID
   * @param {string} orderNumber - Order number
   * @param {Object} printJobData - Print job data
   * @param {string} status - Status (attempting, success, failed)
   * @param {string} message - Log message
   * @param {Object} error - Error object if any
   */
  logPrintJob(orderId, orderNumber, printJobData, status, message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      orderId,
      orderNumber,
      status,
      message,
      printJobData: {
        printerId: printJobData?.printerId,
        printJobId: printJobData?.printJobId,
        title: printJobData?.title
      },
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null
    };

    // Log to console
    const logLevel = status === 'failed' ? 'error' : 'info';
    console[logLevel](`[PRINT JOB] ${status.toUpperCase()}: ${message}`, {
      orderId,
      orderNumber,
      printJobId: printJobData?.printJobId
    });

    // Log to file
    this.writeToLogFile('print-jobs.log', logEntry);
  }

  /**
   * Log PrintNode API errors
   * @param {string} operation - API operation (test, printers, print)
   * @param {Object} error - Error object
   * @param {Object} context - Additional context
   */
  logApiError(operation, error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status,
        response: error.response?.data
      },
      context
    };

    console.error(`[PRINTNODE API ERROR] ${operation}:`, error.message, context);
    this.writeToLogFile('printnode-errors.log', logEntry);
  }

  /**
   * Log system events
   * @param {string} event - Event name
   * @param {string} message - Event message
   * @param {Object} data - Additional data
   */
  logSystemEvent(event, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      message,
      data
    };

    console.log(`[SYSTEM EVENT] ${event}: ${message}`, data);
    this.writeToLogFile('system-events.log', logEntry);
  }

  /**
   * Write log entry to file
   * @param {string} filename - Log filename
   * @param {Object} logEntry - Log entry object
   */
  writeToLogFile(filename, logEntry) {
    try {
      const logPath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logPath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Get print job statistics
   * @param {number} days - Number of days to look back
   * @returns {Object} Statistics object
   */
  getPrintJobStats(days = 7) {
    try {
      const logPath = path.join(this.logDir, 'print-jobs.log');
      if (!fs.existsSync(logPath)) {
        return { total: 0, successful: 0, failed: 0, successRate: 0 };
      }

      const logContent = fs.readFileSync(logPath, 'utf8');
      const logLines = logContent.trim().split('\n').filter(line => line);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      let total = 0;
      let successful = 0;
      let failed = 0;

      logLines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);
          
          if (entryDate >= cutoffDate) {
            total++;
            if (entry.status === 'success') {
              successful++;
            } else if (entry.status === 'failed') {
              failed++;
            }
          }
        } catch (parseError) {
          // Skip malformed log entries
        }
      });

      const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : 0;

      return {
        total,
        successful,
        failed,
        successRate: parseFloat(successRate)
      };
    } catch (error) {
      console.error('Error getting print job stats:', error);
      return { total: 0, successful: 0, failed: 0, successRate: 0 };
    }
  }

  /**
   * Clean old log files
   * @param {number} daysToKeep - Number of days to keep logs
   */
  cleanOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }
}

module.exports = new PrintJobLogger();
