/**
 * Appium Test Execution & Excel Report Runner
 * Usage: node runner.js [--mock]
 */

const { remote } = require('webdriverio');
const appiumConfig = require('./config/appium.config');
const ExcelReporter = require('./reporters/excelReporter');
const defineAppiumE2ESuite = require('./specs/e2e_fuelgo_app.spec');

async function run() {
  const isMockRun = process.argv.includes('--mock');
  const resultsCollector = [];
  const reporter = new ExcelReporter();

  console.log(`========================================`);
  console.log(`📱 FUELGO APPIUM AUTOMATION RUNNER`);
  console.log(`========================================`);

  if (isMockRun) {
    console.log(`ℹ️  Running in Demonstration / Diagnostic Mode...`);
    // Simulated realistic E2E Mobile execution metrics
    const sampleResults = [
      { suite: 'FuelGo Mobile Suite', title: 'Splash Screen & App Initialization', screen: 'Splash Screen', status: 'PASS', duration: 840 },
      { suite: 'FuelGo Mobile Suite', title: 'User Registration & Sign In', screen: 'Auth Screen', status: 'PASS', duration: 1450 },
      { suite: 'FuelGo Mobile Suite', title: 'Search Stations & Apply Diesel Filter', screen: 'Home Screen', status: 'PASS', duration: 920 },
      { suite: 'FuelGo Mobile Suite', title: 'Customize Fuel Type & Quantity Stepper', screen: 'Order Screen', status: 'PASS', duration: 1100 },
      { suite: 'FuelGo Mobile Suite', title: 'Select Payment Method & Checkout', screen: 'Payment Screen', status: 'PASS', duration: 1320 },
      { suite: 'FuelGo Mobile Suite', title: 'Live Map Tracking & ETA Verification', screen: 'Tracking Screen', status: 'PASS', duration: 780 },
      { suite: 'FuelGo Mobile Suite', title: 'Emergency Fuel Request Trigger', screen: 'Emergency Screen', status: 'PASS', duration: 950 },
      { suite: 'FuelGo Mobile Suite', title: 'Toggle Dark Mode & User Logout', screen: 'Profile Screen', status: 'PASS', duration: 610 }
    ];

    const reportPath = await reporter.generateReport(sampleResults, {
      deviceName: 'Android Emulator (Pixel 7 Pro - Android 13)',
      platformName: 'Android',
      platformVersion: '13.0',
      app: 'com.fuelgo.app'
    });

    console.log(`\n✨ Demonstration report generated at: ${reportPath}\n`);
    return;
  }

  let driver;
  try {
    console.log(`🔌 Connecting to Appium Server at http://${appiumConfig.server.host}:${appiumConfig.server.port}...`);
    driver = await remote({
      protocol: 'http',
      hostname: appiumConfig.server.host,
      port: appiumConfig.server.port,
      path: appiumConfig.server.path,
      capabilities: appiumConfig.capabilities
    });

    console.log(`📱 Appium Session Started! Session ID: ${driver.sessionId}`);
    
    // Execute End to End Suite
    const suiteRunner = defineAppiumE2ESuite(driver, resultsCollector);
    await suiteRunner();

  } catch (error) {
    console.error(`\n❌ Appium Connection or Execution Error:`, error.message);
    console.log(`💡 Note: To run without an active Appium server running on port 4723, use: node runner.js --mock`);
  } finally {
    if (driver) {
      console.log(`🔚 Closing Appium Session...`);
      await driver.deleteSession();
    }

    if (resultsCollector.length > 0) {
      await reporter.generateReport(resultsCollector, appiumConfig.capabilities);
    }
  }
}

run();
