const CONSTANTS = require("../../../lib/constants")

const getIssueReportDetails = (database, startDate, endDate) => {
  const addOnClause = startDate && endDate ? `AND DATE(I.created_at) >= '${startDate}' AND DATE(I.created_at) <= '${endDate}'` : ''
  return `SELECT 
  I.id AS IssueID, 
  CONCAT(R.firstname, ' ', R.lastname) AS ResidentName, 
  P.name AS ProjectName, 
  A.name AS DoorNo, 
  I.initial_activity_time AS InitialActivityTime, 
  I.customer_preferred_time AS CustomerPreferredTime, 
  I.description AS Description, 
  I.created_at AS CreatedAt, 
  SOR.name AS ServiceSubTypeName, 
  S.name AS ServiceName, 
  CONCAT(P.city, ', ', P.district, ', ', P.state, ', ', P.country) AS Location,
  CASE 
    WHEN I.status = ${CONSTANTS.ISSUE_STATUS.OPEN} THEN "Open"
    WHEN I.status = ${CONSTANTS.ISSUE_STATUS.INPROGRESS} THEN "In Progress"
    WHEN I.status = ${CONSTANTS.ISSUE_STATUS.CLOSED} THEN "Closed"
    WHEN I.status = ${CONSTANTS.ISSUE_STATUS.ONHOLD} THEN "On Hold"
    ELSE "N/A"
  END AS CurrentStatus,
  CASE 
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.OPEN} THEN "Open"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED} THEN "Site Visit Assigned"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED} THEN "Site Visit Completed"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED} THEN "Site Visit Cancelled"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT} THEN "Estimate Draft"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT} THEN "Estimate Sent"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED} THEN "Estimate Approved"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED} THEN "Estimate Rejected"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED} THEN "Work Assigned"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_COMPLETED} THEN "Work Completed"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ORDER_CANCELLED} THEN "Work Order Cancelled"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED} THEN "Invoice Drafted"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED} THEN "Invoice Approved"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT} THEN "Invoice Sent"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID} THEN "Paid"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.ONHOLD} THEN "On Hold"
    WHEN I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED} THEN "Closed"
    ELSE "N/A"
  END AS CurrentSubStatus
FROM 
  ${database}.issue I 
LEFT JOIN 
  ${database}.service S ON S.id = I.service_type
LEFT JOIN 
  ${database}.service_organisation_rel SOR ON SOR.id = I.service_subtype
LEFT JOIN 
  ${database}.apartment A ON A.id = I.apartment_id
LEFT JOIN 
  ${database}.project P ON P.id = A.project_id
LEFT JOIN 
  ${database}.resident R ON R.id = I.resident_id
WHERE 
  I.org_id = ?
  AND I.apartment_id IN (?) ${addOnClause};`
}
const getUncreatedIssueReport = (database) => {
  return `SELECT * FROM ${database}.report where org_id = ? AND status = ${CONSTANTS.REPORT_STATUS.PENDING} AND type = ${CONSTANTS.REPORT_LIST.ISSUE_REPORT.VALUE} LIMIT 1;`
}
const getApartmentsUnderProject = (database) => {
  return `SELECT * FROM ${database}.apartment where project_id in (?);`
}
const updateIssueReport = (database) => {
  return `UPDATE ${database}.report SET ? WHERE id = ?;`
}

module.exports = {
  getIssueReportDetails,
  getUncreatedIssueReport,
  getApartmentsUnderProject,
  updateIssueReport
}

