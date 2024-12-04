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
  },
  getCustomerData(database) {
    return `SELECT * FROM ${database}.resident R INNER JOIN ${database}.resident_identity RI ON R.identity_id = RI.id WHERE RI.ph_num = ?`
  },
  getDistichOrgOfResidentsByIdentityID(database) {
    return `SELECT DISTINCT org_id, id as residentId FROM ${database}.resident where identity_id = ?`
  },
  getOrgDetailsByIDs(database) {
    return `SELECT * FROM ${database}.organisation where id in (?)`
  },
  updateFcmToken(database) {
    return `UPDATE ${database}.resident_identity SET fcm_token = ? WHERE ph_num = ?`;
  }
};
