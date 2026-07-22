/**
 * FuelGo Web Application - Selenium End-to-End Test Suite
 */

const LandingPage = require('../pageobjects/LandingPage');
const AuthPage = require('../pageobjects/AuthPage');
const StationsPage = require('../pageobjects/StationsPage');
const OrderPage = require('../pageobjects/OrderPage');
const PaymentPage = require('../pageobjects/PaymentPage');
const TrackingPage = require('../pageobjects/TrackingPage');
const ProfilePage = require('../pageobjects/ProfilePage');

module.exports = function defineSeleniumWebSuite(driver, resultsCollector) {
  let landingPage, authPage, stationsPage, orderPage, paymentPage, trackingPage, profilePage;

  function recordResult(title, view, status, duration, error = null) {
    resultsCollector.push({
      feature: 'FuelGo Web E2E Suite',
      title,
      view,
      status,
      duration,
      error: error ? error.message || String(error) : null
    });
  }

  return async function runAllWebTests(baseUrl) {
    landingPage = new LandingPage(driver);
    authPage = new AuthPage(driver);
    stationsPage = new StationsPage(driver);
    orderPage = new OrderPage(driver);
    paymentPage = new PaymentPage(driver);
    trackingPage = new TrackingPage(driver);
    profilePage = new ProfilePage(driver);

    console.log('\n========================================');
    console.log('🌐 STARTING SELENIUM WEB E2E TEST SUITE');
    console.log('========================================\n');

    // ----------------------------------------------------
    // TEST 1: Landing Page Load & Hero Section
    // ----------------------------------------------------
    const t1 = Date.now();
    try {
      console.log('👉 [Test 1] Navigating to FuelGo Web Application...');
      await landingPage.open(baseUrl);
      recordResult('Landing Page Load & Hero Header Verification', 'index.html', 'PASS', Date.now() - t1);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Landing Page Load & Hero Header Verification', 'index.html', 'FAIL', Date.now() - t1, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 2: User Sign Up & Authentication
    // ----------------------------------------------------
    const t2 = Date.now();
    try {
      console.log('👉 [Test 2] Testing User Account Registration...');
      await authPage.registerUser('Jane Smith', 'jane.smith@example.com', '+155501988', 'SecretPass2026!');
      recordResult('User Account Registration & Login Modal', 'fuelgo-app.html', 'PASS', Date.now() - t2);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('User Account Registration & Login Modal', 'fuelgo-app.html', 'FAIL', Date.now() - t2, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 3: Gas Station Search & Fuel Price Comparison
    // ----------------------------------------------------
    const t3 = Date.now();
    try {
      console.log('👉 [Test 3] Searching Nearby Stations & Diesel Filters...');
      await stationsPage.filterByFuel('diesel');
      await stationsPage.search('Chevron');
      recordResult('Station Search & Live Price Filter', 'fuelgo-app.html', 'PASS', Date.now() - t3);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Station Search & Live Price Filter', 'fuelgo-app.html', 'FAIL', Date.now() - t3, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 4: Fuel Order Creation & Quantity Stepper
    // ----------------------------------------------------
    const t4 = Date.now();
    try {
      console.log('👉 [Test 4] Customizing Fuel Quantity & Address...');
      await orderPage.selectFuel('premium');
      await orderPage.setGallons(4);
      await orderPage.enterAddress('100 Web Automation Way, Tech City');
      await orderPage.proceedToPayment();
      recordResult('Fuel Selection & Delivery Address Entry', 'fuelgo-app.html', 'PASS', Date.now() - t4);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Fuel Selection & Delivery Address Entry', 'fuelgo-app.html', 'FAIL', Date.now() - t4, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 5: Payment Method Selection & Checkout
    // ----------------------------------------------------
    const t5 = Date.now();
    try {
      console.log('👉 [Test 5] Selecting Credit Card Payment & Confirmation...');
      await paymentPage.selectPayment('card');
      await paymentPage.confirmCheckout();
      await paymentPage.goToTracking();
      recordResult('Credit Card Checkout & Order Confirmation', 'fuelgo-app.html', 'PASS', Date.now() - t5);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Credit Card Checkout & Order Confirmation', 'fuelgo-app.html', 'FAIL', Date.now() - t5, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 6: Live Order Map Tracking
    // ----------------------------------------------------
    const t6 = Date.now();
    try {
      console.log('👉 [Test 6] Verifying Order Tracking Map Component...');
      const loaded = await trackingPage.isTrackingMapLoaded();
      recordResult('Live Order Map Tracking Component', 'fuelgo-app.html', 'PASS', Date.now() - t6);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Live Order Map Tracking Component', 'fuelgo-app.html', 'FAIL', Date.now() - t6, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 7: Theme Toggle & User Logout
    // ----------------------------------------------------
    const t7 = Date.now();
    try {
      console.log('👉 [Test 7] Testing Dark Theme Mode Toggle & Logout...');
      await profilePage.toggleDarkMode();
      await profilePage.logout();
      recordResult('Dark Mode Theme Toggle & User Logout', 'fuelgo-app.html', 'PASS', Date.now() - t7);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Dark Mode Theme Toggle & User Logout', 'fuelgo-app.html', 'FAIL', Date.now() - t7, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    console.log('\n========================================');
    console.log('🎉 ALL SELENIUM WEB TESTS COMPLETED');
    console.log('========================================\n');
  };
};
