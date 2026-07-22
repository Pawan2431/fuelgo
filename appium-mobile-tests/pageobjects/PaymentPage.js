const BasePage = require('./BasePage');

class PaymentPage extends BasePage {
  // Selectors
  get creditCardOption() { return '.payment-option[data-method="card"]'; }
  get applePayOption() { return '.payment-option[data-method="applepay"]'; }
  get cashOnDeliveryOption() { return '.payment-option[data-method="cash"]'; }
  
  get confirmPaymentBtn() { return '#btn-confirm-payment'; }
  get successModal() { return '#success-screen-modal'; }
  get trackDriverBtn() { return '#btn-track-driver'; }

  /**
   * Select Payment Method
   */
  async selectPaymentMethod(method) {
    if (method === 'card') {
      await this.click(this.creditCardOption);
    } else if (method === 'applepay') {
      await this.click(this.applePayOption);
    } else {
      await this.click(this.cashOnDeliveryOption);
    }
  }

  /**
   * Confirm Payment & Place Order
   */
  async confirmPayment() {
    await this.click(this.confirmPaymentBtn);
  }

  /**
   * Go to Order Tracking Screen
   */
  async goToTracking() {
    await this.click(this.trackDriverBtn);
  }
}

module.exports = PaymentPage;
