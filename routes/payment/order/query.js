module.exports = {
    addOrder(database) {
        return `INSERT INTO ${database}.order SET ?`
    },
    updateOrder(database) {
        return `UPDATE ${database}.order SET ? WHERE id = ?`
    },
    getInvoiceByIssueID(database) {
        return `SELECT * FROM ${database}.invoice where issue_id = ?`;
    }
};
