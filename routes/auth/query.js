module.exports = {
  getAdminData(database) {
    return `SELECT * FROM ${database}.admin where BINARY username = ?`
  },
  getPermissionsByRoleID(database) {
    return `
      SELECT p.code AS code FROM ${database}.role_permission_rel AS rpr 
      LEFT JOIN ${database}.permission AS p ON rpr.permission_id = p.id
      WHERE rpr.role_id = ?;`;
  }
  ,
  getAgentData(database) {
    return `SELECT * FROM ${database}.agent A INNER JOIN ${database}.agent_identity AI ON A.identity_id = AI.id WHERE AI.ph_num = ?`
  },
  getAdminDataByID(database) {
    return `SELECT * FROM ${database}.admin where id = ?`
  },
  getOrgDetails(database) {
    return `SELECT * FROM ${database}.organisation where id = ?`
  },
  getResidentbyPhNum(database) {
    return `SELECT * FROM ${database}.resident where ph_num = ?`
  },
  getAgentbyPhNum(database) {
    return `SELECT * FROM ${database}.agent_identity where ph_num = ?`
  },
  getCustomerData(database) {
    return `SELECT * FROM ${database}.resident WHERE ph_num = ?`
  },
  getDistichOrgOfResidentsID(database) {
    return `SELECT DISTINCT org_id, id as residentId FROM ${database}.resident where id = ?`
  },
  getDistichOrgOfAgentsByIdentityID(database) {
    return `SELECT DISTINCT org_id, id as agentId FROM ${database}.agent where identity_id = ?`
  },
  getOrgDetailsByIDs(database) {
    return `SELECT * FROM ${database}.organisation where id in (?)`
  },
  updateResidentFcmToken(database) {
    return `UPDATE ${database}.resident SET fcm_token = ? WHERE ph_num = ?`;
  },
  updateAgentFcmToken(database) {
    return `UPDATE ${database}.agent_identity SET fcm_token = ? WHERE ph_num = ?`;
  }
};
