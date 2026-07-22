const BaseWebPage = require('./BaseWebPage');

class PaymentPage extends BaseWebPage {
  get cardOption() { return '.payment-option[data-method="card"]'; }
  get cashOption() { return '.payment-option[data-method="cash"]'; }
  get confirmPaymentBtn() { return '#btn-confirm-payment'; }
  get trackDriverBtn() { return '#btn-track-driver'; }

  async selectPayment(method) {
    if (method === 'card') await this.click(this.cardOption);
    else await this.click(this.cashOption);
  }

  async confirmCheckout() {
    await this.click(this.confirmPaymentBtn);
  }

  async goToTracking() {
    await this.click(this.trackDriverBtn);
  }
}

module.exports = PaymentPage;
