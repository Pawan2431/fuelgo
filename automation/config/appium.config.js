/**
 * Enterprise Appium Capabilities & Framework Configuration
 */

const path = require('path');

module.exports = {
  // Appium Server Details
  server: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT || '4723', 10),
    path: '/'
  },

  // Android Capabilities for GitHub Actions Emulator & Local Execution
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE || 'Android Emulator',
    'appium:platformVersion': process.env.ANDROID_VERSION || '13.0',
    'appium:app': process.env.APK_PATH || path.join(__dirname, '..', '..', 'fuelgo-backend', 'fuelgo-app.apk'),
    'appium:appPackage': 'com.fuelgo.app',
    'appium:appActivity': '.MainActivity',
    'appium:newCommandTimeout': 300,
    'appium:autoGrantPermissions': true,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:chromedriverAutodetect': true
  },

  // Test Runner Options
  execution: {
    maxRetries: 2,
    timeout: 30000,
    parallelThreads: 4,
    screenshotOnFailure: true,
    videoOnFailure: false
  },

  // Report Directories
  paths: {
    reports: path.join(__dirname, '..', 'reports'),
    excel: path.join(__dirname, '..', 'reports', 'Excel'),
    html: path.join(__dirname, '..', 'reports', 'HTML'),
    json: path.join(__dirname, '..', 'reports', 'JSON'),
    summary: path.join(__dirname, '..', 'reports', 'Summary'),
    screenshots: path.join(__dirname, '..', 'screenshots'),
    logs: path.join(__dirname, '..', 'logs')
  }
};
