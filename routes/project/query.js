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
    return `SELECT sor.id, sor.name, sor.service_type, s.name AS serviceTypeName FROM ${database}.service_organisation_rel sor JOIN ${database}.service s
            ON sor.service_type = s.id 
            WHERE sor.id IN (SELECT service_id FROM ${database}.project_service_rel WHERE project_id = ? and status = 1)`;
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



