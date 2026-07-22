const BasePage = require('./BasePage');

class HomePage extends BasePage {
  // Selectors
  get navHomeBtn() { return '#nav-home'; }
  get navOrdersBtn() { return '#nav-orders'; }
  get navEmergencyBtn() { return '#nav-emergency'; }
  get navProfileBtn() { return '#nav-profile'; }

  get searchBar() { return '#home-search-input'; }
  get fuelTypeFilterAll() { return '.fuel-filter[data-type="all"]'; }
  get fuelTypeFilterDiesel() { return '.fuel-filter[data-type="diesel"]'; }
  get fuelTypeFilterUnleaded() { return '.fuel-filter[data-type="unleaded"]'; }
  
  get stationCards() { return '.station-card'; }
  get orderFuelQuickBtn() { return '#quick-order-btn'; }
  get emergencyBanner() { return '#emergency-request-banner'; }

  /**
   * Navigate using Bottom Navigation Bar
   */
  async navigateTo(tabName) {
    switch (tabName.toLowerCase()) {
      case 'orders':
        await this.click(this.navOrdersBtn);
        break;
      case 'emergency':
        await this.click(this.navEmergencyBtn);
        break;
      case 'profile':
        await this.click(this.navProfileBtn);
        break;
      case 'home':
      default:
        await this.click(this.navHomeBtn);
        break;
    }
  }

  /**
   * Filter Stations by Fuel Type
   */
  async filterFuelType(type) {
    if (type.toLowerCase() === 'diesel') {
      await this.click(this.fuelTypeFilterDiesel);
    } else if (type.toLowerCase() === 'unleaded') {
      await this.click(this.fuelTypeFilterUnleaded);
    } else {
      await this.click(this.fuelTypeFilterAll);
    }
  }

  /**
   * Search for a Gas Station
   */
  async searchStation(query) {
    await this.type(this.searchBar, query);
  }
}

module.exports = HomePage;
