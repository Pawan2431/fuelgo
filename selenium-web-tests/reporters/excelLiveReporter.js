/**
 * Excel Analysis Reporter for Live GitHub Pages Selenium E2E Automation
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs-extra');

class ExcelLiveReporter {
  constructor(outputDirs = []) {
    this.outputDirs = outputDirs.length > 0 ? outputDirs : [
      path.join(__dirname, '..', '..', 'Test Results', 'Excel'),
      path.join(__dirname, '..', 'reports', 'Excel')
    ];
    this.outputDirs.forEach(dir => fs.ensureDirSync(dir));
  }

  async generateExcelReports(testResults, targetUrl) {
    console.log(`📊 Generating Live Selenium Excel Workbooks...`);

    const passed = testResults.filter(t => t.status === 'PASS');
    const failed = testResults.filter(t => t.status === 'FAIL');
    const skipped = testResults.filter(t => t.status === 'SKIPPED');

    // 1. MASTER WORKBOOK: Automation_Test_Report.xlsx
    const masterWb = new ExcelJS.Workbook();
    masterWb.creator = 'FuelGo Live Selenium SDET Engine';
    masterWb.created = new Date();

    // Sheet 1: Executed Test Cases
    const s1 = masterWb.addWorksheet('Executed Test Cases');
    s1.columns = [
      { header: 'Test ID', key: 'id', width: 16 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'testName', width: 42 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Execution Time (ms)', key: 'duration', width: 20 },
      { header: 'Priority', key: 'priority', width: 15 }
    ];
    s1.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565D8' } };

    testResults.forEach(t => {
      const r = s1.addRow(t);
      const cell = r.getCell('status');
      if (t.status === 'PASS') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
        cell.font = { color: { argb: '2E7D32' }, bold: true };
      } else if (t.status === 'FAIL') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
        cell.font = { color: { argb: 'C62828' }, bold: true };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8E1' } };
        cell.font = { color: { argb: 'F57F17' }, bold: true };
      }
    });

    // Sheet 2: Passed Tests
    const s2 = masterWb.addWorksheet('Passed Tests');
    s2.columns = s1.columns;
    s2.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
    passed.forEach(t => s2.addRow(t));

    // Sheet 3: Failed Tests
    const s3 = masterWb.addWorksheet('Failed Tests');
    s3.columns = [
      { header: 'Test ID', key: 'id', width: 16 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'testName', width: 35 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Failure Reason / Browser Log', key: 'error', width: 45 }
    ];
    s3.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C62828' } };
    failed.forEach(t => s3.addRow(t));

    // Sheet 4: Skipped Tests
    const s4 = masterWb.addWorksheet('Skipped Tests');
    s4.columns = s1.columns;
    s4.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F57F17' } };
    skipped.forEach(t => s4.addRow(t));

    // Sheet 5: Execution Metrics
    const s5 = masterWb.addWorksheet('Execution Metrics');
    s5.addRow(['Metric', 'Value']);
    s5.addRow(['Target Live URL', targetUrl]);
    s5.addRow(['Total Test Cases', testResults.length]);
    s5.addRow(['Passed Test Cases', passed.length]);
    s5.addRow(['Failed Test Cases', failed.length]);
    s5.addRow(['Skipped Test Cases', skipped.length]);
    s5.addRow(['Success Pass Rate (%)', `${((passed.length / testResults.length) * 100).toFixed(2)}%`]);
    s5.getColumn('A').width = 28;
    s5.getColumn('B').width = 45;

    // Sheet 6: Defect Summary
    const s6 = masterWb.addWorksheet('Defect Summary');
    s6.columns = [
      { header: 'Defect ID', key: 'id', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Defect Description', key: 'error', width: 45 }
    ];
    failed.forEach((t, i) => s6.addRow({ id: `BUG-WEB-${i + 101}`, module: t.module, error: t.error }));

    // Write files to output directories
    for (const dir of this.outputDirs) {
      await masterWb.xlsx.writeFile(path.join(dir, 'Automation_Test_Report.xlsx'));

      const pWb = new ExcelJS.Workbook();
      const pWs = pWb.addWorksheet('Passed Tests');
      pWs.columns = s1.columns;
      passed.forEach(t => pWs.addRow(t));
      await pWb.xlsx.writeFile(path.join(dir, 'Passed_Test_Cases.xlsx'));

      const fWb = new ExcelJS.Workbook();
      const fWs = fWb.addWorksheet('Failed Tests');
      fWs.columns = s3.columns;
      failed.forEach(t => fWs.addRow(t));
      await fWb.xlsx.writeFile(path.join(dir, 'Failed_Test_Cases.xlsx'));

      const sumWb = new ExcelJS.Workbook();
      const sumWs = sumWb.addWorksheet('Summary Report');
      sumWs.columns = s5.columns;
      testResults.slice(0, 10).forEach(t => sumWs.addRow(t));
      await sumWb.xlsx.writeFile(path.join(dir, 'Summary_Report.xlsx'));
    }

    console.log(`✅ Live Selenium Excel Reports generated successfully in Test Results/Excel!`);
  }
}

module.exports = ExcelLiveReporter;
