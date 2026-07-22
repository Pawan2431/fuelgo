const BasePage = require('./BasePage');

class TrackingPage extends BasePage {
  // Selectors
  get trackingMap() { return '#map-track-container'; }
  get driverName() { return '#driver-name'; }
  get vehicleInfo() { return '#driver-vehicle'; }
  get etaText() { return '#delivery-eta'; }
  get callDriverBtn() { return '#btn-call-driver'; }
  get cancelOrderBtn() { return '#btn-cancel-order'; }

  /**
   * Check if Live Map Tracking is active
   */
  async isTrackingActive() {
    return await this.isDisplayed(this.trackingMap);
  }

  /**
   * Get Estimated Time of Arrival (ETA)
   */
  async getETA() {
    return await this.getText(this.etaText);
  }
}

module.exports = TrackingPage;
