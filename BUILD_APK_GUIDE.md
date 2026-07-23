# 📱 FuelGo Android APK Build & Setup Guide

This project contains the complete native Android project setup and configuration required to compile the **FuelGo Mobile Application** into an **Android APK (`com.fuelgo.app`)**.

---

## 📁 Android Project Structure

The Android WebView native project is configured in [`android/`](file:///c:/Users/pulla/OneDrive/FUELGO/android):

```text
c:\Users\pulla\OneDrive\FUELGO\android\
├── build.gradle                              # Root build file
├── settings.gradle                           # Project settings
├── app/
│   ├── build.gradle                          # App build configuration (Package: com.fuelgo.app)
│   └── src/main/
│       ├── AndroidManifest.xml               # Permissions (Internet, GPS Location, Network)
│       ├── java/com/fuelgo/app/
│       │   └── MainActivity.java             # Native WebView client loading web app
│       └── assets/www/
│           └── index.html                    # Bundled FuelGo HTML5/JS app
```

---

## 🚀 How to Build the FuelGo APK

### Option 1: Using Android Studio (Recommended)

1. Open **Android Studio**.
2. Select **Open** and choose the [`android/`](file:///c:/Users/pulla/OneDrive/FUELGO/android) directory:
   `C:\Users\pulla\OneDrive\FUELGO\android`
3. Wait for Gradle Sync to complete.
4. From the menu, click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Once complete, your `.apk` will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Option 2: Using Capacitor CLI

1. Run the Capacitor sync command in your terminal:
   ```bash
   npx cap sync android
   ```
2. Build the Android release binaries:
   ```bash
   npx cap build android
   ```

---

### Option 3: Command Line with Gradle Wrapper

If Android SDK / `ANDROID_HOME` environment variables are set:
```bash
cd android
./gradlew assembleDebug
```

Output path: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧪 Linking APK to Appium Automation Suite

The automated test framework in [`automation/config/appium.config.js`](file:///c:/Users/pulla/OneDrive/FUELGO/automation/config/appium.config.js) and [`appium-mobile-tests`](file:///c:/Users/pulla/OneDrive/FUELGO/appium-mobile-tests) targets:

* **Package Name:** `com.fuelgo.app`
* **Activity Name:** `.MainActivity`
* **Target APK Path:** `c:\Users\pulla\OneDrive\FUELGO\fuelgo-backend\fuelgo-app.apk`

After building your `.apk`, copy it to `fuelgo-backend/fuelgo-app.apk` or set the `APK_PATH` environment variable:

```bash
# PowerShell
Copy-Item android/app/build/outputs/apk/debug/app-debug.apk fuelgo-backend/fuelgo-app.apk

# Run Appium end-to-end tests
cd appium-mobile-tests
npm test
```
