/**
 * Base Page Object containing common helper methods for Appium interactions
 */

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Wait for element to be displayed
   */
  async waitForElement(selector, timeout = 10000) {
    const el = typeof selector === 'string' ? await this.driver.$(selector) : selector;
    await el.waitForDisplayed({ timeout });
    return el;
  }

  /**
   * Click on an element
   */
  async click(selector) {
    const el = await this.waitForElement(selector);
    await el.click();
  }

  /**
   * Type text into input field
   */
  async type(selector, text) {
    const el = await this.waitForElement(selector);
    await el.setValue(text);
  }

  /**
   * Get text content of an element
   */
  async getText(selector) {
    const el = await this.waitForElement(selector);
    return await el.getText();
  }

  /**
   * Check if element is displayed
   */
  async isDisplayed(selector) {
    try {
      const el = await this.driver.$(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Swipe / Scroll Down (Mobile Native Gesture)
   */
  async swipeDown() {
    const { width, height } = await this.driver.getWindowSize();
    await this.driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: Math.floor(width / 2), y: Math.floor(height * 0.8) },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 500, x: Math.floor(width / 2), y: Math.floor(height * 0.2) },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);
  }

  /**
   * Take screenshot for reporting
   */
  async takeScreenshot() {
    return await this.driver.takeScreenshot();
  }
}

module.exports = BasePage;
