const { ISSUE_STATUS, ISSUE_STATUS_STRING, ISSUE_SUB_STATUS_NUM, AGENT_ASSIGNMENT_STATUS, ESTIMATE_STATUS, SERVV_USER_TYPE_NUM } = require("../../lib/constants");

module.exports = {
  addIssue(database) {
    return `INSERT INTO ${database}.issue SET ?`;
  },
  getIssues(database) {
    return `SELECT I.id, A.name as doorNo, P.name as projectName, CONCAT(AG.firstname, ' ', AG.lastname) as agentName, I.agent_id as agentID ,CONCAT(R.firstname, ' ', R.lastname) as name,
    CONCAT(P.city, ', ', P.district, ', ', P.state, ', ', P.country) as location,
    CASE WHEN I.status = ${ISSUE_STATUS.OPEN} THEN '${ISSUE_STATUS_STRING.OPEN}' 
    WHEN I.status = ${ISSUE_STATUS.INPROGRESS} THEN '${ISSUE_STATUS_STRING.INPROGRESS}' 
    WHEN I.status = ${ISSUE_STATUS.CLOSED} THEN '${ISSUE_STATUS_STRING.CLOSED}' 
    WHEN I.status = ${ISSUE_STATUS.ONHOLD} THEN '${ISSUE_STATUS_STRING.ONHOLD}' END as status, 
    I.created_at, RI.ph_num as phNum, I.description as issueDescription, S.name as serviceType, S.id as serviceID, I.preferred_time as time,
    I.img_src
    FROM ${database}.issue I
    left join ${database}.apartment A on I.apartment_id = A.id 
    left join ${database}.project P on A.project_id = P.id
    left join ${database}.resident R on I.resident_id = R.id
    left join ${database}.resident_identity RI on R.identity_id = RI.id
    left join ${database}.service S on I.service_type = S.id
    left join ${database}.agent AG on I.agent_id = AG.id
    where I.org_id = ?
    ORDER BY I.created_at DESC`;
  },
  getIssueStat(database) {
    return `SELECT 
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 1 END) AS estimateApproved,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN 1 END) AS estimateRejected,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_GENERATED} THEN 1 END) AS invoiceGenerated,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN 1 END) AS siteVisitCompleted,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.REVISIT_REQUIRED} THEN 1 END) AS revisitRequired,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.RE_WORK_REQUIRED} THEN 1 END) AS reWorkRequired,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_GENERATED} THEN 1 END) AS estimateGenerated,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN 1 END) AS workCompleted,
             COUNT(CASE WHEN due_date = CURDATE() THEN 1 END) AS dueToday 
             FROM ${database}.issue WHERE org_id = ?
             `
  },
  getIssuesEvent(database) {
    return `SELECT * FROM ${database}.issue_event where issue_id = ? ORDER BY created_at DESC`;
  },
  getIssuesUnderResident(database, limit, offset) {
    return `SELECT I.id, A.name as doorNo, P.name as projectName, CONCAT(R.firstname, ' ', R.lastname) as name,
    CONCAT(P.city, ', ', P.district, ', ', P.state, ', ', P.country) as location,
    CASE WHEN I.status = ${ISSUE_STATUS.OPEN} THEN '${ISSUE_STATUS_STRING.OPEN}' 
    WHEN I.status = ${ISSUE_STATUS.INPROGRESS} THEN '${ISSUE_STATUS_STRING.INPROGRESS}' 
    WHEN I.status = ${ISSUE_STATUS.CLOSED} THEN '${ISSUE_STATUS_STRING.CLOSED}' 
    WHEN I.status = ${ISSUE_STATUS.ONHOLD} THEN '${ISSUE_STATUS_STRING.ONHOLD}' END as status,
     I.created_at, RI.ph_num as phNum, I.description, S.name as serviceType, I.preferred_time as time,
    FROM ${database}.issue I
    left join ${database}.apartment A on I.apartment_id = A.id 
    left join ${database}.project P on A.project_id = P.id
    left join ${database}.resident R on I.resident_id = R.id
    left join ${database}.resident_identity RI on R.identity_id = RI.id
    left join ${database}.service S on I.service_type = S.id
    where I.resident_id = ? AND I.org_id = ?
    ORDER BY I.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  },
  updateIssue(database) {
    return `UPDATE ${database}.issue SET ? WHERE id = ?`;
  },
  addAgentAssignment(database) {
    return `INSERT INTO ${database}.agent_assignment SET ?`;
  },
  getSiteVisitUnderIssue(database) {
    return `SELECT 
        IE.issue_id, 
        IE.event_type, 
        CONCAT(A.firstname, ' ', A.lastname) AS assignee, 
        I.due_date,
        CASE 
            WHEN I.due_date < CURDATE() THEN DATEDIFF(CURDATE(), I.due_date)
            ELSE 0
        END AS over_due_date,
        (
            SELECT AA.assigned_time 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id
            order by AA.created_at desc
            LIMIT 1
        ) AS assigned_time,
        (
            SELECT AA.visit_scheduled_time 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id
            order by AA.created_at desc
            LIMIT 1
        ) AS site_visit_time,
        (
            SELECT AA.agent_inferences 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id 
            LIMIT 1
        ) AS agent_inferences,
        (
            SELECT AA.agent_uploads 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id 
            LIMIT 1
        ) AS agent_uploads
    FROM 
        ${database}.issue_event IE
    LEFT JOIN 
        ${database}.issue I ON I.id = IE.issue_id
    LEFT JOIN 
        ${database}.agent A ON A.id = I.agent_id
    WHERE 
        IE.sub_status IN (${ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED}, ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED}, ${ISSUE_SUB_STATUS_NUM.REVISIT_REQUIRED}) 
        AND I.id = ? 
    ORDER BY 
        I.created_at DESC;`
  },
  getWorkOrderUnderIssue(database) {
    return `SELECT 
        IE.issue_id, 
        IE.event_type,
        I.description,
        CONCAT(A.firstname, ' ', A.lastname) AS assignee, 
        I.due_date,
        CASE 
            WHEN I.due_date < CURDATE() THEN DATEDIFF(CURDATE(), I.due_date)
            ELSE 0
        END AS over_due_date,
        (
            SELECT AA.assigned_time 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id
            order by AA.created_at desc
            LIMIT 1
        ) AS assigned_time,
        (
            SELECT AA.visit_scheduled_time 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id
            order by AA.created_at desc
            LIMIT 1
        ) AS site_visit_time,
        (
            SELECT AA.agent_inferences 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id 
            LIMIT 1
        ) AS agent_inferences,
        (
            SELECT AA.agent_uploads 
            FROM ${database}.agent_assignment AA 
            WHERE AA.agent_id = A.id 
            LIMIT 1
        ) AS agent_uploads
    FROM 
        ${database}.issue_event IE
    LEFT JOIN 
        ${database}.issue I ON I.id = IE.issue_id
    LEFT JOIN 
        ${database}.agent A ON A.id = I.agent_id
    WHERE 
        IE.sub_status IN (${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED}, ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED}, ${ISSUE_SUB_STATUS_NUM.RE_WORK_REQUIRED}) 
        AND I.id = ? 
    ORDER BY 
        I.created_at DESC;`
  },
  updateAgentIDInAgentAssignmentofActiveIssue(database) {
    return `UPDATE ${database}.agent_assignment SET ? WHERE issue_id = ? AND status = ${AGENT_ASSIGNMENT_STATUS.PENDING}`;
  },
  getIssuseByID(database) {
    return `SELECT * FROM ${database}.issue where id = ?`;
  },
  addEstimate(database) {
    return `INSERT INTO ${database}.estimate SET ?`;
  },
  getActiveSiteVisitByIssueID(database) {
    return `SELECT * FROM ${database}.agent_assignment where issue_id = ? AND status = ${AGENT_ASSIGNMENT_STATUS.PENDING} LIMIT 1`;
  },
  updateAgentAssignmentByID(database) {
    return `UPDATE ${database}.agent_assignment SET ? WHERE id = ?`;
  },
  closeIssueByID(database) {
    return `UPDATE ${database}.issue SET status = ${ISSUE_STATUS.CLOSED} WHERE id = ?`;
  },
  hasPendingInvoice(database) {
    return `SELECT * FROM ${database}.issue where id = ? AND sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_GENERATED}`;
  },
  cancelEstimateByIssueID(database) {
    return `UPDATE ${database}.estimate SET status = ${ESTIMATE_STATUS.CANCELLED} WHERE issue_id = ?`;
  },
  getEstimateByIssueID(database) {
    return `SELECT * FROM ${database}.estimate where issue_id = ?`;
  },
  getEstimates(database) {
    return `SELECT id, issue_id, material_charge, labour_charge, total_charge, is_18_percent_gst_applied, is_inclusive_tax, is_exclusive_tax, expiry_date, notes, created_at, src, 
    CASE
    WHEN status = ${ESTIMATE_STATUS.APPROVED} THEN 'approved' 
    WHEN status = ${ESTIMATE_STATUS.REJECTED} THEN 'rejected' 
    ELSE 'pending' END as status 
    FROM ${database}.estimate where issue_id = ? order by created_at desc`;
  },
  updateEstimate(database) {
    return `UPDATE ${database}.estimate SET ? WHERE id = ?`;
  },
  getActiveEstimateByIssueID(database) {
    return `SELECT * FROM ${database}.estimate where issue_id = ? AND status = ${ESTIMATE_STATUS.CREATED} LIMIT 1`;
  },
  getInvoice(database) {
    return `SELECT id, issue_id, material_charge, labour_charge, total_charge, is_18_percent_gst_applied, is_inclusive_tax, is_exclusive_tax, expiry_date, notes, created_at, src, 
    CASE
    WHEN status = ${ESTIMATE_STATUS.APPROVED} THEN 'approved' 
    WHEN status = ${ESTIMATE_STATUS.REJECTED} THEN 'rejected' 
    ELSE 'pending' END as status 
    FROM ${database}.invoice where issue_id = ? order by created_at desc`;
  },
  getInvoiceByIssueID(database) {
    return `SELECT * FROM ${database}.invoice where issue_id = ?`;
  },
  addInvoice(database) {
    return `INSERT INTO ${database}.invoice SET ?`;
  },
  getIssueHistory(database) {
    return `SELECT id, issue_id, event_type, created_at,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.CREATED} THEN 'Created'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED} THEN 'Agent Assigned'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN 'Site Visit Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.REVISIT_REQUIRED} THEN 'Revisit Required'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_GENERATED} THEN 'Estimate Generated'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 'Estimate Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN 'Estimate Rejected'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 'Estimate Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} THEN 'Work Assigned'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN 'Work Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.RE_WORK_REQUIRED} THEN 'Re Work Required'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_GENERATED} THEN 'Invoice Generated'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.PAID} THEN 'Paid'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ONHOLD} THEN 'On Hold'
    ELSE 'created' END as event_type,
    CASE
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.ADMIN} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.admin WHERE id = creator_id LIMIT 1)
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.AGENT} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.agent WHERE id = creator_id LIMIT 1)
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.CUSTOMER} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.resident WHERE id = creator_id LIMIT 1) END as name,
    CASE
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.ADMIN} THEN 'Admin'
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.AGENT} THEN 'Agent'
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.CUSTOMER} THEN 'Resident' END as userType
    FROM ${database}.issue_event where issue_id = ? ORDER BY created_at ASC`;
  }

};






