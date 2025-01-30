const { ISSUE_SUB_STATUS_NUM, AGENT_ASSIGNMENT_STATUS, ISSUE_STATUS, ISSUE_STATUS_STRING, AGENT_ASSIGNMENT_TYPE } = require("../../../lib/constants");

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
    return `SELECT AG.id, AG.org_id, AG.identity_id, AG.status, AG.firstname, AG.lastname, AG.email_id as email, AG.city, AG.district, AG.state, AG.country ,AGI.ph_num as ph_num,AG.role_id as role_id,R.name AS role, AG.created_at as created_at FROM ${database}.agent AG INNER JOIN ${database}.agent_identity AGI ON AG.identity_id = AGI.id LEFT JOIN ${database}.role R ON AG.role_id = R.id  WHERE AG.org_id = ? order by id desc`;
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
  getAgentAssignments(database , isActive, assignmentType) {
    return `SELECT AA.id as assignmentId, I.id as issueId, I.agent_id as agentId, A.name as doorNo, P.name as projectName, AA.type as assignmentType,
    CASE WHEN I.status = ${ISSUE_STATUS.ONHOLD} THEN '${ISSUE_STATUS_STRING.ONHOLD}'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.PENDING} THEN 'PENDING' 
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.COMPLETED} THEN 'COMPLETED'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.CANCELLED} THEN 'CANCELLED'
    END as status,
    AA.visit_scheduled_time as scheduledTime,
    P.city as city, P.district as district, P.state as state, P.country as country,
    CONCAT(R.firstname, ' ',  COALESCE(R.lastname, '')) as ResidentName
    FROM ${database}.agent_assignment AA
    LEFT JOIN ${database}.issue I ON AA.issue_id = I.id
    LEFT JOIN ${database}.apartment A ON I.apartment_id = A.id
    LEFT JOIN ${database}.project P ON A.project_id = P.id
    LEFT JOIN ${database}.resident R ON I.resident_id = R.id
    WHERE AA.agent_id = ? 
    ${isActive ? `AND AA.status = ${AGENT_ASSIGNMENT_STATUS.PENDING}` : ''}
    ${assignmentType !== undefined ? `AND AA.type = ${assignmentType}` : ''}
    ORDER BY AA.created_at DESC`;
  },
  getDetailedAssignmentUnderAgentByAssignmentID(database) {
    return `SELECT AA.id as id, I.id as issueId, CONCAT(R.firstname, ' ', COALESCE(R.lastname, '')) as ResidentName, RI.ph_num as ResidentPhone, AA.issue_id as issueId, CONCAT(A.firstname, ' ', COALESCE(A.lastname, '')) as assignee, AA.created_at as createdAt, AA.visit_scheduled_time as siteVisitTime,
    CASE
    WHEN AA.visit_scheduled_time < CURDATE() THEN DATEDIFF(CURDATE(), AA.visit_scheduled_time)
    ELSE 0
    END AS overDueDate,
    AA.type as assignmentType,
    AA.notes as noteForAgent,
    AA.agent_inferences as agentInferences,
    AA.agent_uploads as agent_uploads,
    I.description as issueDescription,
    I.img_src as issueImages,
    P.city as city, P.district as district, P.state as state, P.country as country,
    AA.created_at as AgentAssignmentCreatedTime,
    AA.updated_at as AgentAssignmentLastUpdatedTime,
    CASE
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.PENDING} THEN 'PENDING'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.COMPLETED} THEN 'COMPLETED'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.CANCELLED} THEN 'CANCELLED'
    END as status,
    AP.name as doorNo, P.name as projectName, S.name as serviceType, SOR.name as serviceSubTypeName,
    CONCAT(A.firstname, ' ', A.lastname) as agentAssignmentCreatedBy,
    CONCAT(B.firstname, ' ', B.lastname) as issueCreatedBy
    FROM ${database}.agent_assignment AA
    LEFT JOIN ${database}.agent A ON A.id = AA.agent_id
    LEFT JOIN ${database}.admin B ON B.id = AA.created_by
    LEFT JOIN ${database}.issue I ON I.id = AA.issue_id
    LEFT JOIN ${database}.apartment AP ON AP.id = I.apartment_id
    LEFT JOIN ${database}.project P ON P.id = AP.project_id
    LEFT JOIN ${database}.service S ON S.id = I.service_type
    LEFT JOIN ${database}.service_organisation_rel SOR ON SOR.id = I.service_subtype
    LEFT JOIN ${database}.resident R ON R.id = I.resident_id
    LEFT JOIN ${database}.resident_identity RI ON RI.id = R.identity_id
    where AA.id = ? AND AA.agent_id = ? ORDER BY AA.created_at DESC`;
  }
};



