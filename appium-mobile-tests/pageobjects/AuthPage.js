const BasePage = require('./BasePage');

class AuthPage extends BasePage {
  // Selectors
  get splashLogo() { return '#splash .splash-logo-img'; }
  get loginTabBtn() { return '#auth-tab-login'; }
  get registerTabBtn() { return '#auth-tab-register'; }
  
  get emailInput() { return '#auth-email-input'; }
  get passwordInput() { return '#auth-password-input'; }
  get nameInput() { return '#auth-name-input'; }
  get phoneInput() { return '#auth-phone-input'; }
  get authSubmitBtn() { return '#auth-submit-btn'; }
  get userGreeting() { return '#user-greeting-name'; }

  /**
   * Perform User Registration
   */
  async register(name, email, phone, password) {
    if (await this.isDisplayed(this.registerTabBtn)) {
      await this.click(this.registerTabBtn);
    }
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.phoneInput, phone);
    await this.type(this.passwordInput, password);
    await this.click(this.authSubmitBtn);
  }

  /**
   * Perform User Login
   */
  async login(email, password) {
    if (await this.isDisplayed(this.loginTabBtn)) {
      await this.click(this.loginTabBtn);
    }
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.authSubmitBtn);
  }

  /**
   * Check if user is logged in successfully
   */
  async isLoggedIn() {
    return await this.isDisplayed(this.userGreeting);
  }
}

module.exports = AuthPage;
