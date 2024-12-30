module.exports = {
    getSubscriptionByRazorpayCustomerId(database) {
        return `SELECT s.id as id FROM ${database}.subscriptions s INNER JOIN ${database}.organisation o ON s.org_id = o.id WHERE o.razorpay_customer_id = ?`
    },
    addSubscriptionLog(database) {
        return `INSERT INTO ${database}.subscription_payment_log SET ?`
    },
    updateSubscription(database) {
        return `UPDATE ${database}.subscriptions SET ? WHERE id = ?`
    },
    addOrder(database) {
        return `INSERT INTO ${database}.order SET ?`
    },
    updateOrder(database) {
        return `UPDATE ${database}.order SET ? WHERE id = ?`
    },
    updatePayment(database) {
        return `UPDATE ${database}.payment SET ? WHERE transfer_id = ?`
    },
    addPayment(database) {
        return `INSERT INTO ${database}.payment SET ?`
    },
    getOrderByIssueOrInvoiceId(database) {
        return `SELECT * FROM ${database}.order WHERE issue_id = ? OR invoice_id = ? LIMIT 1;`
    },
    getOrganisationByOrgID(database){
        return `SELECT * FROM ${database}.organisation WHERE id = ? LIMIT 1;`
    },
    updateIssue(database) {
        return `UPDATE ${database}.issue SET ? WHERE id = ?`;
    },
    getPaymentByTransferID(database) {
        return `SELECT * FROM ${database}.payment WHERE id = ? LIMIT 1;`;
    }
};