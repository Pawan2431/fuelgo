const path = require('path');
const fs = require('fs-extra');

class EnterpriseJsonReporter {
  constructor(outputDir = path.join(__dirname, '..', 'reports', 'JSON')) {
    this.outputDir = outputDir;
    fs.ensureDirSync(this.outputDir);
  }

  generateJsonReport(testResults, deviceInfo = {}) {
    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    const skipped = testResults.filter(t => t.status === 'SKIPPED').length;

    const payload = {
      executionMetadata: {
        timestamp: new Date().toISOString(),
        framework: 'FuelGo Appium Android SDET Suite v2.0',
        device: deviceInfo.deviceName || 'Android Emulator (UiAutomator2)',
        platform: 'Android 13.0'
      },
      summary: {
        total: testResults.length,
        passed,
        failed,
        skipped,
        passPercentage: ((passed / testResults.length) * 100).toFixed(2),
        totalDurationSeconds: (testResults.reduce((a, b) => a + (b.duration || 0), 0) / 1000).toFixed(2)
      },
      testCases: testResults
    };

    const filePath = path.join(this.outputDir, 'execution-results.json');
    fs.writeJsonSync(filePath, payload, { spaces: 2 });
    console.log(`✅ JSON Report generated at ${filePath}`);
  }
}

module.exports = EnterpriseJsonReporter;
