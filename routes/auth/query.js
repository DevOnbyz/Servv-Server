module.exports = {
  getAdminData(database) {
    return `SELECT * FROM ${database}.admin where BINARY username = ?`
  },
  getAdminDataByID(database) {
    return `SELECT * FROM ${database}.admin where id = ?`
  }
};
