module.exports = {
  getAllServicesByOrgID(database) {
    return `SELECT s.id, sor.id as relID, s.name, sor.description, s.created_at
    FROM ${database}.service s
    JOIN ${database}.service_organisation_rel sor 
    ON s.id = sor.service_id
    WHERE sor.org_id = ?`;
  },
  getAllActiveServicesByOrgID(database) {
    return `SELECT s.id, sor.id as relID, s.name, sor.description,sor.status as status, s.created_at
    FROM ${database}.service s
    JOIN ${database}.service_organisation_rel sor 
    ON s.id = sor.service_id
    WHERE sor.org_id = ? AND sor.status = 1`;
  },
  getServiceByName(database) {
    return `SELECT * FROM ${database}.service WHERE name = ?`;
  },
  addService(database) {
    return `INSERT INTO ${database}.service SET ?`;
  },
  isServiceAddedForOrg(database) {
    return `SELECT * FROM ${database}.service_organisation_rel WHERE org_id = ? AND service_id = ?;`;
  },
  getServiceIDForOrg(database) {
    return `SELECT service_id as serviceID FROM ${database}.service_organisation_rel WHERE id=?`;
  },
  updateServiceOrgRel(database) {
    return `UPDATE ${database}.service_organisation_rel SET ? WHERE id = ?`;
  },
  addServiceToOrg(database) {
    return `INSERT INTO ${database}.service_organisation_rel SET ?`;
  },
  getAllProjectsByOrgID(database) {
    return `SELECT * FROM ${database}.project WHERE org_id = ?`;
  },
  getProjectServiceRelData(database) {
    return `SELECT * FROM ${database}.project_service_rel WHERE project_id = ? AND service_id = ?`;
  },
  updateProjectServiceRel(database) {
    return `UPDATE ${database}.project_service_rel SET ? WHERE id = ?`;
  },
};
