const BaseWebPage = require('./BaseWebPage');

class ProfilePage extends BaseWebPage {
  get profileName() { return '#profile-user-name'; }
  get darkModeSwitch() { return '#dark-mode-toggle'; }
  get logoutBtn() { return '#btn-logout'; }

  async toggleDarkMode() {
    await this.click(this.darkModeSwitch);
  }

  async logout() {
    await this.click(this.logoutBtn);
  }
}

module.exports = ProfilePage;
