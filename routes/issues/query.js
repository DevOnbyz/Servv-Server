module.exports = {
  addIssue(database) {
    return `INSERT INTO ${database}.issue SET ?`;
  },
  getIssues(database) {
    return `SELECT * FROM ${database}.issue where org_id = ?`;
  },
  getIssuesEvent(database) {
    return `SELECT * FROM ${database}.issue_event where issue_id = ? ORDER BY created_at DESC`;
  }
};



