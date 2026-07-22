/**
 * Base Web Page Object for Selenium WebDriver helper utilities
 */

const { By, until } = require('selenium-webdriver');

class BaseWebPage {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Navigate to URL
   */
  async open(url) {
    await this.driver.get(url);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(cssSelector, timeout = 10000) {
    const el = await this.driver.wait(until.elementLocated(By.css(cssSelector)), timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  /**
   * Click element
   */
  async click(cssSelector) {
    const el = await this.waitForElement(cssSelector);
    await el.click();
  }

  /**
   * Send text to input element
   */
  async type(cssSelector, text) {
    const el = await this.waitForElement(cssSelector);
    await el.clear();
    await el.sendKeys(text);
  }

  /**
   * Get text of element
   */
  async getText(cssSelector) {
    const el = await this.waitForElement(cssSelector);
    return await el.getText();
  }

  /**
   * Check if element is displayed
   */
  async isDisplayed(cssSelector) {
    try {
      const el = await this.driver.findElement(By.css(cssSelector));
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot for analysis
   */
  async takeScreenshot() {
    return await this.driver.takeScreenshot();
  }
}

module.exports = BaseWebPage;
