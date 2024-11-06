module.exports = {
  addIssue(database) {
    return `INSERT INTO ${database}.issue SET ?`;
  },

};



