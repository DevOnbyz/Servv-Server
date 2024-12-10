const { ISSUE_STATUS, ISSUE_STATUS_STRING, ISSUE_SUB_STATUS_NUM, AGENT_ASSIGNMENT_STATUS, QUOTATION_STATUS, SERVV_USER_TYPE_NUM, AGENT_ASSIGNMENT_TYPE } = require("../../lib/constants");

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
    I.created_at, RI.ph_num as phNum, I.description as issueDescription, S.name as serviceType, S.id as serviceID, SUB.id as subServiceID, SUB.name as subServiceType, I.customer_preferred_time as scheduledTime, I.initial_activity_time as initialActivityTime,
    I.img_src
    FROM ${database}.issue I
    left join ${database}.apartment A on I.apartment_id = A.id 
    left join ${database}.project P on A.project_id = P.id
    left join ${database}.resident R on I.resident_id = R.id
    left join ${database}.resident_identity RI on R.identity_id = RI.id
    left join ${database}.service S on I.service_type = S.id
    left join ${database}.service_organisation_rel SUB on I.service_subtype = SUB.id
    left join ${database}.agent AG on I.agent_id = AG.id
    where I.org_id = ?
    ORDER BY I.created_at DESC`;
  },
  getIssueStat(database) {
    return `SELECT 
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 1 END) AS estimateApproved,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN 1 END) AS estimateRejected,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED} THEN 1 END) AS invoiceGenerated,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN 1 END) AS siteVisitCompleted,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT} THEN 1 END) AS estimateDraft,
             COUNT(CASE WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN 1 END) AS workCompleted,
             COUNT(CASE WHEN customer_preferred_time = CURDATE() THEN 1 END) AS dueToday 
             FROM ${database}.issue WHERE org_id = ?
             `
  },
  getIssuesEvent(database) {
    return `SELECT id, issue_id,event_type,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.OPEN} THEN 'OPEN'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED} THEN 'SITE VISIT ASSIGNED'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN 'Site Visit Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT} THEN 'Estimate Drafted'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 'Estimate Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN 'Estimate Rejected'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED} THEN 'Invoice Drafted'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} THEN 'Work Assigned'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ORDER_CANCELLED} THEN 'Work Order Cancelled'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED} THEN 'Site Visit Cancelled'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED} THEN 'Invoice Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_SENT} THEN 'Invoice Sent'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT} THEN 'Estimate Sent'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.PAID} THEN 'Paid'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN 'Work Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ONHOLD} THEN 'ON HOLD'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.CLOSED} THEN 'ON CLOSED'
    END as event_type_string,
    sub_status, created_at, creator_id, entity_id, creator_type, event_time, created_at  FROM ${database}.issue_event where issue_id = ? ORDER BY created_at DESC`;
  },
  getIssuesUnderResident(database, limit, offset) {
    return `SELECT I.id, A.name as doorNo, P.name as projectName, CONCAT(R.firstname, ' ', R.lastname) as name,
    CONCAT(P.city, ', ', P.district, ', ', P.state, ', ', P.country) as location, SOR.name as serviceSubTypeName,
    CASE WHEN I.status = ${ISSUE_STATUS.OPEN} THEN '${ISSUE_STATUS_STRING.OPEN}' 
    WHEN I.status = ${ISSUE_STATUS.INPROGRESS} THEN '${ISSUE_STATUS_STRING.INPROGRESS}' 
    WHEN I.status = ${ISSUE_STATUS.CLOSED} THEN '${ISSUE_STATUS_STRING.CLOSED}'
    WHEN I.status = ${ISSUE_STATUS.ONHOLD} THEN '${ISSUE_STATUS_STRING.ONHOLD}' END as status, 
    I.created_at, RI.ph_num as phNum, I.description, S.name as serviceType, I.customer_preferred_time as time, I.initial_activity_time as initialActivityTime, I.img_src
    FROM ${database}.issue I
    left join ${database}.apartment A on I.apartment_id = A.id 
    left join ${database}.project P on A.project_id = P.id
    left join ${database}.resident R on I.resident_id = R.id
    left join ${database}.resident_identity RI on R.identity_id = RI.id
    left join ${database}.service S on I.service_type = S.id
    left join ${database}.service_organisation_rel SOR on I.service_subtype = SOR.id
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
    return `SELECT AA.id as id, AA.issue_id as issue_id, CONCAT(A.firstname, ' ', A.lastname) as assignee, AA.assigned_time as assigned_time, AA.visit_scheduled_time as site_visit_time,
    CASE
    WHEN AA.visit_scheduled_time < CURDATE() THEN DATEDIFF(CURDATE(), AA.visit_scheduled_time)
    ELSE 0
    END AS over_due_date,
    AA.notes as note_for_agent,
    AA.agent_inferences as agent_inferences,
    AA.agent_uploads as agent_uploads,
    CASE
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.PENDING} THEN 'PENDING'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.COMPLETED} THEN 'COMPLETED'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.CANCELLED} THEN 'CANCELLED'
    END as status,
    CONCAT(B.firstname, ' ', B.lastname) as created_by
    FROM ${database}.agent_assignment AA
    LEFT JOIN ${database}.agent A ON A.id = AA.agent_id
    LEFT JOIN ${database}.admin B ON B.id = AA.created_by
    where issue_id = ? and type = ${AGENT_ASSIGNMENT_TYPE.SITE_VISIT} ORDER BY AA.created_at DESC`;
  },
  getSiteVisitUnderIssueWithDetails(database) {
    return `SELECT AA.id as id, I.id as issueId, CONCAT(R.firstname, ' ', R.lastname) as ResidentName ,AA.issue_id as issueId, CONCAT(A.firstname, ' ', A.lastname) as assignee, AA.assigned_time as assignedTime, AA.visit_scheduled_time as siteVisitTime,
    CASE
    WHEN AA.visit_scheduled_time < CURDATE() THEN DATEDIFF(CURDATE(), AA.visit_scheduled_time)
    ELSE 0
    END AS overDueDate,
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
    where issue_id = ? and type = ${AGENT_ASSIGNMENT_TYPE.SITE_VISIT} ORDER BY AA.created_at DESC`;
  },
  getWorkOrderUnderIssue(database) {
    return `SELECT AA.id as id, AA.issue_id as issue_id, CONCAT(A.firstname, ' ', A.lastname) as assignee, AA.assigned_time as assigned_time, AA.visit_scheduled_time as site_visit_time,
    CASE 
    WHEN AA.visit_scheduled_time < CURDATE() THEN DATEDIFF(CURDATE(), AA.visit_scheduled_time)
    ELSE 0
    END AS over_due_date,
    AA.notes as note_for_agent,
    AA.agent_inferences as agent_inferences,
    AA.agent_uploads as agent_uploads,
    CASE
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.PENDING} THEN 'PENDING'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.COMPLETED} THEN 'COMPLETED'
    WHEN AA.status = ${AGENT_ASSIGNMENT_STATUS.CANCELLED} THEN 'CANCELLED'
    END as status,
    CONCAT(B.firstname, ' ', B.lastname) as created_by
    FROM ${database}.agent_assignment AA
    LEFT JOIN ${database}.agent A ON A.id = AA.agent_id
    LEFT JOIN ${database}.admin B ON B.id = AA.created_by
    where issue_id = ? and type = ${AGENT_ASSIGNMENT_TYPE.WORK_ORDER} ORDER BY AA.created_at DESC`;
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
  getActiveAgentAssignment(database) {
    return `SELECT * FROM ${database}.agent_assignment where issue_id = ? AND status = ${AGENT_ASSIGNMENT_STATUS.PENDING} ORDER BY id DESC LIMIT 1`;
  },
  getActiveSiteVisitByIssueID(database) {
    return `SELECT * FROM ${database}.agent_assignment where issue_id = ? AND status = ${AGENT_ASSIGNMENT_STATUS.PENDING} AND type = ${AGENT_ASSIGNMENT_TYPE.SITE_VISIT} LIMIT 1`;
  },
  getActiveWorkOrderByIssueID(database) {
    return `SELECT * FROM ${database}.agent_assignment where issue_id = ? AND status = ${AGENT_ASSIGNMENT_STATUS.PENDING} AND type = ${AGENT_ASSIGNMENT_TYPE.WORK_ORDER} LIMIT 1`;
  },
  updateAgentAssignmentByID(database) {
    return `UPDATE ${database}.agent_assignment SET ? WHERE id = ?`;
  },
  closeIssueByID(database) {
    return `UPDATE ${database}.issue SET status = ${ISSUE_STATUS.CLOSED}, sub_status = ${ISSUE_SUB_STATUS_NUM.CLOSED} WHERE id = ?`;
  },
  hasPendingInvoice(database) {
    return `SELECT * FROM ${database}.issue where id = ? AND sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_SENT}`;
  },
  cancelEstimateByIssueID(database) {
    return `UPDATE ${database}.estimate SET status = ${QUOTATION_STATUS.CANCELLED} WHERE issue_id = ?`;
  },
  getEstimateByIssueID(database) {
    return `SELECT * FROM ${database}.estimate where issue_id = ?`;
  },
  getEstimates(database) {
    return `SELECT E.id, E.issue_id, E.material_charge, E.labour_charge, E.total_charge, E.is_18_percent_gst_applied, E.is_inclusive_tax, E.is_exclusive_tax, E.expiry_date, E.notes, E.filename, E.created_at, E.src,
    CASE
    WHEN E.status = ${QUOTATION_STATUS.DRAFTED} THEN 'drafted'
    WHEN E.status = ${QUOTATION_STATUS.APPROVED} THEN 'approved' 
    WHEN E.status = ${QUOTATION_STATUS.REJECTED} THEN 'rejected'
    WHEN E.status = ${QUOTATION_STATUS.CANCELLED} THEN 'cancelled'
    WHEN E.status = ${QUOTATION_STATUS.SEND} THEN 'sent'
    ELSE 'pending' END as status,
    admin.id as created_by, admin.firstname as created_by_firstname, admin.lastname as created_by_lastname
    FROM ${database}.estimate E
    left join ${database}.admin on E.created_by = admin.id
    where E.issue_id = ? order by E.created_at desc`;
  },
  updateEstimate(database) {
    return `UPDATE ${database}.estimate SET ? WHERE id = ?`;
  },
  getActiveEstimateByIssueID(database) {
    return `SELECT * FROM ${database}.estimate where issue_id = ? AND status = ${QUOTATION_STATUS.SEND} LIMIT 1`;
  },
  getInvoice(database) {
    return `SELECT id, issue_id, material_charge, labour_charge, total_charge, is_18_percent_gst_applied, is_inclusive_tax, is_exclusive_tax, expiry_date, notes, filename, created_at, src, 
    CASE
    WHEN status = ${QUOTATION_STATUS.DRAFTED} THEN 'drafted'
    WHEN status = ${QUOTATION_STATUS.APPROVED} THEN 'approved' 
    WHEN status = ${QUOTATION_STATUS.REJECTED} THEN 'rejected'
    WHEN status = ${QUOTATION_STATUS.CANCELLED} THEN 'cancelled'
    WHEN status = ${QUOTATION_STATUS.SEND} THEN 'sent'
    WHEN status = ${QUOTATION_STATUS.PAID} THEN 'paid'
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
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.OPEN} THEN 'OPEN'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED} THEN 'Agent Assigned'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN 'Site Visit Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT} THEN 'Estimate Drafted'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 'Estimate Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN 'Estimate Rejected'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN 'Estimate Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} THEN 'Work Assigned'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN 'Work Completed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED} THEN 'Invoice Drafted'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.PAID} THEN 'Paid'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ONHOLD} THEN 'On Hold'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.CLOSED} THEN 'Closed'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED} THEN 'Site Visit Cancelled'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED} THEN 'Invoice Approved'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ORDER_CANCELLED} THEN 'Work Order Cancelled'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT} THEN 'Estimate Sent'
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_SENT} THEN 'Invoice Sent'
    ELSE 'Unknown Event' END as event_type,
    CASE
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.ADMIN} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.admin WHERE id = creator_id LIMIT 1)
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.AGENT} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.agent WHERE id = creator_id LIMIT 1)
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.CUSTOMER} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.resident WHERE id = creator_id LIMIT 1) END as name,
    CASE
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.ADMIN} THEN 'Admin'
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.AGENT} THEN 'Agent'
    WHEN creator_type = ${SERVV_USER_TYPE_NUM.CUSTOMER} THEN 'Resident' END as userType,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} OR sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.agent WHERE id = (SELECT agent_id FROM ${database}.agent_assignment WHERE id = entity_id LIMIT 1))
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED} OR sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.agent WHERE id = (SELECT agent_id FROM ${database}.agent_assignment WHERE id = entity_id LIMIT 1))
    END as agentName,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED} THEN (SELECT visit_scheduled_time FROM ${database}.agent_assignment WHERE id = entity_id LIMIT 1)
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} THEN (SELECT visit_scheduled_time FROM ${database}.agent_assignment WHERE id = entity_id LIMIT 1) 
    END as visitTime,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_SENT} THEN (SELECT total_charge FROM ${database}.invoice WHERE id = entity_id LIMIT 1)
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT} THEN (SELECT total_charge FROM ${database}.estimate WHERE id = entity_id LIMIT 1)
    END as totalCharge,
    CASE
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.INVOICE_SENT} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.admin WHERE id = (SELECT created_by FROM ${database}.estimate WHERE id = entity_id LIMIT 1))
    WHEN sub_status = ${ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT} THEN (SELECT CONCAT(firstname, ' ', lastname) FROM ${database}.admin WHERE id = (SELECT created_by FROM ${database}.estimate WHERE id = entity_id LIMIT 1))
    END as createdBy
    FROM ${database}.issue_event where issue_id = ? ORDER BY created_at ASC`;
  },
  getActiveInvoiceByIssueID(database) {
    return `SELECT * FROM ${database}.invoice where issue_id = ? AND status in (${QUOTATION_STATUS.SEND}, ${QUOTATION_STATUS.DRAFTED}) LIMIT 1`;
  },
  updateInvoice(database) {
    return `UPDATE ${database}.invoice SET ? WHERE id = ?`;
  },
  getEstimateByID(database) {
    return `SELECT * FROM ${database}.estimate where id = ?`;
  },
  deleteEstimate(database) {
    return `DELETE FROM ${database}.estimate WHERE id = ?`;
  },
  getResidentFCMTokenByResidentID(database) {
    return `SELECT RI.fcm_token as fcmToken FROM ${database}.resident_identity RI join ${database}.resident R on RI.id = R.identity_id where R.id = ?`;
  }

};