module.exports = {
  getAllProjectsByOrgID(database) {
    return `SELECT * FROM ${database}.project WHERE org_id = ?`;
  },
  getAllApartmentsUnderProject(database) {
    return `SELECT * FROM ${database}.apartment WHERE project_id = ?`;
  },
  getAllActiveApartmentsUnderProject(database) {
    return `SELECT * FROM ${database}.apartment WHERE project_id = ? and status = 1`;
  },
  getResidentByIDs(database) {
    return `SELECT r.id, r.firstname, r.lastname, r.status,r.email_id, r.org_id, i.ph_num FROM ${database}.resident r left join ${database}.resident_identity i on r.identity_id = i.id WHERE r.id in (?)`;
  },
  
}