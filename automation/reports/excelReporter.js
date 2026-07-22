/**
 * Enterprise Excel Report Generator for Appium Android Automation Suite
 * Generates:
 * 1. Automation_Test_Report.xlsx (7 sheets: Executed, Passed, Failed, Skipped, Metrics, Defect Summary, Pass Rate)
 * 2. Passed_Test_Cases.xlsx
 * 3. Failed_Test_Cases.xlsx
 * 4. Execution_Summary.xlsx
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs-extra');

class EnterpriseExcelReporter {
  constructor(outputDir = path.join(__dirname, '..', 'reports', 'Excel')) {
    this.outputDir = outputDir;
    fs.ensureDirSync(this.outputDir);
  }

  async generateAllExcelReports(testResults, deviceInfo = {}) {
    console.log(`📊 Generating Enterprise Excel Analysis Workbooks in ${this.outputDir}...`);

    const passedList = testResults.filter(t => t.status === 'PASS');
    const failedList = testResults.filter(t => t.status === 'FAIL');
    const skippedList = testResults.filter(t => t.status === 'SKIPPED');

    // 1. MASTER WORKBOOK: Automation_Test_Report.xlsx
    const masterWb = new ExcelJS.Workbook();
    masterWb.creator = 'FuelGo Android Enterprise SDET Suite';
    masterWb.created = new Date();

    // Sheet 1: Executed Test Cases
    const s1 = masterWb.addWorksheet('Executed Test Cases');
    s1.columns = [
      { header: 'Test ID', key: 'id', width: 16 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'testName', width: 40 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Execution Time (ms)', key: 'duration', width: 20 }
    ];
    s1.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0B1A3B' } };

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
    passedList.forEach(t => s2.addRow(t));

    // Sheet 3: Failed Tests
    const s3 = masterWb.addWorksheet('Failed Tests');
    s3.columns = [
      { header: 'Test ID', key: 'id', width: 16 },
      { header: 'Module', key: 'module', width: 22 },
      { header: 'Test Name', key: 'testName', width: 35 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Failure Reason / Error Log', key: 'error', width: 45 }
    ];
    s3.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C62828' } };
    failedList.forEach(t => s3.addRow(t));

    // Sheet 4: Skipped Tests
    const s4 = masterWb.addWorksheet('Skipped Tests');
    s4.columns = s1.columns;
    s4.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F57F17' } };
    skippedList.forEach(t => s4.addRow(t));

    // Sheet 5: Execution Metrics
    const s5 = masterWb.addWorksheet('Execution Metrics');
    s5.addRow(['Metric Parameter', 'Value']);
    s5.addRow(['Total Test Cases', testResults.length]);
    s5.addRow(['Passed Test Cases', passedList.length]);
    s5.addRow(['Failed Test Cases', failedList.length]);
    s5.addRow(['Skipped Test Cases', skippedList.length]);
    s5.addRow(['Pass Rate (%)', `${((passedList.length / testResults.length) * 100).toFixed(2)}%`]);
    s5.addRow(['Target Device', deviceInfo.deviceName || 'Android Emulator (UiAutomator2)']);
    s5.getColumn('A').width = 28;
    s5.getColumn('B').width = 35;

    // Sheet 6: Defect Summary
    const s6 = masterWb.addWorksheet('Defect Summary');
    s6.columns = [
      { header: 'Defect ID', key: 'id', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Defect Description', key: 'error', width: 45 },
      { header: 'Severity', key: 'sev', width: 15 }
    ];
    failedList.forEach((t, idx) => {
      s6.addRow({ id: `BUG-${idx + 101}`, module: t.module, error: t.error, sev: t.priority.includes('Critical') ? 'CRITICAL' : 'HIGH' });
    });

    // Sheet 7: Pass Rate Summary
    const s7 = masterWb.addWorksheet('Pass Rate Summary');
    s7.addRow(['Module Name', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate (%)']);
    s7.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    s7.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565D8' } };

    const moduleStats = {};
    testResults.forEach(t => {
      if (!moduleStats[t.module]) moduleStats[t.module] = { total: 0, p: 0, f: 0, s: 0 };
      moduleStats[t.module].total++;
      if (t.status === 'PASS') moduleStats[t.module].p++;
      else if (t.status === 'FAIL') moduleStats[t.module].f++;
      else moduleStats[t.module].s++;
    });

    Object.keys(moduleStats).forEach(m => {
      const st = moduleStats[m];
      const pr = ((st.p / st.total) * 100).toFixed(1);
      s7.addRow([m, st.total, st.p, st.f, st.s, `${pr}%`]);
    });

    const masterPath = path.join(this.outputDir, 'Automation_Test_Report.xlsx');
    await masterWb.xlsx.writeFile(masterPath);

    // 2. INDIVIDUAL WORKBOOK: Passed_Test_Cases.xlsx
    const passedWb = new ExcelJS.Workbook();
    const pws = passedWb.addWorksheet('Passed Test Cases');
    pws.columns = s1.columns;
    passedList.forEach(t => pws.addRow(t));
    await passedWb.xlsx.writeFile(path.join(this.outputDir, 'Passed_Test_Cases.xlsx'));

    // 3. INDIVIDUAL WORKBOOK: Failed_Test_Cases.xlsx
    const failedWb = new ExcelJS.Workbook();
    const fws = failedWb.addWorksheet('Failed Test Cases');
    fws.columns = s3.columns;
    failedList.forEach(t => fws.addRow(t));
    await failedWb.xlsx.writeFile(path.join(this.outputDir, 'Failed_Test_Cases.xlsx'));

    // 4. INDIVIDUAL WORKBOOK: Execution_Summary.xlsx
    const summaryWb = new ExcelJS.Workbook();
    const sws = summaryWb.addWorksheet('Execution Summary');
    sws.columns = s5.columns;
    testResults.slice(0, 10).forEach(t => sws.addRow(t));
    await summaryWb.xlsx.writeFile(path.join(this.outputDir, 'Execution_Summary.xlsx'));

    console.log(`✅ Excel Reports Generated Successfully! Master: ${masterPath}`);
  }
}

module.exports = EnterpriseExcelReporter;
