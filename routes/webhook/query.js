module.exports = {
    getSubscriptionByRazorpayCustomerId(database) {
        return `SELECT s.id as id FROM ${database}.subscriptions s INNER JOIN ${database}.organisation o ON s.org_id = o.id WHERE o.razorpay_customer_id = ?`
    },

    subscriptionLog(database) {
        return `INSERT INTO ${database}.subscription_payment_log SET ?`
    },

    updateSubscription(database) {
        return `UPDATE ${database}.subscriptions SET ? WHERE id = ?`
    }
};