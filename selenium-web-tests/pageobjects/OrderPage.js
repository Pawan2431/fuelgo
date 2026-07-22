const BaseWebPage = require('./BaseWebPage');

class OrderPage extends BaseWebPage {
  get fuelPremium() { return '.fuel-option[data-fuel="premium"]'; }
  get fuelRegular() { return '.fuel-option[data-fuel="regular"]'; }
  get minusBtn() { return '#stepper-minus'; }
  get plusBtn() { return '#stepper-plus'; }
  get addressInput() { return '#delivery-address-input'; }
  get proceedPaymentBtn() { return '#btn-proceed-payment'; }

  async selectFuel(type) {
    if (type === 'premium') await this.click(this.fuelPremium);
    else await this.click(this.fuelRegular);
  }

  async setGallons(count) {
    for (let i = 0; i < count; i++) {
      await this.click(this.plusBtn);
    }
  }

  async enterAddress(address) {
    await this.type(this.addressInput, address);
  }

  async proceedToPayment() {
    await this.click(this.proceedPaymentBtn);
  }
}

module.exports = OrderPage;
