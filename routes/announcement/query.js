module.exports = {
  getAllAnnouncementsByOrgID(database) {
    return `SELECT * FROM ${database}.announcement where org_id = ? order by id desc`;
  },
  addAnnouncementToOrg(database) {
    return `INSERT INTO ${database}.announcement SET ?`;
  }
}