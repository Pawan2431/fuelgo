const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

// Ensure we don't crash if GCP credentials aren't set up yet
let transports = [
  // Local console logging with colors
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

try {
  // Attempt to add Google Cloud Logging ONLY if credentials exist
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const loggingWinston = new LoggingWinston({
      logName: 'fuelgo-backend-logs',
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'fuelgo-505804', 
    });
    
    transports.push(loggingWinston);
  }
} catch (error) {
  console.warn("⚠️ Google Cloud Logging transport could not be initialized.");
}

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  transports: transports,
});

module.exports = logger;
