module.exports = {
  getAdminData(database) {
    return `SELECT * FROM ${database}.admin where BINARY username = ?`
  },
  getAdminDataByID(database) {
    return `SELECT * FROM ${database}.admin where id = ?`
  },
  getOrgDetails(database) {
    return `SELECT * FROM ${database}.organisation where id = ?`
  },
  getResidentbyPhNum(database) {
    return `SELECT * FROM ${database}.resident_identity where ph_num = ?`
  }
};
