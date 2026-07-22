/**
 * Excel Report Generator for Appium Mobile E2E Test Suite
 * Generates formatted .xlsx Excel analysis workbook with summary statistics,
 * detailed test execution logs, and screen coverage metrics.
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelReporter {
  constructor(reportDir = path.join(__dirname, '..', 'reports')) {
    this.reportDir = reportDir;
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generateReport(testResults, deviceInfo = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FuelGo Appium Automation Engine';
    workbook.created = new Date();

    // ----------------------------------------------------
    // TAB 1: EXECUTIVE SUMMARY
    // ----------------------------------------------------
    const summarySheet = workbook.addWorksheet('Dashboard & Summary', {
      views: [{ showGridLines: true }]
    });

    // Title Banner
    summarySheet.mergeCells('A1:E2');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = '📱 FuelGo Android Appium E2E Automation Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0B1A3B' } }; // FuelGo Navy
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Metadata Table
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.status === 'PASS').length;
    const failedTests = testResults.filter(t => t.status === 'FAIL').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    const totalDuration = (testResults.reduce((acc, t) => acc + (t.duration || 0), 0) / 1000).toFixed(2);

    summarySheet.addRow([]); // Blank row
    summarySheet.addRow(['Execution Date', new Date().toLocaleString()]);
    summarySheet.addRow(['Target Device', deviceInfo.deviceName || 'Android Emulator (UiAutomator2)']);
    summarySheet.addRow(['OS Platform', `${deviceInfo.platformName || 'Android'} ${deviceInfo.platformVersion || '13.0'}`]);
    summarySheet.addRow(['Application URL / APK', deviceInfo.app || 'FuelGo Mobile Webview/Native']);
    summarySheet.addRow([]);

    // KPI Metrics Card Table
    summarySheet.addRow(['Metric', 'Value', 'Status Benchmark']);
    const kpiHeader = summarySheet.getRow(9);
    kpiHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565D8' } };

    const metricsData = [
      ['Total Test Cases', totalTests, 'Target: 100% Executed'],
      ['Passed Test Cases', passedTests, 'Target: All Pass'],
      ['Failed Test Cases', failedTests, failedTests === 0 ? 'Optimal (0)' : 'Requires Review'],
      ['Success Pass Rate', `${passRate}%`, parseFloat(passRate) >= 90 ? 'PASSED HIGH' : 'CRITICAL ATTENTION'],
      ['Total Duration (sec)', `${totalDuration}s`, 'Performance Nominal']
    ];

    metricsData.forEach(row => {
      const addedRow = summarySheet.addRow(row);
      if (row[0] === 'Passed Test Cases') {
        addedRow.getCell(2).font = { color: { argb: '008000' }, bold: true };
      } else if (row[0] === 'Failed Test Cases' && failedTests > 0) {
        addedRow.getCell(2).font = { color: { argb: 'FF0000' }, bold: true };
      }
    });

    summarySheet.getColumn('A').width = 25;
    summarySheet.getColumn('B').width = 35;
    summarySheet.getColumn('C').width = 30;

    // ----------------------------------------------------
    // TAB 2: DETAILED TEST RESULTS
    // ----------------------------------------------------
    const detailsSheet = workbook.addWorksheet('Test Execution Details', {
      views: [{ showGridLines: true }]
    });

    detailsSheet.columns = [
      { header: '#', key: 'id', width: 6 },
      { header: 'Test Suite / Module', key: 'suite', width: 22 },
      { header: 'Test Case Description', key: 'title', width: 45 },
      { header: 'Target Screen', key: 'screen', width: 18 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Error / Failure Details', key: 'error', width: 45 }
    ];

    // Header Styling
    const headerRow = detailsSheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } }; // FuelGo Orange
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Fill Test Data
    testResults.forEach((t, idx) => {
      const row = detailsSheet.addRow({
        id: idx + 1,
        suite: t.suite || 'E2E Flow',
        title: t.title,
        screen: t.screen || 'General',
        duration: t.duration || 0,
        status: t.status,
        error: t.error || 'N/A'
      });

      const statusCell = row.getCell('status');
      if (t.status === 'PASS') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
        statusCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
        statusCell.font = { color: { argb: 'C62828' }, bold: true };
      }
    });

    // ----------------------------------------------------
    // TAB 3: SCREEN COVERAGE ANALYSIS
    // ----------------------------------------------------
    const coverageSheet = workbook.addWorksheet('Screen Coverage Analysis');
    coverageSheet.columns = [
      { header: 'Screen Name', key: 'screen', width: 25 },
      { header: 'Total Checks', key: 'total', width: 15 },
      { header: 'Passed', key: 'passed', width: 15 },
      { header: 'Failed', key: 'failed', width: 15 },
      { header: 'Health Status', key: 'health', width: 20 }
    ];

    const covHeader = coverageSheet.getRow(1);
    covHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    covHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0B1A3B' } };

    const screenMap = {};
    testResults.forEach(t => {
      const scr = t.screen || 'General';
      if (!screenMap[scr]) screenMap[scr] = { total: 0, passed: 0, failed: 0 };
      screenMap[scr].total++;
      if (t.status === 'PASS') screenMap[scr].passed++;
      else screenMap[scr].failed++;
    });

    Object.keys(screenMap).forEach(scr => {
      const item = screenMap[scr];
      const health = item.failed === 0 ? 'HEALTHY (100%)' : `${((item.passed / item.total) * 100).toFixed(0)}% PASSED`;
      coverageSheet.addRow({
        screen: scr,
        total: item.total,
        passed: item.passed,
        failed: item.failed,
        health: health
      });
    });

    // Save Workbook to File
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Appium_E2E_Test_Report_${timestamp}.xlsx`;
    const filePath = path.join(this.reportDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    console.log(`\n✅ Excel Analysis Report generated successfully:`);
    console.log(`📂 Path: ${filePath}`);

    return filePath;
  }
}

module.exports = ExcelReporter;
