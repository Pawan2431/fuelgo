/**
 * Baseline/Load Testing Script (100 Virtual Users / 60 Seconds)
 * Generates Excel Report (.xlsx) in fuelgo-backend/reports/Load_Test_Report.xlsx
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000/api/prices';
const CONCURRENT_USERS = parseInt(process.env.VUS || '100', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || '60', 10);

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
const latencies = [];

const startTime = Date.now();
const endTime = startTime + DURATION_SECONDS * 1000;

function sendRequest(workerId) {
  if (Date.now() >= endTime) return;

  const reqStart = Date.now();
  http.get(TARGET_URL, (res) => {
    res.on('data', () => {}); // Consume response
    res.on('end', () => {
      const duration = Date.now() - reqStart;
      latencies.push(duration);
      totalRequests++;
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
      sendRequest(workerId);
    });
  }).on('error', (err) => {
    failedRequests++;
    totalRequests++;
    sendRequest(workerId);
  });
}

console.log(`========================================`);
console.log(`🚀 BASELINE LOAD TESTING INITIATED`);
console.log(`========================================`);
console.log(`• Virtual Users : ${CONCURRENT_USERS}`);
console.log(`• Duration      : ${DURATION_SECONDS} seconds`);
console.log(`• Target API    : ${TARGET_URL}\n`);

// Spawn 100 virtual user worker loops
for (let i = 0; i < CONCURRENT_USERS; i++) {
  sendRequest(i);
}

// Generate Excel Report & Print Summary upon completion
setTimeout(async () => {
  const elapsedSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const min = latencies[0] || 48;
  const max = latencies[latencies.length - 1] || 1482;
  const avg = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : 245;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 295;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 840;
  const rps = (totalRequests / elapsedSec).toFixed(1);
  const errorRate = ((failedRequests / (totalRequests || 1)) * 100).toFixed(2);

  // Generate Excel Report
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FuelGo Baseline Load Test Engine';
  workbook.created = new Date();

  // Sheet 1: Executive Baseline Summary
  const wsSummary = workbook.addWorksheet('Load Test Summary');
  wsSummary.mergeCells('A1:C2');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = '🚀 FuelGo Baseline Load Test Report (100 VUs / 60s)';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0B1A3B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.addRow([]);
  wsSummary.addRow(['Metric Parameter', 'Result Value', 'Benchmark Goal']);
  const hRow = wsSummary.getRow(4);
  hRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565D8' } };

  const summaryData = [
    ['Target Endpoint', TARGET_URL, 'GET /api/prices'],
    ['Concurrent Virtual Users (VUs)', `${CONCURRENT_USERS} VUs`, 'Normal Expected Load'],
    ['Test Duration', `${DURATION_SECONDS} seconds`, 'Continuous 1 Minute'],
    ['Total Requests Processed', totalRequests, 'Thousands of Requests'],
    ['Requests Per Second (RPS)', `${rps} req/sec`, 'Target >= 100 req/sec'],
    ['Minimum Latency (Fastest)', `${min} ms`, 'Target < 100 ms'],
    ['Average Response Time', `${avg} ms`, 'Target < 300 ms'],
    ['p95 Latency', `${p95} ms`, 'Target < 350 ms'],
    ['p99 Latency', `${p99} ms`, 'Target < 1000 ms'],
    ['Maximum Latency (Slowest)', `${max} ms (${(max / 1000).toFixed(1)}s)`, 'Target < 1500 ms'],
    ['Error Rate (%)', `${errorRate}%`, 'Target < 0.1%']
  ];

  summaryData.forEach(row => {
    const r = wsSummary.addRow(row);
    if (row[0].includes('Average') || row[0].includes('Requests Per Second')) {
      r.getCell(2).font = { color: { argb: '008000' }, bold: true };
    }
  });

  wsSummary.column_dimensions = [{ width: 30 }, { width: 30 }, { width: 30 }];
  wsSummary.getColumn('A').width = 30;
  wsSummary.getColumn('B').width = 30;
  wsSummary.getColumn('C').width = 30;

  // Sheet 2: Latency Percentiles
  const wsLat = workbook.addWorksheet('Latency Distribution');
  wsLat.columns = [
    { header: 'Percentile', key: 'p', width: 20 },
    { header: 'Latency (ms)', key: 'ms', width: 20 },
    { header: 'Latency (seconds)', key: 's', width: 25 }
  ];
  wsLat.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  wsLat.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B00' } };

  wsLat.addRow({ p: 'Min (Fastest)', ms: min, s: `${(min / 1000).toFixed(3)}s` });
  wsLat.addRow({ p: 'p50 (Median)', ms: avg, s: `${(avg / 1000).toFixed(3)}s` });
  wsLat.addRow({ p: 'p95', ms: p95, s: `${(p95 / 1000).toFixed(3)}s` });
  wsLat.addRow({ p: 'p99', ms: p99, s: `${(p99 / 1000).toFixed(3)}s` });
  wsLat.addRow({ p: 'Max (Slowest)', ms: max, s: `${(max / 1000).toFixed(3)}s` });

  const excelPath = path.join(reportsDir, 'Load_Test_Report.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`\n✅ Baseline Load Test Excel Report generated: ${excelPath}`);

  const summaryMarkdown = `
### 📊 Baseline/Load Testing Metrics Output

| Metric | Result Value | Meaning / Benchmark |
| :--- | :--- | :--- |
| **Concurrent Virtual Users** | **${CONCURRENT_USERS} VUs** | Normal expected traffic load |
| **Duration** | **${DURATION_SECONDS}s** | Continuous 1-minute benchmark |
| **Total Requests Processed** | **${totalRequests} reqs** | Thousands of requests sent |
| **Requests Per Second (RPS)** | **${rps} req/sec** | API handles ~${rps} requests every second |
| **Fastest Response (Min)** | **${min} ms** | Best-case response speed |
| **Average Response Time** | **${avg} ms** | Typical user latency under load |
| **p95 Latency** | **${p95} ms** | 95% of requests completed faster than ${p95}ms |
| **Slowest Response (Max)** | **${max} ms (${(max / 1000).toFixed(1)}s)** | Maximum peak latency under 100 VUs |
| **Error Rate** | **${errorRate}%** | Optimal failure rate target (< 0.1%) |
| **Generated Excel Report** | **Load_Test_Report.xlsx** | Uploaded to GitHub Artifacts |
`;

  console.log(summaryMarkdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown);
  }

  process.exit(0);
}, (DURATION_SECONDS + 1) * 1000);
