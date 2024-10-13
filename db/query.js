module.exports = {
  getAllProjectsByOrgID(database) {
    return `SELECT * FROM ${database}.project WHERE org_id = ?`;
  },
  
}