# 📱 FuelGo Android Appium End-to-End Testing Suite

Complete mobile automation framework for testing the **FuelGo Android Application** using **Appium** and **WebDriverIO**, with automated **Excel (.xlsx) report generation**.

All tests, configurations, page objects, and report generators are isolated in this directory:  
📁 `C:\Users\pulla\OneDrive\FUELGO\appium-mobile-tests`

---

## 📁 Directory Structure

```text
appium-mobile-tests/
├── config/
│   └── appium.config.js       # Appium Server & Android Capabilities (UiAutomator2, Device Name, etc.)
├── pageobjects/
│   ├── BasePage.js            # Core gestures (swipes, clicks, waits, screenshots)
│   ├── AuthPage.js            # Login & Registration screen actions
│   ├── HomePage.js            # Gas station search & fuel type filter actions
│   ├── OrderPage.js           # Fuel selection, quantity stepper, address entry
│   ├── PaymentPage.js         # Payment methods (Card, Apple Pay, Cash) & Checkout
│   ├── TrackingPage.js        # Live map driver tracking & ETA verification
│   └── ProfilePage.js         # Settings, Dark Mode toggle, Logout
├── specs/
│   └── e2e_fuelgo_app.spec.js # Full End-to-End mobile test suite
├── reporters/
│   └── excelReporter.js       # Excel (.xlsx) analysis workbook generator
├── reports/                   # Output directory for generated Excel reports
├── runner.js                  # Main test runner script
└── package.json               # Node.js dependencies
```

---

## ⚡ Prerequisite Setup

### 1. Install Node.js Dependencies
Inside the `appium-mobile-tests` folder, run:
```bash
npm install
```

### 2. Appium Server & Android Driver Setup
Make sure Appium Server and the Android `uiautomator2` driver are installed:
```bash
npm install -g appium
appium driver install uiautomator2
```

---

## 🚀 How to Run the Tests

### Option A: Execute Appium Test Suite with Live Device / Emulator
1. Start your Android Emulator or connect a real Android phone via USB (`adb devices`).
2. Start the Appium Server in a terminal:
   ```bash
   appium
   ```
3. Run the automated test suite & generate Excel report:
   ```bash
   npm test
   # OR
   node runner.js
   ```

### Option B: Generate Demo Excel Analysis Report (Mock Mode)
To test report generation or preview the Excel output without launching an active Appium server:
```bash
node runner.js --mock
```

---

## 📊 Excel Analysis Report (.xlsx) Details

Every test run automatically creates a formatted Excel workbook in `appium-mobile-tests/reports/`:
`Appium_E2E_Test_Report_<TIMESTAMP>.xlsx`

### Included Sheets in Excel Report:
1. **Dashboard & Summary**: Executive KPI cards (Total Tests, Passed/Failed count, Pass Rate %, Execution Duration, Device Metadata).
2. **Test Execution Details**: Itemized test case log with color-coded **PASS (Green)** / **FAIL (Red)** status, target screen, duration, and error tracebacks.
3. **Screen Coverage Analysis**: Screen health analysis for Auth, Home, Order, Payment, Tracking, and Profile screens.
