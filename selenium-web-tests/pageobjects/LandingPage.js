const BaseWebPage = require('./BaseWebPage');

class LandingPage extends BaseWebPage {
  // Selectors
  get heroTitle() { return '.hero-title, h1'; }
  get getStartedBtn() { return '.btn-primary, #get-started-btn'; }
  get featureCards() { return '.feature-card'; }
  get livePricesLink() { return '#nav-prices'; }

  async clickGetStarted() {
    await this.click(this.getStartedBtn);
  }
}

module.exports = LandingPage;
