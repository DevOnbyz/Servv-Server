module.exports = {
  getAllAnnouncementsByOrgID(database) {
    return `SELECT * FROM ${database}.announcement where org_id = ? order by id desc`;
  },
  addAnnouncementToOrg(database) {
    return `INSERT INTO ${database}.announcement SET ?`;
  },
  getAnnouncementById(database) {
    return `SELECT * FROM ${database}.announcement WHERE id = ?`;
  },
  updateAnnouncement(database) {
    return `UPDATE ${database}.announcement SET ? WHERE id = ?`;
  },
  getResidentApartmentRelByResidentID(database){
    return `SELECT * FROM ${database}.apartment_resident_rel WHERE resident_id = ?`
  },
  getProjectByApartmentID(database){
    return `SELECT project_id FROM ${database}.apartment WHERE id in (?)`
  }
}