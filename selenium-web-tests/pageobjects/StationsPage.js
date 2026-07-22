const BaseWebPage = require('./BaseWebPage');

class StationsPage extends BaseWebPage {
  get searchInput() { return '#home-search-input'; }
  get filterDiesel() { return '.fuel-filter[data-type="diesel"]'; }
  get filterUnleaded() { return '.fuel-filter[data-type="unleaded"]'; }
  get stationCards() { return '.station-card'; }

  async filterByFuel(type) {
    if (type === 'diesel') await this.click(this.filterDiesel);
    else await this.click(this.filterUnleaded);
  }

  async search(query) {
    await this.type(this.searchInput, query);
  }
}

module.exports = StationsPage;
