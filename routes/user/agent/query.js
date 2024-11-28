const { ISSUE_SUB_STATUS_NUM } = require("../../../lib/constants");

module.exports = {
  getAgentIdentityByPhNum(database){
    return `SELECT * FROM ${database}.agent_identity where ph_num = ?`
  },
  addAgentIdentity(database){
    return `INSERT INTO ${database}.agent_identity SET ?`
  },
  getAgentByPhNumIDAndOrgID(database) {
    return `SELECT * FROM ${database}.agent WHERE identity_id = ? AND org_id = ?`;
  },
  addAgent(database) {
    return `INSERT INTO ${database}.agent SET ?`;
  },
  addAgentServiceRel(database) {
    return `INSERT INTO ${database}.agent_service_rel SET ?`;
  },
  getAllAgentsUnderOrg(database) {
    return `SELECT AG.id, AG.org_id, AG.identity_id, AG.status, AG.firstname, AG.lastname, AG.email_id as email, AG.city, AG.district, AG.state, AG.country ,AGI.ph_num as ph_num, AG.created_at as created_at FROM ${database}.agent AG INNER JOIN ${database}.agent_identity AGI ON AG.identity_id = AGI.id WHERE AG.org_id = ? order by id desc`;
  },
  getAllAgentsByAgentIDandOrg(database) {
    return `SELECT AG.id, AG.org_id, AG.identity_id, AG.status, AG.firstname, AG.lastname, AG.email_id, AG.city, AG.district, AG.state, AG.country ,AGI.ph_num as phNum FROM ${database}.agent AG INNER JOIN ${database}.agent_identity AGI ON AG.identity_id = AGI.id WHERE AG.id in (?) AND AG.org_id = ?`;
  },
  getDistinctServiceAgentMappingByAgentID(database) {
    return `SELECT DISTINCT service_id FROM ${database}.agent_service_rel where agent_id = ?`;
  },
  getAgentDetailsByID(database) {
    return `SELECT * FROM ${database}.agent WHERE id = ?`;
  },
  getAgentIdentityDetailsByID(database) {
    return `SELECT * FROM ${database}.agent_identity WHERE id = ?`;
  },
  updateAgentDetailsByID(database) {
    return `UPDATE ${database}.agent SET ? WHERE id = ?`;
  },
  getAllServicesByAgentID(database) {
    return `SELECT * FROM ${database}.agent_service_rel WHERE agent_id = ?`;
  },
  getAllAgentsUnderServiceID(database) {
    return `SELECT * FROM ${database}.agent_service_rel WHERE service_id = ?`;
  },
  deleteAgentServiceRelByAgentIDAndServiceIDs(database) {
    return `DELETE FROM ${database}.agent_service_rel WHERE agent_id = ? AND service_id in (?)`;
  },
  getActiveSiteVisitCountByAgentID(database) {
    return `SELECT count(*) as activeSiteVisit FROM ${database}.issue WHERE agent_id = ? AND sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED}`;
  },
  getActiveWorkLoadByCountAgentID(database) {
    return `SELECT count(*) as activeWorkLoad FROM ${database}.issue WHERE agent_id = ? AND sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED}`;
  },
};



