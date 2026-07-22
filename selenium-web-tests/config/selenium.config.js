/**
 * Selenium Web Automation Configuration for FuelGo Web Application
 */

module.exports = {
  // Target Application URLs
  baseUrl: 'http://localhost:3000/index.html',
  appUrl: 'http://localhost:3000/fuelgo-app.html',

  // Default Web Driver Configuration
  browser: 'chrome',
  headless: false,

  // Timeouts (ms)
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 15000
  },

  // Chrome Options & Capabilities
  chromeOptions: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1440,900',
    '--disable-gpu'
  ]
};
