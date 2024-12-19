module.exports = {
    addSubscription(database) {
        return `INSERT INTO ${database}.subscriptions SET ?`
    },
    addSubscriptionID(database) {
        return `UPDATE ${database}.organisation SET ? WHERE id = ?`
    },
    addSubscriptionLog(database) {
        return `UPDATE ${database}.organisation SET ? WHERE id = ?`
    },
    updateSubscription(database) {
        return `UPDATE ${database}.subscriptions SET ? WHERE org_id = ?`
    },
    getOrganisationById(database) {
        return `SELECT razorpay_customer_id FROM ${database}.organisation WHERE id = ?`
    },
    getActiveSubscriptions(database) {
        return `SELECT * FROM ${database}.subscriptions WHERE org_id = ? AND status = 1`
    },
    getSubscriptionPaymentLogs(database) {
        return `SELECT * FROM ${database}.subscription_payment_log WHERE subscription_id IN (?)`
    }

};
