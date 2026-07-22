/**
 * Excel Analysis Reporter for Selenium Web Application Automation Suite
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelWebReporter {
  constructor(reportDir = path.join(__dirname, '..', 'reports')) {
    this.reportDir = reportDir;
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async generateReport(testResults, browserInfo = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FuelGo Selenium Web Engine';
    workbook.created = new Date();

    // ----------------------------------------------------
    // TAB 1: EXECUTIVE DASHBOARD
    // ----------------------------------------------------
    const summarySheet = workbook.addWorksheet('Web Executive Dashboard', {
      views: [{ showGridLines: true }]
    });

    // Title
    summarySheet.mergeCells('A1:E2');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = '🌐 FuelGo Web Application Selenium E2E Test Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565D8' } }; // FuelGo Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const total = testResults.length;
    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const duration = (testResults.reduce((acc, t) => acc + (t.duration || 0), 0) / 1000).toFixed(2);

    summarySheet.addRow([]);
    summarySheet.addRow(['Execution Date', new Date().toLocaleString()]);
    summarySheet.addRow(['Browser', browserInfo.browser || 'Google Chrome (Selenium WebDriver)']);
    summarySheet.addRow(['Automation Tool', 'Selenium WebDriver for Node.js']);
    summarySheet.addRow(['Base Web URL', browserInfo.baseUrl || 'http://localhost:3000/index.html']);
    summarySheet.addRow([]);

    summarySheet.addRow(['KPI Metric', 'Execution Result', 'Benchmark Threshold']);
    const kpiHeader = summarySheet.getRow(9);
    kpiHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0B1A3B' } };

    const kpis = [
      ['Total Web Scenarios', total, 'Target: 100% Executed'],
      ['Passed Scenarios', passed, 'Target: All Pass'],
      ['Failed Scenarios', failed, failed === 0 ? 'Zero Failures' : 'Requires Fix'],
      ['Success Pass Rate', `${passRate}%`, parseFloat(passRate) >= 90 ? 'HEALTHY' : 'CRITICAL'],
      ['Total Duration (sec)', `${duration}s`, 'Performance Nominal']
    ];

    kpis.forEach(r => {
      const addedRow = summarySheet.addRow(r);
      if (r[0] === 'Passed Scenarios') addedRow.getCell(2).font = { color: { argb: '008000' }, bold: true };
      if (r[0] === 'Failed Scenarios' && failed > 0) addedRow.getCell(2).font = { color: { argb: 'FF0000' }, bold: true };
    });

    summarySheet.getColumn('A').width = 25;
    summarySheet.getColumn('B').width = 35;
    summarySheet.getColumn('C').width = 28;

    // ----------------------------------------------------
    // TAB 2: DETAILED SCENARIO LOGS
    // ----------------------------------------------------
    const detailsSheet = workbook.addWorksheet('Selenium Test Execution Log');
    detailsSheet.columns = [
      { header: '#', key: 'id', width: 6 },
      { header: 'Web Feature / Module', key: 'feature', width: 22 },
      { header: 'Test Case Description', key: 'title', width: 45 },
      { header: 'Page URL / View', key: 'view', width: 22 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Error Log / Trace', key: 'error', width: 45 }
    ];

    const dHeader = detailsSheet.getRow(1);
    dHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
    dHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } };

    testResults.forEach((t, i) => {
      const row = detailsSheet.addRow({
        id: i + 1,
        feature: t.feature || 'Web E2E',
        title: t.title,
        view: t.view || 'index.html',
        duration: t.duration || 0,
        status: t.status,
        error: t.error || 'N/A'
      });

      const cell = row.getCell('status');
      if (t.status === 'PASS') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
        cell.font = { color: { argb: '2E7D32' }, bold: true };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
        cell.font = { color: { argb: 'C62828' }, bold: true };
      }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Selenium_Web_Test_Report_${timestamp}.xlsx`;
    const filePath = path.join(this.reportDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    console.log(`\n✅ Selenium Excel Analysis Report generated successfully:`);
    console.log(`📂 Path: ${filePath}`);

    return filePath;
  }
}

module.exports = ExcelWebReporter;
