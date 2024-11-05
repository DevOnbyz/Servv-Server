const getAvtiveAnnouncements = (database) => {
  return `SELECT * FROM ${database}.announcement WHERE org_id = ? and status = 1 and expire_date < NOW();`
}
const updateAnnouncementStatusByIDs = (database) => {
  return `UPDATE ${database}.announcement SET status = ? WHERE id in (?);`
}

module.exports = {
  getAvtiveAnnouncements,
  updateAnnouncementStatusByIDs
}