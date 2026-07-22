const BaseWebPage = require('./BaseWebPage');

class TrackingPage extends BaseWebPage {
  get trackingMap() { return '#map-track-container'; }
  get driverInfo() { return '#driver-name'; }
  get etaValue() { return '#delivery-eta'; }

  async isTrackingMapLoaded() {
    return await this.isDisplayed(this.trackingMap);
  }
}

module.exports = TrackingPage;
