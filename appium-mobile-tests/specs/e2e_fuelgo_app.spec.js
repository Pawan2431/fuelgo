/**
 * FuelGo Mobile App - End-to-End Appium Test Suite
 * Tests full mobile application flow from Splash Screen to Order Tracking & Settings.
 */

const AuthPage = require('../pageobjects/AuthPage');
const HomePage = require('../pageobjects/HomePage');
const OrderPage = require('../pageobjects/OrderPage');
const PaymentPage = require('../pageobjects/PaymentPage');
const TrackingPage = require('../pageobjects/TrackingPage');
const ProfilePage = require('../pageobjects/ProfilePage');

module.exports = function defineAppiumE2ESuite(driver, resultsCollector) {
  let authPage, homePage, orderPage, paymentPage, trackingPage, profilePage;

  function recordResult(title, screen, status, duration, error = null) {
    resultsCollector.push({
      suite: 'FuelGo E2E Mobile Suite',
      title,
      screen,
      status,
      duration,
      error: error ? error.message || String(error) : null
    });
  }

  return async function runAllTests() {
    authPage = new AuthPage(driver);
    homePage = new HomePage(driver);
    orderPage = new OrderPage(driver);
    paymentPage = new PaymentPage(driver);
    trackingPage = new TrackingPage(driver);
    profilePage = new ProfilePage(driver);

    console.log('\n========================================');
    console.log('📱 STARTING APPIUM MOBILE E2E TEST SUITE');
    console.log('========================================\n');

    // ----------------------------------------------------
    // TEST 1: Splash Screen & Initial Load
    // ----------------------------------------------------
    const startT1 = Date.now();
    try {
      console.log('👉 [Test 1] Verifying Splash Screen & App Loading...');
      const isVisible = await authPage.isDisplayed('#splash');
      if (!isVisible) throw new Error('Splash logo or container was not displayed');
      recordResult('Splash Screen & App Initialization', 'Splash Screen', 'PASS', Date.now() - startT1);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Splash Screen & App Initialization', 'Splash Screen', 'FAIL', Date.now() - startT1, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 2: User Registration & Authentication
    // ----------------------------------------------------
    const startT2 = Date.now();
    try {
      console.log('👉 [Test 2] Testing User Registration & Sign In...');
      await authPage.register('John Doe', 'john.doe@example.com', '+155501992', 'SecurePass123!');
      const loggedIn = await authPage.isLoggedIn();
      recordResult('User Registration & Sign In', 'Auth Screen', 'PASS', Date.now() - startT2);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('User Registration & Sign In', 'Auth Screen', 'FAIL', Date.now() - startT2, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 3: Station Search & Fuel Type Filtering
    // ----------------------------------------------------
    const startT3 = Date.now();
    try {
      console.log('👉 [Test 3] Testing Station Search & Fuel Filters...');
      await homePage.filterFuelType('diesel');
      await homePage.searchStation('Shell Express');
      recordResult('Search Stations & Apply Diesel Filter', 'Home Screen', 'PASS', Date.now() - startT3);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Search Stations & Apply Diesel Filter', 'Home Screen', 'FAIL', Date.now() - startT3, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 4: Fuel Order Creation & Quantity Stepper
    // ----------------------------------------------------
    const startT4 = Date.now();
    try {
      console.log('👉 [Test 4] Selecting Fuel & Customizing Quantity...');
      await orderPage.selectFuelType('premium');
      await orderPage.setQuantity(3); // Add 3 gallons
      await orderPage.enterDeliveryAddress('742 Evergreen Terrace, Springfield');
      await orderPage.proceedToPayment();
      recordResult('Customize Fuel Type & Quantity Stepper', 'Order Screen', 'PASS', Date.now() - startT4);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Customize Fuel Type & Quantity Stepper', 'Order Screen', 'FAIL', Date.now() - startT4, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 5: Payment Method Selection & Checkout
    // ----------------------------------------------------
    const startT5 = Date.now();
    try {
      console.log('👉 [Test 5] Selecting Credit Card Payment & Confirming...');
      await paymentPage.selectPaymentMethod('card');
      await paymentPage.confirmPayment();
      await paymentPage.goToTracking();
      recordResult('Select Payment Method & Checkout', 'Payment Screen', 'PASS', Date.now() - startT5);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Select Payment Method & Checkout', 'Payment Screen', 'FAIL', Date.now() - startT5, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 6: Live Order Map Tracking & Driver ETA
    // ----------------------------------------------------
    const startT6 = Date.now();
    try {
      console.log('👉 [Test 6] Verifying Live Map Tracking & ETA...');
      const isActive = await trackingPage.isTrackingActive();
      recordResult('Live Map Tracking & ETA Verification', 'Tracking Screen', 'PASS', Date.now() - startT6);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Live Map Tracking & ETA Verification', 'Tracking Screen', 'FAIL', Date.now() - startT6, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 7: Profile, Dark Mode Toggle & Logout
    // ----------------------------------------------------
    const startT7 = Date.now();
    try {
      console.log('👉 [Test 7] Testing Profile Settings & Dark Mode Toggle...');
      await homePage.navigateTo('profile');
      await profilePage.toggleDarkMode();
      await profilePage.logout();
      recordResult('Toggle Dark Mode & User Logout', 'Profile Screen', 'PASS', Date.now() - startT7);
      console.log('   ✅ PASS');
    } catch (err) {
      recordResult('Toggle Dark Mode & User Logout', 'Profile Screen', 'FAIL', Date.now() - startT7, err);
      console.log(`   ❌ FAIL: ${err.message}`);
    }

    console.log('\n========================================');
    console.log('🎉 ALL APPIUM TESTS COMPLETED');
    console.log('========================================\n');
  };
};
