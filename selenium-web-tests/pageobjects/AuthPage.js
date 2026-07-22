const BaseWebPage = require('./BaseWebPage');

class AuthPage extends BaseWebPage {
  // Selectors
  get loginTab() { return '#auth-tab-login'; }
  get registerTab() { return '#auth-tab-register'; }
  get nameInput() { return '#auth-name-input'; }
  get emailInput() { return '#auth-email-input'; }
  get phoneInput() { return '#auth-phone-input'; }
  get passwordInput() { return '#auth-password-input'; }
  get submitBtn() { return '#auth-submit-btn'; }
  get userGreeting() { return '#user-greeting-name'; }

  async registerUser(name, email, phone, password) {
    if (await this.isDisplayed(this.registerTab)) {
      await this.click(this.registerTab);
    }
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.phoneInput, phone);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
  }

  async loginUser(email, password) {
    if (await this.isDisplayed(this.loginTab)) {
      await this.click(this.loginTab);
    }
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
  }
}

module.exports = AuthPage;
