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
    }
};
