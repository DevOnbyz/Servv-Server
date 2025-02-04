const CONSTANTS = require("../../lib/constants");
const { PAYMENT_STATUS } = require("../../lib/constants");

module.exports = {
  addResident(database) {
    return `INSERT INTO ${database}.resident SET ?`;
  },
  getResidentByPhNumIDAndOrgID(database) {
    return `SELECT * FROM ${database}.resident WHERE identity_id = ? AND org_id = ?`;
  },
  getResidentByNameAndIdentity(database) {
    return `SELECT * FROM ${database}.resident WHERE firstname = ? AND lastname = ? AND email = ? AND identity_id = ?`;
  },
  getResidentIdentityByPhNum(database) {
    return `SELECT * FROM ${database}.resident_identity where ph_num = ?`
  },
  addResidentIdentity(database) {
    return `INSERT INTO ${database}.resident_identity SET ?`
  },
  addApartment(database) {
    return `INSERT INTO ${database}.apartment SET ?`
  },
  getApratmentByProjectAndName(database) {
    return `SELECT * FROM ${database}.apartment WHERE project_id = ? AND name = ?`
  },
  addApartmentResidentRel(database) {
    return `INSERT INTO ${database}.apartment_resident_rel SET ?`
  },
  getActiveApratmentByProjectAndName(database) {
    return `
    SELECT
    a.*,
    p.name as project_name
FROM
    ${database}.apartment a
JOIN
    ${database}.project p ON a.project_id = p.id
WHERE
    a.project_id = ? 
AND
    a.name = ?
AND
    a.status = 1`
  },
  getResidentDataUnderOrg(database) {
    return `
    SELECT
    r.id,
    arr.id AS apartmentResidentRelID,
    i.ph_num,            
    r.email_id,
    r.firstname,
    r.lastname,
    a.id AS apartmentID,
    p.id AS projectID,
    a.name AS doorNo,
    p.name AS projectName,
    p.city AS city, 
    p.district AS district, 
    p.state AS state, 
    p.country AS country
FROM 
    ${database}.resident_identity i
JOIN 
    ${database}.resident r ON i.id = r.identity_id
JOIN 
    ${database}.apartment_resident_rel arr ON r.id = arr.resident_id
JOIN 
    ${database}.apartment a ON arr.apartment_id = a.id
JOIN 
    ${database}.project p ON a.project_id = p.id
WHERE 
    p.org_id = ? AND arr.status = 1 ORDER BY r.created_at DESC;
    `
  },
  getResidentDataByID(database) {
    return `
    SELECT
    r.id,
    arr.id AS apartmentResidentRelID,
    i.ph_num,            
    r.email_id,
    r.firstname,
    r.lastname,
    a.id AS apartmentID,
    p.id AS projectID,
    a.name AS doorNo,
    p.name AS projectName,
    p.city AS city, 
    p.district AS district, 
    p.state AS state, 
    p.country AS country
FROM 
    ${database}.resident_identity i
JOIN 
    ${database}.resident r ON i.id = r.identity_id
JOIN 
    ${database}.apartment_resident_rel arr ON r.id = arr.resident_id
JOIN 
    ${database}.apartment a ON arr.apartment_id = a.id
JOIN 
    ${database}.project p ON a.project_id = p.id
WHERE 
    p.org_id = ? AND arr.status = 1 AND r.id = ?;
    `
  },
  getResidentApartmentRelByID(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel WHERE id = ?`
  },
  getApartmentByID(database) {
    return `SELECT * FROM ${database}.apartment WHERE id = ?`
  },
  getResidentByID(database) {
    return `SELECT * FROM ${database}.resident WHERE id = ?`
  },
  getResidentByIDUnderOrg(database) {
    return `
      SELECT 
      R.id, R.org_id,
      O.id AS organisation_id, O.razorpay_route_account_id
      FROM ${database}.resident R
      INNER JOIN ${database}.organisation O ON R.org_id = O.id
      WHERE R.id = ?;
    `;
  },
  updateApartmentDetails(database) {
    return `UPDATE ${database}.apartment SET ? WHERE id = ?`
  },
  updateResidentDetails(database) {
    return `UPDATE ${database}.resident SET ? WHERE id = ?`
  },
  updateResidentApartmentRel(database) {
    return `UPDATE ${database}.apartment_resident_rel SET ? WHERE id = ?`
  },
  getResidentApartmentRelByResidentID(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel WHERE resident_id = ?`
  },
  getApartmentsByIDs(database) {
    return `SELECT * FROM ${database}.apartment WHERE id in (?)`
  },
  deleteApartmentRelByResidentID(database) {
    return `DELETE FROM ${database}.apartment_resident_rel WHERE resident_id = ? and apartment_id = ?`
  },
  deleteApartmentByApartmentID(database) {
    return `DELETE FROM ${database}.apartment WHERE id = ?`
  },
  getAllResidentApartmentRelDetails(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel where apartment_id in (?)`
  },
  addSupport: (database) => {
    return `INSERT INTO ${database}.support SET ?`
  },
  getRazorpayPaymentByResidentID: (database) => {
    return `SELECT p.total_amount,p.created_at as event_time, o.issue_id, s.name as serviceName
    FROM ${database}.payment p
    JOIN ${database}.order o ON p.order_id = o.id 
    JOIN ${database}.issue i ON o.issue_id = i.id
    JOIN ${database}.service s ON i.service_type = s.id
    WHERE p.org_id = ? AND i.resident_id = ?;`
  },
  getManualPaymentByResidentID: (database) => {
    return `
    SELECT 
    i.total_charge as total_amount,
    i.issue_id,
    s.name AS serviceName,
    ie.event_time AS event_time
    FROM ${database}.invoice i
    JOIN ${database}.issue iss ON i.issue_id = iss.id
    JOIN ${database}.issue_event ie ON ie.issue_id = iss.id
    AND ie.event_time = (
        SELECT MAX(event_time) 
        FROM ${database}.issue_event
        WHERE issue_id = iss.id
    )
    AND ie.sub_status = (
        SELECT sub_status 
        FROM ${database}.issue_event
        WHERE sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID}
        AND issue_id = iss.id
    )
    JOIN ${database}.service s ON iss.service_type = s.id
    WHERE iss.org_id = ? 
    AND i.status = ${CONSTANTS.QUOTATION_STATUS.PAID}
    AND iss.resident_id = ?
`
  },
  getPaymentWithOrderByOrgID: (database) => {
    return `SELECT p.*, o.*
    FROM ${database}.payment p
    JOIN ${database}.order o ON p.order_id = o.id
    WHERE p.org_id = ?`
  }
}
