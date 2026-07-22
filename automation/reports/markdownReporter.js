const path = require('path');
const fs = require('fs-extra');

class EnterpriseMarkdownReporter {
  constructor(outputDir = path.join(__dirname, '..', 'reports', 'Summary')) {
    this.outputDir = outputDir;
    fs.ensureDirSync(this.outputDir);
  }

  generateMarkdownSummary(testResults, deviceInfo = {}) {
    const total = testResults.length;
    const passed = testResults.filter(t => t.status === 'PASS');
    const failed = testResults.filter(t => t.status === 'FAIL');
    const skipped = testResults.filter(t => t.status === 'SKIPPED');
    const passPercentage = total > 0 ? ((passed.length / total) * 100).toFixed(1) : '0';
    const failPercentage = total > 0 ? ((failed.length / total) * 100).toFixed(1) : '0';
    const duration = (testResults.reduce((a, b) => a + (b.duration || 0), 0) / 1000).toFixed(2);

    const markdown = `# Android Appium E2E Execution Summary

**Build Number:** #${process.env.GITHUB_RUN_NUMBER || '101'}
**Execution Date:** ${new Date().toUTCString()}
**Git Commit:** \`${process.env.GITHUB_SHA || 'local-dev'}\`
**Branch:** \`${process.env.GITHUB_REF_NAME || 'main'}\`

**APK Version:** FuelGo v2.4.0 (Release Build)
**Device:** ${deviceInfo.deviceName || 'Android Emulator (UiAutomator2)'}
**Android Version:** Android 13.0

---

## 📊 Execution Metrics

| Metric | Value |
| :--- | :--- |
| **Total Test Cases** | **${total}** |
| **Executed** | ${total} |
| **Passed** | 🟢 ${passed.length} |
| **Failed** | 🔴 ${failed.length} |
| **Skipped** | 🟡 ${skipped.length} |
| **Pass Percentage** | **${passPercentage}%** |
| **Fail Percentage** | ${failPercentage}% |
| **Execution Duration** | **${duration}s** |

---

## 📝 Valid Test Case Summary

### 🟢 PASSED TESTS (${passed.length} Total)
${passed.slice(0, 10).map(t => `✓ **${t.id}** - ${t.testName}`).join('\n')}
*... and ${Math.max(0, passed.length - 10)} more passed test cases.*

### 🔴 FAILED TESTS (${failed.length} Total)
${failed.map(t => `✗ **${t.id}** - ${t.testName}\n  **Reason:** ${t.error}`).join('\n\n')}

### 🟡 SKIPPED TESTS (${skipped.length} Total)
${skipped.map(t => `- **${t.id}** - ${t.testName}\n  **Reason:** ${t.error}`).join('\n\n')}
`;

    const summaryPath = path.join(this.outputDir, 'summary.md');
    fs.writeFileSync(summaryPath, markdown);
    console.log(`✅ Markdown Summary generated at ${summaryPath}`);

    // If running in GitHub Actions, write directly to GITHUB_STEP_SUMMARY
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
      console.log(`🚀 GitHub Action Step Summary updated!`);
    }

    return summaryPath;
  }
}

module.exports = EnterpriseMarkdownReporter;
