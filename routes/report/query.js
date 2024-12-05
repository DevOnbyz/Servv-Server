module.exports = {
  addReport(database) {
    return `INSERT INTO ${database}.report SET ?`;
  },
  getReports(database) {
    return `SELECT * FROM ${database}.report WHERE org_id = ?`;
  }
}