module.exports = {
  getRolesUnderOrgByOrgID(database) {
    return `SELECT * FROM ${database}.role WHERE org_id = ?`;
  },
};
