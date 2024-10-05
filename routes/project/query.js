module.exports = {
  getAllProjectsByOrgID(database) {
    return `SELECT * FROM ${database}.project WHERE org_id = ?`;
  },
  addProjectToOrg(database) {
    return `INSERT INTO ${database}.project SET ?`;
  },
  addprojectServiceRel(database) {
    return `INSERT INTO ${database}.project_service_rel SET ?`;
  },
  getAllActiveServicesByProject(database) {
    return `SELECT id,name FROM ${database}.service WHERE id IN (SELECT service_id FROM ${database}.project_service_rel WHERE project_id = ? and status = 1)`;
  },
  getAllProjectsByOrgID(database) {
    return `SELECT * FROM ${database}.project WHERE org_id = ?`;
  },
  updateProject(database) {
    return `UPDATE ${database}.project SET ? WHERE id = ?`;
  },
  isServiceAddedForProject(database) {
    return `SELECT * FROM ${database}.project_service_rel WHERE project_id = ? AND service_id = ?;`;
  },
  updateprojectServiceRel(database) {
    return `UPDATE ${database}.project_service_rel SET ? WHERE project_id = ? AND service_id = ?;`;
  }
};


