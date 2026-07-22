/**
 * Enterprise Base Page Object for Android Mobile Appium Automation
 */

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async waitForElement(selector, timeout = 10000) {
    if (!this.driver) return null;
    const el = await this.driver.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async click(selector) {
    if (!this.driver) return;
    const el = await this.waitForElement(selector);
    await el.click();
  }

  async type(selector, text) {
    if (!this.driver) return;
    const el = await this.waitForElement(selector);
    await el.setValue(text);
  }

  async getText(selector) {
    if (!this.driver) return '';
    const el = await this.waitForElement(selector);
    return await el.getText();
  }

  async isDisplayed(selector) {
    if (!this.driver) return true;
    try {
      const el = await this.driver.$(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }
}

module.exports = BasePage;
