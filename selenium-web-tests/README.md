# 🌐 FuelGo Web Application Selenium Testing Suite (Node.js)

Complete end-to-end web automation suite for testing the **FuelGo Web Application** using **Selenium WebDriver** in **Node.js** with automated **Excel (.xlsx) report generation**.

All tests, configurations, page objects, and Excel reporters are saved in a separate folder:  
📁 `C:\Users\pulla\OneDrive\FUELGO\selenium-web-tests`

---

## 📁 Directory Structure

```text
selenium-web-tests/
├── config/
│   └── selenium.config.js       # Selenium browser capabilities, Chrome options, URLs
├── pageobjects/
│   ├── BaseWebPage.js           # Core Selenium WebDriver helpers (waits, clicks, typing)
│   ├── LandingPage.js           # Index.html navigation & landing page elements
│   ├── AuthPage.js              # Login & registration modals
│   ├── StationsPage.js          # Gas station search & live price comparison
│   ├── OrderPage.js             # Fuel selection, quantity stepper, address input
│   ├── PaymentPage.js           # Payment method selection & checkout
│   ├── TrackingPage.js          # Live map tracking component
│   └── ProfilePage.js           # Profile settings & Dark Mode toggle
├── specs/
│   └── e2e_fuelgo_web.spec.js   # End-to-End Selenium Web Test Suite
├── reporters/
│   └── excelWebReporter.js      # Excel (.xlsx) analysis workbook generator
├── reports/                     # Output directory for generated Excel reports
├── runner.js                    # Main Selenium Web test runner script
└── package.json                 # Node.js dependencies
```

---

## ⚡ Setup & Execution

### 1. Install Node.js Dependencies
Inside `selenium-web-tests`, run:
```bash
npm install
```

### 2. Run Selenium Web Tests & Generate Excel Report
To execute the Selenium Web test runner and export the Excel analysis:
```bash
npm test
```

For Headless Chrome execution:
```bash
npm run test:headless
```

---

## 📊 Excel Analysis Report (.xlsx) Details

Each test run creates a formatted Excel workbook in `selenium-web-tests/reports/`:
`Selenium_Web_Test_Report_<TIMESTAMP>.xlsx`

### Included Sheets:
1. **Web Executive Dashboard**: KPI Summary cards (Total Scenarios, Passed/Failed count, Pass Rate %, Execution Duration, Browser Metadata).
2. **Selenium Test Execution Log**: Itemized test execution log with **PASS (Green)** / **FAIL (Red)** status, target view URL, duration, and error tracebacks.
