module.exports = {
  getAllAnnouncementsByOrgID(database) {
    return `SELECT a.*,
    CASE WHEN ai.id IS NOT NULL THEN true ELSE false END AS interest
    FROM ${database}.announcement a
    LEFT JOIN ${database}.announcement_interest ai ON a.id = ai.announcement_id
    WHERE a.org_id = ?
    ORDER BY a.id DESC;
  `;
  },
  getAllAnnouncementsByOrgIDWithInterest(database){
    return `SELECT a.*,
    CASE WHEN ai.id IS NOT NULL THEN true ELSE false END AS interest
    FROM ${database}.announcement a
    LEFT JOIN ${database}.announcement_interest ai ON a.id = ai.announcement_id AND ai.resident_id = ?
    WHERE a.org_id = ?
    ORDER BY a.id DESC;
  `;
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
  },
  addInterestToAnnouncement(database){
    return `INSERT INTO ${database}.announcement_interest SET ?`;
  },
  getAnnouncementResponses(database){
    return `SELECT * FROM ${database}.announcement_interest WHERE announcement_id in (?)`
  }
}