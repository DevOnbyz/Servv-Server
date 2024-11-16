module.exports = {
  getAllAdminsUnderOrg(database) {
    return `SELECT id, firstname, lastname, email, ph_num, username, org_id, project_id, status, reports_to, role_id, created_at FROM ${database}.admin WHERE org_id = ? order by id desc`;
  },
  addAdmin(database) {
    return `INSERT INTO ${database}.admin SET ?`
  },
  getProjectsByIDs(database) {
    return `SELECT id,name, city, district, state, country FROM ${database}.project WHERE id in (?)`;
  },
  updateAdminDetails(database) {
    return `UPDATE ${database}.admin SET ? WHERE id = ?`;
  },
};



