# Android Appium E2E Execution Summary

**Build Number:** #101
**Execution Date:** Wed, 22 Jul 2026 20:01:29 GMT
**Git Commit:** `local-dev`
**Branch:** `main`

**APK Version:** FuelGo v2.4.0 (Release Build)
**Device:** Android Emulator (Pixel 7 Pro - UiAutomator2)
**Android Version:** Android 13.0

---

## 📊 Execution Metrics

| Metric | Value |
| :--- | :--- |
| **Total Test Cases** | **510** |
| **Executed** | 510 |
| **Passed** | 🟢 496 |
| **Failed** | 🔴 10 |
| **Skipped** | 🟡 4 |
| **Pass Percentage** | **97.3%** |
| **Fail Percentage** | 2.0% |
| **Execution Duration** | **297.06s** |

---

## 📝 Valid Test Case Summary

### 🟢 PASSED TESTS (496 Total)
✓ **TC_AUTH_001** - Verify Authentication behavior scenario #1
✓ **TC_AUTH_002** - Verify Authentication behavior scenario #2
✓ **TC_AUTH_003** - Verify Authentication behavior scenario #3
✓ **TC_AUTH_004** - Verify Authentication behavior scenario #4
✓ **TC_AUTH_005** - Verify Authentication behavior scenario #5
✓ **TC_AUTH_006** - Verify Authentication behavior scenario #6
✓ **TC_AUTH_007** - Verify Authentication behavior scenario #7
✓ **TC_AUTH_008** - Verify Authentication behavior scenario #8
✓ **TC_AUTH_009** - Verify Authentication behavior scenario #9
✓ **TC_AUTH_011** - Verify Authentication behavior scenario #11
*... and 486 more passed test cases.*

### 🔴 FAILED TESTS (10 Total)
✗ **TC_AUTH_010** - Verify Authentication behavior scenario #10
  **Reason:** OTP validation mismatch on SMS payload timeout

✗ **TC_AUTHZ_007** - Verify Authorization behavior scenario #7
  **Reason:** AssertionError: Expected element to be visible within 10000ms

✗ **TC_FORM_008** - Verify Forms behavior scenario #8
  **Reason:** Mandatory zip code field validation error popup missing

✗ **TC_CRUD_022** - Verify CRUD Operations behavior scenario #22
  **Reason:** Database connection timeout during station record deletion

✗ **TC_VAL_015** - Verify Input Validation behavior scenario #15
  **Reason:** Special characters regex exception in search query

✗ **TC_SESS_009** - Verify Session Management behavior scenario #9
  **Reason:** AssertionError: Expected element to be visible within 10000ms

✗ **TC_FILE_002** - Verify File Upload behavior scenario #2
  **Reason:** Application crash on upload of 50MB PDF document

✗ **TC_ACC_012** - Verify Accessibility behavior scenario #12
  **Reason:** AssertionError: Expected element to be visible within 10000ms

✗ **TC_PERF_004** - Verify Performance Smoke Tests behavior scenario #4
  **Reason:** AssertionError: Expected element to be visible within 10000ms

✗ **TC_REGRESS_014** - Verify Regression Suite behavior scenario #14
  **Reason:** AssertionError: Expected element to be visible within 10000ms

### 🟡 SKIPPED TESTS (4 Total)
- **TC_NOTIF_004** - Verify Notifications behavior scenario #4
  **Reason:** Feature flag disabled in test environment configuration

- **TC_FILE_010** - Verify File Upload behavior scenario #10
  **Reason:** Feature flag disabled in test environment configuration

- **TC_OFF_008** - Verify Offline Handling behavior scenario #8
  **Reason:** Feature flag disabled in test environment configuration

- **TC_RESP_005** - Verify Responsive UI behavior scenario #5
  **Reason:** Feature flag disabled in test environment configuration
