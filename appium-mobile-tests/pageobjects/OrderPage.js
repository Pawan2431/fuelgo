const BasePage = require('./BasePage');

class OrderPage extends BasePage {
  // Selectors
  get fuelTypeRegular() { return '.fuel-option[data-fuel="regular"]'; }
  get fuelTypePremium() { return '.fuel-option[data-fuel="premium"]'; }
  get fuelTypeDiesel() { return '.fuel-option[data-fuel="diesel"]'; }

  get stepperDecreaseBtn() { return '#stepper-minus'; }
  get stepperIncreaseBtn() { return '#stepper-plus'; }
  get stepperValue() { return '#stepper-gallons-value'; }

  get deliveryAddressInput() { return '#delivery-address-input'; }
  get totalAmountText() { return '#order-total-price'; }
  get proceedToPaymentBtn() { return '#btn-proceed-payment'; }

  /**
   * Select Fuel Type
   */
  async selectFuelType(type) {
    if (type.toLowerCase() === 'premium') {
      await this.click(this.fuelTypePremium);
    } else if (type.toLowerCase() === 'diesel') {
      await this.click(this.fuelTypeDiesel);
    } else {
      await this.click(this.fuelTypeRegular);
    }
  }

  /**
   * Set Gallons / Liters Quantity using Stepper
   */
  async setQuantity(count) {
    for (let i = 0; i < count; i++) {
      await this.click(this.stepperIncreaseBtn);
    }
  }

  /**
   * Fill Delivery Address
   */
  async enterDeliveryAddress(address) {
    await this.type(this.deliveryAddressInput, address);
  }

  /**
   * Submit Order to proceed to Payment
   */
  async proceedToPayment() {
    await this.click(this.proceedToPaymentBtn);
  }
}

module.exports = OrderPage;
