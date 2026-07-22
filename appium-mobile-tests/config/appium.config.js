/**
 * Appium Capabilities & Server Configuration for FuelGo Android App
 */

module.exports = {
  // Appium Server Details
  server: {
    host: '127.0.0.1',
    port: 4723,
    path: '/'
  },

  // Android Desired Capabilities
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator', // or real device ID e.g., 'emulator-5554'
    'appium:platformVersion': '13.0',         // Target Android version
    
    // For Native APK testing:
    // 'appium:app': './apps/fuelgo-release.apk',
    // 'appium:appPackage': 'com.fuelgo.app',
    // 'appium:appActivity': '.MainActivity',

    // For Webview / Hybrid App testing (fuelgo-app.html loaded in Android Webview / Chrome):
    'appium:browserName': 'Chrome',
    'appium:chromedriverAutodetect': true,

    // Timeouts and Behavior
    'appium:newCommandTimeout': 300,
    'appium:autoGrantPermissions': true,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:ensureWebviewsHavePages': true,
    'appium:nativeWebScreenshot': true
  },

  // App URL / Local Server for Webview testing
  testAppUrl: 'http://localhost:3000/fuelgo-app.html',

  // Default timeouts
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  }
};
