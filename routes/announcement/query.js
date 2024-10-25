module.exports = {
  getAllAnnouncementsByOrgID(database) {
    return `SELECT * FROM ${database}.announcement where org_id = ?`;
  },
  addAnnouncementToOrg(database) {
    return `INSERT INTO ${database}.announcement SET ?`;
  }
}