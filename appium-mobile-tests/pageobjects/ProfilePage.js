const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  // Selectors
  get profileHeader() { return '#profile-user-name'; }
  get themeToggleSwitch() { return '#dark-mode-toggle'; }
  get editProfileBtn() { return '#btn-edit-profile'; }
  get logoutBtn() { return '#btn-logout'; }

  /**
   * Toggle Dark / Light Theme Mode
   */
  async toggleDarkMode() {
    await this.click(this.themeToggleSwitch);
  }

  /**
   * Log out of app
   */
  async logout() {
    await this.click(this.logoutBtn);
  }
}

module.exports = ProfilePage;
