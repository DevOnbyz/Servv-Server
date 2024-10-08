module.exports = {
  getAdminData(database) {
    return `SELECT * FROM ${database}.admin where username = ?`
  },
  getAdminDataByID(database) {
    return `SELECT * FROM ${database}.admin where id = ?`
  }
};
