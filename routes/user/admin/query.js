module.exports = {
  getAdminIdentityByPhNum(database){
    return `SELECT * FROM ${database}.admin where ph_num = ? AND org_id = ?`
  },
  getAllAdminsUnderOrg(database) {
    return `
    SELECT a.id, a.firstname, a.lastname, a.email, a.ph_num, a.username, a.org_id, a.project_id, a.status, a.reports_to, a.role_id, r.name as role, a.created_at 
    FROM ${database}.admin a
    LEFT JOIN ${database}.role r 
    ON a.role_id = r.id
    WHERE a.org_id = ? ORDER BY  a.id DESC
`;
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



