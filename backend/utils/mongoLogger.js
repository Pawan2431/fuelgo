const { AuthLog, LoginHistory, ActivityLog, SystemLog, OrderHistory } = require('../models/LogModels');

class MongoLogger {
  static async logAuth(data) {
    try {
      await AuthLog.create(data);
    } catch (err) {
      console.error('Failed to log auth event:', err.message);
    }
  }

  static async logLoginHistory(data) {
    try {
      await LoginHistory.create(data);
    } catch (err) {
      console.error('Failed to log login history:', err.message);
    }
  }

  static async updateLogoutHistory(userId) {
    try {
      await LoginHistory.findOneAndUpdate(
        { userId, status: 'ACTIVE' },
        { logoutTime: new Date(), status: 'LOGGED_OUT' },
        { sort: { loginTime: -1 } } // Update latest active session
      );
    } catch (err) {
      console.error('Failed to update logout history:', err.message);
    }
  }

  static async logActivity(data) {
    try {
      await ActivityLog.create(data);
    } catch (err) {
      console.error('Failed to log activity:', err.message);
    }
  }

  static async logSystem(level, service, message, meta = {}) {
    try {
      await SystemLog.create({
        level,
        service,
        message,
        ...meta
      });
    } catch (err) {
      console.error('Failed to log system event:', err.message);
    }
  }

  static async logOrderHistory(data) {
    try {
      await OrderHistory.create(data);
    } catch (err) {
      console.error('Failed to log order history:', err.message);
    }
  }
}

module.exports = MongoLogger;
